# Gần nhau — Couple River

Web app riêng cho một cặp đôi, mobile-first. Next.js App Router + TypeScript + Tailwind CSS, Supabase Auth/Postgres/Realtime/Storage, Vercel Cron và Web Push. Không cần AI, không có điểm số tình yêu.

## Chạy nhanh trên Windows / Linux

Cần Node.js **22.16 trở lên**. Giải nén và mở terminal trong thư mục `couple-river`:

```bash
npm ci
```

Copy `.env.example` thành `.env.local`:

```powershell
# Windows PowerShell
Copy-Item .env.example .env.local
```

```bash
# Linux / macOS
cp .env.example .env.local
```

Điền key vào `.env.local`, làm phần Supabase bên dưới rồi chạy:

```bash
npm run dev
```

Mở http://localhost:3000. Không có key thì ứng dụng hiển thị màn hình yêu cầu cấu hình, không giả vờ đã lưu dữ liệu.

## 1. Supabase

1. Tạo project mới. Trong **Project Settings → API**, lấy Project URL và `anon` key. Dùng key từ đúng project.
2. Điền `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Điền `SUPABASE_SERVICE_ROLE_KEY` từ mục API keys. Khóa này chỉ dùng ở server, seed, cron và xóa tài khoản. **Không thêm tiền tố NEXT_PUBLIC cho service role, CRON_SECRET hoặc VAPID_PRIVATE_KEY.**
4. Mở **SQL Editor**, chạy toàn bộ `supabase/migrations/202610040001_core.sql` **một lần**, rồi chạy `supabase/seed.sql`. Migration dành cho project mới; sửa schema sau này bằng migration mới.
5. Trong **Authentication → URL Configuration**, cấu hình Site URL và Redirect URLs: `http://localhost:3000/auth`, `https://TEN-WEB.vercel.app/auth`, thêm domain riêng nếu có. Chỉ thêm preview domain mà bạn dùng và tin cậy.
6. Bật Email provider. Bản này dùng email + password, hỗ trợ xác nhận email và khôi phục mật khẩu. Với email confirmation bật, phải xác nhận email rồi đăng nhập. Khi đưa cho người dùng thật nên cấu hình SMTP riêng để tránh giới hạn email mặc định.
7. Migration tạo bucket `memories` **private**, giới hạn 5 MB, chỉ JPEG/PNG/WebP, bật Realtime cho session daily, note, mood, prayer, memory. Không đổi bucket sang public. Ảnh được xem bằng signed URL 5 phút.

Có thể seed từ JSON thay vì chạy `seed.sql`:

Với project đã chạy migration khởi tạo, chạy các migration mới theo thứ tự tên file. Bản sửa checklist dùng `supabase/migrations/202610040002_preserve_checklist.sql`; không chạy lại `202610040001_core.sql` trên database đang có dữ liệu. Bản sửa giữ ID và trạng thái hoàn thành của các dòng không đổi; dòng bị thay nội dung được xem là mục mới. Trạng thái đã mất trước bản sửa không thể tự khôi phục.

```bash
npm run seed
```

Script dùng `.env.local`, upsert theo ID nên chạy lại không tạo bản ghi trùng. Sau khi sửa JSON, chạy `npm run seed:sql` để đồng bộ bản SQL, rồi `npm run seed` để cập nhật database.

## 2. Các biến môi trường

| Biến | Dùng ở đâu | Điền gì |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server | URL của Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server | anon key; quyền thực tế do Auth và RLS kiểm soát |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | service role key; giữ bí mật |
| `CRON_SECRET` | Server | Chuỗi ngẫu nhiên tối thiểu 32 ký tự |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Browser/server | public key tạo bằng `npm run vapid` |
| `VAPID_PRIVATE_KEY` | Server | private key cùng cặp VAPID |
| `VAPID_SUBJECT` | Server | `mailto:email-cua-ban@example.com` |
| `NEXT_PUBLIC_APP_URL` | Cấu hình | URL public của web; giữ để mở rộng sau này |

Tạo VAPID:

```bash
npm run vapid
```

Tạo cron secret bằng Node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Không gửi `.env.local` lên GitHub. ZIP chỉ chứa `.env.example` trống. `.gitignore` đã loại `.env*`, trừ `.env.example`.

## 3. Deploy Vercel

