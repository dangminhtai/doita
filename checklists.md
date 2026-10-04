# CHECKLISTS — Couple PWA / Daily Ritual / Notes / Prayer Boat

> Mục tiêu: xây dựng một web app mobile-first cho cặp đôi yêu xa, deploy được trên Vercel, dùng Supabase làm backend, có PWA + push notification, giữ chuỗi hằng ngày, Notes, Prayer Boat, Memories, Chán Mode và kiến trúc dễ mở rộng.
>
> Nguyên tắc quan trọng: **không hard-code text hiển thị cho người dùng trong component**, mọi text UI phải đi qua file cấu hình riêng để có thể sửa nhanh mà không đụng logic.

---

# 0. Definition of Done

Project chỉ được coi là MVP hoàn chỉnh khi:

- [ ] Deploy chạy ổn trên Vercel.
- [ ] Có thể cài như PWA trên điện thoại.
- [ ] Hai tài khoản có thể ghép thành một cặp đôi.
- [ ] Có Daily ritual hằng ngày.
- [ ] Có Couple Streak.
- [ ] Có cơ chế streak repair / protection.
- [ ] Có Notes riêng tư và Notes chia sẻ.
- [ ] Có Prayer Boat: viết lời cầu nguyện, thả thuyền, xem Prayer River.
- [ ] Có Memories / timeline.
- [ ] Có mood / presence cơ bản.
- [ ] Có Chán Mode với activity recommendation.
- [ ] Có push notification.
- [ ] Có cron job hằng ngày.
- [ ] Supabase có RLS đầy đủ.
- [ ] Không có user-facing text bị hard-code trong component.
- [ ] Database schema được quản lý bằng migrations trong Git.
- [ ] Project có seed data cho daily prompts, prayer prompts và activities.
- [ ] Có trang admin/system tối thiểu để xem trạng thái cron và DB.
- [ ] Build không có TypeScript error.
- [ ] Không commit secret vào Git.

---

# 1. Tech Stack

## Frontend

- [ ] Next.js
- [ ] TypeScript
- [ ] Tailwind CSS
- [ ] Mobile-first responsive design
- [ ] PWA manifest
- [ ] Service Worker
- [ ] Web Push

## Backend / Database

- [ ] Supabase Auth
- [ ] Supabase PostgreSQL
- [ ] Supabase Realtime
- [ ] Supabase Storage
- [ ] Supabase Row Level Security

## Deployment

- [ ] Vercel
- [ ] Vercel Cron
- [ ] Environment Variables trên Vercel
- [ ] Preview deployment hoạt động
- [ ] Production deployment hoạt động

---

# 2. Repository Rules

Các luật này phải được coi là bắt buộc.

- [ ] Không hard-code user-facing text trong component.
- [ ] Không kiểm tra quyền riêng tư chỉ bằng client-side logic.
- [ ] Không public Supabase bucket chứa ảnh / dữ liệu riêng tư.
- [ ] Không thay đổi database trực tiếp mà không có migration.
- [ ] Không commit `.env`.
- [ ] Không viết một component khổng lồ ôm nhiều feature.
- [ ] Không để một feature phụ thuộc trực tiếp vào internals của feature khác.
- [ ] Mọi feature phải có thể bật/tắt bằng feature flag.
- [ ] Core app không được phụ thuộc AI.
- [ ] Mọi input phải validate.
- [ ] Mọi API route nhạy cảm phải kiểm tra auth.
- [ ] Cron endpoint phải có secret.
- [ ] Mọi query dữ liệu couple phải lọc theo `couple_id`.
- [ ] Mọi bảng chứa dữ liệu người dùng phải có RLS.
- [ ] Mọi thao tác quan trọng phải có trạng thái loading / error / success.

---

# 3. Folder Structure

Tạo cấu trúc:

```text
src/
├── app/
│   ├── auth/
│   ├── home/
│   ├── daily/
│   ├── notes/
│   ├── prayer/
│   ├── memories/
│   ├── activities/
│   ├── settings/
│   ├── admin/
│   └── api/
│
├── features/
│   ├── auth/
│   ├── couples/
│   ├── daily/
│   ├── streak/
│   ├── notes/
│   ├── prayer/
│   ├── memories/
│   ├── presence/
│   ├── activities/
│   └── notifications/
│
├── components/
│   ├── ui/
│   └── shared/
│
├── config/
│   ├── content.vi.ts
│   └── app.config.ts
│
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── notifications/
│   ├── validators/
│   └── date/
│
├── hooks/
├── types/
└── styles/
```

Mỗi feature nên có dạng:

```text
features/prayer/
├── components/
├── actions/
├── queries/
├── schemas.ts
├── types.ts
└── utils.ts
```

