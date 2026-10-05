# Prompt bộ icon giao diện Doita

Phạm vi: kiểm kê source hiện tại và soạn prompt, chưa tạo ảnh hoặc thay code. Bộ thư viện đang import là `lucide-react` (^1.52.0); không thấy import `react-icons` hoặc bộ icon khác trong src. Có 35 biểu tượng riêng, tái sử dụng theo ý nghĩa. Icon ứng dụng trong public/icons và favicon là bộ khác; thay chúng không thay icon thao tác.

## Quy cách chung để gửi AI

Thiết kế icon giao diện cho Doita, web riêng của hai người. Minh họa phẳng hai sắc độ, nét mềm nhưng dứt khoát, chính diện trừ khi mô tả khác. Màu chính #bc3156, nét tương phản #302630, điểm phụ #ffe8f0; không dùng màu nhạt làm nét nhận diện duy nhất. Nét chính tương đương 2 px khi hiển thị 24 px. Hình nằm trong vùng giữa 72% ô vuông, cùng trọng lượng thị giác và khoảng đệm. Nhận ra ở 16–32 px. Nền alpha trong suốt thật, không nền trắng hay ô caro được vẽ vào ảnh. Không chữ, watermark, emoji, vàng, kem, 3D, glow, gradient, bóng đổ, texture; không tự thêm tim, hoa, mặt hoặc sparkle.

Có icon hiện chỉ 16–19 px (Pin, nút, điều hướng), không chỉ 20–32 px. Nên thử cả 16 px trước khi duyệt. Heart trong Auth còn hiển thị 42/48 px. Giữ màu success/error riêng cho CircleCheck, CircleAlert và Trash2; không tô mọi trạng thái cùng hồng.

## Kiểm kê theo code

| Icon thư viện | Ý nghĩa đang dùng | File/component |
| --- | --- | --- |
| ShieldCheck | Dialog quyết định không phá hủy | `src/components/confirmation.tsx` |
| Trash2 | Dialog thao tác phá hủy | `src/components/confirmation.tsx` |
| House | Đi tới Hôm nay | `src/components/couple-app.tsx` |
| NotebookPen | Đi tới Lời nhắn | `src/components/couple-app.tsx` |
| Ship | Điều ước, thả điều ước | `src/components/couple-app.tsx`, `src/features/prayer/screen.tsx` |
| Camera | Kỷ niệm và mốc ảnh | `src/components/couple-app.tsx`, `src/features/memories/screen.tsx` |
| Sparkles | Cùng làm và chọn gợi ý | `src/components/couple-app.tsx`, `src/features/activities/screen.tsx` |
| Users | Đi tới Hai đứa | `src/components/couple-app.tsx` |
| Menu | Mở điều hướng mobile | `src/components/couple-app.tsx` |
| X | Đóng menu và thông báo | `src/components/couple-app.tsx` |
| CircleCheck | Phản hồi thao tác thành công | `src/components/couple-app.tsx` |
| CircleAlert | Phản hồi thao tác lỗi | `src/components/couple-app.tsx` |
| Bell | Mở thông báo và cài thông báo | `src/components/notification-bell.tsx`, `src/features/settings/screen.tsx` |
| Volume2 | Âm thanh thông báo đang bật | `src/components/notification-bell.tsx` |
| VolumeX | Âm thanh thông báo đang tắt | `src/components/notification-bell.tsx` |
| Check | Mục dropdown được chọn; daily đã trả lời | `src/components/select.tsx`, `src/features/daily/screen.tsx` |
| ChevronDown | Mở dropdown và cuộn xuống | `src/components/select.tsx` |
| ChevronUp | Cuộn lên trong dropdown | `src/components/select.tsx` |
| ThumbsUp | Thích gợi ý hoạt động | `src/features/activities/screen.tsx` |
| ThumbsDown | Không thích gợi ý hoạt động | `src/features/activities/screen.tsx` |
| Heart | Auth, thông tin cặp đôi, ngày bên nhau, phản hồi daily | `src/features/auth/screen.tsx`, `src/features/daily/screen.tsx`, `src/features/settings/screen.tsx` |
| Eye | Bấm để hiện mật khẩu | `src/features/auth/screen.tsx` |
| EyeOff | Bấm để ẩn mật khẩu | `src/features/auth/screen.tsx` |
| Flame | Chuỗi daily | `src/features/daily/screen.tsx` |
| Sun | Mood vui | `src/features/daily/screen.tsx` |
| Moon | Mood mệt | `src/features/daily/screen.tsx` |
| CloudRain | Mood buồn | `src/features/daily/screen.tsx` |
| Wind | Mood áp lực | `src/features/daily/screen.tsx` |
| Leaf | Mood bình yên | `src/features/daily/screen.tsx` |
| Hourglass | Mood đang bận | `src/features/daily/screen.tsx` |
| Plus | Tạo lời nhắn, điều ước, kỷ niệm | `src/features/memories/screen.tsx`, `src/features/notes/screen.tsx`, `src/features/prayer/screen.tsx` |
| Pin | Lời nhắn được ghim | `src/features/notes/screen.tsx` |
| Feather | Gợi ý viết và mở bản nháp điều ước | `src/features/prayer/screen.tsx` |
| LogOut | Thoát tài khoản | `src/features/settings/screen.tsx` |
| Calendar | Ngày đặc biệt trong cài đặt | `src/features/settings/screen.tsx` |

