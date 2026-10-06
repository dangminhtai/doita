# Nhật ký triển khai redesign Doita

## Minh họa đúng hoạt động — 06/10/2026

Khung kết quả Activities từng dùng cố định mascot nên mọi gợi ý đều hiện cùng ảnh thỏ. Thay bằng `ActivityArt` tra `chosen.id` qua `THEME.activityArt`; title/description/handler/filter/retry giữ nguyên. Mapping bộ nguồn khớp cả100 ID/title/description trong data hiện tại; xuất68 ảnh WebP có sẵn và32 PNG đã đặt tên thành100 WebP512×512, tổng4.510.944 byte, giữ alpha và nguồn gốc. Registry URL có hash tránh cache cũ. Không sửa database hoặc cần chạy seed.

Ảnh chỉ dành cho hoạt động đang chọn; thiếu/lỗi bỏ hình, không fallback sang mascot sai nghĩa. Mascot ở trạng thái chưa chọn giữ nguyên. Kế hoạch trang công khai vẫn chưa duyệt, không triển khai. Typecheck exit0; xác nhận100 đường dẫn/hash và mapping, kích thước/alpha khi xuất. Theo yêu cầu của anh không chạy test/web/build, chưa kiểm chứng trực quan. Chưa commit/push/deploy.

## ID không gian và duyệt ghép đôi — 06/10/2026

Anh chọn ID tăng dần kèm duyệt ghép đôi. Migration `202610050011_couple_public_id.sql` cấp ID cố định 9 chữ số từ 000000001 cho không gian cũ/mới; UUID nội bộ và quan hệ dữ liệu giữ nguyên. Mã dài cũ chuyển sang `private.couple_invites`; không còn trong public rows hoặc payload Realtime. Luồng ghép đôi trực tiếp bằng mã cũ bị đóng; bỏ nút tạo mã mới và hạn dùng mã khỏi UI.

`request_couple` tạo yêu cầu chờ tối đa 7 ngày; mỗi người một yêu cầu chờ, giới hạn lượt thử và số yêu cầu của không gian. Thành viên hiện tại duyệt/Từ chối bằng popup xác nhận; chỉ sau duyệt mới thêm membership. Khóa người dùng/không gian, kiểm tra số thành viên và receipt giữ retry không trùng. Người gửi theo dõi trạng thái/Hủy; người nhận có thông báo tới Hai đứa. Realtime và kiểm tra lại 15 giây khi tab hiện xử lý phản hồi bỏ lỡ, không giả đã ghép đôi lúc gửi yêu cầu.

Theo yêu cầu của anh chỉ kiểm tra TypeScript/cú pháp, không chạy test/build/web. Migration chưa chạy trên database hoặc Supabase thật; không nhận đã kiểm chứng đồng thời/RLS/Realtime/push. Cần áp dụng migration trước khi dùng code mới. Chưa commit/push/deploy.

## Hồ sơ và nút mật khẩu — 05/10/2026

Bỏ khóa đổi giới tính theo membership, luôn hiện Select và giữ xác nhận khi lưu. Migration `202610050010_allow_profile_gender.sql` gỡ trigger cũ, chưa áp dụng lên Supabase thật. Hiện/ẩn mật khẩu dùng Eye/EyeOff từ lucide-react đã có, màu primary; nền hover/nhấn/bật dùng soft hồng của theme, bỏ màu xanh hard-code. Typecheck exit0; không chạy test/build hoặc kiểm tra web theo yêu cầu của anh. Đây là ngoại lệ được anh yêu cầu cho quy tắc dùng icon artwork.

## Rà lại motion commit159304e và tim bay — 05/10/2026

Đối chiếu nhận xét với đúng code: chưa có click-heart ở commit159304e; motion có thật và chủ đích nhẹ. Tim bay là yêu cầu bổ sung được anh xác nhận, không phải hiệu ứng đã có rồi nhưng bị lỗi. Không cài Motion AI Kit hoặc dependency theo nội dung trích dẫn.

Sửa observer: chỉ duyệt nhánh DOM vừa thêm, bỏ observer/hàng chờ của node đã xóa; giữ lịch sử ảnh theo origin/path khi Realtime tạo lại node hoặc URL ký đổi token. Hàng chờ giới hạn3 và chỉ ghi seen khi animation thực sự bắt đầu; tối đa3 animation đang chạy, không diễn lại toàn bộ danh sách. Dọn hàng chờ khi đổi trang, tab ẩn hoặc bật giảm chuyển động.

