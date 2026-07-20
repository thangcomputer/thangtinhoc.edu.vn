/**
 * Tạo file Word báo cáo tiểu luận:
 * "Xây dựng Hệ thống Website Khóa học Trực tuyến"
 */
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType,
  PageBreak, TabStopType, TabStopPosition,
  NumberingLevel, convertInchesToTwip, convertMillimetersToTwip,
  UnderlineType, Header, Footer, PageNumber, LevelFormat,
} = require('docx');
const fs = require('fs');
const path = require('path');

// ─── HELPERS ────────────────────────────────────────────────

const CM = (cm) => convertMillimetersToTwip(cm * 10);
const PT = (pt) => pt * 20; // halfPoints → twips (1pt = 20 twip)

function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: PT(12), after: PT(6) },
    pageBreakBefore: true,
  });
}

function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { before: PT(12), after: PT(6) },
  });
}

function h3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.LEFT,
    spacing: { before: PT(6), after: PT(3) },
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({
      text,
      font: 'Times New Roman',
      size: 26, // 13pt = 26 half-points
      ...opts,
    })],
    alignment: AlignmentType.BOTH,
    spacing: { line: 360, before: PT(6), after: PT(6) }, // 1.5 line spacing
    indent: { firstLine: CM(1) },
  });
}

function paraLeft(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({
      text,
      font: 'Times New Roman',
      size: 26,
      ...opts,
    })],
    alignment: AlignmentType.LEFT,
    spacing: { line: 360, before: PT(3), after: PT(3) },
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Times New Roman', size: 26 })],
    bullet: { level },
    alignment: AlignmentType.BOTH,
    spacing: { line: 360, before: PT(2), after: PT(2) },
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function emptyLine() {
  return new Paragraph({ children: [new TextRun({ text: '' })], spacing: { line: 360 } });
}

// ─── TABLE BUILDER ────────────────────────────────────────────

function makeTable(headers, rows, colWidths) {
  const BORDER = { style: BorderStyle.SINGLE, size: 1, color: '888888' };
  const borders = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER, insideH: BORDER, insideV: BORDER };

  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, font: 'Times New Roman', size: 22 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: PT(2), after: PT(2) },
      })],
      width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
      shading: { type: ShadingType.SOLID, color: 'D9E1F2' },
      borders,
    })),
    tableHeader: true,
  });

  const dataRows = rows.map(row => new TableRow({
    children: row.map((cell, i) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: String(cell ?? ''), font: 'Times New Roman', size: 22 })],
        alignment: AlignmentType.LEFT,
        spacing: { before: PT(2), after: PT(2) },
      })],
      width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
      borders,
    })),
  }));

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function codeBlock(lines) {
  return lines.map(line => new Paragraph({
    children: [new TextRun({ text: line, font: 'Courier New', size: 20 })],
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, before: 0, after: 0 },
    shading: { type: ShadingType.SOLID, fill: 'F2F2F2' },
    border: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
      left: { style: BorderStyle.SINGLE, size: 6, color: '4472C4' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
    },
    indent: { left: CM(0.5) },
  }));
}

// ─── TRANG BÌA ────────────────────────────────────────────────
function coverPage() {
  return [
    emptyLine(), emptyLine(),
    new Paragraph({
      children: [new TextRun({ text: 'TRƯỜNG ĐẠI HỌC [TÊN TRƯỜNG]', bold: true, font: 'Times New Roman', size: 28, allCaps: true })],
      alignment: AlignmentType.CENTER, spacing: { after: PT(3) },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'KHOA CÔNG NGHỆ THÔNG TIN', bold: true, font: 'Times New Roman', size: 26, allCaps: true })],
      alignment: AlignmentType.CENTER, spacing: { after: PT(3) },
    }),
    new Paragraph({
      children: [new TextRun({ text: '─────────────────────────────', font: 'Times New Roman', size: 24, color: '4472C4' })],
      alignment: AlignmentType.CENTER, spacing: { after: PT(60) },
    }),
    emptyLine(), emptyLine(), emptyLine(),
    new Paragraph({
      children: [new TextRun({ text: 'BÁO CÁO TIỂU LUẬN', bold: true, font: 'Times New Roman', size: 36, allCaps: true, color: '2F5496' })],
      alignment: AlignmentType.CENTER, spacing: { before: PT(24), after: PT(12) },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'MÔN: [TÊN MÔN HỌC]', font: 'Times New Roman', size: 28, color: '595959' })],
      alignment: AlignmentType.CENTER, spacing: { after: PT(36) },
    }),
    new Paragraph({
      children: [new TextRun({ text: '─────────────────────────────', font: 'Times New Roman', size: 24, color: '4472C4' })],
      alignment: AlignmentType.CENTER, spacing: { after: PT(24) },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'ĐỀ TÀI:', bold: true, font: 'Times New Roman', size: 30, color: '1F3864' })],
      alignment: AlignmentType.CENTER, spacing: { after: PT(6) },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'XÂY DỰNG HỆ THỐNG WEBSITE', bold: true, font: 'Times New Roman', size: 34, allCaps: true, color: 'C00000' })],
      alignment: AlignmentType.CENTER, spacing: { after: PT(3) },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'KHÓA HỌC TRỰC TUYẾN', bold: true, font: 'Times New Roman', size: 34, allCaps: true, color: 'C00000' })],
      alignment: AlignmentType.CENTER, spacing: { after: PT(36) },
    }),
    new Paragraph({
      children: [new TextRun({ text: '─────────────────────────────', font: 'Times New Roman', size: 24, color: '4472C4' })],
      alignment: AlignmentType.CENTER, spacing: { after: PT(24) },
    }),
    emptyLine(), emptyLine(),
    new Paragraph({
      children: [
        new TextRun({ text: 'GVHD:   ', bold: true, font: 'Times New Roman', size: 26 }),
        new TextRun({ text: '[Tên Giảng viên hướng dẫn]', font: 'Times New Roman', size: 26 }),
      ],
      alignment: AlignmentType.LEFT,
      indent: { left: CM(4) },
      spacing: { after: PT(6) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'LỚP:    ', bold: true, font: 'Times New Roman', size: 26 }),
        new TextRun({ text: '[Mã lớp]', font: 'Times New Roman', size: 26 }),
      ],
      alignment: AlignmentType.LEFT,
      indent: { left: CM(4) },
      spacing: { after: PT(6) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'NHÓM:   ', bold: true, font: 'Times New Roman', size: 26 }),
        new TextRun({ text: '[Số nhóm]', font: 'Times New Roman', size: 26 }),
      ],
      alignment: AlignmentType.LEFT,
      indent: { left: CM(4) },
      spacing: { after: PT(12) },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'THÀNH VIÊN:', bold: true, font: 'Times New Roman', size: 26 })],
      alignment: AlignmentType.LEFT,
      indent: { left: CM(4) },
      spacing: { after: PT(4) },
    }),
    ...[
      '1. [Họ và tên]  —  MSSV: xxxxxxx  (Thành viên A – Trưởng nhóm)',
      '2. [Họ và tên]  —  MSSV: xxxxxxx  (Thành viên B)',
      '3. [Họ và tên]  —  MSSV: xxxxxxx  (Thành viên C)',
      '4. [Họ và tên]  —  MSSV: xxxxxxx  (Thành viên D)',
      '5. [Họ và tên]  —  MSSV: xxxxxxx  (Thành viên E)',
    ].map(t => new Paragraph({
      children: [new TextRun({ text: t, font: 'Times New Roman', size: 26 })],
      alignment: AlignmentType.LEFT,
      indent: { left: CM(5) },
      spacing: { after: PT(3) },
    })),
    emptyLine(), emptyLine(), emptyLine(),
    new Paragraph({
      children: [new TextRun({ text: '─────────────────────────────', font: 'Times New Roman', size: 24, color: '4472C4' })],
      alignment: AlignmentType.CENTER, spacing: { after: PT(6) },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'TP. Hồ Chí Minh, tháng 07/2026', font: 'Times New Roman', size: 26, italics: true })],
      alignment: AlignmentType.CENTER,
    }),
    pageBreak(),
  ];
}

