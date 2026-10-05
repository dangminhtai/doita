# Kế hoạch thiết kế Doita — lời nhắn dẫn trải nghiệm

Ngày: 05/10/2026. Phạm vi: kế hoạch toàn bộ giao diện, chưa triển khai.

## 1. Điều đã chốt và phần còn mở

Anh chọn **đọc và viết lời nhắn cho người ấy** là việc ưu tiên khi mở web. Anh cho phép em đề xuất bản sắc từ chức năng hiện có. Giữ trắng/hồng, chữ rõ, theme assets mặc định có thể thay sau này. Không đổi tên “Gần nhau” trong code khi chưa có quyết định riêng.

Tài liệu này là brief đề xuất theo `impeccable shape`, không phải DESIGN.md hay hợp đồng triển khai đã duyệt. Chưa chốt hướng thị giác cuối cùng và cách duyệt bằng mockup ảnh hay bản thử bằng code. Không tự lưu lựa chọn quy trình từ việc chưa trả lời.

Sự thật sản phẩm được ghi trong [PRODUCT.md](../PRODUCT.md). Các giới hạn UX tiếp tục theo [RULES_UX.md](../RULES_UX.md), assets theo [THEMES.md](THEMES.md).

## 2. Vấn đề cần giải quyết

Ảnh kiểm tra Home hiện có đặt banner tên hai người và minh họa lớn trước câu hỏi hằng ngày; lời nhắn nằm tiếp theo trong một lưới thẻ gần ngang độ nổi bật. Điều đó chưa khớp ưu tiên anh vừa chọn. Các trang cần mang cùng bản sắc nhưng có bố cục riêng theo công việc.

Ảnh `doita-test/redesign-evidence/after-home-1440.png` và `after-notes-filled-390.png` là bằng chứng của lần chụp trước. Sau khi đọc ảnh, working tree đã có chỉnh sửa bỏ một số nhãn phụ và dải trang trí trong bốn file UI; chưa có ảnh mới xác nhận các sửa đổi đó. Kế hoạch không yêu cầu khôi phục các phần vừa bỏ và không coi ảnh cũ là trạng thái live.

Không giải quyết bằng đổi màu hàng loạt hoặc dán thêm sticker. Cần đổi thứ tự ưu tiên, giảm số khu vực cùng tranh chú ý và làm trạng thái dễ hiểu.

## 3. Bản sắc và các hướng cần lựa chọn

Cơ chế riêng của sản phẩm: hai người để lại nội dung cho nhau; có phần chung, phần riêng và phần chỉ mở khi cả hai đã trả lời. Người dùng thường ghé web trong một khoảng thời gian ngắn trên điện thoại. Thiết kế phải giúp tìm thấy lời nhắn và bắt đầu viết ngay.

Bảy chất liệu đề xuất dưới đây thuộc các nhóm thư từ, nhiếp ảnh, nhịp thời gian và ký hiệu. Đây là chất liệu thiết kế, không phải bảy giao diện cần xây hoặc những thói quen được gán cho người dùng.

| Hướng | Biểu hiện trong sản phẩm | Rủi ro cần tránh |
| --- | --- | --- |
| 1. Lời để dành | Chữ của người gửi dẫn trang; mở lời nhắn là điểm nhấn | Phong bì và scrapbook quá quen thuộc nếu trang nào cũng dùng |
| 2. Khung ảnh đôi | Nhịp ảnh và khoảng trống; album là nơi ảnh được nổi bật | Ảnh trang trí chiếm chỗ của việc viết |
| 3. Hẹn một khoảng nhỏ | Ngày, lời nhắn và việc sắp làm có thứ bậc rõ | Biến web thành lịch và tạo áp lực duy trì |
| 4. Nhịp hai người | Bố cục phân biệt hai tác giả qua tên và dấu nhận diện | Dùng màu giới tính hoặc ám chỉ online/đã đọc |
| 5. Dải ngày chung | Ngày tháng dẫn phần lịch sử, nội dung mở tại chỗ | Kéo mọi trang thành timeline, khó tìm và lọc |
| 6. Hai nét | Hai dấu nét cong ngắn đi cùng tên người gửi; lời nhắn mở ra giữa hai dấu | Dấu nét thành trang trí vô nghĩa hoặc bị hiểu là trạng thái |
| 7. Chương của hai người | Nhịp tiêu đề và phần đọc riêng; chuyển trang tiết chế | Giả lập sách giấy, chữ serif hoặc thao tác lật trang khó dùng |

