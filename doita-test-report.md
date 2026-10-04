# Báo cáo kiểm thử doita.vercel.app

Ngày kiểm thử: **04/10/2026**, bắt đầu khoảng 19:11 (UTC+7).

Web: https://doita.vercel.app/  
Repository: https://github.com/dangminhtai/doita  
Mã nguồn đối chiếu: nhánh `main`, commit `4254f6cc07d416a3ba2c2ae5873a6eb1676b3ceb` (`Add test`). Chưa xác minh commit này chính là bản Vercel đang phục vụ.

## 1. Kết quả chính

Đã trực tiếp dùng bản production, với phiên tài khoản chủ web cung cấp, qua các màn hình Hôm nay, Lời nhắn, Dòng ước nguyện, Kỷ niệm, Chán rồi?, Hai đứa, Hệ thống và Riêng tư. Đã tạo dữ liệu QA riêng tư, lưu/sửa/ghim/tìm kiếm/lọc ghi chú, tạo và tích checklist, lưu rồi mở lại bản nháp điều ước, thử các bộ lọc hoạt động, tải lại và đăng xuất.

**Ưu tiên sửa ba lỗi đã tái hiện:**

1. **P1 — Bản nháp lời nhắn mất quyền riêng tư:** nội dung giữ lại nhưng quyền xem từ “Chỉ mình tôi” trở về “Cả hai”.
2. **P2 — Checklist mất trạng thái hoàn thành khi chỉ đổi tên.**
3. **P2 — Nút Back của trình duyệt không quay về màn hình trước trong app.**

Có thêm lỗi thông báo cũ xuất hiện trên màn hình không liên quan (P3) và một số điểm UX cần cải thiện. Không có cơ sở để kết luận toàn bộ web đã đạt kiểm thử nghiệm thu hoặc bảo mật.

## 2. Môi trường và cách kiểm thử

- Chrome trong trình duyệt cloud; viewport ghi nhận **1363 × 936**. Chưa chạy Safari, Firefox, Android/iPhone thật hoặc viewport điện thoại.
- Kiểm thử thao tác người dùng trên web đang deploy; không giả lập Supabase, không thay dữ liệu trả về, không dùng kết quả kiểm thử cũ làm kết quả production.
- Phiên hiện tại đã ghép hai thành viên. Chỉ thao tác bằng một tài khoản; không đăng nhập thành viên thứ hai.
- Mật khẩu, token, mã mời và nội dung cá nhân không được đưa vào báo cáo.
- Mã nguồn chỉ dùng để tìm nguyên nhân/hướng sửa; các rủi ro chỉ đọc từ code được tách riêng.
- P1: ưu tiên cao vì có nguy cơ chia sẻ nhầm nội dung riêng. P2: ảnh hưởng chức năng/dữ liệu. P3: lỗi UX hoặc phản hồi gây hiểu nhầm. Đây là mức ưu tiên sửa, không phải điểm CVSS.

Lần đăng nhập đầu tiên báo “Không kết nối được tới dịch vụ đăng nhập”. Sau khi chủ web đăng nhập bằng bàn giao trình duyệt, phiên hoạt động, đọc và ghi dữ liệu được. **Chưa xác định nguyên nhân lỗi đầu tiên; không kết luận Supabase hay cấu hình web bị hỏng.**

## 3. Những gì đã test thực tế

“Đạt” chỉ áp dụng cho tình huống trong từng hàng, không có nghĩa toàn bộ chức năng đã được bao phủ.

