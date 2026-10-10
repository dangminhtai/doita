# Kế hoạch hiện diện Doita — V1 dùng Supabase

Ngày: 06/10/2026. Cập nhật theo góp ý anh chọn. Đây là kế hoạch, chưa triển khai code hoặc migration.

## 1. Mục tiêu và kiến trúc

Thay hai dòng “Đã kết nối” dưới tên trên Home bằng online thật hoặc thời gian hoạt động gần nhất. Giữ avatar, tên và nút daily; không thêm thẻ mới, toast ra/vào hoặc lịch sử theo dõi.

Hiện HomeScreen trong src/features/daily/screen.tsx lấy dòng này từ daily/answers. Daily hoàn thành không phải bằng chứng online. Trạng thái câu trả lời giữ ở nút daily; hiện diện độc lập với daily, mood và streak.

**V1: Supabase Realtime Presence + Postgres member_activity.last_seen_at.** Bỏ Redis, Bitmap, heartbeat online 30 giây, TTL 90 giây, sorted set, tombstone và Lua. Chỉ xem xét kiến trúc khác khi tải thực tế cho thấy cần.

```text
Ứng dụng đã đăng nhập, có không gian
  └─ PresenceProvider — xuyên các tab chức năng
       ├─ Supabase Presence riêng → online / offline / unknown
       └─ RPC hoạt động → member_activity.last_seen_at

Home → MemberPresence → chấm xanh và một dòng trạng thái
```

## 2. Ý nghĩa online

Domain model: `PresenceState = "online" | "offline" | "unknown"`.

