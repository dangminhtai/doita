# Quy tắc UI/UX của Doita

**Bắt buộc đọc trước mỗi lần sửa code. UI/UX là số 1.** Nguồn yêu cầu: `doita-test/UX.md` của anh Tài. Khi chức năng thay đổi, kiểm tra cả thao tác thành công, lỗi mạng, thử lại, reload, đổi trang, hết phiên và mobile. Chỉ đánh dấu đã kiểm chứng khi có bằng chứng chạy thực tế.

1. Bấm nút phải có phản hồi ngay: khóa thao tác lặp, hiện đang xử lý tại hành động đó, sau đó báo kết quả.
2. Retry sau mất phản hồi không tạo dữ liệu trùng; mutation cần mã thao tác và dedupe phía database, không chỉ disable nút.
3. Chờ mạng có timeout; kết thúc loading, nói rõ trạng thái và cung cấp thử lại. Timeout của write có thể chưa xác nhận kết quả, không khẳng định chưa lưu.
4. Phân biệt đang gửi, đã lưu, chưa xác nhận và lỗi thật; refresh lỗi không được nói write đã thất bại.
5. Lỗi phải có vị trí, ngôn ngữ người dùng hiểu được và hành động tiếp theo; không phơi thông tin database/khóa.
6. Lỗi form giữ nội dung, lựa chọn và ảnh trong phiên nếu có thể; chỉ xóa sau khi xác nhận thành công.
7. Draft lưu cả nội dung, quyền xem, ID đang sửa và tùy chọn, tách theo tài khoản/không gian. Không chuyển draft riêng thành chia sẻ.
8. Phân biệt chưa có dữ liệu, bộ lọc không có kết quả, đang tải và tải lỗi; empty state phải có bước tiếp theo.
9. Xem chi tiết/Back giữ bộ lọc, từ khóa và vị trí cuộn của danh sách. Không reset về đầu ngoài ý muốn.
10. Tìm toàn bộ hoặc ghi rõ đang tìm trong dữ liệu đã tải; không để người dùng hiểu nhầm phạm vi.
11. Tổng số phải lấy count thật; số trang hiện tại phải được ghi là số đã tải.
12. Danh sách phân trang; ảnh lazy load và thumbnail nếu phù hợp. Chỉ thêm virtualization sau khi có bằng chứng cần thiết.
13. Response cũ không ghi đè lựa chọn mới hoặc session khác; detail có loading/error/retry riêng.
14. Xóa vĩnh viễn cần xác nhận rõ nội dung và tác động; Undo/thùng rác khi phù hợp, không hứa Undo nếu không có.
15. Lưu trữ phải có mục Đã lưu trữ và hành động khôi phục. Không giấu mất nội dung.
16. Quyền xem nằm gần hành động gửi/lưu, dùng Chỉ mình/Người ấy/Cả hai nhất quán và giữ đúng sau reload.
17. Icon cần ý nghĩa quen thuộc và nhãn hoặc accessible name. Không bắt người dùng đoán chức năng.
18. Mỗi khu vực có một mục đích/hành động chính; hướng dẫn phụ gọn và mở khi cần.
19. Dùng Lưu, Gửi, Xóa, Lưu trữ, Khôi phục nhất quán; màu/vị trí cùng hành động phải nhất quán.
20. Thành công thông thường dùng phản hồi nhẹ; dialog dành cho quyết định, không bắt xác nhận mọi thao tác.
21. Thông báo có trạng thái bật/tắt/bị chặn/không hỗ trợ/lỗi, hướng dẫn tương ứng; âm thanh không phát lại lịch sử và tuân thủ quyền trình duyệt.
22. Thông báo mở đúng nội dung; nội dung đã xóa/hết quyền có giải thích và đường quay lại. Không mở link ngoài origin.
23. Phiên hết hạn giữ draft cho chính tài khoản đó; đăng nhập lại tiếp tục được. Đăng xuất chủ động/xóa tài khoản vẫn xóa draft trên thiết bị.
24. Daily, countdown, ngày hiển thị và reminder dùng múi giờ cặp đôi. Sinh nhật/kỷ niệm có lần xuất hiện tiếp theo, quy tắc 29/2 thống nhất.
25. Mobile vẫn chạm được ô nhập/nút chính khi bàn phím mở; dùng viewport/safe-area/scroll phù hợp, tránh tràn ngang.
26. Menu/modal có đóng rõ, Escape, focus được quản lý và trả lại; mục tiêu chạm đủ lớn, dùng được bàn phím.

