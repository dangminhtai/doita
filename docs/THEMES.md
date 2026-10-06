# Theme và assets của Doita

Theme mặc định giữ ID `sunset`, hiện dùng bộ doodle-art do anh cung cấp. Chữ, dữ liệu, nút và trạng thái vẫn là HTML. Không đổi tên thương hiệu trong `CONTENT.brand`.

Theo chỉnh sửa ngày 05/10/2026 sau phản hồi của anh: giao diện theo ảnh mẫu trắng/hồng nhẹ, chữ Nunito bản thường (nội dung 400/16px/1.6, nút/menu 600, tiêu đề 700–800). Không dùng nền giấy kem/vàng hoặc khối sông xanh đậm. `river` hiện là nền hồng nhạt, chữ trong cảnh dùng `text`; theme sau cần giữ cặp foreground/background này hoặc cập nhật component và audit cùng nhau. Màu hoa/hoàng hôn nằm trong ảnh minh họa, không ép mọi khối nội dung theo màu ảnh.

## Tạo theme tiếp theo

1. Đặt ảnh mới vào `public/themes/<theme-id>/`, giữ PNG thiết kế gốc ở thư mục nguồn riêng.
2. Thêm một mục vào `THEMES` trong `src/config/themes.ts`, đủ các màu và 12 vai trò ảnh theo `ThemeDefinition`. Không cần đổi tên ảnh: cấu hình ánh xạ vai trò sang đường dẫn của anh.
3. Đổi `DEFAULT_THEME` sang ID mới. `RootLayout`, hero, avatar và `ThemeArt` dùng chung cấu hình này. Tên theme hiển thị hiện nằm trong `CONTENT.redesign.defaultTheme`; đổi cùng khi chọn theme mới.
4. Chạy typecheck/build và xem Home/Notes/Prayer/Memories/Activities/Couple/Profile/Auth ở mobile và desktop. Đo lại contrast; màu trang trí nhạt không nên dùng làm chữ.

Hiện có một theme và chưa có trình chọn theme theo tài khoản. Các theme dùng chung bố cục/CSS; thay đổi phong cách bố cục cần sửa CSS có kiểm tra tương ứng.

## Minh họa hoạt động

`ThemeDefinition.activityArt` ánh xạ ID hoạt động sang URL ảnh; sunset dùng `src/config/activity-art.ts`. Bộ 100 ảnh nằm tại `public/themes/sunset/activities`, WebP512×512 giữ alpha, tổng 4.510.944 byte. Mapping đối chiếu ID/title/description với `data/activities.json`; không cần seed hoặc sửa schema Supabase để hiện ảnh.

Khung gợi ý dùng `ActivityArt` theo ID đã chọn, hiển thị180px, alt rỗng vì tên/mô tả có sẵn bằng HTML. Ảnh thiếu/lỗi thì bỏ minh họa, không thay bằng mascot sai nghĩa. Mascot chỉ dùng khi chưa có hoạt động được chọn. Theme mới khai báo `activityArt` riêng, không hard-code đường dẫn trong feature.

Chạy `node scripts/prepare-activity-art.mjs` để xuất lại từ bộ nguồn `doita-test/doita-activity-art`: dùng68 WebP đã có và32 PNG trong `missing`, giữ nguyên nguồn, kiểm tra mapping/kích thước/alpha trước khi ghi. Registry có hash URL để thay ảnh không bị cache cũ. Thư mục nguồn bị gitignore; bản WebP và registry dùng trên web phải được đưa cùng code khi deploy.

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

`ProfileAvatar` đọc `profiles.avatar_path` và URL ký hạn5phút của bucket riêng tư `avatars`; ảnh user là WebP256×256 tối đa80KB. Header, hồ sơ, thành viên, tác giả lời nhắn và daily dùng chung component. Theme avatarA/avatarB vẫn là fallback, không gán theo giới tính hoặc thay ảnh thiết kế gốc.

## Resize lại

```powershell
node scripts/prepare-doodle-art.mjs
```

Script dùng Sharp đã có trong môi trường Next, tạo WebP ở `public/themes/sunset/doodle-art`, giữ nguyên PNG nguồn và cập nhật hash phiên bản URL trong registry. `prepare-theme-assets.ps1` là công cụ cho bộ ảnh cũ. Đọc/thay danh sách nguồn và đích trong script khi làm theme khác; không ghi đè bản thiết kế gốc. Ảnh mới nên giữ tỉ lệ phù hợp, không nhúng chữ hoặc nút. Ảnh có alpha cần kiểm tra viền trên nền sáng và tối.

Ảnh riêng do người dùng tải lên vẫn nằm trong Supabase Storage có quyền truy cập; không đưa vào thư mục public của theme. Hiện ảnh kỷ niệm chỉ lấy signed URL khi gần viewport; chưa tạo thumbnail riêng cho ảnh upload.

Icon ứng dụng dùng URL có phiên bản trong `src/config/app-icons.ts` cho favicon/Apple/manifest. Khi thay artwork trong `public/icons` hoặc `public/favicon.svg`, tăng `version` để cache trình duyệt nhận URL mới; giữ tên file nguồn. PWA đã cài có thể cần thời gian hoặc cài lại để hệ điều hành cập nhật icon.

Bộ icon UI mặc định là artwork của anh từ `doita-test/cuts`, registry `src/config/ui-icons.ts` và `THEME.icons`. Dùng exports của `src/components/icons.tsx` thay import thư viện. Nguồn PNG giữ nguyên ở `public/assets/doita/doodle-icons`; WebP dùng trên web ở `public/themes/sunset/icons`. Khi thêm theme, khai báo đủ các vai trò icon, gồm biến chevron cho disclosure; không hard-code đường dẫn trong feature. Tên Trash2/Volume2/VolumeX là vai trò cũ, lần lượt dùng trash/volume-on/volume-off.

### Assets trang giới thiệu không gian

Nguồn của anh: doita-test/doita-new-icons. PNG gốc giữ nguyên tại public/assets/doita/public-space; WebP sao chép từ nguồn tại public/themes/sunset/public-space. Registry src/config/public-space-art.ts gắn hash nội dung. Copy/Link/UserPlus đi qua THEME.icons; minh họa không tồn tại qua THEME.assets.spaceUnavailable. Không filter màu, không thêm icon thư viện. Avatar cá nhân được stream qua API kiểm tra consent, không đưa signed URL ra trang công khai.