Đã chạy công cụ `concept-seed` của Impeccable ở mode Operate; công cụ đưa hướng 6 ra để phát triển. Không có lựa chọn nào của anh bị thay thế bởi kết quả công cụ. **Đề xuất dẫn: Hai nét.** Hướng 1 là phương án đối chiếu sát việc đọc/viết hơn nhưng dễ quen thuộc hơn. Hướng đang dùng cũng là một lựa chọn hợp lệ nếu anh muốn giữ bố cục quen thuộc và chỉ thay ưu tiên.

Catalog công cụ đưa ra các chất liệu phòng tối ảnh, sách hướng dẫn acetate, web Nhật dày đặc, ví vé máy bay, biển chỉ đường sân bay và bản đồ sao. Chưa chốt một hướng catalog hoặc sử dụng bảng tham chiếu của chúng. Mật độ cao, màu vàng/navy và điều hướng mô phỏng vật thể không được phép tự đè lên yêu cầu trắng/hồng và thao tác quen thuộc. Vòng chọn hướng chính thức cần so sánh mức nhận diện cặp đôi và độ rõ công việc; không chọn chỉ vì lạ.

### Đề xuất “Hai nét” có gì riêng?

- Hai nét cong nhỏ là dấu nhận diện bên cạnh **tên tác giả**, không phải một mạng lưới trang trí phủ trang. Vị trí và hình dạng phân biệt hai người; màu không gán theo giới tính.
- Nhìn đầu trang là biết ai gửi và có thể làm gì. Avatar AI chỉ là ảnh mặc định khi không có ảnh đại diện thật.
- Mở lời nhắn: dấu của người gửi mở sang mép vùng đọc; dấu còn lại xuất hiện cạnh vị trí phản hồi sẵn có, nếu luồng hiện tại hỗ trợ. Không thêm tính năng trả lời mới chỉ để phục vụ hiệu ứng.
- Daily: chỉ khi máy chủ cho phép xem cả hai câu trả lời, hai dấu mới nối trong một chuyển động ngắn. Chưa đủ điều kiện thì giữ trạng thái riêng biệt và nhãn rõ.
- Mỗi trang chỉ dùng một điểm nhấn chuyển động. Tên, nội dung và nút vẫn là HTML; biểu tượng dùng SVG/CSS phù hợp để giữ sắc nét.
- Màu hồng dành cho hành động chính, vùng chọn và điểm nhận diện. Chữ nội dung đủ đậm; các trạng thái lỗi/thành công có nhãn riêng. Nền trắng/hồng nhẹ tiếp tục là cam kết, không tự thay bằng chất liệu catalog.

## 4. Kiến trúc nội dung và bố cục

### Hôm nay — bắt đầu với lời nhắn

Đầu trang chỉ còn nhận diện hai người gọn, ngày hoặc số ngày bên nhau nếu dữ liệu có thật. Không bắt người dùng cuộn qua banner lớn để đọc lời nhắn.

Vùng chính gồm lời nhắn đủ quyền xem và nút viết. Khi trống: nói rõ chưa có lời nhắn, dùng một CTA viết. Khi có nội dung: tên tác giả, tiêu đề, ngày và nút mở đúng lời nhắn. Không tự gọi là “chưa đọc” nếu hệ thống chưa có trạng thái đã đọc đáng tin cậy. Không đưa ghi chú riêng của bản thân thành lời nhắn người ấy gửi.