- Online: channel đã đồng bộ, có ít nhất một phiên hiện diện đang hiển thị web của thành viên.
- Offline: channel hoạt động và đã đồng bộ, không có phiên của thành viên đó.
- Unknown: đang kết nối, reconnect, mất mạng, lỗi channel hoặc hết phiên auth. Không đồng nhất với offline.
- Sau SUBSCRIBED, chỉ track khi tab hiển thị. Ẩn tab/ứng dụng vào nền thì untrack theo khả năng trình duyệt; hiện lại thì đồng bộ và track. Không track trên mousemove hoặc theo heartbeat tự xây.
- Mỗi kết nối có presence key riêng; gộp các phiên theo thành viên. Đóng tab A không làm offline nếu tab B còn hiển thị.
- Tính trạng thái từ presenceState sau sync; không cộng/trừ số người thủ công qua join/leave. Sự kiện đó có thể xuất hiện khi đồng bộ lại dù không có người thực sự vào/rời. [Supabase Presence](https://supabase.com/docs/guides/realtime/presence).
- Kill app/mất mạng đột ngột: thời gian phát hiện phụ thuộc SDK và mạng, không hứa offline tức thì hoặc mốc 90 giây của Redis cũ.
- Client quan sát mất kết nối thì bỏ chấm xanh, chuyển unknown. Khi resume phải đồng bộ lại trước khi tô xanh; không lấy snapshot cache làm bằng chứng.

Online chỉ là tín hiệu ứng dụng đang mở, không chứng minh người dùng đang nhìn màn hình. Payload Presence client không dùng để cấp quyền hoặc xác nhận thời gian server.

## 3. Last-seen và schema thực tế

Last-seen là giờ server ghi nhận hoạt động gần nhất, không phải thời điểm thoát chính xác.

Repository hiện chưa có membership_id riêng: couple_members dùng khóa (couple_id, user_id). V1 giữ khóa này trong member_activity, foreign key tới membership với ON DELETE CASCADE, cùng last_seen_at timestamptz. Chưa cần updated_at trùng ý nghĩa.

Xóa membership thì xóa mốc; vào không gian khác hoặc tạo membership lại bắt đầu dữ liệu mới. Không mang activity toàn tài khoản từ profile sang quan hệ mới.

RPC dự kiến touch_member_activity() lấy auth.uid(), kiểm tra membership hiện tại và dùng giờ database; không nhận user ID hoặc timestamp do client khai báo. Upsert có điều kiện nguyên tử để tối đa một lần ghi mỗi khoảng 5 phút cho một membership, kể cả nhiều tab. Không cho client INSERT/UPDATE trực tiếp bảng.

Gọi khi vào app, tab hiện trở lại, sau hoạt động có ý nghĩa như lưu/gửi thành công và mỗi khoảng 5 phút khi tab hiển thị. Throttle chung gộp các trigger; database vẫn chặn ghi lặp cuối cùng. Không gọi từng phím nhập hoặc lưu action receipt cho mỗi lần touch.

Mốc cuối có thể cũ khoảng 5 phút khi rời đột ngột. “Online 5 phút trước” là thời gian từ lần ghi nhận, không cam kết chính xác phút rời. Không tự ghi last-seen của người kia bằng giờ client khi nhận leave. Chưa thêm forced-write lúc đóng tab hoặc API trung gian riêng.

## 4. Quyền riêng tư

- Kênh Presence private theo không gian, dùng Supabase client hiện có; không tạo thêm client/socket cho từng component.
- RLS trên realtime.messages cho SELECT/INSERT của Presence chỉ cho membership hiện tại tham gia. Tên topic có UUID không thay thế kiểm tra quyền. [Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization).
- Activity chỉ cho bản thân/người cùng không gian hiện tại đọc; ghi qua RPC kiểm tra auth.
- Payload tối thiểu nhận diện thành viên, chỉ gộp ID trong roster hiện tại. ID do client khai báo không phải bằng chứng quyền hoặc timestamp đáng tin cậy.
- Logout/đổi tài khoản/rời không gian: remove channel, dọn timer, xóa state và bỏ response scope cũ.
- Kiểm tra thu hồi quyền cả channel đang sống: policy lúc join không đủ để hứa thu hồi ngay. Khi roster thay đổi cần chuyển sang topic phiên bản mới theo roster và dừng publish topic cũ; xác nhận cách thực hiện với SDK khi triển khai.
- Kiểm tra tác động lên các kênh đang có trước khi thay cấu hình public access toàn dự án. Kênh Presence mới phải private.
- Không đưa presence/last-seen lên /p/[publicId], DTO công khai hoặc avatar route; không gửi email, nội dung đang đọc hay hoạt động của không gian khác.

## 5. UI/UX

Chấm xanh 8–10 px ở góc avatar, viền theo nền, màu THEME.colors.success. Không cần asset hoặc icon mới, không nhấp nháy. Dưới tên chỉ một dòng:

| Trạng thái | Nội dung |
| --- | --- |
| Online | Đang online |
| Offline, dưới 1 phút | Vừa online |
| Offline, dưới 1 giờ | Online 12 phút trước |
| Offline, dưới 24 giờ | Online 4 giờ trước |
| Offline, dưới 7 ngày | Online 3 ngày trước |
| Offline, từ 7 ngày | Hơn 1 tuần chưa online |
| Offline, chưa có timestamp | Chưa có hoạt động |
| Unknown | Chưa rõ trạng thái |

Không ghi “Hoạt động gần đây” cho mốc quá 7 ngày vì sai nghĩa. Không hiện giờ tuyệt đối hoặc lịch sử từng lần vào/rời. Nếu unknown nhưng có timestamp server, có thể dùng một dòng “Ghi nhận 12 phút trước” thay cho “Chưa rõ trạng thái”; không tô xanh hoặc kết luận offline.

Định dạng theo giờ server tham chiếu, cập nhật chữ mỗi phút tại client; không query chỉ để đổi số phút. Resume lấy lại dữ liệu/độ lệch giờ. Không aria-live cho bộ đếm; có chữ cạnh chấm để không phụ thuộc màu.

Desktop giữ hai nhóm thành viên và CTA; mobile cho xuống hàng, tên dài không ép nút ra ngoài. Lỗi hiện diện không hiện dialog, khóa form hoặc ảnh hưởng lưu thư/draft.

## 6. Tổ chức code và đồng bộ

Đặt logic trong src/features/presence/: provider/hook, MemberPresence, formatter và types. Có thể gộp hook/types vào provider nếu file còn ngắn, không tạo nhiều lớp chỉ để đủ sơ đồ.

Provider nằm dưới AppProvider trong vùng đã xác thực/có không gian của src/components/couple-app.tsx, không nằm riêng Home. Người đang đọc Notes/Prayer vẫn online. Home truyền user ID của membership hiện tại và dùng scope không gian từ provider; không tham chiếu member.id khi schema chưa có trường đó.

Đọc activity khi vào scope, quay lại tab và thành viên chuyển offline; gộp request, không polling 30 giây. Có thể nghe Postgres Changes của bảng activity đã throttle để cập nhật mốc; đọc subscription hiện có trước khi tích hợp, tránh refresh toàn app chỉ cho last-seen.

Không gửi touch qua run() gây toast/loading toàn app. Lỗi touch giữ mốc cũ, retry nhẹ ở trigger tiếp theo. Lỗi đọc last-seen không xóa tín hiệu online hợp lệ; lỗi Presence không biến timestamp cũ thành online.

## 7. Triển khai và tải

Không thêm Redis, API /api/presence hoặc dependency. Bắt đầu bằng SDK hiện có và RPC; chỉ thêm API activity nếu cần thực tế.

Free hiện giới hạn 200 kết nối Realtime đồng thời; 1.000 tài khoản đăng ký không phải 1.000 kết nối cùng lúc. Nhiều tab/thiết bị tăng kết nối. Theo dõi Dashboard, không khẳng định Free đủ mọi tải. [Supabase Limits](https://supabase.com/docs/guides/realtime/limits).

Sau khi anh duyệt triển khai:

1. Migration mới cho activity/RLS/RPC và quyền Presence; kiểm tra các kênh đang có, không ghi đè migration đã chạy.
2. Provider quản lý channel, scope, visibility và ba trạng thái; giữ logic daily.
3. MemberPresence/formatter; thay dòng dưới tên ở Home bằng token có sẵn.
4. ESLint/typecheck; anh kiểm tra web. Quyền database, reconnect, nhiều tab và mobile cần kiểm chứng thực tế riêng.

## 8. Tiêu chí nghiệm thu

- Notes/Prayer vẫn online; daily hoàn thành không quyết định chấm xanh.
- Đóng một tab không offline khi tab khác còn hiển thị; tab nền không track.
- WebSocket lỗi/đang sync là unknown; không giữ xanh từ cache.
- Kill app được phát hiện theo độ trễ SDK thực tế, không bịa giờ thoát.
- Timestamp server, ghi đã throttle và không sửa được mốc của người kia.
- Rời không gian không mang mốc sang membership mới; kiểm tra thu hồi channel đang sống.
- Không public presence hoặc toast ra/vào; mobile giữ tên/trạng thái/CTA rõ.

Lượt này chỉ sửa kế hoạch. Chưa sửa code, chạy migration hoặc kiểm tra live Presence.
