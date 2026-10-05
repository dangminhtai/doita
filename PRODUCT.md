<!-- impeccable:product-schema 1 -->
# Doita — sự thật sản phẩm

## Platform
web

## Users
Hai người trong một cặp đôi, sử dụng không gian chung trên điện thoại hoặc máy tính. Anh Tài cho phép đề xuất bản sắc dựa trên chức năng hiện có; không có một thói quen hay câu chuyện riêng cụ thể được xác nhận để đưa vào thiết kế.

## Product Purpose
Giữ lời nhắn, câu trả lời hằng ngày, kỷ niệm và những việc hai người muốn làm cùng nhau. Anh Tài xác nhận ngày 2026-10-05: ưu tiên khi mở web là đọc và viết lời nhắn cho người ấy.

## Positioning
Một không gian riêng cho hai người, có nội dung và tương tác thật. Không phải trang giới thiệu sản phẩm hay bảng điểm tình yêu.

## Operating Context
Ứng dụng Next.js/React, Supabase, PWA; triển khai Vercel. Các luồng dùng trên localhost và production phải giữ đúng địa chỉ môi trường. Nội dung Việt ngữ, thao tác chạm và bàn phím đều phải dùng được.

## Capabilities and Constraints
- Có lời nhắn, câu hỏi hằng ngày, điều ước, ảnh kỷ niệm, hoạt động cùng làm, thiết lập và thông báo.
- Câu trả lời của người ấy chỉ mở khi điều kiện hiện có trên máy chủ cho phép; không suy diễn trạng thái riêng tư.
- Giữ phân quyền, bản nháp theo tài khoản, phản hồi khi thao tác đã lưu nhưng tải lại thất bại và vị trí khi quay lại danh sách.
- Gợi ý hoạt động hiện là danh mục và bộ lọc cục bộ; không quảng bá là AI.
- Không khôi phục trang admin, privacy, chức năng xuất dữ liệu hoặc trường múi giờ chỉ đọc đã được yêu cầu bỏ.
- Đợt hiện tại chỉ lập kế hoạch; không thêm chức năng, sửa giao diện hoặc triển khai production.

## Brand Commitments
Giữ tinh thần trắng, hồng, lãng mạn và chữ rõ ràng đã được anh chọn. Không tự chuyển sang nền kem, màu đất, mảng xanh đậm hoặc chữ serif trang trí. Assets hiện tại là theme mặc định; kiến trúc phải cho phép thay assets bằng theme khác sau này.

Tên dự án là Doita; tên thương hiệu đang hiển thị trong code là “Gần nhau”. Chưa có quyết định đổi tên hiển thị trong đợt này.

## Evidence on Hand
AGENTS.md; RULES_UX.md; docs/THEMES.md; docs/REDESIGN_LOG.md; docs/ASSETS_AI.md; source hiện tại; ảnh kiểm tra trong doita-test/redesign-evidence/. Ảnh avatar AI là minh họa, không phải ảnh của người dùng. Chưa kiểm tra dữ liệu Supabase thật trong đợt lập kế hoạch này.

## Product Principles
UI/UX là ưu tiên đầu tiên. Một thao tác có một điểm thực hiện rõ ràng. Nội dung của hai người dẫn bố cục; không thêm khẩu hiệu để lấp chỗ trống. Hiệu ứng giải thích chuyển trạng thái và không che lỗi hoặc trì hoãn thao tác.

## Accessibility & Inclusion
Chữ Việt có dấu phải rõ; nhãn và trạng thái không chỉ dựa vào màu hoặc icon. Giữ focus, thao tác bàn phím, hỗ trợ giảm chuyển động, lỗi có hướng xử lý và khả năng đọc trên màn hình nhỏ.
