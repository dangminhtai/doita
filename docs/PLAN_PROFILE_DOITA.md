# Kế hoạch tách Hồ sơ và Hai đứa

Ngày: 05/10/2026. Trạng thái: đề xuất dựa trên code hiện tại, chưa triển khai hoặc thay dữ liệu Supabase.

## 1. Mục tiêu và hiện trạng

Avatar là lối vào thông tin **cá nhân**; tab Hai đứa là lối vào **không gian chung**. Hai nơi phải có tiêu đề, đường dẫn và hành động khác nhau, không mở cùng một form.

Đã đối chiếu:

- `src/components/couple-app.tsx`: avatar và mục nav `settings` cùng gọi `go("settings")`. Nhánh chưa có couple luôn mở PairScreen, nên cần xử lý để người chưa ghép đôi vẫn vào được hồ sơ.
- `src/features/settings/screen.tsx`: tên hiển thị đang gửi qua `update_settings` cùng ngày bắt đầu, timezone và resurfacing. Tên tab nội bộ `profile` hiện chứa cả thông tin cá nhân và không gian.
- `src/components/theme-art.tsx`: DefaultAvatar chỉ chọn avatarA/avatarB theo index, chưa dùng avatar thật của tài khoản.
- `src/components/app-context.tsx`: đã đọc hồ sơ chính mình khi chưa ghép đôi; luồng refresh/action cần được kiểm tra thêm cho thao tác cá nhân không có couple.
- Migration core có `profiles.display_name` tối đa 60 ký tự và `avatar_path`; chưa có `gender` hay username duy nhất. Bucket ảnh hiện thấy trong migrations là `memories`, chưa có bucket avatar riêng.
- `perform_authorized_action` hiện có danh sách action cố định và kiểm tra couple cho nhiều thao tác. Không mặc định RPC mới sẽ chạy được qua wrapper này.

Đây là bằng chứng từ source/migrations trong workspace; chưa kiểm tra schema hoặc quyền đang triển khai trên Supabase production.

## 2. Phân chia giao diện

| Lối vào | Đường dẫn | Nội dung |
| --- | --- | --- |
| Avatar góc header | `/profile` | Ảnh đại diện, tên hiển thị, giới tính, thông tin tài khoản |
| Tab Hai đứa | `/settings` | Hai thành viên, mã mời, ngày bắt đầu, ngày đặc biệt, thiết lập chung, rời không gian |

Hồ sơ dùng tiêu đề **Hồ sơ của bạn**. Hai đứa giữ tiêu đề hiện tại và active trong thanh điều hướng khi mở `/settings`. Khi ở `/profile`, avatar có trạng thái được chọn; không tô active tab Hai đứa.

Desktop: avatar mở thẳng hồ sơ. Mobile: giữ tab Hai đứa; bổ sung lối vào Hồ sơ của bạn trong menu, dùng avatar cá nhân. Khi chưa ghép đôi vẫn hiện lối vào hồ sơ; `/settings` khi đó dẫn đến tạo/tham gia không gian.

Không thêm tab Hồ sơ thứ bảy vào thanh điều hướng chính. Không đổi tên thương hiệu, bố cục các feature khác, hoặc khôi phục admin/privacy/export/theme picker/múi giờ.

## 3. Bố cục hồ sơ

Một cột gọn, tối đa khoảng 640 px, trên mobile chiếm chiều rộng khả dụng. Nunito và palette trắng/hồng hiện có; dùng icon doodle, Field, Select, Button, Modal và confirmation chung.

Thứ tự:

1. Tiêu đề Hồ sơ của bạn.
2. Avatar khoảng 88 px, nút **Đổi ảnh**, tùy chọn **Dùng ảnh mặc định** khi đang có ảnh riêng.
3. Ô **Tên hiển thị**, giới hạn 1–60 ký tự sau trim.
4. Mục **Giới tính** và hành động đổi hoặc trạng thái khóa.
5. **Lưu thay đổi**; chỉ bật khi có thay đổi hợp lệ. Lỗi đặt cạnh mục liên quan.
6. Nhóm Tài khoản nhỏ bên dưới: email chỉ đọc, đường dẫn đổi mật khẩu, đăng xuất và xóa tài khoản nếu chức năng hiện có hỗ trợ. Tách thao tác nguy hiểm khỏi nút Lưu.

