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