Các icon nav và mood được render qua biến Icon, vẫn được tính vào kiểm kê. NotebookPen đang là icon Lời nhắn; phong thư đề xuất bên dưới là thay hình cho cùng vai trò, không phải import có sẵn. Sparkles hiện là gợi ý/Cùng làm; chỉ vẽ sparkle cho đúng icon này. ThemeArt (heart, envelope, avatar, empty state) là asset sẵn qua src/config/themes.ts, không phải Lucide; không tạo lại các minh họa lớn trong lượt này.

## Bốn mẫu trước: prompt lưới 2 × 2

Copy quy cách chung phía trên và đoạn sau vào cùng yêu cầu; gửi kèm ảnh giao diện hiện tại và asset heart/envelope nếu muốn AI bám phong cách.

> Xuất PNG alpha trong suốt 1024 × 1024 px. Bố trí lưới vô hình 2 cột × 2 hàng; mỗi ô 512 × 512 px. Không vẽ đường lưới, nhãn, số thứ tự hoặc giao diện giả. Đọc từ trái sang phải, từ trên xuống: (1) nhà nhỏ; (2) trái tim; (3) máy ảnh; (4) phong thư đóng với nắp gập chữ V, không dấu tim niêm phong. Mỗi đối tượng nằm chính giữa ô, giới hạn trong vùng 368 × 368 px; khoảng trống ít nhất 72 px mỗi phía. Giữ cùng nét, góc nhìn và mức chi tiết. Đây là bốn icon UI riêng để cắt, không phải một cảnh minh họa.

Phong thư thử thay NotebookPen cho mục Lời nhắn; duyệt nghĩa với người dùng trước khi tích hợp. Kiểm tra mẫu trong nav trắng/hồng và nút hồng/chữ trắng; không dùng filter CSS sửa màu. Chỉ tạo tiếp sau khi bốn mẫu rõ ở kích thước thật.

## Prompt riêng từng icon

Mỗi prompt dưới đây ghép với quy cách chung. Khi tạo riêng: PNG alpha 512 × 512 px, một icon duy nhất. Khi tạo theo lưới: dùng mô tả từng icon làm nội dung đúng ô, không yêu cầu AI đọc mã nguồn hoặc thay code.

### 1. House — Nhà

> Ngôi nhà nhỏ nhìn chính diện, mái bo nhẹ, một cửa giữa; không ống khói hoặc cảnh nền. Ý nghĩa cần giữ: Đi tới Hôm nay. Không thêm vật thể ngoài mô tả.

### 2. NotebookPen — Sổ và bút

> Sổ nhỏ đóng với một cây bút nghiêng bên phải; hai chi tiết lớn, không dòng chữ. Ý nghĩa cần giữ: Đi tới Lời nhắn. Không thêm vật thể ngoài mô tả.

### 3. Ship — Thuyền

> Thuyền giấy gấp đơn giản nhìn ngang hơi chếch; thân và hai nếp gấp rõ, không biển hoặc sóng nền. Ý nghĩa cần giữ: Điều ước, thả điều ước. Không thêm vật thể ngoài mô tả.

