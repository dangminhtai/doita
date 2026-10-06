# Kế hoạch trang giới thiệu không gian Doita

Ngày: 06/10/2026. Trạng thái: kế hoạch đề xuất, chưa triển khai. Đã cập nhật theo review và yêu cầu thêm trạng thái ID sai, streak và số ngày của cặp đôi.

## 1. Mục tiêu

Người dùng gửi một đường dẫn để người khác xem tên, avatar và lời giới thiệu của không gian. Không gian một người có nút **Gửi yêu cầu tham gia không gian**. Không gian hai người chỉ hiển thị giới thiệu, không nhận thêm thành viên.

Bio là nội dung cá nhân, sửa trong `/profile`; trang giới thiệu đọc trực tiếp bio đã lưu, không tạo thêm một bản lời giới thiệu phải sửa ở nơi khác.

Giai đoạn này chỉ làm trang giới thiệu và nối luồng xin tham gia đã có. Trang kỷ niệm công khai, tim, bình luận ẩn danh và tìm kiếm người dùng nằm ngoài phạm vi.

## 2. Đường dẫn và ý nghĩa ID

| Đường dẫn | Vai trò |
| --- | --- |
| `/profile` | Hồ sơ cá nhân của tài khoản đang đăng nhập; sửa tên, avatar, bio và thông tin cá nhân hiện có. |
| `/p/000000001` | Trang giới thiệu công khai của không gian; khách chưa đăng nhập vẫn xem được khi trang đã bật chia sẻ. |
| `/couple` | Quản lý không gian và duyệt yêu cầu tham gia. |

Link đề xuất sau review: `https://doita.vercel.app/p/000000001`. Tách hẳn trang công khai khỏi `/profile`; không triển khai nhánh công khai theo query `?id=` trong form cá nhân. Đây là thay đổi trong kế hoạch, chưa đổi route chạy thật. ID bắt đầu từ `000000001`; `000000000` là ví dụ định dạng, không phải không gian được cấp trong migration hiện tại.

ID thuộc về không gian, cố định, giữ các số 0 đầu và được xử lý như chuỗi 9 chữ số. Không dùng ID làm mật khẩu, không gọi là UUID trong UI. UUID nội bộ và mã dài cũ không xuất hiện trên trang giới thiệu.

Route `/p/[publicId]` luôn xử lý như trang giới thiệu, kể cả ID không hợp lệ; không rơi về form hồ sơ cá nhân. Avatar header vẫn dẫn đến `/profile`.

## 3. Bố cục và nội dung

Một khung giới thiệu chính, dùng Nunito, màu hồng/trắng và icon hiện có. Không thêm hero quảng cáo, số điểm tình yêu, bảng thống kê, subtitle hoặc mascot lặp. Hai con số anh yêu cầu được trình bày gọn trong khung cặp đôi.

### Không gian một người

1. Avatar thật, tên hiển thị và ID nhỏ bên dưới.
2. Bio nếu người đó có viết. Ví dụ nội dung do người dùng tự nhập: “Mình nam 2k6, thử ghép đôi với mình nhé <3”.
3. Một nút chính: **Gửi yêu cầu tham gia không gian**.

Không vẽ người thứ hai giả, không để avatar placeholder đối tác và không chèn lời giới thiệu mẫu khi bio rỗng. Không tự suy giới tính hoặc năm sinh từ bio.

### Không gian hai người

Hai avatar và hai tên có vị trí ngang nhau. Bio của mỗi người nằm dưới đúng tên người đó; không nối hai bio thành một đoạn chung, không dùng bio người thứ nhất đại diện cho cả hai. Bio rỗng thì bỏ đoạn đó.

Không hiện nút xin tham gia, nút khóa hoặc câu cảnh báo dư thừa. Desktop đặt hai phần cạnh nhau; mobile xếp dọc, giữ thứ tự thành viên ổn định. Không thêm chức năng nhắn tin cho người lạ.

### Streak và số ngày của cặp đôi

Chỉ hiện khi có đúng hai thành viên và trang đủ điều kiện công khai. Đặt một hàng nhỏ dưới tên/avatar: **Streak: 12 ngày** · **Bên nhau: 128 ngày**. Không biến thành hai thẻ dashboard, không thêm biểu đồ hoặc điểm số.

