/**
 * 2 bài viết: Cấu trúc đề thi MOS & IC3
 * Nguồn tham khảo: IIG Việt Nam (https://iigvietnam.com/bai-thi-mos/, https://iigvietnam.com/bai-thi-ic3/)
 * Ảnh mẫu chứng chỉ / phiếu điểm lấy từ trang IIG và lưu local tại /blog/
 */

const SITE = 'https://thangtinhoc.edu.vn';

function tocFromHeadings(html) {
  const toc = [];
  const re = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]*>/g, '').trim();
    const id = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    toc.push({ id, text, level: Number(m[1]) });
  }
  return toc;
}

const postsHtml = {
  'cau-truc-de-thi-mos': `
<p><strong>Cấu trúc đề thi MOS</strong> (Microsoft Office Specialist) là thông tin quan trọng nếu bạn đang luyện Word, Excel hay PowerPoint để lấy chứng chỉ quốc tế. Bài viết tóm tắt dạng đề Multi-Project, thời gian, điểm đạt và các cấp độ — dựa trên thông tin chính thức từ <a href="https://iigvietnam.com/bai-thi-mos/" target="_blank" rel="noopener noreferrer">IIG Việt Nam</a>.</p>
<figure class="bd-figure"><img src="/blog/mos-banner.jpg" alt="Chứng chỉ MOS Microsoft Office Specialist" loading="lazy" /><figcaption>MOS — chứng chỉ tin học văn phòng Microsoft (nguồn IIG Việt Nam)</figcaption></figure>

<h2>MOS là gì?</h2>
<p><strong>MOS (Microsoft Office Specialist)</strong> là bài thi kỹ năng Tin học Văn phòng do Certiport (Hoa Kỳ) triển khai, áp dụng tại hơn 150 quốc gia. Bài thi thực hiện trực tuyến, đã được Việt hóa, và chứng chỉ do Microsoft cấp — có giá trị toàn cầu.</p>
<p>Tại Việt Nam, chứng chỉ MOS được Bộ Thông tin và Truyền thông công nhận tương đương chuẩn kỹ năng CNTT nâng cao theo thông tư 03/BTTTT-CNTT. Nhiều trường THPT, cao đẳng, đại học và doanh nghiệp dùng MOS làm chuẩn đầu ra hoặc tiêu chí tuyển dụng.</p>

<h2>Các cấp độ chứng chỉ MOS</h2>
<ul>
<li><strong>Specialist:</strong> Kỹ năng cơ bản Word, Excel, PowerPoint, Access, Outlook.</li>
<li><strong>Expert:</strong> Kỹ năng nâng cao — Word Expert, Excel Expert, Access Expert.</li>
<li><strong>Master (MOS 2016):</strong> Cần 4 bài: Word Expert, Excel Expert, PowerPoint và 1 trong 2 môn Outlook hoặc Access.</li>
<li><strong>Microsoft Office Specialist – Expert (MOS 2019 / Microsoft 365 Apps):</strong> Đạt Associate + 2 trong 3 chứng chỉ Word Expert, Excel Expert, Access Expert.</li>
</ul>

<h2>Cấu trúc đề thi MOS (bảng tóm tắt)</h2>
<p>Hầu hết các môn MOS hiện hành đều theo dạng <strong>Multi-Project</strong>, thời lượng <strong>50 phút</strong>, thang điểm <strong>1000</strong>, điểm đạt <strong>700</strong>.</p>
<table>
<thead>
<tr><th>Nội dung thi</th><th>Dạng bài</th><th>Thời gian</th><th>Điểm tối đa</th><th>Điểm đạt</th></tr>
</thead>
<tbody>
<tr><td>MOS Word / Excel / PowerPoint 2016 Specialist</td><td>Multi-Project</td><td>50 phút</td><td>1000</td><td>700</td></tr>
<tr><td>MOS Outlook / Access 2016 Specialist</td><td>Multi-Project</td><td>50 phút</td><td>1000</td><td>700</td></tr>
<tr><td>MOS Word / Excel 2016 Expert</td><td>Multi-Project</td><td>50 phút</td><td>1000</td><td>700</td></tr>
<tr><td>MOS Word / Excel / PowerPoint (Office 2019 / Microsoft 365 Apps)</td><td>Multi-Project</td><td>50 phút</td><td>1000</td><td>700</td></tr>
<tr><td>MOS Outlook (Office 2019)</td><td>Multi-Project</td><td>50 phút</td><td>1000</td><td>700</td></tr>
<tr><td>MOS Access Expert / Word Expert / Excel Expert (2019 / 365)</td><td>Multi-Project</td><td>50 phút</td><td>1000</td><td>700</td></tr>
</tbody>
</table>

<h2>Dạng bài Multi-Project là gì?</h2>
<p><strong>Multi-Project</strong> nghĩa là thí sinh thực hiện các tác vụ ngay trong cửa sổ bài thi (<em>Exam Window</em>), trên môi trường gần với Microsoft Office thật.</p>
<ul>
<li>Mỗi bài thi thường có từ <strong>5–8 dự án (Projects)</strong>.</li>
<li>Mỗi Project có từ <strong>1–7 tác vụ (Tasks)</strong>.</li>
<li>Bạn phải vận dụng kỹ năng (định dạng, công thức, slide…) để hoàn thành đúng yêu cầu đề.</li>
</ul>
<div class="highlight"><p><strong>Gợi ý luyện thi:</strong> Làm quen môi trường đề bằng <a href="/dich-vu#gmetrix">GMetrix</a> — phần mềm ôn luyện chính thức của Certiport — trước khi đăng ký thi thật.</p></div>

<h2>Phiếu điểm và chứng chỉ MOS</h2>
<p>Thí sinh biết kết quả ngay sau khi thi. Đạt từ <strong>700/1000</strong> trở lên sẽ nhận chứng chỉ MOS do Microsoft cấp. Chứng chỉ có giá trị sử dụng <strong>5 năm</strong> kể từ ngày cấp.</p>
<figure class="bd-figure"><img src="/blog/mos-phieu-diem.png" alt="Mẫu phiếu điểm bài thi MOS" loading="lazy" /><figcaption>Mẫu phiếu điểm MOS (nguồn IIG Việt Nam)</figcaption></figure>
<ul>
<li><strong>Bản mềm:</strong> tải qua tài khoản Certiport cá nhân.</li>
<li><strong>Bản cứng:</strong> gửi từ Microsoft Hoa Kỳ về Việt Nam; nhận tại địa điểm đăng ký thi.</li>
<li>Có thể kiểm tra xác thực tại <a href="https://www.verify.certiport.com" target="_blank" rel="noopener noreferrer">verify.certiport.com</a>.</li>
<li>Thi lại được nếu chưa đạt — các lần thi phải dùng cùng một tài khoản.</li>
</ul>
<figure class="bd-figure"><img src="/blog/mos-chung-chi.jpg" alt="Mẫu chứng chỉ MOS Microsoft" loading="lazy" /><figcaption>Mẫu chứng chỉ MOS</figcaption></figure>
<figure class="bd-figure"><img src="/blog/mos-mau-chung-chi.jpg" alt="Mẫu chứng chỉ MOS bản cứng" loading="lazy" /><figcaption>Mẫu chứng chỉ MOS (bản cứng)</figcaption></figure>

<h2>Checklist trước khi thi MOS</h2>
<ul>
<li>Chọn đúng phiên bản: Office 2016, 2019 hay Microsoft 365 Apps.</li>
<li>Ôn đúng môn: Word / Excel / PowerPoint (Specialist hoặc Expert).</li>
<li>Luyện Multi-Project trên GMetrix đến khi tự tin trong 50 phút.</li>
<li>Đăng ký thi qua đơn vị ủy quyền (ví dụ IIG Việt Nam) và giữ một tài khoản Certiport duy nhất.</li>
</ul>

<h2>Câu Hỏi Thường Gặp</h2>
<h3>Đề thi MOS có trắc nghiệm không?</h3>
<p>Không. Đề theo dạng Multi-Project — làm thao tác thực tế trên Office trong Exam Window.</p>
<h3>Bao lâu thì biết điểm?</h3>
<p>Biết kết quả ngay sau khi hoàn thành bài thi.</p>
<h3>Điểm bao nhiêu là đạt?</h3>
<p>Từ 700/1000 điểm trở lên.</p>
<h3>Nên luyện thi MOS ở đâu?</h3>
<p>Có thể luyện với GMetrix và lộ trình kèm 1 kèm 1 tại <a href="/dich-vu#mos">Thắng Tin Học — luyện thi MOS</a>.</p>

<h2>Kết luận</h2>
<p>Cấu trúc đề thi MOS khá thống nhất: <strong>Multi-Project · 50 phút · 1000 điểm · đạt từ 700</strong>. Hiểu rõ dạng đề giúp bạn ôn đúng trọng tâm thay vì học lan man. Nguồn chi tiết chính thức: <a href="https://iigvietnam.com/bai-thi-mos/" target="_blank" rel="noopener noreferrer">iigvietnam.com/bai-thi-mos</a>.</p>
<p><a href="/?enroll=hoc">Đăng ký học / luyện thi MOS</a> · <a href="/dich-vu#gmetrix">Xem GMetrix &amp; cấu trúc thi</a> · <a href="/lien-he">Liên hệ tư vấn</a></p>
<p>#MOS #CauTrucDeThiMOS #LuyenThiMOS #GMetrix #MicrosoftOffice #ThangTinHoc</p>
`,

  'cau-truc-de-thi-ic3': `
<p><strong>Cấu trúc đề thi IC3</strong> (Digital Literacy Certification) giúp bạn nắm rõ 3 cấp độ GS6, 7 chuyên đề và cách nhận chứng chỉ. Bài viết tổng hợp theo thông tin chính thức từ <a href="https://iigvietnam.com/bai-thi-ic3/" target="_blank" rel="noopener noreferrer">IIG Việt Nam</a>.</p>
<figure class="bd-figure"><img src="/blog/ic3-banner.jpg" alt="Chứng chỉ IC3 Digital Literacy Certification" loading="lazy" /><figcaption>IC3 — chứng chỉ năng lực số quốc tế (nguồn IIG Việt Nam)</figcaption></figure>

<h2>IC3 là gì?</h2>
<p><strong>IC3 (Digital Literacy Certification)</strong> là bài thi quốc tế đánh giá kiến thức và khả năng sử dụng máy tính, phần mềm và Internet do Certiport (Hoa Kỳ) cung cấp. Bài thi phản ánh kỹ năng nền tảng cần thiết cho học tập, nghề nghiệp và đời sống số.</p>
<p>IC3 phổ biến tại hơn <strong>150</strong> quốc gia, trung bình khoảng <strong>2 triệu</strong> lượt thi mỗi năm. Tại Việt Nam, chứng chỉ IC3 được Bộ Thông tin và Truyền thông công nhận tương đương chuẩn kỹ năng CNTT <strong>cơ bản</strong> theo thông tư 03/BTTTT-CNTT.</p>

<h2>Phiên bản IC3 GS6</h2>
<p>Hiện nay IC3 triển khai phiên bản <strong>IC3 GS6</strong> (Global Standard 6) — tiêu chuẩn năng lực số cập nhật, xây dựng dựa trên chuẩn ISTE (Hoa Kỳ). Nội dung thi trên nền tảng Windows 10 và Office 365, bổ sung hiểu biết nâng cao về năng lực kỹ thuật số.</p>
<table>
<thead><tr><th>Nội dung</th><th>IC3 GS6</th></tr></thead>
<tbody>
<tr><td>Chuẩn kỹ năng</td><td>GS6 (Global Standard 6)</td></tr>
<tr><td>Nền tảng</td><td>Windows 10 &amp; Office 365</td></tr>
<tr><td>Điểm nhấn</td><td>Cập nhật năng lực kỹ thuật số hiện đại</td></tr>
</tbody>
</table>

<h2>3 cấp độ chứng chỉ IC3 GS6</h2>
<ul>
<li><strong>Level 1:</strong> Khái niệm cơ bản và các thành phần thiết yếu</li>
<li><strong>Level 2:</strong> Kiến thức thực hành về kỹ năng cốt lõi</li>
<li><strong>Level 3:</strong> Hiểu biết nâng cao về năng lực kỹ thuật số</li>
</ul>
<p>Đạt cả 3 cấp độ, bạn được cấp thêm <strong>IC3 Digital Literacy Master Certification</strong>.</p>

<h2>Cấu trúc đề thi: 7 chuyên đề × 3 cấp độ</h2>
<p>Mỗi cấp độ IC3 GS6 gồm <strong>7 chuyên đề</strong>. Kiến thức tăng dần theo Level 1 → 2 → 3 trong cùng một chuyên đề.</p>
<ol>
<li><strong>Công nghệ thông tin cơ bản</strong> — phần mềm cơ bản → tùy chỉnh môi trường → khắc phục sự cố</li>
<li><strong>Công dân kỷ nguyên số</strong> — danh tiếng số → nghi thức kỹ thuật số → best practices</li>
<li><strong>Quản lý thông tin</strong> — tìm kiếm → lưu trữ/truy xuất → đánh giá nguồn thông tin</li>
<li><strong>Sáng tạo nội dung</strong> — tạo nội dung cơ bản → tái sử dụng có trách nhiệm → xuất bản/trình bày</li>
<li><strong>Giao tiếp / truyền thông</strong> — diễn đạt qua phương tiện số → tương tác → tùy chỉnh theo đối tượng</li>
<li><strong>Cộng tác</strong> — nghi thức cộng tác → công cụ tạo nội dung chung → làm việc nhóm xử lý vấn đề</li>
<li><strong>An toàn và an ninh</strong> — đe dọa &amp; biện pháp → sức khỏe tâm lý số (FOMO, catfishing…) → bảo mật thiết bị</li>
</ol>
<figure class="bd-figure"><img src="/blog/ic3-dac-diem.png" alt="Đặc điểm bài thi IC3 GS6" loading="lazy" /><figcaption>Đặc điểm bài thi IC3 (nguồn IIG Việt Nam)</figcaption></figure>

<h2>Bảng điểm và chứng chỉ IC3</h2>
<p>Ngay sau khi thi, thí sinh biết điểm. Nếu đạt bài thi thành phần, đăng nhập <a href="https://www.certiport.com" target="_blank" rel="noopener noreferrer">certiport.com</a> để tải bảng điểm và chứng chỉ online. Chứng chỉ online có giá trị tương đương bản cứng và <strong>vô thời hạn</strong>.</p>
<figure class="bd-figure"><img src="/blog/ic3-bang-diem-online.png" alt="Xem bảng điểm online IC3 trên Certiport" loading="lazy" /><figcaption>Xem bảng điểm / chứng chỉ online IC3</figcaption></figure>
<figure class="bd-figure"><img src="/blog/ic3-phieu-diem.jpg" alt="Mẫu phiếu điểm IC3 GS6 Level 1" loading="lazy" /><figcaption>Mẫu phiếu điểm IC3 GS6 Level 1</figcaption></figure>
<p>Đạt cả 3 bài thi thành phần: được cấp chứng chỉ toàn phần bản cứng do Certiport cung cấp.</p>
<figure class="bd-figure"><img src="/blog/ic3-chung-chi.png" alt="Mẫu chứng chỉ IC3 Digital Literacy" loading="lazy" /><figcaption>Mẫu chứng chỉ IC3</figcaption></figure>

<h2>MOS hay IC3 — nên thi cái nào?</h2>
<table>
<thead><tr><th>Tiêu chí</th><th>IC3</th><th>MOS</th></tr></thead>
<tbody>
<tr><td>Phạm vi</td><td>Năng lực số tổng quát (máy tính + Internet)</td><td>Chuyên sâu Office (Word/Excel/PPT…)</td></tr>
<tr><td>Công nhận tại VN</td><td>CNTT cơ bản (TT 03)</td><td>CNTT nâng cao (TT 03)</td></tr>
<tr><td>Cấu trúc</td><td>3 level × 7 chuyên đề</td><td>Multi-Project theo từng môn Office</td></tr>
<tr><td>Phù hợp</td><td>Người mới / chuẩn đầu vào tin học</td><td>Người cần chứng minh kỹ năng văn phòng</td></tr>
</tbody>
</table>
<p>Nhiều học viên bắt đầu với tin học cơ bản / IC3, rồi nâng lên <a href="/blog/cau-truc-de-thi-mos">luyện thi MOS</a> và Excel nâng cao.</p>

<h2>Câu Hỏi Thường Gặp</h2>
<h3>IC3 GS6 có mấy bài thi?</h3>
<p>Ba cấp độ (Level 1, 2, 3); mỗi level là một chứng chỉ thành phần riêng.</p>
<h3>Chứng chỉ IC3 hết hạn không?</h3>
<p>Theo IIG, chứng chỉ online IC3 có giá trị sử dụng vô thời hạn.</p>
<h3>Có công cụ luyện thi IC3 không?</h3>
<p>Certiport cung cấp GMetrix IC3; bạn cũng có thể học kèm tin học cơ bản tại <a href="/dich-vu">Thắng Tin Học</a>.</p>
<h3>Đăng ký thi ở đâu?</h3>
<p>Đăng ký qua đơn vị ủy quyền như IIG Việt Nam, hoặc liên hệ trung tâm luyện thi để được hướng dẫn lịch thi.</p>

<h2>Kết luận</h2>
<p>Cấu trúc đề thi IC3 GS6 xoay quanh <strong>3 cấp độ</strong> và <strong>7 chuyên đề</strong> năng lực số. Hiểu khung này giúp bạn ôn đúng mức độ và chọn lộ trình Level 1 → Master. Nguồn chính thức: <a href="https://iigvietnam.com/bai-thi-ic3/" target="_blank" rel="noopener noreferrer">iigvietnam.com/bai-thi-ic3</a>.</p>
<p><a href="/?enroll=hoc">Đăng ký học tin học / luyện chứng chỉ</a> · <a href="/blog/cau-truc-de-thi-mos">Xem cấu trúc đề thi MOS</a> · <a href="/lien-he">Liên hệ tư vấn</a></p>
<p>#IC3 #IC3GS6 #CauTrucDeThiIC3 #DigitalLiteracy #TinHocQuocTe #ThangTinHoc</p>
`,
};