Tên hiển thị là tên người ấy thấy trong lời nhắn, không phải tên đăng nhập. Đăng nhập vẫn bằng email. Trong phạm vi này không thêm username duy nhất, đường dẫn công khai hoặc cơ chế tìm tài khoản.

Đổi tên không thay email, ID tài khoản, quyền truy cập hay tác giả của nội dung cũ. UI đọc tên mới qua profile ID.

## 4. Đổi ảnh đại diện

Luồng: Đổi ảnh → chọn ảnh trên máy → popup crop vuông → xác nhận crop → preview trên hồ sơ → Lưu thay đổi.

Popup crop có vùng vuông và preview tròn, điều chỉnh vị trí/zoom bằng thao tác chạm hoặc chuột và control dùng được bằng bàn phím. Nút **Hủy** và **Dùng ảnh này**. Hủy không upload hoặc xóa ảnh cũ. Không bóp méo ảnh để đạt kích thước vuông.

Quy cách đề xuất:

- Nhận JPEG/PNG/WebP, file nguồn tối đa 5 MB; không nhận SVG hoặc ảnh động trong bước đầu.
- Crop theo lựa chọn, xuất **WebP 256 × 256 px**. Mục tiêu khoảng 30–50 KB; giới hạn bản lưu **80 KB**. Chỉ gửi bản đã nén, không lưu bản gốc người dùng.
- Xử lý orientation và bỏ metadata khi tạo lại ảnh. Nếu không xử lý được định dạng, báo lỗi rõ và giữ ảnh hiện tại.
- Server kiểm tra nội dung thực, định dạng, kích thước và dung lượng; không tin tên file hoặc kiểm tra client. 256 × 256 không tự đảm bảo file nhỏ.
- Dùng bucket avatar riêng tư trong Supabase, đường dẫn dựa trên user ID và phiên bản ngẫu nhiên. Không dùng folder couple cho avatar: ảnh thuộc tài khoản và còn tồn tại khi rời không gian.
- Một ảnh đang dùng mỗi tài khoản. Upload ảnh mới → xác nhận cập nhật `avatar_path` thành công → dọn ảnh cũ. Không xóa ảnh cũ trước khi profile trỏ sang ảnh mới.
- Có cơ chế dọn ảnh upload rồi bỏ dở, xử lý hai tab đổi ảnh đồng thời và retry không tạo nhiều bản đang dùng. Khi mất phản hồi, xác minh trạng thái trước khi xóa file.
- Xóa tài khoản phải dọn avatar qua luồng cleanup hiện có hoặc bổ sung thích hợp; không chỉ xóa hàng profiles.

Ước tính riêng cho avatar: 1.000 tài khoản × 80 KB ≈ 80 MB, chưa tính file tạm. Đây là giới hạn đề xuất, không phải lượng dùng đã đo. Không triển khai R2 trong kế hoạch này.

Quyền đọc: chủ tài khoản và người còn chung không gian; URL có thời hạn, không mở bucket public. URL đã cấp có thể còn dùng được đến hết hạn: không hứa thu hồi ngay một URL ảnh đã gửi xuống máy. Khi rời không gian, ngừng cấp URL mới cho người cũ và bỏ cache UI phù hợp.

Avatar thật phải được dùng thống nhất ở header, hồ sơ, danh sách thành viên, lời nhắn và câu trả lời daily. Asset avatarA/avatarB hiện tại là fallback khi chưa có ảnh hoặc tải lỗi; không tự gán avatar theo giới tính.

## 5. Giới tính và popup khóa

Đề xuất giá trị: **Chưa thiết lập**, **Nam**, **Nữ**, **Khác**, **Không muốn chia sẻ**. Hồ sơ cũ mặc định Chưa thiết lập, không suy ra từ tên hoặc avatar. Nếu anh muốn chỉ có Nam/Nữ, cần chốt trước migration; không tự gán dữ liệu người dùng cũ.

