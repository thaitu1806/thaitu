# Requirements Document: Progressive Parent Linking

## Giới thiệu

Tính năng "Progressive Parent Linking" cho phép trẻ em bắt đầu chơi Học Vui ngay lập tức mà không cần tài khoản phụ huynh (zero-friction onboarding). Hệ thống sẽ dần dần khuyến khích và cuối cùng yêu cầu liên kết tài khoản phụ huynh khi trẻ đạt các mốc quan trọng hoặc muốn dùng tính năng premium (Shop, AI Chat). Flow này tối ưu cho trẻ em Việt Nam 7-8 tuổi (lớp 2-5), đảm bảo trải nghiệm vui vẻ, không bị gián đoạn.

## Thuật ngữ (Glossary)

- **Hệ_Thống**: Backend server Express.js của Học Vui (API + DB)
- **Giao_Diện**: Frontend vanilla JS chạy trên trình duyệt (public/*.html + *.js)
- **Người_Chơi**: Trẻ em sử dụng ứng dụng (player trong DB)
- **Phụ_Huynh**: Cha/mẹ/người giám hộ có tài khoản parent
- **Trạng_Thái_Liên_Kết**: Thuộc tính của Người_Chơi xác định đã liên kết Phụ_Huynh hay chưa (`unlinked`, `prompted`, `linked`)
- **Lời_Nhắc_Nhẹ**: Popup thân thiện, có thể bỏ qua, gợi ý Người_Chơi liên kết Phụ_Huynh
- **Cổng_Bắt_Buộc**: Gate chặn truy cập tính năng premium cho đến khi liên kết Phụ_Huynh
- **Mã_Liên_Kết**: Mã 6 ký tự duy nhất dùng để Phụ_Huynh liên kết với Người_Chơi
- **Phiên_Chơi**: Một game session hoàn chỉnh (game_sessions record trong DB)
- **Tính_Năng_Premium**: Shop, AI Chat — các tính năng cần liên kết Phụ_Huynh để mở khóa

## Requirements

### Requirement 1: Zero-Friction Onboarding (Giữ nguyên flow hiện tại)

**User Story:** Là một Người_Chơi, tôi muốn bắt đầu chơi ngay lập tức chỉ với tên + lớp, để không bị cản trở bởi việc đăng ký phức tạp.

#### Acceptance Criteria

1. THE Hệ_Thống SHALL cho phép Người_Chơi tạo profile chỉ với tên và lớp mà không yêu cầu liên kết Phụ_Huynh
2. WHEN Người_Chơi mới được tạo, THE Hệ_Thống SHALL gán Trạng_Thái_Liên_Kết mặc định là `unlinked`
3. WHILE Trạng_Thái_Liên_Kết là `unlinked`, THE Giao_Diện SHALL cho phép Người_Chơi truy cập tất cả game modes cơ bản (Luyện Tập, Phiêu Lưu, Đấu 2 Bạn, Đấu Online, mini-games)

---

### Requirement 2: Sinh Mã Liên Kết Tự Động

**User Story:** Là một Người_Chơi, tôi muốn có một mã liên kết duy nhất, để Phụ_Huynh có thể dễ dàng tìm và kết nối với tài khoản của tôi.

#### Acceptance Criteria

1. WHEN Người_Chơi mới được tạo, THE Hệ_Thống SHALL sinh một Mã_Liên_Kết 6 ký tự (chữ in hoa + số) duy nhất cho Người_Chơi đó
2. THE Hệ_Thống SHALL đảm bảo Mã_Liên_Kết là duy nhất trong toàn bộ database
3. WHEN Phụ_Huynh nhập Mã_Liên_Kết hợp lệ, THE Hệ_Thống SHALL liên kết tài khoản Phụ_Huynh với Người_Chơi tương ứng
4. IF Mã_Liên_Kết không tồn tại hoặc không hợp lệ, THEN THE Hệ_Thống SHALL trả về thông báo lỗi rõ ràng bằng tiếng Việt

---

### Requirement 3: Lời Nhắc Nhẹ Sau Phiên Chơi Đầu Tiên

**User Story:** Là Hệ_Thống, tôi muốn gợi ý liên kết Phụ_Huynh một cách thân thiện sau khi Người_Chơi hoàn thành phiên đầu tiên, để tăng tỉ lệ liên kết mà không gây khó chịu.

#### Acceptance Criteria

1. WHEN Người_Chơi có Trạng_Thái_Liên_Kết `unlinked` hoàn thành Phiên_Chơi đầu tiên (session_count = 1), THE Giao_Diện SHALL hiển thị Lời_Nhắc_Nhẹ với nội dung "Muốn ba mẹ xem thành tích không? 🌟"
2. THE Giao_Diện SHALL hiển thị nút "Liên kết ngay" và nút "Để sau" trên Lời_Nhắc_Nhẹ
3. WHEN Người_Chơi nhấn "Để sau", THE Giao_Diện SHALL đóng Lời_Nhắc_Nhẹ và cập nhật Trạng_Thái_Liên_Kết thành `prompted`
4. WHEN Người_Chơi nhấn "Liên kết ngay", THE Giao_Diện SHALL hiển thị Mã_Liên_Kết và hướng dẫn cho Phụ_Huynh
5. THE Giao_Diện SHALL hiển thị Lời_Nhắc_Nhẹ tối đa 1 lần mỗi ngày cho cùng Người_Chơi

---

### Requirement 4: Nhắc Lặp Lại Theo Milestone

**User Story:** Là Hệ_Thống, tôi muốn nhắc lại liên kết Phụ_Huynh tại các mốc quan trọng, để tăng cơ hội Người_Chơi thực hiện liên kết trước khi gặp gate bắt buộc.

#### Acceptance Criteria

1. WHILE Trạng_Thái_Liên_Kết là `prompted` và Người_Chơi đạt 5 Phiên_Chơi, THE Giao_Diện SHALL hiển thị lại Lời_Nhắc_Nhẹ với nội dung "Ba mẹ sẽ tự hào lắm đó! Liên kết ngay nhé 🏆"
2. WHILE Trạng_Thái_Liên_Kết là `prompted` và Người_Chơi đạt 3 ngày streak, THE Giao_Diện SHALL hiển thị lại Lời_Nhắc_Nhẹ với nội dung "Con giỏi quá! Cho ba mẹ biết nhé 🔥"
3. THE Giao_Diện SHALL cho phép Người_Chơi bỏ qua (skip) tất cả Lời_Nhắc_Nhẹ milestone mà không bị hạn chế gameplay cơ bản
4. THE Hệ_Thống SHALL lưu lại thời điểm nhắc cuối cùng để tránh spam nhiều lần trong cùng ngày

---

### Requirement 5: Cổng Bắt Buộc cho Tính Năng Premium

**User Story:** Là Hệ_Thống, tôi muốn yêu cầu liên kết Phụ_Huynh trước khi mở khóa tính năng premium, để đảm bảo Phụ_Huynh biết và kiểm soát hoạt động của con.

#### Acceptance Criteria

1. WHEN Người_Chơi có Trạng_Thái_Liên_Kết khác `linked` cố gắng truy cập Shop, THE Giao_Diện SHALL hiển thị Cổng_Bắt_Buộc thay vì nội dung Shop
2. WHEN Người_Chơi có Trạng_Thái_Liên_Kết khác `linked` cố gắng sử dụng AI Chat, THE Giao_Diện SHALL hiển thị Cổng_Bắt_Buộc thay vì cho phép gửi tin nhắn
3. THE Cổng_Bắt_Buộc SHALL hiển thị Mã_Liên_Kết của Người_Chơi, QR code chứa link liên kết, và hướng dẫn ngắn gọn bằng tiếng Việt
4. WHEN Trạng_Thái_Liên_Kết chuyển thành `linked`, THE Giao_Diện SHALL mở khóa tất cả Tính_Năng_Premium ngay lập tức mà không cần tải lại trang
5. THE Hệ_Thống SHALL kiểm tra Trạng_Thái_Liên_Kết ở cả frontend (UX) và backend (API) để ngăn bypass

---

### Requirement 6: Flow Liên Kết từ Phía Phụ Huynh

**User Story:** Là một Phụ_Huynh, tôi muốn liên kết với tài khoản con bằng mã code hoặc QR, để theo dõi thành tích học tập của con.

#### Acceptance Criteria

1. WHEN Phụ_Huynh nhập Mã_Liên_Kết hợp lệ trên trang parent.html, THE Hệ_Thống SHALL liên kết tài khoản Phụ_Huynh với Người_Chơi và cập nhật Trạng_Thái_Liên_Kết thành `linked`
2. WHEN Phụ_Huynh quét QR code chứa URL liên kết, THE Giao_Diện SHALL tự động điền Mã_Liên_Kết vào form liên kết
3. THE Hệ_Thống SHALL cho phép một Phụ_Huynh liên kết với nhiều Người_Chơi (nhiều con)
4. THE Hệ_Thống SHALL cho phép một Người_Chơi được liên kết bởi nhiều Phụ_Huynh (cả ba và mẹ)
5. IF Phụ_Huynh chưa có tài khoản, THEN THE Giao_Diện SHALL hiển thị form đăng ký nhanh trước khi liên kết

---

### Requirement 7: Hiển Thị Mã Liên Kết Trong Profile Người Chơi

**User Story:** Là một Người_Chơi, tôi muốn xem Mã_Liên_Kết của mình bất kỳ lúc nào, để có thể cho Phụ_Huynh khi cần.

#### Acceptance Criteria

1. THE Giao_Diện SHALL hiển thị Mã_Liên_Kết trong trang profile (profile.html) của Người_Chơi
2. WHEN Người_Chơi đã được liên kết (Trạng_Thái_Liên_Kết = `linked`), THE Giao_Diện SHALL hiển thị trạng thái "✅ Đã liên kết ba mẹ" kèm tên Phụ_Huynh
3. WHILE Trạng_Thái_Liên_Kết là `unlinked` hoặc `prompted`, THE Giao_Diện SHALL hiển thị Mã_Liên_Kết với hướng dẫn "Đưa mã này cho ba mẹ để liên kết nhé!"

---

### Requirement 8: API Kiểm Tra Trạng Thái Liên Kết

**User Story:** Là Giao_Diện, tôi muốn kiểm tra trạng thái liên kết theo thời gian thực, để cập nhật UI ngay khi Phụ_Huynh hoàn tất liên kết.

#### Acceptance Criteria

1. THE Hệ_Thống SHALL cung cấp API endpoint GET `/api/players/:id/link-status` trả về Trạng_Thái_Liên_Kết hiện tại và Mã_Liên_Kết
2. WHEN Giao_Diện đang hiển thị Cổng_Bắt_Buộc, THE Giao_Diện SHALL polling API mỗi 5 giây để kiểm tra Trạng_Thái_Liên_Kết
3. WHEN API trả về Trạng_Thái_Liên_Kết = `linked`, THE Giao_Diện SHALL tự động đóng Cổng_Bắt_Buộc và mở khóa tính năng

---

### Requirement 9: Bảo Mật và Validation

**User Story:** Là Hệ_Thống, tôi muốn đảm bảo flow liên kết an toàn, để ngăn chặn liên kết sai hoặc lạm dụng.

#### Acceptance Criteria

1. THE Hệ_Thống SHALL chỉ cho phép liên kết khi Phụ_Huynh đã đăng nhập (authenticated)
2. THE Hệ_Thống SHALL validate Mã_Liên_Kết là đúng format (6 ký tự alphanumeric in hoa) trước khi query database
3. IF một Mã_Liên_Kết bị thử sai quá 5 lần từ cùng một IP trong vòng 10 phút, THEN THE Hệ_Thống SHALL tạm khóa liên kết từ IP đó trong 30 phút
4. THE Hệ_Thống SHALL ghi log mọi lần liên kết thành công (parent_id, player_id, timestamp)

---

### Requirement 10: Backward Compatibility

**User Story:** Là Hệ_Thống, tôi muốn đảm bảo tính năng mới không phá vỡ flow hiện có, để Người_Chơi hiện tại không bị ảnh hưởng tiêu cực.

#### Acceptance Criteria

1. WHEN Hệ_Thống được cập nhật, THE Hệ_Thống SHALL gán Trạng_Thái_Liên_Kết `unlinked` cho tất cả Người_Chơi hiện tại chưa có record trong parent_children
2. WHEN Hệ_Thống được cập nhật, THE Hệ_Thống SHALL gán Trạng_Thái_Liên_Kết `linked` cho tất cả Người_Chơi đã có record trong parent_children
3. THE Hệ_Thống SHALL sinh Mã_Liên_Kết cho tất cả Người_Chơi hiện tại thông qua migration script
4. THE Hệ_Thống SHALL giữ nguyên flow đăng nhập/đăng ký Phụ_Huynh hiện tại trên parent.html, chỉ thêm tùy chọn liên kết bằng mã
