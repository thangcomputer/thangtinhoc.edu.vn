const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');
const { authenticate, authorize } = require('../middleware/auth');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const GEMINI_WRITE_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite',
];

function getGenAI() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

// ═══════════════════════════════════════════════════════
// Groq — Llama 3.3 70B (miễn phí)
// ═══════════════════════════════════════════════════════
function callGroqAPI(prompt, temperature = 0.75) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) return reject(new Error('GROQ_API_KEY not configured'));

    const bodyData = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO strategist and senior Vietnamese content writer.
Write like a real expert. Include HTML tables for data comparison and step-by-step guides.
Output ONLY valid JSON when asked — no markdown fences.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: Math.min(0.95, temperature),
      max_tokens: 16000,
    });

    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(bodyData),
      },
      timeout: 120000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(`Groq: ${json.error.message}`));
          const text = json.choices?.[0]?.message?.content || '';
          if (!text) return reject(new Error('Groq: empty response'));
          resolve(text);
        } catch (e) {
          reject(new Error(`Groq parse: ${e.message}`));
        }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Groq: timeout')); });
    req.on('error', (e) => reject(new Error(`Groq network: ${e.message}`)));
    req.write(bodyData);
    req.end();
  });
}

async function fetchGoogleSearch(query) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY?.trim();
  const cx = process.env.GOOGLE_SEARCH_CX?.trim();
  if (!apiKey || !cx) return null;

  return new Promise((resolve) => {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5&hl=vi&gl=vn`;
    https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.items?.length) return resolve(null);
          resolve(json.items.map((i) => ({ title: i.title, snippet: i.snippet, link: i.link })));
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null)).on('timeout', function () { this.destroy(); resolve(null); });
  });
}

function formatSearchContext(results) {
  if (!results?.length) return '';
  return results.map((r, i) => `[Nguồn ${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.link}`).join('\n\n');
}

function parseAIJson(text) {
  let clean = text.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  try { return JSON.parse(clean); } catch { /* continue */ }
  const m = clean.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch { /* continue */ }
  }
  throw new Error('Cannot parse JSON from AI response');
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(html) {
  const t = stripHtml(html);
  return t ? t.split(/\s+/).length : 0;
}

function hasDataTable(html) {
  return /<table[\s>]/i.test(html || '');
}

function makeSlug(title, variantIndex = 0) {
  return title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    .substring(0, 72) + `-v${variantIndex + 1}-` + Date.now().toString().slice(-4);
}

/** Góc nội dung khác nhau cho từng phiên bản (0, 1, 2, 3, ...) */
const VARIANT_ANGLES = [
  {
    titleSuffix: 'Hướng Dẫn Từng Bước & Lộ Trình Học',
    excerptHint: 'lộ trình học theo tuần, bảng so sánh công cụ',
    angle: 'lộ trình từ zero → thành thạo, chia giai đoạn theo tuần',
  },
  {
    titleSuffix: 'Thực Chiến Cho Người Đi Làm',
    excerptHint: 'quy trình văn phòng, case study và checklist báo cáo',
    angle: 'ứng dụng thực tế tại công ty: báo cáo, email, họp, deadline',
  },
  {
    titleSuffix: 'FAQ & So Sánh Công Cụ Chi Tiết',
    excerptHint: 'FAQ sâu, bảng so sánh phần mềm và phương pháp học',
    angle: 'trả lời câu hỏi thường gặp + so sánh công cụ/phương pháp học',
  },
  {
    titleSuffix: 'Mẹo Chuyên Gia & Lỗi Thường Gặp',
    excerptHint: 'phím tắt, mẹo tăng tốc, bảng lỗi hay gặp và cách sửa',
    angle: 'mẹo productivity, sai lầm phổ biến và cách khắc phục nhanh',
  },
];

function getVariantMeta(variantIndex) {
  return VARIANT_ANGLES[variantIndex % VARIANT_ANGLES.length];
}

function buildAvoidBlock(avoid) {
  if (!Array.isArray(avoid) || avoid.length === 0) return '';
  const lines = avoid.slice(0, 6).map((a, i) => {
    const t = String(a.title || '').trim();
    const e = String(a.excerpt || '').trim().slice(0, 120);
    return `${i + 1}. "${t}"${e ? ` — ${e}` : ''}`;
  }).join('\n');
  return `
═══ TRÁNH TRÙNG LẶP (bắt buộc) ═══
Đã có ${avoid.length} phiên bản cho cùng chủ đề. Viết HOÀN TOÀN KHÁC: tiêu đề, các H2/H3, ví dụ, số liệu, nội dung bảng.
Không được lặp lại cấu trúc hay đoạn văn giống các bản sau:
${lines}
`;
}

function aiTemperature(variantIndex) {
  return Math.min(0.92, 0.68 + (variantIndex % 4) * 0.08);
}

function normalizePostData(raw, cleanTopic) {
  const postData = { ...raw };
  if (!Array.isArray(postData.tags)) postData.tags = [];
  if (!Array.isArray(postData.suggestions)) postData.suggestions = [];
  if (!postData.slug) postData.slug = makeSlug(postData.title || cleanTopic);
  postData.focusKeyword = postData.focusKeyword || cleanTopic;
  postData.metaTitle = (postData.metaTitle || postData.title || '').substring(0, 60);
  postData.metaDescription = (postData.metaDescription || postData.excerpt || '').substring(0, 160);
  return postData;
}

function buildSEOPrompt(cleanTopic, researchData, googleContext, variantIndex = 0, avoid = []) {
  const year = new Date().getFullYear();
  const variant = getVariantMeta(variantIndex);
  let dataContext = '';
  if (researchData) dataContext += `=== DỮ LIỆU NGHIÊN CỨU ===\n${researchData}\n\n`;
  if (googleContext) dataContext += `=== KẾT QUẢ TÌM KIẾM ===\n${googleContext}\n\n`;

  return `Bạn là chuyên gia SEO và giảng viên tin học văn phòng tại Thắng Tin Học (Việt Nam).
Viết bài tiếng Việt CHẤT LƯỢNG CAO, như người thật — không văn AI rỗng.

═══ PHIÊN BẢN ${variantIndex + 1} (bắt buộc khác các bản trước) ═══
Góc nhìn chính: ${variant.angle}
Gợi ý tiêu đề: thêm cụm "${variant.titleSuffix}" — KHÔNG dùng y hệt tiêu đề các phiên bản đã liệt kê.
Cấu trúc ưu tiên: ${variant.excerptHint}.
${buildAvoidBlock(avoid)}
═══ CHỦ ĐỀ ═══
Từ khóa chính: "${cleanTopic}"
Năm: ${year}
Đối tượng: nhân viên văn phòng, sinh viên, người mới học

═══ DỮ LIỆU THAM KHẢO ═══
${dataContext || `Dựa trên chuyên môn sâu về "${cleanTopic}".`}

═══ BẮT BUỘC VỀ ĐỘ DÀI & CẤU TRÚC ═══
- Nội dung HTML: TỐI THIỂU 1800 từ (không tính thẻ HTML), tối đa ~2800 từ
- Tối thiểu 6 thẻ <h2>, mỗi h2 có 1-3 <h3> con
- Mở bài hook 100+ từ, nhắc từ khóa trong 2 câu đầu
- Kết bài + CTA đăng ký khóa học tại Thắng Tin Học

═══ BẮT BUỘC CÓ BẢNG MINH HỌA (quan trọng) ═══
Phải có ÍT NHẤT 2 bảng <table> với <thead><tr><th>...</th></tr></thead><tbody>...</tbody>:
1) Bảng SO SÁNH (vd: Excel vs Google Sheets, hoặc các phương pháp/công cụ liên quan chủ đề)
2) Bảng DỮ LIỆU THAM KHẢO (vd: phím tắt, hàm Excel, checklist bước làm, lỗi thường gặp & cách sửa)
Mỗi bảng: tiêu đề <h3> ngay trước bảng, 4-8 dòng dữ liệu CỤ THỂ (số, tên hàm, phím tắt thật).
Thêm 1 bảng tùy chọn nếu phù hợp (lộ trình học theo tuần, bảng giá gói học giả định minh họa).

═══ NỘI DUNG PHẢI CÓ ═══
- Ví dụ thực hành từng bước (numbered list)
- Mẹo pro / lỗi thường gặp (blockquote)
- FAQ: <h2>Câu Hỏi Thường Gặp</h2> + 4 cặp <h3>câu hỏi?</h3><p>trả lời</p>

═══ HTML CHO PHÉP ═══
h2, h3, p, ul, ol, li, strong, em, blockquote, table, thead, tbody, tr, th, td
KHÔNG dùng: h1, div, span, class, style, script

═══ OUTPUT ═══
CHỈ trả về JSON hợp lệ (không markdown, không giải thích):
{"title":"50-70 ký tự","excerpt":"120-160 ký tự","content":"<h2>...</h2>...đủ 1800+ từ và 2+ bảng table...","focusKeyword":"...","metaTitle":"≤60 ký tự","metaDescription":"120-160 ký tự","tags":["tag1","tag2","tag3","tag4","tag5"],"slug":"slug-khong-dau","suggestions":[{"title":"...","snippet":"..."},{"title":"...","snippet":"..."},{"title":"...","snippet":"..."}]}`;
}

function buildExpandPrompt(cleanTopic, postData) {
  return `Bài viết tiếng Việt về "${cleanTopic}" còn QUÁ NGẮN hoặc THIẾU BẢNG.
Hãy MỞ RỘNG nội dung HTML hiện tại lên ít nhất 2000 từ và thêm ít nhất 2 bảng <table> minh họa (so sánh + bảng dữ liệu tham khảo).
Giữ nguyên tone chuyên gia Thắng Tin Học. Trả về JSON cùng format với các field: title, excerpt, content, focusKeyword, metaTitle, metaDescription, tags, slug, suggestions.

Nội dung hiện tại:
${(postData.content || '').substring(0, 12000)}`;
}

async function generateWithGemini(prompt, { jsonMode = true, temperature = 0.75 } = {}) {
  const genAI = getGenAI();
  if (!genAI) return null;

  const generationConfig = {
    temperature: Math.min(0.95, temperature),
    maxOutputTokens: 8192,
    ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
  };

  let lastErr;
  for (const modelName of GEMINI_WRITE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text?.trim()) return { text, model: modelName };
      } catch (err) {
        lastErr = err;
        const msg = err.message || '';
        if (/429|quota|RESOURCE_EXHAUSTED/i.test(msg) && attempt < 2) {
          await sleep(6000 * attempt);
          continue;
        }
        console.error(`  ❌ Gemini ${modelName} attempt ${attempt}: ${msg}`);
        break;
      }
    }
  }
  throw lastErr || new Error('All Gemini models failed');
}

async function researchTopic(cleanTopic) {
  const genAI = getGenAI();
  if (!genAI) return '';

  const researchPrompt = `Tổng hợp kiến thức CHUYÊN SÂU bằng tiếng Việt về: "${cleanTopic}"
Liệt kê bullet chi tiết:
- Khái niệm, lợi ích thực tế
- Công cụ/phần mềm phổ biến ${new Date().getFullYear()}
- Phím tắt, hàm, thao tác cụ thể (nếu là Excel/Word/PPT)
- Số liệu hoặc % minh họa (ước lượng hợp lý nếu không có nguồn)
- Lỗi thường gặp & cách khắc phục
- Xu hướng / best practices
- Gợi ý dữ liệu cho 2 bảng so sánh`;

  // Thử grounding trước (nếu quota cho phép)
  try {
    const groundingModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: [{ googleSearch: {} }],
    });
    const r = await groundingModel.generateContent(researchPrompt);
    const text = r.response.text();
    if (text?.length > 200) {
      console.log(`  ✅ [2] Gemini Grounding: ${text.length} chars`);
      return text;
    }
  } catch (e) {
    console.log(`  ⏭️ [2] Grounding skipped: ${e.message?.slice(0, 80)}`);
  }

  // Fallback: nghiên cứu không grounding (tiết kiệm quota)
  try {
    const simple = await generateWithGemini(researchPrompt, { jsonMode: false });
    if (simple?.text) {
      console.log(`  ✅ [2] Gemini research (no grounding): ${simple.text.length} chars`);
      return simple.text;
    }
  } catch (e) {
    console.error(`  ❌ [2] Gemini research failed: ${e.message}`);
  }
  return '';
}

async function ensureQualityContent(postData, cleanTopic, writerLabel) {
  const words = countWords(postData.content);
  const tables = hasDataTable(postData.content);
  if (words >= 1200 && tables) return postData;

  console.log(`  ⚠️ Content thin (${words} words, tables=${tables}) — expanding...`);
  const expandPrompt = buildExpandPrompt(cleanTopic, postData);

  if (process.env.GROQ_API_KEY?.trim()) {
    try {
      const groqText = await callGroqAPI(expandPrompt);
      const expanded = normalizePostData(parseAIJson(groqText), cleanTopic);
      if (countWords(expanded.content) > words) {
        console.log(`  ✅ Expanded via Groq — ${countWords(expanded.content)} words`);
        return expanded;
      }
    } catch (e) {
      console.error(`  ❌ Expand Groq: ${e.message}`);
    }
  }

  if (getGenAI()) {
    try {
      const g = await generateWithGemini(expandPrompt, { jsonMode: true });
      const expanded = normalizePostData(parseAIJson(g.text), cleanTopic);
      if (countWords(expanded.content) > words) {
        console.log(`  ✅ Expanded via ${g.model} — ${countWords(expanded.content)} words`);
        return expanded;
      }
    } catch (e) {
      console.error(`  ❌ Expand Gemini: ${e.message}`);
    }
  }

  return postData;
}

function buildResponsePayload(postData, cleanTopic, usedSources, startTime, writer, variantIndex = 0) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const words = countWords(postData.content);
  return {
    success: true,
    variantIndex: variantIndex + 1,
    source: usedSources.join('+'),
    elapsed: `${elapsed}s`,
    wordCount: words,
    hasTables: hasDataTable(postData.content),
    sourceInfo: {
      research: usedSources.filter((s) => s !== 'groq'),
      writer,
    },
    data: {
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt || '',
      content: postData.content,
      focusKeyword: postData.focusKeyword,
      metaTitle: postData.metaTitle,
      metaDescription: postData.metaDescription,
      tags: postData.tags,
      suggestions: postData.suggestions,
    },
  };
}

/** Nội dung HTML bài mẫu — mỗi variantIndex một cấu trúc khác */
function buildTemplateContent(topic, variantIndex) {
  const year = new Date().getFullYear();
  const v = variantIndex % 4;

  if (v === 1) {
    return `
<p>Bạn đang đi làm và cần nắm <strong>${topic}</strong> để xử lý công việc hàng ngày? Bài viết này tập trung <strong>thực chiến văn phòng ${year}</strong> — không lan man lý thuyết.</p>

<h2>5 Tình Huống ${topic} Gặp Mỗi Tuần Tại Công Ty</h2>
<ol>
<li>Tổng hợp số liệu cuối tuần gửi sếp trước 17h thứ Sáu</li>
<li>Chuẩn hóa danh sách khách hàng từ nhiều file Excel khác nhau</li>
<li>Làm slide/biểu đồ cho họp team 15 phút</li>
<li>Đối chiếu báo cáo kế toán với số liệu bộ phận</li>
<li>Lưu trữ template email + báo cáo dùng lại hàng tháng</li>
</ol>

<h2>Quy Trình Xử Lý Báo Cáo Trong 45 Phút</h2>
<p>Mở file mẫu → dán dữ liệu mới → kiểm tra định dạng cột → cập nhật công thức tổng → xuất PDF. Ghi chú phiên bản file theo ngày để tránh gửi nhầm bản cũ.</p>

<h3>Bảng checklist trước khi gửi sếp</h3>
<table>
<thead><tr><th>Bước</th><th>Kiểm tra</th><th>Thời gian</th></tr></thead>
<tbody>
<tr><td>1</td><td>Đúng kỳ báo cáo (tuần/tháng)</td><td>2 phút</td></tr>
<tr><td>2</td><td>Tổng cột khớp chi tiết</td><td>5 phút</td></tr>
<tr><td>3</td><td>Biểu đồ đúng đơn vị (triệu, %)</td><td>5 phút</td></tr>
<tr><td>4</td><td>Tên file: BaoCao_2026-03_TenBan</td><td>1 phút</td></tr>
<tr><td>5</td><td>Đính kèm ghi chú thay đổi so với kỳ trước</td><td>10 phút</td></tr>
</tbody>
</table>

<h2>Case Study: Nhân Viên Hành Chính Tăng Tốc 40%</h2>
<p>Sau 3 tuần học có lộ trình tại Thắng Tin Học, học viên rút thời gian làm bảng chấm công từ 2 giờ xuống ~1 giờ nhờ template + phím tắt + bảng tra công thức in sẵn.</p>

<h3>Bảng so sánh: Tự mò vs Có người hướng dẫn</h3>
<table>
<thead><tr><th></th><th>Tự học online</th><th>Khóa có giảng viên</th></tr></thead>
<tbody>
<tr><td>Sửa lỗi trên file thật</td><td>Chậm, dễ bỏ cuộc</td><td>Trực tiếp trên máy học viên</td></tr>
<tr><td>Lịch học</td><td>Linh hoạt</td><td>Ca tối / cuối tuần</td></tr>
<tr><td>Chứng chỉ</td><td>Tùy nền tảng</td><td>Lộ trình MOS/IC3</td></tr>
</tbody>
</table>

<h2>Câu Hỏi Người Đi Làm Hay Hỏi</h2>
<h3>Tôi bận, học buổi tối được không?</h3>
<p>Có — lớp Thắng Tin Học có ca tối và học kèm theo dự án công ty bạn đang làm.</p>
<h3>Công ty dùng Google Sheets, khóa Excel có ích không?</h3>
<p>Có — tư duy dữ liệu và thao tác bảng tính chuyển sang Sheets rất nhanh.</p>

<h2>Kết Luận — Áp Dụng ${topic} Ngay Tuần Sau</h2>
<p>Chọn <strong>một báo cáo bạn đang làm</strong> làm bài tập tuần này. Liên hệ Thắng Tin Học để được gợi ý khóa phù hợp người đi làm.</p>`.trim();
  }

  if (v === 2) {
    return `
<p>Chủ đề <strong>${topic}</strong> có nhiều cách tiếp cận — bài viết này trả lời thẳng các thắc mắc phổ biến và so sánh lựa chọn học/làm việc năm ${year}.</p>

<h2>Câu Hỏi Thường Gặp Về ${topic}</h2>
<h3>${topic} khác gì “biết dùng máy tính”?</h3>
<p>Biết dùng máy là thao tác chung; ${topic} là quy trình xử lý số liệu, văn bản, báo cáo theo chuẩn công việc.</p>
<h3>Nên học Excel trước hay Word trước?</h3>
<p>Ưu tiên Excel nếu công việc nhiều số liệu; Word trước nếu soạn thảo văn bản là chính. Khóa tổng hợp tại Thắng Tin Học gộp cả hai.</p>
<h3>Học bao lâu thì đủ đi làm?</h3>
<p>4–6 tuần (1–2h/ngày) cho nền tảng văn phòng; thành thạo cần thêm thực hành trên file thật.</p>

<h2>So Sánh Hình Thức Học ${topic}</h2>
<table>
<thead><tr><th>Hình thức</th><th>Ưu điểm</th><th>Nhược điểm</th><th>Phù hợp</th></tr></thead>
<tbody>
<tr><td>YouTube miễn phí</td><td>0 đồng, đa dạng</td><td>Dễ lạc đề, không sửa lỗi file bạn</td><td>Tự giác cao</td></tr>
<tr><td>Khóa online có bài tập</td><td>Có lộ trình</td><td>Ít tương tác trực tiếp</td><td>Bận, ở xa</td></tr>
<tr><td>Lớp trực tiếp</td><td>Sửa lỗi ngay</td><td>Cố định lịch</td><td>Người mới cần kèm</td></tr>
<tr><td>1 kèm 1</td><td>Tùy chỉnh 100%</td><td>Chi phí cao hơn</td><td>Leader, trưởng nhóm</td></tr>
</tbody>
</table>

<h2>So Sánh Công Cụ Phần Mềm</h2>
<table>
<thead><tr><th>Nhu cầu</th><th>Gợi ý</th><th>Ghi chú</th></tr></thead>
<tbody>
<tr><td>Báo cáo phức tạp, macro</td><td>Microsoft Excel</td><td>Phổ biến doanh nghiệp</td></tr>
<tr><td>Làm việc nhóm online</td><td>Google Sheets</td><td>Chia sẻ realtime</td></tr>
<tr><td>Soạn hợp đồng, CV</td><td>Microsoft Word</td><td>Định dạng chuẩn</td></tr>
<tr><td>Thuyết trình</td><td>PowerPoint / Canva</td><td>Tùy brand công ty</td></tr>
</tbody>
</table>

<h2>Lộ Trình Gợi Ý Sau Khi Chọn Công Cụ</h2>
<p>Tuần 1–2: thao tác cơ bản. Tuần 3–4: công thức + biểu đồ. Tuần 5+: template báo cáo tái sử dụng.</p>

<h2>Kết Luận</h2>
<p>Chọn hình thức học phù hợp lịch và ngân sách — <strong>Thắng Tin Học</strong> tư vấn miễn phí lộ trình ${topic} cho từng đối tượng.</p>`.trim();
  }

  if (v === 3) {
    return `
<p>Muốn làm nhanh hơn với <strong>${topic}</strong>? Tập hợp <strong>mẹo chuyên gia</strong>, phím tắt và lỗi hay gặp — áp dụng ngay trong ca làm ${year}.</p>

<h2>12 Mẹo Tăng Tốc Khi Làm ${topic}</h2>
<ul>
<li>Dùng template có sẵn thay vì tạo file mới mỗi lần</li>
<li>Đặt tên sheet/tab theo quy ước: Input, Calc, Report</li>
<li>Khóa vùng tham chiếu (F4) khi kéo công thức</li>
<li>Format Painter cho đồng bộ giao diện báo cáo</li>
<li>Tách file nặng: dữ liệu thô / báo cáo tóm tắt</li>
</ul>

<h3>Bảng phím tắt nên nhớ (Excel / bảng tính)</h3>
<table>
<thead><tr><th>Thao tác</th><th>Phím tắt</th><th>Tiết kiệm</th></tr></thead>
<tbody>
<tr><td>Lưu nhanh</td><td>Ctrl + S</td><td>Tránh mất file</td></tr>
<tr><td>Điền xuống</td><td>Ctrl + D</td><td>Nhập liệu lặp</td></tr>
<tr><td>Tìm thay thế</td><td>Ctrl + H</td><td>Sửa hàng loạt</td></tr>
<tr><td>Chọn cột</td><td>Ctrl + Space</td><td>Format nhanh</td></tr>
</tbody>
</table>

<h2>7 Lỗi Thường Gặp & Cách Sửa</h2>
<h3>#VALUE! hoặc #REF!</h3>
<p>Kiểm tra kiểu dữ liệu cột và vùng tham chiếu sau khi xóa dòng/cột.</p>
<h3>Gửi nhầm file cũ</h3>
<p>Đặt tên có ngày; dùng thư mục “Đã gửi”.</p>

<h3>Bảng lỗi theo mức độ nghiêm trọng</h3>
<table>
<thead><tr><th>Lỗi</th><th>Mức</th><th>Xử lý nhanh</th></tr></thead>
<tbody>
<tr><td>Sai tổng do text</td><td>Cao</td><td>Text to Columns / VALUE()</td></tr>
<tr><td>Biểu đồ sai trục</td><td>Trung bình</td><td>Chọn lại range, đơn vị</td></tr>
<tr><td>Link file đứt</td><td>Cao</td><td>Cập nhật đường dẫn nguồn</td></tr>
</tbody>
</table>

<h2>Kết Luận — Thói Quen Pro</h2>
<p>Áp dụng 2–3 mẹo mỗi tuần. Học có hướng dẫn tại <strong>Thắng Tin Học</strong> để sửa đúng file công việc của bạn.</p>`.trim();
  }

  return `
<p><strong>${topic}</strong> là kỹ năng nền tảng năm ${year}. Bài viết này chia <strong>lộ trình học theo tuần</strong>, kèm bảng so sánh và bài tập thực hành.</p>

<h2>${topic} Là Gì? Ai Cần Học Trước?</h2>
<p>Sinh viên sắp thực tập, nhân viên mới vào làm, hoặc người chuyển ngành đều nên học sớm — nhiều JD ghi rõ yêu cầu tin học văn phòng.</p>

<h2>Lộ Trình 4 Tuần (Gợi Ý)</h2>
<h3>Tuần 1 — Làm quen</h3>
<p>Giao diện, lưu file, định dạng cơ bản, 10 phím tắt.</p>
<h3>Tuần 2 — Dữ liệu</h3>
<p>Nhập liệu, lọc, sort, công thức SUM, AVERAGE, IF.</p>
<h3>Tuần 3 — Báo cáo</h3>
<p>Biểu đồ, in ấn, PDF, template báo cáo.</p>
<h3>Tuần 4 — Ôn tập</h3>
<p>Làm 1 dự án tổng hợp 90 phút, checklist tự chấm.</p>

<h3>Bảng lộ trình chi tiết</h3>
<table>
<thead><tr><th>Tuần</th><th>Mục tiêu</th><th>Sản phẩm</th><th>Giờ học</th></tr></thead>
<tbody>
<tr><td>1</td><td>Thao tác cơ bản</td><td>File mẫu định dạng</td><td>3–5h</td></tr>
<tr><td>2</td><td>Công thức</td><td>Bảng tính mini</td><td>4–6h</td></tr>
<tr><td>3</td><td>Trình bày</td><td>1 biểu đồ + báo cáo</td><td>4–6h</td></tr>
<tr><td>4</td><td>Dự án</td><td>Bài tập tổng hợp</td><td>5–8h</td></tr>
</tbody>
</table>

<h3>Bảng so sánh Office vs Google</h3>
<table>
<thead><tr><th>Tiêu chí</th><th>Microsoft Office</th><th>Google Workspace</th></tr></thead>
<tbody>
<tr><td>Học tại Thắng Tin Học</td><td>Có lớp MOS</td><td>Có module Sheets</td></tr>
<tr><td>Offline</td><td>Mạnh</td><td>Hạn chế</td></tr>
<tr><td>Cộng tác online</td><td>Teams/OneDrive</td><td>Drive realtime</td></tr>
</tbody>
</table>

<h2>Kết Luận — Bắt Đầu Tuần Này</h2>
<p>Đăng ký học thử tại <strong>Thắng Tin Học</strong> để được chẩn đoán trình độ và nhận lộ trình ${topic} cá nhân hóa.</p>`.trim();
}

/** Template phong phú khi AI không khả dụng — mỗi variant khác nội dung */
function generateRichTemplate(topic, variantIndex = 0) {
  const year = new Date().getFullYear();
  const variant = getVariantMeta(variantIndex);
  const slug = makeSlug(topic, variantIndex);
  const content = buildTemplateContent(topic, variantIndex);

  return {
    title: `${topic} — ${variant.titleSuffix} (${year})`,
    slug,
    excerpt: `${topic} ${year}: ${variant.excerptHint}. Khóa học Thắng Tin Học — học thử miễn phí.`,
    content,
    focusKeyword: topic.toLowerCase(),
    metaTitle: `${topic} — ${variant.titleSuffix}`.substring(0, 60),
    metaDescription: `${topic}: ${variant.excerptHint}. Tư vấn khóa học Thắng Tin Học.`.substring(0, 160),
    tags: [topic, 'tin học văn phòng', variant.titleSuffix.split(' ')[0].toLowerCase(), 'thắng tin học', String(year)],
    suggestions: [],
    variantIndex,
  };
}

// ═══════════════════════════════════════════════════════
// POST /api/ai/generate-post
// ═══════════════════════════════════════════════════════
router.post('/generate-post', authenticate, authorize('admin'), async (req, res) => {
  const { topic, variantIndex: rawVariant, avoid: rawAvoid } = req.body;
  if (!topic || topic.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập chủ đề (ít nhất 3 ký tự)' });
  }

  const cleanTopic = topic.trim();
  const variantIndex = Math.max(0, parseInt(rawVariant, 10) || 0);
  const avoid = Array.isArray(rawAvoid)
    ? rawAvoid.filter((a) => a && (a.title || a.excerpt)).slice(0, 6)
    : [];
  const temp = aiTemperature(variantIndex);
  const usedSources = [];
  const startTime = Date.now();
  const hasGemini = !!process.env.GEMINI_API_KEY?.trim();
  const hasGroq = !!process.env.GROQ_API_KEY?.trim();

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🚀 AI Generate: "${cleanTopic}" v${variantIndex + 1} (gemini=${hasGemini}, groq=${hasGroq})`);
  console.log(`${'═'.repeat(50)}`);

  if (!hasGemini && !hasGroq) {
    const template = generateRichTemplate(cleanTopic, variantIndex);
    return res.status(503).json({
      success: false,
      source: 'no-api-key',
      message: 'Chưa cấu hình GEMINI_API_KEY hoặc GROQ_API_KEY trong server/.env. Lấy key miễn phí: aistudio.google.com và console.groq.com',
      data: template,
      wordCount: countWords(template.content),
      hasTables: true,
    });
  }

  let googleResults = null;
  let googleContext = '';
  try {
    googleResults = await fetchGoogleSearch(cleanTopic);
    googleContext = formatSearchContext(googleResults);
    if (googleContext) {
      usedSources.push('google-search');
      console.log(`  ✅ [1] Google Search: ${googleResults.length} results`);
    }
  } catch (e) {
    console.log(`  ⏭️ [1] Google Search: ${e.message}`);
  }

  let researchData = '';
  if (hasGemini) {
    researchData = await researchTopic(cleanTopic);
    if (researchData) usedSources.push('gemini-research');
  }

  if (!researchData && !googleContext) {
    researchData = `Chủ đề: "${cleanTopic}". Viết dựa trên chuyên môn sâu, có ví dụ Việt Nam.`;
  }

  const seoPrompt = buildSEOPrompt(cleanTopic, researchData, googleContext, variantIndex, avoid);

  // Groq viết bài (ưu tiên — free tier rộng)
  if (hasGroq) {
    try {
      console.log(`  📝 [3A] Groq: writing (v${variantIndex + 1}, T=${temp})...`);
      const groqText = await callGroqAPI(seoPrompt, temp);
      let postData = normalizePostData(parseAIJson(groqText), cleanTopic);
      usedSources.push('groq');
      postData = await ensureQualityContent(postData, cleanTopic, 'Groq');
      console.log(`  ✅ [3A] Groq OK — ${countWords(postData.content)} words, tables=${hasDataTable(postData.content)}`);
      return res.json(buildResponsePayload(postData, cleanTopic, usedSources, startTime, 'Groq Llama 3.3 70B', variantIndex));
    } catch (e) {
      console.error(`  ❌ [3A] Groq: ${e.message}`);
    }
  }

  // Gemini viết bài — thử nhiều model
  if (hasGemini) {
    try {
      console.log(`  📝 [3B] Gemini: writing (v${variantIndex + 1}, T=${temp})...`);
      const g = await generateWithGemini(seoPrompt, { jsonMode: true, temperature: temp });
      let postData = normalizePostData(parseAIJson(g.text), cleanTopic);
      if (!usedSources.includes('gemini')) usedSources.push('gemini');
      postData = await ensureQualityContent(postData, cleanTopic, g.model);
      console.log(`  ✅ [3B] ${g.model} OK — ${countWords(postData.content)} words`);
      return res.json(buildResponsePayload(postData, cleanTopic, usedSources, startTime, g.model, variantIndex));
    } catch (e) {
      console.error(`  ❌ [3B] Gemini write: ${e.message}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ⚠️ AI failed — rich template (${elapsed}s)`);
  const template = generateRichTemplate(cleanTopic, variantIndex);

  return res.json({
    success: true,
    source: 'template',
    variantIndex,
    elapsed: `${elapsed}s`,
    wordCount: countWords(template.content),
    hasTables: true,
    message: 'AI tạm quá tải hoặc hết quota. Đã dùng bài mẫu đầy đủ (có bảng). Thử lại sau 1–2 phút hoặc thêm GROQ_API_KEY.',
    data: template,
  });
});

router.get('/search-info', authenticate, authorize('admin'), (req, res) => {
  res.json({
    engines: {
      gemini: {
        active: !!process.env.GEMINI_API_KEY?.trim(),
        role: 'Nghiên cứu + viết bài (nhiều model fallback)',
        models: GEMINI_WRITE_MODELS,
        free: 'https://aistudio.google.com/apikey',
      },
      groq: {
        active: !!process.env.GROQ_API_KEY?.trim(),
        role: 'Viết bài SEO (ưu tiên, 16k tokens)',
        model: 'llama-3.3-70b-versatile',
        free: 'https://console.groq.com/keys',
      },
      googleSearch: {
        active: !!(process.env.GOOGLE_SEARCH_API_KEY?.trim() && process.env.GOOGLE_SEARCH_CX?.trim()),
        role: 'Dữ liệu tìm kiếm bổ sung (tùy chọn)',
      },
    },
    requirements: {
      minWords: 1800,
      minTables: 2,
      note: 'Không giới hạn số lần tạo bài phía server — chỉ phụ thuộc quota miễn phí của Groq/Gemini',
    },
  });
});

module.exports = router;