Checklist:

- [ ] Tạo cấu trúc folder.
- [ ] Không import vòng giữa các feature.
- [ ] Shared UI để trong `components/ui`.
- [ ] Business logic để trong `features/*`.
- [ ] Config UI không nằm trong feature.

---

# 4. Centralized UI Text

Tạo:

```text
src/config/content.vi.ts
```

Yêu cầu:

- [ ] Tất cả text hiển thị trên UI nằm trong file này.
- [ ] Bao gồm button label.
- [ ] Bao gồm placeholder.
- [ ] Bao gồm empty state.
- [ ] Bao gồm toast.
- [ ] Bao gồm error message.
- [ ] Bao gồm confirmation dialog.
- [ ] Bao gồm notification text.
- [ ] Bao gồm onboarding text.
- [ ] Bao gồm streak text.
- [ ] Bao gồm prayer text.
- [ ] Bao gồm notes text.
- [ ] Bao gồm admin/system text.

Ví dụ cấu trúc:

```ts
export const CONTENT = {
  common: {},
  auth: {},
  home: {},
  daily: {},
  streak: {},
  notes: {},
  prayer: {},
  memories: {},
  activities: {},
  notifications: {},
  errors: {},
  admin: {},
}
```

- [ ] Component chỉ đọc text qua `CONTENT`.
- [ ] Không xuất hiện `<button>Save</button>` trực tiếp.
- [ ] Có schema validate content config.
- [ ] Build fail nếu thiếu key quan trọng.
- [ ] Có helper interpolate `{{name}}`, `{{count}}`.

---

# 5. App Configuration

Tạo:

```text
src/config/app.config.ts
```

Phải chứa:

```ts
export const APP_CONFIG = {
  streak: {
    enabled: true,
    repairPerMonth: 2,
  },
  daily: {
    enabled: true,
  },
  notes: {
    enabled: true,
    maxLength: 5000,
  },
  prayer: {
    enabled: true,
    maxLength: 1000,
  },
  memories: {
    enabled: true,
  },
  features: {
    games: false,
    ai: false,
    voiceNotes: false,
    calendar: false,
  },
}
```

Checklist:

- [ ] Feature flags hoạt động thật.
- [ ] Feature bị tắt không xuất hiện trên UI.
- [ ] Các giới hạn như maxLength đọc từ config.
- [ ] Không hard-code config rải rác.

---

# 6. Supabase Setup

- [ ] Tạo Supabase project.
- [ ] Copy Project URL.
- [ ] Copy anon key.
- [ ] Lưu service role key chỉ ở server env.
- [ ] Tạo `.env.example`.
- [ ] Không commit `.env.local`.
- [ ] Cấu hình auth redirect URL cho localhost.
- [ ] Cấu hình auth redirect URL cho Vercel production.
- [ ] Cấu hình storage.
- [ ] Bật Realtime cho các bảng cần thiết.

Environment variables tối thiểu:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

---

# 7. Database Migrations

Tạo:

```text
supabase/
├── migrations/
└── seed.sql
```

Tạo migration cho:

- [ ] `profiles`
- [ ] `couples`
- [ ] `couple_members`
- [ ] `daily_prompts`
- [ ] `daily_sessions`
- [ ] `daily_answers`
- [ ] `streaks`
- [ ] `streak_events`
- [ ] `notes`
- [ ] `note_items`
- [ ] `prayers`
- [ ] `prayer_events`
- [ ] `memories`
- [ ] `memory_items`
- [ ] `moods`
- [ ] `activities`
- [ ] `activity_sessions`
- [ ] `push_subscriptions`
- [ ] `special_dates`
- [ ] `system_jobs`

---

# 8. Core Database Design

## profiles

- [ ] `id`
- [ ] `display_name`
- [ ] `avatar_path`
- [ ] `timezone`
- [ ] `created_at`
- [ ] `updated_at`

## couples

- [ ] `id`
- [ ] `relationship_start_date`
- [ ] `timezone`
- [ ] `invite_code`
- [ ] `created_at`

## couple_members

- [ ] `couple_id`
- [ ] `user_id`
- [ ] `role`
- [ ] unique `(couple_id, user_id)`

Không dùng:

```text
user.partner_id
```

---

# 9. Couple Pairing

Flow:

```text
User A
→ Create Couple
→ Generate Invite Code / Invite Link
→ User B nhập code
→ Join Couple
```

Checklist:

- [ ] User tạo couple.
- [ ] Tạo code ngẫu nhiên đủ khó đoán.
- [ ] Code có thể expire.
- [ ] Partner nhập code.
- [ ] Không cho user join nhiều couple active nếu chưa support.
- [ ] Không cho third user join couple đã đủ thành viên.
- [ ] Có chức năng leave couple.
- [ ] Có confirmation trước khi leave.
- [ ] Không xóa dữ liệu ngay khi leave nếu chưa có policy rõ ràng.

