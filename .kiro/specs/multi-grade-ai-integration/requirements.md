# Tài Liệu Yêu Cầu: Hỗ Trợ Đa Khối Lớp & Tích Hợp AI

## Giới Thiệu

Mở rộng Học Vui từ ứng dụng chỉ dành cho lớp 2 thành nền tảng đa khối lớp (lớp 2-5+), đồng thời tích hợp AI (ChatGPT / Deepseek) để tạo câu hỏi động, giải thích đáp án, gợi ý khi trẻ sai, và hỗ trợ chatbot gia sư trong module Kiến Thức.

## Thuật Ngữ

- **Grade_Selector**: Giao diện chọn khối lớp khi tạo profile hoặc thay đổi lớp
- **AI_Service**: Module server-side gọi API ChatGPT hoặc Deepseek để sinh nội dung giáo dục
- **Question_Generator**: Thành phần AI tạo câu hỏi trắc nghiệm theo khối lớp, môn học, độ khó
- **Answer_Explainer**: Thành phần AI giải thích tại sao đáp án đúng/sai cho trẻ
- **Hint_Provider**: Thành phần AI đưa ra gợi ý khi trẻ trả lời sai hoặc yêu cầu trợ giúp
- **Tutor_Chatbot**: Chatbot AI trong module Kiến Thức, trả lời câu hỏi của trẻ theo ngữ cảnh bài học
- **Player**: Người chơi (học sinh)
- **Admin**: Phụ huynh hoặc người quản lý hệ thống
- **Grade**: Khối lớp (2, 3, 4, 5...)
- **API_Key_Manager**: Module quản lý API keys cho AI services (server-side, env variables)

## Yêu Cầu

### Requirement 1: Hỗ Trợ Đa Khối Lớp - Chọn Lớp Khi Tạo Profile

**User Story:** Là một Player, tôi muốn chọn khối lớp khi tạo hồ sơ, để hệ thống hiển thị câu hỏi phù hợp với trình độ của tôi.

#### Acceptance Criteria

1. KHI Player tạo profile mới, Grade_Selector SẼ hiển thị danh sách các khối lớp khả dụng (lớp 2, 3, 4, 5)
2. HỆ THỐNG SẼ lưu khối lớp đã chọn vào trường `grade` trong bảng `players`
3. KHI Player muốn đổi lớp, trang Profile SẼ cho phép cập nhật khối lớp bất kỳ lúc nào
4. HỆ THỐNG SẼ đặt giá trị mặc định là lớp 2 cho các Player hiện tại chưa có trường `grade`
5. Grade_Selector SẼ hiển thị giao diện thân thiện với trẻ em (icon, màu sắc, tên lớp rõ ràng)
6. HỆ THỐNG SẼ hỗ trợ mở rộng thêm khối lớp mới mà không cần thay đổi logic hiện tại (chỉ cần thêm dữ liệu)

### Requirement 2: Lọc Câu Hỏi Theo Khối Lớp

**User Story:** Là một Player, tôi muốn nhận câu hỏi phù hợp với khối lớp của mình, để tôi không gặp câu quá dễ hoặc quá khó.

#### Acceptance Criteria

1. HỆ THỐNG SẼ thêm trường `grade` (INTEGER) vào bảng `questions` để phân loại câu hỏi theo khối lớp
2. KHI Player yêu cầu câu hỏi, API Questions SẼ lọc theo cả `subject`, `difficulty`, và `grade` của Player
3. HỆ THỐNG SẼ gán giá trị `grade = 2` cho tất cả câu hỏi hiện tại trong cơ sở dữ liệu (migration)
4. NẾU không có đủ câu hỏi cho khối lớp yêu cầu, HỆ THỐNG SẼ trả về tất cả câu hỏi khả dụng cho khối lớp đó kèm thông báo
5. API endpoint `/api/questions` SẼ chấp nhận tham số `grade` và sử dụng grade từ profile Player nếu không truyền tham số
6. Admin Panel SẼ hiển thị bộ lọc theo khối lớp khi quản lý câu hỏi
7. Seed data SẼ được tổ chức theo cấu trúc `{subject}-{difficulty}-grade{N}.js` cho các khối lớp mới

### Requirement 3: Tích Hợp AI Service (Server-Side)

**User Story:** Là developer, tôi cần module AI service chạy server-side để gọi ChatGPT/Deepseek API an toàn, không lộ API key ra client.

#### Acceptance Criteria

1. HỆ THỐNG SẼ tạo module `lib/ai-service.js` quản lý kết nối tới AI API (ChatGPT hoặc Deepseek)
2. API_Key_Manager SẼ đọc API keys từ biến môi trường (`OPENAI_API_KEY` hoặc `DEEPSEEK_API_KEY`)
3. NẾU không có API key nào được cấu hình, AI_Service SẼ trả về lỗi mô tả rõ ràng và các tính năng AI SẼ bị vô hiệu hóa (graceful degradation)
4. AI_Service SẼ hỗ trợ chuyển đổi giữa ChatGPT và Deepseek thông qua biến môi trường `AI_PROVIDER` (giá trị: `openai` hoặc `deepseek`)
5. AI_Service SẼ giới hạn số lượng request tối đa mỗi phút mỗi Player để tránh lạm dụng (rate limiting)
6. AI_Service SẼ cache kết quả cho các prompt giống nhau trong 1 giờ để tiết kiệm chi phí API
7. HỆ THỐNG SẼ KHÔNG gửi API key hoặc bất kỳ thông tin nhạy cảm nào xuống client
8. AI_Service SẼ sử dụng system prompt tiếng Việt, phù hợp với trẻ em tiểu học

