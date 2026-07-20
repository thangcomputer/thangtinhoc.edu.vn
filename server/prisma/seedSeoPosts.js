/**
 * 5 bài SEO mẫu silo Thắng Tin Học — seed vào DB.
 * Nội dung đủ cấu trúc (H2/FAQ/checklist/CTA/internal links); có thể mở rộng sau qua Admin.
 */

const SITE = 'https://thangtinhoc.edu.vn';

function tocFromHeadings(html) {
  const toc = [];
  const re = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]*>/g, '').trim();
    const id = text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    toc.push({ id, text, level: Number(m[1]) });
  }
  return toc;
}

const postsHtml = {
  'thay-thang-tin-hoc-la-ai': `
<p>Nếu bạn từng tìm trên Google hoặc TikTok cụm từ <strong>thầy thắng tin học là ai</strong>, bài viết này giải thích rõ ràng: Thầy Thắng là ai, dạy gì, hình thức học ra sao, và vì sao nhiều người chọn học 1 kèm 1 với <a href="/gioi-thieu">Thắng Tin Học</a>.</p>
<h2>Thầy Thắng Tin Học là ai?</h2>
<p>Thầy Thắng Tin Học là giáo viên chuyên đào tạo tin học văn phòng — đặc biệt Word, Excel, PowerPoint — theo hướng thực chiến. Mục tiêu không phải “học cho biết”, mà giúp học viên tự tin làm việc trên máy tính ngay trong công việc hàng ngày.</p>
<p>Thương hiệu cá nhân <a href="/">Thắng Tin Học</a> gắn với website thangtinhoc.edu.vn, nơi tập trung giới thiệu lộ trình, khóa học và nội dung hướng dẫn học máy tính cho người mới.</p>
<figure class="bd-figure"><img src="/hero-banner.webp" alt="Thầy Thắng Tin Học đào tạo tin học văn phòng online" loading="lazy" /><figcaption>Đào tạo tin học văn phòng online 1 kèm 1</figcaption></figure>
<h2>Kinh nghiệm và phong cách giảng dạy</h2>
<p>Phong cách của thầy thiên về “cầm tay chỉ việc”: quan sát thao tác trên máy học viên, sửa lỗi ngay, rồi mới khái quát quy trình. Cách này phù hợp người mới sợ bấm nhầm, cũng như nhân viên văn phòng cần xử lý file thật.</p>
<ul>
<li>Ưu tiên bài tập theo nghiệp vụ (báo cáo, bảng lương, hợp đồng, slide thuyết trình).</li>
<li>Giải thích bằng ngôn ngữ đời thường, tránh thuật ngữ IT khó hiểu.</li>
<li>Có ghi hình buổi học để học viên xem lại.</li>
</ul>
<blockquote><p>“Mỗi người một lộ trình. Quan trọng là bạn dùng được tin học trong công việc, không phải học thuộc danh sách tính năng.”</p></blockquote>
<h2>Hình thức học: online, từ xa, UltraViewer</h2>
<p>Học viên có thể học online toàn quốc. Nhiều buổi dùng UltraViewer để thầy hướng dẫn trực tiếp trên máy bạn — xem chi tiết tại <a href="/dich-vu#ultraviewer">học online qua UltraViewer</a> và <a href="/dich-vu#hoc-1-kem-1">đăng ký học 1 kèm 1</a>.</p>
<table>
<thead><tr><th>Hình thức</th><th>Phù hợp khi</th></tr></thead>
<tbody>
<tr><td>1 kèm 1</td><td>Muốn lộ trình riêng, tiến độ linh hoạt</td></tr>
<tr><td>UltraViewer</td><td>Cần sửa file / thao tác trực tiếp trên máy</td></tr>
<tr><td>Học từ xa</td><td>Không tiện đến trung tâm, lịch bận</td></tr>
</tbody>
</table>
<h2>Checklist: Thắng Tin Học có phù hợp bạn?</h2>
<ul>
<li>Bạn mới bắt đầu học máy vi tính / máy tính?</li>
<li>Bạn cần Excel hoặc Word cho công việc văn phòng?</li>
<li>Bạn muốn học online, có người kèm và sửa bài?</li>
<li>Bạn cần xem lại buổi học (ghi hình)?</li>
</ul>
<p>Nếu trả lời “có” từ 2 ý trở lên, hãy xem <a href="/dich-vu">khóa học Tin học văn phòng</a> hoặc trang <a href="/gioi-thieu">Giới thiệu Thắng Tin Học</a>.</p>
<h2>Câu Hỏi Thường Gặp</h2>
<h3>Thầy thắng tin học dạy những gì?</h3>
<p>Chủ yếu tin học văn phòng: thao tác máy tính cơ bản, Word, Excel, PowerPoint; có lộ trình 1 kèm 1 theo mục tiêu cá nhân.</p>
<h3>Học với thầy có phải đến lớp trực tiếp không?</h3>
<p>Không bắt buộc. Nhiều học viên học online / từ xa qua UltraViewer.</p>
<h3>Người chưa biết gì về máy tính có học được không?</h3>
<p>Được. Lộ trình bắt đầu từ thao tác cơ bản rồi mới vào Word/Excel.</p>
<h3>Làm sao liên hệ đăng ký?</h3>
<p>Vào trang <a href="/lien-he">liên hệ đăng ký</a> hoặc form trên trang giới thiệu Thắng Tin Học.</p>
<h2>Kết luận</h2>
<p>Thầy Thắng Tin Học là điểm đến rõ ràng nếu bạn cần gia sư tin học thực tế, học online 1 kèm 1 và muốn tiến bộ đo được bằng file công việc. Bước tiếp theo: đọc thêm về dịch vụ và đăng ký tư vấn lộ trình.</p>
<h2>Đăng ký học cùng Thắng Tin Học</h2>
<p>Sẵn sàng bắt đầu? <a href="/lien-he">Đăng ký tư vấn học tin học</a> hoặc xem <a href="/courses">học cùng Thắng Tin Học</a> ngay hôm nay.</p>
<p>#ThangTinHoc #ThayThangTinHoc #TinHocVanPhong #HocExcel #HocOnline</p>
`,

  'thang-tin-hoc-la-ai': `
<p><strong>Thắng Tin Học là ai?</strong> Đây là thương hiệu cá nhân gắn với đào tạo tin học văn phòng tại thangtinhoc.edu.vn — nơi người học tìm gia sư tin học, khóa Word/Excel và hình thức học online 1 kèm 1.</p>
<h2>Thắng Tin Học — thương hiệu và sứ mệnh</h2>
<p><a href="/gioi-thieu">Thắng Tin Học</a> hướng tới phổ cập kỹ năng máy tính thực dụng: giúp người mới hết sợ máy tính, giúp người đi làm làm chủ Word – Excel – PowerPoint đủ dùng cho công việc.</p>
<p>Khác với khóa “xem video một chiều”, mô hình ưu tiên tương tác: hỏi đáp, sửa bài, theo sát tiến độ — xem thêm tại <a href="/dich-vu">dịch vụ đào tạo</a>.</p>
<h2>Thắng Tin Học có uy tín không?</h2>
<p>Uy tín trong đào tạo đến từ trải nghiệm học viên: có lộ trình rõ, có buổi học ghi hình, hỗ trợ sau khóa khi gặp tình huống thực tế. Bạn nên đối chiếu mục tiêu của mình (học Excel báo cáo, Word hợp đồng, PowerPoint thuyết trình…) với dịch vụ công bố trên website.</p>
<div class="highlight"><p><strong>Gợi ý:</strong> Đọc feedback, xem rõ hình thức UltraViewer / 1 kèm 1, rồi đăng ký buổi tư vấn trước khi chốt lộ trình dài.</p></div>
<h2>Các từ khóa mọi người thường tìm</h2>
<ul>
<li>thắng tin học là ai / thầy thắng tin học là ai</li>
<li>thắng tin học dạy tin trên TikTok</li>
<li>thắng tin học đào tạo tin học văn phòng</li>
<li>gia sư tin học / giáo viên tin học online</li>
</ul>
<p>Tất cả đều dẫn về cùng một thực tế: cần người dạy tin học rõ ràng, thực hành nhiều, học được từ xa.</p>
<h2>So sánh nhanh: tự học vs học cùng Thắng Tin Học</h2>
<table>
<thead><tr><th>Tiêu chí</th><th>Tự học video</th><th>1 kèm 1</th></tr></thead>
<tbody>
<tr><td>Phản hồi lỗi</td><td>Chậm / tự mò</td><td>Sửa ngay trên máy</td></tr>
<tr><td>Lộ trình</td><td>Dễ lan man</td><td>Cá nhân hóa</td></tr>
<tr><td>Động lực</td><td>Dễ bỏ giữa chừng</td><td>Có lịch &amp; kèm cặp</td></tr>
</tbody>
</table>
<h2>Câu Hỏi Thường Gặp</h2>
<h3>Thắng Tin Học khác trung tâm truyền thống thế nào?</h3>
<p>Nhấn mạnh online, 1 kèm 1, UltraViewer và lộ trình cá nhân thay vì lớp đông cố định.</p>
<h3>Có dạy học máy tính cho người mới bắt đầu không?</h3>
<p>Có. Đây là nhóm học viên phổ biến — xem bài <em>học máy vi tính cho người mới</em> trên blog và trang dịch vụ.</p>
<h3>Có học Word Excel online không?</h3>
<p>Có. Word và Excel là trụ cột của <a href="/dich-vu">khóa học Tin học văn phòng</a>.</p>
<h3>Đăng ký ở đâu?</h3>
<p>Trang <a href="/lien-he">liên hệ</a> hoặc form trên <a href="/gioi-thieu">landing Thắng Tin Học</a>.</p>
<h2>Kết luận &amp; CTA</h2>
<p>Thắng Tin Học là lựa chọn rõ ràng nếu bạn muốn học tin học văn phòng có người kèm. Khám phá <a href="/">trang chủ Thắng Tin Học</a> và <a href="/dich-vu#hoc-1-kem-1">đăng ký học 1 kèm 1</a> để nhận lộ trình phù hợp.</p>
<p>#ThangTinHoc #TinHocVanPhong #GiaSuTinHoc #HocExcelOnline</p>
`,

  'hoc-may-vi-tinh-cho-nguoi-moi-bat-dau': `
<p>Nhiều người hỏi: <strong>học máy tính có khó không?</strong> Với người mới, khó thường đến từ sợ bấm sai chứ không phải máy tính “quá phức tạp”. Bài này giúp bạn lộ trình học máy vi tính cho người mới bắt đầu — và khi nào nên học cùng <a href="/gioi-thieu">Thầy Thắng Tin Học</a>.</p>
<h2>Học máy tính / máy vi tính bắt đầu từ đâu?</h2>
<p>Hãy tách thành 3 tầng: (1) thao tác Windows &amp; file, (2) Internet &amp; bảo mật cơ bản, (3) tin học văn phòng (Word/Excel). Đừng nhảy thẳng vào hàm Excel khi chưa biết lưu file và phân biệt thư mục.</p>
<ol>
<li>Bật/tắt máy, bàn phím, chuột, màn hình.</li>
<li>Tạo thư mục, đổi tên, copy/cut/paste file.</li>
<li>Gõ tiếng Việt, lưu đúng định dạng.</li>
<li>Mở Word/Excel làm việc đơn giản.</li>
</ol>
<figure class="bd-figure"><img src="/hero-banner.webp" alt="Học máy vi tính cho người mới bắt đầu" loading="lazy" /><figcaption>Lộ trình học máy tính từ cơ bản</figcaption></figure>
<h2>Học máy vi tính online / từ xa có hiệu quả không?</h2>
<p>Có — nếu có người hướng dẫn và thực hành trên máy của bạn. Mô hình <a href="/dich-vu#tu-xa">học máy tính từ xa</a> kết hợp UltraViewer giúp giáo viên thấy đúng lỗi bạn đang gặp.</p>
<h2>Checklist 7 ngày cho người mới</h2>
<ul>
<li>Ngày 1–2: làm quen giao diện Windows</li>
<li>Ngày 3: quản lý file &amp; USB</li>
<li>Ngày 4: gõ văn bản Word cơ bản</li>
<li>Ngày 5: bảng tính Excel đơn giản</li>
<li>Ngày 6: gửi email / lưu cloud (nếu cần)</li>
<li>Ngày 7: ôn lại + ghi chú lỗi hay gặp</li>
</ul>
<blockquote><p>Học chậm mà đúng thao tác còn hơn xem 10 video mà không dám bấm.</p></blockquote>
<h2>Khi nào nên học 1 kèm 1?</h2>
<p>Khi bạn hay “kẹt” không biết hỏi ai, hoặc cần tiến bộ nhanh cho công việc. <a href="/dich-vu#hoc-1-kem-1">Dạy Excel 1 kèm 1</a> / Word 1 kèm 1 giúp rút ngắn giai đoạn mò mẫm.</p>
<h2>Câu Hỏi Thường Gặp</h2>
<h3>Học máy tính có khó không?</h3>
<p>Không khó nếu học đúng thứ tự và thực hành mỗi ngày 30–60 phút.</p>
<h3>Người lớn tuổi có học được không?</h3>
<p>Được. Nhịp độ 1 kèm 1 phù hợp hơn lớp đông.</p>
<h3>Nên mua máy mới không?</h3>
<p>Máy ổn định, bàn phím tốt là đủ để bắt đầu; không cần cấu hình cao.</p>
<h3>Học ở đâu uy tín?</h3>
<p>Ưu tiên nơi có lộ trình rõ, sửa bài trực tiếp — ví dụ dịch vụ của <a href="/">Thắng Tin Học</a>.</p>
<h2>Kết luận</h2>
<p>Học máy vi tính cho người mới là hành trình có thể đo được từng tuần. Bắt đầu checklist 7 ngày, rồi nâng lên <a href="/dich-vu">tin học văn phòng</a> khi đã vững thao tác cơ bản.</p>
<p><a href="/lien-he">Đăng ký tư vấn</a> nếu bạn muốn được kèm từ bài đầu tiên.</p>
<p>#HocMayTinh #HocMayViTinh #NguoiMoiBatDau #ThangTinHoc</p>
`,

  'hoc-excel-1-kem-1': `
<p><strong>Học Excel 1 kèm 1</strong> phù hợp khi bạn cần tiến bộ nhanh trên đúng file công việc: bảng lương, báo cáo, tồn kho, kế toán… Thay vì lớp đông, bạn học với gia sư — như mô hình <a href="/dich-vu#hoc-1-kem-1">dạy Excel 1 kèm 1</a> của <a href="/gioi-thieu">Thắng Tin Học</a>.</p>
<h2>Vì sao Excel nên học kèm riêng?</h2>
<p>Excel có hàng trăm tính năng, nhưng mỗi người chỉ cần một “bộ công cụ” theo nghiệp vụ. 1 kèm 1 giúp chọn đúng hàm, đúng quy trình, tránh học lan man.</p>
<ul>
<li>Sửa công thức lỗi ngay trên file của bạn</li>
<li>Tốc độ học theo khả năng tiếp thu</li>
<li>Có thể học online qua UltraViewer</li>
</ul>
<h2>Lộ trình Excel từ cơ bản đến nâng cao (gợi ý)</h2>
<table>
<thead><tr><th>Giai đoạn</th><th>Nội dung</th></tr></thead>
<tbody>
<tr><td>Cơ bản</td><td>Ô, vùng, định dạng, SUM/IF đơn giản</td></tr>
<tr><td>Trung cấp</td><td>VLOOKUP/XLOOKUP, Pivot, biểu đồ</td></tr>
<tr><td>Nâng cao</td><td>Dashboard, Power Query (nếu cần)</td></tr>
</tbody>
</table>
<figure class="bd-figure"><img src="/hero-banner.webp" alt="Học Excel online 1 kèm 1 với Thắng Tin Học" loading="lazy" /><figcaption>Học Excel online — sửa file thực tế</figcaption></figure>
<h2>Học Excel online hiệu quả như thế nào?</h2>
<p>Khi dùng UltraViewer, giáo viên thao tác cùng bạn trên cùng một file. Đây là lý do nhiều học viên thấy <a href="/dich-vu#excel">học Excel online</a> hiệu quả hơn xem video một chiều.</p>
<h2>Checklist trước khi đăng ký</h2>
<ul>
<li>Bạn đang dùng Excel cho việc gì? (liệt kê 3 file mẫu)</li>
<li>Bạn yếu phần nào? (công thức, Pivot, định dạng…)</li>
<li>Bạn có thể học bao nhiêu buổi/tuần?</li>
</ul>
<h2>Câu Hỏi Thường Gặp</h2>
<h3>Chưa biết gì về Excel có học 1 kèm 1 được không?</h3>
<p>Được. Giáo viên sẽ bắt đầu từ thao tác cơ bản.</p>
<h3>Có cần cài UltraViewer không?</h3>
<p>Nếu học theo hình thức điều khiển từ xa thì có — được hướng dẫn cài đặt.</p>
<h3>Khác khóa học Excel nhóm thế nào?</h3>
<p>1 kèm 1 linh hoạt lịch và nội dung; nhóm rẻ hơn nhưng nhịp chung.</p>
<h3>Đăng ký ở đâu?</h3>
<p><a href="/lien-he">Liên hệ</a> hoặc xem <a href="/courses">khóa học</a> trên website <a href="/">Thắng Tin Học</a>.</p>
<h2>Kết luận &amp; CTA</h2>
<p>Nếu Excel đang là “nút thắt” công việc, hãy thử lộ trình 1 kèm 1. Bắt đầu bằng việc gửi file mẫu và mục tiêu rõ ràng khi <a href="/dich-vu#hoc-1-kem-1">đăng ký học 1 kèm 1</a>.</p>
<p>#HocExcel #Excel1Kem1 #TinHocVanPhong #ThangTinHoc</p>
`,

  'hoc-online-qua-ultraviewer': `
<p><strong>Học online qua UltraViewer</strong> là cách học từ xa gần với “ngồi cạnh thầy”: giáo viên thấy màn hình máy bạn, hướng dẫn và (khi được phép) thao tác giúp để bạn quan sát rồi làm lại. Đây là hình thức then chốt trong dịch vụ của <a href="/gioi-thieu">Thắng Tin Học</a>.</p>
<h2>UltraViewer là gì trong học tin học?</h2>
<p>UltraViewer là phần mềm hỗ trợ điều khiển máy tính từ xa. Trong lớp học, nó giúp rút ngắn thời gian mô tả lỗi — thầy nhìn đúng chỗ bạn đang kẹt.</p>
<h2>Ưu điểm khi học tin học bằng UltraViewer</h2>
<ul>
<li>Sửa lỗi Excel/Word ngay trên file thật</li>
<li>Phù hợp học máy tính từ xa toàn quốc</li>
<li>Kết hợp ghi hình buổi học để xem lại</li>
<li>An tâm hơn tự mò theo video không phản hồi</li>
</ul>
<figure class="bd-figure"><img src="/hero-banner.webp" alt="Học online qua UltraViewer với giáo viên tin học" loading="lazy" /><figcaption>Học từ xa qua UltraViewer</figcaption></figure>
<h2>Quy trình một buổi học điển hình</h2>
<ol>
<li>Học viên mở UltraViewer, gửi ID/mật khẩu tạm</li>
<li>Giáo viên kết nối, xem bài/file cần xử lý</li>
<li>Hướng dẫn từng bước; học viên thực hành lại</li>
<li>Tóm tắt checklist + giao bài về nhà (nếu có)</li>
</ol>
<blockquote><p>Học qua UltraViewer hiệu quả nhất khi bạn chuẩn bị sẵn file đang làm dở và câu hỏi cụ thể trước giờ học.</p></blockquote>
<h2>Bảo mật khi học từ xa</h2>
<p>Chỉ chia sẻ ID khi vào giờ học; đổi mật khẩu phiên sau buổi học; không để kết nối thường trực. Giáo viên uy tín sẽ giải thích rõ quyền điều khiển.</p>
<p>Xem thêm các hình thức tại <a href="/dich-vu#ultraviewer">dịch vụ UltraViewer</a> và <a href="/dich-vu">khóa học Tin học văn phòng</a>.</p>
<h2>Câu Hỏi Thường Gặp</h2>
<h3>UltraViewer có mất phí không?</h3>
<p>Phần mềm có bản dùng học tập phổ biến; bạn sẽ được hướng dẫn cách dùng phù hợp buổi học.</p>
<h3>Mạng yếu có học được không?</h3>
<p>Cần mạng ổn định. Nếu Wi-Fi yếu, nên dùng mạng dây hoặc 4G/5G dự phòng.</p>
<h3>Có ghi hình buổi học không?</h3>
<p>Có thể thỏa thuận ghi hình để xem lại — một lợi thế so với lớp trực tiếp truyền thống.</p>
<h3>Muốn đăng ký thì làm sao?</h3>
<p>Vào <a href="/lien-he">trang liên hệ</a> hoặc form trên landing <a href="/">Thắng Tin Học</a>.</p>
<h2>Kết luận</h2>
<p>Học online qua UltraViewer là cầu nối giữa học từ xa và hiệu quả 1 kèm 1. Nếu bạn đang tìm cách học máy vi tính / Excel mà không đến lớp, đây là lựa chọn đáng thử cùng Thầy Thắng Tin Học.</p>
<p><a href="/dich-vu#hoc-1-kem-1">Đăng ký học 1 kèm 1</a> · <a href="/courses">Xem khóa học</a></p>
<p>#UltraViewer #HocOnline #HocTuXa #ThangTinHoc #TinHocVanPhong</p>
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

const SEO_SILO_POSTS = [
  buildPost('thay-thang-tin-hoc-la-ai', {
    title: 'Thầy Thắng Tin Học là ai? Giới thiệu giáo viên tin học văn phòng',
    metaTitle: 'Thầy Thắng Tin Học là ai? | Đào tạo tin học 1 kèm 1',
    metaDescription: 'Thầy Thắng Tin Học là ai? Tìm hiểu kinh nghiệm, hình thức học online UltraViewer, Excel Word 1 kèm 1 và cách đăng ký học tại thangtinhoc.edu.vn.',
    excerpt: 'Giải đáp thầy thắng tin học là ai — phong cách dạy, hình thức online 1 kèm 1 và cách đăng ký học tin học văn phòng.',
    focusKeyword: 'thầy thắng tin học là ai',
    tags: JSON.stringify(['thầy thắng tin học', 'thắng tin học', 'gia sư tin học', 'học online']),
    views: 120,
  }),
  buildPost('thang-tin-hoc-la-ai', {
    title: 'Thắng Tin Học là ai? Thương hiệu đào tạo tin học văn phòng',
    metaTitle: 'Thắng Tin Học là ai? | Uy tín & dịch vụ đào tạo',
    metaDescription: 'Thắng Tin Học là ai? Tìm hiểu thương hiệu, sứ mệnh, dịch vụ tin học văn phòng và lý do học viên chọn học 1 kèm 1 online.',
    excerpt: 'Thắng Tin Học là thương hiệu đào tạo tin học văn phòng — Word, Excel, PowerPoint online 1 kèm 1.',
    focusKeyword: 'thắng tin học là ai',
    tags: JSON.stringify(['thắng tin học là ai', 'thắng tin học', 'tin học văn phòng']),
    views: 110,
  }),
  buildPost('hoc-may-vi-tinh-cho-nguoi-moi-bat-dau', {
    title: 'Học máy vi tính cho người mới bắt đầu — Lộ trình 7 ngày',
    metaTitle: 'Học máy vi tính cho người mới | Lộ trình rõ ràng',
    metaDescription: 'Học máy tính / máy vi tính cho người mới bắt đầu: lộ trình 7 ngày, học online từ xa, khi nào nên học 1 kèm 1 với Thắng Tin Học.',
    excerpt: 'Hướng dẫn học máy vi tính từ đầu — checklist 7 ngày và mẹo học online hiệu quả.',
    focusKeyword: 'học máy vi tính cho người mới bắt đầu',
    tags: JSON.stringify(['học máy tính', 'học máy vi tính', 'người mới bắt đầu', 'học online']),
    views: 95,
  }),
  buildPost('hoc-excel-1-kem-1', {
    title: 'Học Excel 1 kèm 1 — Lộ trình thực chiến cho người đi làm',
    metaTitle: 'Học Excel 1 kèm 1 online | Thắng Tin Học',
    metaDescription: 'Học Excel 1 kèm 1 online: sửa file công việc, lộ trình cơ bản đến nâng cao, UltraViewer. Đăng ký gia sư Excel với Thắng Tin Học.',
    excerpt: 'Tại sao nên học Excel 1 kèm 1, lộ trình gợi ý và checklist trước khi đăng ký.',
    focusKeyword: 'học Excel 1 kèm 1',
    tags: JSON.stringify(['học excel', 'excel 1 kèm 1', 'học excel online', 'dạy excel']),
    views: 88,
  }),
  buildPost('hoc-online-qua-ultraviewer', {
    title: 'Học online qua UltraViewer — Học tin học từ xa hiệu quả',
    metaTitle: 'Học online qua UltraViewer | Tin học từ xa',
    metaDescription: 'Học online qua UltraViewer với Thắng Tin Học: quy trình buổi học, bảo mật, ưu điểm khi học Excel/Word từ xa 1 kèm 1.',
    excerpt: 'UltraViewer giúp học tin học từ xa như ngồi cạnh thầy — quy trình và lưu ý bảo mật.',
    focusKeyword: 'học online qua UltraViewer',
    tags: JSON.stringify(['ultraviewer', 'học online', 'học từ xa', 'tin học văn phòng']),
    views: 76,
  }),
];

module.exports = { SEO_SILO_POSTS };
