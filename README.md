# Thắng Tin Học — Nền tảng đào tạo trực tuyến

Monorepo gồm **client** (website học viên), **admin** (quản trị), **server** (API Express + Prisma).

## Yêu cầu

- Node.js 18+
- npm

## Cài đặt nhanh

```bash
# 1. Server
cd server
cp .env.example .env
# Chỉnh JWT_SECRET trong .env
npm install
npm run setup

# 2. Client
cd ../client
cp .env.example .env
npm install

# 3. Admin
cd ../admin
cp .env.example .env
npm install
```

## Chạy development

```bash
# Terminal 1 — API (port 5000)
cd server && npm run dev

# Terminal 2 — Website (port 5173)
cd client && npm run dev

# Terminal 3 — Admin (port 5174)
cd admin && npm run dev
```

Tài khoản sau `npm run setup` (seed):

| Vai trò | Email | Mật khẩu |
|---------|-------|------------|
| Admin | admin@gmail.com | admin123 |
| Học viên | test@gmail.com | user123 |

**Đổi mật khẩu ngay khi deploy production.**

## Bảo mật đã áp dụng

- JWT bắt buộc (`JWT_SECRET`)
- Rate limit, Helmet, sanitize XSS, HTTPS redirect (production)
- API khóa học public **không** lộ `videoUrl`/nội dung bài học (trừ bài preview)
- Route `/api/courses/:slug/learn` — nội dung đầy đủ khi đã ghi danh
- Tin liên hệ, upload CMS, thanh toán mock — chỉ admin / môi trường dev
- Google OAuth có xác minh chữ ký token (không decode giả mạo)
- File tài liệu & bài nộp tải qua API có kiểm tra quyền
- Mật khẩu tối thiểu 8 ký tự

## Production checklist

1. `NODE_ENV=production`
2. `JWT_SECRET` mạnh, không commit `.env`
3. `GOOGLE_CLIENT_ID` nếu dùng đăng nhập Google
4. `CORS_ORIGIN` đúng domain client + admin
5. **Không** bật `ALLOW_MOCK_PAYMENT` trừ khi cần test
6. Cân nhắc PostgreSQL thay SQLite
7. Đổi mật khẩu tài khoản seed

## Cấu trúc

```
WEB/
├── client/   → Vite + React (học viên)
├── admin/    → Vite + React (CMS)
└── server/   → Express + Prisma + SQLite
```