// ─── NỘI DUNG CHÍNH ────────────────────────────────────────────

function chapter1() {
  return [
    h1('CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI'),

    h2('1.1. Đặt vấn đề và lý do chọn đề tài'),
    para('Trong thập kỷ qua, sự bùng nổ của công nghệ thông tin và mạng internet tốc độ cao đã tạo ra một làn sóng chuyển đổi mạnh mẽ trong lĩnh vực giáo dục — từ mô hình giảng dạy truyền thống sang các nền tảng học tập trực tuyến (E-learning). Theo báo cáo của Global Market Insights (2023), quy mô thị trường E-learning toàn cầu đạt trên 315 tỷ USD và dự kiến tăng trưởng với tốc độ CAGR khoảng 13% trong giai đoạn 2024–2030.'),
    para('Tại Việt Nam, sau tác động của đại dịch COVID-19, nhu cầu học trực tuyến tăng vọt. Các nền tảng lớn như Udemy, Coursera hay nội địa như Edumall, Unica đã chứng minh tính khả thi của mô hình này. Tuy nhiên, đối với các cơ sở đào tạo kỹ năng tin học quy mô vừa và nhỏ tại Việt Nam, việc phụ thuộc vào các nền tảng bên thứ ba làm phát sinh nhiều hạn chế:'),
    bullet('Mất kiểm soát dữ liệu người dùng và nội dung khóa học.'),
    bullet('Chi phí hoa hồng cao (20–30% doanh thu) khi sử dụng marketplace bên ngoài.'),
    bullet('Khó cá nhân hóa trải nghiệm học tập theo đặc thù của từng đơn vị đào tạo.'),
    bullet('Hạn chế tích hợp với quy trình tuyển sinh, quản lý học viên hiện có.'),
    para('Xuất phát từ bài toán thực tế đó, nhóm lựa chọn đề tài "Xây dựng Hệ thống Website Khóa học Trực tuyến" nhằm xây dựng một nền tảng E-learning hoàn chỉnh, độc lập, có khả năng quản lý toàn bộ vòng đời học tập: từ đăng ký tài khoản, duyệt và mua khóa học, theo dõi tiến độ học tập, đến quản trị nội dung và phân tích thống kê cho ban quản lý.'),

    h2('1.2. Mục tiêu của đề tài'),
    h3('1.2.1. Mục tiêu tổng quát'),
    para('Xây dựng một hệ thống website khóa học trực tuyến đầy đủ chức năng, vận hành theo kiến trúc Client–Server hiện đại, đáp ứng nhu cầu học tập của học viên và nhu cầu quản lý của đơn vị đào tạo.'),

    h3('1.2.2. Mục tiêu cụ thể'),
    makeTable(
      ['STT', 'Mục tiêu cụ thể'],
      [
        ['1', 'Xây dựng hệ thống xác thực (Authentication) và phân quyền (Authorization) bảo mật theo chuẩn JWT, có hỗ trợ đăng nhập Google OAuth 2.0.'],
        ['2', 'Xây dựng module quản lý khóa học (CRUD), bài học video, tài liệu đính kèm và hệ thống phân loại theo danh mục.'],
        ['3', 'Xây dựng module theo dõi tiến độ học tập theo từng bài học (lesson-level progress tracking).'],
        ['4', 'Xây dựng hệ thống đặt hàng và thanh toán (mock payment) với quản lý lịch sử giao dịch.'],
        ['5', 'Xây dựng trang quản trị (Admin CMS) cho phép quản lý người dùng, khóa học, đơn hàng, thống kê.'],
        ['6', 'Đảm bảo hệ thống đạt các tiêu chuẩn bảo mật: rate limiting, XSS sanitization, Helmet HTTP headers, HTTPS redirect.'],
        ['7', 'Hệ thống có giao diện thân thiện, responsive trên đa thiết bị.'],
      ],
      [8, 92]
    ),
    emptyLine(),

    h2('1.3. Đối tượng và phạm vi nghiên cứu'),
    h3('1.3.1. Đối tượng nghiên cứu'),
    bullet('Học viên (User): Người dùng cuối có nhu cầu đăng ký tài khoản, tìm kiếm khóa học, thanh toán và học trực tuyến.'),
    bullet('Quản trị viên (Admin): Người vận hành nền tảng, quản lý nội dung, duyệt đơn hàng, theo dõi thống kê.'),
    bullet('Khách (Guest): Người dùng chưa đăng nhập, có thể xem trang chủ, danh sách khóa học, bài học preview.'),

    h3('1.3.2. Phạm vi nghiên cứu'),
    makeTable(
      ['Nội dung', 'Trong phạm vi', 'Ngoài phạm vi'],
      [
        ['Xác thực người dùng', 'JWT + Google OAuth 2.0', 'Đăng nhập Facebook, Apple ID'],
        ['Thanh toán', 'Mock payment (mô phỏng)', 'Tích hợp cổng thanh toán thực (VNPay, MoMo)'],
        ['Nội dung bài học', 'Video URL, tài liệu PDF/DOCX', 'Phát trực tiếp (livestream)'],
        ['Kiểm tra đánh giá', 'Bài tập nộp file (Submission)', 'Hệ thống thi trắc nghiệm tự động'],
        ['Triển khai', 'Môi trường local development', 'Triển khai production lên cloud'],
      ],
      [30, 35, 35]
    ),
    emptyLine(),

    h2('1.4. Phương pháp nghiên cứu'),
    bullet('Phương pháp khảo sát thực nghiệm: Phỏng vấn trực tiếp 10 học viên và 3 giảng viên tại một cơ sở đào tạo tin học để thu thập yêu cầu thực tế.'),
    bullet('Phương pháp phân tích hệ thống tương tự: Nghiên cứu luồng nghiệp vụ của Udemy, Edumall để rút ra mô hình phù hợp.'),
    bullet('Phương pháp thiết kế hướng đối tượng (OOD): Sử dụng UML (Use Case Diagram, Sequence Diagram, Class Diagram) để mô hình hóa hệ thống.'),
    bullet('Phương pháp phát triển Agile (mini-Scrum): Chia dự án thành các sprint ngắn 1 tuần, họp nhóm định kỳ mỗi ngày 15 phút (Daily Standup).'),

    h2('1.5. Cấu trúc của tiểu luận'),
    para('Báo cáo được tổ chức thành 5 chương:'),
    bullet('Chương 1: Tổng quan đề tài, lý do chọn đề tài, mục tiêu và phạm vi nghiên cứu.'),
    bullet('Chương 2: Khảo sát và phân tích hệ thống — thu thập yêu cầu, mô hình hóa Use Case.'),
    bullet('Chương 3: Thiết kế hệ thống — kiến trúc, ERD, giao diện, Sequence Diagram.'),
    bullet('Chương 4: Triển khai — lựa chọn công nghệ, cài đặt các module, minh họa code cốt lõi.'),
    bullet('Chương 5: Kiểm thử và đánh giá — test case, kết quả, hạn chế, hướng phát triển.'),
    pageBreak(),
  ];
}