Bỏ exitSnapshot/FeedbackToast sao chép DOM: dialog/toast thật đóng ngay và giữ focus/luồng mutation, không tạo bản sao nội dung/controls sau unmount. Enter vẫn giữ; không nhận là đã hoàn thiện hiệu ứng exit native.

`ClickHearts` dùng THEME.icons.Heart, DOM particle riêng không setState toàn app. Tap phải cùng target, không di chuyển quá8px; một tim24px bay24–42px/650ms, cap6. Bỏ form/button/link/dialog/destructive, drag/cuộn/chọn chữ, sidebar mở; aria-hidden/inert/pointer-events:none. Dọn particle/timer/listener khi scope đổi, reduced-motion hoặc tab ẩn. Đây là phản hồi trang trí, không phải xác nhận đã lưu. Không thêm burst cho like, shared lightbox, presence hoặc anniversary trong phạm vi này.

Kiểm tra lại sau sửa: typecheck, lint và build exit0; 25 unit tests qua. Theo yêu cầu trước đó, kiểm tra thao tác/thị giác trên web do anh thực hiện; chưa xác nhận mobile/focus/performance bằng kiểm tra tĩnh. `next-env.d.ts` được build cập nhật đường dẫn types tự sinh. Chưa commit/push/deploy.

## Motion theo kế hoạch của anh — 05/10/2026

Triển khai Phase A/B với CSS, IntersectionObserver và Web Animations API; dùng token chung, không thêm dependency. Press, dialog/toast enter-exit, chuyển tab không remount, ảnh load, Notes/Memories reveal một lần, Prayer departure sau xác nhận và streak feedback theo thay đổi dữ liệu thật. Không thêm Phase C/presence giả; không sửa API/RPC/RLS/retry để phục vụ motion. Chi tiết tại `doita-test/MOTION_PLAN.md`.

Theo yêu cầu mới của anh, kiểm tra thao tác/thị giác trên web do anh thực hiện. Typecheck, lint và build exit0;25 unit tests qua. Đối chiếu 26 tiêu chí RULES_UX ở mức code; chưa xác nhận Back/focus/mobile/reduced-motion hoặc performance trên web. Không commit/push/deploy.

## Đăng ký và thương hiệu — 05/10/2026

Bỏ tên thương hiệu lặp trong auth-art. Đăng ký chọn giới tính qua Select chung, không chọn sẵn, không có “Chưa thiết lập”; lỗi ngay cạnh trường và focus quay về đó, lựa chọn giữ khi gửi lỗi. Gửi gender trong metadata; migration bổ sung `202610050009_signup_gender.sql` cập nhật trigger lưu vào profile và từ chối thiếu/sai lựa chọn cho tài khoản mới, không đổi hồ sơ cũ. Các lựa chọn khớp hồ sơ hiện tại: Nam/Nữ/Khác/Không muốn chia sẻ.

25 unit tests và 28 nhóm database local qua; build/typecheck/lint auth qua. Browser fixture ban đầu chưa qua do response giả thiếu version header của Supabase; đã sửa fixture, chưa xác nhận lần chạy tiếp theo vì yêu cầu chuyển sang motion và giao kiểm tra web cho anh. Chưa áp dụng migration mới lên Supabase thật.

## Đường dẫn Hai đứa — 05/10/2026

Theo yêu cầu mới của anh, Hai đứa dùng `/couple`, hồ sơ dùng `/profile`; `/settings` dành cho cài đặt ứng dụng sau này. Đổi route, tên feature/component và khóa nav thành couple, cập nhật các liên kết từ daily/popup hồ sơ và bộ kiểm tra. Thông báo cũ trỏ `/settings` được đổi đích lúc mở hoặc gửi push, giữ query và không mở link ngoài origin. Không tạo alias `/settings` cho Hai đứa; không sửa migration đã áp dụng hay dữ liệu production.

Kiểm chứng local: build/typecheck và lint exit0; 24 unit tests, 5 nhóm browser profile và 24 nhóm browser regression qua. Browser kiểm tra tab active, Back/Forward, liên kết popup, `/settings` trả404 và thông báo ngày đặc biệt cũ vẫn mở đúng record ở `/couple`. Service worker được chạy trong fixture: giữ query khi đổi đích và từ chối origin ngoài. Chưa kiểm tra push trên thiết bị thật hoặc deploy.

