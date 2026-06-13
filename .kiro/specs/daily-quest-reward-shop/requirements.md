# Hệ Thống Nhiệm Vụ Hằng Ngày, Kim Cương & Cửa Hàng

## Tổng Quan

Hệ thống gamification tạo động lực học tập cho trẻ thông qua: nhiệm vụ hằng ngày, tích kim cương theo mức độ câu hỏi, chuỗi ngày học (streak), cấp độ người chơi, và cửa hàng phần thưởng (ảo + thực) do phụ huynh quản lý.

## Thuật Ngữ

- **Diamond (Kim Cương)**: Đơn vị tiền tệ chính, kiếm được qua trả lời đúng và hoàn thành nhiệm vụ
- **Daily_Quest (Nhiệm Vụ Hằng Ngày)**: 3-5 nhiệm vụ reset mỗi ngày, thưởng kim cương khi hoàn thành
- **Streak (Chuỗi Ngày)**: Số ngày liên tục có hoạt động học tập, thưởng bonus khi duy trì
- **Player_Level (Cấp Độ)**: Hạng của người chơi dựa trên tổng kim cương tích lũy (Bronze → Silver → Gold → Diamond → Master)
- **Shop (Cửa Hàng)**: Nơi đổi kim cương lấy vật phẩm ảo hoặc phần thưởng thực
- **Shop_Item (Vật Phẩm)**: Đồ trong shop, có thể là avatar, khung, sticker (ảo) hoặc voucher phần thưởng thực (do admin tạo)
- **Reward_Voucher (Phiếu Thưởng)**: Phần thưởng thực do phụ huynh tạo (VD: "Xem TV 30 phút", "Ăn kem")

## Yêu Cầu

### Requirement 1: Hệ Thống Kim Cương Theo Mức Độ Câu Hỏi

**User Story:** Là một Player, tôi muốn nhận nhiều kim cương hơn khi trả lời đúng câu hỏi khó, để tôi có động lực thử thách bản thân.

#### Acceptance Criteria

1. KHI Player trả lời đúng câu hỏi mức **easy**, HỆ THỐNG SẼ thưởng **1 kim cương**
2. KHI Player trả lời đúng câu hỏi mức **medium**, HỆ THỐNG SẼ thưởng **3 kim cương**
3. KHI Player trả lời đúng câu hỏi mức **hard**, HỆ THỐNG SẼ thưởng **5 kim cương**
4. KHI Player đạt combo streak ≥ 3, HỆ THỐNG SẼ nhân đôi kim cương cho câu trả lời đó (combo bonus)
5. KHI Player đạt combo streak ≥ 7, HỆ THỐNG SẼ nhân ba kim cương cho câu trả lời đó
6. KHI Player trả lời sai, HỆ THỐNG SẼ KHÔNG trừ kim cương (chỉ không cộng)
7. HỆ THỐNG SẼ hiển thị animation "+X 💎" mỗi khi Player nhận kim cương
8. HỆ THỐNG SẼ lưu tổng kim cương vào profile Player (trường `total_diamonds`)

### Requirement 2: Nhiệm Vụ Hằng Ngày (Daily Quests)

**User Story:** Là một Player, tôi muốn có nhiệm vụ mỗi ngày để hoàn thành, để tôi có mục tiêu rõ ràng và được thưởng thêm.

#### Acceptance Criteria

1. HỆ THỐNG SẼ tạo 3-5 nhiệm vụ mới mỗi ngày lúc 00:00 (theo timezone Việt Nam, UTC+7)
2. CÁC LOẠI nhiệm vụ bao gồm:
   - Hoàn thành N lượt chơi (VD: "Chơi 3 lượt bất kỳ")
   - Hoàn thành N lượt ở chế độ cụ thể (VD: "Chơi 2 lượt Classic" hoặc "Chơi 1 lượt Adventure")
   - Đạt combo streak ≥ N trong 1 lượt (VD: "Đạt combo 5 trong 1 ván")
   - Hoàn thành N lượt với accuracy ≥ 80% (VD: "Chơi 2 lượt đạt 80% đúng")
   - Hoàn thành 1 bài học trong Learn Module (VD: "Học 1 bài mới")
