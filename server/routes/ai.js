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
function callGroqAPI(prompt) {
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
      temperature: 0.75,
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

function makeSlug(title) {
  return title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    .substring(0, 80) + '-' + Date.now().toString().slice(-4);
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

function buildSEOPrompt(cleanTopic, researchData, googleContext) {
  const year = new Date().getFullYear();
  let dataContext = '';
  if (researchData) dataContext += `=== DỮ LIỆU NGHIÊN CỨU ===\n${researchData}\n\n`;
  if (googleContext) dataContext += `=== KẾT QUẢ TÌM KIẾM ===\n${googleContext}\n\n`;

  return `Bạn là chuyên gia SEO và giảng viên tin học văn phòng tại Thắng Tin Học (Việt Nam).
Viết bài tiếng Việt CHẤT LƯỢNG CAO, như người thật — không văn AI rỗng.

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

async function generateWithGemini(prompt, { jsonMode = true } = {}) {
  const genAI = getGenAI();
  if (!genAI) return null;

  const generationConfig = {
    temperature: 0.75,
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

function buildResponsePayload(postData, cleanTopic, usedSources, startTime, writer) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const words = countWords(postData.content);
  return {
    success: true,
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

/** Template phong phú khi AI không khả dụng — vẫn có bảng & đủ section */
function generateRichTemplate(topic) {
  const year = new Date().getFullYear();
  const slug = makeSlug(topic);
  const content = `
<p><strong>${topic}</strong> là kỹ năng không thể thiếu trong môi trường làm việc hiện đại. Bài viết này tổng hợp lộ trình, ví dụ thực hành và bảng tra cứu nhanh giúp bạn áp dụng ngay — phù hợp cho người mới và người đi làm muốn nâng cấp kỹ năng ${year}.</p>

<h2>${topic} Là Gì? Vì Sao Nên Học Ngay?</h2>
<p>Nhiều doanh nghiệp đánh giá năng lực ${topic} ngay từ vòng phỏng vấn. Khi nắm vững nền tảng, bạn xử lý báo cáo, biểu đồ và tài liệu nhanh hơn <strong>30–50%</strong> so với thao tác thủ công lặp lại.</p>
<ul>
<li>Tiết kiệm thời gian xử lý dữ liệu hàng ngày</li>
<li>Giảm sai sót nhờ quy trình và công thức chuẩn</li>
<li>Tăng giá trị cá nhân khi làm việc nhóm hoặc báo cáo cấp trên</li>
</ul>

<h2>Lộ Trình Học ${topic} Từ Cơ Bản Đến Nâng Cao</h2>
<h3>Giai đoạn 1: Làm quen giao diện (tuần 1)</h3>
<p>Tập trung thao tác mở file, lưu, định dạng văn bản/cell, và các phím tắt cơ bản. Mỗi ngày 30 phút thực hành với 1 file mẫu.</p>
<h3>Giai đoạn 2: Kỹ năng xử lý dữ liệu (tuần 2–3)</h3>
<p>Học lọc, sắp xếp, công thức thường dùng, biểu đồ minh họa. Tạo 1 báo cáo hoàn chỉnh từ dữ liệu thật của công việc hoặc học tập.</p>
<h3>Giai đoạn 3: Tối ưu & ứng dụng nâng cao (tuần 4+)</h3>
<p>Pivot, kiểm tra dữ liệu, mẫu báo cáo tự động, thao tác chuyên nghiệp theo chuẩn doanh nghiệp.</p>

<h3>Bảng so sánh công cụ phổ biến</h3>
<table>
<thead><tr><th>Tiêu chí</th><th>Microsoft Office</th><th>Google Workspace</th><th>Ghi chú</th></tr></thead>
<tbody>
<tr><td>Phù hợp</td><td>Doanh nghiệp, báo cáo phức tạp</td><td>Làm việc nhóm online</td><td>Có thể kết hợp cả hai</td></tr>
<tr><td>Điểm mạnh</td><td>Công thức, macro, biểu đồ nâng cao</td><td>Chia sẻ realtime, cloud</td><td>Chọn theo quy trình công ty</td></tr>
<tr><td>Học tập</td><td>Khóa MOS/IC3 tại trung tâm</td><td>Tự học + dự án nhóm</td><td>Thắng Tin Học hỗ trợ cả hai</td></tr>
<tr><td>Thời gian làm chủ cơ bản</td><td>2–4 tuần</td><td>1–3 tuần</td><td>1–2 giờ/ngày thực hành</td></tr>
</tbody>
</table>

<h2>Ví Dụ Thực Hành: Quy Trình 5 Bước</h2>
<ol>
<li><strong>Thu thập dữ liệu</strong> — xác định nguồn, định dạng file đầu vào</li>
<li><strong>Làm sạch</strong> — loại trùng, chuẩn hóa ngày tháng, text</li>
<li><strong>Phân tích</strong> — dùng công thức/biểu đồ phù hợp mục tiêu</li>
<li><strong>Trình bày</strong> — bảng tóm tắt, highlight số liệu quan trọng</li>
<li><strong>Kiểm tra</strong> — đối chiếu với yêu cầu trước khi gửi</li>
</ol>

<h3>Bảng checklist & lỗi thường gặp</h3>
<table>
<thead><tr><th>Hạng mục</th><th>Kiểm tra</th><th>Lỗi hay gặp</th><th>Cách xử lý</th></tr></thead>
<tbody>
<tr><td>Dữ liệu đầu vào</td><td>Đúng định dạng cột</td><td>Nhầm text/number</td><td>Format cells, Data Validation</td></tr>
<tr><td>Công thức</td><td>Không #REF!, #VALUE!</td><td>Sai vùng tham chiếu</td><td>Dùng F4 khóa tham chiếu</td></tr>
<tr><td>Báo cáo</td><td>Tiêu đề, đơn vị rõ ràng</td><td>Biểu đồ gây hiểu nhầm</td><td>Chọn đúng loại chart</td></tr>
<tr><td>File lưu</td><td>Version, backup</td><td>Mất dữ liệu</td><td>AutoSave + bản sao định kỳ</td></tr>
<tr><td>Bảo mật</td><td>Phân quyền xem/sửa</td><td>Chia sẻ link công khai</td><td>Chỉ cấp quyền cần thiết</td></tr>
</tbody>
</table>

<blockquote><strong>Mẹo từ giảng viên Thắng Tin Học:</strong> Học theo dự án thật (bảng lương, báo cáo bán hàng, danh sách học viên) giúp nhớ lâu hơn xem video lý thuyết thuần túy.</blockquote>

<h2>Câu Hỏi Thường Gặp</h2>
<h3>Mất bao lâu để học được ${topic}?</h3>
<p>Với 1–2 giờ/ngày, phần lớn học viên làm chủ cơ bản trong 3–4 tuần; nâng cao cần thêm 4–8 tuần thực hành có hướng dẫn.</p>
<h3>Có cần cài phần mềm bản quyền không?</h3>
<p>Có thể bắt đầu với bản dùng thử hoặc công cụ online; trung tâm tư vấn gói phù hợp ngân sách học viên.</p>
<h3>Học online hay offline tốt hơn?</h3>
<p>Online linh hoạt, có bài tập và hỏi đáp; offline phù hợp nếu cần sửa lỗi trực tiếp ngay trên máy.</p>
<h3>Có chứng chỉ MOS/IC3 không?</h3>
<p>Thắng Tin Học có lộ trình luyện thi chứng chỉ quốc tế song song với kỹ năng thực tế công việc.</p>

<h2>Kết Luận — Bắt Đầu Hành Trình ${topic}</h2>
<p>Đầu tư thời gian cho <strong>${topic}</strong> hôm nay sẽ tạo lợi thế rõ rệt trong công việc. Liên hệ <strong>Thắng Tin Học</strong> để được tư vấn khóa học phù hợp trình độ, lịch học linh hoạt và lộ trình luyện thi chứng chỉ nếu bạn cần.</p>
<p>Bắt đầu từ một bài tập thực tế nhỏ mỗi ngày — sau 3–4 tuần bạn sẽ thấy tiến bộ rõ ràng trong tốc độ xử lý số liệu và chất lượng báo cáo.</p>
`.trim();

  return {
    title: `${topic} — Hướng Dẫn Chi Tiết & Bảng Tra Cứu (${year})`,
    slug,
    excerpt: `Hướng dẫn ${topic} ${year}: lộ trình học, bảng so sánh công cụ, checklist thực hành và FAQ. Áp dụng ngay cho công việc văn phòng.`,
    content,
    focusKeyword: topic.toLowerCase(),
    metaTitle: `${topic} — Hướng Dẫn ${year}`.substring(0, 60),
    metaDescription: `Học ${topic} từ cơ bản: bảng so sánh, checklist, ví dụ thực tế. Khóa học Thắng Tin Học.`.substring(0, 160),
    tags: [topic, 'tin học văn phòng', 'hướng dẫn', 'thắng tin học', String(year)],
    suggestions: [],
  };
}

// ═══════════════════════════════════════════════════════
// POST /api/ai/generate-post
// ═══════════════════════════════════════════════════════
router.post('/generate-post', authenticate, authorize('admin'), async (req, res) => {
  const { topic } = req.body;
  if (!topic || topic.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập chủ đề (ít nhất 3 ký tự)' });
  }

  const cleanTopic = topic.trim();
  const usedSources = [];
  const startTime = Date.now();
  const hasGemini = !!process.env.GEMINI_API_KEY?.trim();
  const hasGroq = !!process.env.GROQ_API_KEY?.trim();

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🚀 AI Generate: "${cleanTopic}" (gemini=${hasGemini}, groq=${hasGroq})`);
  console.log(`${'═'.repeat(50)}`);

  if (!hasGemini && !hasGroq) {
    const template = generateRichTemplate(cleanTopic);
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

  const seoPrompt = buildSEOPrompt(cleanTopic, researchData, googleContext);

  // Groq viết bài (ưu tiên — free tier rộng)
  if (hasGroq) {
    try {
      console.log('  📝 [3A] Groq: writing...');
      const groqText = await callGroqAPI(seoPrompt);
      let postData = normalizePostData(parseAIJson(groqText), cleanTopic);
      usedSources.push('groq');
      postData = await ensureQualityContent(postData, cleanTopic, 'Groq');
      console.log(`  ✅ [3A] Groq OK — ${countWords(postData.content)} words, tables=${hasDataTable(postData.content)}`);
      return res.json(buildResponsePayload(postData, cleanTopic, usedSources, startTime, 'Groq Llama 3.3 70B'));
    } catch (e) {
      console.error(`  ❌ [3A] Groq: ${e.message}`);
    }
  }

  // Gemini viết bài — thử nhiều model
  if (hasGemini) {
    try {
      console.log('  📝 [3B] Gemini: writing...');
      const g = await generateWithGemini(seoPrompt, { jsonMode: true });
      let postData = normalizePostData(parseAIJson(g.text), cleanTopic);
      if (!usedSources.includes('gemini')) usedSources.push('gemini');
      postData = await ensureQualityContent(postData, cleanTopic, g.model);
      console.log(`  ✅ [3B] ${g.model} OK — ${countWords(postData.content)} words`);
      return res.json(buildResponsePayload(postData, cleanTopic, usedSources, startTime, g.model));
    } catch (e) {
      console.error(`  ❌ [3B] Gemini write: ${e.message}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ⚠️ AI failed — rich template (${elapsed}s)`);
  const template = generateRichTemplate(cleanTopic);

  return res.json({
    success: true,
    source: 'template',
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
