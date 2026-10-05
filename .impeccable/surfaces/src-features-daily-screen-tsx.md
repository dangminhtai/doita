---
version: 1
slug: "src-features-daily-screen-tsx"
primary_target: "src/features/daily/screen.tsx"
related_targets: ["src/features/notes/screen.tsx","src/styles/redesign.css"]
---

# Doita — brief triển khai Hai nét

Anh đã yêu cầu triển khai PLAN_DOITA_IMPECCABLE.md ngày 05/10/2026. Mode: Operate cho Home và các luồng nhập liệu; Read cho vùng đọc lời nhắn. Luồng chính: Home → lời nhắn → đọc hoặc viết → quay lại đúng vị trí.

## Direction contract

**THESIS:** Lời nhắn của hai người dẫn Home. Bỏ banner lớn đứng trước công việc và lưới thẻ tính năng ngang độ nổi bật.

**OWN-WORLD:** Giữ theme sunset trắng/hồng và sans dễ đọc. Hai dấu cong nhỏ nhận diện tác giả qua vị trí/hình dạng, luôn đi cùng tên. Vùng đọc trắng rộng, vùng daily hồng nhẹ; vùng phụ tiết chế. Assets minh họa thuộc theme, không giả làm kỷ niệm thật.

**STORY:** Người dùng nhận ra ai gửi nội dung, mở đúng lời nhắn hoặc bắt đầu viết; trạng thái riêng/chung, draft và lưu lỗi vẫn rõ. Không thêm đã đọc, online hoặc tính năng phản hồi chưa có.

**FIRST VIEWPORT:** Nhận diện hai người gọn ở đầu; dưới là vùng lời nhắn chính bên trái và daily hẹp hơn bên phải trên desktop. Mobile xếp lời nhắn trước daily. CTA viết ở tiêu đề vùng lời nhắn; khi có thư nút mở gắn với đúng item. Kỷ niệm và truy cập phụ nằm thấp hơn. Hai nét mở một lần trong vùng đọc, không hoạt ảnh toàn trang.

**FORM:** Hướng 6, Hai nét, trong danh sách ở PLAN_DOITA_IMPECCABLE.md. Seed key `0ac5c5d3`. Anh phê duyệt triển khai kế hoạch và chọn kết hợp mockup với bản chạy thật. Đã tạo ba comp A/B/C ở `.impeccable/mocks/`; chưa có comp được duyệt. Pha comps đang mở, không viết UI trước khi đóng pha này.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Ràng buộc triển khai

Giữ nguyên API/RPC, RLS, quyền daily, receipt, response guards và bản nháp. Không sửa bốn diff UI có trước theo hướng hoàn tác. Kiểm tra tương tác bằng fixtures Supabase local; không sử dụng dữ liệu thật để demo hoặc gửi thông báo production.

## Kiểm chứng

Home lời nhắn đứng trước daily ở mọi viewport; nội dung riêng của bản thân không bị giới thiệu như thư người ấy. Kiểm tra có/không dữ liệu, tên dài, field width, CTA khi mở composer/filter, reader Escape/focus, quay lại, giảm motion, loading/lỗi và request cũ. Đọc ảnh mobile/desktop và audit theo craft-floor. Chỉ ghi kết quả đã chạy.