3. MỖI nhiệm vụ SẼ có phần thưởng kim cương riêng (5-20 kim cương tùy độ khó nhiệm vụ)
4. KHI Player hoàn thành 1 nhiệm vụ, HỆ THỐNG SẼ hiển thị thông báo + animation nhận thưởng
5. KHI Player hoàn thành TẤT CẢ nhiệm vụ trong ngày, HỆ THỐNG SẼ thưởng thêm **bonus 15 kim cương**
6. HỆ THỐNG SẼ hiển thị thanh tiến trình cho mỗi nhiệm vụ (VD: "2/3 lượt chơi")
7. NẾU Player không hoàn thành nhiệm vụ trong ngày, nhiệm vụ SẼ biến mất khi reset ngày mới (không tích lũy)
8. MỘT "lượt chơi" được tính khi Player hoàn thành 1 phiên game (không tính nếu thoát giữa chừng)

### Requirement 3: Chuỗi Ngày Học (Streak System)

**User Story:** Là một Player, tôi muốn được thưởng khi học liên tục nhiều ngày, để tôi duy trì thói quen học hằng ngày.

#### Acceptance Criteria

1. HỆ THỐNG SẼ đếm streak khi Player hoàn thành ÍT NHẤT 1 nhiệm vụ hằng ngày trong ngày đó
2. KHI streak đạt 3 ngày liên tục, HỆ THỐNG SẼ thưởng **10 kim cương bonus**
3. KHI streak đạt 7 ngày liên tục, HỆ THỐNG SẼ thưởng **30 kim cương bonus**
4. KHI streak đạt 14 ngày liên tục, HỆ THỐNG SẼ thưởng **60 kim cương bonus**
5. KHI streak đạt 30 ngày liên tục, HỆ THỐNG SẼ thưởng **150 kim cương bonus**
6. NẾU Player bỏ 1 ngày không học, streak SẼ reset về 0
7. HỆ THỐNG SẼ hiển thị streak hiện tại trên trang Profile và Home với icon 🔥
8. HỆ THỐNG SẼ gửi nhắc nhở (nếu có notification permission) khi gần hết ngày mà chưa học

### Requirement 4: Cấp Độ Người Chơi (Player Level)

**User Story:** Là một Player, tôi muốn thấy mình lên cấp khi học nhiều, để tôi cảm thấy tiến bộ và tự hào.

#### Acceptance Criteria

1. HỆ THỐNG SẼ phân cấp Player dựa trên tổng kim cương đã kiếm được (lifetime, không phải số dư):
   - **Bronze (Đồng)**: 0 - 99 kim cương
   - **Silver (Bạc)**: 100 - 499 kim cương
   - **Gold (Vàng)**: 500 - 1499 kim cương
   - **Diamond (Kim Cương)**: 1500 - 4999 kim cương
   - **Master (Bậc Thầy)**: 5000+ kim cương
2. KHI Player lên cấp mới, HỆ THỐNG SẼ hiển thị animation chúc mừng + thưởng bonus kim cương
3. CẤP ĐỘ SẼ mở khóa các vật phẩm mới trong Shop (mỗi cấp có items riêng)
4. HỆ THỐNG SẼ hiển thị cấp độ hiện tại + thanh tiến trình đến cấp tiếp theo trên Profile
5. HỆ THỐNG SẼ hiển thị huy hiệu cấp độ bên cạnh tên Player trong game

### Requirement 5: Cửa Hàng (Shop System)

**User Story:** Là một Player, tôi muốn dùng kim cương mua đồ trong shop, để tôi có mục tiêu cụ thể khi học.

#### Acceptance Criteria

1. HỆ THỐNG SẼ hiển thị trang Shop với các vật phẩm chia theo danh mục:
   - **Avatars**: Hình đại diện cho profile (10-50 💎)
   - **Frames (Khung)**: Khung trang trí cho avatar (20-100 💎)
   - **Stickers**: Hình dán dùng trong game (5-30 💎)
   - **Power-ups**: Vật phẩm hỗ trợ trong game (10-40 💎)
   - **Phần thưởng thực**: Voucher do phụ huynh tạo (giá tùy chỉnh)
2. KHI Player mua vật phẩm, HỆ THỐNG SẼ trừ kim cương từ số dư và thêm vật phẩm vào kho đồ
3. NẾU Player không đủ kim cương, nút mua SẼ bị vô hiệu hóa và hiển thị "Chưa đủ 💎"
4. KHI Player mua phần thưởng thực (voucher), HỆ THỐNG SẼ ghi nhận và hiển thị trong mục "Phiếu thưởng chờ duyệt"
5. HỆ THỐNG SẼ hiển thị số dư kim cương hiện tại ở góc trên trang Shop
6. MỘT SỐ vật phẩm SẼ yêu cầu cấp độ tối thiểu để mở khóa (VD: avatar đặc biệt chỉ Gold+)
7. HỆ THỐNG SẼ hiển thị tag "MỚI" cho vật phẩm vừa được thêm trong 7 ngày gần nhất