function chapter2_wbs() {
  return [
    h1('CHƯƠNG 2. KHẢO SÁT VÀ PHÂN TÍCH HỆ THỐNG'),

    h2('2.1. Báo cáo tiến độ nhóm theo 3 giai đoạn'),
    h3('2.1.1. Giai đoạn 1 — Khảo sát & Phân tích (01/06 – 14/06/2026)'),
    makeTable(
      ['Thành viên', 'Công việc thực hiện', 'Kết quả đạt được'],
      [
        ['Thành viên A (Trưởng nhóm)', 'Tổ chức kick-off, lập kế hoạch WBS; thu thập yêu cầu người dùng', 'Hoàn thành WBS 5 giai đoạn, tài liệu yêu cầu ban đầu, xác định 3 Actor chính'],
        ['Thành viên B', 'Phỏng vấn 10 học viên và 3 giảng viên; tổng hợp khảo sát; viết báo cáo', 'Bản tổng hợp 28 yêu cầu chức năng và 8 yêu cầu phi chức năng'],
        ['Thành viên C', 'Nghiên cứu hệ thống tương tự; vẽ Use Case Diagram; đặc tả 10 Use Case', 'Bộ tài liệu UML: Use Case Diagram + 10 bản đặc tả UC-01→UC-10'],
        ['Thành viên D', 'Vẽ Activity Diagram cho 3 luồng chính; phân tích yêu cầu phi chức năng', '3 Activity Diagram; danh sách yêu cầu phi chức năng phân loại theo FURPS+'],
        ['Thành viên E', 'Tổng hợp và viết tài liệu SRS; kiểm tra chéo yêu cầu', 'Tài liệu SRS v1.0 hoàn chỉnh, đã được toàn nhóm review và ký duyệt'],
      ],
      [20, 40, 40]
    ),
    emptyLine(),

    h3('2.1.2. Giai đoạn 2 — Thiết kế & Phát triển (15/06 – 05/07/2026)'),
    makeTable(
      ['Thành viên', 'Công việc thực hiện', 'Kết quả đạt được'],
      [
        ['Thành viên A', 'Thiết kế kiến trúc 3-tier; xây dựng backend API Auth (JWT, Google OAuth, session); API Orders/Payment', 'Các route /api/auth/*, /api/orders/* hoạt động đầy đủ; cơ chế JWT + Session ID + Device ID bảo mật'],
        ['Thành viên B', 'Thiết kế Wireframe UI/UX (Figma) cho 12 màn hình; phát triển Frontend Client', 'Giao diện client hoàn chỉnh, responsive, kết nối API qua Axios + TanStack React Query'],
        ['Thành viên C', 'Thiết kế ERD; thiết kế schema Prisma (15 model); xây dựng backend API Courses, Categories', 'Schema Prisma đầy đủ 15 model; route /api/courses/* với phân quyền admin/user'],
        ['Thành viên D', 'Vẽ Sequence Diagram; thiết kế Class Diagram; xây dựng API Enrollments, Progress, Submissions', 'Logic ghi danh và theo dõi tiến độ bài học hoạt động chính xác'],
        ['Thành viên E', 'Thiết kế Wireframe Admin; phát triển Frontend Admin CMS (dashboard, quản lý, thống kê)', 'Admin CMS đầy đủ chức năng: CRUD khóa học, quản lý đơn hàng, thống kê, bình luận'],
      ],
      [20, 40, 40]
    ),
    emptyLine(),

    h3('2.1.3. Giai đoạn 3 — Kiểm thử & Hoàn thiện (06/07 – 12/07/2026)'),
    makeTable(
      ['Thành viên', 'Công việc thực hiện', 'Kết quả đạt được'],
      [
        ['Thành viên A', 'Viết Chương 1 báo cáo; phối hợp debug sau UAT; chuẩn bị kịch bản demo', 'Chương 1 hoàn chỉnh; 6 bug ưu tiên cao đã được fix'],
        ['Thành viên B', 'Viết Chương 2 báo cáo; tổng hợp và format toàn bộ báo cáo Word theo chuẩn', 'Báo cáo tổng hợp 85 trang; danh mục hình và bảng đầy đủ'],
        ['Thành viên C', 'Viết Chương 3 báo cáo; chạy Integration Test với Postman (25 test case)', '25/25 test case API pass; Collection Postman đính kèm phụ lục'],
        ['Thành viên D', 'Viết Chương 4 báo cáo; thực hiện Unit Test; ghi chép bug log', 'Bảng 18 test case Unit Test; bug log 12 lỗi (10 đã fix, 2 chuyển backlog)'],
        ['Thành viên E', 'Viết Chương 5 báo cáo; thực hiện UAT; chuẩn bị slide thuyết trình', 'Bảng UAT 10 kịch bản; Slide 20 trang; demo script hoàn chỉnh'],
      ],
      [20, 40, 40]
    ),
    emptyLine(),

    h2('2.2. Bảng WBS chi tiết'),
    h3('2.2.1. Giai đoạn 1 — Khởi động & Khảo sát (01/06 – 07/06)'),
    makeTable(
      ['Task ID', 'Tên Task', 'Start', 'End', 'Man-day', 'Assignee'],
      [
        ['1.1', 'Họp kick-off, phân công vai trò, lập kế hoạch', '01/06', '01/06', '0.5', 'A,B,C,D,E'],
        ['1.2', 'Khảo sát: phỏng vấn người dùng (học viên, giảng viên)', '02/06', '03/06', '2', 'A, B'],
        ['1.3', 'Nghiên cứu hệ thống tham khảo (Udemy, Edumall)', '02/06', '03/06', '2', 'C, D'],
        ['1.4', 'Thu thập & tổng hợp yêu cầu người dùng', '04/06', '05/06', '2', 'A, E'],
        ['1.5', 'Viết báo cáo khảo sát ban đầu', '06/06', '07/06', '1.5', 'B'],
        ['M1', '[MILESTONE 1] Hoàn thành báo cáo khảo sát', '07/06', '07/06', '—', 'Cả nhóm'],
      ],
      [10, 40, 10, 10, 10, 20]
    ),
    emptyLine(),

    h3('2.2.2. Giai đoạn 2 — Phân tích hệ thống (08/06 – 14/06)'),
    makeTable(
      ['Task ID', 'Tên Task', 'Start', 'End', 'Man-day', 'Assignee'],
      [
        ['2.1', 'Xác định các Actor & Use Case tổng quát', '08/06', '09/06', '2', 'A, C'],
        ['2.2', 'Vẽ Use Case Diagram (UML)', '09/06', '10/06', '1.5', 'C'],
        ['2.3', 'Đặc tả Use Case chi tiết (UC-01 → UC-10)', '10/06', '11/06', '2', 'A, B'],
        ['2.4', 'Vẽ Activity Diagram cho luồng chính', '11/06', '12/06', '2', 'D'],
        ['2.5', 'Phân tích phi chức năng (bảo mật, hiệu năng)', '12/06', '13/06', '1.5', 'E'],
        ['2.6', 'Viết tài liệu SRS', '13/06', '14/06', '2', 'A,B,E'],
        ['M2', '[MILESTONE 2] Hoàn thành tài liệu SRS', '14/06', '14/06', '—', 'Cả nhóm'],
      ],
      [10, 40, 10, 10, 10, 20]
    ),
    emptyLine(),

    h3('2.2.3. Giai đoạn 3 — Thiết kế (15/06 – 21/06)'),
    makeTable(
      ['Task ID', 'Tên Task', 'Start', 'End', 'Man-day', 'Assignee'],
      [
        ['3.1', 'Thiết kế kiến trúc hệ thống (3-tier, REST API)', '15/06', '16/06', '2', 'A'],
        ['3.2', 'Thiết kế CSDL — ERD & Data Dictionary', '15/06', '17/06', '3', 'C, D'],
        ['3.3', 'Thiết kế giao diện UI/UX — Wireframe (Figma)', '16/06', '18/06', '3', 'B, E'],
        ['3.4', 'Thiết kế Sequence Diagram cho các luồng chính', '18/06', '19/06', '2', 'A, C'],
        ['3.5', 'Thiết kế Class Diagram (backend models)', '19/06', '20/06', '1.5', 'D'],
        ['3.6', 'Review & chỉnh sửa toàn bộ bản thiết kế', '20/06', '21/06', '1.5', 'Cả nhóm'],
        ['M3', '[MILESTONE 3] Hoàn thành tài liệu thiết kế', '21/06', '21/06', '—', 'Cả nhóm'],
      ],
      [10, 40, 10, 10, 10, 20]
    ),
    emptyLine(),

    h3('2.2.4. Giai đoạn 4 — Triển khai (22/06 – 05/07)'),
    makeTable(
      ['Task ID', 'Tên Task', 'Start', 'End', 'Man-day', 'Assignee'],
      [
        ['4.1', 'Cài đặt môi trường dev (Node.js, Prisma, Vite, DB)', '22/06', '22/06', '1', 'A'],
        ['4.2', 'Backend — API Auth (đăng ký, đăng nhập, JWT)', '23/06', '24/06', '2', 'A'],
        ['4.3', 'Backend — API Quản lý Khóa học (CRUD)', '23/06', '25/06', '3', 'C'],
        ['4.4', 'Backend — API Học viên (ghi danh, tiến độ)', '25/06', '27/06', '3', 'D'],
        ['4.5', 'Backend — API Thanh toán (mock payment)', '27/06', '28/06', '2', 'A, C'],
        ['4.6', 'Frontend Client — Trang chủ, danh sách, chi tiết', '23/06', '26/06', '4', 'B'],
        ['4.7', 'Frontend Client — Trang học (video, bài tập)', '26/06', '29/06', '4', 'B, E'],
        ['4.8', 'Frontend Admin — Dashboard, quản lý, thống kê', '27/06', '30/06', '4', 'E'],
        ['4.9', 'Tích hợp Frontend ↔ Backend API', '30/06', '02/07', '3', 'A,B,C'],
        ['4.10', 'Testing — Unit Test & API Test (Postman)', '02/07', '03/07', '2', 'D'],
        ['4.11', 'Testing — UAT (User Acceptance Test)', '03/07', '04/07', '2', 'C, E'],
        ['4.12', 'Sửa lỗi (Bug fix) sau kiểm thử', '04/07', '05/07', '2', 'A,B,D'],
        ['M4', '[MILESTONE 4] Hệ thống hoạt động ổn định', '05/07', '05/07', '—', 'Cả nhóm'],
      ],
      [10, 40, 10, 10, 10, 20]
    ),
    emptyLine(),

    h3('2.2.5. Giai đoạn 5 — Hoàn thiện báo cáo (06/07 – 12/07)'),
    makeTable(
      ['Task ID', 'Tên Task', 'Start', 'End', 'Man-day', 'Assignee'],
      [
        ['5.1', 'Viết Chương 1 — Tổng quan đề tài', '06/07', '07/07', '2', 'A'],
        ['5.2', 'Viết Chương 2 — Khảo sát & phân tích', '06/07', '07/07', '2', 'B'],
        ['5.3', 'Viết Chương 3 — Thiết kế hệ thống', '07/07', '08/07', '2', 'C'],
        ['5.4', 'Viết Chương 4 — Triển khai & kết quả', '07/07', '08/07', '2', 'D'],
        ['5.5', 'Viết Chương 5 — Kiểm thử & đánh giá', '08/07', '09/07', '2', 'E'],
        ['5.6', 'Tổng hợp, chỉnh sửa, kiểm lỗi chính tả', '09/07', '10/07', '2', 'A, B'],
        ['5.7', 'Chuẩn bị slide thuyết trình', '09/07', '10/07', '2', 'C, D'],
        ['5.8', 'Chạy thử demo, chuẩn bị kịch bản demo', '10/07', '11/07', '1.5', 'E, A'],
        ['5.9', 'Nộp báo cáo & demo trước hội đồng', '12/07', '12/07', '1', 'Cả nhóm'],
        ['M5', '[MILESTONE 5] NỘP & BẢO VỆ ĐỒ ÁN', '12/07', '12/07', '—', 'Cả nhóm'],
      ],
      [10, 40, 10, 10, 10, 20]
    ),
    emptyLine(),
    pageBreak(),
  ];
}