1. Tạo repository của bạn từ thư mục này, commit source và `package-lock.json`. Không commit `node_modules`, `.next`, hoặc `.env.local`.
2. Import repository vào Vercel, chọn framework **Next.js**, root là thư mục có `package.json`.
3. Chọn Node.js 22.x hoặc 24.x. Build command `npm run build`, install command `npm ci`.
4. Thêm các biến trên vào Vercel Environment Variables. Thêm đầy đủ vào Production; Preview nếu bạn dùng preview riêng. Biến `NEXT_PUBLIC_*` được đóng vào bundle lúc build, đổi biến thì redeploy.
5. Deploy, cập nhật Supabase Site URL/Redirect URLs theo domain thật.
6. Đăng ký hai email, xác nhận email, người thứ nhất tạo không gian, mở **Hai đứa** gửi mã mời cho người thứ hai. Mã ngẫu nhiên 24 ký tự hex, hết hạn 7 ngày. Một người chỉ ở một không gian, tối đa hai người/không gian.

Chưa có deployment thật trong gói này: bạn tự điền key và deploy vào tài khoản của bạn.

## 4. Cron và thông báo

`vercel.json` đăng ký `/api/cron/daily` lúc **02:00 UTC mỗi ngày**. Với Vercel Hobby đây là lịch một lần/ngày; thời điểm thực tế có thể lệch. Đây là lịch bảo trì, không phải lời hứa nhắc chính xác một giờ tùy chọn.

Vercel gửi `Authorization: Bearer <CRON_SECRET>`. Endpoint từ chối nếu thiếu/sai secret, dùng so sánh constant-time, không tạo Supabase client trước khi xác thực cron. Công việc thật: tạo daily còn thiếu theo timezone cặp đôi, cấp lại 2 lượt repair mỗi tháng, ghi ngày bỏ lỡ, bảo vệ một ngày khi có lịch sử gián đoạn bảo trì trên 48 giờ, xử lý thuyền đến hạn và tạo thông báo. `system_jobs` lưu kết quả. Advisory lock, unique constraints và outbox dedupe giúp cron chạy lại không tạo trùng.

Daily cũng được tạo lúc mở ứng dụng, nên không phụ thuộc cron phải chạy đúng nửa đêm. Streak chỉ tăng sau **hai thành viên hiện tại** cùng gửi câu trả lời. Note, prayer và hoạt động không dùng để farm streak. Hai ngày cách lần hoàn thành cuối được hiển thị để còn cơ hội repair; khoảng trống lớn hơn hiển thị 0 và lần daily tiếp theo bắt đầu lại 1. Repair nối qua đúng một ngày bỏ lỡ, cần làm **trước daily hôm nay**. Múi giờ chung cố định sau daily đầu tiên để tránh ghi nhận hai lần/ngày; mặc định Việt Nam. Đổi mặc định trước khi tạo cặp trong `app.config.ts` nếu cần múi giờ khác.

Cron thực hiện database work mỗi ngày, giúp duy trì hoạt động thật. **Không bảo đảm Supabase Free không bị pause**: chính sách/khả dụng của nhà cung cấp nằm ngoài ứng dụng. Nếu project đã pause, phải khôi phục trong Supabase Dashboard trước. Kiểm tra log cron trong Vercel và Supabase định kỳ.

Push dùng nội dung trong `CONTENT.notifications`, không chứa nội dung thư riêng. Sau gửi daily/thuyền, client yêu cầu server xử lý các thông báo do chính tài khoản đó tạo. Nếu đóng trang quá sớm hoặc gửi push lỗi, cron xử lý tiếp. Outbox có lease chống gửi chồng, thử tối đa 5 lần; 404/410 xóa subscription hỏng. Server kiểm tra lại membership trước khi gửi. Nhà cung cấp push được cho phép: Google FCM, Mozilla và Apple; Windows WNS chưa được bật. VAPID chưa điền thì app vẫn dùng được, push chưa hoạt động.

Để nhận push: mở **Hai đứa → Bật thông báo**. Cần HTTPS (localhost được phép thử), trình duyệt có Web Push và cấp quyền. Trên iPhone, cài vào màn hình chính trước khi xin quyền. Trạng thái offline chỉ là trang hướng dẫn; không cache dữ liệu riêng hay nội dung authenticated. Bản nháp note/prayer/daily/memory giữ tại thiết bị theo UUID người dùng, xóa khi đăng xuất/rời không gian.