| ID | Tình huống | Kết quả | Bằng chứng / giới hạn |
|---|---|---|---|
| T01 | Mở trang chủ chưa đăng nhập | Đạt | Hiện form email/mật khẩu và nội dung tiếng Việt. |
| T02 | Đăng nhập tài khoản cung cấp | Một phần | Lần đầu lỗi kết nối; sau bàn giao xác nhận Home có hai thành viên, dữ liệu và menu. |
| T03 | Tải lại `/notes` sau lưu/sửa | Đạt | Phiên đăng nhập, ghi chú đã sửa và trạng thái ghim còn nguyên. |
| T04 | Điều hướng các màn hình chính | Đạt | Các link mở đúng màn hình và URL tương ứng. |
| T05 | Back sau nhiều lần điều hướng | **Lỗi** | Từ Riêng tư, Back về `about:blank` thay vì màn hình trước; B03. |
| T06 | Lưu lời nhắn trống | Đạt | Validation chặn, focus ở Tiêu đề; không tạo ghi chú trống. |
| T07 | Tạo ghi chú “Chỉ mình tôi” | Đạt | Lưu được, hiện nhãn riêng tư; chưa kiểm tra bằng tài khoản khác. |
| T08 | Tiếng Việt, xuống dòng, chuỗi `<script>alert("QA")</script>` | Đạt trong mẫu này | Nội dung hiển thị như văn bản, không thấy script chạy. Không thay thế kiểm thử XSS đầy đủ. |
| T09 | Sửa nội dung ghi chú rồi tải lại | Đạt | Nội dung mới còn nguyên sau reload. |
| T10 | Ghim ghi chú | Đạt | Nút đổi thành Bỏ ghim, biểu tượng ghim có mặt sau reload. |
| T11 | Tìm kiếm `[QA 20261004]` | Đạt | Chỉ còn ghi chú QA phù hợp trong tập dữ liệu đang tải. |
| T12 | Lọc “Chỉ mình tôi” | Đạt | Ghi chú chung biến khỏi danh sách, ghi chú QA riêng vẫn hiện. |
| T13 | Rời trang rồi khôi phục bản nháp lời nhắn | **Lỗi** | Nội dung còn, tiêu đề mất và quyền xem trở về Cả hai; B01. |
| T14 | Tạo checklist riêng gồm hai dòng | Đạt | Hai dòng thành hai checkbox riêng. |
| T15 | Tích “QA mục một” | Đạt | Sau cập nhật bất đồng bộ, checkbox được tích. |
| T16 | Chỉ đổi tên checklist đã tích | **Lỗi** | “QA mục một” trở về chưa tích dù nội dung không đổi; B02. |
| T17 | Đổi gợi ý điều ước | Đạt | Nội dung gợi ý thay đổi. |
| T18 | Lưu/mở lại bản nháp điều ước riêng | Đạt | Bản nháp nằm dưới “Những lá thư đang viết”; mở lại đúng nội dung và Chỉ mình tôi. Chưa thả thuyền. |
| T19 | Lọc kỷ niệm Khoảnh khắc khi chưa có | Đạt | Hiện trạng thái “Chưa có gì ở đây”. |
| T20 | Lưu khoảnh khắc trống | Đạt | Validation chặn ở Nội dung; chưa thử lưu nội dung hoặc upload ảnh. |
| T21 | Gợi ý hoạt động mặc định 15 phút | Đạt | Có thẻ hoạt động, mô tả và các nút thao tác. |
| T22 | Bộ lọc 5 phút + Lãng mạn | Đạt trong mẫu này | Nhận “Chọn bài hát của hôm nay”, thời lượng 5 phút. |
| T23 | Đổi gợi ý hoạt động | Đạt | Chuyển sang “Một lời chúc buổi tối”. |
| T24 | Gửi câu trả lời ngày trống | Đạt | Validation chặn; chưa gửi câu trả lời thật. |
| T25 | Rời rồi mở lại câu trả lời nháp | Đạt | Nội dung QA còn trong ô; đã xóa nội dung nháp sau test. |
| T26 | Mở Hai đứa | Một phần | Form, ngày đặc biệt, thông báo và các nút hiện; timezone đang bị khóa. Không lưu thay đổi hồ sơ. |
| T27 | Mở Hệ thống bằng tài khoản hiện tại | Ghi nhận | Hiện “Trang này dành cho người quản lý”, không thấy dashboard. Chưa biết tài khoản có nằm trong whitelist admin hay không. |
| T28 | Chuyển từ Hệ thống sang Riêng tư | **Lỗi UX** | Thông báo “Trang này dành cho người quản lý” vẫn xuất hiện trên Riêng tư; B04. |
| T29 | Đăng xuất | Đạt | Về form đăng nhập, menu/dữ liệu riêng không còn hiện. |
| T30 | Mở trực tiếp `/notes` sau đăng xuất | Đạt ở UI | Chỉ thấy form đăng nhập. Chưa chứng minh toàn bộ RLS từ phép thử này. |
| T31 | Mở `/privacy` khi chưa đăng nhập | Đạt | Chính sách đọc được công khai qua URL trực tiếp. |
| T32 | GET `/api/admin` không có token | Đạt trong mẫu này | Body `{"ok":false}`, không có dashboard/dữ liệu admin. Không thu được HTTP status bằng công cụ kiểm thử này. |
| T33 | GET `/api/cron/daily` không có khóa | Đạt trong mẫu này | Body `{"ok":false}`. Chưa kiểm tra cron chạy hợp lệ hoặc job đã thực thi. |
| T34 | Mở URL không tồn tại và bấm Quay lại | Đạt | Có trang “Không tìm thấy trang này”; Quay lại về trang chủ đăng nhập. |