Desktop: vùng lời nhắn là trọng tâm; một vùng phụ nhỏ chứa câu hỏi hôm nay. Mobile: lời nhắn trước, daily sau. Ảnh kỷ niệm gần đây là một đoạn xem trước thấp hơn, có đường dẫn album; các tính năng còn lại truy cập qua điều hướng, không mỗi tính năng một thẻ lớn trên Home. Nếu người dùng tắt một tính năng, khoảng trống không được giữ lại như ô trang trí.

### Lời nhắn — tìm, đọc, viết

Tiêu đề ngắn “Lời nhắn”, một nút viết rõ. Bộ lọc nằm ngay trên danh sách nó tác động; không lặp giải thích quyền truy cập ở nhiều vị trí. Danh sách ưu tiên tên, tiêu đề, đoạn đầu và ngày; giảm ảnh phong bì khi đã có nội dung thật.

Trình đọc có chiều rộng dễ đọc, nút đóng/quay lại, tác giả và quyền xem. Checklist hiện đúng thao tác của checklist. Quay lại giữ bộ lọc và vị trí. Composer luôn phân biệt tạo/sửa, riêng/chung, đang lưu/lưu thành công/lỗi. Bản nháp không bị mất khi đóng.

### Câu hỏi hôm nay — hai câu trả lời

Trang riêng dẫn bằng câu hỏi và vùng viết. Tác giả và điều kiện mở câu trả lời hiển thị bằng chữ. Sau khi gửi không tạo thêm một nút gửi trùng. Lịch sử và chuỗi ngày nằm thấp hơn hoặc trong phần mở rộng, tránh biến kết nối thành chỉ tiêu.

### Điều ước — nội dung và một khoảnh khắc thả

Một nút viết, một composer. Thuyền là cách xem bổ sung có nhãn và thay thế bằng danh sách truy cập được; không vẽ thêm một bộ thẻ trùng toàn bộ nội dung. Trạng thái trống không cần một cảnh sông lớn. Không tự thay chính sách lưu trữ, private/shared hoặc tái hiện điều ước cũ.

### Kỷ niệm — ảnh được dẫn trước

Lưới ảnh với ngày/tiêu đề gọn; khi ảnh chưa tải dành trước diện tích để không nhảy bố cục. Chi tiết ảnh mở đủ lớn, caption rõ và nút quay lại giữ vị trí. Không trộn ảnh AI mặc định với ảnh kỷ niệm thật theo cách khó phân biệt. Trạng thái không có ảnh vẫn có thể hiển thị kỷ niệm bằng chữ.

### Cùng làm — chọn một việc

Danh sách việc đang làm là nội dung chính. Gợi ý có đúng một điểm gọi; bộ lọc đủ rộng và không sinh thêm nút gợi ý trùng khi mở. Kết quả là một đề xuất cùng lý do từ tiêu chí hiện có, không hứa “AI hiểu hai bạn”. Không biến đổi đề xuất thành máy quay thưởng.

### Hai đứa, tài khoản và thông báo

Giữ nhóm thiết lập theo công việc, trường ngày có nhãn và định dạng dễ hiểu. Thông báo đi đúng nội dung; có trạng thái trống, đã xem và lỗi tải. Chuông và âm thanh tiếp tục theo quyền và cấu hình hiện có. Auth ưu tiên nhập liệu, phản hồi lỗi và reset mật khẩu đúng môi trường.

Điều hướng dùng link/nút quen thuộc. Duy trì đường tới Cùng làm trên mobile; quyết định chính xác vị trí thanh dưới/drawer phải kiểm tra các luồng hiện có trước khi đổi. Không tạo mê cung từ việc giấu tính năng khỏi Home.

## 5. Hiệu ứng: mỗi hiệu ứng phải có điều kiện

Các khoảng thời gian sau là mục tiêu thử nghiệm, chưa phải kết quả đo hoặc giá trị đã chốt.

