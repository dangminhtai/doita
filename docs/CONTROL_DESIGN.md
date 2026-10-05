# Control riêng cho Doita

Ngày 05/10/2026. Áp dụng skill `interface-design` đã cài global cho Codex tại `C:/Users/minh tai/.agents/skills/interface-design/SKILL.md`. Lượt này xử lý control trên giao diện hiện có; không coi là đã triển khai bố cục mockup Hai nét đang chờ lựa chọn.

## Ý định và chất liệu

Người dùng đến đọc/viết lời nhắn, chọn quyền xem và giữ những nội dung của hai người. Các khái niệm dẫn thiết kế: người gửi, người nhận, nội dung riêng, khoảng chờ trả lời, lời để dành và ngày chung. Màu trong hệ đã duyệt: trắng, hồng nhạt, hồng rose, sắc tối của chữ và sắc hồng trầm của chữ phụ; xanh thành công/đỏ lỗi dành cho ý nghĩa trạng thái. Không tự thêm bảng màu hoặc gán màu giới tính.

Điểm nhận diện Hai nét vẫn thuộc kế hoạch toàn bộ giao diện. Control hỗ trợ nội dung qua một lựa chọn rõ, quyền xem sát thao tác và một xác nhận có thể hủy; không thêm motif trang trí vào mọi input.

Ba mặc định cần thay: picker do hệ điều hành vẽ → dropdown thống nhất theo theme; browser confirm → dialog cùng ngôn ngữ Doita; khối kết quả đẩy nội dung xuống → thông báo nổi nhỏ. Thanh cuộn vẫn cuộn bằng cơ chế trình duyệt; chỉ đổi kiểu hiển thị, không dùng thư viện giả lập cuộn.

## Checkpoint của các component

| Thành phần | Thứ bậc và bề mặt | Chữ, khoảng cách và lý do |
| --- | --- | --- |
| Select | Giá trị được chọn dẫn; chevron chỉ là affordance. Trigger inset hồng rất nhẹ, border; menu nâng bằng shadow theo theme | Chữ kế thừa body, selected 600. Trigger ≥48px, padding 12/16px, gap12, radius12. Option ≥44px, padding8/12, radius8. Khoảng nhỏ phục vụ thao tác thay vì trang trí |
| Confirmation | Nội dung quyết định trước hai nút; Hủy nhận focus. Dialog trắng, cùng Modal hiện có; màu lỗi chỉ cho thao tác phá hủy | Body kế thừa, dòng dễ đọc; gap16, margin24; actions gap12. Không hứa Undo cho xóa vĩnh viễn |
| Feedback | Một icon trạng thái, câu kết quả và nút đóng. Bảng nổi trắng với shadow, không đổi bố cục hay lấy focus | Padding16, gap12, rộng tối đa440px; mobile trên bottom nav, bàn phím mở thì hạ về16px |
| Scroll/selection | Thumb màu chữ phụ; hover rose; text selection hồng với chữ tối | Không cuộn giả, không thay hành vi kéo/chạm; trình duyệt/OS quyết định mức hỗ trợ kiểu scrollbar |

Control colors derive from theme: `--control-paper`, `--control-edge`, `--control-selected`. Animation picker 160ms với ease-out riêng; reduced-motion tắt chuyển động. Không hard-code đường dẫn asset.

## Triển khai

- `src/components/select.tsx`: Radix Select primitive được style bằng CSS hiện có; dùng lại qua `components/ui.tsx` và Field tự liên kết accessible name. Chuyển các select ở Notes/Prayer/Memories/Activities/Settings/Auth và Visibility sang component này. Giá trị số của thời lượng hoạt động vẫn chuyển qua handler cũ; không đổi RPC.
- `src/components/confirmation.tsx`: provider Promise, một quyết định tại một thời điểm; unmount/đổi tài khoản hoặc không gian trả false. Hủy/Escape không thực hiện mutation; chấp nhận trả focus về trigger trước `run()` để giữ action scope. Không reset trạng thái trang để mở dialog.
- `couple-app.tsx`: navigation guard có callback resume, chỉ chạy khi xác nhận; toast theo theme và không chặn focus. Giữ các thay đổi nhãn phụ đã tồn tại trước lượt này.
- `src/styles/redesign.css`: CSS control, scrollbar, caret, selection, feedback, motion dùng theme. Không sửa palette hoặc kiến trúc theme.
- Dependency mới duy nhất: `@radix-ui/react-select` để giữ keyboard/typeahead/focus/positioning; không tự viết toàn bộ hành vi một picker. ESLint bỏ qua skill vendored, artifacts và worktrees Kilo; vẫn kiểm tra source ứng dụng.

## Kiểm chứng thực tế

- Typecheck, build Turbopack, lint: exit 0.
- Edge/Playwright local với Supabase HTTP/WebSocket fixtures: 24 nhóm PASS, exit 0, không pageerror. Một lần xác nhận bị lỗi đồng bộ thời điểm focus trong test; đã chờ focus của primitive trước khi gửi phím End rồi chạy lại thành công, không vá UI để khớp test.
- Có test dropdown End/Escape/focus, kích thước menu 320/1440, hủy rời bản nháp giữ nội dung, chấp nhận mới chuyển trang. Regression giữ like/Realtime/scoped busy, thông báo/sound, reload, Back, draft, archive/restore, receipt retry, expiry, phân trang và tên dài trên bảy route.
- Đã xem screenshot menu desktop/mobile và confirmation mobile sau khi đợi animation kết thúc. Ảnh local nằm trong `doita-test/redesign-evidence/controls-*`; ảnh đầu chưa settle không được dùng làm kết quả cuối.
- `git diff --check`: exit 0. Không đổi database/schema/RLS, không gửi email/push hoặc mutation production. Kiểm tra browser có fixtures, không phải bằng chứng backend live.

Đối chiếu RULES_UX: 1–7 và 13–16 giữ handler/draft/receipt hiện có; 8–12 giữ collection/Back/search/pagination; 17–20 thay control và cách phản hồi; 21–24 không đổi quyền/sound/date/session; 25–26 đã kiểm tra narrow viewport, keyboard, Escape và focus. Chưa kiểm tra screen reader, điện thoại vật lý, mọi tổ hợp lỗi và hành động xóa với backend thật. Không tự tick đạt tất cả 26 tiêu chí.

Ngoại lệ: dialog khi đóng/reload tab do browser quản lý (`beforeunload`), web không thể tự thay skin. Native input ngày chưa bị thay bằng date picker; yêu cầu riêng hiện tập trung dropdown, scrollbar và phản hồi. Bố cục Home, vùng đọc và hiệu ứng Hai nét chưa được triển khai trong lượt control này.