Kiểm tra cron thủ công bằng terminal; không đặt secret trong URL:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://TEN-WEB.vercel.app/api/cron/daily
```

## 5. Sửa chữ, nội dung, tính năng

- **Toàn bộ chữ giao diện**: `src/config/content.vi.ts`. Có TypeScript kiểm tra key, Zod kiểm tra các nhóm cần thiết, helper `interpolate` cho `{{count}}`. Nội dung do người dùng viết và prompt/activity từ database không phải chữ hard-code trong component.
- **Feature flags và giới hạn UI**: `src/config/app.config.ts`. Flag tắt sẽ ẩn mục và không mở màn tính năng tương ứng. Đây là cấu hình sản phẩm, không thay thế phân quyền database. Nếu muốn cấm thao tác qua API khi tắt tính năng, bổ sung cấu hình server/database trong migration.
- **40 daily prompts**: `data/daily-prompts.json`.
- **21 gợi ý cầu nguyện**: `data/prayer-prompts.json`. Đây là gợi ý, luôn được viết tự do.
- **100 hoạt động được biên soạn riêng**: `data/activities.json`, có thời gian/năng lượng/category. Thuật toán lọc theo lựa chọn, tránh lịch sử gần đây, vẫn có thể chọn lại khi đã hết gợi ý phù hợp.
- **Màu sắc, responsive, hiệu ứng**: `src/styles/globals.css`.
- **Luật database**: migrations; viết migration mới để thay đổi trên project đang có dữ liệu. Số lượt repair được khóa config ở 2 để khớp luật database; muốn thay đổi cần migration và cập nhật schema config. Giới hạn server hiện là note 5000, prayer 1000, daily 3000, reply 500. Nếu tăng giới hạn UI, phải tăng check constraint tương ứng bằng migration.
- **Seed SQL**: được tạo từ JSON bằng `npm run seed:sql`; không chỉnh cả hai nơi độc lập.

## 6. Quyền riêng tư và dữ liệu

Mọi bảng chứa dữ liệu riêng có RLS; không cấp quyền ghi bảng nghiệp vụ trực tiếp cho authenticated/anon. Các RPC có xác thực, kiểm tra membership/ownership, validation và transaction. Chỉ service role được gọi cron/claim notifications. Client không chứa service key.

Note riêng chỉ người viết xem, note chung hai người xem; chỉ tác giả sửa nội dung/ghim/xóa. Hai người được đánh dấu checklist chung. Prayer draft chỉ người viết xem, prayer released chung người ấy đọc được. Prayer riêng không bao giờ được chép vào timeline chung khi trôi trở lại. Timeline note/thuyền dùng tham chiếu, policy kiểm tra quyền nguồn hiện tại; chuyển note thành riêng thì kỷ niệm tham chiếu được loại bỏ.

Rời không gian thu hồi quyền đọc/ghi dữ liệu của không gian cũ, không xóa ngay dữ liệu. Thành viên còn lại có thể mời người mới; **người mới có thể đọc lịch sử chung được giữ lại**. Nếu bạn không muốn hành vi này, phải thêm quy trình đóng không gian và tạo không gian mới. Mã mời là bí mật của cặp, không công khai.

Xóa tài khoản xóa profile, membership và bản ghi do người dùng tạo qua FK cascade; ảnh có liên quan cũng được xóa trước. Dữ liệu chung do người ấy tạo vẫn giữ. Dữ liệu trên backup của Supabase tuân theo chính sách backup của project, không thể xóa tức thì bằng app.

Email đăng ký và khôi phục mật khẩu quay về `/auth` trên origin đang mở trong trình duyệt, không phụ thuộc `NEXT_PUBLIC_APP_URL`. Trong Supabase URL Configuration, đặt Site URL thành `https://doita.vercel.app`, và cho phép `https://doita.vercel.app/auth`, `http://localhost:3000/auth`, `http://127.0.0.1:3000/auth`. Các domain/port khác cần thêm riêng vào Redirect URLs. Trang `/privacy` đã được bỏ theo yêu cầu của chủ ứng dụng.

## 7. Kiểm tra

```bash
npm run typecheck
npm run lint
npm test
npm run test:database
npm run build
```

`test:database` dùng PGlite (PostgreSQL thực chạy trong WASM), chạy migration production với các schema/role Supabase được mô phỏng. Chỉ pgcrypto random bytes được thay bằng shim trong test. Các test kiểm tra RLS, third-member reject, code rate limit, note/prayer riêng, daily reveal, idempotency, cron quyền service-only, repair, private Storage policy và thu hồi quyền sau leave. Không cần key để chạy những test này.

Xem `IMPLEMENTATION.md` để biết phần đã kiểm tra tại máy và phần cần xác minh trên project thật. `checklists.md` giữ nguyên checklist ban đầu làm tài liệu yêu cầu; không đánh dấu các bước chưa thực hiện như deployment thật, Android/iOS hay push thực.

## Tài liệu nhà cung cấp

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vercel Cron security](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Vercel Cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)