### 4. Camera — Máy ảnh

> Máy ảnh thân bo tròn nhìn thẳng, một ống kính lớn và nút chụp nhỏ; không chữ thương hiệu. Ý nghĩa cần giữ: Kỷ niệm và mốc ảnh. Không thêm vật thể ngoài mô tả.

### 5. Sparkles — Gợi ý

> Một ngôi sao bốn cánh mềm lớn và một ngôi sao nhỏ; đây là biểu tượng gợi ý, không rải thêm trang trí. Ý nghĩa cần giữ: Cùng làm và chọn gợi ý. Không thêm vật thể ngoài mô tả.

### 6. Users — Hai người

> Hai hình đầu tròn và vai sát nhau, ngang hàng; không khuôn mặt, giới tính hoặc tim. Ý nghĩa cần giữ: Đi tới Hai đứa. Không thêm vật thể ngoài mô tả.

### 7. Menu — Menu

> Ba nét ngang song song, đầu nét tròn, cùng độ dài. Ý nghĩa cần giữ: Mở điều hướng mobile. Không thêm vật thể ngoài mô tả.

### 8. X — Đóng

> Hai nét chéo tạo dấu X cân đối, đầu nét tròn; không khung bao. Ý nghĩa cần giữ: Đóng menu và thông báo. Không thêm vật thể ngoài mô tả.

### 9. CircleCheck — Thành công

> Vòng tròn rõ với dấu tích lớn ở giữa; dùng màu thành công #276449 thay màu rose. Ý nghĩa cần giữ: Phản hồi thao tác thành công. Không thêm vật thể ngoài mô tả.

### 10. CircleAlert — Lỗi

> Vòng tròn rõ với dấu chấm than lớn ở giữa; dùng màu lỗi #9e293b thay màu rose. Ý nghĩa cần giữ: Phản hồi thao tác lỗi. Không thêm vật thể ngoài mô tả.

### 11. ShieldCheck — Xác nhận

> Khiên bo mềm với dấu tích giữa, hình đối xứng; không ổ khóa hoặc huy chương. Ý nghĩa cần giữ: Dialog quyết định không phá hủy. Không thêm vật thể ngoài mô tả.

### 12. Trash2 — Xóa

> Thùng rác nhỏ có nắp và hai nét dọc, nhìn thẳng; màu lỗi #9e293b. Ý nghĩa cần giữ: Dialog thao tác phá hủy. Không thêm vật thể ngoài mô tả.

### 13. Bell — Chuông

> Chuông mái cong, thân rộng và quả lắc nhỏ, không badge hoặc số. Ý nghĩa cần giữ: Mở thông báo và cài thông báo. Không thêm vật thể ngoài mô tả.

### 14. Volume2 — Bật âm

> Loa nhỏ và hai cung sóng rõ phía phải; không nốt nhạc. Ý nghĩa cần giữ: Âm thanh thông báo đang bật. Không thêm vật thể ngoài mô tả.

### 15. VolumeX — Tắt âm

> Cùng thân loa với mẫu bật âm, thay hai cung sóng bằng dấu X rõ phía phải. Ý nghĩa cần giữ: Âm thanh thông báo đang tắt. Không thêm vật thể ngoài mô tả.

### 16. Check — Đã chọn

> Một dấu tích lớn, hai nhánh không bằng nhau, đầu nét tròn; không vòng tròn. Ý nghĩa cần giữ: Mục dropdown được chọn; daily đã trả lời. Không thêm vật thể ngoài mô tả.

### 17. ChevronDown — Mở danh sách

> Một chữ V nông đối xứng, đầu nét tròn, không khung bao. Ý nghĩa cần giữ: Mở dropdown và cuộn xuống. Không thêm vật thể ngoài mô tả.

### 18. ChevronUp — Cuộn lên

> Cùng hình học với ChevronDown nhưng lật dọc, như mái nhỏ, không khung bao. Ý nghĩa cần giữ: Cuộn lên trong dropdown. Không thêm vật thể ngoài mô tả.

### 19. Pin — Ghim

> Ghim bảng đầu rộng, thân ngắn và mũi nhọn; nghiêng nhẹ, silhouette dễ nhận. Ý nghĩa cần giữ: Lời nhắn được ghim. Không thêm vật thể ngoài mô tả.