function buildPost(slug, meta) {
  const content = postsHtml[slug].trim();
  return {
    ...meta,
    slug,
    content,
    tableOfContents: JSON.stringify(tocFromHeadings(content)),
    canonicalUrl: `${SITE}/blog/${slug}`,
    isPublished: true,
    isFeatured: true,
    noIndex: false,
  };
}

const MOS_IC3_POSTS = [
  buildPost('cau-truc-de-thi-mos', {
    title: 'Cấu trúc đề thi MOS — Multi-Project, thời gian, điểm đạt',
    metaTitle: 'Cấu trúc đề thi MOS 2026 | Thời, Excel, PowerPoint',
    metaDescription:
      'Cấu trúc đề thi MOS: dạng Multi-Project, 50 phút, điểm đạt 700/1000, các cấp Specialist–Expert. Tóm tắt theo IIG Việt Nam + mẫu phiếu điểm, chứng chỉ.',
    excerpt:
      'Tóm tắt cấu trúc đề thi MOS: Multi-Project 5–8 dự án, 50 phút/môn, điểm đạt 700/1000, phiếu điểm và chứng chỉ Microsoft.',
    focusKeyword: 'cấu trúc đề thi MOS',
    tags: JSON.stringify(['MOS', 'cấu trúc đề thi MOS', 'luyện thi MOS', 'GMetrix', 'Microsoft Office']),
    thumbnail: '/blog/mos-banner.jpg',
    views: 0,
  }),
  buildPost('cau-truc-de-thi-ic3', {
    title: 'Cấu trúc đề thi IC3 GS6 — 3 cấp độ và 7 chuyên đề',
    metaTitle: 'Cấu trúc đề thi IC3 GS6 | Level 1–2–3 & 7 chuyên đề',
    metaDescription:
      'Cấu trúc đề thi IC3 GS6: 3 cấp độ, 7 chuyên đề năng lực số, chứng chỉ Master. Tóm tắt theo IIG Việt Nam kèm mẫu phiếu điểm và chứng chỉ.',
    excerpt:
      'Hiểu cấu trúc đề thi IC3 GS6: Level 1–2–3, bảy chuyên đề từ CNTT cơ bản đến an toàn số, cách xem bảng điểm online.',
    focusKeyword: 'cấu trúc đề thi IC3',
    tags: JSON.stringify(['IC3', 'IC3 GS6', 'cấu trúc đề thi IC3', 'Digital Literacy', 'Certiport']),
    thumbnail: '/blog/ic3-banner.jpg',
    views: 0,
  }),
];

module.exports = { MOS_IC3_POSTS, postsHtml, tocFromHeadings };
