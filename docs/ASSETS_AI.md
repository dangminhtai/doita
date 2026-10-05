# Bộ assets AI cho Doita

Ngày chuẩn bị: 05/10/2026. Nguồn định hướng: ảnh giao diện anh Tài gửi; tuân theo RULES_UX.md. Phạm vi lượt này: tạo và lưu assets, chưa thay giao diện hoặc deploy.

## Phong cách chung

Hồng đào, coral, kem và tím hoàng hôn; minh họa mềm, ánh sáng ấm, ít chi tiết. Avatar là nhân vật hư cấu mặc định, không phải ảnh thật của anh hoặc người ấy. Không nhúng tên, số ngày, câu hỏi, nội dung thư hoặc chữ vào ảnh. Khi tích hợp, tất cả nội dung động vẫn là HTML.

## Danh sách cần tạo

| STT | Asset được chọn | Kích thước thực tế | Định dạng | Trạng thái |
| --- | --- | --- | --- | --- |
| 1 | [backgrounds/hero-desktop.png](../public/assets/doita/backgrounds/hero-desktop.png) | 1672 × 941 | RGB, nền đầy đủ | Đã tạo và kiểm tra |
| 2 | [backgrounds/hero-mobile.png](../public/assets/doita/backgrounds/hero-mobile.png) | 1024 × 1536 | RGB, nền đầy đủ | Đã tạo và kiểm tra |
| 3 | [avatars/avatar-a.png](../public/assets/doita/avatars/avatar-a.png) | 1254 × 1254 | RGB, nền đầy đủ | Đã tạo và kiểm tra |
| 4 | [avatars/avatar-b.png](../public/assets/doita/avatars/avatar-b.png) | 1254 × 1254 | RGB, nền đầy đủ | Đã tạo và kiểm tra |
| 5 | [stickers/love-envelope.png](../public/assets/doita/stickers/love-envelope.png) | 1254 × 1254 | RGBA, alpha 0–255 | Đã tạo và kiểm tra |
| 6 | [stickers/couple-mascots.png](../public/assets/doita/stickers/couple-mascots.png) | 1254 × 1254 | RGBA, alpha 0–255 | Đã tạo và kiểm tra |
| 7 | [stickers/soft-heart.png](../public/assets/doita/stickers/soft-heart.png) | 1254 × 1254 | RGBA, alpha 0–255 | Đã tạo và kiểm tra |
| 8 | [stickers/flowers-v2.png](../public/assets/doita/stickers/flowers-v2.png) | 1254 × 1254 | RGBA, alpha 0–255 | Đã tạo và kiểm tra |
| 9 | [empty/notes-empty.png](../public/assets/doita/empty/notes-empty.png) | 1254 × 1254 | RGBA, alpha 0–255 | Đã tạo và kiểm tra |
| 10 | [empty/memories-empty.png](../public/assets/doita/empty/memories-empty.png) | 1254 × 1254 | RGBA, alpha 0–255 | Đã tạo và kiểm tra |
| 11 | [empty/wishes-empty.png](../public/assets/doita/empty/wishes-empty.png) | 1254 × 1254 | RGBA, alpha 0–255 | Đã tạo và kiểm tra |
| 12 | [empty/notifications-empty.png](../public/assets/doita/empty/notifications-empty.png) | 1254 × 1254 | RGBA, alpha 0–255 | Đã tạo và kiểm tra |

Kích thước định hướng: nền desktop ngang 16:9, nền mobile dọc 2:3, avatar vuông có khoảng trống để crop tròn, sticker/empty state có khoảng đệm và nền trong suốt. Kích thước thực tế sẽ ghi sau khi kiểm tra file đầu ra.

## Những phần dùng SVG/CSS và assets hiện có

- Icon chức năng: dùng lucide-react hiện có (House, Mail, Star, Images, Calendar, Bell, Search, Plus, X, ArrowLeft…). Giữ nhãn dễ hiểu; không dùng ảnh AI làm nút.
- Logo trái tim và chữ Doita: SVG/chữ thật; không ghi đè favicon/PWA icon hiện có trong lượt này.
- Khung Polaroid, băng dính trang trí, tim nét vẽ, card, badge, checkbox và bóng đổ: CSS/SVG.
- Font nội dung hỗ trợ tiếng Việt; lựa chọn đề xuất Be Vietnam Pro. Chưa tải/cài font trong lượt này.
- Ảnh kỷ niệm và avatar thật là dữ liệu người dùng; không đưa ảnh AI vào như thể đó là kỷ niệm thật.

## Quy tắc tích hợp UX