- **Streak** là chuỗi hoàn thành daily, không phải tuổi của không gian hoặc số ngày quen nhau. Dùng chung quy tắc với Home, hiện đang lấy `current_streak` khi khoảng cách từ `last_completed_date` tới ngày hiện tại không quá 2 ngày, ngoài ngưỡng thì 0. Tách cách tính thành logic chung khi triển khai để trang công khai và Home không khác nhau; không tự sửa quy tắc streak trong feature này.
- **Bên nhau** tính từ `couples.relationship_start_date` do người dùng đặt: chênh lệch ngày theo Asia/Ho_Chi_Minh + 1; ngày bắt đầu là ngày 1. Chưa đặt ngày hoặc ngày ở tương lai thì bỏ chỉ số đó, không bịa ngày và không lấy `couples.created_at` thay thế.
- Nếu anh muốn nghĩa chính xác là **đã ghép đôi trên Doita**, cần thêm mốc `paired_since` ghi tại lúc thành viên thứ hai được duyệt. Mốc này thuộc cặp hiện tại, phải kết thúc/reset khi rời rồi ghép lại; không giả định ngày bắt đầu yêu nhau là ngày ghép trên web. Đây là phương án riêng, không tự bổ sung trước khi chốt nghĩa chỉ số.
- Streak bằng 0 vẫn hiện 0 khi đọc dữ liệu thành công. Lỗi đọc streak không được chuyển thành 0; bỏ chỉ số bị lỗi và cho cập nhật lại, giữ tên/avatar/bio đã tải.
- Server trả con số đã tính và `asOfDate`; không trả lịch sử daily hoặc ngày hoạt động cuối. Client cập nhật lại khi trở về tab và qua ngày mới; không đọc đồng hồ trình duyệt để tự tăng streak.
- Một người: không hiện streak/số ngày cặp đôi, dù database còn dữ liệu từ cặp trước.

Đề xuất mặc định dùng nhãn **Bên nhau** theo dữ liệu hiện có. Câu anh gọi “số ngày ghép đôi” không được dùng làm nhãn cho ngày do người dùng đặt vì hai mốc có thể khác nhau.

## 4. Bio trong hồ sơ cá nhân

- Thêm trường **Giới thiệu** dưới tên hiển thị trong `/profile`.
- Textarea tối đa 300 ký tự; có bộ đếm nhỏ, xuống dòng được, không bắt buộc.
- Lưu cùng nút **Lưu** hiện có, không tạo nút lưu bio riêng.
- Chỉ dùng văn bản thuần. Render bằng text React, giữ xuống dòng; không HTML, Markdown hoặc tự biến nội dung thành link ở giai đoạn này.
- Lưu thành công mới cập nhật trang giới thiệu. Không đưa bản nháp hoặc nội dung đang gõ ra trang công khai.
- Giữ draft, request ID, nội dung khi lỗi và cơ chế chống ghi đè bởi Realtime hiện có.
- Người dùng được sửa bio dù đang trong không gian một hoặc hai người. Xóa bio bằng cách để trống và lưu.

Giới hạn là **300 Unicode code points**, khớp PostgreSQL `char_length(bio) <= 300`. UI/server đếm bằng `Array.from(bio).length`, không dùng `string.length` hoặc giới hạn native `maxLength=300` làm phép kiểm tra chính. Không dùng grapheme cluster trong phiên bản này: `❤️` là 2 code points dù hiển thị một hình. Bộ đếm, validation và lưu dùng cùng giá trị văn bản; không âm thầm cắt giữa emoji khi người dùng paste.

## 5. Chia sẻ và quyền riêng tư

ID tăng dần có thể đoán được. Do đó đây là trang công khai khi được bật chia sẻ, không phải trang riêng chỉ người biết link mới xem được.

Đề xuất mặc định:

- Không gian cũ và mới đều chưa bật trang giới thiệu cho tới khi người dùng chủ động bật trong Hai đứa.
- Thêm mục gọn **Trang giới thiệu**, có bật/tắt và **Sao chép liên kết**. Khi chưa bật, không cung cấp liên kết như thể trang đã xem được.
- Mỗi người xác nhận cho phép công khai tên, avatar, bio của chính mình và hai chỉ số cặp đôi đã mô tả. Consent thuộc membership trong không gian cụ thể, không phải cờ public toàn tài khoản. Rời không gian rồi vào không gian khác phải đồng ý lại; không kế thừa consent.
- Không gian một người: trang hoạt động khi người đó bật chia sẻ.
- Khi người thứ hai tham gia: tạm ẩn trang cho tới khi người mới cũng đồng ý. Việc ghép đôi vẫn thành công nếu họ chưa đồng ý công khai.
- Không gian hai người: chỉ hiện trang khi cả hai còn đồng ý. Một người tắt chia sẻ thì trang ngừng công khai; không âm thầm tiếp tục hiện hồ sơ họ hoặc biến thành trang một người trong khi thực tế vẫn có hai thành viên.
- Người rời không gian biến mất khỏi trang ngay ở lần đọc tiếp theo. Nếu còn một người, chỉ dùng sự đồng ý của người còn lại.
- Không gian không còn thành viên, bị xóa hoặc chưa bật chia sẻ trả cùng một trạng thái không khả dụng, không trả danh tính người đã rời.

Popup bật chia sẻ: **Công khai tên, ảnh đại diện và giới thiệu của bạn?** Khi có hai người, thêm một câu ngắn **Trang cũng hiển thị streak và số ngày bên nhau.** Có Hủy và Đồng ý; xác nhận cho không gian hiện tại. Không nhồi giải thích lên trang khách.

Trong Hai đứa, mục Trang giới thiệu có đúng ba trạng thái: **Chưa công khai** với nút Bật; **Đang chờ người ấy đồng ý** khi bản thân đã consent nhưng người kia chưa; **Đang công khai** với Sao chép liên kết và Tắt. Không hiện nút bật thay người kia. Không cần master switch riêng nếu toàn bộ trạng thái được suy ra từ consent các thành viên hiện tại.

Không trả email, giới tính cấu trúc, avatar path, mã mời dài, thông báo, ngày sinh, lời nhắn, daily, điều ước hoặc kỷ niệm. Nội dung người dùng chủ động viết trong bio được hiển thị như đã lưu.

## 6. Luồng gửi yêu cầu

| Người đang xem | Hành động ở không gian một người |
| --- | --- |
| Chưa đăng nhập | Bấm nút → đăng nhập/đăng ký → quay về đúng trang theo ID. Không tự gửi yêu cầu sau khi đăng nhập. |
| Đã đăng nhập, chưa có không gian | Bấm nút → gửi qua `request_couple`; hiện Đang chờ đồng ý và Hủy yêu cầu. |
| Đã có yêu cầu chờ tới chính không gian này | Hiện trạng thái chờ và Hủy; không tạo yêu cầu thứ hai. |
| Đang chờ một không gian khác | Báo rõ phải hủy yêu cầu đang chờ; không tự hủy hoặc tự chuyển yêu cầu. |
| Là thành viên của không gian đang xem | Nút **Vào không gian** dẫn tới `/couple`. |
| Đã thuộc không gian khác | Không gửi thêm yêu cầu. Nút **Vào không gian của bạn**; không tự rời để tham gia nơi này. |

Người nhận duyệt tại `/couple`, dùng thông báo và popup xác nhận đã có. Chỉ sau khi database xác nhận chấp nhận mới coi người gửi là thành viên và mở dữ liệu chung.

Giữ hạn yêu cầu 7 ngày, một yêu cầu chờ mỗi người, giới hạn lượt gửi, tối đa hai thành viên và mutation receipts. Khi không gian đầy trong lúc khách đang xem, server từ chối gửi/duyệt; UI tải lại trạng thái thay vì nhận đã gửi thành công.

Đường quay lại sau đăng nhập chỉ chấp nhận URL nội bộ đã kiểm tra. Không dùng tham số URL để tự duyệt, tự gửi hoặc chuyển sang website khác.

## 7. Trạng thái và phản hồi

