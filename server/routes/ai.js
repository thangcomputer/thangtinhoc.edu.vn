const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { authenticate, authorize } = require('../middleware/auth');
const {
  MIN_ARTICLE_WORDS,
  TARGET_ARTICLE_WORDS,
  EDITORIAL_STYLE_PROMPT,
  buildExpandStyleNote,
  buildLongFormFallback,
} = require('../lib/articleQuality');
const { COPYWRITER_SYSTEM_PROMPT, BRAND, BRAND_PROFILE_FACTS, detectTopicIntent, resolveTopicEntity, isBrandWhoIsTopic, buildIntentAddon } = require('../lib/copywriterPrompt');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const GEMINI_WRITE_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite',
];

const GEMINI_GROUNDING_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
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

async function fetchGoogleSearch(topic) {
  const year = new Date().getFullYear();
  const intent = detectTopicIntent(topic);
  const entity = resolveTopicEntity(topic);
  const queries = intent === 'who_is'
    ? [
      topic,
      `${entity} là ai`,
      `${BRAND.name} ${entity}`,
      `site:${BRAND.sites} giới thiệu`,
      `${entity} dạy tin học`,
    ]
    : [
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
  const intent = detectTopicIntent(topic);
  const entity = resolveTopicEntity(topic);
  const searchQ = intent === 'who_is' ? `${entity} tin học` : topic;

  try {
    const wikiUrl = `https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQ)}&srlimit=4&format=json&origin=*`;
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
    const ddgQueries = intent === 'who_is'
      ? [`${entity} là ai`, `${BRAND.name}`, topic]
      : [topic];
    for (const q of ddgQueries) {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`;
      const ddg = await httpsGetJson(ddgUrl);
      if (ddg?.AbstractText) {
        results.push({
          title: ddg.Heading || `DuckDuckGo: ${q}`,
          snippet: String(ddg.AbstractText).slice(0, 500),
          link: ddg.AbstractURL || ddg.AbstractSource || '',
          engine: 'duckduckgo',
        });
      }
      const related = Array.isArray(ddg?.RelatedTopics) ? ddg.RelatedTopics : [];
      for (const rt of related.slice(0, 4)) {
        if (rt?.Text && rt?.FirstURL) {
          results.push({
            title: String(rt.Text).slice(0, 80),
            snippet: String(rt.Text).slice(0, 400),
            link: rt.FirstURL,
            engine: 'duckduckgo',
          });
        }
      }
    }
  } catch { /* ignore */ }

  if (intent === 'who_is' || isBrandWhoIsTopic(topic)) {
    results.unshift({
      title: `${BRAND.teacher} — Giới thiệu ${BRAND.name}`,
      snippet: `${BRAND.teacher} là giáo viên tin học văn phòng của ${BRAND.name}. ${BRAND.training}. Chuyên môn: ${BRAND.fields}.`,
      link: `https://${BRAND.sites}/gioi-thieu`,
      engine: 'brand',
    });
    results.push({
      title: `${BRAND.name} — Trang chủ`,
      snippet: `Website chính ${BRAND.sites}: đào tạo tin học văn phòng, học online 1 kèm 1.`,
      link: `https://${BRAND.sites}/`,
      engine: 'brand',
    });
  }

  const officeHint = /excel|word|powerpoint|office|mos|tin học|máy tính/i.test(topic);
  if (officeHint && intent !== 'who_is') {
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
    const body = r.excerpt ? `\nNội dung trích:\n${r.excerpt}` : '';
    return `[Nguồn ${i + 1}]${eng} ${r.title}\n${r.snippet || ''}${body}\nURL: ${r.link || '(không có URL)'}`;
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

function htmlToPlainText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tải HTML công khai → trích text (không crawl sâu / không bypass auth) */
function fetchUrlText(rawUrl, maxChars = 4500) {
  return new Promise((resolve) => {
    let parsed;
    try { parsed = new URL(rawUrl); } catch { return resolve(null); }
    if (!/^https?:$/i.test(parsed.protocol)) return resolve(null);
    // Bỏ trang login / mạng xã hội nặng JS
    if (/facebook\.com|instagram\.com|tiktok\.com|youtube\.com|login|signin/i.test(parsed.hostname + parsed.pathname)) {
      return resolve(null);
    }

    const lib = parsed.protocol === 'http:' ? http : https;
    const req = lib.get(rawUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ThangTinHocResearch/1.0; +https://thangtinhoc.edu.vn)',
        Accept: 'text/html,application/xhtml+xml',
      },
    }, (res) => {
      // Follow 1 redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = new URL(res.headers.location, rawUrl).toString();
        res.resume();
        return fetchUrlText(next, maxChars).then(resolve);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return resolve(null);
      }
      const ctype = String(res.headers['content-type'] || '');
      if (!/html|text|xml/i.test(ctype) && ctype) {
        res.resume();
        return resolve(null);
      }
      let data = '';
      let size = 0;
      res.on('data', (c) => {
        size += c.length;
        if (size > 350000) {
          req.destroy();
          return;
        }
        data += c;
      });
      res.on('end', () => {
        const text = htmlToPlainText(data).slice(0, maxChars);
        resolve(text.length > 120 ? text : null);
      });
    });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
  });
}