### Requirement 6: Quản Lý Shop Bởi Admin/Phụ Huynh

**User Story:** Là phụ huynh, tôi muốn tạo và quản lý phần thưởng trong shop, để tôi kiểm soát được những gì con có thể đổi.

#### Acceptance Criteria

1. ADMIN SẼ có trang quản lý Shop trong Admin Panel với các chức năng:
   - Tạo vật phẩm mới (tên, mô tả, loại, giá kim cương, cấp độ yêu cầu, hình ảnh/emoji)
   - Sửa giá và thông tin vật phẩm
   - Ẩn/hiện vật phẩm trong shop
   - Xóa vật phẩm
2. ADMIN SẼ có thể tạo "Phần thưởng thực" với:
   - Tên phần thưởng (VD: "Xem TV 30 phút", "Đi công viên", "Ăn kem")
   - Giá kim cương (tùy chỉnh)
   - Số lượng tối đa có thể đổi trong tuần/tháng (giới hạn)
   - Trạng thái: active/inactive
3. KHI Player đổi phần thưởng thực, ADMIN SẼ nhận được thông báo trong Admin Panel
4. ADMIN SẼ có thể "Duyệt" hoặc "Từ chối" phiếu thưởng thực đã đổi
5. KHI Admin duyệt phiếu thưởng, HỆ THỐNG SẼ đánh dấu là "Đã nhận" trong lịch sử Player
6. ADMIN SẼ xem được thống kê: tổng kim cương đã phát, tổng đã tiêu, top vật phẩm được mua

### Requirement 7: Trang Profile Mở Rộng

**User Story:** Là một Player, tôi muốn xem tổng quan thành tích của mình, để tôi tự hào và có động lực học tiếp.

#### Acceptance Criteria

1. TRANG Profile SẼ hiển thị:
   - Avatar và khung đã trang bị
   - Tên Player + huy hiệu cấp độ
   - Số dư kim cương hiện tại
   - Streak hiện tại (🔥 X ngày)
   - Thanh tiến trình cấp độ
   - Thống kê nhanh: tổng câu đúng, tổng phiên học, accuracy %
2. TRANG Profile SẼ có tab "Kho Đồ" hiển thị tất cả vật phẩm đã mua
3. TRANG Profile SẼ có tab "Lịch Sử Thưởng" hiển thị lịch sử nhận/tiêu kim cương
4. PLAYER có thể thay đổi avatar và khung từ kho đồ đã sở hữu
5. TRANG Profile SẼ có nút truy cập nhanh đến Shop

### Requirement 8: Database Schema Mở Rộng

**User Story:** Là developer, tôi cần schema DB hỗ trợ đầy đủ cho hệ thống reward.

#### Acceptance Criteria

1. SCHEMA SẼ thêm bảng `daily_quests` lưu nhiệm vụ hằng ngày:
   - id, player_id, quest_type, target_value, current_value, diamond_reward, is_completed, quest_date
2. SCHEMA SẼ thêm bảng `shop_items` lưu vật phẩm:
   - id, name, description, category, price_diamonds, min_level, image_url, is_active, max_per_week, created_at
3. SCHEMA SẼ thêm bảng `player_inventory` lưu vật phẩm đã mua:
   - id, player_id, item_id, purchased_at, is_equipped
4. SCHEMA SẼ thêm bảng `diamond_transactions` lưu lịch sử kim cương:
   - id, player_id, amount, type (earn/spend), source (answer/quest/streak/shop), reference_id, created_at
5. SCHEMA SẼ thêm bảng `reward_vouchers` lưu phiếu thưởng thực:
   - id, player_id, item_id, status (pending/approved/rejected), requested_at, resolved_at, admin_note
6. SCHEMA SẼ mở rộng bảng `players` thêm:
   - total_diamonds (số dư hiện tại)
   - lifetime_diamonds (tổng đã kiếm, dùng tính cấp độ)
   - current_streak (chuỗi ngày hiện tại)
   - longest_streak (chuỗi dài nhất từng đạt)
   - last_active_date (ngày hoạt động gần nhất, tính streak)
   - equipped_avatar, equipped_frame

