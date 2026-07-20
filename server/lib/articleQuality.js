/**
 * Chuẩn chất lượng bài viết SEO (độ dài + Copywriter Master).
 */
const { COPYWRITER_TASK_PROMPT, BRAND } = require('./copywriterPrompt');

const MIN_ARTICLE_WORDS = 1400;
const TARGET_ARTICLE_WORDS = '1600–2400';

const EDITORIAL_STYLE_PROMPT = `
${COPYWRITER_TASK_PROMPT}

═══ BỔ SUNG ĐỘ DÀI & CHIỀU SÂU ═══
- Tối thiểu ${MIN_ARTICLE_WORDS} từ nội dung (mục tiêu ${TARGET_ARTICLE_WORDS}).
- Mỗi <h2> có ≥2 đoạn <p> trước list/bảng; tối thiểu 5 <h2>.
- Ít nhất 2 bảng <table> (so sánh + tra cứu/lộ trình).
- FAQ: <h2>Câu Hỏi Thường Gặp</h2> + 4 cặp <h3> + <p>.
- Cấm nhắc API key, template, hay "bài mẫu" trong content.
`;

function buildExpandStyleNote() {
  return `Mở rộng bài đến TỐI THIỂU ${MIN_ARTICLE_WORDS} từ (mục tiêu ${TARGET_ARTICLE_WORDS}).
${EDITORIAL_STYLE_PROMPT}
Giữ HTML h2/h3/p/table; mỗi h2 thêm đoạn văn dài, ví dụ thực tế.`;
}