/** Đọc 4–6 trang từ kết quả tìm kiếm để Gemini có nội dung thật */
async function enrichResultsWithPageText(results, limit = 5) {
  if (!results?.length) return results || [];
  const candidates = results
    .filter((r) => r.link && /^https?:\/\//i.test(r.link) && r.engine !== 'brand')
    .slice(0, limit);

  await Promise.all(candidates.map(async (item) => {
    try {
      const excerpt = await fetchUrlText(item.link);
      if (excerpt) item.excerpt = excerpt;
    } catch { /* ignore */ }
  }));

  const withBody = results.filter((r) => r.excerpt).length;
  if (withBody) console.log(`  ✅ [1c] Đã đọc nội dung ${withBody} trang web`);
  return results;
}

/**
 * Gemini + Google Search Grounding: bắt buộc tìm bài trên mạng rồi tóm tắt.
 */
async function groundedWebDiscovery(cleanTopic, webContext = '') {
  const genAI = getGenAI();
  if (!genAI) return '';

  const year = new Date().getFullYear();
  const intent = detectTopicIntent(cleanTopic);
  const entity = resolveTopicEntity(cleanTopic);

  const prompt = `Bạn PHẢI dùng Google Search để tìm bài viết / trang web thật về chủ đề sau, rồi tổng hợp.

Chủ đề search: "${cleanTopic}"
Thực thể: "${entity}"
Ý định bài: ${intent}
Năm: ${year}

${webContext ? `Gợi ý URL/snippet đã có (đối chiếu thêm bằng Google Search):\n${webContext.slice(0, 5000)}\n` : ''}

YÊU CẦU OUTPUT (tiếng Việt):
A) Liệt kê 5–8 nguồn tìm được trên mạng: Tiêu đề | URL | 4–6 ý chính (diễn giải, không copy nguyên văn dài).
B) Tổng hợp kiến thức thống nhất để viết bài (bullet).
C) Với intent who_is: ưu tiên trang giới thiệu / profile; trả lời rõ "là ai?".
D) Ghi rõ thông tin nào KHÔNG tìm thấy trên mạng (không bịa).

CẤM bịa URL. CẤM viết giáo án lệch chủ đề.`;

  let lastErr;
  for (const modelName of GEMINI_GROUNDING_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        tools: [{ googleSearch: {} }],
      });
      const r = await model.generateContent(prompt);
      const text = r.response?.text?.() || '';
      if (text.length > 250) {
        // Trích citation nếu API trả về
        let cites = '';
        try {
          const meta = r.response?.candidates?.[0]?.groundingMetadata;
          const chunks = meta?.groundingChunks || [];
          if (chunks.length) {
            cites = '\n\n=== URL Google Search (grounding) ===\n' + chunks
              .map((c, i) => {
                const u = c.web?.uri || c.web?.url || '';
                const t = c.web?.title || '';
                return u ? `[G${i + 1}] ${t}\n${u}` : '';
              })
              .filter(Boolean)
              .join('\n');
          }
        } catch { /* ignore */ }
        console.log(`  ✅ [2a] Gemini Grounding discovery (${modelName}): ${text.length} chars`);
        return text + cites;
      }
    } catch (e) {
      lastErr = e;
      console.log(`  ⏭️ [2a] Grounding ${modelName}: ${e.message?.slice(0, 100)}`);
    }
  }
  if (lastErr) console.log(`  ⚠️ [2a] Grounding all failed: ${lastErr.message?.slice(0, 120)}`);
  return '';
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