- Ảnh nền lớn ưu tiên trang Hôm nay; các trang chức năng có bố cục riêng, không nhồi tất cả vào một trang.
- Sticker chỉ trang trí, không che chữ/nút; trên mobile giảm bớt hoặc ẩn khi cần.
- Hình trạng thái trống đi kèm câu giải thích và hành động tiếp theo bằng HTML, không tự thay thế thông báo lỗi.
- Đồ trang trí có alt rỗng; avatar có tên người dùng; ảnh kỷ niệm có mô tả phù hợp.
- Giữ PNG có alpha gốc; khi tích hợp tối ưu WebP/AVIF và dùng lazy loading theo vị trí, tránh tải toàn bộ 12 ảnh ngay khi mở web.

## Prompt đã chuẩn bị

Công cụ: built-in image_gen; mỗi asset một yêu cầu riêng. Không dùng CLI/API key, không lấy ảnh của bên thứ ba làm deliverable.

### 1. backgrounds/hero-desktop.png

```text
Use case: illustration-story.
Asset type: production website raster asset for Doita.
Shared Doita art direction: gentle romantic pastel peach pink #F7B5BE, coral #EA4F70, warm ivory #FFF8F2 and muted lavender #B9ACC9. Premium soft hand-painted editorial illustration, warm sunset light, delicate natural texture, clean readable silhouettes, restrained detail. Original artwork, no text, no lettering, no logo, no watermark, no UI, no screenshots or card layouts. Decorative asset only; do not imitate a recognizable licensed character.
Primary request: Landscape 16:9 website hero background. Peaceful Vietnamese riverside city at sunset, reflective river, distant low skyline, peach clouds and muted lavender sky. Two small young adult figures sitting side by side viewed from behind at the far lower right. Upper and left two thirds should be calm uncluttered sky/water with low contrast, ready for real HTML copy to be overlaid. No foreground collage or Polaroids. The background should work beneath a soft gradient overlay.
```

### 2. backgrounds/hero-mobile.png

```text
Use case: illustration-story.
Asset type: production website raster asset for Doita.
Shared Doita art direction: gentle romantic pastel peach pink #F7B5BE, coral #EA4F70, warm ivory #FFF8F2 and muted lavender #B9ACC9. Premium soft hand-painted editorial illustration, warm sunset light, delicate natural texture, clean readable silhouettes, restrained detail. Original artwork, no text, no lettering, no logo, no watermark, no UI, no screenshots or card layouts. Decorative asset only; do not imitate a recognizable licensed character.
Primary request: Portrait 2:3 mobile website hero background. Peaceful Vietnamese riverside city at sunset, reflective river, distant low skyline, peach clouds and muted lavender sky. Two small young adult figures sitting side by side seen from behind at the bottom right, plenty of calm low-detail sky in the upper half for real HTML copy. A distinct portrait composition, no UI, no collage or Polaroids.
```

### 3. avatars/avatar-a.png

```text
Use case: illustration-story.
Asset type: production website raster asset for Doita.
Shared Doita art direction: gentle romantic pastel peach pink #F7B5BE, coral #EA4F70, warm ivory #FFF8F2 and muted lavender #B9ACC9. Premium soft hand-painted editorial illustration, warm sunset light, delicate natural texture, clean readable silhouettes, restrained detail. Original artwork, no text, no lettering, no logo, no watermark, no UI, no screenshots or card layouts. Decorative asset only; do not imitate a recognizable licensed character.
Primary request: Square default avatar portrait of a fictional young adult Vietnamese man, short dark hair, warm relaxed expression, wearing a simple muted teal shirt. Bust portrait in three-quarter view facing slightly right. Clean softly painted facial features, rounded silhouettes, warm ivory background, generous margin for a circular crop. No real-person likeness. Show the complete head and shoulders.
```

### 4. avatars/avatar-b.png

```text
Use case: illustration-story.
Asset type: production website raster asset for Doita.
Shared Doita art direction: gentle romantic pastel peach pink #F7B5BE, coral #EA4F70, warm ivory #FFF8F2 and muted lavender #B9ACC9. Premium soft hand-painted editorial illustration, warm sunset light, delicate natural texture, clean readable silhouettes, restrained detail. Original artwork, no text, no lettering, no logo, no watermark, no UI, no screenshots or card layouts. Decorative asset only; do not imitate a recognizable licensed character.
Primary request: Square default avatar portrait of a fictional young adult Vietnamese woman, shoulder-length dark hair, warm relaxed expression, wearing a simple blush pink blouse. Bust portrait in three-quarter view facing slightly left. Clean softly painted facial features, rounded silhouettes, warm ivory background, generous margin for a circular crop. No real-person likeness. Show the complete head and shoulders.
```

### 5. stickers/love-envelope.png

