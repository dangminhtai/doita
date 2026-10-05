# Hướng dẫn làm việc trong Doita

Trước mọi thay đổi code, đọc **[RULES_UX.md](RULES_UX.md)** và các file liên quan. UI/UX là ưu tiên số 1: thao tác phải dễ hiểu, phản hồi đúng trạng thái và bảo toàn nội dung/quyền riêng tư.

Khi sửa UI hoặc assets, đọc [docs/THEMES.md](docs/THEMES.md) và [docs/REDESIGN_LOG.md](docs/REDESIGN_LOG.md). Theme mặc định đi qua `src/config/themes.ts`; không hard-code đường dẫn theme trong feature hoặc ghi đè ảnh thiết kế gốc.

Trước khi kết thúc, đối chiếu 26 tiêu chí trong RULES_UX.md, chạy kiểm tra phù hợp, báo rõ phần đã/chưa kiểm chứng. Không coi build qua là đã kiểm tra UX. Không đổi hành vi đã được anh yêu cầu: không khôi phục `/admin`, `/privacy`, export dữ liệu hoặc hiện lựa chọn múi giờ đã khóa.

Giữ thay đổi tập trung; không thêm dependency hoặc tái thiết kế toàn bộ khi chưa cần. Không đọc/in khóa bí mật ra output. Không commit/push/deploy nếu anh chưa yêu cầu. Giao tiếp bằng tiếng Việt, xưng em và gọi người dùng là anh.