const WHO_IS_VARIANT_ANGLES = [
  {
    titleSuffix: 'Giới Thiệu Chi Tiết & Cách Dạy',
    excerptHint: 'trả lời thẳng là ai, chuyên môn, phương pháp 1 kèm 1',
    angle: 'bài PROFILE: đoạn đầu trả lời "là ai?", rồi chuyên môn + cách dạy + đối tượng',
  },
  {
    titleSuffix: 'Thương Hiệu & Phương Pháp Online',
    excerptHint: 'thương hiệu Thắng Tin Học, UltraViewer, đối tượng học',
    angle: 'nhấn mạnh thương hiệu + học online 1 kèm 1 — vẫn là bài giới thiệu người, không giáo án Excel',
  },
  {
    titleSuffix: 'FAQ Người Mới Hay Hỏi',
    excerptHint: 'FAQ danh tính, hình thức học, đăng ký tư vấn',
    angle: 'FAQ xoay quanh danh tính và đăng ký — cấm FAQ "tin học khó không" làm trục',
  },
  {
    titleSuffix: 'Vì Sao Nhiều Người Tìm Hiểu',
    excerptHint: 'lý do search là ai, khác gì tự học, CTA mềm',
    angle: 'góc "vì sao mọi người hỏi là ai" + khác biệt vs tự học clip',
  },
];