```text
Use case: illustration-story.
Asset type: production website raster asset for Doita.
Shared Doita art direction: gentle romantic pastel peach pink #F7B5BE, coral #EA4F70, warm ivory #FFF8F2 and muted lavender #B9ACC9. Premium soft hand-painted editorial illustration, warm sunset light, delicate natural texture, clean readable silhouettes, restrained detail. Original artwork, no text, no lettering, no logo, no watermark, no UI, no screenshots or card layouts. Decorative asset only; do not imitate a recognizable licensed character.
Primary request: Single standalone square sticker asset: a softly painted blush-pink folded envelope with a small coral heart-shaped wax seal, a little ivory letter peeking out. Slight three-quarter perspective, centered entire object with generous padding. True transparent background, no floor/background/backplate, no cast shadow outside object.
```

### 6. stickers/couple-mascots.png

```text
Use case: illustration-story.
Asset type: production website raster asset for Doita.
Shared Doita art direction: gentle romantic pastel peach pink #F7B5BE, coral #EA4F70, warm ivory #FFF8F2 and muted lavender #B9ACC9. Premium soft hand-painted editorial illustration, warm sunset light, delicate natural texture, clean readable silhouettes, restrained detail. Original artwork, no text, no lettering, no logo, no watermark, no UI, no screenshots or card layouts. Decorative asset only; do not imitate a recognizable licensed character.
Primary request: Single standalone square sticker asset: two original tiny rounded ivory marshmallow-like animal mascots with small ears, dot eyes, subtle pink cheeks, leaning affectionately shoulder to shoulder, one holding a tiny coral heart. Simple thin warm-brown outlines and watercolor shading, cute but restrained. Entire figures centered with generous padding. True transparent background, no floor/background/backplate, no cast shadow outside objects.
```

### 7. stickers/soft-heart.png

```text
Use case: illustration-story.
Asset type: production website raster asset for Doita.
Shared Doita art direction: gentle romantic pastel peach pink #F7B5BE, coral #EA4F70, warm ivory #FFF8F2 and muted lavender #B9ACC9. Premium soft hand-painted editorial illustration, warm sunset light, delicate natural texture, clean readable silhouettes, restrained detail. Original artwork, no text, no lettering, no logo, no watermark, no UI, no screenshots or card layouts. Decorative asset only; do not imitate a recognizable licensed character.
Primary request: Single standalone square sticker asset: one plump coral-pink heart with soft painted dimensional shading, a tiny warm highlight and delicate irregular contour, gentle handmade appearance rather than glossy plastic. Entire heart centered with generous padding. True transparent background, no decorative extra objects, no floor/background/backplate, no cast shadow outside object.
```

### 8. stickers/flowers.png

```text
Use case: illustration-story.
Asset type: production website raster asset for Doita.
Shared Doita art direction: gentle romantic pastel peach pink #F7B5BE, coral #EA4F70, warm ivory #FFF8F2 and muted lavender #B9ACC9. Premium soft hand-painted editorial illustration, warm sunset light, delicate natural texture, clean readable silhouettes, restrained detail. Original artwork, no text, no lettering, no logo, no watermark, no UI, no screenshots or card layouts. Decorative asset only; do not imitate a recognizable licensed character.
Primary request: Single standalone portrait sticker asset: a delicate small sprig of white baby's breath flowers, a few tiny peach-pink blossoms and muted sage green stems, leaning gently. Soft hand-painted fine floral illustration, airy gaps between flowers, generous padding around complete stems. True transparent background, no vase/background/backplate, no cast shadow outside object.
```

### 9. empty/notes-empty.png

```text
Use case: illustration-story.
Asset type: production website raster asset for Doita.
Shared Doita art direction: gentle romantic pastel peach pink #F7B5BE, coral #EA4F70, warm ivory #FFF8F2 and muted lavender #B9ACC9. Premium soft hand-painted editorial illustration, warm sunset light, delicate natural texture, clean readable silhouettes, restrained detail. Original artwork, no text, no lettering, no logo, no watermark, no UI, no screenshots or card layouts. Decorative asset only; do not imitate a recognizable licensed character.
Primary request: Square empty-state illustration for a private couples notes page: one small open blush-pink envelope with a blank ivory letter and one tiny coral heart, peaceful minimal arrangement. Readable at 160px, low detail, complete centered object with generous padding. True transparent background, no text, no UI, no floor or backplate.
```

### 10. empty/memories-empty.png