### Requirement 4: AI Tạo Câu Hỏi Động (Question Generator)

**User Story:** Là một Admin, tôi muốn AI tự động tạo câu hỏi mới theo khối lớp và môn học, để ngân hàng câu hỏi luôn phong phú mà không cần nhập thủ công.

#### Acceptance Criteria

1. KHI Admin yêu cầu tạo câu hỏi, Question_Generator SẼ gọi AI_Service với tham số: `grade`, `subject`, `difficulty`, `quantity`
2. Question_Generator SẼ trả về câu hỏi đúng định dạng: `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`, `explanation`
3. Question_Generator SẼ sinh câu hỏi phù hợp với chương trình giáo dục Việt Nam theo từng khối lớp
4. NẾU AI trả về kết quả không đúng format, Question_Generator SẼ retry tối đa 2 lần trước khi trả lỗi
5. Admin Panel SẼ có nút "🤖 Tạo câu hỏi bằng AI" với form chọn lớp, môn, độ khó, số lượng (1-20)
6. KHI câu hỏi AI được tạo, HỆ THỐNG SẼ lưu vào bảng `questions` với trường `source = 'ai'` để phân biệt với câu hỏi thủ công
7. Admin SẼ có thể xem trước, chỉnh sửa, và duyệt câu hỏi AI trước khi chúng xuất hiện trong game

### Requirement 5: AI Giải Thích Đáp Án (Answer Explainer)

**User Story:** Là một Player, tôi muốn hiểu tại sao đáp án đúng là vậy khi tôi trả lời sai, để tôi học được từ lỗi sai.

#### Acceptance Criteria

1. KHI Player trả lời sai, Answer_Explainer SẼ hiển thị nút "💡 Tại sao?" bên cạnh đáp án đúng
2. KHI Player nhấn nút "Tại sao?", HỆ THỐNG SẼ gọi AI_Service để sinh lời giải thích ngắn gọn, dễ hiểu
3. Answer_Explainer SẼ giải thích bằng tiếng Việt, dùng ngôn ngữ phù hợp với trẻ tiểu học (câu ngắn, ví dụ cụ thể)
4. Answer_Explainer SẼ giải thích trong tối đa 3 câu (không quá dài để trẻ mất tập trung)
5. NẾU AI_Service không khả dụng, HỆ THỐNG SẼ hiển thị trường `explanation` có sẵn trong câu hỏi (fallback tĩnh)
6. HỆ THỐNG SẼ hiển thị lời giải thích trong một popup/tooltip thân thiện với animation nhẹ nhàng

### Requirement 6: AI Gợi Ý (Hint Provider)

**User Story:** Là một Player, tôi muốn nhận gợi ý khi gặp câu hỏi khó, để tôi có cơ hội suy nghĩ thêm trước khi trả lời.

#### Acceptance Criteria

1. HỆ THỐNG SẼ hiển thị nút "💡 Gợi ý" cho mỗi câu hỏi trong game
2. KHI Player nhấn nút gợi ý, Hint_Provider SẼ gọi AI_Service để sinh gợi ý không tiết lộ đáp án
3. Hint_Provider SẼ cung cấp gợi ý theo 2 mức:
   - Mức 1: Gợi ý hướng suy nghĩ (VD: "Hãy nghĩ về phép cộng có nhớ nhé!")
   - Mức 2: Gợi ý cụ thể hơn nhưng vẫn không nói đáp án (VD: "3 + 8 = 11, vậy ta viết 1 nhớ 1")
4. MỖI câu hỏi, Player SẼ được sử dụng tối đa 2 lần gợi ý (mức 1 trước, mức 2 sau)
5. KHI Player sử dụng gợi ý, kim cương nhận được cho câu đó SẼ bị giảm 50% (để khuyến khích tự suy nghĩ)
6. NẾU AI_Service không khả dụng, nút gợi ý SẼ bị ẩn (graceful degradation)
7. Hint_Provider SẼ trả lời bằng tiếng Việt, phù hợp với khối lớp của Player

### Requirement 7: Chatbot Gia Sư trong Module Kiến Thức (Tutor Chatbot)

**User Story:** Là một Player, tôi muốn hỏi chatbot khi không hiểu bài trong module Kiến Thức, để tôi được giải đáp ngay mà không cần chờ người lớn.

#### Acceptance Criteria