## 4. Lỗi cần sửa và cách tái hiện

### B01 — P1: Bản nháp riêng tư bị khôi phục thành nội dung chung

**Đã tái hiện trên production.**

1. Vào Lời nhắn → Viết lời nhắn.
2. Nhập tiêu đề `[QA] tiêu đề bản nháp`, nội dung `[QA] bản nháp riêng chưa gửi`.
3. Chọn **Chỉ mình tôi**, chưa lưu.
4. Bấm menu Dòng ước nguyện.
5. Quay lại Lời nhắn → Viết lời nhắn.

**Thực tế:** nội dung được khôi phục, Tiêu đề trống, “Ai có thể xem?” là **Cả hai**. Điều hướng xảy ra mà không yêu cầu xác nhận bỏ bản nháp.

**Mong đợi:** giữ nguyên toàn bộ bản nháp, đặc biệt quyền riêng tư; không tự tăng phạm vi chia sẻ.

**Tác động:** người dùng nhập lại tiêu đề rồi bấm lưu có thể chia sẻ nhầm nội dung vốn được soạn riêng tư. Trong lần test này **không lưu bản nháp sau khi quyền bị đổi**, nên không khẳng định đã có rò rỉ dữ liệu backend.

**Hướng sửa:** trong `src/features/notes/screen.tsx`, chỉ `body` dùng `useDraft("note")`, còn `title`, `type`, `visibility`, `editing` là state tạm. Lưu một bản nháp có cấu trúc gồm các trường trên và gắn với người dùng/ghi chú đang sửa. Không dùng cùng một body cho cả “tạo mới” và “sửa”. Khi khôi phục bản nháp cũ thiếu metadata, chọn quyền riêng tư an toàn hoặc yêu cầu chọn quyền trước khi lưu. Thêm chặn điều hướng khi có thay đổi chưa lưu.

**Test lại:** thử cả bản nháp mới và sửa ghi chú, private/couple/partner, text/checklist, điều hướng và reload. Nội dung, tiêu đề, loại, quyền và đối tượng đang sửa phải khớp; bấm tạo mới không mang nhầm nội dung ghi chú đang sửa.

Ảnh: `doita-qa-draft.jpg` trong ZIP bằng chứng.

### B02 — P2: Đổi tên checklist làm mất trạng thái hoàn thành

**Đã tái hiện trên production.**

1. Tạo checklist riêng `[QA 20261004] checklist riêng`, nội dung hai dòng `QA mục một` và `QA mục hai`.
2. Tích hoàn thành `QA mục một`; chờ cập nhật thành công.
3. Bấm Sửa, chỉ đổi tiêu đề thành `[QA 20261004] checklist riêng đã đổi tên`.
4. Lưu lại, giữ nguyên nội dung và loại checklist.

**Thực tế:** cả hai mục đều trở về chưa hoàn thành.

**Mong đợi:** đổi tiêu đề/quyền xem không thay đổi trạng thái từng mục.

**Nguyên nhân đối chiếu code:** RPC `public.save_note` trong `supabase/migrations/202610040001_core.sql` xóa toàn bộ `note_items` rồi tạo lại mỗi lần lưu. Các mục mới không giữ `completed` và ID cũ.

**Hướng sửa:** khi chỉ sửa metadata thì không tạo lại item. Khi sửa danh sách, dùng ID ổn định cho từng mục, cập nhật/thêm/xóa có chọn lọc và giữ trạng thái những mục còn tồn tại. Triển khai bằng migration mới; thay file migration cũ không tự cập nhật database production đã chạy migration đó.

**Test lại:** đổi tên, đổi quyền, thêm mục, xóa một mục, sửa nội dung một mục; các mục không bị thay đổi phải giữ trạng thái hoàn thành. Kiểm tra lại sau reload và từ hai phiên nếu checklist chung.

Ảnh sau đổi tên: `doita-qa-checklist.jpg` trong ZIP.

### B03 — P2: Back không quay lại màn hình trước của app

**Đã tái hiện trên production:** sau chuỗi điều hướng qua nhiều màn hình, từ Riêng tư bấm Back của trình duyệt → `about:blank`, không trở về Hệ thống/màn hình app trước đó. Forward đưa trở lại Riêng tư.

**Nguyên nhân đối chiếu code:** hàm `go` trong `src/components/couple-app.tsx` gọi `history.replaceState`, thay thế entry hiện tại thay vì tạo lịch sử màn hình. Page còn được giữ bằng React state riêng.

