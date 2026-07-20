const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/auth');
const { buildPublicFileUrl } = require('../lib/publicUrl');

const router = express.Router();

// Dùng Cloudinary khi có đủ 3 biến môi trường (production)
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

// Local disk storage (dùng khi không có Cloudinary)
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const imageFilter = (req, file, cb) => {
  const allowed = /\.(jpe?g|png|gif|webp)$/i;
  if (allowed.test(path.extname(file.originalname)) && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)'));
  }
};

const mediaFilter = (req, file, cb) => {
  const allowedExt = /\.(jpe?g|png|gif|webp|mp4|webm|mov)$/i;
  const allowedMime = /^(image\/|video\/)/;
  if (allowedExt.test(path.extname(file.originalname)) && allowedMime.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh hoặc video'));
  }
};

// Memory storage khi dùng Cloudinary (không lưu xuống disk)
const storage = USE_CLOUDINARY ? multer.memoryStorage() : diskStorage;

const uploadUserImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadMedia = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 100 * 1024 * 1024 },
  fileFilter: mediaFilter,
});

// Upload buffer lên Cloudinary, trả về { url, publicId }
function uploadBufferToCloudinary(buffer, folder = 'tinhoc24h') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

async function sendUploadResponse(req, res) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: 'Không có file' });
  }

  if (USE_CLOUDINARY) {
    try {
      const { url, publicId } = await uploadBufferToCloudinary(file.buffer);
      return res.json({ success: true, url, data: { url, filename: publicId } });
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      return res.status(500).json({ success: false, message: 'Lỗi upload ảnh lên Cloudinary' });
    }
  }

  const url = buildPublicFileUrl(file.filename);
  return res.json({ success: true, url, data: { url, filename: file.filename } });
}

function pickUploadedFile(req) {
  if (req.file) return req.file;
  const files = req.files;
  if (!files) return null;
  if (files.file?.[0]) return files.file[0];
  if (files.image?.[0]) return files.image[0];
  return null;
}

async function handleAdminUpload(req, res) {
  req.file = pickUploadedFile(req);
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Không có file. Dùng field file hoặc image.' });
  }
  await sendUploadResponse(req, res);
}

// Chấp nhận cả field "file" và "image" trong một lần parse
const adminUpload = uploadMedia.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);

router.post('/user-image', authenticate, uploadUserImage.single('image'), async (req, res) => {
  await sendUploadResponse(req, res);
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  adminUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Lỗi upload' });
    }
    await handleAdminUpload(req, res);
  });
});

router.post('/image', authenticate, authorize('admin'), uploadUserImage.single('image'), async (req, res) => {
  await sendUploadResponse(req, res);
});

module.exports = router;
