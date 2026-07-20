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

function httpsGetJson(url, timeoutMs = 12000) {
  return new Promise((resolve) => {
    https.get(url, { timeout: timeoutMs, headers: { 'User-Agent': 'ThangTinHocBot/1.0' } }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null)).on('timeout', function () { this.destroy(); resolve(null); });
  });
}

async function fetchGoogleSearchOnce(query, num = 6) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY?.trim();
  const cx = process.env.GOOGLE_SEARCH_CX?.trim();
  if (!apiKey || !cx) return [];

  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=${num}&hl=vi&gl=vn`;
  const json = await httpsGetJson(url);
  if (!json?.items?.length) return [];
  return json.items.map((i) => ({
    title: i.title,
    snippet: i.snippet || '',
    link: i.link,
    engine: 'google-cse',
  }));
}

/** Nhiều truy vấn Google CSE → gộp, bỏ trùng URL */
async function fetchGoogleSearch(topic) {
  const year = new Date().getFullYear();
  const queries = [
    topic,
    `${topic} hướng dẫn`,
    `${topic} FAQ`,
    `${topic} ${year}`,
  ];
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY?.trim();
  const cx = process.env.GOOGLE_SEARCH_CX?.trim();
  if (!apiKey || !cx) return null;

  const batches = await Promise.all(queries.map((q) => fetchGoogleSearchOnce(q, 5)));
  const seen = new Set();
  const merged = [];
  for (const batch of batches) {
    for (const item of batch) {
      const key = (item.link || item.title || '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
      if (merged.length >= 12) break;
    }
    if (merged.length >= 12) break;
  }
  return merged.length ? merged : null;
}

/** Nguồn miễn phí: Wikipedia VI + DuckDuckGo Instant Answer */
async function fetchFreeWebResearch(topic) {
  const results = [];
  const year = new Date().getFullYear();

  try {
    const wikiUrl = `https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=4&format=json&origin=*`;
    const wiki = await httpsGetJson(wikiUrl);
    const hits = wiki?.query?.search || [];
    for (const h of hits) {
      const title = h.title;
      const summaryUrl = `https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const sum = await httpsGetJson(summaryUrl);
      if (sum?.extract) {
        results.push({
          title: `Wikipedia: ${sum.title || title}`,
          snippet: String(sum.extract).slice(0, 500),
          link: sum.content_urls?.desktop?.page || `https://vi.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
          engine: 'wikipedia',
        });
      }
    }
  } catch { /* ignore */ }

  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(topic)}&format=json&no_html=1&skip_disambig=1`;
    const ddg = await httpsGetJson(ddgUrl);
    if (ddg?.AbstractText) {
      results.push({
        title: ddg.Heading || `DuckDuckGo: ${topic}`,
        snippet: String(ddg.AbstractText).slice(0, 500),
        link: ddg.AbstractURL || ddg.AbstractSource || '',
        engine: 'duckduckgo',
      });
    }
    const related = Array.isArray(ddg?.RelatedTopics) ? ddg.RelatedTopics : [];
    for (const rt of related.slice(0, 5)) {
      if (rt?.Text && rt?.FirstURL) {
        results.push({
          title: String(rt.Text).slice(0, 80),
          snippet: String(rt.Text).slice(0, 400),
          link: rt.FirstURL,
          engine: 'duckduckgo',
        });
      }
      if (Array.isArray(rt?.Topics)) {
        for (const t of rt.Topics.slice(0, 2)) {
          if (t?.Text && t?.FirstURL) {
            results.push({
              title: String(t.Text).slice(0, 80),
              snippet: String(t.Text).slice(0, 400),
              link: t.FirstURL,
              engine: 'duckduckgo',
            });
          }
        }
      }
    }
  } catch { /* ignore */ }

  // Gợi ý entity Microsoft Learn khi chủ đề văn phòng
  const officeHint = /excel|word|powerpoint|office|mos|tin học|máy tính/i.test(topic);
  if (officeHint) {
    results.push({
      title: 'Microsoft Support / Learn (tham khảo chính thức)',
      snippet: `Tài liệu chính thức Microsoft về Office / Windows — dùng để đối chiếu thao tác, phím tắt, phiên bản ${year}. Không sao chép nguyên văn; diễn giải bằng tiếng Việt dễ hiểu.`,
      link: 'https://support.microsoft.com/',
      engine: 'official',
    });
  }

  return results.length ? results : null;
}

function formatSearchContext(results) {
  if (!results?.length) return '';
  return results.map((r, i) => {
    const eng = r.engine ? ` (${r.engine})` : '';
    return `[Nguồn ${i + 1}]${eng} ${r.title}\n${r.snippet}\nURL: ${r.link || '(không có URL)'}`;
  }).join('\n\n');
}

/** Gộp Google CSE + nguồn miễn phí, bỏ trùng */
function mergeSearchResults(...lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    if (!list?.length) continue;
    for (const item of list) {
      const key = (item.link || item.title || '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= 16) return out;
    }
  }
  return out;
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

/** Góc nội dung khác nhau — tránh cùng một khung tiêu đề SEO */
const VARIANT_ANGLES = [
  {
    titleSuffix: 'Cách Học Hiệu Quả Từ Thực Tế',
    excerptHint: 'tình huống thật, lộ trình linh hoạt, ví dụ file công việc',
    angle: 'kể như giáo viên hướng dẫn học viên mới: tình huống → giải thích → thực hành → lỗi hay gặp',
  },
  {
    titleSuffix: 'Áp Dụng Ngay Tại Công Việc',
    excerptHint: 'quy trình văn phòng, checklist gửi sếp, case study',
    angle: 'góc người đi làm: deadline, báo cáo, họp — thao tác cụ thể trên Word/Excel/PPT',
  },
  {
    titleSuffix: 'Giải Đáp Thắc Mắc Hay Gặp',
    excerptHint: 'FAQ sâu, so sánh phương pháp, nguồn tham khảo',
    angle: 'trả lời đúng câu hỏi người search Google — ngắn, rõ, có ví dụ',
  },
  {
    titleSuffix: 'Mẹo Tăng Tốc & Tránh Sai Lầm',
    excerptHint: 'phím tắt, mẹo, bảng lỗi thường gặp',
    angle: 'mẹo chuyên gia + sai lầm phổ biến — mỗi mẹo kèm cách làm ngay',
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
  if (researchData) dataContext += `=== NGHIÊN CỨU (Gemini / grounding) ===\n${researchData}\n\n`;
  if (googleContext) dataContext += `=== NGUỒN MẠNG (bắt buộc dùng) ===\n${googleContext}\n\n`;

  const hasSources = !!(researchData || googleContext);

  return `Viết bài như GIÁO VIÊN THẬT đang soạn giáo án + bài blog — không viết "bài SEO khuôn".

═══ PHIÊN BẢN ${variantIndex + 1} ═══
Góc nhìn: ${variant.angle}
Tiêu đề: tự nhiên, hấp dẫn, có thể gợi ý cụm "${variant.titleSuffix}" nhưng ĐƯỢC phép viết khác nếu hay hơn.
${buildAvoidBlock(avoid)}
═══ CHỦ ĐỀ ═══
Từ khóa: "${cleanTopic}" | Năm: ${year}
Đối tượng: người Việt — văn phòng, sinh viên, người mới / mất gốc.

═══ NGUỒN THAM KHẢO ═══
${dataContext || `Không có snippet web. Viết từ chuyên môn Tin học văn phòng Việt Nam; KHÔNG bịa số liệu/%/"nghiên cứu".`}

${hasSources ? `QUY TẮC NGUỒN (quan trọng):
- Chọn 4–10 ý từ nguồn trên, DIỄN GIẢI lại tiếng Việt dễ hiểu — không copy nguyên văn.
- Không bịa URL / số liệu không có trong nguồn.
- Thêm mục <h2>Nguồn tham khảo</h2> với 3–8 link thật từ danh sách URL ở trên.
- Nếu nguồn mâu thuẫn nhau, ưu tiên Microsoft / Wikipedia / trang chính thức.
` : ''}

${EDITORIAL_STYLE_PROMPT}

═══ YÊU CẦU LINH HOẠT ═══
- Độ dài mục tiêu ${TARGET_ARTICLE_WORDS} từ (không đệm chữ vô nghĩa).
- 4–8 <h2> theo logic chủ đề — CẤM dùng cùng khung H2 cho mọi bài.
- Ít nhất 1 bảng <table> hữu ích (so sánh / lộ trình / checklist / phím tắt).
- FAQ 4–8 câu; kết + CTA mềm ${BRAND.name}.
- 3–6 internal link; hashtag ngắn cuối bài.
- CẤM mở bài bằng: "Trong kỷ nguyên số", "Bài viết này sẽ", "Dưới đây là", "Không thể phủ nhận".

═══ HTML ═══
h2,h3,h4,p,ul,ol,li,strong,em,blockquote,table,thead,tbody,tr,th,td,figure,img,figcaption,a
KHÔNG: h1, script, style tùy tiện

═══ OUTPUT — CHỈ JSON ═══
{"title":"...","excerpt":"120-160 ký tự","content":"<p>...</p>...","focusKeyword":"...","metaTitle":"55-60 ký tự","metaDescription":"140-160 ký tự","tags":["..."],"slug":"slug-khong-dau","suggestions":[{"title":"...","snippet":"..."}]}`;
}

function buildExpandPrompt(cleanTopic, postData) {
  return `Bài viết tiếng Việt về "${cleanTopic}" còn QUÁ NGẮN hoặc THIẾU BẢNG / thiếu đoạn văn dài.
${buildExpandStyleNote()}
Thêm bảng <table> hữu ích nếu thiếu, ví dụ thực tế, FAQ — không đệm chữ sáo. Trả về JSON: title, excerpt, content, focusKeyword, metaTitle, metaDescription, tags, slug, suggestions.

Nội dung hiện tại:
${(postData.content || '').substring(0, 12000)}`;
}

async function generateWithGemini(prompt, { jsonMode = true, temperature = 0.75, systemHint = true } = {}) {
  const genAI = getGenAI();
  if (!genAI) return null;

  const fullPrompt = systemHint
    ? `${COPYWRITER_SYSTEM_PROMPT}\n\nTarget ~${TARGET_ARTICLE_WORDS} Vietnamese words (min ~${MIN_ARTICLE_WORDS}). 1+ useful table, 4–8 FAQ, soft CTA. No SEO-template filler.\n\n${prompt}`
    : prompt;

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
        const result = await model.generateContent(fullPrompt);
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

async function researchTopic(cleanTopic, webContext = '') {
  const genAI = getGenAI();
  if (!genAI) return '';

  const year = new Date().getFullYear();
  const researchPrompt = `Bạn là trợ lý nghiên cứu nội dung giáo dục Tin học văn phòng (Việt Nam, ${year}).

Chủ đề: "${cleanTopic}"

${webContext ? `Snippet web đã thu thập (dùng làm nền, kiểm chứng bằng Google Search nếu có):\n${webContext.slice(0, 6000)}\n` : ''}

Hãy tổng hợp TIẾNG VIỆT, dạng bullet, CHỈ gồm ý kiểm chứng được:
1) Khái niệm ngắn + đối tượng phù hợp
2) Thao tác / công cụ / phiên bản phổ biến ${year}
3) 5–8 lỗi học viên hay gặp + cách sửa cụ thể
4) 4–6 câu hỏi People Also Ask
5) Gợi ý 1 bảng so sánh hoặc checklist (cột rõ ràng)
6) Liệt kê URL/tên nguồn nếu bạn lấy từ web (không bịa)

CẤM: văn sáo, "trong kỷ nguyên số", bịa %, bịa nghiên cứu không nguồn.
Viết cô đọng, đủ để copywriter viết bài dài.`;

  // Grounding trước — lấy kiến thức mạng thật
  try {
    const groundingModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: [{ googleSearch: {} }],
    });
    const r = await groundingModel.generateContent(researchPrompt);
    const text = r.response.text();
    if (text?.length > 200) {
      console.log(`  ✅ [2] Gemini Grounding research: ${text.length} chars`);
      return text;
    }
  } catch (e) {
    console.log(`  ⏭️ [2] Grounding skipped: ${e.message?.slice(0, 80)}`);
  }

  try {
    const simple = await generateWithGemini(researchPrompt, { jsonMode: false, temperature: 0.4, systemHint: false });
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
  // Chỉ expand khi quá ngắn; thiếu bảng vẫn chấp nhận nếu đủ dài + có nguồn
  if (words >= MIN_ARTICLE_WORDS) return postData;
  if (words >= Math.floor(MIN_ARTICLE_WORDS * 0.85) && tables) return postData;

  console.log(`  ⚠️ Content thin (${words}/${MIN_ARTICLE_WORDS} words, tables=${tables}) — expanding...`);
  const expandPrompt = buildExpandPrompt(cleanTopic, postData);

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

/** Nếu AI quên mục nguồn — chèn từ kết quả tìm kiếm */
function ensureSourcesSection(html, searchResults) {
  if (!searchResults?.length) return html || '';
  if (/Nguồn tham khảo/i.test(html || '')) return html;
  const links = searchResults
    .filter((r) => r.link && /^https?:\/\//i.test(r.link))
    .slice(0, 8)
    .map((r) => `<li><a href="${r.link}" target="_blank" rel="noopener noreferrer">${(r.title || r.link).replace(/</g, '')}</a></li>`)
    .join('\n');
  if (!links) return html;
  return `${html}\n<h2>Nguồn tham khảo</h2>\n<ul>\n${links}\n</ul>`;
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
      research: usedSources.filter((s) => s !== 'gemini'),
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

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🚀 AI Generate: "${cleanTopic}" v${variantIndex + 1} (gemini=${hasGemini})`);
  console.log(`${'═'.repeat(50)}`);

  if (!hasGemini) {
    const template = generateRichTemplate(cleanTopic, variantIndex);
    return res.status(503).json({
      success: false,
      source: 'no-api-key',
      message: 'Chưa cấu hình GEMINI_API_KEY trong server/.env. Lấy key miễn phí: https://aistudio.google.com/apikey',
      data: template,
      wordCount: countWords(template.content),
      hasTables: true,
    });
  }

  // [1] Thu thập nguồn mạng: Google CSE (nếu có) + Wikipedia/DuckDuckGo
  let webResults = [];
  try {
    const googleResults = await fetchGoogleSearch(cleanTopic);
    if (googleResults?.length) {
      webResults = mergeSearchResults(webResults, googleResults);
      usedSources.push('google-search');
      console.log(`  ✅ [1a] Google CSE: ${googleResults.length} results`);
    }
  } catch (e) {
    console.log(`  ⏭️ [1a] Google Search: ${e.message}`);
  }

  try {
    const freeResults = await fetchFreeWebResearch(cleanTopic);
    if (freeResults?.length) {
      webResults = mergeSearchResults(webResults, freeResults);
      usedSources.push('web-sources');
      console.log(`  ✅ [1b] Free web (Wiki/DDG): ${freeResults.length} items → total ${webResults.length}`);
    }
  } catch (e) {
    console.log(`  ⏭️ [1b] Free web: ${e.message}`);
  }

  const googleContext = formatSearchContext(webResults);

  // [2] Gemini nghiên cứu + grounding (có kèm snippet web)
  let researchData = '';
  if (hasGemini) {
    researchData = await researchTopic(cleanTopic, googleContext);
    if (researchData) usedSources.push('gemini-research');
  }

  if (!researchData && !googleContext) {
    researchData = `Chủ đề: "${cleanTopic}". Viết từ chuyên môn Tin học văn phòng VN — ví dụ thật, không bịa số liệu.`;
  }

  const seoPrompt = buildSEOPrompt(cleanTopic, researchData, googleContext, variantIndex, avoid);

  const finalize = async (postData, writerLabel) => {
    postData = await ensureQualityContent(postData, cleanTopic, writerLabel);
    postData.content = ensureSourcesSection(postData.content, webResults);
    return postData;
  };

  // Gemini viết bài (nghiên cứu + nguồn mạng đã gắn trong prompt)
  try {
    console.log(`  📝 [3] Gemini: writing (v${variantIndex + 1}, T=${temp})...`);
    const g = await generateWithGemini(seoPrompt, { jsonMode: true, temperature: temp });
    let postData = normalizePostData(parseAIJson(g.text), cleanTopic);
    if (!usedSources.includes('gemini')) usedSources.push('gemini');
    postData = await finalize(postData, g.model);
    console.log(`  ✅ [3] ${g.model} OK — ${countWords(postData.content)} words`);
    return res.json(buildResponsePayload(postData, cleanTopic, usedSources, startTime, g.model, variantIndex));
  } catch (e) {
    console.error(`  ❌ [3] Gemini write: ${e.message}`);
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
    message: 'Gemini tạm quá tải hoặc hết quota. Đã dùng bài mẫu. Thử lại sau 1–2 phút hoặc kiểm tra GEMINI_API_KEY.',
    data: template,
  });
});

router.get('/search-info', authenticate, authorize('admin'), (req, res) => {
  res.json({
    engines: {
      gemini: {
        active: !!process.env.GEMINI_API_KEY?.trim(),
        role: 'Nghiên cứu (Grounding) + viết bài — engine duy nhất',
        models: GEMINI_WRITE_MODELS,
        free: 'https://aistudio.google.com/apikey',
      },
      googleSearch: {
        active: !!(process.env.GOOGLE_SEARCH_API_KEY?.trim() && process.env.GOOGLE_SEARCH_CX?.trim()),
        role: 'Google CSE (tùy chọn) — luôn có Wikipedia/DuckDuckGo miễn phí',
      },
      webFree: {
        active: true,
        role: 'Wikipedia VI + DuckDuckGo Abstract (luôn bật)',
      },
    },
    requirements: {
      minWords: 1800,
      minTables: 1,
      note: 'Chỉ dùng Gemini. Số lần tạo phụ thuộc quota miễn phí Google AI Studio.',
    },
  });
});

module.exports = router;