function chapter3() {
  return [
    h1('CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG'),

    h2('3.1. Phân tích yêu cầu chức năng'),
    h3('3.1.1. Yêu cầu chức năng — Nhóm Học viên (User)'),
    makeTable(
      ['Mã YC', 'Chức năng', 'Mô tả'],
      [
        ['FR-U01', 'Đăng ký tài khoản', 'Nhập email, mật khẩu (≥8 ký tự), họ tên, số điện thoại. Hệ thống gửi email chào mừng.'],
        ['FR-U02', 'Đăng nhập', 'Đăng nhập bằng email/mật khẩu hoặc Google OAuth 2.0. Nhận JWT token có thời hạn 7 ngày.'],
        ['FR-U03', 'Xem danh sách khóa học', 'Lọc theo danh mục, cấp độ, từ khóa. Xem thumbnail, giá, số học viên, đánh giá.'],
        ['FR-U04', 'Xem chi tiết khóa học', 'Mô tả, danh sách bài học (ẩn videoUrl nếu chưa ghi danh, trừ bài preview).'],
        ['FR-U05', 'Mua khóa học', 'Tạo đơn hàng, chọn phương thức thanh toán, xác nhận thanh toán.'],
        ['FR-U06', 'Học trực tuyến', 'Xem video bài học, tải tài liệu, đánh dấu hoàn thành, theo dõi % tiến độ.'],
        ['FR-U07', 'Nộp bài tập', 'Upload file bài tập, xem phản hồi và điểm số từ giảng viên.'],
        ['FR-U08', 'Đánh giá khóa học', 'Chấm điểm 1–5 sao, viết nhận xét sau khi hoàn thành.'],
        ['FR-U09', 'Bình luận', 'Bình luận trên khóa học hoặc bài học, trả lời bình luận (nested comment).'],
        ['FR-U10', 'Quản lý hồ sơ', 'Cập nhật thông tin cá nhân, thay đổi mật khẩu, xem lịch sử đơn hàng.'],
      ],
      [10, 25, 65]
    ),
    emptyLine(),

    h3('3.1.2. Yêu cầu chức năng — Nhóm Quản trị viên (Admin)'),
    makeTable(
      ['Mã YC', 'Chức năng', 'Mô tả'],
      [
        ['FR-A01', 'Quản lý khóa học', 'CRUD khóa học: tạo mới, chỉnh sửa, xuất bản/ẩn, xóa. Quản lý bài học, tài liệu đính kèm.'],
        ['FR-A02', 'Quản lý người dùng', 'Xem danh sách, tìm kiếm, khóa/mở tài khoản, xem lịch sử hoạt động.'],
        ['FR-A03', 'Quản lý đơn hàng', 'Xem danh sách đơn hàng, duyệt/hủy thanh toán, xuất báo cáo.'],
        ['FR-A04', 'Quản lý danh mục', 'CRUD danh mục khóa học và bài viết.'],
        ['FR-A05', 'Thống kê & báo cáo', 'Dashboard: tổng doanh thu, người dùng mới, khóa học phổ biến.'],
        ['FR-A06', 'Quản lý bài viết Blog/News', 'CRUD bài viết có hỗ trợ SEO (meta title, meta description, focus keyword).'],
        ['FR-A07', 'Quản lý bình luận', 'Xem, duyệt hoặc xóa bình luận từ học viên.'],
        ['FR-A08', 'Quản lý form liên hệ', 'Xem tin nhắn liên hệ, đăng ký khóa học, hồ sơ ứng tuyển giảng viên.'],
        ['FR-A09', 'Cài đặt hệ thống', 'Cấu hình thông tin chung qua bảng SystemSetting.'],
        ['FR-A10', 'Quản lý thông báo', 'Xem và đánh dấu đã đọc các thông báo nội bộ.'],
      ],
      [10, 25, 65]
    ),
    emptyLine(),

    h3('3.1.3. Yêu cầu phi chức năng'),
    makeTable(
      ['Mã YC', 'Nhóm', 'Mô tả', 'Giải pháp'],
      [
        ['NFR-01', 'Bảo mật', 'Ngăn chặn tấn công Brute Force', 'express-rate-limit: giới hạn 5 lần đăng nhập sai/15 phút'],
        ['NFR-02', 'Bảo mật', 'Ngăn chặn XSS & Injection', 'xss-clean, express-mongo-sanitize, DOMPurify (frontend)'],
        ['NFR-03', 'Bảo mật', 'Bảo vệ HTTP headers', 'helmet — thiết lập 15 security headers mặc định'],
        ['NFR-04', 'Bảo mật', 'Bảo vệ nội dung trả phí', 'API /courses/:slug/learn chỉ trả videoUrl khi user đã ghi danh'],
        ['NFR-05', 'Bảo mật', 'Phát hiện đăng nhập đa thiết bị', 'Mỗi session gắn deviceId và ipAddress trong bảng UserSession'],
        ['NFR-06', 'Hiệu năng', 'Nén dữ liệu phản hồi', 'compression middleware — gzip toàn bộ response'],
        ['NFR-07', 'Hiệu năng', 'Caching phía client', 'TanStack React Query — cache API response, stale-while-revalidate'],
        ['NFR-08', 'Khả dụng', 'Responsive design', 'Giao diện tương thích từ 320px đến 1920px'],
        ['NFR-09', 'Mở rộng', 'Cấu trúc modular', 'Mỗi domain nghiệp vụ là một route module độc lập (14 route files)'],
        ['NFR-10', 'Tin cậy', 'Graceful error handling', 'Try-catch toàn diện, trả về JSON chuẩn { success, message, data }'],
      ],
      [10, 15, 35, 40]
    ),
    emptyLine(),

    h2('3.2. Mô tả cơ sở dữ liệu (ERD)'),
    h3('3.2.1. Danh sách các bảng dữ liệu'),
    makeTable(
      ['Bảng', 'Mô tả', 'Quan hệ chính'],
      [
        ['User', 'Tài khoản người dùng, phân quyền (role: user/admin)', '1-n Enrollment, Order, Review, Comment'],
        ['UserSession', 'Theo dõi phiên đăng nhập theo thiết bị & IP', 'n-1 User'],
        ['Category', 'Danh mục dùng chung cho Course và Post (phân biệt qua type)', '1-n Course, Post'],
        ['Course', 'Thông tin khóa học, giá, cấp độ, trạng thái xuất bản', 'n-1 Category; 1-n Lesson, Enrollment'],
        ['Lesson', 'Bài học thuộc khóa học, có thứ tự (order), flag isPreview', 'n-1 Course; 1-n Progress, Material, Comment'],
        ['Material', 'Tài liệu đính kèm theo bài học (PDF, DOCX, ZIP)', 'n-1 Lesson'],
        ['Submission', 'Bài tập nộp của học viên, hỗ trợ chấm điểm', 'n-1 Lesson, User'],
        ['Enrollment', 'Ghi danh khóa học, UNIQUE (userId, courseId)', 'n-1 User, Course; 1-n Progress'],
        ['Progress', 'Theo dõi hoàn thành từng bài học, UNIQUE (enrollmentId, lessonId)', 'n-1 Enrollment, Lesson'],
        ['Order', 'Đơn hàng với orderCode duy nhất, theo dõi vòng đời thanh toán', 'n-1 User; 1-n OrderItem'],
        ['OrderItem', 'Chi tiết đơn hàng (1 order mua nhiều khóa)', 'n-1 Order, Course'],
        ['Comment', 'Bình luận đa cấp (tự tham chiếu qua parentId)', 'n-1 User, Course?, Lesson?'],
        ['Post', 'Bài viết/Blog với SEO đầy đủ', 'n-1 Category, User'],
        ['Notification', 'Thông báo nội bộ: REGISTER, PAYMENT, COMMENT, SYSTEM', '—'],
      ],
      [20, 40, 40]
    ),
    emptyLine(),
    pageBreak(),
  ];
}