function getVariantMeta(variantIndex, intent = 'general') {
  const list = intent === 'who_is' ? WHO_IS_VARIANT_ANGLES : VARIANT_ANGLES;
  return list[variantIndex % list.length];
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
  const intent = detectTopicIntent(cleanTopic);
  const entity = resolveTopicEntity(cleanTopic);
  const variant = getVariantMeta(variantIndex, intent);
  let dataContext = '';
  if (isBrandWhoIsTopic(cleanTopic) || intent === 'who_is') {
    dataContext += `=== HỒ SƠ THƯƠNG HIỆU (ưu tiên dùng, không bịa thêm) ===\n${BRAND_PROFILE_FACTS}\n\n`;
  }
  if (researchData) dataContext += `=== NGHIÊN CỨU (Gemini / grounding) ===\n${researchData}\n\n`;
  if (googleContext) dataContext += `=== NGUỒN MẠNG ===\n${googleContext}\n\n`;

  const hasSources = !!(researchData || googleContext);
  const intentAddon = buildIntentAddon(intent);

  return `Viết bài TIẾNG VIỆT tập trung đúng ý định người đọc — không viết lệch chủ đề, không "bài SEO khuôn".

═══ Ý ĐỊNH PHÁT HIỆN: ${intent.toUpperCase()} ═══
Câu chủ đề người nhập: "${cleanTopic}"
Tên dùng trong câu văn (BẮT BUỘC): "${entity}" — CẤM dán nguyên câu chủ đề vào giữa câu như một kỹ năng.
${intentAddon}

═══ PHIÊN BẢN ${variantIndex + 1} ═══
Góc nhìn: ${variant.angle}
Tiêu đề: tự nhiên; gợi ý cụm "${variant.titleSuffix}" (được viết khác nếu hay hơn). Với bài who_is: tiêu đề phải trả lời/định danh người — CẤM "Có khó không?".
${buildAvoidBlock(avoid)}
═══ NĂM: ${year} ═══

═══ NGUỒN THAM KHẢO (bắt buộc dựa vào bài/trang đã tìm trên mạng) ═══
${dataContext || `Viết từ hồ sơ thương hiệu / chuyên môn; KHÔNG bịa số liệu.`}

${hasSources ? `QUY TẮC NGUỒN (bắt buộc):
- Bài viết phải dựa trên các trang/bài đã tìm trên mạng ở trên (tóm tắt nghiên cứu + nội dung trích trang).
- Diễn giải lại tiếng Việt; không copy nguyên văn dài.
- Không bịa URL. Thêm <h2>Nguồn tham khảo</h2> với 3–8 link thật từ danh sách.
- Nếu nguồn mỏng: nói rõ phần suy luận từ chuyên môn, không bịa như đã đọc báo.
` : ''}

${EDITORIAL_STYLE_PROMPT}

═══ YÊU CẦU ═══
- Độ dài mục tiêu ${TARGET_ARTICLE_WORDS} từ — ưu tiên đúng trọng tâm.
- Đoạn 1–2 phải trả lời thẳng câu hỏi / vấn đề chính.
- 4–8 <h2> theo logic ý định ${intent}.
- Ít nhất 1 bảng hữu ích (với who_is: bảng tóm tắt hồ sơ / so sánh tự học vs 1 kèm 1).
- FAQ 4–8 câu ĐÚNG chủ đề; kết + CTA mềm ${BRAND.name}.
- CẤM mở: "Trong kỷ nguyên số", "Bài viết này sẽ", "Dưới đây là".
- CẤM câu kiểu: "làm chủ ${cleanTopic}", "học ${cleanTopic}", "lộ trình cho ${cleanTopic}" nếu ${cleanTopic} là câu hỏi "là ai?".

═══ HTML ═══
h2,h3,h4,p,ul,ol,li,strong,em,blockquote,table,thead,tbody,tr,th,td,figure,img,figcaption,a
KHÔNG: h1, script

═══ OUTPUT — CHỈ JSON ═══
{"title":"...","excerpt":"120-160 ký tự","content":"<p>...</p>...","focusKeyword":"${cleanTopic}","metaTitle":"55-60 ký tự","metaDescription":"140-160 ký tự","tags":["..."],"slug":"slug-khong-dau","suggestions":[{"title":"...","snippet":"..."}]}`;
}

function buildExpandPrompt(cleanTopic, postData) {
  const intent = detectTopicIntent(cleanTopic);
  const entity = resolveTopicEntity(cleanTopic);
  return `Bài viết tiếng Việt về "${cleanTopic}" (ý định: ${intent}, dùng tên "${entity}" trong câu) còn QUÁ NGẮN.
${buildExpandStyleNote(intent)}
Trả về JSON: title, excerpt, content, focusKeyword, metaTitle, metaDescription, tags, slug, suggestions.
CẤM nhét nguyên câu "${cleanTopic}" vào giữa câu như một kỹ năng.

Nội dung hiện tại:
${(postData.content || '').substring(0, 12000)}`;
}