1. TRONG trang Learn (Kiến Thức), HỆ THỐNG SẼ hiển thị nút chat "🤖 Hỏi Thầy AI" ở góc màn hình
2. KHI Player mở chatbot, Tutor_Chatbot SẼ hiển thị giao diện chat đơn giản (input text + danh sách tin nhắn)
3. Tutor_Chatbot SẼ trả lời câu hỏi của Player trong ngữ cảnh bài học hiện tại (truyền context bài học vào prompt)
4. Tutor_Chatbot SẼ trả lời bằng tiếng Việt, ngắn gọn (tối đa 4-5 câu), dùng ngôn ngữ phù hợp trẻ tiểu học
5. Tutor_Chatbot SẼ giữ lịch sử chat trong phiên hiện tại (mất khi refresh trang)
6. HỆ THỐNG SẼ giới hạn Player gửi tối đa 20 tin nhắn mỗi ngày để kiểm soát chi phí API
7. NẾU Player hết lượt chat, HỆ THỐNG SẼ hiển thị "Hết lượt hỏi hôm nay rồi! Mai hỏi tiếp nhé 🌟"
8. NẾU AI_Service không khả dụng, nút chatbot SẼ bị ẩn (graceful degradation)
9. Tutor_Chatbot SẼ KHÔNG trả lời các câu hỏi không liên quan đến học tập (có content filter trong system prompt)

### Requirement 8: Mở Rộng Database Schema

**User Story:** Là developer, tôi cần schema DB hỗ trợ đa khối lớp và theo dõi việc sử dụng AI.

#### Acceptance Criteria

1. SCHEMA SẼ thêm trường `grade INTEGER DEFAULT 2` vào bảng `players`
2. SCHEMA SẼ thêm trường `grade INTEGER DEFAULT 2` vào bảng `questions`
3. SCHEMA SẼ thêm trường `source TEXT DEFAULT 'manual'` vào bảng `questions` (giá trị: 'manual' hoặc 'ai')
4. SCHEMA SẼ tạo bảng `ai_usage_logs` để theo dõi việc sử dụng AI:
   - id, player_id, feature (explain/hint/chat/generate), tokens_used, created_at
5. SCHEMA SẼ tạo index trên `questions(subject, difficulty, grade)` để tối ưu truy vấn lọc theo lớp
6. Migration SẼ gán `grade = 2` cho tất cả bản ghi hiện tại trong bảng `questions` và `players`
7. SCHEMA SẼ hỗ trợ mở rộng thêm khối lớp mới chỉ bằng cách thêm dữ liệu (không cần thay đổi schema)

### Requirement 9: Rate Limiting & Quản Lý Chi Phí AI

**User Story:** Là Admin, tôi muốn kiểm soát mức sử dụng AI để không bị chi phí vượt tầm kiểm soát.

#### Acceptance Criteria

1. HỆ THỐNG SẼ giới hạn mỗi Player tối đa 50 request AI mỗi ngày (tổng tất cả tính năng: explain + hint + chat)
2. HỆ THỐNG SẼ lưu log mỗi lần gọi AI (player_id, feature, tokens_used, timestamp) vào bảng `ai_usage_logs`
3. Admin Panel SẼ hiển thị thống kê sử dụng AI: tổng request/ngày, tổng tokens, chi phí ước tính
4. NẾU Player đạt giới hạn daily, HỆ THỐNG SẼ hiển thị thông báo thân thiện và vô hiệu hóa các tính năng AI cho Player đó đến hết ngày
5. Admin SẼ có thể điều chỉnh giới hạn daily qua biến môi trường `AI_DAILY_LIMIT`
6. HỆ THỐNG SẼ ưu tiên sử dụng cache trước khi gọi API mới (giảm chi phí cho câu hỏi/giải thích giống nhau)

### Requirement 10: Cấu Hình AI Provider & Graceful Degradation

**User Story:** Là developer, tôi muốn hệ thống hoạt động bình thường kể cả khi AI service không khả dụng, để trẻ vẫn chơi được.

#### Acceptance Criteria

1. HỆ THỐNG SẼ đọc cấu hình AI từ biến môi trường:
   - `AI_PROVIDER`: `openai` hoặc `deepseek` (mặc định: `openai`)
   - `OPENAI_API_KEY`: API key cho OpenAI
   - `DEEPSEEK_API_KEY`: API key cho Deepseek
   - `AI_DAILY_LIMIT`: Giới hạn request/ngày/player (mặc định: 50)
   - `AI_MODEL`: Tên model sử dụng (mặc định: `gpt-4o-mini` hoặc `deepseek-chat`)
2. NẾU không có API key nào được cấu hình, TẤT CẢ tính năng AI SẼ bị ẩn khỏi giao diện (không hiển thị nút)
3. NẾU API call thất bại (timeout, lỗi mạng, quota hết), HỆ THỐNG SẼ fallback về nội dung tĩnh có sẵn hoặc ẩn tính năng
4. HỆ THỐNG SẼ hiển thị trạng thái AI (hoạt động/tắt) trong Admin Panel
5. Tất cả game modes hiện tại SẼ hoạt động bình thường mà không phụ thuộc vào AI (AI là tính năng bổ sung, không bắt buộc)
6. `.env.example` SẼ được cập nhật với tất cả biến môi trường AI mới kèm mô tả