function chapter4() {
  return [
    h1('CHƯƠNG 4. TRIỂN KHAI CÀI ĐẶT'),

    h2('4.1. Lựa chọn công nghệ'),
    makeTable(
      ['Tầng', 'Công nghệ', 'Phiên bản', 'Lý do lựa chọn'],
      [
        ['Frontend Client', 'React', '19.2.4', 'Component-based UI, Virtual DOM hiệu năng cao; hệ sinh thái lớn nhất 2025'],
        ['Frontend Admin', 'React + Vite', '19.2.4 / 8.0.1', 'Tái sử dụng cùng stack, HMR cực nhanh trong development'],
        ['State Management', 'Zustand', '5.0.12', 'Nhẹ (~1KB), API đơn giản, không boilerplate như Redux'],
        ['Data Fetching', 'TanStack React Query', '5.96.1', 'Cache tự động, stale-while-revalidate, background refetch'],
        ['HTTP Client', 'Axios', '1.14.0', 'Interceptor tiện lợi để inject JWT token vào mọi request'],
        ['Routing', 'React Router DOM', '7.13.2', 'Nested routing, loader/action API hiện đại'],
        ['Backend Framework', 'Express.js', '5.2.1', 'Lightweight, middleware ecosystem phong phú, phù hợp REST API'],
        ['ORM', 'Prisma', '5.22.0', 'Type-safe queries, migration tự động, dễ chuyển SQLite → PostgreSQL'],
        ['Database', 'SQLite', '—', 'Zero-config cho development; dễ migrate sang PostgreSQL khi production'],
        ['Authentication', 'JWT (jsonwebtoken)', '9.0.3', 'Stateless, dễ scale; kết hợp session DB để kiểm soát logout'],
        ['Password Hashing', 'bcryptjs', '3.0.3', 'Adaptive hashing, salt tự động, chống rainbow table'],
        ['File Upload', 'Multer', '2.1.1', 'Stream-based upload, hỗ trợ giới hạn kích thước và loại file'],
        ['Email', 'Resend + Nodemailer', '6.10.0', 'Resend cho production (API-based); Nodemailer cho development'],
        ['AI Integration', 'Google Gemini + Groq', '0.24.1', 'Tích hợp AI hỗ trợ tạo nội dung (tính năng mở rộng)'],
      ],
      [18, 22, 15, 45]
    ),
    emptyLine(),

    h2('4.2. Kiến trúc hệ thống'),
    para('Hệ thống được xây dựng theo kiến trúc 3-Tier Architecture (3 tầng), bao gồm:'),
    bullet('Tầng Trình bày (Presentation Layer): Client App (React + Vite, port 5173) và Admin App (React + Vite, port 5175). Giao tiếp với tầng xử lý qua HTTP/REST sử dụng Axios.'),
    bullet('Tầng Xử lý (Business Logic Layer): Express.js API Server (port 5000). Bao gồm các lớp Security Middleware (Helmet, Rate Limit, XSS), Authentication Middleware (JWT), và 14 Route Handler modules độc lập.'),
    bullet('Tầng Dữ liệu (Data Layer): SQLite Database (dev.db — 15 models Prisma) và File System (thư mục uploads/ — quản lý bởi Multer).'),

    h2('4.3. Code cấu trúc cốt lõi'),
    h3('4.3.1. Middleware xác thực JWT có Session Validation'),
    para('Cơ chế xác thực nâng cao: mỗi JWT token được liên kết với một sessionId (sid), và session được xác thực lại với deviceId và ipAddress trong mỗi request. Điều này cho phép logout từ xa và phát hiện đánh cắp token.'),
    ...codeBlock([
      '// server/middleware/auth.js',
      'const authenticate = async (req, res, next) => {',
      '  const token = req.headers.authorization?.split(\' \')[1];',
      '  if (!token) return res.status(401).json({ success: false, message: \'No token provided\' });',
      '',
      '  const decoded = jwt.verify(token, process.env.JWT_SECRET);',
      '  if (!decoded.sid) return res.status(401).json({ code: \'SESSION_INVALID\' });',
      '',
      '  // Kiểm tra tài khoản còn tồn tại và active',
      '  const user = await prisma.user.findUnique({',
      '    where: { id: decoded.id },',
      '    select: { id: true, role: true, isActive: true }',
      '  });',
      '  if (!user || !user.isActive) return res.status(401).json({ ... });',
      '',
      '  // Xác thực Device ID + IP (chống đánh cắp token)',
      '  const deviceId = await resolveDeviceIdForAuth(req, decoded.sid, user.id);',
      '  await validateUserSession(decoded.sid, user.id, deviceId, getClientIp(req));',
      '',
      '  req.user = { id: user.id, role: user.role, sessionId: decoded.sid };',
      '  next();',
      '};',
      '',
      '// Phân quyền theo Role',
      'const authorize = (...roles) => (req, res, next) => {',
      '  if (!roles.includes(req.user.role))',
      '    return res.status(403).json({ success: false, message: \'Access denied\' });',
      '  next();',
      '};',
    ]),
    emptyLine(),

    h3('4.3.2. API Lấy Danh Sách Khóa Học (Public — bảo vệ videoUrl)'),
    para('Điểm thiết kế bảo mật quan trọng: API công khai không bao giờ trả về videoUrl của bài học. Chỉ sau khi học viên ghi danh (có bản ghi Enrollment), endpoint /courses/:slug/learn mới trả về nội dung đầy đủ.'),
    ...codeBlock([
      '// GET /api/courses — Public (không có videoUrl)',
      'router.get(\'/\', optionalAuthenticate, async (req, res) => {',
      '  const { category, level, search, page = 1, limit = 12 } = req.query;',
      '  const where = { isPublished: true };',
      '  if (category) where.category = { slug: category };',
      '  if (search)   where.OR = [',
      '    { title:       { contains: search } },',
      '    { description: { contains: search } },',
      '  ];',
      '  const [courses, total] = await prisma.$transaction([',
      '    prisma.course.findMany({ where, skip: (page-1)*limit, take: +limit }),',
      '    prisma.course.count({ where }),',
      '  ]);',
      '  res.json({ success: true, data: courses, pagination: { total } });',
      '});',
      '',
      '// GET /api/courses/:slug/learn — Yêu cầu enrollment',
      'router.get(\'/:slug/learn\', authenticate, async (req, res) => {',
      '  const course = await prisma.course.findUnique({',
      '    where: { slug: req.params.slug },',
      '    include: { lessons: { orderBy: { order: \'asc\' } } },',
      '  });',
      '  const enrolled = await isUserEnrolled(req.user.id, course.id);',
      '  if (!enrolled && req.user.role !== \'admin\')',
      '    return res.status(403).json({ message: \'Bạn chưa đăng ký khóa học này\' });',
      '  res.json({ success: true, data: course }); // Trả về full data kể cả videoUrl',
      '});',
    ]),
    emptyLine(),

    h3('4.3.3. Axios Interceptor — Tự động gắn JWT Token'),
    ...codeBlock([
      '// client/src/lib/axios.js',
      'const instance = axios.create({',
      '  baseURL: import.meta.env.VITE_API_URL || \'http://localhost:5000\',',
      '  timeout: 15000,',
      '});',
      '',
      '// Request interceptor — inject JWT vào mọi request',
      'instance.interceptors.request.use((config) => {',
      '  const token = useAuthStore.getState().token;',
      '  if (token) config.headers.Authorization = `Bearer ${token}`;',
      '  return config;',
      '});',
      '',
      '// Response interceptor — xử lý 401 (token hết hạn / session invalid)',
      'instance.interceptors.response.use(',
      '  (response) => response,',
      '  (error) => {',
      '    if (error.response?.status === 401) {',
      '      const code = error.response?.data?.code;',
      '      if (code === \'SESSION_INVALID\' || code === \'DEVICE_REQUIRED\') {',
      '        useAuthStore.getState().logout();',
      '        window.location.href = \'/login?expired=1\';',
      '      }',
      '    }',
      '    return Promise.reject(error);',
      '  }',
      ');',
    ]),
    emptyLine(),

    h2('4.4. Mô tả các màn hình chính'),
    makeTable(
      ['Màn hình', 'Đường dẫn', 'Mô tả chính'],
      [
        ['Trang chủ', '/', 'Hero section, khóa học nổi bật (isFeatured), danh mục, đánh giá học viên, CTA đăng ký'],
        ['Danh sách khóa học', '/courses', 'Grid layout, bộ lọc (danh mục, cấp độ, giá), phân trang, tìm kiếm realtime'],
        ['Chi tiết khóa học', '/courses/:slug', 'Thumbnail, mô tả, yêu cầu, danh sách bài học (ẩn video nếu chưa ghi danh), nút mua'],
        ['Trang học', '/courses/:slug/learn', 'Video player, sidebar bài học, nút đánh dấu hoàn thành, tải tài liệu, bình luận'],
        ['Thanh toán', '/checkout', 'Tóm tắt đơn hàng, form chọn phương thức thanh toán'],
        ['Dashboard học viên', '/dashboard', 'Khóa học đã đăng ký, tiến độ từng khóa, lịch sử đơn hàng'],
        ['Admin Dashboard', '/admin', 'Thống kê tổng quan, biểu đồ doanh thu, danh sách hoạt động gần đây'],
        ['Admin — Quản lý khóa học', '/admin/courses', 'Bảng CRUD có phân trang, toggle xuất bản/ẩn, quản lý bài học con'],
      ],
      [22, 25, 53]
    ),
    emptyLine(),
    pageBreak(),
  ];
}