---

# 10. Authentication

- [ ] Sign up.
- [ ] Sign in.
- [ ] Sign out.
- [ ] Session restore.
- [ ] Protected routes.
- [ ] Redirect khi chưa login.
- [ ] Tạo `profiles` sau signup.
- [ ] Xử lý auth error.
- [ ] Không hiển thị raw Supabase error cho user.

---

# 11. RLS

Bắt buộc cho mọi bảng private.

## profiles

- [ ] User đọc profile mình.
- [ ] Partner có thể đọc profile public cần thiết.

## couples

- [ ] Chỉ member của couple đọc được couple.

## notes

- [ ] Private note chỉ author đọc.
- [ ] Shared note chỉ thành viên cùng couple đọc.

## prayers

- [ ] Private prayer chỉ author đọc.
- [ ] Shared prayer chỉ thành viên cùng couple đọc.

## daily

- [ ] Chỉ member cùng couple đọc session.
- [ ] Partner answer không bị leak trước reveal nếu logic yêu cầu khóa.

## memories

- [ ] Chỉ member couple đọc.

## storage

- [ ] Bucket private.
- [ ] Signed URL.
- [ ] Không public file URL.

---

# 12. Home Screen

Mobile-first.

Hiển thị:

- [ ] Couple names.
- [ ] Couple streak.
- [ ] Today's Daily status.
- [ ] Notes quick action.
- [ ] Prayer quick action.
- [ ] Chán Mode.
- [ ] Memory count.
- [ ] Mood/presence nhanh.
- [ ] Bottom navigation.

Tránh:

- [ ] Không dashboard dày đặc.
- [ ] Không sidebar desktop-first.
- [ ] Không card thừa.
- [ ] Không nhồi thông tin hệ thống.

---

# 13. Daily Ritual

## Data

`daily_prompts`

- [ ] `id`
- [ ] `prompt`
- [ ] `category`
- [ ] `difficulty`
- [ ] `is_active`
- [ ] `created_at`

`daily_sessions`

- [ ] `id`
- [ ] `couple_id`
- [ ] `prompt_id`
- [ ] `date`
- [ ] `status`

`daily_answers`

- [ ] `session_id`
- [ ] `user_id`
- [ ] `content`
- [ ] `submitted_at`

## Flow

```text
Open Daily
→ Read prompt
→ Submit answer
→ Wait for partner
→ Partner submit
→ Reveal
→ React / Reply
→ Count toward streak
```

Checklist:

- [ ] Mỗi couple có tối đa 1 daily session / ngày.
- [ ] Không lặp prompt quá gần.
- [ ] Sau submit không hiển thị partner answer nếu partner chưa submit.
- [ ] Cả hai submit → reveal.
- [ ] Có reaction.
- [ ] Có reply ngắn.
- [ ] Có activity history.
- [ ] Có trạng thái pending / completed.

---

# 14. Couple Streak

`streaks`

- [ ] `couple_id`
- [ ] `current_streak`
- [ ] `longest_streak`
- [ ] `last_completed_date`
- [ ] `repair_tokens`
- [ ] `updated_at`

`streak_events`

- [ ] `couple_id`
- [ ] `date`
- [ ] `type`
- [ ] `metadata`

Types:

```text
completed
missed
repaired
protected
```

Checklist:

- [ ] Daily completion có thể giữ streak.
- [ ] Có repair token.
- [ ] Không reset vô lý khi timezone lệch.
- [ ] Sử dụng timezone couple.
- [ ] Có lịch streak.
- [ ] Có longest streak.
- [ ] Có protection khi hệ thống lỗi.
- [ ] Không tạo blame message cho partner.

---

# 15. Meaningful Interaction Rules

Có thể cân nhắc cho một ngày được xem là có kết nối nếu có:

- [ ] Daily completed.
- [ ] Shared note.
- [ ] Shared prayer.
- [ ] Couple activity.

Nhưng:

- [ ] Không cho spam nội dung rác để farm streak.
- [ ] Daily streak và general activity metric tách riêng nếu cần.
- [ ] Logic phải nằm server-side.

---

# 16. Notes

## Types

- [ ] Text note.
- [ ] Checklist note.

Có thể mở rộng sau:

- [ ] Photo.
- [ ] Voice.
- [ ] Drawing.

## Fields

`notes`

- [ ] `id`
- [ ] `couple_id`
- [ ] `author_id`
- [ ] `title`
- [ ] `content`
- [ ] `type`
- [ ] `visibility`
- [ ] `is_pinned`
- [ ] `created_at`
- [ ] `updated_at`