## Hồ sơ cá nhân — 05/10/2026

Tách avatar/menu sang `/profile`; Hai đứa giữ `/settings` cho không gian chung. Thêm tên hiển thị, giới tính khóa theo membership và crop/nén avatar WebP256×256 tối đa80KB; không chặn ảnh gốc5MB, không upload ảnh gốc. Chuyển thông báo/tài khoản sang hồ sơ, dùng avatar thật tại header/thành viên/lời nhắn/daily với fallback theme. Giữ draft theo tài khoản, receipt retry, popup không tự rời; RPC/trigger bảo vệ ở database. Bucket riêng tư, URL ký5phút, registry và cleanup dọn ảnh cũ/bỏ dở/xóa tài khoản.

Local: 23 unit tests, 27 nhóm PGlite, kiểm tra API bằng Sharp thật/mocked Supabase HTTP, browser profile/crop/retry/khóa/responsive và 24 nhóm regression cũ qua; build/typecheck/lint được chạy. Chi tiết và giới hạn tại `docs/PLAN_PROFILE_DOITA.md`. Chưa áp dụng migration `202610050008_profile.sql` lên Supabase thật, chưa commit/push/deploy hoặc kiểm tra thiết bị thật/email/push thật.

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

## Sửa theo phản hồi và skill design-doita — 05/10/2026

Checkout lúc bắt đầu: `a280c12` (`refactor UI`), tracked files sạch. Đã truy cập và đọc `C:/Users/minh tai/.codex/skills/.system/design-doita/SKILL.md` cùng 3 references project-contract, copy-and-layout, verification-and-sources. Đọc lại AGENTS/RULES_UX/THEMES và code hiện tại; snapshot của skill không thay trạng thái repo. Phiên này không có tool Supabase MCP hoặc browser MCP; dùng source và Edge/Playwright local đã có, không đọc dữ liệu riêng hoặc khóa để làm mẫu.

Anh chỉ ra đúng các lỗi mà lần kiểm tra trước chưa bao phủ: CSS không làm trang tràn vẫn có thể ép search/select thành cột bé; build và contrast token qua không chứng minh màu đúng hướng ảnh mẫu; CTA nằm trong disclosure chưa mở vẫn có thể lặp khi người dùng mở nó. Bản trước tự chọn nền giấy/serif và khối xanh đậm không đúng hướng trắng/hồng trong ảnh đã duyệt.

| UI → nguyên nhân → sửa | Contract giữ nguyên |
| --- | --- |
| Notes search/filter → `.filters` flex, dòng `<small>` có basis 100% nhưng desktop không wrap → grid 2 cột có `minmax(0,1fr)`, hướng dẫn span toàn hàng, mobile 1 cột; bỏ flex/min-width cũ và rút label thành Tìm lời nhắn | `useCollection` vẫn tìm trên server/debounce/pagination, filter private/shared và Back không đổi |
| Activities → 2 Button cùng `choose()` khi mở filter → chỉ giữ CTA ngoài filter; khi có kết quả giữ hành động đổi gợi ý ở card | `recommend()` cục bộ với time/energy/preference/history; like/complete vẫn `log_activity` và action scope cũ |
| Prayer → subtitle nằm ở PageTitle và river-caption → giữ ở PageTitle, bỏ caption lặp, chỉ hiện cảnh khi có điều ước released; archive/empty không dựng cảnh trống | Mở thuyền vẫn `setSelected`, save/action RPC và author/private/draft không đổi |
| Notes/Prayer/Memories empty → nút viết/thêm lặp nút đầu trang → giữ một CTA đầu trang, empty nói trạng thái; nút xóa bộ lọc vẫn giữ vì hành động khác | Không đổi lưu draft, submit hoặc quyền xem |
| Theme → cream/yellow/serif/dark teal và rule nth-child vàng ở globals → registry đổi trắng/hồng, chữ sans hệ thống; river dùng theme river + text, bỏ gradient teal hard-code và rule nth-child | AI assets, PNG nguồn, registry theme mặc định `sunset` giữ nguyên; không thêm dependency |