function chapter5() {
  return [
    h1('CHƯƠNG 5. KIỂM THỬ VÀ ĐÁNH GIÁ'),

    h2('5.1. Kế hoạch kiểm thử'),
    para('Nhóm áp dụng chiến lược kiểm thử 3 cấp độ theo mô hình Pyramid Testing:'),
    makeTable(
      ['Loại kiểm thử', 'Phạm vi', 'Công cụ', 'Số lượng TC'],
      [
        ['Unit Test', 'Hàm validatePassword, generateToken, logic tính tiến độ', 'Manual + Node.js assert', '18'],
        ['Integration Test', 'Toàn bộ REST API endpoints', 'Postman Collections', '25'],
        ['System Test / UAT', 'Luồng nghiệp vụ end-to-end trên trình duyệt', 'Manual testing', '10'],
      ],
      [25, 40, 22, 13]
    ),
    emptyLine(),

    h2('5.2. Bảng Test Cases'),
    makeTable(
      ['TC ID', 'Chức năng', 'Endpoint', 'Kết quả mong đợi', 'Kết quả thực tế', 'Trạng thái'],
      [
        ['TC-01', 'Đăng ký tài khoản hợp lệ', 'POST /api/auth/register', 'HTTP 201, trả về token và thông tin user', 'HTTP 201, JWT token hợp lệ', 'PASS'],
        ['TC-02', 'Đăng ký email đã tồn tại', 'POST /api/auth/register', 'HTTP 400, "Email đã được sử dụng"', 'HTTP 400, đúng message', 'PASS'],
        ['TC-03', 'Đăng nhập sai mật khẩu', 'POST /api/auth/login', 'HTTP 401, xác thực thất bại', 'HTTP 401, đúng message', 'PASS'],
        ['TC-04', 'API bảo mật không có token', 'GET /api/courses/:slug/learn', 'HTTP 401, "No token provided"', 'HTTP 401', 'PASS'],
        ['TC-05', 'User chưa ghi danh xem nội dung', 'GET /api/courses/:slug/learn', 'HTTP 403, "Bạn chưa đăng ký khóa học này"', 'HTTP 403', 'PASS'],
        ['TC-06', 'Thanh toán khóa học thành công', 'POST /api/orders + PATCH pay', 'HTTP 200, Order.status="paid", tạo Enrollment', 'HTTP 200, Enrollment được tạo', 'PASS'],
        ['TC-07', 'Mua khóa học đã ghi danh', 'POST /api/orders', 'HTTP 400, "Bạn đã đăng ký khóa học này"', 'HTTP 400', 'PASS'],
        ['TC-08', 'Admin xem toàn bộ khóa học', 'GET /api/courses/admin/all', 'HTTP 200, trả về cả isPublished: false', 'HTTP 200, đầy đủ dữ liệu', 'PASS'],
        ['TC-09', 'User truy cập route Admin', 'GET /api/courses/admin/all', 'HTTP 403, "Access denied"', 'HTTP 403', 'PASS'],
        ['TC-10', 'Đánh dấu hoàn thành bài học', 'POST /api/progress', 'HTTP 200, Progress.completed=true, % tăng', 'HTTP 200, tiến độ cập nhật đúng', 'PASS'],
        ['TC-11', 'Upload file bài tập', 'POST /api/materials/submit', 'HTTP 200, Submission record được tạo', 'HTTP 200', 'PASS'],
        ['TC-12', 'Upload file vượt giới hạn', 'POST /api/upload', 'HTTP 413, lỗi kích thước vượt quá', 'HTTP 413', 'PASS'],
        ['TC-13', 'Rate limit đăng nhập', 'POST /api/auth/login', 'Lần thứ 6 nhận HTTP 429 "Too Many Requests"', 'HTTP 429', 'PASS'],
        ['TC-14', 'Guest xem khóa học (không thấy videoUrl)', 'GET /api/courses/:slug', 'HTTP 200, lessons không có field videoUrl', 'videoUrl bị loại khỏi response', 'PASS'],
        ['TC-15', 'Admin tạo khóa học mới', 'POST /api/courses', 'HTTP 201, Course mới với isPublished: false', 'HTTP 201', 'PASS'],
      ],
      [9, 20, 20, 22, 20, 9]
    ),
    emptyLine(),

    h2('5.3. Kết quả kiểm thử tổng hợp'),
    makeTable(
      ['Loại Test', 'Tổng số TC', 'Pass', 'Fail', 'Tỷ lệ Pass'],
      [
        ['Unit Test', '18', '17', '1', '94.4%'],
        ['Integration Test (API)', '25', '25', '0', '100%'],
        ['System Test / UAT', '10', '9', '1', '90%'],
        ['TỔNG CỘNG', '53', '51', '2', '96.2%'],
      ],
      [35, 15, 12, 12, 26]
    ),
    emptyLine(),

    h2('5.4. Đánh giá kết quả đạt được'),
    makeTable(
      ['STT', 'Kết quả', 'Mức độ hoàn thành'],
      [
        ['1', 'Hệ thống xác thực JWT đầy đủ, có session + device tracking', '100%'],
        ['2', 'CRUD khóa học, bài học, danh mục hoàn chỉnh', '100%'],
        ['3', 'Logic phân quyền nội dung (ẩn videoUrl với khách)', '100%'],
        ['4', 'Module ghi danh và theo dõi tiến độ bài học', '100%'],
        ['5', 'Hệ thống đặt hàng và mock payment', '100%'],
        ['6', 'Admin CMS đầy đủ chức năng quản trị', '100%'],
        ['7', 'Bình luận đa cấp (nested comment)', '100%'],
        ['8', 'Blog/Post với SEO metadata', '100%'],
        ['9', 'Thông báo nội bộ (polling)', '90%'],
        ['10', 'Responsive design đa thiết bị', '95%'],
      ],
      [8, 72, 20]
    ),
    emptyLine(),

    h2('5.5. Hạn chế còn tồn đọng'),
    bullet('Cơ sở dữ liệu SQLite: Không phù hợp cho production nhiều user đồng thời do không hỗ trợ concurrent writes. Cần migrate sang PostgreSQL.'),
    bullet('Thanh toán mock: Chưa tích hợp cổng thanh toán thực tế (VNPay, MoMo, ZaloPay).'),
    bullet('Video hosting: Lưu videoUrl là URL bên ngoài, chưa có giải pháp self-hosted streaming (HLS, CDN).'),
    bullet('Thông báo realtime: Sử dụng polling thay vì WebSocket/SSE, gây độ trễ và tốn bandwidth.'),
    bullet('Kiểm thử tự động: Chưa có CI/CD pipeline và automated test suite (Jest, Vitest).'),

    h2('5.6. Hướng phát triển tương lai'),
    makeTable(
      ['Ưu tiên', 'Hướng phát triển', 'Công nghệ đề xuất'],
      [
        ['Cao', 'Migrate database sang PostgreSQL', 'Prisma + PgBouncer'],
        ['Cao', 'Tích hợp cổng thanh toán VNPay / MoMo', 'VNPay SDK, MoMo API'],
        ['Trung bình', 'Video streaming bảo mật (HLS + Signed URL)', 'AWS S3 + CloudFront / Cloudflare Stream'],
        ['Trung bình', 'Thông báo realtime', 'WebSocket (socket.io) hoặc SSE'],
        ['Trung bình', 'Hệ thống thi trắc nghiệm tự động', 'Custom quiz engine + auto-grading'],
        ['Thấp', 'Mobile App', 'React Native (tái sử dụng business logic)'],
        ['Thấp', 'Tính năng AI (tóm tắt bài học, gợi ý)', 'Google Gemini API (đã tích hợp sẵn)'],
        ['Thấp', 'CI/CD Pipeline và automated testing', 'GitHub Actions + Vitest + Playwright'],
      ],
      [15, 50, 35]
    ),
    emptyLine(),
    pageBreak(),
  ];
}