```text
Use case: illustration-story.
Asset type: production website raster asset for Doita.
Shared Doita art direction: gentle romantic pastel peach pink #F7B5BE, coral #EA4F70, warm ivory #FFF8F2 and muted lavender #B9ACC9. Premium soft hand-painted editorial illustration, warm sunset light, delicate natural texture, clean readable silhouettes, restrained detail. Original artwork, no text, no lettering, no logo, no watermark, no UI, no screenshots or card layouts. Decorative asset only; do not imitate a recognizable licensed character.
Primary request: Square empty-state illustration for a couples photo memories page: two overlapping blank ivory Polaroid frames, their picture windows filled with a very simple peach sunset and lavender river illustration, a tiny strip of translucent pink tape at top. Minimal arrangement readable at 160px, centered with generous padding. True transparent background, no text, no real photo, no floor or backplate.
```

### 11. empty/wishes-empty.png

```text
Use case: illustration-story.
Asset type: production website raster asset for Doita.
Shared Doita art direction: gentle romantic pastel peach pink #F7B5BE, coral #EA4F70, warm ivory #FFF8F2 and muted lavender #B9ACC9. Premium soft hand-painted editorial illustration, warm sunset light, delicate natural texture, clean readable silhouettes, restrained detail. Original artwork, no text, no lettering, no logo, no watermark, no UI, no screenshots or card layouts. Decorative asset only; do not imitate a recognizable licensed character.
Primary request: Square empty-state illustration for a couples wishes page: one small softly painted golden-peach star above a tiny folded ivory paper boat with a blush-pink edge. Calm poetic composition, a couple of subtle small sparkles, minimal and readable at 160px, complete centered shapes with generous padding. True transparent background, no water scene/background/backplate, no text.
```

### 12. empty/notifications-empty.png

```text
Use case: illustration-story.
Asset type: production website raster asset for Doita.
Shared Doita art direction: gentle romantic pastel peach pink #F7B5BE, coral #EA4F70, warm ivory #FFF8F2 and muted lavender #B9ACC9. Premium soft hand-painted editorial illustration, warm sunset light, delicate natural texture, clean readable silhouettes, restrained detail. Original artwork, no text, no lettering, no logo, no watermark, no UI, no screenshots or card layouts. Decorative asset only; do not imitate a recognizable licensed character.
Primary request: Square empty-state illustration for a couples notification inbox: a small softly painted warm-ivory bell with a coral-pink ribbon and a tiny sleeping crescent-shaped accent, resting calm appearance, no urgency, no unread red dot. Minimal illustration readable at 160px, complete centered objects with generous padding. True transparent background, no floor/background/backplate, no text.
```

## Kết quả kiểm tra

Đã lưu 12 ảnh được chọn vào `public/assets/doita/`; kiểm tra PNG decode bằng Pillow và SHA256 của bản sao so với ảnh AI gốc đều qua (exit 0). Tám sticker/empty state có RGBA với alpha thực 0–255. Đã xem ảnh sinh ra để đối chiếu chủ thể, bố cục và việc không có chữ/UI nhúng trong ảnh.

Nhành hoa bản đầu `stickers/flowers.png` còn quầng nền mờ, không chọn để tích hợp. Bản cuối dùng `stickers/flowers-v2.png`, 86,03% pixel alpha bằng 0. Giữ bản đầu để đối chiếu; lần chỉnh nền bằng AI chưa đạt nên tạo lại nhành hoa đơn giản hơn. Các biến thể không được chọn còn lưu tại thư mục mặc định của công cụ, không được dùng trong UI.

Xem toàn bộ tại [ASSETS_PREVIEW.html](ASSETS_PREVIEW.html); mở bằng trình duyệt từ ổ đĩa. Trang có thể đổi nền sáng/tối để kiểm tra ảnh có alpha. Đã chạy Edge headless: đủ 12 ảnh tải được, đổi nền hoạt động, viewport 390px không tràn ngang (exit 0).

Đây là bộ PNG nguồn; chưa chuyển sang WebP/AVIF, chưa tích hợp vào trang web và chưa deploy. Không chạy lại test ứng dụng vì lượt này chỉ thêm ảnh và tài liệu, không sửa code ứng dụng.

### Prompt nhành hoa được chọn — flowers-v2.png

```text
Use case: illustration-story. Create one small production website floral sticker, square canvas. A minimal clean hand-drawn botanical SPRIG, only 7 tiny ivory flowers and 3 tiny blush pink flowers on two slender sage-green stems, restrained warm-brown thin outlines and very light watercolor shading INSIDE petals only. Doita pastel palette blush pink coral ivory lavender. Simplified 2D cutout illustration, not photographic, not photorealistic, no blur, no glow, no background wash, no shadow, no scenery, no fog. The full tiny sprig centered with 25 percent empty padding on every side. True transparent background including every gap between stems and petals. Everything outside sharply delineated petals, leaves and stems is alpha zero. No text or UI.
```
