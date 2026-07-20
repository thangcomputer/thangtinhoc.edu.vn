const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');
const { authenticate, authorize } = require('../middleware/auth');
const {
  MIN_ARTICLE_WORDS,
  TARGET_ARTICLE_WORDS,
  EDITORIAL_STYLE_PROMPT,
  buildExpandStyleNote,
  buildLongFormFallback,
} = require('../lib/articleQuality');
const { COPYWRITER_SYSTEM_PROMPT, BRAND } = require('../lib/copywriterPrompt');

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
          content: `${COPYWRITER_SYSTEM_PROMPT}
Minimum ${MIN_ARTICLE_WORDS} words in content HTML (target 2500–4000). Include 2+ tables, 5–10 FAQ, 5+ internal links, CTA Thắng Tin Học. Hashtag line at end of content.`,
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
  postData.metaDescription = (postData.metaDescription || postData.excerpt || '').substring(0, 155);
  const brandTags = ['MOS', 'IC3', 'hoctinhoc', 'thangcomputer', 'tinhocvanphong'];
  if (!postData.tags?.length) postData.tags = brandTags;
  else {
    const merged = [...new Set([...postData.tags, ...brandTags])];
    postData.tags = merged.slice(0, 8);
  }
  return postData;
}

function buildSEOPrompt(cleanTopic, researchData, googleContext, variantIndex = 0, avoid = []) {
  const year = new Date().getFullYear();
  const variant = getVariantMeta(variantIndex);
  let dataContext = '';
  if (researchData) dataContext += `=== DỮ LIỆU NGHIÊN CỨU ===\n${researchData}\n\n`;
  if (googleContext) dataContext += `=== KẾT QUẢ TÌM KIẾM ===\n${googleContext}\n\n`;

  return `Viết bài CHẤT LƯỢNG CAO, như copywriter thật — không văn AI rỗng.

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

${EDITORIAL_STYLE_PROMPT}

═══ BẮT BUỘC VỀ ĐỘ DÀI & CẤU TRÚC ═══
- Nội dung HTML: TỐI THIỂU ${MIN_ARTICLE_WORDS} từ (không tính thẻ HTML), mục tiêu ${TARGET_ARTICLE_WORDS} từ — CẤM dưới 2500 từ
- Tối thiểu 6 thẻ <h2>, dùng thêm h3/h4; mỗi h2 có ≥2 đoạn <p> trước list/bảng
- metaTitle 55–60 ký tự; metaDescription 140–160 ký tự
- Mở bài hook 180+ từ, nhắc từ khóa tự nhiên (không nhồi)
- FAQ 5–10 câu; Tổng kết; CTA theo chuẩn ${BRAND.name} / ${BRAND.teacher} / UltraViewer / 1 kèm 1
- ≥5 internal link silo (anchor đa dạng); 1–2 <figure> với ALT SEO
- Topic cluster: suggestions[] 5–10 bài + block "Bài viết liên quan nên đọc" trong content
- Cuối content: hashtag (#ThangTinHoc #TinHocVanPhong …)

═══ BẮT BUỘC CÓ BẢNG MINH HỌA (quan trọng) ═══
Phải có ÍT NHẤT 2 bảng <table> với <thead><tr><th>...</th></tr></thead><tbody>...</tbody>:
1) Bảng SO SÁNH (vd: tự học vs 1 kèm 1, Excel vs Google Sheets, online vs offline…)
2) Bảng DỮ LIỆU THAM KHẢO (phím tắt, hàm, checklist, lỗi thường gặp & cách sửa)
Mỗi bảng: tiêu đề <h3> ngay trước bảng, 4-8 dòng dữ liệu CỤ THỂ.

═══ NỘI DUNG PHẢI CÓ ═══
- Ví dụ thực hành / case study / lỗi thường gặp + khắc phục (EEAT)
- Checklist + mẹo (blockquote)
- FAQ: <h2>Câu Hỏi Thường Gặp</h2> + 5–10 cặp <h3>câu hỏi?</h3><p>trả lời</p>
- Entity: Microsoft Office / Word / Excel / PowerPoint / UltraViewer / Zoom khi phù hợp

═══ HTML CHO PHÉP ═══
h2, h3, h4, p, ul, ol, li, strong, em, blockquote, table, thead, tbody, tr, th, td, figure, img, figcaption, a
KHÔNG dùng: h1, div, span class/style tùy tiện, script

═══ OUTPUT ═══
CHỈ trả về JSON hợp lệ (không markdown, không giải thích):
{"title":"...","excerpt":"120-160 ký tự","content":"<h2>...</h2>...đủ ${MIN_ARTICLE_WORDS}+ từ...","focusKeyword":"...","metaTitle":"55-60 ký tự","metaDescription":"140-160 ký tự","tags":["ThangTinHoc","TinHocVanPhong",...],"slug":"slug-khong-dau","suggestions":[{"title":"...","snippet":"..."},{"title":"...","snippet":"..."},{"title":"...","snippet":"..."},{"title":"...","snippet":"..."},{"title":"...","snippet":"..."}]}`;
}

function buildExpandPrompt(cleanTopic, postData) {
  return `Bài viết tiếng Việt về "${cleanTopic}" còn QUÁ NGẮN hoặc THIẾU BẢNG / thiếu đoạn văn dài.
${buildExpandStyleNote()}
Thêm ít nhất 2 bảng <table>. Trả về JSON: title, excerpt, content, focusKeyword, metaTitle, metaDescription, tags, slug, suggestions.

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
  if (words >= MIN_ARTICLE_WORDS && tables) return postData;

  console.log(`  ⚠️ Content thin (${words}/${MIN_ARTICLE_WORDS} words, tables=${tables}) — expanding...`);
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

/** Template dài (~1400+ từ) khi AI không khả dụng */
function generateRichTemplate(topic, variantIndex = 0) {
  const year = new Date().getFullYear();
  const variant = getVariantMeta(variantIndex);
  const slug = makeSlug(topic, variantIndex);
  const content = buildLongFormFallback(topic, variantIndex);
  const title = variantIndex % 4 === 0
    ? `${topic} Có Khó Không? ${variant.titleSuffix} (${year})`
    : `${topic} — ${variant.titleSuffix} (${year})`;

  return {
    title,
    slug,
    excerpt: `${topic} ${year}: ${variant.excerptHint}. Khóa học Thắng Tin Học — học thử miễn phí.`,
    content,
    focusKeyword: topic.toLowerCase(),
    metaTitle: `${topic} — ${variant.titleSuffix}`.substring(0, 60),
    metaDescription: `${topic}: ${variant.excerptHint}. Tư vấn khóa học Thắng Tin Học.`.substring(0, 160),
    tags: [topic, 'MOS', 'IC3', 'hoctinhoc', 'thangcomputer', 'tinhocvanphong'],
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