**Hướng sửa:** dùng điều hướng Next.js (`Link`/router) và trạng thái theo URL; tránh dùng state riêng lệch với URL. Nếu tự quản lý History API thì cần cả entry mới và xử lý `popstate`.

**Test lại:** Home → Notes → Prayer → Memories, Back từng bước rồi Forward. URL, màn hình, trạng thái menu phải luôn khớp; reload và mở deep link trong tab mới vẫn đúng.

### B04 — P3: Thông báo cũ bám sang màn hình khác

**Đã quan sát:** “Đã lưu lại” xuất hiện trên nhiều màn hình sau thao tác lưu trước đó. Khi Hệ thống báo “Trang này dành cho người quản lý”, bấm Riêng tư vẫn thấy thông báo này trên trang Riêng tư.

**Tác động:** người dùng có thể hiểu nhầm thao tác hiện tại đã được lưu hoặc trang đang đọc bị từ chối quyền.

**Hướng sửa:** xóa thông báo theo điều hướng/phạm vi thao tác, có thời gian tự ẩn hợp lý hoặc nút đóng. Giữ lỗi gắn với form gây lỗi. Kiểm tra `message` trong AppProvider và `go` trong Shell.

**Test lại:** lưu ghi chú rồi mở hoạt động; mở admin bị từ chối rồi mở privacy. Không còn thông báo gây hiểu nhầm từ màn hình trước.

## 5. Những điểm cần xem lại

### C01 — Khả năng tìm chính sách riêng tư trước đăng ký

Trang `/privacy` truy cập công khai được, nhưng trên màn hình đăng nhập chưa thấy link Riêng tư trong giao diện desktop đã test. Nên đặt link ở form/footer để người dùng đọc trước khi đăng ký. Nội dung chính sách hiện còn câu hướng dẫn người quản lý công bố địa chỉ liên hệ và chính sách lưu trữ; cần thay bằng thông tin vận hành thực tế trước khi mở cho người khác.

### C02 — Múi giờ đang bị khóa, không có giải thích ngay cạnh trường

Đã quan sát select timezone bị disabled với giá trị `Asia/Ho_Chi_Minh`. Chưa tạo cặp mới nên chưa chứng minh luồng onboarding của cặp mới. Code khóa bằng `disabled={!!d.daily}`, trong khi refresh gọi `ensure_daily` và màn ghép cặp dùng timezone mặc định, không có bước chọn múi giờ.

Nếu yêu cầu là cho cặp đôi chọn múi giờ trước khi bắt đầu daily, cần thêm bước chọn khi tạo cặp và khóa đúng mốc nghiệp vụ. Nếu cố ý khóa từ ngày đầu, cần hiển thị lý do; đây là điểm cần xác nhận yêu cầu, không coi select disabled tự nó là lỗi.

### C03 — Quyền admin của tài khoản chủ web

Tài khoản được cung cấp không vào được dashboard Hệ thống trong lần test. Nếu tài khoản này phải là admin, kiểm tra UUID thực của tài khoản trong `ADMIN_USER_IDS` trên Vercel và deploy lại khi cần. Nếu tài khoản là người dùng thường, việc bị từ chối là đúng. Chưa truy cập biến môi trường để xác minh cấu hình.

### C04 — Tìm kiếm lời nhắn khi dữ liệu nhiều

**Chỉ đối chiếu code, chưa tái hiện với dữ liệu lớn:** tìm kiếm lọc `d.notes` đang tải ở client, còn truy vấn có giới hạn. Cần thử khi số ghi chú vượt giới hạn tải: tìm một ghi chú cũ chưa được tải. Nếu muốn tìm toàn bộ dữ liệu, cần tìm kiếm server có phân trang, hoặc nói rõ phạm vi tìm kiếm/cho tải thêm.

## 6. Chưa test — không được tính là đạt