- Đang tải: khung avatar/tên và trạng thái tải; chưa hiện nút xin tham gia cho tới khi biết số thành viên/quyền.
- ID sai định dạng, ví dụ `99999zbcd9`: hiện **Không gian không tồn tại hoặc đã bị xóa**; không query database, không cắt thành 9 ký tự rồi tra một ID khác.
- ID hợp lệ nhưng không tồn tại, bị xóa hoặc không đủ điều kiện công khai: cùng thông báo **Không gian không tồn tại hoặc đã bị xóa**, HTTP 404 với response chung. Không tiết lộ hồ sơ hoặc lý do trạng thái riêng tư qua response. Đây là lời nhắn theo yêu cầu của anh, không khẳng định đã xác minh lịch sử xóa.
- Lỗi mạng: **Chưa tải được không gian** và Thử lại; không hiện thành “không có không gian”.
- Gửi lỗi: giữ nguyên trang và lựa chọn, cho thử lại; kết quả write chưa rõ phải giữ request ID cũ.
- Bị từ chối/hết hạn: hiện đúng trạng thái, cho gửi lại khi server cho phép.
- Bio dài, avatar lỗi hoặc tên dài: xuống dòng, dùng fallback theme cho avatar; không làm CTA tràn màn hình.

Không dùng trạng thái online giả. Tim trang trí hiện có không phải phản hồi thành công của yêu cầu tham gia.

## 8. Thiết kế dữ liệu và API

### Hồ sơ cá nhân

Thêm `profiles.bio` văn bản mặc định rỗng, constraint `char_length(bio) <= 300`. Consent đặt tại `couple_members.public_profile_consent`, mặc định false, có `public_profile_consented_at` nếu cần lưu mốc đồng ý. Chỉ RPC của chính thành viên được sửa consent của họ; không gộp vào update_profile vì consent thuộc không gian.

Trang công khai khi có 1 hoặc 2 thành viên và tất cả membership hiện tại đều consent. Zero member luôn không khả dụng. Thao tác thêm/rời/xóa membership cập nhật điều kiện này; không dùng cờ đã cache từ trước khi người thứ hai tham gia. Không thêm `couples.public_page_enabled` trong phiên bản đầu để tránh hai trạng thái bật/tắt trùng nhau.

Mở rộng draft/schema/API `/api/profile` và RPC lưu hồ sơ để bio tham gia chữ ký request receipt, result và snapshot sau lưu. Không đổi nghĩa function cũ hoặc phá client đang chạy; migration mới phải có phương án nâng cấp tương thích.

### Trang công khai

Đề xuất endpoint read-only `GET /api/spaces/[publicId]` trả đúng các trường:

```text
publicId
members: [{ displayName, bio, avatarUrl }]
memberCount
coupleStats: null | { streakDays, togetherDays, asOfDate }
```

`coupleStats` chỉ dành cho hai người; chỉ số chưa có hoặc lỗi dùng null tương ứng. API tính từ dữ liệu thật, không nhận số liệu do client gửi. Không trả `relationship_start_date`, `last_completed_date`, lịch sử daily hoặc ngày tạo không gian để client tự tính lại.

Endpoint kiểm tra trạng thái chia sẻ và membership hiện tại ở server trước khi trả. Không mở quyền đọc toàn bộ `profiles`/`couples` cho `anon`, không cho client chọn danh sách cột tùy ý. Nếu dùng service role, chỉ dùng ở server với projection và điều kiện quyền rõ ràng; không đưa key ra browser.

Avatar vẫn dùng ảnh 256×256 đã nén. `avatarUrl` là endpoint nội bộ `/api/spaces/[publicId]/avatars/[memberRef]`, dùng tham chiếu chỉ hợp lệ trong không gian đó. Endpoint kiểm tra lại trang có public, người đó còn là thành viên, còn consent và đang dùng avatar nào ở mỗi request, rồi stream/proxy ảnh; không trả signed URL bucket cho khách. Không đưa `avatar_path` ra response, không sao chép ảnh vào `public/` hay theme. Metadata và ảnh dùng no-store, không đi qua image optimizer/cache dài của Next hoặc CDN trong phiên bản đầu.

Tắt chia sẻ chặn response mới; không hứa thu hồi bản ảnh khách đã tải, chụp hoặc lưu trước đó. Request đã xử lý trước lúc tắt có thể đã nhận dữ liệu; đọc projection/consent nhất quán và giới hạn vòng đời response, không tuyên bố thu hồi tuyệt đối.