## Cách kiểm tra trước khi kết thúc

- Khi sửa giao diện, đọc thêm `docs/THEMES.md`; assets và màu đi qua `src/config/themes.ts`. Giữ nguồn thiết kế gốc, tối ưu bản dùng trên web, dùng HTML cho nội dung/nút. Theme mới phải kiểm tra contrast, alpha, kích thước, mobile và reduced-motion.
- Không khôi phục khóa toàn trang khi một thao tác đang gửi. Phân trang/lọc trên server, thứ tự có ID phụ; Back chờ danh sách đủ chiều cao trước khi khôi phục cuộn.
- Theo ảnh mẫu đã duyệt: nền trắng/hồng nhẹ, chữ rõ; không tự chuyển sang giấy vàng/serif hoặc cảnh xanh đậm. Kiểm tra CTA trùng giữa header, empty state và disclosure mở/đóng. Kiểm tra chiều rộng thực của search/select trên desktop và mobile, không chỉ kiểm tra trang không tràn.

- Theo yêu cầu ngày 05/10/2026: control cũng phải có thiết kế riêng. Dropdown dùng `Select` chung ở `components/ui.tsx`, có danh sách theo theme, keyboard/typeahead/Escape/focus và chống tràn; không tạo dropdown bằng div click. Thanh cuộn, caret, selection và focus theo theme. Khi dùng thêm control phải đọc [docs/CONTROL_DESIGN.md](docs/CONTROL_DESIGN.md).
- Xác nhận xóa/rời không gian/rời nội dung chưa lưu dùng `useConfirmation`, có Hủy, Escape và trả focus trước khi mutation chạy. Hủy không gửi request; không chuyển quyền quyết định giữa hai phiên. Kết quả lưu/like dùng thông báo nổi nhẹ, không mở dialog chặn người dùng cho mỗi thành công. Cảnh báo khi đóng/reload tab do `beforeunload` vẫn thuộc trình duyệt, không giả vờ thay bằng dialog web.

- Đọc diff và đối chiếu các tiêu chí bị ảnh hưởng; không thêm tính năng bị anh xóa.
- Chạy test logic/database nếu thay đổi dữ liệu hoặc quyền; lint/typecheck/build theo thay đổi.
- Với tương tác, bấm thử trình duyệt mobile, mạng chậm/lỗi, double-click/retry, Back/reload; phân biệt fixture với production.
- Ghi file thay đổi, kết quả thực tế và giới hạn trong báo cáo. Không ghi đạt cho push/email thật, iOS/Android hay screen reader khi chưa chạy.

Các thay đổi tiếp theo phải cập nhật quy tắc khi anh đổi yêu cầu; giữ lịch sử quyết định ở đây, không suy từ trí nhớ cũ.

- Disclosure dùng details/summary nhưng phải ẩn marker mặc định và có chevron theo theme, đổi hướng mở/đóng; giữ Enter/Space và focus-visible. Thanh cuộn dùng primary/soft của theme, không dùng màu muted xám hoặc giả cuộn bằng JavaScript.

- Bộ icon UI dùng artwork của anh qua `THEME.icons` và `components/icons.tsx`; không nhập icon thư viện mặc định trở lại. Icon mới phải có mapping, nguồn thật và được kiểm tra ở kích thước sử dụng, giữ accessible name ở nút và ẩn ảnh trang trí với screen reader.