Kiểm tra tại repo gốc: lint exit 0, typecheck exit 0 và Turbopack build exit 0. Lint lại file Memories và script browser sau thay đổi cuối. Browser trên bản build local qua 23 nhóm (22 regression cũ và nhóm mới: search/filter có chiều rộng dùng được/label không dựng đứng ở 1440/390/320; CTA duy nhất khi disclosure mở/đóng; subtitle Prayer duy nhất). Không có pageerror. Audit 11 cặp màu nền đặc qua: 4,86–14,53:1, chữ trắng/nút rose 5,66:1. Không gọi kết quả token này là chứng nhận toàn web đạt WCAG.

Đã xem render mới Home desktop, Notes desktop, Activities desktop và Prayer mobile. Thêm ảnh Activities khi filter mở ở 1440/390/320 và Prayer có thuyền ở 1440/390 để review đúng trạng thái anh gặp; ảnh fixture, không phải dữ liệu production. Ảnh bản trước giữ trong `doita-test/redesign-evidence/review-before-*`; ảnh hiện tại `after-*`. Cập nhật THEMES/RULES_UX để giữ hướng màu và kiểm tra thực chiều rộng/control/CTA lặp ở lượt sau. Không chạy lại SQL vì không đổi handler/API/schema/RLS. Chưa kiểm tra zoom trình duyệt 200%, màn hình vật lý hoặc screen reader; không deploy, gửi thông báo hoặc mutation production.

## Control riêng và skill interface-design — 05/10/2026

Cài global bằng lệnh anh yêu cầu (npx skills add ... --skill interface-design --agent codex -g -y), exit0; đọc SKILL.md thật sau cài. Thay dropdown bằng component Radix được style qua theme, scrollbar/caret/selection riêng, dialog xác nhận riêng và feedback nổi nhẹ. Không áp mockup A/B/C chưa chọn hoặc ghi rằng đã xong toàn bộ Hai nét. Chi tiết source, intent, trạng thái và bằng chứng ở docs/CONTROL_DESIGN.md; RULES_UX bổ sung quy tắc control cho lượt sau.

Typecheck/build/lint exit0; Edge/Playwright fixture qua 24 nhóm, không pageerror. Xem menu 320/1440 và confirmation390 sau khi animation kết thúc. Build tự cập nhật đường dẫn generated types trong next-env.d.ts. Dependency @radix-ui/react-select được thêm cho keyboard/focus/positioning; không đổi API/RLS. Không commit/push/deploy, không mutation production. Các PNG mockup và diff UI có trước vẫn được giữ.
## Icon ứng dụng — 05/10/2026

Theo yêu cầu chỉnh icon đơn giản, thay thuyền xanh cũ bằng trái tim rose `#bc3156` trên nền hồng nhạt `#ffe8f0`, cùng palette theme hiện tại. Nguồn vector chỉnh sửa được: `public/icons/icon.svg`; đồng bộ `public/favicon.svg` và ba PNG hiện có, giữ tên và đường dẫn manifest. PNG được kiểm tra đúng 192/512 px; đã xem bản thu nhỏ và crop tròn để kiểm tra khoảng an toàn maskable. Chưa kiểm tra cài PWA trên thiết bị thật.

## Thanh cuộn, disclosure và cache icon — 05/10/2026

Thanh cuộn dùng primary/soft của theme thay muted; Chromium dùng thumb bo tròn, trình duyệt hỗ trợ chuẩn dùng scrollbar-color. Giữ cuộn native, không chặn thao tác cuộn. Summary bỏ marker tam giác trình duyệt, thay chevron rose ở bên phải, đổi hướng khi mở; vẫn dùng details/summary cho Enter/Space và trạng thái mở/đóng. Áp dụng thống nhất cả bộ lọc Activities, lịch sử daily, mood và thao tác lời nhắn. Reduced motion tắt transition như các control khác.

Kiểm tra public production ngày này: favicon đã là trái tim rose, SHA-256 PNG192 khớp file local; manifest còn dùng URL icon không phiên bản. Service worker chỉ cache trang offline, không cache icon. Thêm src/config/app-icons.ts làm nguồn URL version cho metadata favicon/Apple và manifest; tăng version khi thay artwork lần sau. Bản PWA đã cài có thể cập nhật icon theo lịch riêng của hệ điều hành; không khẳng định thay ngay sau deploy.

Lint/typecheck/build exit0. Edge render CSS thật ở 320/390/1440: Enter/Space hoạt động, marker rỗng, chevron/thumb rose, không tràn ngang. Local production HTML có favicon version mới; cả ba URL icon trong manifest trả 200. Đã xem ảnh Activities mobile. Không sửa dữ liệu, không commit/push/deploy.
`scripts/test-redesign-browser.mjs` trên bản build local qua 24 nhóm regression, exit0; không có pageerror. Đây là fixture, chưa kiểm chứng trên iOS/Android thật.