Tra cứu công khai cần giới hạn tần suất, không cung cấp API liệt kê mọi ID. `noindex` cho trang giới thiệu trong phiên bản đầu. Rate limit/noindex chỉ giảm thu thập và lạm dụng, không biến public_id tăng dần thành bí mật. Link chỉ dành cho người biết link sẽ cần token ngẫu nhiên riêng trong một kế hoạch khác.

### Motion của trang công khai

Avatar vào nhẹ opacity + scale 0.96 → 1, tên dịch 6px → 0, bio fade; dùng token motion hiện có, tối đa một lượt sau tải dữ liệu lần đầu. CTA có press cùng hệ thống, không trì hoãn gửi yêu cầu. Không tự chạy lại toàn bộ khung khi bio/streak refresh. Trang hai người có thể dùng một nét nối/icon tim nhỏ cố định giữa avatar; không thêm animation vòng lặp hoặc trang trí che tên.

Không gắn ClickHearts toàn màn hình vào route công khai. Reduced-motion bỏ scale/dịch chuyển, hiện nội dung tĩnh; tab ẩn dừng hiệu ứng. Chưa thêm thư viện animation.

## 9. Các file dự kiến tác động

| Khu vực | File/nhóm file |
| --- | --- |
| Trang công khai | Route mới `src/app/p/[publicId]/page.tsx` và component giới thiệu riêng; `/profile` giữ nguyên nghĩa. |
| Hồ sơ và bio | `src/features/profile/screen.tsx`, `/api/profile`, schema/RPC/draft liên quan. |
| Chia sẻ liên kết | `src/features/couple/screen.tsx`. |
| Xin tham gia | Tái sử dụng `request_couple`, `JoinRequests`, luồng quay lại sau auth. |
| Đọc giới thiệu/ảnh | Endpoint server riêng cho không gian công khai và avatar. |
| Dữ liệu/quyền | Migration mới sau migration ID; không sửa migration đã triển khai. |
| Chữ và theme | `src/config/content.vi.ts`, token và CSS hiện có. |

Hiện `CoupleApp` chặn khách chưa đăng nhập bằng AuthScreen. Route `/p/[publicId]` render độc lập, không mount AppProvider private hoặc tải dataset riêng chỉ để phục vụ khách. Hành động xin tham gia chỉ lấy session và trạng thái membership/yêu cầu tối thiểu cho tài khoản hiện tại. Không tái sử dụng JoinRequests nguyên trạng nếu việc đó buộc tải dữ liệu riêng; tách phần logic cần thiết. Đọc guide route/params Next đang cài trước khi triển khai.

## 10. Thứ tự triển khai và điều kiện hoàn thành

1. Thêm bio và lưu trong hồ sơ, bảo toàn draft/retry.
2. Thêm consent theo membership, API projection, cách tính chỉ số chung và endpoint avatar kiểm tra quyền; hoàn thiện read model trước UI.
3. Dựng `/p/[publicId]` cho khách, với bố cục một/hai người, streak/số ngày, loading/404/error/noindex.
4. Nối gửi yêu cầu, quay lại sau auth và trạng thái chờ/hủy.
5. Thêm bật/tắt và sao chép liên kết trong Hai đứa; kiểm tra chuyển một → hai người và rời không gian.
6. Hoàn thiện motion nhẹ, mobile, tên/bio dài, reduced-motion và các chỉ số qua ngày mới.

Điều kiện đạt: trang riêng và trang khách không bị lẫn; bio chỉ đồng bộ sau lưu, đếm code points nhất quán; ID sai như `99999zbcd9` trả đúng lời nhắn; khách không đọc được dữ liệu ngoài projection; chưa duyệt không có membership; tối đa hai người; consent không kế thừa sang không gian mới; tắt chia sẻ/rời không gian chặn metadata và ảnh trong request mới; streak khớp Home, số ngày không lấy nhầm mốc và không xuất hiện khi chỉ còn một người.

Theo yêu cầu hiện tại, chỉ lập kế hoạch. Khi triển khai, chạy kiểm tra cú pháp/typecheck; anh kiểm tra trực quan trên web. Các tình huống quyền và đồng thời cần bằng chứng riêng trước khi nhận đã hoạt động đúng trên production, không suy ra từ typecheck. Chưa sửa code, chạy migration hoặc deploy cho kế hoạch này.

## 11. Bằng chứng hiện trạng và quyết định đề xuất

