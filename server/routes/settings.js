const express = require('express');
const prisma = require('../lib/db');
const { authenticate, authorize } = require('../middleware/auth');
const { normalizePublicUrl } = require('../lib/publicUrl');

const { filterPublicSettings } = require('../lib/settingsPublic');

// Keys chứa URL ảnh cần normalize
const IMAGE_SETTING_KEYS = new Set([
  'site_logo', 'hero_media_url', 'visual_media_url', 'promo_image',
]);

const router = express.Router();

// Get settings (public — khong tra key nhay cam)
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const formatted = settings.reduce((acc, s) => {
      const value = IMAGE_SETTING_KEYS.has(s.key) ? normalizePublicUrl(s.value) : s.value;
      return { ...acc, [s.key]: value };
    }, {});
    res.json({ success: true, data: filterPublicSettings(formatted) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Update settings (admin)
router.post('/bulk', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { settings } = req.body; // { site_name: "Tin học 24h", ... }
    for (const [key, value] of Object.entries(settings)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }
    res.json({ success: true, message: 'Đã cập nhật cấu hình hệ thống' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