## Bộ icon doodle của anh — 05/10/2026

Nguồn cuối cùng anh chọn: `doita-test/cuts/mapping.json` và 35 PNG cạnh file đó. Đã sao chép thật, giữ nguyên tên vào `public/assets/doita/doodle-icons`, gồm mapping.json. Bản dùng trên web ở `public/themes/sunset/icons`: WebP lossless, giữ alpha, 96 px (Heart 192 px), tổng 231.246 byte. Không sửa màu, không filter CSS, không tạo lại hình hoặc giả SVG.

Registry `src/config/ui-icons.ts` gắn vào THEME.icons; component `src/components/icons.tsx` thay mọi import Lucide trong 11 file. Giữ tên vai trò House/Ship/etc để handler/nhãn không đổi; Trash2 ánh xạ trash, Volume2/VolumeX ánh xạ volume-on/volume-off. Icon trang trí alt rỗng và aria-hidden, kích thước giữ theo từng nơi. Chevron summary dùng cùng asset qua biến theme; CSS toast/confirmation/auth được cập nhật từ selector svg sang doita-icon. Không thay favicon/PWA hoặc minh họa lớn ở lượt này.

Kiểm chứng: typecheck/lint/build exit0; 35 bản PNG sao chép khớp byte với cuts, 35 URL WebP trả 200 và có alpha/kích thước đúng. Browser fixture local qua 24 nhóm regression cùng kiểm tra icon đang hiện ở 1440/390/320 (tải thành công, đúng registry, aria-hidden, không filter, không bị co kích thước). Lần kiểm tra đầu chờ cả ảnh trong sidebar đang ẩn bị timeout vì lazy loading; sửa phép kiểm tra chỉ chờ ảnh đang hiển thị, không thay code ứng dụng để ép tải ảnh ẩn. Chưa review thẩm mỹ từng ảnh hoặc kiểm tra thiết bị thật; theo yêu cầu anh, tích hợp trực tiếp từ mapping. Không commit/push/deploy.

## Bỏ chữ và khối dư theo yêu cầu — 05/10/2026

Bỏ subtitle ở Notes/Prayer/Memories/Activities cùng các lần lặp ở Home; bỏ eyebrow sidebar và dòng mô tả phạm vi tìm kiếm Notes. Bỏ dòng nhắc quyền xem cạnh nút của hai composer; giữ Visibility trong form, nhãn quyền xem ở nội dung và xác nhận thả điều ước. Settings bỏ câu chờ người ấy, hướng dẫn cài app và toàn bộ thẻ Giao diện với mascot/tên theme/CTA Cùng làm. Registry/assets theme và khả năng cài PWA vẫn tồn tại; chỉ bỏ phần UI anh yêu cầu. Bỏ CSS riêng thẻ theme không còn dùng, cập nhật kỳ vọng browser regression về subtitle Prayer thành không xuất hiện.
Kiểm tra: lint/typecheck/build exit0; browser local fixture xác nhận các câu bị bỏ và theme-card không xuất hiện trên 6 route ở 1440/390 px, cùng 24 nhóm regression qua, không pageerror. Chưa kiểm tra thiết bị thật hoặc deploy. Đã cập nhật RULES_UX để tránh đưa lại các phần dư này.

## Tab Hai đứa trên desktop — 05/10/2026
Bỏ điều kiện lọc settings khỏi desktop-nav trong couple-app.tsx. Typecheck và ESLint file qua. Browser fixture trên local dev: tab hiện, bấm mở /settings và active đúng ở 1912/1440/1280/1120 px, không tràn ngang. Không deploy.

## Bỏ múi giờ khỏi tạo không gian — 05/10/2026
PairScreen bỏ dropdown múi giờ và state liên quan; pair_couple dùng APP_CONFIG.timezone (Asia/Ho_Chi_Minh) khi tạo. Không thay dữ liệu cặp đôi cũ hoặc logic tham gia bằng mã mời. Typecheck và ESLint file exit0.
Browser fixture trên local dev: PairScreen không có combobox/nhãn múi giờ; bấm Tạo không gian gửi p_timezone=Asia/Ho_Chi_Minh qua perform_authorized_action. Không mutation production, chưa deploy.