Visibility:

```text
private
partner
couple
```

Checklist:

- [ ] Create note.
- [ ] Edit note.
- [ ] Delete note.
- [ ] Pin note.
- [ ] Unpin note.
- [ ] Search note.
- [ ] Filter private/shared.
- [ ] Checklist note.
- [ ] Autosave hoặc warning unsaved changes.
- [ ] Không mất nội dung khi network lỗi.
- [ ] Confirm trước khi delete.

---

# 17. Prayer Boat

Prayer Boat là feature riêng, không gộp với Notes.

## Prayer Schema

`prayers`

- [ ] `id`
- [ ] `couple_id`
- [ ] `author_id`
- [ ] `content`
- [ ] `visibility`
- [ ] `status`
- [ ] `created_at`
- [ ] `released_at`
- [ ] `resurface_at`
- [ ] `metadata jsonb`

Visibility:

```text
private
partner
```

Status:

```text
draft
released
archived
```

---

# 18. Prayer Composer

UI:

- [ ] Textarea.
- [ ] Character counter.
- [ ] Visibility selector.
- [ ] Optional prayer category.
- [ ] Send / Release Boat button.
- [ ] Draft support nếu cần.
- [ ] Confirmation trước khi release nếu nội dung chưa lưu.

Ví dụ:

```text
"Cầu mong mình và cô ấy luôn hạnh phúc."
```

---

# 19. Boat Release Animation

Flow:

```text
Write Prayer
→ Press "Release Boat"
→ Boat appears near shore
→ Boat moves slowly across water
→ Prayer is saved as released
```

Yêu cầu:

- [ ] CSS / SVG / Canvas nhẹ.
- [ ] Không bắt buộc Three.js.
- [ ] Animation hoạt động trên mobile.
- [ ] Respect `prefers-reduced-motion`.
- [ ] Có trạng thái fallback nếu animation không chạy.
- [ ] Animation không block save.
- [ ] Sau animation chuyển sang Prayer River hoặc confirmation.

---

# 20. Prayer River

Màn hình hiển thị các chiếc thuyền đại diện prayer.

Checklist:

- [ ] Render danh sách prayer đã released.
- [ ] Thuyền clickable.
- [ ] Click mở nội dung prayer.
- [ ] Hiển thị ngày gửi.
- [ ] Hiển thị author nếu visibility cho phép.
- [ ] Filter:
  - [ ] Tất cả.
  - [ ] Của tôi.
  - [ ] Của partner.
- [ ] Không leak private prayer.
- [ ] River có thể hiển thị theo timeline.
- [ ] Có pagination / lazy load nếu nhiều prayer.
- [ ] Không load hàng ngàn prayer cùng lúc.

---

# 21. Prayer Resurfacing

Mục tiêu:

> Một prayer cũ có thể "trôi trở lại" sau một khoảng thời gian.

Checklist:

- [ ] `resurface_at`.
- [ ] Daily cron kiểm tra prayer đến hạn.
- [ ] Tạo memory/event khi resurfaced.
- [ ] Optional push notification.
- [ ] Không resurface private prayer cho partner.
- [ ] Có thể archive prayer.
- [ ] Có setting bật/tắt resurfacing.

---

# 22. Prayer Prompt Data

Không hard-code hàng trăm prayer prompts trong source UI.

Tạo:

```text
data/prayer-prompts.json
```

Ví dụ category:

- [ ] relationship
- [ ] gratitude
- [ ] future
- [ ] family
- [ ] personal
- [ ] health
- [ ] forgiveness

Checklist:

- [ ] Free write luôn tồn tại.
- [ ] Prompt chỉ là gợi ý.
- [ ] Có seed script.
- [ ] Có thể thêm prompt bằng JSON.

---

# 23. Memories

`memories`

- [ ] `id`
- [ ] `couple_id`
- [ ] `type`
- [ ] `source_id`
- [ ] `created_at`

`memory_items`

- [ ] `memory_id`
- [ ] `content`
- [ ] `metadata`

Nguồn memory có thể là:

- [ ] Daily.
- [ ] Prayer.
- [ ] Note.
- [ ] Activity.
- [ ] Photo.
- [ ] Special date.

Checklist:

- [ ] Timeline.
- [ ] Sort theo ngày.
- [ ] Filter theo type.
- [ ] "On this day".
- [ ] Count memories.
- [ ] Memory detail screen.

---

# 24. Mood / Presence

Mục tiêu: tạo cảm giác hiện diện mà không bắt chat.

Mood:

- [ ] happy
- [ ] tired
- [ ] sad
- [ ] stressed
- [ ] calm
- [ ] busy

Quick reaction:

- [ ] Hug.
- [ ] Love.
- [ ] Rest.
- [ ] Tell me more.

Checklist:

- [ ] Chọn mood 1 tap.
- [ ] Partner xem mood hiện tại.
- [ ] Có timestamp.
- [ ] Không suy diễn tâm lý.
- [ ] Không gamify mood.

---

# 25. Chán Mode

Input:

- [ ] Available time.
- [ ] Energy.
- [ ] Activity preference.

Time:

- [ ] 5 phút.
- [ ] 15 phút.
- [ ] 30 phút.
- [ ] 60 phút.

Energy:

- [ ] Low.
- [ ] Normal.
- [ ] High.

Preference:

- [ ] Chat.
- [ ] Play.
- [ ] Watch.
- [ ] Romantic.
- [ ] Random.

Output:

- [ ] Chọn activity phù hợp.
- [ ] Tránh lặp activity gần đây.
- [ ] Cho reroll.
- [ ] Lưu activity history.
- [ ] Cho like/dislike để recommender sau này dùng.

---

# 26. Activities Data

Tạo:

```text
data/activities.json
```

Fields gợi ý:

```text
id
title
description
category
duration
energy
relationship_stage
long_distance
tags
enabled
```

Checklist:

- [ ] Ít nhất 100 activities cho MVP.
- [ ] Có low-energy activities.
- [ ] Có long-distance activities.
- [ ] Có romantic activities.
- [ ] Có playful activities.
- [ ] Có future-planning activities.
- [ ] Có photo challenge.
- [ ] Có call-free activities.
- [ ] Không bắt video call.

---

# 27. Weekly Check-in

Có thể gọi Sunday Us.

Questions:

- [ ] Khoảnh khắc thích nhất tuần.
- [ ] Có gì làm buồn.
- [ ] Muốn nhận thêm điều gì.
- [ ] Muốn làm gì cùng nhau tuần sau.

Checklist:

- [ ] Optional.
- [ ] Không tính relationship score.
- [ ] Không tạo AI diagnosis.
- [ ] Không phán "mối quan hệ đang xấu".

---

# 28. PWA

Checklist:

- [ ] `manifest.webmanifest`.
- [ ] App name.
- [ ] Short name.
- [ ] App icon 192.
- [ ] App icon 512.
- [ ] Theme color.
- [ ] Background color.
- [ ] Display standalone.
- [ ] Start URL.
- [ ] Service worker.
- [ ] Offline fallback.
- [ ] Add-to-home-screen UX.
- [ ] Test Android Chrome.
- [ ] Test iOS Safari.

---

# 29. Push Notifications

Notifications phải dùng `CONTENT.notifications`.

Cases:

- [ ] Partner answered Daily.
- [ ] Partner sent Prayer.
- [ ] Streak reminder.
- [ ] Prayer resurfaced.
- [ ] Memory resurfaced.
- [ ] Special date reminder.

Không gửi:

- [ ] Spam reminder.
- [ ] Quá nhiều notification.
- [ ] Message mang tính đổ lỗi.
- [ ] Nội dung prayer private.

Checklist kỹ thuật:

- [ ] Generate VAPID keys.
- [ ] Save subscription.
- [ ] Unsubscribe.
- [ ] Clean invalid subscriptions.
- [ ] Push từ server.
- [ ] Handle permission denied.

---

# 30. Vercel Cron

Tạo endpoint:

```text
/api/cron/daily
```

Cron chạy daily maintenance.

Tasks:

- [ ] Check database.
- [ ] Create missing daily sessions.
- [ ] Update streak.
- [ ] Process streak protection.
- [ ] Process streak repair.
- [ ] Find prayer resurfacing.
- [ ] Generate reminders.
- [ ] Update system job status.

Cron endpoint:

- [ ] Check `Authorization`.
- [ ] Verify `CRON_SECRET`.
- [ ] Return 401 nếu invalid.
- [ ] Không expose service role key.
- [ ] Log success/error.
- [ ] Idempotent.
- [ ] Không tạo duplicate daily session nếu chạy lại.

---

# 31. Supabase Keepalive Strategy

Mục tiêu: giảm khả năng Free project bị pause do inactivity.

Không làm:

- [ ] Không spam request mỗi 5 phút.
- [ ] Không tạo fake traffic vô nghĩa.

Làm:

- [ ] Daily external cron từ Vercel.
- [ ] Cron thực hiện database work thật.
- [ ] Query system health.
- [ ] Process daily jobs.
- [ ] Update `system_jobs`.
- [ ] User activity hằng ngày cũng tạo DB activity tự nhiên.

---

# 32. System Jobs

`system_jobs`

Fields:

- [ ] `id`
- [ ] `name`
- [ ] `last_started_at`
- [ ] `last_completed_at`
- [ ] `status`
- [ ] `duration_ms`
- [ ] `error`

Job names:

- [ ] daily_maintenance
- [ ] streak_update
- [ ] prayer_resurface
- [ ] push_reminders

---

# 33. Admin Page

Route:

```text
/admin
```

Chỉ admin được vào.

Hiển thị:

- [ ] DB status.
- [ ] Cron last run.
- [ ] Cron last error.
- [ ] Number of users.
- [ ] Number of couples.
- [ ] Daily prompt count.
- [ ] Activity count.
- [ ] Prayer count.
- [ ] Memory count.
- [ ] Push subscription count.

Có thể thêm sau:

- [ ] Feature flag editor.
- [ ] Prompt editor.
- [ ] Activity editor.

---

# 34. Seed Data

Tạo:

```text
data/
├── daily-prompts.json
├── prayer-prompts.json
└── activities.json
```

Script:

```bash
npm run seed
```

Checklist:

- [ ] Seed idempotent.
- [ ] Không duplicate dữ liệu.
- [ ] Có category.
- [ ] Có enabled flag.
- [ ] Có validation schema.

---

# 35. Validation

Dùng Zod hoặc tương đương.

Schemas:

- [ ] Auth input.
- [ ] Couple invite.
- [ ] Daily answer.
- [ ] Note.
- [ ] Prayer.
- [ ] Mood.
- [ ] Activity.
- [ ] Push subscription.
- [ ] App config.
- [ ] Content config.

---

# 36. Error Handling

Không hiển thị raw error kiểu:

```text
PostgrestError: new row violates row-level security policy...
```

Checklist:

- [ ] User-friendly errors lấy từ content config.
- [ ] Server log giữ chi tiết kỹ thuật.
- [ ] Retry cho network error hợp lý.
- [ ] Form không mất dữ liệu khi save fail.
- [ ] Error Boundary.
- [ ] 404 page.
- [ ] 500 fallback.

---

# 37. Loading / Empty States

Mọi screen cần:

- [ ] Loading.
- [ ] Empty.
- [ ] Error.
- [ ] Success.

Screens:

- [ ] Daily.
- [ ] Notes.
- [ ] Prayer River.
- [ ] Memories.
- [ ] Activities.
- [ ] Admin.

---

# 38. Realtime

Dùng Supabase Realtime cho:

- [ ] Daily partner answer status.
- [ ] Note shared update nếu cần.
- [ ] Mood presence.
- [ ] Prayer received.

Không dùng Realtime cho mọi thứ vô tội vạ.

- [ ] Chỉ subscribe khi screen cần.
- [ ] Cleanup subscription khi unmount.

---

# 39. Performance

- [ ] Lazy load Prayer River.
- [ ] Lazy load Memories.
- [ ] Optimize images.
- [ ] Không bundle animation library khổng lồ.
- [ ] Không render hàng trăm boat cùng lúc.
- [ ] Pagination.
- [ ] Server Component nếu phù hợp.
- [ ] Client Component chỉ khi cần interaction.
- [ ] Lighthouse test mobile.

---

# 40. Accessibility

- [ ] Button đủ lớn trên mobile.
- [ ] Focus state.
- [ ] Keyboard support.
- [ ] Semantic labels.
- [ ] Contrast đủ.
- [ ] `aria-live` cho dynamic message.
- [ ] Reduced motion.
- [ ] Không bắt drag làm thao tác duy nhất.

---

# 41. Privacy

- [ ] Privacy policy.
- [ ] Delete account.
- [ ] Export data.
- [ ] Delete private notes.
- [ ] Delete prayers.
- [ ] Revoke partner access sau khi leave couple.
- [ ] Không dùng dữ liệu private để train AI.
- [ ] Không analytics nội dung note/prayer.
- [ ] Nếu dùng analytics chỉ lưu event metadata cần thiết.

---

# 42. Security

- [ ] RLS test.
- [ ] Auth test.
- [ ] Cron secret.
- [ ] Rate limit invite code.
- [ ] Rate limit public auth endpoints nếu cần.
- [ ] Sanitize user input khi render.
- [ ] Không dùng `dangerouslySetInnerHTML` cho note raw.
- [ ] Validate file upload.
- [ ] File size limit.
- [ ] MIME whitelist.
- [ ] Service role chỉ server-side.

---

# 43. Special Dates

Support:

- [ ] Relationship start date.
- [ ] Birthday.
- [ ] Next meetup.
- [ ] Custom anniversary.

Checklist:

- [ ] Countdown.
- [ ] Optional notification.
- [ ] Add/edit/delete.
- [ ] Không spam notification.

---

# 44. Bottom Navigation

Gợi ý:

```text
Home
Memories
+
Notes
Us
```

`+` menu:

- [ ] Moment.
- [ ] Note.
- [ ] Prayer.
- [ ] Appreciation.

---

# 45. UI Principles

- [ ] Mobile-first.
- [ ] Một task chính mỗi screen.
- [ ] Không dashboard corporate.
- [ ] Không quá nhiều lựa chọn mỗi lần.
- [ ] Daily hoàn thành trong 30 giây–5 phút.
- [ ] Async-first.
- [ ] Không bắt hai người online cùng lúc.
- [ ] Không ép video call.
- [ ] Không relationship score.
- [ ] Không AI phán đoán mối quan hệ.
- [ ] Không blame partner vì streak.

---

# 46. Content Principles

Daily / activity / prompt nên ưu tiên:

- [ ] Shared novelty.
- [ ] Appreciation.
- [ ] Responsiveness.
- [ ] Curiosity.
- [ ] Positive event sharing.
- [ ] Future planning.
- [ ] Emotional check-in.
- [ ] Playfulness.
- [ ] Autonomy.

Tránh:

- [ ] Câu hỏi thao túng.
- [ ] Câu hỏi gây ghen.
- [ ] Chẩn đoán tâm lý.
- [ ] Chấm điểm tình yêu.
- [ ] "Ai yêu nhiều hơn?"
- [ ] Streak shaming.

---

# 47. Testing — Unit

- [ ] Streak calculation.
- [ ] Repair token.
- [ ] Daily session creation.
- [ ] Invite code validation.
- [ ] Prayer visibility.
- [ ] Note visibility.
- [ ] Content config interpolation.
- [ ] Activity filtering.
- [ ] Cron idempotency.

---

# 48. Testing — Integration

- [ ] User A signup.
- [ ] User B signup.
- [ ] Pair couple.
- [ ] User A answer Daily.
- [ ] User B chưa trả lời → answer hidden.
- [ ] User B answer.
- [ ] Reveal hoạt động.
- [ ] Streak update.
- [ ] Shared note visible.
- [ ] Private note invisible với partner.
- [ ] Shared prayer visible.
- [ ] Private prayer invisible.
- [ ] Prayer River render đúng.
- [ ] Cron chạy không duplicate data.

---

# 49. Testing — Mobile

Test ít nhất:

- [ ] 320px width.
- [ ] 375px width.
- [ ] Android Chrome.
- [ ] Desktop Chrome.
- [ ] iOS Safari nếu có thể.

Checklist:

- [ ] Không horizontal scroll.
- [ ] Bottom nav không che content.
- [ ] Textarea dùng ổn.
- [ ] Boat animation không lag.
- [ ] PWA icon đúng.
- [ ] Push hoạt động.

---

# 50. Phase Plan

## P0 — Foundation

- [ ] Init Next.js.
- [ ] TypeScript.
- [ ] Tailwind.
- [ ] ESLint.
- [ ] Supabase client/server helpers.
- [ ] `content.vi.ts`.
- [ ] `app.config.ts`.
- [ ] Feature flags.
- [ ] Base UI components.
- [ ] Vercel deploy test.

## P1 — Auth + Couple

- [ ] Signup.
- [ ] Login.
- [ ] Profile.
- [ ] Create couple.
- [ ] Invite code.
- [ ] Join couple.
- [ ] Couple context.
- [ ] RLS.

## P2 — Daily + Streak

- [ ] Daily prompts.
- [ ] Daily session.
- [ ] Answers.
- [ ] Reveal.
- [ ] Reactions.
- [ ] Streak.
- [ ] Repair tokens.
- [ ] History.

## P3 — Notes

- [ ] Notes CRUD.
- [ ] Private/shared.
- [ ] Pin.
- [ ] Checklist.
- [ ] Search/filter.

## P4 — Prayer Boat

- [ ] Prayer composer.
- [ ] Visibility.
- [ ] Save/release.
- [ ] Boat animation.
- [ ] Prayer River.
- [ ] Prayer detail.
- [ ] Resurfacing.
- [ ] Prayer notifications.

## P5 — Memories

- [ ] Memory aggregator.
- [ ] Timeline.
- [ ] Filters.
- [ ] On this day.

## P6 — Presence

- [ ] Mood.
- [ ] Hug.
- [ ] Love.
- [ ] Quick response.

## P7 — Chán Mode

- [ ] Activity dataset.
- [ ] Duration filter.
- [ ] Energy filter.
- [ ] Category filter.
- [ ] Randomizer.
- [ ] History.
- [ ] Like/dislike.

## P8 — PWA + Push

- [ ] Manifest.
- [ ] Service worker.
- [ ] Add to Home Screen.
- [ ] Push subscription.
- [ ] Push events.