| Tương tác | Hiệu ứng đề xuất | Điều kiện và phương án thay thế |
| --- | --- | --- |
| Mở lời nhắn | Mặt thư tách nhẹ, vùng chữ hiện trong khoảng 200–320 ms | Bắt đầu sau thao tác mở; loading/lỗi tải có UI riêng; không bắt chờ hoạt ảnh mới đọc được |
| Lưu lời nhắn | Dấu người gửi dịch nhẹ tới trạng thái đã lưu | Chỉ sau xác nhận lưu; lưu thành công nhưng refresh lỗi vẫn báo đúng, không yêu cầu gửi lại |
| Like | Tim phản hồi một nhịp nhỏ, khoảng 120–180 ms | Theo cơ chế cập nhật hiện có; thất bại khôi phục đúng trạng thái; không tăng số giả |
| Daily mở cả hai | Hai nét nối một lần, khoảng 240–360 ms | Chỉ sau dữ liệu đã được phép mở; hoạt ảnh không chứa hoặc suy đoán nội dung riêng |
| Thả điều ước | Một thuyền rời vùng nhập, khoảng 450–650 ms | Chỉ sau xác nhận ghi; thao tác khác không bị khóa để chờ cảnh; không phát lại khi refresh |
| Mở ảnh | Giữ liên tục từ thumbnail tới viewer | Không có thumbnail/ảnh tải lỗi thì mở trực tiếp; Back trả đúng vị trí, không bắt có View Transitions mới dùng được |
| Hoàn thành việc | Check hiện ngắn, chữ trạng thái cập nhật | Không gạch bỏ trước xác nhận nếu chưa có cơ chế rollback; lỗi có thao tác thử lại |
| Thông báo mới | Badge và một nhịp chuông nhỏ | Chỉ sự kiện mới đủ quyền; không phát âm thanh cho lịch sử khi tải lại; tắt âm/giảm motion được tôn trọng |

Giảm chuyển động: bỏ dịch chuyển, xoay, phóng lớn; giữ cập nhật trạng thái ngay. Không tim bay liên tục, nền chuyển động vô hạn, confetti toàn trang, cursor đặc biệt hoặc âm thanh khi mỗi lần nhấn nút. Focus và vùng thao tác không chạy theo animation.

## 6. Assets và theme

Tái sử dụng `sunset` qua `src/config/themes.ts`. Giữ PNG gốc. Bộ WebP hiện được tài liệu theme ghi tổng 243.892 byte; đó là dung lượng assets, không phải thời gian tải thực tế của cả web.

- Hero desktop/mobile: dùng tiết chế ở nơi cần bối cảnh, không mặc định làm banner lớn đầu Home.
- Envelope: trạng thái trống hoặc chi tiết mở thư; không lặp ảnh lớn trên mọi item.
- Avatar: fallback rõ nghĩa; không cố định người A/B vào vai nam/nữ.
- Heart: icon nhấn thích hoặc nhận diện; không dùng nhiều trái tim để lấp khoảng trắng.
- Mascot/flowers: chỉ một điểm phụ nếu không tranh nội dung, không bắt buộc sử dụng vì đã có file.
- Empty illustrations: chỉ xuất hiện khi thực sự trống, không giữ khi danh sách đã có dữ liệu.
- Hai nét: đề xuất SVG đơn giản phù hợp theme, không cần AI raster cho đường nét và icon thao tác.

Chưa cần tạo thêm bộ ảnh AI. Nếu vòng mockup chứng minh một khoảng thiếu hình ảnh, mới viết yêu cầu asset cụ thể: vai trò, kích thước, vùng crop, alpha và phiên bản mobile. Không nhúng chữ/nút trong ảnh. Theme sau thay hình và token; không hard-code đường dẫn trong feature, không thêm trình chọn theme ngoài phạm vi.

## 7. Trạng thái phải có trong thiết kế