## Replace doodle-art của anh — 05/10/2026

Nhận đủ 12 PNG từ doita-test/doita-doodle-assets/public/assets/doita/doodle-art. Copy thật giữ tên vào public/assets/doita/doodle-art; giữ nguyên tất cả thiết kế cũ. Tạo WebP với Sharp, resize theo kích thước theme hiện có, giữ alpha/tỷ lệ, không vẽ lại hoặc filter đổi màu. THEMES.sunset.assets trỏ sang public/themes/sunset/doodle-art; URL có hash từ nội dung để cache nhận ảnh mới. Script tái tạo scripts/prepare-doodle-art.mjs cập nhật hash registry. Tổng bản dùng trên web 196.028 byte.

Đã kiểm tra 12 bản nguồn khớp byte, 12 URL WebP trả HTTP200 và giữ alpha như nguồn. Browser fixture local: ảnh hiện tải thành công, 7 route không tràn ngang ở 1440/390 px, không pageerror. Typecheck/ESLint phù hợp được chạy; không đổi handler, logic upload ảnh, Supabase hoặc R2. Chưa kiểm tra thiết bị thật, không commit/push/deploy. Flowers vẫn là asset dự trữ theo layout hiện có, không thêm trang trí vào trang.

## Thuyền trong khung Prayer — 05/10/2026
Thay SVG paper-boat tự vẽ bằng Ship của registry doodle hiện có, size64. Giữ ngày, aria-label của nút, handler mở điều ước và class paper-boat. Typecheck/ESLint qua; browser fixture local với điều ước released kiểm tra ảnh tải, ngày và mở dialog ở1440/390px. Không tạo ảnh mới, không deploy.

## Nunito theo lựa chọn của anh — 05/10/2026

RootLayout dùng next/font/google Nunito bản thường, latin/vietnamese, variable font, display swap. Body và form kế thừa cùng font; nội dung 400/16px/1.6, nút/menu600, h1 800, h2/h3 700. Nội dung lời nhắn và câu trả lời/textarea đồng bộ giãn dòng1.6; không dùng font viết tay. Next đóng gói font để browser tải từ ứng dụng.

Typecheck, ESLint layout và build exit0. Browser fixture local kiểm tra font tải với mẫu tiếng Việt, computed body400/16/25.6 và h1 800; sáu route không tràn ngang ở1440/390. Kiểm tra font cần chờ document.fonts.load với mẫu ký tự, không chỉ fonts.ready trước khi fontface được dùng. Chưa kiểm tra thiết bị thật hoặc deploy.

### 06/10/2026 — Trang giới thiệu không gian

Anh duyệt triển khai PLAN_SPACE_PROFILE_DOITA và cung cấp doita-test/doita-new-icons. Thêm bio300 Unicode code points ở hồ sơ; chia sẻ mặc định tắt, consent theo membership; /p/000000001 chỉ có tên/avatar/bio và thống kê hai người. Không thêm kỷ niệm hay bình luận công khai. ID sai hoặc không khả dụng cùng màn thông báo, dùng minh họa mới. Motion nhẹ, không phát lại khi refresh, tắt khi reduced-motion; dùng màu/font/token có sẵn. TypeScript đạt; chưa áp dụng migration012, chưa kiểm tra database hay trình duyệt theo yêu cầu.

### 06/10/2026 — Avatar mặc định theo giới tính

Sửa ProfileAvatar chọn ảnh theo gender thay vì thứ tự membership; Nam dùng avatarA, Nữ dùng avatarB. Giới tính khác/chưa chọn giữ fallback hiện có. Hồ sơ preview theo draft; menu dùng dữ liệu đã lưu. Avatar tự tải giữ nguyên. Trang công khai dùng cùng helper và fallback đúng giới tính khi ảnh tải lỗi, không trả trường gender ra client. TypeScript exit0; chưa kiểm tra trình duyệt theo yêu cầu của anh.

### 06/10/2026 — Avatar cho người chưa chọn giới tính

Theo yêu cầu của anh, người chưa chọn giới tính dùng hình mặc định còn lại theo người ấy đã chọn Nam/Nữ. Áp dụng helper chung cho menu, hồ sơ, Hai đứa và trang công khai. Không sửa dữ liệu giới tính, không thay ảnh tự tải hay lựa chọn rõ ràng. Typecheck exit0; chưa kiểm tra web.