- Theo yêu cầu ngày 05/10/2026: không hiện các subtitle Notes/Prayer/Memories/Activities, eyebrow “NHỮNG ĐIỀU NHỎ CỦA HAI ĐỨA”, câu mô tả phạm vi tìm kiếm, câu chờ người ấy, hướng dẫn cài ứng dụng hoặc thẻ Giao diện khi chỉ có một theme. Không lặp “Quyền xem: …” cạnh nút; giữ lựa chọn quyền xem trong form và xác nhận thả điều ước.

- Người dùng mục tiêu tại Việt Nam: tạo không gian dùng APP_CONFIG.timezone = Asia/Ho_Chi_Minh, không hiện lựa chọn múi giờ trong PairScreen hoặc Hai đứa.
- Gợi ý hoạt động dùng minh họa theo đúng ID qua THEME.activityArt; không dùng mascot chung cho kết quả đã chọn. Khi ảnh thiếu/lỗi giữ text và thao tác, không đưa hình sai nghĩa. Mapping đối chiếu ID/title/description; giữ nguồn và chỉ xuất bản tối ưu cho web.

- Font toàn ứng dụng dùng Nunito bản thường: nội dung 400/16px/1.6, nút/menu600, tiêu đề700–800. Không đưa Arial hoặc font viết tay trở lại; kiểm tra dấu tiếng Việt và reflow khi đổi chữ.

- Hồ sơ cá nhân `/profile` mở từ avatar/menu; Hai đứa `/couple` chỉ quản lý không gian. Không ghép lại tên/avatar/đăng xuất/xóa tài khoản vào thiết lập chung. Người chưa ghép đôi vẫn vào được hồ sơ.
- Theo yêu cầu mới: được đổi giới tính khi còn trong không gian, không bắt rời. Giữ xác nhận trước khi lưu; gỡ trigger khóa bằng migration mới.
- Avatar nguồn JPEG/PNG/WebP được crop/nén tại trình duyệt, không áp giới hạn nguồn5MB. Chỉ upload WebP256×256 tối đa80KB; kiểm tra nội dung thật trên server, bucket riêng tư, không lưu ảnh gốc. Giữ ảnh cũ đến khi cập nhật được xác nhận; retry/cleanup không xóa ảnh đang dùng. Draft thuộc đúng tài khoản; Realtime không ghi đè nội dung đang sửa.

- `/settings` dành cho cài đặt ứng dụng thực sự khi có; không dùng làm đường dẫn hay tên màn Hai đứa. Liên kết thông báo cũ được đổi đích sang `/couple` khi mở.
- Ghép đôi dùng ID không gian cố định 9 chữ số tăng dần, bắt đầu 000000001; đây là định danh, không phải mật khẩu hoặc UUID. Nhập ID chỉ gửi yêu cầu; thành viên hiện tại phải xác nhận thì mới cấp quyền. Mã dài cũ giữ trong schema private, không gửi qua API/Realtime và không cho ghép đôi trực tiếp. Giữ giới hạn hai người, retry không trùng, yêu cầu có Hủy/Từ chối/hết hạn và thông báo chờ duyệt.

- Đăng ký phải chọn giới tính, không chọn sẵn và không có “Chưa thiết lập” trong form đăng ký. Giữ lựa chọn khi lỗi; lưu ngay vào hồ sơ và kiểm tra ở database cho tài khoản mới. Không lặp tên thương hiệu trong khung auth khi header đã hiển thị.
- Ngoại lệ icon theo yêu cầu mới: hiện/ẩn mật khẩu dùng Eye/EyeOff từ lucide-react đã có, màu primary và nền trạng thái soft của theme.

- Motion bám `doita-test/MOTION_PLAN.md`; timing đi qua `src/config/motion.ts`. Không trì hoãn URL/mutation/focus để chờ animation, không replay cả danh sách khi Realtime refresh. Thả thuyền chỉ sau write được xác nhận; reduced-motion tắt dịch chuyển/ambient và tab ẩn dừng hiệu ứng. Không giả online hoặc thêm dependency để trang trí.

