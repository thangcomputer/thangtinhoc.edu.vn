const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const { buildPublicFileUrl } = require('../lib/publicUrl');

const router = express.Router();

const USE_CLOUDINARY = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let cloudinary;
if (USE_CLOUDINARY) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// ── Local disk helpers ──────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads');
const metaFile = path.join(__dirname, '..', 'uploads', '_meta.json');

function loadMeta() {
  try {
    if (fs.existsSync(metaFile)) return JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  } catch {}
  return {};
}

function saveMeta(meta) {
  try {
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save meta:', err);
  }
}

function safeFilename(raw) {
  const filename = path.basename(decodeURIComponent(raw || ''));
  if (!filename || filename.includes('..')) return null;
  return filename;
}

function resolveUploadPath(filename) {
  const filePath = path.resolve(uploadDir, filename);
  if (!filePath.startsWith(path.resolve(uploadDir))) return null;
  return filePath;
}

// Trích public_id từ Cloudinary URL
// VD: https://res.cloudinary.com/demo/image/upload/v1234/tinhoc24h/abc.jpg → tinhoc24h/abc
function extractCloudinaryPublicId(url) {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
  return match ? match[1] : null;
}

// ── Cloudinary helpers ──────────────────────────────────────────────────────
async function listCloudinaryImages() {
  const result = await cloudinary.api.resources({
    type: 'upload',
    prefix: 'tinhoc24h',
    max_results: 500,
    resource_type: 'image',
  });
  return result.resources.map(r => ({
    filename: r.public_id,
    url: r.secure_url,
    alt: '',
    title: '',
  }));
}

async function deleteCloudinaryImage(publicIdOrUrl) {
  // Chấp nhận cả public_id lẫn URL đầy đủ
  const publicId = publicIdOrUrl.startsWith('http')
    ? extractCloudinaryPublicId(publicIdOrUrl)
    : publicIdOrUrl;
  if (!publicId) throw new Error('Không xác định được public_id');
  return cloudinary.uploader.destroy(publicId);
}

// ── Routes ──────────────────────────────────────────────────────────────────

// GET /api/media – danh sách ảnh (admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (USE_CLOUDINARY) {
      const data = await listCloudinaryImages();
      return res.json({ success: true, data });
    }

    if (!fs.existsSync(uploadDir)) return res.json({ success: true, data: [] });
    const files = await fs.promises.readdir(uploadDir);
    const meta = loadMeta();
    const images = files.filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f));
    const data = images.map(f => ({
      filename: f,
      url: buildPublicFileUrl(f),
      alt: meta[f]?.alt || '',
      title: meta[f]?.title || '',
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('Media list error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/media/bulk-delete – xóa nhiều ảnh (admin)
router.post('/bulk-delete', authenticate, authorize('admin'), async (req, res) => {
  const filenames = Array.isArray(req.body?.filenames) ? req.body.filenames : [];
  if (!filenames.length) {
    return res.status(400).json({ success: false, message: 'Chưa chọn ảnh nào' });
  }

  const deleted = [];
  const failed = [];

  if (USE_CLOUDINARY) {
    for (const raw of filenames) {
      try {
        await deleteCloudinaryImage(raw);
        deleted.push(raw);
      } catch (err) {
        console.error('Cloudinary delete error:', raw, err);
        failed.push({ filename: raw, message: 'Không thể xóa ảnh' });
      }
    }
  } else {
    const meta = loadMeta();
    for (const raw of filenames) {
      const filename = safeFilename(raw);
      if (!filename) {
        failed.push({ filename: raw, message: 'Tên file không hợp lệ' });
        continue;
      }
      const filePath = resolveUploadPath(filename);
      if (!filePath || !fs.existsSync(filePath)) {
        delete meta[filename];
        failed.push({ filename, message: 'Không tìm thấy ảnh trên đĩa' });
        continue;
      }
      try {
        await fs.promises.unlink(filePath);
        delete meta[filename];
        deleted.push(filename);
      } catch (err) {
        console.error('Bulk delete file error:', filename, err);
        failed.push({ filename, message: 'Không thể xóa file' });
      }
    }
    saveMeta(meta);
  }

  const allOk = failed.length === 0;
  return res.status(allOk ? 200 : 207).json({
    success: deleted.length > 0,
    message: allOk
      ? `Đã xóa ${deleted.length} ảnh`
      : `Đã xóa ${deleted.length}/${filenames.length} ảnh`,
    data: { deleted, failed },
  });
});

// PUT /api/media/:filename – cập nhật alt & title (admin, chỉ local)
router.put('/:filename', authenticate, authorize('admin'), async (req, res) => {
  if (USE_CLOUDINARY) {
    return res.json({ success: true, message: 'Đã lưu' });
  }
  const filename = safeFilename(req.params.filename);
  if (!filename) return res.status(400).json({ success: false, message: 'Tên file không hợp lệ' });
  const { alt = '', title = '' } = req.body;
  const filePath = resolveUploadPath(filename);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh' });
  }
  const meta = loadMeta();
  meta[filename] = { ...(meta[filename] || {}), alt, title };
  saveMeta(meta);
  res.json({ success: true, message: 'Đã lưu thông tin ảnh' });
});

// DELETE /api/media/:filename – xóa một ảnh (admin)
router.delete('/:filename', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (USE_CLOUDINARY) {
      const raw = decodeURIComponent(req.params.filename);
      await deleteCloudinaryImage(raw);
      return res.json({ success: true, message: 'Xóa ảnh thành công' });
    }

    const filename = safeFilename(req.params.filename);
    if (!filename) return res.status(400).json({ success: false, message: 'Tên file không hợp lệ' });
    const filePath = resolveUploadPath(filename);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh' });
    }
    await fs.promises.unlink(filePath);
    const meta = loadMeta();
    delete meta[filename];
    saveMeta(meta);
    res.json({ success: true, message: 'Xóa ảnh thành công' });
  } catch (err) {
    console.error('Delete media error:', err);
    res.status(500).json({ success: false, message: 'Xóa ảnh thất bại' });
  }
});

module.exports = router;
