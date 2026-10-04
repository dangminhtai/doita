# Trạng thái bàn giao

## Đã triển khai

- Next.js/TypeScript/Tailwind; mobile-first, bottom navigation, desktop navigation, focus keyboard, native modal, reduced-motion.
- Auth email/password, signup, signout, recovery; màn ghép cặp riêng và khôi phục session.
- Invite 96-bit, hết hạn 7 ngày, tối đa 2 người/cặp, 1 cặp/tài khoản, rotation và rate limit 10 lần/15 phút trên database. Auth endpoint dùng rate limit mặc định Supabase.
- Daily async, chọn prompt ít dùng gần đây, reveal server-side, reply/reaction, lịch sự kiện, completion nguyên tử.
- Streak daily, longest, repair 2 lần/tháng, protection một ngày khi có lịch sử mất cron. Luật chạy trong SQL.
- Note text/checklist, riêng/chung, create/edit/delete/pin, tìm/lọc các note đã tải, đánh dấu checklist chung; nút tải thêm.
- Prayer riêng/chung, draft, thả thuyền sau khi lưu, river, đọc thư, archive/delete, gợi ý và resurfacing sau 30 ngày, lọc/tải thêm.
- Timeline moment/photo/daily/note/prayer/activity/weekly; signed image, detail, filter và on-this-day.
- Mood/presence/quick responses, Chán Mode lọc thời gian/năng lượng/category, reroll, lịch sử/rating.
- Weekly check-in tự nguyện; CRUD ngày đặc biệt và countdown.
- PWA manifest, PNG icons, service worker offline fallback; Web Push subscription/unsubscription, server sending, notification outbox/lease/retry.
- Daily cron secret, timezone-aware sessions, maintenance, resurfacing/reminders, job status; admin API/server allowlist.
- Migration versioned, RLS + SQL grants, private Storage, Realtime status; schema seed idempotent.
- Content config, feature flags, Zod, không hiển thị raw backend error; export JSON và delete account.
- 40 daily prompts, 21 prayer prompts, 100 activities.

## Kiểm tra tự động đã chạy

- Production build không có biến bí mật: PASS.
- TypeScript: PASS.
- ESLint: PASS.
- 6 nhóm unit tests: PASS.
- PostgreSQL/PGlite integration: PASS (RLS, privacy, pairing, reveal, streak, repair, cron idempotency, service-only, Storage, leave).

- Chromium với API Supabase được mô phỏng: PASS daily submit/wait/reveal, tạo note, thả thuyền/mở modal, gợi ý hoạt động.
- Sáu màn home/daily/notes/prayer/memories/settings ở 320px, 375px, 1440px: PASS không tràn ngang; không có page runtime errors.
- API cron không có secret trả 401; PWA manifest có 3 icon: PASS.
- Đã xem ảnh render mobile/desktop, thay biểu tượng mood để hiển thị ổn khi không có font emoji. Ảnh minh họa trong `docs/screenshots` sử dụng dữ liệu giả, không phải dữ liệu người dùng thật.

## Cần kiểm tra sau khi điền key

- Chạy migration + seed trên **project Supabase mới**, kiểm tra grant/RLS trong project thật.
- Hai tài khoản thật đăng ký, xác nhận email, ghép đôi; đồng thời trả lời daily; mở trên hai thiết bị để kiểm tra Realtime và quyền riêng tư.
- SMTP reset password, upload ảnh thật, export và delete account với tài khoản thử.
- Deploy Vercel Production/Preview và cấu hình auth redirects.
- HTTPS PWA cài trên Android Chrome và iOS Safari; xin quyền push đúng điều kiện nền tảng.
- Push qua Google/Mozilla/Apple với VAPID thật; Windows WNS chưa bật.
- Cron thực tế với CRON_SECRET, admin allowlist và việc khôi phục project nếu nhà cung cấp pause.
- Lighthouse trên deployment thật.

## Phạm vi mở rộng

- Photo notes/voice/drawing, games/AI/calendar không triển khai; cờ mặc định tắt.
- Notes search hiện tìm trong những note đã tải; tải thêm để tìm lịch sử cũ. Có thể chuyển sang full-text search khi dữ liệu lớn.
- Timeline hiện tạo reference cho daily/note/prayer, bản ghi activity/weekly/moment; ngày đặc biệt được nhắc và đếm ngược, chưa tự lưu timeline.
- Chưa có UI editor cho feature flags/prompt/admin, giờ nhắc riêng, lịch push theo từng user hoặc queue worker quy mô lớn.
- Admin hiển thị công việc `daily_maintenance` tổng hợp, không tách bốn dashboard job riêng.
- Quyền truy cập bắt buộc server-side; feature flags chủ yếu điều khiển sản phẩm/UI, không phải khóa API.
- PWA không lưu dữ liệu riêng để xem offline. Chưa có merge/retry offline hoặc autosave lên server; draft giữ trên thiết bị.
