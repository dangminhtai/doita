# Theme và assets của Doita

Theme mặc định giữ ID `sunset`, hiện dùng bộ doodle-art do anh cung cấp. Chữ, dữ liệu, nút và trạng thái vẫn là HTML. Không đổi tên thương hiệu trong `CONTENT.brand`.

Theo chỉnh sửa ngày 05/10/2026 sau phản hồi của anh: giao diện theo ảnh mẫu trắng/hồng nhẹ, chữ sans-serif hệ thống. Không dùng nền giấy kem/vàng hoặc khối sông xanh đậm. `river` hiện là nền hồng nhạt, chữ trong cảnh dùng `text`; theme sau cần giữ cặp foreground/background này hoặc cập nhật component và audit cùng nhau. Màu hoa/hoàng hôn nằm trong ảnh minh họa, không ép mọi khối nội dung theo màu ảnh.

## Tạo theme tiếp theo

1. Đặt ảnh mới vào `public/themes/<theme-id>/`, giữ PNG thiết kế gốc ở thư mục nguồn riêng.
2. Thêm một mục vào `THEMES` trong `src/config/themes.ts`, đủ các màu và 12 vai trò ảnh theo `ThemeDefinition`. Không cần đổi tên ảnh: cấu hình ánh xạ vai trò sang đường dẫn của anh.
3. Đổi `DEFAULT_THEME` sang ID mới. `RootLayout`, hero, avatar và `ThemeArt` dùng chung cấu hình này. Tên theme hiển thị hiện nằm trong `CONTENT.redesign.defaultTheme`; đổi cùng khi chọn theme mới.
4. Chạy typecheck/build và xem Home/Notes/Prayer/Memories/Activities/Settings/Auth ở mobile và desktop. Đo lại contrast; màu trang trí nhạt không nên dùng làm chữ.

Hiện có một theme và chưa có trình chọn theme theo tài khoản. Các theme dùng chung bố cục/CSS; thay đổi phong cách bố cục cần sửa CSS có kiểm tra tương ứng.

## Vai trò và kích thước ảnh hiện tại

| Vai trò | File WebP | Kích thước |
| --- | --- | --- |
| Hero desktop | hero-desktop | 1279×720 |
| Hero mobile | hero-mobile | 640×960 |
| Avatar hai thành viên | avatar-a / avatar-b | 192×192 |
| Phong bì, mascot, hoa | envelope / mascots / flowers | 480×480 |
| Trái tim | heart | 256×256 |
| Trạng thái trống | empty-notes / empty-memories / empty-prayer / empty-notifications | 320×320 |

Avatar mặc định là nhân vật minh họa, không phải ảnh thật của người dùng. 8 ảnh sticker/empty giữ alpha. Hoa được dự trữ trong contract theme, chưa đặt lên nội dung để tránh che chữ. Bộ doodle-art WebP hiện tại tổng 196.028 byte, hero desktop 30.886 byte/mobile 31.188 byte; PNG nguồn nằm trong `public/assets/doita/doodle-art` và không được UI tải. Bộ ảnh cũ vẫn giữ nguyên ở vị trí cũ.

## Resize lại

```powershell
node scripts/prepare-doodle-art.mjs
```

Script dùng Sharp đã có trong môi trường Next, tạo WebP ở `public/themes/sunset/doodle-art`, giữ nguyên PNG nguồn và cập nhật hash phiên bản URL trong registry. `prepare-theme-assets.ps1` là công cụ cho bộ ảnh cũ. Đọc/thay danh sách nguồn và đích trong script khi làm theme khác; không ghi đè bản thiết kế gốc. Ảnh mới nên giữ tỉ lệ phù hợp, không nhúng chữ hoặc nút. Ảnh có alpha cần kiểm tra viền trên nền sáng và tối.

Ảnh riêng do người dùng tải lên vẫn nằm trong Supabase Storage có quyền truy cập; không đưa vào thư mục public của theme. Hiện ảnh kỷ niệm chỉ lấy signed URL khi gần viewport; chưa tạo thumbnail riêng cho ảnh upload.

Icon ứng dụng dùng URL có phiên bản trong `src/config/app-icons.ts` cho favicon/Apple/manifest. Khi thay artwork trong `public/icons` hoặc `public/favicon.svg`, tăng `version` để cache trình duyệt nhận URL mới; giữ tên file nguồn. PWA đã cài có thể cần thời gian hoặc cài lại để hệ điều hành cập nhật icon.

Bộ icon UI mặc định là artwork của anh từ `doita-test/cuts`, registry `src/config/ui-icons.ts` và `THEME.icons`. Dùng exports của `src/components/icons.tsx` thay import thư viện. Nguồn PNG giữ nguyên ở `public/assets/doita/doodle-icons`; WebP dùng trên web ở `public/themes/sunset/icons`. Khi thêm theme, khai báo đủ các vai trò icon, gồm biến chevron cho disclosure; không hard-code đường dẫn trong feature. Tên Trash2/Volume2/VolumeX là vai trò cũ, lần lượt dùng trash/volume-on/volume-off.
