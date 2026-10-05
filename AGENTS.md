# Hướng dẫn làm việc trong Doita

Trước mọi thay đổi code, đọc **[RULES_UX.md](RULES_UX.md)** và các file liên quan. UI/UX là ưu tiên số 1: thao tác phải dễ hiểu, phản hồi đúng trạng thái và bảo toàn nội dung/quyền riêng tư.

Khi sửa UI hoặc assets, đọc [docs/THEMES.md](docs/THEMES.md) và [docs/REDESIGN_LOG.md](docs/REDESIGN_LOG.md). Theme mặc định đi qua `src/config/themes.ts`; không hard-code đường dẫn theme trong feature hoặc ghi đè ảnh thiết kế gốc.

Trước khi kết thúc, đối chiếu 26 tiêu chí trong RULES_UX.md, chạy kiểm tra phù hợp, báo rõ phần đã/chưa kiểm chứng. Không coi build qua là đã kiểm tra UX. Không đổi hành vi đã được anh yêu cầu: không khôi phục `/admin`, `/privacy`, export dữ liệu hoặc hiện lựa chọn múi giờ đã khóa.

Giữ thay đổi tập trung; không thêm dependency hoặc tái thiết kế toàn bộ khi chưa cần. Không đọc/in khóa bí mật ra output. Không commit/push/deploy nếu anh chưa yêu cầu. Giao tiếp bằng tiếng Việt, xưng em và gọi người dùng là anh.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