### 20. Plus — Thêm

> Dấu cộng cân đối, hai nét vuông góc cùng độ dài, đầu nét tròn; không khung bao. Ý nghĩa cần giữ: Tạo lời nhắn, điều ước, kỷ niệm. Không thêm vật thể ngoài mô tả.

### 21. Heart — Tim

> Một trái tim cân đối mềm, hai thùy rõ và đáy không quá nhọn; không mắt hoặc mặt. Ý nghĩa cần giữ: Auth, thông tin cặp đôi, ngày bên nhau, phản hồi daily. Không thêm vật thể ngoài mô tả.

### 22. Eye — Hiện mật khẩu

> Một mắt hạnh nhân với đồng tử lớn giữa; không mi mắt, lông mi hoặc gương mặt. Ý nghĩa cần giữ: Bấm để hiện mật khẩu. Không thêm vật thể ngoài mô tả.

### 23. EyeOff — Ẩn mật khẩu

> Giữ hình mắt mẫu Eye, thêm một nét chéo rõ; không biến thành mắt nhắm. Ý nghĩa cần giữ: Bấm để ẩn mật khẩu. Không thêm vật thể ngoài mô tả.

### 24. LogOut — Đăng xuất

> Khung cửa đơn giản bên trái và mũi tên sang phải đi ra ngoài; không nhân vật. Ý nghĩa cần giữ: Thoát tài khoản. Không thêm vật thể ngoài mô tả.

### 25. Calendar — Lịch

> Tờ lịch vuông bo góc, hai móc trên và một ô ngày lớn; không số hoặc chữ. Ý nghĩa cần giữ: Ngày đặc biệt trong cài đặt. Không thêm vật thể ngoài mô tả.

### 26. Flame — Ngọn lửa

> Ngọn lửa một thùy lớn và một lõi nhỏ, hình mềm; chỉ dùng rose, không vàng hoặc cam. Ý nghĩa cần giữ: Chuỗi daily. Không thêm vật thể ngoài mô tả.

### 27. Sun — Vui

> Mặt trời tròn với sáu tia ngắn tròn; không mặt cười, không vàng. Ý nghĩa cần giữ: Mood vui. Không thêm vật thể ngoài mô tả.

### 28. Moon — Mệt

> Trăng lưỡi liềm mềm, mũi không quá nhọn; không sao hoặc mây. Ý nghĩa cần giữ: Mood mệt. Không thêm vật thể ngoài mô tả.

### 29. CloudRain — Buồn

> Mây nhỏ ba thùy với hai nét mưa ngắn bên dưới; không mặt khóc. Ý nghĩa cần giữ: Mood buồn. Không thêm vật thể ngoài mô tả.

### 30. Wind — Áp lực

> Hai luồng gió ngang với đầu cuộn đơn giản, khoảng cách rõ; không lá hoặc nền. Ý nghĩa cần giữ: Mood áp lực. Không thêm vật thể ngoài mô tả.

### 31. Leaf — Bình yên

> Một chiếc lá mềm nghiêng nhẹ, một gân giữa; không nhiều gân nhỏ. Ý nghĩa cần giữ: Mood bình yên. Không thêm vật thể ngoài mô tả.

### 32. Hourglass — Đang bận

> Đồng hồ cát đối xứng, hai đáy rộng và eo giữa rõ, một khối cát đơn giản; không hạt li ti. Ý nghĩa cần giữ: Mood đang bận. Không thêm vật thể ngoài mô tả.

### 33. Feather — Bút lông

> Một bút lông mềm với trục giữa và ngòi ngắn, nghiêng nhẹ; không chữ hoặc lọ mực. Ý nghĩa cần giữ: Gợi ý viết và mở bản nháp điều ước. Không thêm vật thể ngoài mô tả.

### 34. ThumbsUp — Thích

> Bàn tay tối giản ngón cái hướng lên và cổ tay rõ, không chi tiết móng; hình đọc được ở 18 px. Ý nghĩa cần giữ: Thích gợi ý hoạt động. Không thêm vật thể ngoài mô tả.

### 35. ThumbsDown — Không thích

> Cùng hình học bàn tay ThumbsUp nhưng ngón cái hướng xuống; không khuôn mặt hoặc ký hiệu phụ. Ý nghĩa cần giữ: Không thích gợi ý hoạt động. Không thêm vật thể ngoài mô tả.

