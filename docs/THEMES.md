# Theme và assets của Doita

Theme mặc định là `sunset` (Hoàng hôn dịu dàng). Đây là theme assets AI của lượt redesign; chữ, dữ liệu, nút và trạng thái vẫn là HTML. Không đổi tên thương hiệu trong `CONTENT.brand`.

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

Avatar mặc định là nhân vật minh họa, không phải ảnh thật của người dùng. 8 ảnh sticker/empty giữ alpha. Hoa được dự trữ trong contract theme, chưa đặt lên nội dung để tránh che chữ. Bộ WebP tổng 243.892 byte, hero desktop 54.612 byte/mobile 48.566 byte; PNG gốc vẫn nằm trong `public/assets/doita` và không được UI tải.

## Resize lại

```powershell
powershell -ExecutionPolicy Bypass -File scripts/prepare-theme-assets.ps1
```

Script dùng ImageMagick, chỉ tạo các WebP trong theme `sunset`, giữ nguyên PNG nguồn. Đọc/thay danh sách nguồn và đích trong script khi làm theme khác; không ghi đè bản thiết kế gốc. Ảnh mới nên giữ tỉ lệ phù hợp, không nhúng chữ hoặc nút. Ảnh có alpha cần kiểm tra viền trên nền sáng và tối.

Ảnh riêng do người dùng tải lên vẫn nằm trong Supabase Storage có quyền truy cập; không đưa vào thư mục public của theme. Hiện ảnh kỷ niệm chỉ lấy signed URL khi gần viewport; chưa tạo thumbnail riêng cho ảnh upload.