/** Bài mẫu dài (~1400+ từ) khi AI không khả dụng — cấu trúc giống bài chuẩn SEO */
function countPlainWords(html) {
  const t = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Khối bổ sung khi bài mẫu còn ngắn — giữ đúng chuẩn độ sâu */
function sharedDepthBlock(topic, year) {
  return `
<h2>Định hướng thực hành ${topic} trong 30 ngày</h2>
<p>Tuần đầu, hãy dành 30 phút mỗi ngày chỉ để làm quen thao tác cơ bản — không cố học nâng cao. Tuần thứ hai, gắn với một file thật: bảng điểm, bảng lương, danh sách khách, hoặc slide họp. Tuần thứ ba, tập trung trình bày: font thống nhất, tiêu đề rõ, biểu đồ đúng đơn vị. Tuần thứ tư, tự đánh giá bằng checklist: tốc độ, độ chính xác, khả năng giải thích lại cho đồng nghiệp.</p>
<p>Nhiều học viên Tin học 24h nhận ra tiến bộ không đến từ “học thêm tính năng lạ”, mà từ việc lặp lại quy trình chuẩn trên đúng công việc họ làm hàng ngày. Đó là lý do lớp 1 kèm 1 và lớp nhóm đều ưu tiên sửa file thực tế thay vì chỉ demo file mẫu.</p>

<h2>Tài nguyên nên chuẩn bị trước khi học</h2>
<p>Máy tính chạy bản Office hoặc tài khoản Google Workspace; ổ cứng trống vài GB để lưu bài tập; quyển ghi chú phím tắt; và quan trọng nhất — thời gian cố định 45–60 phút mỗi buổi, tắt thông báo mạng xã hội.</p>
<p>Nếu công ty bạn dùng chuẩn template nội bộ, hãy mang template đó đến buổi học. Giảng viên sẽ chỉnh trực tiếp trên template ấy — đây là cách nhanh nhất để ${topic} “ăn vào máu” thay vì chỉ nằm trong sổ tay lý thuyết.</p>

<h3>Bảng gợi ý lịch học theo đối tượng (${year})</h3>
<table>
<thead><tr><th>Đối tượng</th><th>Tần suất</th><th>Trọng tâm</th></tr></thead>
<tbody>
<tr><td>Học sinh – sinh viên</td><td>4 buổi/tuần</td><td>Nền tảng + MOS/IC3</td></tr>
<tr><td>Người đi làm</td><td>2–3 buổi/tuần</td><td>Báo cáo, Excel, slide</td></tr>
<tr><td>Phụ huynh</td><td>1–2 buổi/tuần</td><td>Theo dõi con + nền tảng</td></tr>
<tr><td>Trưởng nhóm</td><td>1 kèm 1</td><td>Template team, KPI</td></tr>
</tbody>
</table>

<h2>Thói quen học bền vững — không chỉ học “cho xong”</h2>
<p>Sau mỗi buổi học, dành 5 phút ghi lại 3 thao tác mới và 1 lỗi bạn từng gặp. Cuối tuần, mở lại file bài tập và làm lại mà không xem video — đó là cách não củng cố trí nhớ vận động. Nếu bạn chỉ xem mà không bấm, khả năng quên sau 72 giờ là rất cao.</p>
<p>Với ${topic}, mục tiêu không phải “biết hết menu”, mà là hoàn thành nhanh các tác vụ lặp lại: nhập liệu, kiểm tra, tổng hợp, in ấn, gửi mail kèm file đính kèm đúng phiên bản. Khi các tác vụ đó trở thành phản xạ, bạn sẽ cảm thấy ${topic} “dễ” dù trước đó từng rất sợ.</p>
<p>Trung tâm Tin học 24h khuyến khích học viên mang đúng thách thức công việc vào lớp: một báo cáo bị sếp trả về, một file Excel bị lỗi công thức, một slide bị đồng nghiệp phàn nàn khó hiểu. Giải quyết đúng nỗi đau đó mang lại động lực mạnh hơn bất kỳ bài lý thuyết nào.</p>`;
}

function appendHashtagFooter(html) {
  if (/#(?:MOS|IC3|hoctinhoc|thangcomputer)/i.test(html || '')) return html;
  return `${html}\n<p><em>#MOS #IC3 #hoctinhoc #thangcomputer #tinhocvanphong</em></p>`;
}

function buildLongFormFallback(topic, variantIndex = 0) {
  const year = new Date().getFullYear();
  const v = variantIndex % 4;
  const zaloCta = BRAND.zaloCta;

  let content;
  if (v === 1) content = buildWorkplaceAngle(topic, year, zaloCta);
  else if (v === 2) content = buildFaqAngle(topic, year, zaloCta);
  else if (v === 3) content = buildTipsAngle(topic, year, zaloCta);
  else content = buildClassicAngle(topic, year, zaloCta);

  while (countPlainWords(content) < MIN_ARTICLE_WORDS) {
    const before = countPlainWords(content);
    content = `${content}\n${sharedDepthBlock(topic, year)}`;
    if (countPlainWords(content) <= before) break;
  }
  return appendHashtagFooter(content.trim());
}

function sharedRoadmapBlock(topic, year) {
  return `
<h2>Lộ trình gợi ý 4 tuần cho ${topic}</h2>
<p><strong>Tuần 1:</strong> Làm quen giao diện, lưu mở file, định dạng cơ bản, 10 phím tắt đầu tiên. Mục tiêu: tự tin không còn sợ "bấm nhầm".</p>
<p><strong>Tuần 2:</strong> Nhập liệu, lọc, sắp xếp, hàm tổng hợp cơ bản (SUM, AVERAGE, IF). Mục tiêu: hoàn thành một bảng tính mini có số liệu thật.</p>
<p><strong>Tuần 3:</strong> Biểu đồ, in ấn, PDF, template báo cáo. Mục tiêu: gửi được bản báo cáo có bố cục rõ ràng.</p>
<p><strong>Tuần 4:</strong> Ôn tập + dự án tổng hợp 90 phút, checklist tự chấm. Mục tiêu: tự tin nhận thêm việc tại công ty.</p>
<p>Trung tâm Tin học 24h điều chỉnh lộ trình theo trình độ thực tế — không ép nhịp chung khiến người yếu nản hoặc người khá chán.</p>

<h3>Bảng lộ trình chi tiết</h3>
<table>
<thead><tr><th>Tuần</th><th>Mục tiêu</th><th>Sản phẩm</th><th>Giờ học</th></tr></thead>
<tbody>
<tr><td>1</td><td>Thao tác cơ bản</td><td>File mẫu chuẩn</td><td>3–5h</td></tr>
<tr><td>2</td><td>Công thức & dữ liệu</td><td>Bảng mini</td><td>4–6h</td></tr>
<tr><td>3</td><td>Báo cáo & biểu đồ</td><td>1 báo cáo PDF</td><td>4–6h</td></tr>
<tr><td>4</td><td>Dự án tổng hợp</td><td>Bài thi thử</td><td>5–8h</td></tr>
</tbody>
</table>`;
}

function buildClassicAngle(topic, year, zaloCta) {
  return `
<p>Trong kỷ nguyên số hiện nay, <strong>${topic}</strong> đã trở thành kỹ năng không thể thiếu trong học tập và công việc. Thế nhưng, với nhiều người — từ học sinh sắp bước vào giảng đường, nhân viên văn phòng muốn nâng hiệu suất, đến phụ huynh định hướng cho con — câu hỏi "<em>${topic} có khó không?</em>" vẫn là nỗi băn khoăn lớn.</p>

<p>Nỗi sợ bấm nhầm gây hư hỏng, hay rối trước hàng loạt menu và tính năng, đôi khi trở thành rào cản khiến bạn chần chừ tiếp cận công nghệ. Thực tế, khi được dẫn dắt đúng phương pháp, việc làm chủ ${topic} hoàn toàn trong tầm tay — kể cả người chưa từng ngồi máy tính lâu.</p>

<p>Bài viết ${year} này giúp bạn nhìn nhận khách quan độ khó, tránh các sai lầm phổ biến, và có lộ trình bám sát thực tế để tiến bộ từng tuần một cách chắc chắn.</p>

<h2>1. Bản chất của ${topic}: Khó hay dễ?</h2>
<p>Để trả lời chính xác, cần tách rõ hai hướng: <strong>tin học ứng dụng văn phòng</strong> (Word, Excel, PowerPoint, thao tác hệ điều hành) và <strong>kỹ thuật chuyên sâu</strong> (lập trình, quản trị hệ thống, cơ sở dữ liệu). Phần lớn người đọc bài này thuộc nhóm đầu — mục tiêu làm việc hiệu quả, không trở thành kỹ sư phần mềm ngay lập tức.</p>

<h3>Cấp độ 1: Tin học ứng dụng (thân thiện, dễ tiếp cận)</h3>
<p>Nếu bạn cần soạn văn bản chuẩn, xử lý bảng số liệu, làm biểu đồ báo cáo hoặc thuyết trình, câu trả lời thường là <strong>KHÔNG KHÓ</strong> — miễn là có lộ trình và thực hành đều. Các phần mềm hiện đại thiết kế giao diện trực quan; bản chất là ghi nhớ thao tác, hiểu logic sắp xếp dữ liệu và luyện tay mỗi ngày.</p>
<p>Nhiều học viên tại Tin học 24h chỉ sau 3–4 tuần (1–2 giờ/ngày) đã tự tin hoàn thành báo cáo thực tế, trong khi trước đó mất cả buổi chỉ vì ngại thử và sợ sai.</p>

<h3>Cấp độ 2: Kỹ thuật chuyên sâu (đòi hỏi tư duy logic)</h3>
<p>Độ khó tăng rõ khi bạn bước vào lập trình, tự động hóa nâng cao, quản trị server. Ở đây bạn phải "ra lệnh" cho máy bằng logic, kiên trì debug và học liên tục. Đây là lộ trình dài hơn — không nên nhầm với nhu cầu văn phòng cơ bản.</p>

<h3>Bảng so sánh hai cấp độ học ${topic}</h3>
<table>
<thead><tr><th>Tiêu chí</th><th>Ứng dụng văn phòng</th><th>Kỹ thuật chuyên sâu</th></tr></thead>
<tbody>
<tr><td>Thời gian làm chủ cơ bản</td><td>3–6 tuần</td><td>6–18 tháng+</td></tr>
<tr><td>Đối tượng</td><td>NVVP, sinh viên, kế toán</td><td>Lập trình viên, IT</td></tr>
<tr><td>Công cụ</td><td>Office, Google Workspace</td><td>IDE, Git, SQL...</td></tr>
<tr><td>Chứng chỉ gợi ý</td><td>IC3, MOS</td><td>Theo ngành IT</td></tr>
</tbody>
</table>

<h2>2. Sai lầm khiến việc học ${topic} trở nên "khó"</h2>
<p>Rất nhiều người bỏ ra hàng chục giờ nhưng vẫn dậm chân tại chỗ. Nguyên nhân thường không phải vì "mình kém điện tử", mà do phương pháp.</p>
<p><strong>Học lý thuyết suông:</strong> Máy tính là môn của đôi tay. Chỉ xem video mà không mở file thực hành thì kỹ năng trôi rất nhanh — não cần kết nối cơ bắp qua thao tác lặp lại.</p>
<p><strong>Sợ sai, sợ hỏng máy:</strong> Hệ điều hành hiện đại có khôi phục, Undo, bản sao. Bấm thử trên file mẫu (không phải dữ liệu công ty) là cách an toàn nhất để vượt qua tâm lý này.</p>
<p><strong>Học dàn trải không lộ trình:</strong> Internet có vô số clip rời rạc. Không có khung chuẩn dễ rơi vào học vẹt — biết lẻ tẻ nhưng ghép không nên bức tranh hoàn chỉnh.</p>

<h2>3. Bí quyết bứt phá ${topic} nhanh cho người mới</h2>
<p>Chuyển từ "nỗi sợ" sang "thói quen" bằng cách gắn học với mục tiêu thật: bảng lương, báo cáo tháng, slide họp, CV chuẩn chỉnh.</p>
<p><strong>Tận dụng phím tắt</strong> thay click dài: <code>Alt + Tab</code> chuyển cửa sổ; <code>Ctrl + S</code> lưu; <code>Windows + D</code> về Desktop; <code>Windows + E</code> mở File Explorer. Tốc độ quyết định năng suất khi làm việc hàng ngày.</p>

<h3>Bảng phím tắt nên nhớ khi học ${topic}</h3>
<table>
<thead><tr><th>Thao tác</th><th>Phím tắt</th><th>Lợi ích</th></tr></thead>
<tbody>
<tr><td>Chuyển cửa sổ</td><td>Alt + Tab</td><td>Đa nhiệm nhanh</td></tr>
<tr><td>Lưu file</td><td>Ctrl + S</td><td>Tránh mất dữ liệu</td></tr>
<tr><td>Về Desktop</td><td>Windows + D</td><td>Tìm file gọn</td></tr>
<tr><td>Mở thư mục</td><td>Windows + E</td><td>Quản lý file</td></tr>
<tr><td>Sao chép định dạng</td><td>Ctrl + Shift + C/V</td><td>Excel/Word đồng bộ</td></tr>
</tbody>
</table>

<p><strong>Chuẩn hóa năng lực bằng chứng chỉ:</strong> <strong>IC3</strong> phù hợp nền tảng tổng quát; <strong>MOS</strong> chứng minh thành thạo Word/Excel/PowerPoint — tấm vé vàng cho CV và thăng tiến.</p>

<h2>4. Học 1 kèm 1 từ xa — phương pháp hiệu quả ${year}</h2>
<p>Với người bận rộn, người lớn tuổi hoặc học sinh cần sự kiên nhẫn, mô hình <strong>học 1 kèm 1</strong> qua UltraViewer/TeamViewer xóa khoảng cách địa lý. Giáo viên thấy màn hình học viên, sửa thao tác sai ngay — cầm tay chỉ việc đúng nghĩa đen.</p>
<p>So với lớp đông, 1 kèm 1 cá nhân hóa tốc độ: bạn yếu phần nào thì dừng lại phần đó, không bị cuốn theo nhịp chung. Tin học 24h áp dụng mô hình này song song lớp nhóm và luyện thi MOS/IC3.</p>

<h2>Câu Hỏi Thường Gặp</h2>
<h3>${topic} mất bao lâu để học được?</h3>
<p>Với 1–2 giờ/ngày có hướng dẫn, phần lớn học viên làm chủ cơ bản văn phòng trong 3–4 tuần; nâng cao cần thêm 4–8 tuần thực chiến trên file công việc.</p>
<h3>Có cần máy cấu hình cao không?</h3>
<p>Máy văn phòng phổ thông đủ cho Office và học online; quan trọng hơn là thói quen lưu backup và cập nhật hệ điều hành.</p>
<h3>Học online hay trực tiếp?</h3>
<p>Cả hai đều hiệu quả nếu có bài tập và feedback. 1 kèm 1 từ xa phù hợp khi bạn ở xa trung tâm hoặc lịch không cố định.</p>

${sharedRoadmapBlock(topic, year)}

<h2>Kết luận</h2>
<p><strong>${topic}</strong> hoàn toàn không khó khi có người dẫn đường và lộ trình tinh gọn bám sát thực tế. Bạn chỉ cần bắt đầu nhỏ hôm nay — một file, một báo cáo, một thói quen phím tắt — rồi tích lũy mỗi tuần.</p>
<p>Bạn muốn xóa mù tin học hoặc chinh phục MOS/IC3 trong thời gian ngắn? ${zaloCta}</p>
<p><em>#MOS #IC3 #hoctinhoc #thangcomputer #tinhocvanphong</em></p>`.trim();
}

function buildWorkplaceAngle(topic, year, zaloCta) {
  return `
<p>Nếu bạn đang đi làm và phải xử lý <strong>${topic}</strong> mỗi ngày, bài viết này (${year}) tập trung vào <em>thực chiến văn phòng</em> — không lan man lý thuyết suông.</p>
<p>Nhiều nhân viên mới thấy "khó" vì phải giao báo cáo gấp, ghép số liệu từ nhiều file, hoặc làm slide trong thời gian ngắn. Khi có quy trình và người sửa lỗi trực tiếp trên máy bạn, áp lực giảm rõ rệt.</p>

<h2>1. Năm tình huống ${topic} gặp hàng tuần tại công ty</h2>
<p>Tổng hợp số liệu cuối tuần, chuẩn hóa danh sách khách từ nhiều nguồn, làm biểu đồ họp, đối chiếu số kế toán, lưu template tái sử dụng — đây là "bài tập thật" bạn nên luyện thay vì file demo vô hồn.</p>
<p>Mỗi tình huống nên có checklist 5 bước: nhận yêu cầu → làm sạch dữ liệu → tính toán → trình bày → kiểm tra trước khi gửi sếp.</p>

<h3>Bảng checklist trước khi gửi báo cáo</h3>
<table>
<thead><tr><th>Bước</th><th>Kiểm tra</th><th>Ghi chú</th></tr></thead>
<tbody>
<tr><td>1</td><td>Đúng kỳ báo cáo</td><td>Tuần/tháng/quý</td></tr>
<tr><td>2</td><td>Tổng khớp chi tiết</td><td>Soát 2 chiều</td></tr>
<tr><td>3</td><td>Biểu đồ đúng đơn vị</td><td>%, triệu, tỷ</td></tr>
<tr><td>4</td><td>Tên file có ngày</td><td>Tránh gửi nhầm bản cũ</td></tr>
<tr><td>5</td><td>Ghi chú thay đổi</td><td>So với kỳ trước</td></tr>
</tbody>
</table>

<h2>2. Quy trình xử lý báo cáo trong 45 phút</h2>
<p>Mở template → dán dữ liệu mới → chuẩn hóa cột → cập nhật công thức → xuất PDF. Ghi version theo ngày trong tên file. Thói quen nhỏ này cứu bạn khỏi sự cố gửi nhầm bản cũ cho lãnh đạo.</p>
<p>Học viên Tin học 24h thường mang đúng file đang làm tại công ty để giảng viên chỉnh trực tiếp — tiết kiệm hàng giờ mỗi tuần.</p>

<h2>3. Tự học vs có mentor — bảng so sánh</h2>
<table>
<thead><tr><th></th><th>Tự học online</th><th>Có giảng viên / 1 kèm 1</th></tr></thead>
<tbody>
<tr><td>Sửa lỗi file thật</td><td>Chậm, dễ bỏ cuộc</td><td>Ngay trên màn hình bạn</td></tr>
<tr><td>Lịch</td><td>Linh hoạt</td><td>Ca tối, cuối tuần</td></tr>
<tr><td>Chứng chỉ MOS</td><td>Tự luyện</td><td>Có lộ trình thi</td></tr>
</tbody>
</table>

<h2>4. Phím tắt tăng tốc khi làm ${topic}</h2>
<p>Thay click dài bằng <code>Ctrl + S</code>, <code>Alt + Tab</code>, <code>Ctrl + Z</code>, <code>F4</code> khóa tham chiếu Excel. Một tuần luyện 15 phút/ngày đủ tạo khác biệt.</p>

${sharedRoadmapBlock(topic, year)}

<h2>Kết luận</h2>
<p>Chọn một báo cáo bạn đang làm làm bài tập tuần này. ${zaloCta}</p>`.trim();
}

function buildFaqAngle(topic, year, zaloCta) {
  return `
<p>Chủ đề <strong>${topic}</strong> gây nhiều thắc mắc — bài ${year} này trả lời trực diện và so sánh lựa chọn học/làm việc.</p>
<p>Thay vì liệt kê sơ, mỗi câu hỏi dưới đây có giải thích đủ dài để bạn ra quyết định: học gì trước, mất bao lâu, chi phí hợp lý, chứng chỉ nào đáng đầu tư.</p>

<h2>1. ${topic} có khó không — câu trả lời ngắn gọn</h2>
<p>Với mục tiêu văn phòng: <strong>không khó</strong> nếu thực hành đều. Với lập trình chuyên sâu: cần thời gian dài hơn và tư duy logic — đừng trộn hai mục tiêu khiến bạn nản.</p>

<h2>2. FAQ chi tiết</h2>
<h3>Nên học Excel hay Word trước?</h3>
<p>Excel trước nếu công việc nhiều số liệu; Word trước nếu soạn thảo là chính. Khóa tổng hợp Tin học 24h gộp cả hai theo lộ trình MOS.</p>
<h3>Bao lâu thì đủ đi làm?</h3>
<p>4–6 tuần nền tảng với 1–2h/ngày; thành thạo cần thêm dự án thật trên file công ty.</p>
<h3>Học online có hiệu quả?</h3>
<p>Có — nếu có bài tập chấm và hỏi đáp. 1 kèm 1 qua TeamViewer/UltraViewer phù hợp người cần sửa lỗi trực tiếp.</p>

<h3>Bảng so sánh hình thức học</h3>
<table>
<thead><tr><th>Hình thức</th><th>Ưu</th><th>Nhược</th></tr></thead>
<tbody>
<tr><td>YouTube</td><td>Miễn phí</td><td>Thiếu hệ thống</td></tr>
<tr><td>Lớp nhóm</td><td>Động lực</td><td>Ít thời gian 1-1</td></tr>
<tr><td>1 kèm 1</td><td>Cá nhân hóa</td><td>Giá cao hơn lớp</td></tr>
</tbody>
</table>

<h2>3. MOS và IC3 — khi nào nên thi?</h2>
<p>IC3 cho nền tảng; MOS khi cần chứng minh Word/Excel/PPT trong CV. Cả hai đều có lớp luyện tại trung tâm.</p>

${sharedRoadmapBlock(topic, year)}

<h2>Kết luận</h2>
<p>Chọn lộ trình phù hợp thay vì học lan man. ${zaloCta}</p>`.trim();
}

function buildTipsAngle(topic, year, zaloCta) {
  return `
<p>Muốn làm <strong>${topic}</strong> nhanh và đúng? Bài ${year} tổng hợp mẹo chuyên gia, phím tắt và lỗi hay gặp — áp dụng ngay trong ca làm.</p>
<p>Đa số người chậm không vì "máy khó", mà vì thiếu thói quen: template, đặt tên file, khóa tham chiếu, backup định kỳ.</p>

<h2>1. Mười hai mẹo tăng tốc ${topic}</h2>
<p>Dùng template sẵn; đặt tên sheet rõ; tách file raw và báo cáo; học 3 phím tắt mỗi tuần; không làm thủ công việc lặp quá 3 lần — hãy ghi macro hoặc công thức.</p>

<h3>Bảng lỗi thường gặp</h3>
<table>
<thead><tr><th>Lỗi</th><th>Nguyên nhân</th><th>Cách xử lý</th></tr></thead>
<tbody>
<tr><td>#VALUE!</td><td>Text trong ô số</td><td>Text to Columns</td></tr>
<tr><td>#REF!</td><td>Xóa cột tham chiếu</td><td>Sửa vùng công thức</td></tr>
<tr><td>Gửi nhầm file</td><td>Không version</td><td>Tên file + ngày</td></tr>
</tbody>
</table>

<h2>2. Phím tắt quyết định năng suất</h2>
<p><code>Alt+Tab</code>, <code>Ctrl+S</code>, <code>Windows+E</code> — luyện 10 phút mỗi sáng trước khi mở email.</p>

<h2>3. Khi nào cần học 1 kèm 1?</h2>
<p>Khi tự học 2–3 tuần vẫn kẹt trên file thật, hoặc sếp yêu cầu báo cáo phức tạp gấp. Giáo viên nhìn màn hình và sửa từng thao tác sai.</p>

${sharedRoadmapBlock(topic, year)}

<h2>Kết luận</h2>
<p>Áp dụng 2–3 mẹo mỗi tuần. ${zaloCta}</p>`.trim();
}

module.exports = {
  MIN_ARTICLE_WORDS,
  TARGET_ARTICLE_WORDS,
  EDITORIAL_STYLE_PROMPT,
  buildExpandStyleNote,
  buildLongFormFallback,
};