### Mẫu bổ sung: Envelope — Phong thư

> Một phong thư đóng nhìn chính diện, hình chữ nhật bo mềm, nắp gập chữ V rõ; không giấy thò ra, dấu tim niêm phong, chữ hoặc bóng đổ. Dùng cho mục Lời nhắn nếu chọn thay NotebookPen. Đây là phương án thay thế, không thêm chức năng.

## Tạo cả bộ bằng lưới nhỏ

Dùng bốn mẫu đã duyệt làm ảnh tham chiếu ở mọi lần tạo. Lưới giảm số lần gọi nhưng AI vẫn có thể lệch vị trí/nét; phải kiểm tra trước khi cắt. Không dùng một tấm chứa cả bộ quá nhỏ. Đề xuất 6 ảnh 3 × 2, mỗi ảnh 1536 × 1024 px, ô 512 × 512 px:

| Tấm | Hàng 1, trái → phải | Hàng 2, trái → phải |
| --- | --- | --- |
| 01 — Điều hướng | House, NotebookPen hoặc Envelope, Ship | Camera, Sparkles, Users |
| 02 — Thao tác | Plus, Pin, Feather | Bell, Volume2, VolumeX |
| 03 — Điều khiển | Menu, X, Check | ChevronDown, ChevronUp, LogOut |
| 04 — Trạng thái và tài khoản | CircleCheck, CircleAlert, ShieldCheck | Trash2, Eye, EyeOff |
| 05 — Cặp đôi và daily | Heart, Calendar, Flame | Sun, Moon, CloudRain |
| 06 — Mood còn lại | Wind, Leaf, Hourglass | ThumbsUp, ThumbsDown, một ô trống alpha |

> Xuất PNG alpha 1536 × 1024 px theo lưới vô hình 3 cột × 2 hàng. Mỗi ô 512 × 512 px, tâm ô lần lượt (256,256), (768,256), (1280,256), (256,768), (768,768), (1280,768). Không vẽ đường lưới hoặc chữ. Mỗi hình nằm trong vùng 368 × 368 px quanh tâm ô. Nội dung từng ô theo thứ tự: [điền sáu mô tả riêng ở trên]. Giữ nguyên phong cách bốn mẫu tham chiếu. Không vẽ vật thể nối giữa các ô. Ô yêu cầu trống phải trong suốt hoàn toàn.

Nếu chỉ dùng một hình cho Lời nhắn, chọn NotebookPen hoặc Envelope, không sinh cả hai trong bộ cuối. Tấm 06 có năm icon, ô cuối trong suốt.

## Cắt và tích hợp sau khi anh có ảnh

- Giữ nguyên PNG lưới nguồn; cắt theo tọa độ ô, không tự dò rồi resize mỗi hình khác nhau. Nếu lệch tâm, sửa có kiểm soát trước khi xuất.
- Xuất PNG/WebP alpha 96 × 96 px cho icon nhỏ, 192 × 192 px cho Heart 48 px; giữ khung vuông và đệm. Với foreground chiếm 72%, cần kiểm tra kích thước thị giác khi component render, tránh icon nhỏ hơn Lucide cũ. Kiểm tra alpha thật, viền và dung lượng; không nhúng bitmap vào SVG.
- Icon trên nền trắng: bộ nét đậm; trên nút hồng: cần bản foreground trắng, được xuất từ nguồn đã duyệt. Trạng thái success/error giữ màu riêng. Không dùng opacity hoặc filter để chữa sai màu nguồn.
- Tích hợp qua registry/component chung và theme; giữ handler, accessible name, aria-pressed, aria-current, disabled và nhãn. Icon trang trí aria-hidden=true; không nhét nội dung thông báo vào ảnh.
- Kiểm tra desktop/mobile ở 16/18/19/20/24/26/32/48 px tùy chỗ dùng, active/disabled và focus, nền trắng/hồng, alignment với chữ. Không báo đã kiểm chứng giao diện chỉ từ kiểm kê source.

Lượt này chỉ đọc code và soạn tài liệu; chưa tạo/cắt ảnh, chưa thay icon thư viện, chưa kiểm chứng render mới. Không commit/push/deploy.