| Nhóm | Trường hợp cần thấy | Tiêu chí |
| --- | --- | --- |
| Thành viên | Chưa ghép đôi, chỉ một người, hai người, tên dài | Không bịa tên hoặc trạng thái người ấy; không làm vỡ header |
| Nội dung | Trống, một item, chữ rất dài, ảnh dọc/ngang, nhiều trang | Không dùng placeholder như nội dung thật; tìm/lọc/phân trang vẫn rõ |
| Quyền | Riêng/chung, daily chưa mở/đã mở, rời không gian | Hiệu ứng và preview không vượt quyền máy chủ |
| Thao tác | Loading, đang lưu, thành công, lỗi, đã lưu nhưng refresh lỗi | Phản hồi phân biệt, tránh gửi trùng và mất bản nháp |
| Thiết bị | 320/390 px, desktop, bàn phím ảo, bàn phím vật lý | Không cuộn ngang; filter/label không bị bóp; thanh dưới không che CTA |
| Tiếp cận | Giảm motion, focus, âm thanh tắt, ảnh lỗi, offline | Luồng vẫn hoàn thành được; không chỉ báo trạng thái bằng màu |

Fixtures dùng cho mockup phải ghi rõ là dữ liệu minh họa. Không lấy nội dung riêng từ Supabase để làm ảnh demo.

## 8. Các giai đoạn và điều kiện chuyển bước

1. **Chốt brief và hướng:** chọn Hai nét, Lời để dành, hướng khác hoặc giữ hướng hiện có. Xác nhận cách duyệt bằng ảnh hay bản thử. Không sửa UI trong giai đoạn shape.
2. **Chứng minh bố cục:** dựng Home và Lời nhắn ở mobile/desktop, gồm trống và có nội dung. Khác biệt phải thấy ở thứ tự công việc và tỷ lệ vùng, không chỉ palette. Nếu dùng mockup ảnh, ảnh là tài liệu định hướng; chữ và dữ liệu thật vẫn triển khai bằng HTML.
3. **Một luồng hoàn chỉnh:** Home → mở lời nhắn → quay lại; viết → lưu → xem; thử lỗi và giảm motion. Đạt rồi mới nhân hệ thống sang trang khác.
4. **Mở rộng theo chức năng:** daily, kỷ niệm, điều ước, cùng làm, thiết lập/auth/thông báo. Giữ API/RPC, quyền và tính năng hiện có. Nếu một đề xuất đòi trạng thái mới như đã đọc, tách thành quyết định chức năng riêng.
5. **Kiểm tra có giới hạn:** một lượt kiểm tra batched desktop/mobile và các trạng thái quan trọng; sửa lỗi trong một đợt; tối đa một lượt xác nhận theo Impeccable. Đối chiếu 26 tiêu chí RULES_UX. Build/type/lint cần khi sửa code nhưng không thay kiểm tra UX.

Khi bước sang UI mới đọc `reference/craft-floor.md`; sau khi chọn hướng mới ghi DESIGN.md và brief từng surface theo workflow. Đợt lập kế hoạch không tạo direction contract, không thêm dependency, không sửa source và không deploy.

## 9. Điểm chưa chốt, kiểm chứng và phạm vi thay đổi

Đã xác nhận ưu tiên lời nhắn và quyền đề xuất từ chức năng hiện có. Chưa xác nhận hướng thị giác cuối cùng, quy trình mockup/code và việc đổi tên hiển thị. Chưa dựng mockup, đo motion, kiểm thử UI mới hoặc kiểm tra backend live.

Đợt này tạo PRODUCT.md và tài liệu kế hoạch này. Bốn file UI có diff trong working tree là thay đổi đã tồn tại khi tiếp tục công việc; không chỉnh sửa hoặc hoàn tác chúng trong giai đoạn lập kế hoạch.

Không khôi phục admin/privacy/export/múi giờ bị khóa, không thêm điểm tình yêu, theo dõi online/đã đọc, cuộc gọi hay tính năng AI vì một ý tưởng thị giác cần chúng.