async function generateWithGemini(prompt, { jsonMode = true, temperature = 0.75, systemHint = true, useGrounding = false } = {}) {
  const genAI = getGenAI();
  if (!genAI) return null;

  const fullPrompt = systemHint
    ? `${COPYWRITER_SYSTEM_PROMPT}

Target ~${TARGET_ARTICLE_WORDS} Vietnamese words (min ~${MIN_ARTICLE_WORDS}). Bắt buộc dựa trên nguồn mạng / Google Search đã cung cấp. 1+ useful table, 4–8 FAQ, soft CTA. No SEO-template filler.

${prompt}`
    : prompt;

  const generationConfig = {
    temperature: Math.min(0.95, temperature),
    maxOutputTokens: 8192,
    ...(!useGrounding && jsonMode ? { responseMimeType: 'application/json' } : {}),
  };

  const models = useGrounding ? GEMINI_GROUNDING_MODELS : GEMINI_WRITE_MODELS;
  let lastErr;
  for (const modelName of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig,
          ...(useGrounding ? { tools: [{ googleSearch: {} }] } : {}),
        });
        const result = await model.generateContent(
          useGrounding
            ? `${fullPrompt}

Trả về ĐÚNG một JSON hợp lệ (không markdown fence). Nếu vừa search web, hãy lồng ý từ kết quả search vào content và liệt kê URL thật ở mục Nguồn tham khảo.`
            : fullPrompt
        );
        const text = result.response.text();
        if (text?.trim()) return { text, model: modelName, grounded: !!useGrounding };
      } catch (err) {
        lastErr = err;
        const msg = err.message || '';
        if (/429|quota|RESOURCE_EXHAUSTED/i.test(msg) && attempt < 2) {
          await sleep(6000 * attempt);
          continue;
        }
        console.error(`  ❌ Gemini ${modelName}${useGrounding ? ' (grounding)' : ''} attempt ${attempt}: ${msg}`);
        break;
      }
    }
  }
  throw lastErr || new Error('All Gemini models failed');
}

