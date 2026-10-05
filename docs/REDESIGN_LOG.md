# Nhật ký triển khai redesign Doita

Baseline: `6393397fc2272a0639f099be89acaee4601d09cf`. Workspace gốc: `F:\X-FILE\Code_UNI\couple-river`; triển khai trong worktree `F:\X-FILE\Code_UNI\couple-river-redesign-20261005` trước khi chuyển diff đã kiểm tra về workspace gốc. Tracked files sạch trước khi làm; các PNG/tài liệu AI chưa tracked được giữ nguyên.

## P0 — Baseline

Đã đọc kế hoạch, RULES_UX, AGENTS, package, shell/provider và các feature, RPC/migration/tests. Baseline 21 unit tests qua. Các finding cũ về draft private, expected daily session, load/session race, upload cleanup, date occurrence, inbox/like refresh đã có fix; không viết lại chúng. Global busy, global pagination, layout dashboard và form settings dài vẫn cần sửa. Migration 006 đã có ở nguồn; không giả định production đã áp dụng.

## Nguồn → quyết định → kiểm tra

Các nguồn dưới đây đọc trực tiếp ngày 05/10/2026, trước khi triển khai. Chỉ đọc README/code ví dụ, chưa chạy các app tham khảo:

- [Digital Love Letter Envelope.tsx](https://raw.githubusercontent.com/Fury1021/digital_love_letter/main/src/components/letter/Envelope.tsx): phong bì/giấy thư và CTA mở → stationery preview, reader native dialog → không lấy confetti, delay 900ms hay dữ liệu URL → browser open/Escape/focus/private.
- [GoodDay page.tsx](https://raw.githubusercontent.com/atena-de-watson/GoodDay/main/src/app/page.tsx): timeline kể chuyện, ảnh và vùng có thứ bậc → hero có tên thật, album theo tháng → không copy parallax, nội dung demo hay thư viện motion → render cùng fixtures nhiều viewport.
- [W3C form notifications](https://www.w3.org/WAI/tutorials/forms/notifications/): phản hồi gần form → action scope và lỗi giữ form → không chỉ toast chung → network/retry browser.
- [W3C modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): focus/Escape/return focus → giữ native dialog/portal → không overlay tự viết → browser keyboard.
- [W3C contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): đo text/nền thật → semantic tokens tối hơn màu trang trí → không lấy hồng nhạt làm chữ → tính contrast và browser nền đọc đặc.
- [W3C animation](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html): giảm chuyển động → CSS reduced-motion + cảnh pause khi tab ẩn → không autoplay âm thanh/parallax → emulate reduced-motion.
- [Next Image](https://nextjs.org/docs/app/api-reference/components/image): kích thước/sizes và preload → ảnh AI WebP có kích thước giữ layout, hero picture responsive → không thêm thư viện ảnh → bytes/network/render.
- [Supabase range](https://supabase.com/docs/reference/javascript/range): page có thứ tự ổn định → pagination từng collection với tie-breaker ID → không dùng độ dài page giả tổng → fixture nhiều trang.
- [Supabase Storage image transformations](https://supabase.com/docs/guides/storage/serving/image-transformations): signed thumbnail phụ thuộc khả năng dịch vụ → không giả định plan Supabase hỗ trợ transform → thumbnail bảo toàn quyền, fallback có trạng thái và signed URL refresh.

## Theme và assets

Yêu cầu mới của anh ưu tiên hơn phần ngoài phạm vi nhiều theme trong plan: chuẩn bị contract theme, một theme mặc định `sunset`, chưa thêm giao diện đổi nhiều theme. Màu và vai trò ảnh nằm trong `src/config/themes.ts`; ảnh tối ưu trong `public/themes/sunset`. Giữ PNG AI gốc và nguồn/prompt ở ASSETS_AI.md. Dùng ImageMagick resize/WebP, không dựng chữ/nút trong ảnh. Giữ thương hiệu CONTENT.brand hiện tại.

Không hiển thị timezone đã khóa theo quyết định trước của anh, dù plan đề xuất hiển thị; không phục hồi admin/privacy/export. Không deploy hoặc thay đổi database production trong lượt này.

## Phạm vi đã triển khai

- Shell desktop ngang; mobile 5 mục. Cùng làm truy cập từ Home, drawer và Hai đứa. Header giữ trên viewport, drawer có Escape/focus, Back giữ tìm kiếm/bộ lọc/số mục đã tải và cuộn sau khi danh sách sẵn sàng.
- Home có hero responsive, tên thật từ profile, ngày bên nhau khi hợp lệ, daily journal và CTA theo trạng thái thực; thư/album gần đây, đường vào Cùng làm/Điều ước, mood và streak phụ thu gọn. Tên dài giới hạn chiều cao hero; tên đầy đủ vẫn có trong HTML và profile/member card.
- Notes có phong bì/giấy checklist, quyền gần nội dung, người gửi/nhận, reader native dialog và menu hành động. Checklist ở trang sau lấy item tương ứng, không phụ thuộc snapshot 30 note đầu của provider.
- Memories có tháng/timeline/polaroid, xem trước ảnh chọn, nguồn đang tải/lỗi/không còn quyền riêng biệt. Signed URL chỉ lấy khi ảnh gần viewport, gia hạn khi focus và có retry; không có timer mỗi ảnh. Form có đóng và giữ draft/upload reference.
- Prayer dùng thuyền giấy tĩnh có nhãn; motion chỉ sau lưu thành công, có reduced-motion/pause tab ẩn. Draft server và archive có collection/phân trang riêng; giữ private, resurface, edit ID và restore.
- Activities dùng một gợi ý rõ, filters trong details, điều kiện được nhớ; hoàn thành tách rating, nới điều kiện khi không có kết quả. Thích/Chưa hợp có trạng thái chọn.
- Hai đứa chia Hồ sơ/Ngày đặc biệt/Thông báo/Cuối tuần/Tài khoản. Sao chép mã mời có phản hồi, ngày có tên sự kiện/loại riêng/quy tắc lặp; tìm/lọc phía server và phân trang riêng. Auth có show-password, hướng dẫn và lỗi validation gần email/mật khẩu; label select chỉ đọc tên trường.
- Busy theo form/entity, không khóa toàn web; một status cho scope đang gửi. Provider giữ generation/LatestRequest; invalidation đồng bộ nhóm bảng bị ảnh hưởng và cộng dồn qua refresh superseding. Focus/reconnect vẫn revalidate snapshot metadata có giới hạn.
- Search/filter/pin trước pagination; page 30, cursor thời gian + ID (notes thêm pin; dates theo date + ID). Debounce/abort và account/couple guard. Bảng con chia nhóm tối đa 100 parent ID và range 500. Back phục hồi đúng số mục người dùng đã mở; không tự nạp toàn kho khi mở lần đầu.

Không thêm dependency. Dùng Arial/Georgia hệ thống có dấu tiếng Việt, không tải font qua mạng. Bộ theme WebP 243.892 byte; desktop hero 54.612 byte, mobile hero 48.566 byte; tám ảnh trang trí/empty có alpha. Các cặp màu nền đặc đo bằng `scripts/audit-theme.ts` có contrast từ 4,99:1 đến 12,11:1. Đây là audit token, không phải chứng nhận toàn app đạt WCAG.

## Migration và rollout

`202610050007_redesign_dates.sql` additive: custom_label/repeat_rule, backfill theo hành vi loại cũ, RPC mới giữ quyền author/couple qua RPC hiện có, whitelist receipt và cron cùng rule, thêm cursor indexes. Sinh nhật có thể chọn Một lần; ngày custom có thể Hằng năm. 29/2 chỉ lặp trong năm nhuận; giữ ngày gốc. Clients cũ insert không có repeat_rule vẫn dùng quy tắc legacy qua NULL.

Trước release, kiểm tra migration đã áp dụng ở project đích, chạy các migration còn thiếu theo thứ tự (đặc biệt 006 receipts và 007), rồi deploy code cùng env production đúng. Sau đó smoke test hai tài khoản, checklist, daily, upload/delete, reset password và push thật. Lượt này không gọi mutation vào project production.

Rollback giao diện giữ schema additive và dữ liệu. UI rollback cần đọc repeat_rule để không hiển thị birthday Một lần thành Hằng năm; không drop column hoặc tự đổi quy tắc người dùng đã chọn. Các fix privacy/session/receipt không thuộc phần trang trí cần giữ lại.

## Phần còn lại / giới hạn kiểm chứng

- Optional: cover do người dùng chọn từ shared photo; trình chọn nhiều theme; animation mở nắp thư. Bản đầu dùng hero AI mặc định và reader mở ngay.
- Ảnh upload chưa có thumbnail riêng/transform server. Hiện tải original khi gần viewport; cần triển khai pipeline thumbnail có RLS/cleanup trước khi cam kết budget ảnh người dùng.
- Chưa đo INP/LCP/CLS bằng field data, chưa chạy điện thoại thật/keyboard vật lý, zoom 200% hoặc screen reader. Emulation viewport và đo token không thay những kiểm tra này.
- SMTP, Supabase Realtime/Storage HTTP và Web Push production chưa kiểm chứng trong lượt này. Browser dùng HTTP/WebSocket fixtures; SQL dùng PostgreSQL PGlite với shim Supabase, không có cloud service thật.
- Prototype là UI local đã render; không có bộ wireframe độc lập. Không đánh dấu mọi checkbox trong plan là Done chỉ vì đã build.

## Chạy lại kiểm tra

`npm test`, `npm run test:database`, `npm run lint`, `npm run typecheck`, `npm run build`, `node --import tsx scripts/audit-theme.ts`.

Browser: `node --env-file=.env.local --import tsx scripts/test-redesign-browser.mjs`, server local port 3100. Script dùng Playwright đã cài ngoài repo tại `%TEMP%/doita-review-browser` và Edge của Windows; không thêm package vào app. Đặt `REDESIGN_SNAPSHOTS=after` để chụp 14 ảnh cho 7 route ở 390/1440; Auth và Notes có dữ liệu được chụp trong luồng kiểm tra. Nguồn ảnh trước là baseline 6393397 trên cùng fixtures, không dùng dữ liệu production. Mở `docs/REDESIGN_PREVIEW.html` để so sánh.

## Kết quả tại workspace gốc

Windows PowerShell, Node.js 22.16.0, Next.js 16.3.8. Chuyển 44 file source/theme/tài liệu từ worktree về repo gốc và kiểm tra hash từng bản sao; không sao chép env, node_modules, build cache hoặc ghi đè PNG nguồn. Không commit/push/deploy.

| Kiểm tra | Kết quả chạy |
| --- | --- |
| `npm test` | 23/23 qua, exit 0 |
| `npm run test:database` | 24 nhóm qua, exit 0; gồm backfill dữ liệu trước 007, quyền/receipt và reminder custom yearly/one-off |
| `npm run lint` | Exit 0; hai script audit/browser được lint lại sau chỉnh sửa cuối |
| `npm run typecheck` | Exit 0; TypeScript trong build cuối cũng qua |
| `npm run build` | Turbopack qua, exit 0; build lại sau sửa màu Auth, không cần webpack ở repo gốc |
| `node --import tsx scripts/audit-theme.ts` | 11 cặp màu nền đặc qua 4.5:1; khoảng 4,99–12,11:1, Auth 10,40:1; 12 WebP tổng 243.892 byte |
| Browser trên build production local | 22 nhóm qua với HTTP/WebSocket fixtures; assertion không có pageerror |
| `git diff --check` | Exit 0 |

Browser bao gồm: Prayer draft private/resurface/edit; Back/Forward; like chồng Realtime và scoped busy; Web Audio/mute/badge/mark-all; notification outage/retry/đúng item/hết quyền; drawer Escape; memory detail A→B; archive/restore; pinned note và checklist trang sau; Back giữ tìm/lọc/cuộn; reader Escape/return focus; write mất phản hồi retry cùng receipt; hết phiên giữ nháp; upload reference qua reload; 1.000 memories/30→60/trùng timestamp/tìm mục cũ; assets tải được và Home không tràn ở 320/360/390/768/1024/1440; reduced-motion có thuyền tĩnh; 7 route ở 320/1440 với tên thành viên 60 ký tự; ngày custom; logout khi request cũ còn chạy; membership error/retry. Các nhóm không đại diện cho mọi tổ hợp dữ liệu hoặc thiết bị.

Đã xem render Home mobile/desktop, Settings mobile, Notes có nội dung, Prayer desktop và Auth mobile. Visual review phát hiện màu paragraph Auth còn kế thừa màu mint cũ quá nhạt; đã override bằng theme text và thêm kiểm tra computed color, chờ ảnh Auth load trước khi chụp. Bộ lọc ngày native ở 320 px được chuyển một cột; tên dài có wrap ở member card; header z-index/focus được sửa để card không chặn nút menu.

Evidence local có 14 ảnh trước và 17 ảnh sau (7 route × 2 viewport, Auth × 2 và Notes filled mobile), trong `doita-test/redesign-evidence`. Gallery kiểm tra đủ 28 đường dẫn so sánh. Thư mục này được Git bỏ qua: cần giữ/copy evidence riêng khi chia sẻ gallery, không kỳ vọng push code tự mang theo ảnh. Trạng thái Done/Remaining đã ghi ở mục 14 của plan; các checklist nghiệm thu rộng hơn chưa tự tick.