| Nhóm | Phần còn thiếu |
|---|---|
| Hai tài khoản | Ghép cặp mới, mã sai/hết hạn/cặp đã đủ người, realtime, người kia có đọc được note private không, chỉ mở daily khi cả hai gửi. |
| Daily/streak | Gửi câu trả lời thật, phản hồi, hoàn thành ngày, nối chuỗi, giới hạn 2 lượt/tháng, chuyển ngày và múi giờ. |
| Điều ước | Thả/đọc/lưu trữ/xóa, shared với người kia, quay lại sau 30 ngày, giới hạn thuyền và nhiều dữ liệu. |
| Kỷ niệm | Lưu khoảnh khắc, upload JPEG/PNG/WebP, ảnh quá 5 MB/sai định dạng, lỗi storage, xem ảnh từ tài khoản khác. |
| Hoạt động | Thích/không hợp/hoàn thành và lưu lịch sử; chất lượng gợi ý trên toàn bộ tổ hợp bộ lọc. |
| Cài đặt | Lưu hồ sơ/ngày bắt đầu, ngày đặc biệt, góc cuối tuần, đổi mã mời; không sửa thông tin thật để test. |
| Auth/email | Tạo tài khoản, email xác nhận/SMTP, quên mật khẩu/đổi mật khẩu, sai mật khẩu, hết phiên. |
| Push/PWA | VAPID, quyền thông báo, push thực nhận, cài PWA, mất mạng và offline fallback; chưa cấp quyền notification. |
| Dữ liệu/tác vụ phá hủy | Xuất dữ liệu thực, xóa ghi chú, rời không gian, xóa tài khoản; không thực hiện trên tài khoản đang dùng. |
| Bảo mật | RLS giữa hai cặp độc lập, chống truy cập bằng ID của người khác, rate limit, audit secrets/lịch sử Git, kiểm thử xâm nhập. |
| Tương thích/hiệu năng | Mobile thật, viewport 320/375/390, Safari/Firefox, bàn phím và screen reader đầy đủ, Lighthouse/Core Web Vitals, tải lớn/concurrency. |
| Cron | Lịch Vercel chạy thật, xác thực có secret, trạng thái job và gửi thông báo theo thời gian. |

## 7. Dữ liệu QA còn lại sau test

Để kiểm tra lại, đã giữ **3 bản ghi QA riêng tư** trong tài khoản:

1. `[QA 20261004] ghi chú riêng` — đã sửa và ghim, có chuỗi HTML thử hiển thị như văn bản.
2. `[QA 20261004] checklist riêng đã đổi tên` — hai mục đều chưa hoàn thành sau khi tái hiện B02.
3. `[QA 20261004] điều ước riêng ở dạng bản nháp` — chưa thả thuyền.

Đã xóa nội dung nháp QA đang soạn trên thiết bị, đăng xuất cuối phiên. Không xóa các bản ghi server hoặc nội dung có sẵn; không gửi lời nhắn chung, câu trả lời daily hay thông báo cho thành viên kia. Không đổi hồ sơ, mã mời, whitelist admin hoặc cấu hình deployment.

## 8. Thứ tự sửa và kiểm thử lại

1. Sửa B01 trước, kiểm tra không tăng phạm vi chia sẻ khi khôi phục nháp.
2. Sửa B02 bằng migration cập nhật RPC và kiểm tra dữ liệu checklist sau reload.
3. Sửa B03, kiểm tra Back/Forward và deep link trên desktop lẫn điện thoại.
4. Sửa B04, thêm link/chính sách riêng tư hoàn chỉnh và giải thích timezone.
5. Dùng hai tài khoản QA/cặp QA riêng để test quyền riêng tư, daily, realtime, push, ảnh và cron. Dành một môi trường test cho các thao tác xóa/rời cặp.

## 9. Nguồn đối chiếu và bằng chứng

- [Điều hướng Shell](https://github.com/dangminhtai/doita/blob/4254f6cc07d416a3ba2c2ae5873a6eb1676b3ceb/src/components/couple-app.tsx)
- [Lời nhắn và bản nháp](https://github.com/dangminhtai/doita/blob/4254f6cc07d416a3ba2c2ae5873a6eb1676b3ceb/src/features/notes/screen.tsx)
- [RPC checklist](https://github.com/dangminhtai/doita/blob/4254f6cc07d416a3ba2c2ae5873a6eb1676b3ceb/supabase/migrations/202610040001_core.sql)
- [Cài đặt, admin và quyền riêng tư](https://github.com/dangminhtai/doita/blob/4254f6cc07d416a3ba2c2ae5873a6eb1676b3ceb/src/features/settings/screen.tsx)
- [Tải dữ liệu và trạng thái ứng dụng](https://github.com/dangminhtai/doita/blob/4254f6cc07d416a3ba2c2ae5873a6eb1676b3ceb/src/components/app-context.tsx)

ZIP đi kèm chứa báo cáo này và ba ảnh: `doita-qa-note.jpg`, `doita-qa-draft.jpg`, `doita-qa-checklist.jpg`. Ảnh là màn hình production trong lần test, không phải ảnh mock từ repository. Ảnh checklist thể hiện trạng thái sau lỗi; bước trước khi tích được ghi nhận qua quan sát UI, không có ảnh trước/sau đầy đủ.