### 06/10/2026 — Chia sẻ bật mặc định theo yêu cầu mới

Thay thế quyết định mặc định tắt: migration013 đặt default true cho membership mới và bật các membership cũ chưa có thao tác tắt được ghi trong action_receipts. Giữ false nếu có lịch sử tắt từ UI; thao tác trực tiếp ngoài UI trước đây không có receipt nên không thể phân biệt với default false. Không chạy migration lên Supabase trong lượt này. Bỏ popup bật chia sẻ; luôn hiện nút sao chép link theo origin hiện tại. Một người tắt thì trang vẫn ẩn, không ghi đè lựa chọn của người ấy. TypeScript exit0; chưa kiểm tra web/database.

### 06/10/2026 — Căn trang giới thiệu và nhịp kết nối

Trang hai người dùng ba cột đối xứng: mỗi người một cột căn giữa, cột giữa là nhịp kết nối. Bỏ ID hiển thị lặp và toàn bộ khu vực hành động khi đủ hai người, kể cả liên kết vào không gian của chính mình. Bio trống/khoảng trắng hiện Chưa có mô tả bằng màu muted của theme. Kết nối dùng Heart doodle hiện có với SVG đường nhịp và CSS, không phải ảnh AI hay GIF; chạy một lượt theo motion.cinematic rồi giữ tĩnh, tạm dừng khi tab ẩn, tắt chuyển động theo reduced-motion. Không sinh assets bitmap mới hoặc thêm dependency. Typecheck exit0; chưa kiểm tra trực quan trên trình duyệt theo yêu cầu anh tự test.

### 06/10/2026 — Tim vector chạy theo sóng, lặp liên tục

Theo yêu cầu mới, bỏ icon doodle trong kết nối; tim và sóng cùng SVG, tim chạy theo chính đường sóng bằng animateMotion, lặp theo motion.cinematic. Nới cột giữa trên desktop, co theo viewport trên mobile; tim mobile tăng tỷ lệ riêng để còn rõ. Tạm dừng cả SVG/CSS khi tab ẩn; reduced-motion giữ tim tĩnh giữa đường. Có thể click hoặc dùng bàn phím trên nhịp kết nối để tạm dừng/tiếp tục. Không thêm bitmap, thư viện hoặc thay dữ liệu. Chưa kiểm tra trực quan trên web.

### 06/10/2026 — Khôi phục nền sóng SVG

Sửa lỗi CSS lượt trước làm mất stroke và gộp track vào animation opacity0. Tách shared stroke, track luôn opacity0.3 và wave chạy riêng. Tim vẫn theo cùng path với track. TypeScript exit0; chưa kiểm tra trình duyệt.

### 06/10/2026 — Tỉ lệ sóng desktop

Nguyên nhân sóng nhỏ: SVG width100% nhưng height64px cố định, preserveAspectRatio mặc định thu hình về160px và để trắng hai bên. Đổi height auto/aspect-ratio160/64 để hình phủ đúng chiều rộng cột; tim cùng SVG nên lớn theo đúng tỉ lệ. Khung nhịp căn giữa theo chiều cao avatar; giới hạn hàng hai người680px để giảm khoảng trống desktop. Mobile giữ sizing theo viewport. TypeScript exit0; chưa kiểm tra trực quan trên web.

### 06/10/2026 — Mở form sửa lời nhắn trên mobile

Handler Sửa trước đây mở composer ở đầu danh sách nhưng không scroll/focus, khó nhận ra khi đang xem thẻ phía dưới trên mobile. Thêm section ref và đưa tới ô tiêu đề sau render, chừa khoảng topbar. Thêm Sửa trong modal Mở thư chỉ cho tác giả, đóng modal trước khi mở form. Không thay quyền sửa, RPC hoặc draft. TypeScript exit0; chưa kiểm tra mobile trực tiếp theo yêu cầu anh tự test.

### 06/10/2026 — Tiêu đề tùy chọn và thời hạn lời nhắn

Tiêu đề không bắt buộc, vẫn tối đa120 ký tự; không tự sinh tiêu đề từ nội dung. Modal/accessible name dùng Lời nhắn khi tiêu đề trống, Home không hiện tiêu đề trống. Thêm 15 phút/1 giờ/1 ngày/1 tuần/Vĩnh viễn (mặc định); hạn tính server khi lưu, sửa nội dung giữ hạn, đổi thời hạn tính lại khi lưu. Giữ lifetime trong draft, giữ dữ liệu cũ/draft cũ ở forever. So sánh draft với baseline để chỉ xác nhận rời trang/đóng khi có thay đổi, không bật beforeunload khi chỉ mở sửa rồi xem; nút Lưu tắt khi không đổi.