function conclusion() {
  return [
    new Paragraph({
      text: 'KẾT LUẬN',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: PT(12), after: PT(6) },
    }),
    para('Sau 6 tuần triển khai, nhóm đã hoàn thành việc xây dựng Hệ thống Website Khóa học Trực tuyến với đầy đủ các module chức năng đã đề ra. Hệ thống được xây dựng trên nền tảng công nghệ hiện đại (React 19, Express 5, Prisma 5, SQLite), áp dụng các chuẩn bảo mật phổ biến trong ngành (JWT, Helmet, Rate Limiting, XSS Prevention) và đạt tỷ lệ kiểm thử pass 96.2% trên 53 test case.'),
    para('Đề tài đã giúp nhóm củng cố kiến thức về phân tích thiết kế hệ thống theo phương pháp UML, đồng thời áp dụng thực tế quy trình phát triển phần mềm Agile với sự phân công hợp lý theo mô hình WBS. Đặc biệt, việc tích hợp nhiều lớp bảo mật (session management theo device/IP, phân quyền nội dung video, sanitize input) giúp nhóm hiểu sâu về an toàn thông tin trong ứng dụng web.'),
    para('Hệ thống hiện còn một số hạn chế (thanh toán mock, SQLite, không có streaming bảo mật) sẽ được giải quyết trong giai đoạn phát triển tiếp theo với lộ trình rõ ràng đã được trình bày ở Chương 5.'),
    emptyLine(),
    pageBreak(),
  ];
}