async function researchTopic(cleanTopic, webContext = '') {
  // Ưu tiên: Gemini + Google Search tìm bài trên mạng
  const grounded = await groundedWebDiscovery(cleanTopic, webContext);
  if (grounded) return grounded;

  const genAI = getGenAI();
  if (!genAI) return '';

  const year = new Date().getFullYear();
  const intent = detectTopicIntent(cleanTopic);
  const entity = resolveTopicEntity(cleanTopic);

  const researchPrompt = intent === 'who_is'
    ? `Nghiên cứu PROFILE về: "${entity}" (search: "${cleanTopic}"). Năm: ${year}.
${isBrandWhoIsTopic(cleanTopic) ? `Hồ sơ:\n${BRAND_PROFILE_FACTS}\n` : ''}
${webContext ? `Nội dung web đã đọc:\n${webContext.slice(0, 10000)}\n` : ''}
Bullet dựa trên nguồn: là ai, vai trò, dạy gì, phương pháp, đối tượng, FAQ, URL thật. CẤM giáo án Excel.`
    : `Tổng hợp từ nguồn web về "${cleanTopic}" (${entity}), năm ${year}.
${webContext ? `Nguồn:\n${webContext.slice(0, 10000)}\n` : ''}
Bullet: khái niệm, thao tác, lỗi hay gặp, PAA, bảng, URL thật. CẤM bịa %.`;

  try {
    const simple = await generateWithGemini(researchPrompt, { jsonMode: false, temperature: 0.35, systemHint: false });
    if (simple?.text) {
      console.log(`  ✅ [2b] Gemini research từ nguồn đã tải: ${simple.text.length} chars`);
      return simple.text;
    }
  } catch (e) {
    console.error(`  ❌ [2b] Gemini research failed: ${e.message}`);
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

/** Template khi AI không khả dụng — theo ý định chủ đề */
function generateRichTemplate(topic, variantIndex = 0) {
  const year = new Date().getFullYear();
  const intent = detectTopicIntent(topic);
  const entity = resolveTopicEntity(topic);
  const variant = getVariantMeta(variantIndex, intent);
  const slug = makeSlug(topic, variantIndex);
  const content = buildLongFormFallback(topic, variantIndex);

  let title;
  if (intent === 'who_is') {
    title = variantIndex % 2 === 0
      ? `${entity} Là Ai? ${variant.titleSuffix} (${year})`
      : `${entity} — ${variant.titleSuffix} (${year})`;
  } else {
    title = variantIndex % 4 === 0
      ? `${entity} Có Khó Không? ${variant.titleSuffix} (${year})`
      : `${entity} — ${variant.titleSuffix} (${year})`;
  }

  return {
    title,
    slug,
    excerpt: intent === 'who_is'
      ? `${entity} là giáo viên / thương hiệu tin học văn phòng: chuyên môn, cách dạy 1 kèm 1, đối tượng phù hợp.`
      : `${entity} ${year}: ${variant.excerptHint}. Khóa học Thắng Tin Học — học thử miễn phí.`,
    content,
    focusKeyword: topic.toLowerCase(),
    metaTitle: (intent === 'who_is' ? `${entity} là ai? ${variant.titleSuffix}` : `${entity} — ${variant.titleSuffix}`).substring(0, 60),
    metaDescription: (intent === 'who_is'
      ? `${entity} là ai? Giới thiệu ngắn, phương pháp dạy online 1 kèm 1 tại Thắng Tin Học.`
      : `${entity}: ${variant.excerptHint}. Tư vấn khóa học Thắng Tin Học.`).substring(0, 160),
    tags: [entity, 'MOS', 'IC3', 'hoctinhoc', 'thangcomputer', 'tinhocvanphong'],
    suggestions: [],
    variantIndex,
    intent,
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
  console.log(`🚀 AI Generate: "${cleanTopic}" v${variantIndex + 1} intent=${detectTopicIntent(cleanTopic)} entity="${resolveTopicEntity(cleanTopic)}" (gemini=${hasGemini})`);
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

  // [1c] Đọc nội dung thật từ vài trang tìm được
  try {
    webResults = await enrichResultsWithPageText(webResults, 5);
    if (webResults.some((r) => r.excerpt)) usedSources.push('page-extract');
  } catch (e) {
    console.log(`  ⏭️ [1c] Page extract: ${e.message}`);
  }

  const googleContext = formatSearchContext(webResults);

  // [2] Gemini + Google Search: tìm hiểu bài trên mạng
  let researchData = '';
  if (hasGemini) {
    researchData = await researchTopic(cleanTopic, googleContext);
    if (researchData) usedSources.push('gemini-web-research');
  }

  if (!researchData && !googleContext) {
    researchData = isBrandWhoIsTopic(cleanTopic) || detectTopicIntent(cleanTopic) === 'who_is'
      ? `PROFILE:\n${BRAND_PROFILE_FACTS}\nViết bài giới thiệu tập trung "là ai?" — không giáo án kỹ năng.`
      : `Chủ đề: "${cleanTopic}". Viết từ chuyên môn Tin học văn phòng VN — ví dụ thật, không bịa số liệu.`;
  }

  const seoPrompt = buildSEOPrompt(cleanTopic, researchData, googleContext, variantIndex, avoid);

  const finalize = async (postData, writerLabel) => {
    postData = await ensureQualityContent(postData, cleanTopic, writerLabel);
    postData.content = ensureSourcesSection(postData.content, webResults);
    return postData;
  };

  // [3] Viết bài — ưu tiên Gemini kèm Google Search grounding
  try {
    console.log(`  📝 [3] Gemini + Search writing (v${variantIndex + 1}, T=${temp})...`);
    let g;
    try {
      g = await generateWithGemini(seoPrompt, { jsonMode: true, temperature: temp, useGrounding: true });
      usedSources.push('gemini-grounded-write');
    } catch (groundErr) {
      console.log(`  ⏭️ [3] Grounded write fail: ${groundErr.message?.slice(0, 100)} — fallback no-tool`);
      g = await generateWithGemini(seoPrompt, { jsonMode: true, temperature: temp, useGrounding: false });
      usedSources.push('gemini');
    }
    let postData = normalizePostData(parseAIJson(g.text), cleanTopic);
    postData = await finalize(postData, g.model);
    console.log(`  ✅ [3] ${g.model} OK — ${countWords(postData.content)} words (grounded=${!!g.grounded})`);
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
        role: 'Google Search Grounding + đọc trang web + viết bài',
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
      note: 'Gemini tìm bài trên Google (Grounding), đọc nội dung trang, rồi viết. Phụ thuộc quota AI Studio.',
    },
  });
});

module.exports = router;