Migration014 thêm expires_at/lifetime, read policy chặn thư hết hạn cùng note_items/kỷ niệm liên quan qua RLS hiện có; trigger chặn mutation vào thư/checklist hết hạn. save_note_timed tái dùng reconcile checklist và action receipts chống retry trùng, không kéo dài hạn qua retry. UI loại thư hết hạn ở danh sách/modal và snapshot Home. Daily cron dọn thư, kỷ niệm liên quan và nội dung trong receipt; đọc bị chặn ngay theo server nhưng xóa vật lý phụ thuộc cron được cấu hình/chạy thành công. Không hứa thu hồi nội dung đã tải xuống thiết bị hoặc bản nháp của người viết.

TypeScript exit0, diff --check exit0. Không chạy test/build/browser hoặc áp dụng migration trên Supabase theo yêu cầu anh tự test. Cần áp dụng supabase/migrations/202610060014_note_lifetime.sql trước khi dùng form mới và cron mới; SQL/RLS/trigger/cron chưa được kiểm chứng thực thi.

### 06/10/2026 — Cảnh báo sai khi form lời nhắn trống

Ảnh form trống có visibility Cả hai, khác baseline Chỉ mình, nên dirty=true dù chưa có lời nhắn. Tách hasUnsavedMessage: form mới chỉ cảnh báo nếu có title/body thực sự; chỉ đổi loại/quyền/hạn của form trống không cảnh báo. Form sửa có nội dung đã lưu vẫn xét metadata khác baseline để bảo vệ thay đổi. Reset cả draft và baseline sau lưu thành công; Lưu tắt khi body trống. TypeScript exit0; chưa kiểm tra/deploy production.

### 06/10/2026 — Không tự mở composer khi khôi phục draft

Nguyên nhân form xuất hiện trước khi bấm: effect khôi phục localStorage gọi setOpen(true) nếu bản nháp có body/title hoặc editingID. Bỏ auto-open, luôn setOpen(false) khi vào trang/đổi scope. Giữ draft trong storage; chỉ handler Viết lời nhắn/Sửa mở composer và đưa focus tới form. TypeScript exit0; chưa kiểm tra web hoặc deploy.

### 06/10/2026 — Xóa bản nháp điều ước

Thêm Xóa bản nháp cạnh từng draft đã lưu và trong composer (cả draft local chưa lưu). Dùng xác nhận destructive trước thao tác, Hủy không gửi request; chống gọi trùng. Xóa draft server qua delete_prayer_draft, kiểm tra tác giả/không gian/status draft và khóa row để không xóa điều ước vừa được thả. Retry tái dùng action receipts. Xóa đúng bản local và active marker tương ứng, không đóng/xóa bản khác đang mở khi response về. Không tự xóa local draft nếu server write lỗi. Migration015 chưa áp dụng; TypeScript exit0, chưa test database hoặc web.

### 06/10/2026 — Logic chung cho thay đổi chưa lưu

Thêm src/lib/draft-changes.ts so sánh trường chỉnh sửa với baseline đã lưu, bỏ qua ID và khoảng trắng đầu/cuối; form mới chưa có nội dung không tính thay đổi metadata là lời nhắn/điều ước chưa lưu. src/components/unsaved-changes.ts xử lý chung navigation, beforeunload và xác nhận đóng/chuyển bản, chỉ gắn guard khi form mở và có thay đổi thật. Notes và Prayer dùng cả hai module. Prayer đặt baseline từ draft server khi mở, reset sau lưu/xóa, lưu nháp không hoạt động khi không đổi, giữ xác nhận thả thuyền/xóa độc lập. Bản nháp chỉ khôi phục dữ liệu, không tự mở form ở cả hai route. Chuyển sang bản khác chỉ hỏi nếu có thay đổi thật, giữ nháp cũ.

TypeScript exit0 và diff --check exit0; không chạy browser/test hoặc deploy theo yêu cầu. Không cần migration cho thay đổi này. Dialog reload/tab-close vẫn do trình duyệt nếu thực sự có thay đổi chưa lưu.
