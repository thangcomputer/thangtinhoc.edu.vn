const express = require('express');
const prisma = require('../lib/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Send message (Visitor)
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, subject, content } = req.body;
    if (!phone || !content) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số điện thoại và nội dung' });
    }
    const message = await prisma.contactMessage.create({
      data: { name: name || 'Khách', phone, email: email || null, subject: subject || null, content },
    });
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('[contacts] POST', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Get all messages (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('[contacts] GET admin', error);
    const hint =
      error?.code === 'P2021' || /does not exist|no such table/i.test(String(error?.message))
        ? 'Chạy trên VPS: cd server && npx prisma migrate deploy'
        : undefined;
    res.status(500).json({ success: false, message: 'Lỗi server', hint });
  }
});

// Mark as read (Admin only)
router.patch('/:id/read', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.contactMessage.update({
      where: { id: parseInt(id) },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'Đã đánh dấu là đã đọc' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Delete message (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.contactMessage.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true, message: 'Đã xóa tin nhắn' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