## P9 — Cron + Keepalive

- [ ] `/api/cron/daily`.
- [ ] `CRON_SECRET`.
- [ ] Daily maintenance.
- [ ] Prayer resurfacing.
- [ ] Streak processing.
- [ ] System jobs.
- [ ] Vercel Cron config.

## P10 — Admin + Monitoring

- [ ] Admin auth.
- [ ] DB status.
- [ ] Cron status.
- [ ] Statistics.
- [ ] Error visibility.

## P11 — Polish

- [ ] Accessibility.
- [ ] Performance.
- [ ] Empty states.
- [ ] Animations.
- [ ] Copy review.
- [ ] Mobile test.
- [ ] Security review.

---

# 51. MVP Launch Checklist

Trước khi public:

- [ ] Production Supabase project.
- [ ] Production Vercel env.
- [ ] Auth redirect đúng.
- [ ] Cron chạy.
- [ ] PWA install được.
- [ ] Push notification hoạt động.
- [ ] Couple pairing hoạt động.
- [ ] RLS test thành công.
- [ ] Private note không leak.
- [ ] Private prayer không leak.
- [ ] Daily reveal không leak.
- [ ] Streak timezone đúng.
- [ ] Prayer resurfacing đúng.
- [ ] Không hard-coded text.
- [ ] Không secret trong repo.
- [ ] Database migration chạy từ đầu được.
- [ ] Seed chạy được.
- [ ] README hướng dẫn setup.
- [ ] `.env.example`.
- [ ] Build clean.
- [ ] Typecheck clean.
- [ ] Mobile layout ổn.

---

# 52. Future Expansion

Không làm trước khi MVP ổn.

- [ ] Voice notes.
- [ ] Shared photo album.
- [ ] Drawing board.
- [ ] Couple calendar.
- [ ] Shared bucket list.
- [ ] Mini games.
- [ ] Watch-together shortcuts.
- [ ] Couple widgets.
- [ ] AI-generated activity variations.
- [ ] AI memory summary.
- [ ] Multi-language.
- [ ] Theme customization.
- [ ] Export couple memories thành PDF / album.
- [ ] Encryption cho private journal nếu cần.

---

# 53. AI Coding Rules

Nếu dùng AI/code agent để làm project:

- [ ] Mỗi lần chỉ giao một phase.
- [ ] Yêu cầu AI đọc file này trước khi code.
- [ ] Yêu cầu AI không tự thay đổi architecture.
- [ ] Yêu cầu AI không thêm dependency nếu chưa cần.
- [ ] Yêu cầu AI không hard-code text.
- [ ] Yêu cầu AI không sửa migration cũ sau khi production.
- [ ] Yêu cầu AI tạo migration mới.
- [ ] Yêu cầu AI chạy lint/typecheck/test trước khi kết thúc.
- [ ] Yêu cầu AI liệt kê file đã thay đổi.
- [ ] Yêu cầu AI không xóa feature khác để sửa lỗi.
- [ ] Yêu cầu AI giải thích bất kỳ thay đổi security/RLS nào.
- [ ] Yêu cầu AI không tự thêm AI feature vào core.
- [ ] Review diff thủ công trước khi merge.

---

# 54. Final Architecture

```text
                   ┌───────────────┐
                   │   Next.js PWA │
                   └───────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
       ┌──────▼───────┐         ┌──────▼────────┐
       │ Feature      │         │ Config        │
       │ Modules      │         │ content.vi.ts │
       │              │         │ app.config.ts │
       └──────┬───────┘         └───────────────┘
              │
     ┌────────┼─────────┬────────────┐
     │        │         │            │
     ▼        ▼         ▼            ▼
   Daily    Notes   Prayer Boat   Chán Mode
     │        │         │            │
     └────────┴────┬────┴────────────┘
                   ▼
                Memories
                   │
                   ▼
             ┌────────────┐
             │  Supabase  │
             │ Auth       │
             │ PostgreSQL │
             │ Storage    │
             │ Realtime   │
             └─────┬──────┘
                   ▲
                   │
             Daily Maintenance
                   │
             ┌─────┴──────┐
             │ Vercel Cron│
             └────────────┘
```

---

# 55. Core Product Loop

```text
Push / Open PWA
      ↓
Daily Ritual / Note / Prayer / Activity
      ↓
Partner responds
      ↓
Reveal / React / Connect
      ↓
Streak grows
      ↓
Memory is created
      ↓
Come back tomorrow
```

Mục tiêu cuối cùng không phải giữ người dùng bằng một con số streak.

Mục tiêu là:

> Mỗi ngày tạo một lý do nhỏ để hai người chia sẻ, phản hồi nhau và tích lũy trải nghiệm chung.