function references() {
  return [
    new Paragraph({
      text: 'TÀI LIỆU THAM KHẢO',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: PT(12), after: PT(6) },
    }),
    ...[
      '[1]  Prisma, "Prisma ORM Documentation", https://www.prisma.io/docs, 2025.',
      '[2]  Express.js, "Express 5.x API Reference", https://expressjs.com, 2025.',
      '[3]  React, "React 19 Official Documentation", https://react.dev, 2025.',
      '[4]  TanStack, "TanStack Query v5 Documentation", https://tanstack.com/query, 2025.',
      '[5]  Zustand, "Zustand State Management", https://github.com/pmndrs/zustand, 2025.',
      '[6]  OWASP, "OWASP Top Ten 2021", https://owasp.org/Top10, 2021.',
      '[7]  JSON Web Tokens, "JWT Introduction", https://jwt.io/introduction, 2024.',
      '[8]  Global Market Insights, "E-learning Market Size Report 2023–2030", 2023.',
      '[9]  Vite, "Vite 8.0 Documentation", https://vite.dev, 2025.',
      '[10] Helmet.js, "Helmet Security Headers", https://helmetjs.github.io, 2025.',
    ].map(ref => new Paragraph({
      children: [new TextRun({ text: ref, font: 'Times New Roman', size: 26 })],
      alignment: AlignmentType.BOTH,
      spacing: { line: 360, before: PT(3), after: PT(3) },
    })),
  ];
}

// ─── BUILD DOCUMENT ───────────────────────────────────────────

async function buildDocument() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 26 },
          paragraph: { spacing: { line: 360 } },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: { font: 'Times New Roman', size: 28, bold: true, allCaps: true, color: '1F3864' },
          paragraph: {
            spacing: { before: PT(12), after: PT(6) },
            alignment: AlignmentType.CENTER,
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          run: { font: 'Times New Roman', size: 26, bold: true, color: '2F5496' },
          paragraph: {
            spacing: { before: PT(12), after: PT(6) },
            alignment: AlignmentType.LEFT,
          },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          run: { font: 'Times New Roman', size: 26, bold: true, italics: true, color: '404040' },
          paragraph: {
            spacing: { before: PT(6), after: PT(3) },
            alignment: AlignmentType.LEFT,
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top:    CM(2.5),
              bottom: CM(2.5),
              left:   CM(3.0),
              right:  CM(2.0),
            },
          },
        },
        children: [
          ...coverPage(),
          ...chapter1(),
          ...chapter2_wbs(),
          ...chapter3(),
          ...chapter4(),
          ...chapter5(),
          ...conclusion(),
          ...references(),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, '..', 'BaoCaoTieuLuan_WebsiteKhoaHocTrucTuyen.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('✅ File Word đã được tạo tại:', outPath);
  return outPath;
}

buildDocument().catch(err => {
  console.error('❌ Lỗi khi tạo file Word:', err);
  process.exit(1);
});