Quy tắc anh yêu cầu: khi tài khoản **còn là thành viên của một không gian**, không được đổi giới tính. Điều kiện là membership thật, không phải giới tính của người ấy, số thành viên đủ hai hay trạng thái giao diện. Không thêm điều kiện loại trừ cặp đôi cùng giới vào luồng ghép đôi.

| Trạng thái | Giao diện và hành vi |
| --- | --- |
| Chưa tham gia không gian | Cho chọn giới tính, lưu cùng hồ sơ |
| Đang trong không gian, kể cả một thành viên | Hiện giá trị hiện tại và nút Đổi có biểu tượng khóa; bấm mở popup giải thích |
| Chưa tải được membership | Hiện Đang kiểm tra; không cho đổi dựa trên dữ liệu thiếu |
| Vừa rời không gian thành công | Tải lại membership đã xác nhận rồi mở quyền đổi |
| Tab khác vừa tham gia không gian | Server từ chối thay đổi giới tính; giữ draft tên/ảnh, thông báo và cập nhật trạng thái khóa |

Popup khi bị khóa:

> **Chưa thể đổi giới tính**
>
> Bạn đang ở trong một không gian. Để đổi giới tính trong hồ sơ, bạn cần rời không gian trước.

Nút: **Đóng** và **Quản lý không gian**. Nút thứ hai mở `/settings` tại phần quản lý/rời không gian; không tự rời, không đổi dữ liệu và không gửi RPC rời ngay từ popup.

Rời không gian vẫn dùng confirmation hiện có, giải thích quyền truy cập nội dung chung bị thu hồi. Nếu hồ sơ có draft chưa lưu, xử lý guard trước khi chuyển trang. Không gộp rời không gian và đổi giới tính thành một thao tác.

Khi ở ngoài không gian và đổi giới tính: xác nhận nhẹ trước khi lưu nếu giá trị khác hiện tại, ghi rõ giá trị mới; Hủy giữ draft. Nút popup dùng focus/Escape theo component chung, không dùng window.alert/confirm.

Database phải chặn thay đổi thật của gender khi có membership, kể cả gọi API trực tiếp. Đổi tên/avatar vẫn được phép khi đang ghép đôi. Cần khóa/giao dịch nhất quán giữa thao tác ghép đôi và cập nhật gender để hai request đồng thời không lách điều kiện. Nếu gender không đổi, không từ chối toàn bộ lưu tên/ảnh chỉ vì vẫn đang trong không gian.

## 6. Hai đứa sau khi tách

- Giữ các thành viên, mã mời và ngày bắt đầu tại `/settings`.
- Bỏ ô tên cá nhân khỏi form thiết lập chung. Giữ thiết lập thực sự của không gian ở đây; chuyển thiết lập cá nhân theo dữ liệu sở hữu tương ứng, không sao chép một lựa chọn thành hai nơi lưu.
- Thông báo thiết bị/âm thanh chuyển vào phần tài khoản cá nhân nếu tách trong cùng đợt; ngày đặc biệt và weekly giữ ở không gian. Khi triển khai phải xác minh trường resurfacing hiện thuộc profile hay couple trước khi đặt nó.
- Đăng xuất/xóa tài khoản nằm ở hồ sơ; **Rời không gian** nằm ở Hai đứa. Không đánh đồng xóa tài khoản với rời không gian.
- Không mở màn cá nhân qua tab Hai đứa sau khi đã tách.

Phát hiện cần xử lý khi triển khai: Settings vẫn còn dropdown múi giờ khi `!d.daily`, dù PairScreen đã bỏ. Theo yêu cầu Việt Nam và RULES_UX, bỏ control này; không tự cập nhật timezone của các cặp đôi cũ bằng migration diện rộng.

## 7. Thay đổi kỹ thuật dự kiến

