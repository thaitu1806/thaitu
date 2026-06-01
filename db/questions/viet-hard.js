// Tiếng Việt khó - Đọc hiểu, tìm lỗi sai, đặt câu, ngữ pháp nâng cao
export const vietQuestionsHard = [
  // === TÌM LỖI SAI TRONG CÂU ===
  { question_text: "Câu nào đúng ngữ pháp?", option_a: "Em đi học trường", option_b: "Em đi học ở trường", option_c: "Em đi trường học", option_d: "Trường em đi học", correct_answer: "b" },
  { question_text: "Câu nào đúng?", option_a: "Con mèo đang ngủ trên ghế", option_b: "Con mèo đang ghế trên ngủ", option_c: "Đang ngủ con mèo ghế trên", option_d: "Trên ghế đang con mèo ngủ", correct_answer: "a" },
  { question_text: "Câu nào viết đúng chính tả?", option_a: "Trời hôm nay nắng nóng", option_b: "Chời hôm nay lắng lóng", option_c: "Trời hôm nay lắng nóng", option_d: "Chời hôm nay nắng lóng", correct_answer: "a" },
  { question_text: "Từ nào viết sai chính tả: 'Bạn Lan chăm trỉ học bài'?", option_a: "Bạn", option_b: "Lan", option_c: "chăm trỉ", option_d: "học bài", correct_answer: "c", explanation: "Đúng là 'chăm chỉ'" },
  { question_text: "Từ nào viết sai: 'Con chim đang hót chên cành cây'?", option_a: "Con chim", option_b: "đang hót", option_c: "chên", option_d: "cành cây", correct_answer: "c", explanation: "Đúng là 'trên'" },
  { question_text: "Câu nào dùng dấu chấm đúng?", option_a: "Em đi. học mỗi ngày", option_b: "Em đi học. mỗi ngày", option_c: "Em đi học mỗi ngày.", option_d: "Em. đi học mỗi ngày", correct_answer: "c" },
  { question_text: "Câu nào dùng dấu phẩy đúng?", option_a: "Lan, Mai và Hoa đi chơi", option_b: "Lan Mai, và Hoa đi chơi", option_c: "Lan Mai và, Hoa đi chơi", option_d: "Lan Mai và Hoa, đi chơi", correct_answer: "a" },
  { question_text: "Từ nào viết sai: 'Mùa suân hoa nở rất đẹp'?", option_a: "Mùa", option_b: "suân", option_c: "hoa nở", option_d: "rất đẹp", correct_answer: "b", explanation: "Đúng là 'xuân'" },
  { question_text: "Câu nào có lỗi sai?", option_a: "Bầu trời xanh biếc", option_b: "Hoa nở rất đẹp", option_c: "Con chó sủa to", option_d: "Em ăn cơm xong rùi", correct_answer: "d", explanation: "Đúng là 'rồi'" },
  { question_text: "Từ nào viết sai: 'Nước sông chảy rất sanh'?", option_a: "Nước", option_b: "sông", option_c: "chảy", option_d: "sanh", correct_answer: "d", explanation: "Đúng là 'nhanh' hoặc 'xanh' tùy ngữ cảnh" },
  // === ĐỌC HIỂU ĐOẠN VĂN ===
  { question_text: "Đọc: 'Mùa xuân, cây cối đâm chồi nảy lộc. Hoa đào nở hồng rực rỡ.' Mùa nào được nói đến?", option_a: "Mùa xuân", option_b: "Mùa hạ", option_c: "Mùa thu", option_d: "Mùa đông", correct_answer: "a" },
  { question_text: "Đọc: 'Mùa xuân, cây cối đâm chồi nảy lộc. Hoa đào nở hồng rực rỡ.' Hoa gì được nhắc đến?", option_a: "Hoa hồng", option_b: "Hoa đào", option_c: "Hoa mai", option_d: "Hoa cúc", correct_answer: "b" },
  { question_text: "Đọc: 'Lan là học sinh giỏi. Bạn ấy luôn chăm chỉ học bài.' Lan là người thế nào?", option_a: "Lười biếng", option_b: "Nghịch ngợm", option_c: "Chăm chỉ", option_d: "Buồn ngủ", correct_answer: "c" },
  { question_text: "Đọc: 'Con mèo nhà em rất đẹp. Nó có bộ lông trắng muốt.' Bộ lông mèo màu gì?", option_a: "Đen", option_b: "Vàng", option_c: "Nâu", option_d: "Trắng", correct_answer: "d" },
  { question_text: "Đọc: 'Buổi sáng, em dậy sớm tập thể dục. Sau đó em ăn sáng rồi đi học.' Em làm gì đầu tiên?", option_a: "Tập thể dục", option_b: "Ăn sáng", option_c: "Đi học", option_d: "Ngủ", correct_answer: "a" },
  { question_text: "Đọc: 'Mẹ em là bác sĩ. Mẹ chữa bệnh cho mọi người.' Mẹ làm nghề gì?", option_a: "Giáo viên", option_b: "Bác sĩ", option_c: "Công nhân", option_d: "Nông dân", correct_answer: "b" },
  { question_text: "Đọc: 'Trời mưa to, đường ngập nước. Các bạn nhỏ không ra ngoài chơi được.' Tại sao các bạn không chơi?", option_a: "Vì nắng", option_b: "Vì lạnh", option_c: "Vì mưa to", option_d: "Vì tối", correct_answer: "c" },
  { question_text: "Đọc: 'Ông em trồng nhiều cây ăn quả trong vườn: cam, bưởi, xoài.' Ai trồng cây?", option_a: "Bố", option_b: "Mẹ", option_c: "Bà", option_d: "Ông", correct_answer: "d" },
  { question_text: "Đọc: 'Bé Hoa 6 tuổi. Năm nay bé vào lớp 1.' Bé Hoa mấy tuổi?", option_a: "6 tuổi", option_b: "7 tuổi", option_c: "5 tuổi", option_d: "8 tuổi", correct_answer: "a" },
  { question_text: "Đọc: 'Mùa hè nóng bức. Các bạn thích đi bơi ở hồ bơi.' Các bạn thích làm gì?", option_a: "Đi chơi", option_b: "Đi bơi", option_c: "Đi học", option_d: "Đi ngủ", correct_answer: "b" },

  // === THÀNH NGỮ, TỤC NGỮ ===
  { question_text: "'Nước chảy đá mòn' có nghĩa là gì?", option_a: "Nước rất mạnh", option_b: "Đá rất yếu", option_c: "Kiên trì sẽ thành công", option_d: "Nước rất đẹp", correct_answer: "c" },
  { question_text: "'Gần mực thì đen, gần đèn thì sáng' khuyên ta điều gì?", option_a: "Mua đèn", option_b: "Tránh mực", option_c: "Ở sạch", option_d: "Chọn bạn tốt", correct_answer: "d" },
  { question_text: "'Tốt gỗ hơn tốt nước sơn' có nghĩa là?", option_a: "Nội dung quan trọng hơn hình thức", option_b: "Gỗ tốt hơn sơn", option_c: "Nên mua gỗ", option_d: "Sơn không tốt", correct_answer: "a" },
  { question_text: "'Một con ngựa đau, cả tàu bỏ cỏ' nói về điều gì?", option_a: "Ngựa bị bệnh", option_b: "Tình đoàn kết", option_c: "Không ăn cỏ", option_d: "Nuôi ngựa", correct_answer: "b" },
  { question_text: "'Học ăn, học nói, học gói, học mở' khuyên ta điều gì?", option_a: "Ăn nhiều", option_b: "Nói nhiều", option_c: "Học mọi thứ trong cuộc sống", option_d: "Mở quà", correct_answer: "c" },
  // === NGỮ PHÁP: KIỂU CÂU ===
  { question_text: "Câu nào là câu hỏi?", option_a: "Em đi học", option_b: "Hoa rất đẹp", option_c: "Trời nắng quá", option_d: "Bạn tên gì?", correct_answer: "d" },
  { question_text: "Câu nào là câu kể?", option_a: "Em đi học mỗi ngày.", option_b: "Bạn có khỏe không?", option_c: "Ôi, đẹp quá!", option_d: "Hãy ngồi xuống!", correct_answer: "a" },
  { question_text: "Câu nào là câu cảm thán?", option_a: "Em ăn cơm", option_b: "Ôi, trời đẹp quá!", option_c: "Bạn đi đâu?", option_d: "Hãy đi nhanh", correct_answer: "b" },
  { question_text: "Câu nào là câu cầu khiến?", option_a: "Trời mưa rồi", option_b: "Bạn ở đâu?", option_c: "Hãy giữ trật tự!", option_d: "Hoa nở đẹp", correct_answer: "c" },
  { question_text: "Dấu gì đặt cuối câu hỏi?", option_a: "Dấu chấm", option_b: "Dấu phẩy", option_c: "Dấu chấm than", option_d: "Dấu chấm hỏi", correct_answer: "d" },
  { question_text: "Dấu gì đặt cuối câu kể?", option_a: "Dấu chấm", option_b: "Dấu hỏi", option_c: "Dấu chấm than", option_d: "Dấu phẩy", correct_answer: "a" },
  { question_text: "Dấu gì đặt cuối câu cảm thán?", option_a: "Dấu chấm", option_b: "Dấu chấm than", option_c: "Dấu hỏi", option_d: "Dấu phẩy", correct_answer: "b" },

  // === TỪ GHÉP, TỪ LÁY ===
  { question_text: "Từ nào là từ láy?", option_a: "học sinh", option_b: "xinh xắn", option_c: "bàn ghế", option_d: "sách vở", correct_answer: "b" },
  { question_text: "Từ nào là từ láy?", option_a: "lung linh", option_b: "trường học", option_c: "cây cối", option_d: "cha mẹ", correct_answer: "a" },
  { question_text: "Từ nào là từ ghép?", option_a: "lấp lánh", option_b: "long lanh", option_c: "quần áo", option_d: "xanh xao", correct_answer: "c" },
  { question_text: "Từ nào là từ láy?", option_a: "nhà cửa", option_b: "xe cộ", option_c: "sách vở", option_d: "đỏ đắn", correct_answer: "d" },
  { question_text: "Từ nào là từ ghép?", option_a: "cha mẹ", option_b: "lấp lánh", option_c: "xinh xắn", option_d: "lung linh", correct_answer: "a" },

  // === BIỆN PHÁP TU TỪ ĐƠN GIẢN ===
  { question_text: "'Mặt trời đỏ như quả cầu lửa'. Câu này dùng biện pháp gì?", option_a: "Nhân hóa", option_b: "So sánh", option_c: "Điệp từ", option_d: "Ẩn dụ", correct_answer: "b" },
  { question_text: "'Dòng sông uốn mình qua cánh đồng'. Câu này dùng biện pháp gì?", option_a: "So sánh", option_b: "Điệp từ", option_c: "Nhân hóa", option_d: "Ẩn dụ", correct_answer: "c" },
  { question_text: "Trong câu 'Trăng tròn như cái đĩa', từ nào là từ so sánh?", option_a: "tròn", option_b: "cái đĩa", option_c: "trăng", option_d: "như", correct_answer: "d" },
  { question_text: "'Ông mặt trời thức dậy'. Câu này dùng biện pháp gì?", option_a: "Nhân hóa", option_b: "So sánh", option_c: "Điệp từ", option_d: "Ẩn dụ", correct_answer: "a" },
  { question_text: "'Mắt em tròn như hạt nhãn'. Đây là câu gì?", option_a: "Câu hỏi", option_b: "Câu so sánh", option_c: "Câu cầu khiến", option_d: "Câu cảm thán", correct_answer: "b" },

  // === ĐIỀN TỪ NÂNG CAO ===
  { question_text: "Chọn từ đúng: 'Bạn Lan ... giỏi nhất lớp.'", option_a: "học", option_b: "chơi", option_c: "ngủ", option_d: "ăn", correct_answer: "a" },
  { question_text: "Chọn từ đúng: 'Mùa thu, lá cây ... vàng.'", option_a: "mọc", option_b: "chuyển", option_c: "bay", option_d: "rơi", correct_answer: "b" },
  { question_text: "Chọn từ đúng: 'Bầu trời ... sau cơn mưa.'", option_a: "tối", option_b: "mờ", option_c: "trong xanh", option_d: "đen", correct_answer: "c" },
  { question_text: "Chọn từ đúng: 'Con sông ... hiền hòa qua làng.'", option_a: "nhảy", option_b: "bay", option_c: "chạy", option_d: "chảy", correct_answer: "d" },
  { question_text: "Chọn từ đúng: 'Tiếng chim ... vang khắp khu vườn.'", option_a: "hót", option_b: "kêu", option_c: "gào", option_d: "rít", correct_answer: "a" },

  // === THÊM CÂU ĐỌC HIỂU ===
  { question_text: "Đọc: 'Bé Na rất thích vẽ. Mỗi ngày bé đều vẽ một bức tranh. Bé mơ ước trở thành họa sĩ.' Bé Na thích gì?", option_a: "Hát", option_b: "Vẽ", option_c: "Múa", option_d: "Đọc sách", correct_answer: "b" },
  { question_text: "Đọc: 'Bé Na rất thích vẽ. Mỗi ngày bé đều vẽ một bức tranh. Bé mơ ước trở thành họa sĩ.' Bé Na muốn làm gì?", option_a: "Bác sĩ", option_b: "Giáo viên", option_c: "Họa sĩ", option_d: "Ca sĩ", correct_answer: "c" },
  { question_text: "Đọc: 'Mùa đông, gió bấc thổi mạnh. Cây cối trơ trụi lá. Mọi người mặc áo ấm.' Mùa nào được nói đến?", option_a: "Xuân", option_b: "Hạ", option_c: "Thu", option_d: "Đông", correct_answer: "d" },
  { question_text: "Đọc: 'Mùa đông, gió bấc thổi mạnh. Cây cối trơ trụi lá. Mọi người mặc áo ấm.' Mọi người mặc gì?", option_a: "Áo ấm", option_b: "Áo mưa", option_c: "Áo tắm", option_d: "Áo ngắn", correct_answer: "a" },
  { question_text: "Từ 'hiền lành' dùng để tả ai/cái gì?", option_a: "Cái bàn", option_b: "Tính cách người", option_c: "Thời tiết", option_d: "Màu sắc", correct_answer: "b" },
];