Đã đọc source hiện tại: `/profile` là form cá nhân; `profiles` chưa có bio; avatar dùng bucket riêng tư; migration `202610050011_couple_public_id.sql` đã có ID 9 số và duyệt ghép đôi. Trạng thái Supabase production chưa được kiểm tra trong lần lập kế hoạch này.

Avatar/tên/bio, CTA một người, lời nhắn ID sai và chỉ số cặp đôi bám yêu cầu của anh. Review bổ sung route riêng, consent theo membership, endpoint ảnh kiểm tra lại quyền, semantics code points và motion nhẹ; kế hoạch đã tiếp thu các điểm này. Route `/p/`, nhãn Bên nhau theo ngày người dùng đặt, giới hạn bio, consent/noindex/API vẫn là thiết kế đề xuất, chưa triển khai. Nếu cần số ngày kể từ ghép trên Doita, phải chốt phương án `paired_since` trước code.

## 12. Assets anh cần chuẩn bị

Không cần vẽ avatar mới cho trang này: dùng avatar người dùng, fallback avatarA/avatarB của theme. Không cần background, banner, thẻ chứa chữ hay minh họa đôi lớn; tên/bio/nút/chỉ số đều là HTML. Chưa triển khai tính năng khi anh chưa duyệt kế hoạch.

### Tái sử dụng artwork đang có

| Vai trò | Asset có sẵn trong THEME.icons |
| --- | --- |
| Streak | Flame |
| Ngày bên nhau hoặc nét nối giữa hai avatar | Heart; Calendar nếu cần phân biệt ngày. Chỉ một icon cho mỗi chỉ số. |
| Đồng ý/đã công khai | Check hoặc CircleCheck |
| Đóng/Hủy/Từ chối | X, giữ nhãn chữ rõ ràng. |
| Chờ phản hồi | Hourglass, không giả trạng thái online. |
| Hồ sơ/không gian | Users |
| Sửa bio | Feather hoặc NotebookPen nếu thực sự cần icon cạnh hành động. |

Đây là artwork của anh trong registry, không nhập Lucide cho trang mới. Không đặt icon ở mọi dòng bio hoặc mọi nút chỉ để lấp chỗ.

### Ba icon mới nên tạo

| Tên nguồn đề xuất | Ý nghĩa và vị trí | Hình cần vẽ |
| --- | --- | --- |
| `user-plus.png` | Nút Gửi yêu cầu tham gia không gian | Một đầu/vai người đơn giản và dấu cộng rõ ở bên phải; không dùng hai người đang ôm nhau vì yêu cầu chưa được chấp nhận. |
| `link.png` | Liên kết trang giới thiệu trong Hai đứa | Hai mắt xích bo tròn nối chéo nhau, nhận ra được ở24px. |
| `copy.png` | Nút Sao chép liên kết hoặc ID | Hai tờ giấy bo góc chồng lệch, phân biệt được hai đường viền; không chữ trên giấy. |

Ba icon này chưa có vai trò tương ứng trong registry hiện tại. Ưu tiên tạo riêng từng icon. Có thể triển khai chức năng bằng nút có nhãn trước khi ảnh sẵn sàng; không thay bằng icon thư viện tạm rồi bỏ quên.

### Một minh họa tùy chọn

`space-unavailable.png`: một khung ảnh nhỏ để trống và kính lúp nằm cạnh, không có người, không có khuôn mặt buồn, không có thùng rác hoặc dấu khóa. Dùng chung cho ID sai/trang không khả dụng; hình không khẳng định người dùng đã xóa hoặc từ chối ai. Bản nguồn512×512, hiển thị120–160px. Không cần tạo nếu anh muốn màn lỗi chỉ có câu thông báo và đường quay lại.

Không cần ảnh riêng cho một người/hai người, bio rỗng, đang gửi, được duyệt hoặc bị từ chối. Dùng dữ liệu và trạng thái HTML, không tạo thêm các cảnh cặp đôi không liên quan.

### Quy cách xuất và prompt chung