| Phần | Công việc |
| --- | --- |
| `src/app/profile/page.tsx` và feature profile mới | Route và màn cá nhân, hỗ trợ người chưa ghép đôi |
| `src/components/couple-app.tsx` | Avatar mở profile; phân biệt active; route profile được xử lý trước gate chưa có couple; lối vào mobile |
| `src/features/settings/screen.tsx` | Bỏ tên/account cá nhân khỏi màn chung theo phân chia đã chốt; giữ quản lý couple |
| Component avatar dùng chung | Đọc profile theo user ID, ảnh riêng tư và fallback; thay các chỗ chỉ dùng DefaultAvatar |
| `src/components/app-context.tsx` | Load/refresh/profile mutation khi không có couple, session guard, cập nhật tên/ảnh của người ấy |
| `src/features/schemas.ts`, content và CSS | Validation/microcopy/trạng thái/crop theo theme, không thêm khẩu hiệu |
| API/RPC cập nhật hồ sơ | Tách khỏi update_settings; auth người dùng, gender lock tại database, retry/receipt phù hợp scope tài khoản |
| Migration mới | Gender nullable/constraint, quyền cập nhật cột, bucket/policy avatar, cleanup, kiểm tra bypass qua update trực tiếp |

Không chạy migration cũ lại. Không sử dụng service-role key trong trình duyệt. Không dùng action scope couple cho quyết định cá nhân một cách máy móc; receipt hồ sơ gắn user ID và không mất tính hợp lệ chỉ vì rời không gian. Chính sách cleanup phải tránh xóa ảnh mới của request khác.

## 8. Trình tự triển khai

1. Chốt phân chia màn, ý nghĩa Tên hiển thị và các lựa chọn giới tính; dựng route/profile bằng dữ liệu hiện có.
2. Làm migration/RPC và kiểm tra quyền trên local database/fixture: người chưa ghép đôi, đang ghép đôi, hai request đồng thời.
3. Tích hợp lưu tên/gender; tách update_settings để lưu thiết lập chung không ghi đè tên cũ.
4. Làm crop/nén/upload avatar, cleanup và cập nhật component avatar tại mọi nơi.
5. Hoàn thiện popup/dirty guard/error/retry/Realtime; kiểm tra responsive và accessibility.
6. Báo diff, kết quả local, migration cần áp dụng và phần chưa kiểm chứng. Không tự commit/push/deploy hoặc thay production.

Không thêm thư viện crop trước khi kiểm tra giải pháp hiện có; nếu cần thêm, chọn thư viện nhỏ đáp ứng bàn phím/touch, không tự dựng crop thiếu khả năng truy cập.

## 9. Tiêu chí nghiệm thu

- Avatar mở `/profile`; Hai đứa mở `/settings`; Back/Forward và deep link đúng, kể cả chưa có couple.
- Đổi tên 1–60 ký tự, dấu tiếng Việt, khoảng trắng và tên dài hoạt động; các chỗ hiển thị tên cập nhật đúng.
- Chọn/crop ảnh vuông/tròn không méo; bản lưu đúng 256 × 256, không quá 80 KB. Hủy hoặc lỗi không làm mất avatar cũ.
- Hai tab đổi ảnh hoặc retry sau mất phản hồi không xóa nhầm ảnh đang dùng, không tích lũy bản không còn tham chiếu.
- Giới tính bị khóa cả khi không gian mới có một người; popup rõ, không tự rời. API trực tiếp và race ghép đôi không vượt khóa.
- Lưu tên/avatar trong không gian không bị khóa oan; khi rời thành công mới được đổi gender.
- Lỗi mạng, hết phiên, session khác giữ/xóa draft đúng tài khoản; không gửi thay đổi của tài khoản trước sau đăng xuất.
- Người ngoài không đọc/ghi avatar; người cũ không xin URL mới sau khi rời; URL lỗi/hết hạn có fallback và retry phù hợp.
- Mobile 320/390, desktop 1120/1440, zoom200%, tên dài và bàn phím/crop không tràn; focus và Escape hoạt động.
- Theo RULES_UX: đủ phản hồi đang lưu/đã lưu/lỗi/chưa xác nhận; không chỉ lấy build qua làm bằng chứng UX. Không phục hồi các mục anh đã xóa.

Kế hoạch chưa triển khai: không có avatar upload, trường gender hay route profile mới được tạo trong lượt soạn tài liệu này.