- Anh đã yêu cầu tim bay có giới hạn: một tim doodle khi click/tap vùng không tương tác, tối đa6 tim/650ms. Không sinh tim trên form/control/dialog/thao tác xóa, khi drag/cuộn/chọn chữ hoặc có menu mở. Tim không biểu thị thành công của mutation; tắt/dọn khi reduced-motion, tab ẩn, đổi trang hoặc tài khoản. Không clone nội dung dialog/toast ra body để giả hiệu ứng đóng.

- Trang giới thiệu /p/[publicId] độc lập với AppProvider. Chỉ công khai khi mọi membership hiện tại đồng ý; consent mặc định tắt và không mang sang membership mới. Tắt chia sẻ thu hồi các lần đọc metadata/avatar tiếp theo; không hứa thu hồi ảnh đã tải. Bio tối đa300 Unicode code points, không render HTML người dùng. ID sai/không công khai/đã xóa cùng phản hồi; không công khai email, UUID tài khoản, signed URL hoặc nội dung riêng. Đăng nhập từ trang này chỉ quay lại, không tự gửi yêu cầu.

- Avatar mặc định của tài khoản phải chọn theo giới tính đã lưu, không theo vị trí membership. Hồ sơ preview theo lựa chọn đang sửa; menu chỉ đổi sau khi lưu. Ảnh tự tải ưu tiên và không bị thay khi đổi giới tính. Fallback lỗi ảnh công khai phải dùng cùng mapping.

- Khi giới tính chưa thiết lập (null), avatar mặc định suy ra hình còn lại theo giới tính Nam/Nữ đã lưu của người ấy. Chỉ suy ra artwork, không ghi giới tính vào hồ sơ; không thay ảnh tự tải hoặc lựa chọn giới tính rõ ràng.

### Quyết định mới 06/10/2026 — Chia sẻ mặc định bật

Thay thế quy tắc consent mặc định tắt phía trên: membership mới mặc định chia sẻ trang giới thiệu. Mỗi người có thể tắt phần chia sẻ của mình; chỉ một người tắt thì cả trang ẩn. Bật lại bằng một thao tác, không popup đồng ý. Luôn có Sao chép link giới thiệu khi ID đã tồn tại; khi trang ẩn, giữ trạng thái ẩn rõ ràng. Nội dung công khai vẫn chỉ tên/avatar/bio và thống kê đã duyệt, không mở dữ liệu riêng.

- Trang giới thiệu đủ hai người không hiện nút vào/gửi yêu cầu hay ID lặp. Avatar/tên/bio căn giữa theo hai cột bằng nhau; bio trống có Chưa có mô tả màu muted. Kết nối dùng tim doodle và đường nhịp nhẹ, không giả trạng thái online; motion có điểm dừng, reduced-motion và pause khi tab ẩn.

- Cập nhật nhịp kết nối: tim vector chạy dọc đường sóng và loop theo yêu cầu mới, thay cho tim doodle đứng giữa và animation một lượt. Giữ reduced-motion, pause khi tab ẩn và thao tác tạm dừng bằng click/bàn phím; không giả trạng thái trực tuyến.

- Mở form sửa lời nhắn phải đưa người dùng tới form và focus ô nhập, không mở form ngoài vùng nhìn thấy. Trong Mở thư, tác giả có nút Sửa; người nhận không được sửa nội dung của người ấy. Giữ draft và quyền qua cùng handler ở desktop/mobile.

- Tiêu đề lời nhắn không bắt buộc. Thời gian tồn tại chọn15 phút/1 giờ/1 ngày/1 tuần/Vĩnh viễn, mặc định Vĩnh viễn. Hạn tính bằng giờ server khi lưu; sửa nội dung không đổi hạn, đổi thời gian tồn tại thì tính lại khi lưu, retry không kéo dài. Chặn đọc và thao tác ở database khi hết hạn, không chỉ giấu bằng CSS; xóa vật lý theo cron.
- Form sửa chỉ cảnh báo rời/đóng khi draft khác baseline; chỉ mở sửa hoặc sửa rồi trả về đúng nội dung ban đầu không cảnh báo. Đổi loại/quyền xem/thời hạn cũng tính là thay đổi. Không tự đặt tiêu đề để ép form hợp lệ.