- Tham chiếu trực tiếp PNG icon gốc của anh trong `public/assets/doita/doodle-icons`, nhất là users/plus/check; đừng chỉ đưa mô tả “cute pink” cho AI tự đoán style.
- Icon nguồn PNG512×512 có alpha thật; đối tượng chiếm khoảng72–80% khung, khoảng đệm đều. Thiết kế để đọc rõ ở20–32px, cùng độ dày nét và độ bo với bộ đang dùng. Khi tích hợp xuất WebP128×128 cho hiển thị24–32px, giữ nguồn nguyên vẹn.
- Doodle2D đơn giản, viền tím mận `#4C2337`, trắng `#FFFFFF`, hồng nhẹ `#FFE8EF`, hồng `#FFB2C8`, điểm nhấn `#F76D92`. Màu nút/nền UI tiếp tục dùng token theme, không lấy màu nền từ ảnh để đổi cả trang.
- Không nền đặc, nền caro giả trong suốt, chữ, số, watermark, glow, gradient cầu kỳ, 3D, ám vàng hoặc texture giấy. Không rải tim/sparkle/khuôn mặt lên cả ba icon. Không tự tạo trạng thái active/disabled thành ba ảnh khác nhau.
- Prompt riêng: dùng prompt chung dưới đây, thay phần ĐỐI TƯỢNG bằng mô tả trong bảng. Xuất từng file có tên tương ứng, không yêu cầu AI vẽ chữ tên file vào ảnh.

```text
Tạo một icon duy nhất, bám đúng hình tham chiếu của bộ Doita đã cung cấp:
nét doodle mềm, bo tròn, viền tím mận đều, hình trắng với điểm nhấn hồng.
ĐỐI TƯỢNG: [mô tả cụ thể trong bảng].
Silhouette đơn giản, nhận ra ở24px; không thêm trang trí không liên quan.
PNG512×512, nền trong suốt thật, đối tượng nằm giữa, không bị cắt,
khoảng đệm đều10–14%. Không chữ, watermark, bóng3D, glow, ám vàng.
```

Khi anh đưa ảnh: kiểm tra nhãn, alpha, padding và độ rõ; thêm mapping qua THEME.icons/theme assets, giữ accessible name của nút và không dùng filter CSS chữa màu. Icon trang trí có alt rỗng; màn lỗi vẫn hiển thị câu thông báo bằng HTML. Tính năng/handler không phụ thuộc vào ảnh tải thành công.

## Triển khai ngày 06/10/2026

Đã thêm code: bio ở /profile; /p/[publicId] độc lập với AppProvider; API metadata/avatar không cache; consent từng membership trong Hai đứa; gửi/hủy yêu cầu, chờ duyệt và quay lại sau đăng nhập. Khi hai người cùng đồng ý, trang hiển thị streak và số ngày bên nhau theo ngày bắt đầu đã đặt. Không công khai lời nhắn/kỷ niệm/email/user ID hay đường dẫn storage.

Assets thật lấy từ doita-test/doita-new-icons: copy, link, user-plus và space-unavailable. Giữ PNG nguồn trong public/assets/doita/public-space, WebP trong public/themes/sunset/public-space; registry có hash phiên bản ảnh.

Điều kiện chạy: áp dụng supabase/migrations/202610060012_public_space.sql sau migration 011 (202610050011_couple_public_id.sql). Migration012 chưa chạy trên Supabase trong lượt này. Cần kiểm tra Auth redirect allowlist cho /auth?returnTo=... ở domain thật.

Kiểm chứng: npm run typecheck đạt, mã thoát0. Theo yêu cầu của anh không chạy test, build hoặc trình duyệt; SQL/RLS/Realtime, popup consent, thu hồi quyền và giao diện mobile chưa kiểm chứng thực tế. Rate limit theo IP chỉ hạn chế tần suất, không biến ID tăng dần thành bí mật. Ảnh đã tải xuống không thể thu hồi khỏi thiết bị người xem.

## Cập nhật theo yêu cầu mới — Chia sẻ mặc định bật

Quyết định này thay thế phần mặc định tắt và popup consent phía trên. Membership mới mặc định bật; mỗi người có thể tắt, một người tắt thì trang ẩn. Luôn có nút sao chép link giới thiệu theo origin hiện tại. Áp dụng migration013 (202610060013_public_space_default.sql) sau012 để chuyển default và dữ liệu cũ; giữ thao tác tắt được ghi trong action_receipts. Chưa áp dụng migration hoặc kiểm tra database/web. TypeScript đã qua.
