// Tiếng Anh trung bình - Dành cho trẻ lớp 2: Câu hoàn chỉnh, ngữ pháp cơ bản, từ vựng mở rộng
export const englishQuestionsMedium = [
  // === CẤU TRÚC CÂU ĐƠN GIẢN ===
  { question_text: "Chọn câu đúng:", option_a: "I am a student.", option_b: "I a student am.", option_c: "Am I a student.", option_d: "Student I am a.", correct_answer: "a" },
  { question_text: "\"She ___ a teacher.\" Điền từ đúng:", option_a: "am", option_b: "is", option_c: "are", option_d: "be", correct_answer: "b" },
  { question_text: "\"They ___ happy.\" Điền từ đúng:", option_a: "is", option_b: "am", option_c: "are", option_d: "be", correct_answer: "c" },
  { question_text: "\"I ___ 7 years old.\" Điền từ đúng:", option_a: "is", option_b: "are", option_c: "be", option_d: "am", correct_answer: "d" },
  { question_text: "\"He ___ a boy.\" Điền từ đúng:", option_a: "is", option_b: "am", option_c: "are", option_d: "be", correct_answer: "a" },
  { question_text: "\"We ___ friends.\" Điền từ đúng:", option_a: "is", option_b: "are", option_c: "am", option_d: "be", correct_answer: "b" },
  { question_text: "\"This ___ a cat.\" Điền từ đúng:", option_a: "am", option_b: "are", option_c: "is", option_d: "be", correct_answer: "c" },
  { question_text: "\"You ___ my friend.\" Điền từ đúng:", option_a: "is", option_b: "am", option_c: "be", option_d: "are", correct_answer: "d" },

  // === ĐẠI TỪ NHÂN XƯNG ===
  { question_text: "\"I\" nghĩa là gì?", option_a: "Tôi", option_b: "Bạn", option_c: "Anh ấy", option_d: "Cô ấy", correct_answer: "a" },
  { question_text: "\"You\" nghĩa là gì?", option_a: "Tôi", option_b: "Bạn", option_c: "Họ", option_d: "Chúng tôi", correct_answer: "b" },
  { question_text: "\"He\" nghĩa là gì?", option_a: "Cô ấy", option_b: "Họ", option_c: "Anh ấy", option_d: "Chúng tôi", correct_answer: "c" },
  { question_text: "\"She\" nghĩa là gì?", option_a: "Anh ấy", option_b: "Họ", option_c: "Tôi", option_d: "Cô ấy", correct_answer: "d" },
  { question_text: "\"We\" nghĩa là gì?", option_a: "Chúng tôi", option_b: "Họ", option_c: "Bạn", option_d: "Anh ấy", correct_answer: "a" },
  { question_text: "\"They\" nghĩa là gì?", option_a: "Chúng tôi", option_b: "Họ", option_c: "Bạn", option_d: "Tôi", correct_answer: "b" },
  { question_text: "\"It\" dùng cho:", option_a: "Người", option_b: "Nhóm người", option_c: "Đồ vật / con vật", option_d: "Tên riêng", correct_answer: "c" },

  // === GIỚI TỪ CHỈ NƠI CHỐN ===
  { question_text: "\"The cat is ___ the table.\" (trên bàn)", option_a: "under", option_b: "in", option_c: "behind", option_d: "on", correct_answer: "d" },
  { question_text: "\"The ball is ___ the box.\" (trong hộp)", option_a: "in", option_b: "on", option_c: "under", option_d: "next to", correct_answer: "a" },
  { question_text: "\"The dog is ___ the chair.\" (dưới ghế)", option_a: "on", option_b: "under", option_c: "in", option_d: "behind", correct_answer: "b" },
  { question_text: "\"The book is ___ the bag.\" (trong cặp)", option_a: "on", option_b: "under", option_c: "in", option_d: "next to", correct_answer: "c" },
  { question_text: "\"The tree is ___ the house.\" (phía sau nhà)", option_a: "in", option_b: "on", option_c: "under", option_d: "behind", correct_answer: "d" },
  { question_text: "\"Next to\" nghĩa là gì?", option_a: "Bên cạnh", option_b: "Phía trên", option_c: "Phía dưới", option_d: "Phía sau", correct_answer: "a" },

  // === THỜI TIẾT ===
  { question_text: "\"Sunny\" nghĩa là gì?", option_a: "Mưa", option_b: "Nắng", option_c: "Gió", option_d: "Mây", correct_answer: "b" },
  { question_text: "\"Rainy\" nghĩa là gì?", option_a: "Nắng", option_b: "Gió", option_c: "Mưa", option_d: "Lạnh", correct_answer: "c" },
  { question_text: "\"Windy\" nghĩa là gì?", option_a: "Nóng", option_b: "Mưa", option_c: "Mây", option_d: "Gió", correct_answer: "d" },
  { question_text: "\"Cloudy\" nghĩa là gì?", option_a: "Nhiều mây", option_b: "Nắng", option_c: "Mưa", option_d: "Tuyết", correct_answer: "a" },
  { question_text: "\"Hot\" nghĩa là gì?", option_a: "Lạnh", option_b: "Nóng", option_c: "Ấm", option_d: "Mát", correct_answer: "b" },
  { question_text: "\"Cold\" nghĩa là gì?", option_a: "Nóng", option_b: "Ấm", option_c: "Lạnh", option_d: "Mát", correct_answer: "c" },

  // === NGÀY TRONG TUẦN ===
  { question_text: "\"Monday\" là thứ mấy?", option_a: "Chủ nhật", option_b: "Thứ ba", option_c: "Thứ năm", option_d: "Thứ hai", correct_answer: "d" },
  { question_text: "\"Sunday\" là ngày nào?", option_a: "Chủ nhật", option_b: "Thứ bảy", option_c: "Thứ sáu", option_d: "Thứ hai", correct_answer: "a" },
  { question_text: "Thứ tư trong tiếng Anh là gì?", option_a: "Tuesday", option_b: "Wednesday", option_c: "Thursday", option_d: "Friday", correct_answer: "b" },
  { question_text: "Thứ sáu trong tiếng Anh là gì?", option_a: "Thursday", option_b: "Saturday", option_c: "Friday", option_d: "Sunday", correct_answer: "c" },
  { question_text: "\"Saturday\" là ngày nào?", option_a: "Thứ sáu", option_b: "Chủ nhật", option_c: "Thứ năm", option_d: "Thứ bảy", correct_answer: "d" },
  { question_text: "Thứ ba trong tiếng Anh là gì?", option_a: "Tuesday", option_b: "Thursday", option_c: "Monday", option_d: "Wednesday", correct_answer: "a" },
  { question_text: "Thứ năm trong tiếng Anh là gì?", option_a: "Wednesday", option_b: "Thursday", option_c: "Friday", option_d: "Tuesday", correct_answer: "b" },

  // === HÀNH ĐỘNG / ĐỘNG TỪ ===
  { question_text: "\"Run\" nghĩa là gì?", option_a: "Đi bộ", option_b: "Ngồi", option_c: "Chạy", option_d: "Nhảy", correct_answer: "c" },
  { question_text: "\"Jump\" nghĩa là gì?", option_a: "Chạy", option_b: "Bơi", option_c: "Đi", option_d: "Nhảy", correct_answer: "d" },
  { question_text: "\"Eat\" nghĩa là gì?", option_a: "Ăn", option_b: "Uống", option_c: "Ngủ", option_d: "Chơi", correct_answer: "a" },
  { question_text: "\"Drink\" nghĩa là gì?", option_a: "Ăn", option_b: "Uống", option_c: "Đọc", option_d: "Viết", correct_answer: "b" },
  { question_text: "\"Sleep\" nghĩa là gì?", option_a: "Chơi", option_b: "Ăn", option_c: "Ngủ", option_d: "Học", correct_answer: "c" },
  { question_text: "\"Read\" nghĩa là gì?", option_a: "Viết", option_b: "Nghe", option_c: "Nói", option_d: "Đọc", correct_answer: "d" },
  { question_text: "\"Write\" nghĩa là gì?", option_a: "Viết", option_b: "Đọc", option_c: "Vẽ", option_d: "Hát", correct_answer: "a" },
  { question_text: "\"Sing\" nghĩa là gì?", option_a: "Nhảy", option_b: "Hát", option_c: "Chơi", option_d: "Vẽ", correct_answer: "b" },
  { question_text: "\"Draw\" nghĩa là gì?", option_a: "Hát", option_b: "Viết", option_c: "Vẽ", option_d: "Đọc", correct_answer: "c" },
  { question_text: "\"Play\" nghĩa là gì?", option_a: "Học", option_b: "Ngủ", option_c: "Ăn", option_d: "Chơi", correct_answer: "d" },
  { question_text: "\"Walk\" nghĩa là gì?", option_a: "Đi bộ", option_b: "Chạy", option_c: "Nhảy", option_d: "Bơi", correct_answer: "a" },
  { question_text: "\"Swim\" nghĩa là gì?", option_a: "Chạy", option_b: "Bơi", option_c: "Bay", option_d: "Leo", correct_answer: "b" },

  // === MÔN HỌC / TRƯỜNG LỚP ===
  { question_text: "\"School\" nghĩa là gì?", option_a: "Nhà", option_b: "Công viên", option_c: "Trường học", option_d: "Bệnh viện", correct_answer: "c" },
  { question_text: "\"Teacher\" nghĩa là gì?", option_a: "Bạn", option_b: "Học sinh", option_c: "Bác sĩ", option_d: "Giáo viên", correct_answer: "d" },
  { question_text: "\"Student\" nghĩa là gì?", option_a: "Học sinh", option_b: "Giáo viên", option_c: "Bác sĩ", option_d: "Công nhân", correct_answer: "a" },
  { question_text: "\"Classroom\" nghĩa là gì?", option_a: "Sân trường", option_b: "Lớp học", option_c: "Thư viện", option_d: "Nhà ăn", correct_answer: "b" },
  { question_text: "\"Pencil\" nghĩa là gì?", option_a: "Thước", option_b: "Sách", option_c: "Bút chì", option_d: "Tẩy", correct_answer: "c" },
  { question_text: "\"Eraser\" nghĩa là gì?", option_a: "Bút", option_b: "Thước", option_c: "Sách", option_d: "Tẩy", correct_answer: "d" },
  { question_text: "\"Ruler\" nghĩa là gì?", option_a: "Thước", option_b: "Bút", option_c: "Kéo", option_d: "Hồ dán", correct_answer: "a" },
  { question_text: "\"Bag\" nghĩa là gì?", option_a: "Bàn", option_b: "Cặp sách", option_c: "Ghế", option_d: "Bảng", correct_answer: "b" },

  // === CÂU HỎI VỚI "CAN" ===
  { question_text: "\"I can swim.\" nghĩa là gì?", option_a: "Tôi thích bơi.", option_b: "Tôi đang bơi.", option_c: "Tôi biết bơi.", option_d: "Tôi muốn bơi.", correct_answer: "c" },
  { question_text: "\"Can you sing?\" nghĩa là gì?", option_a: "Bạn đang hát à?", option_b: "Bạn thích hát không?", option_c: "Bạn muốn hát không?", option_d: "Bạn biết hát không?", correct_answer: "d" },
  { question_text: "\"She can dance.\" nghĩa là gì?", option_a: "Cô ấy biết nhảy.", option_b: "Cô ấy thích nhảy.", option_c: "Cô ấy đang nhảy.", option_d: "Cô ấy muốn nhảy.", correct_answer: "a" },
  { question_text: "\"He can ride a bike.\" nghĩa là gì?", option_a: "Anh ấy thích xe đạp.", option_b: "Anh ấy biết đi xe đạp.", option_c: "Anh ấy có xe đạp.", option_d: "Anh ấy mua xe đạp.", correct_answer: "b" },

  // === TÍNH TỪ MÔ TẢ ===
  { question_text: "\"Big\" nghĩa là gì?", option_a: "Nhỏ", option_b: "Dài", option_c: "To/Lớn", option_d: "Ngắn", correct_answer: "c" },
  { question_text: "\"Small\" nghĩa là gì?", option_a: "To", option_b: "Dài", option_c: "Cao", option_d: "Nhỏ", correct_answer: "d" },
  { question_text: "\"Tall\" nghĩa là gì?", option_a: "Cao", option_b: "Thấp", option_c: "Béo", option_d: "Gầy", correct_answer: "a" },
  { question_text: "\"Short\" có thể nghĩa là gì?", option_a: "Cao", option_b: "Thấp/Ngắn", option_c: "Dài", option_d: "To", correct_answer: "b" },
  { question_text: "\"Fast\" nghĩa là gì?", option_a: "Chậm", option_b: "Yếu", option_c: "Nhanh", option_d: "Mạnh", correct_answer: "c" },
  { question_text: "\"Slow\" nghĩa là gì?", option_a: "Nhanh", option_b: "Mạnh", option_c: "Yếu", option_d: "Chậm", correct_answer: "d" },
  { question_text: "\"Happy\" nghĩa là gì?", option_a: "Vui", option_b: "Buồn", option_c: "Giận", option_d: "Sợ", correct_answer: "a" },
  { question_text: "\"Sad\" nghĩa là gì?", option_a: "Vui", option_b: "Buồn", option_c: "Giận", option_d: "Mệt", correct_answer: "b" },
  { question_text: "\"New\" nghĩa là gì?", option_a: "Cũ", option_b: "Đẹp", option_c: "Mới", option_d: "Xấu", correct_answer: "c" },
  { question_text: "\"Old\" nghĩa là gì?", option_a: "Mới", option_b: "Trẻ", option_c: "Đẹp", option_d: "Cũ/Già", correct_answer: "d" },
];
