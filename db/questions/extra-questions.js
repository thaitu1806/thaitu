// Extra questions - Câu hỏi bổ sung cho tất cả các môn và độ khó

// === TOÁN DỄ (30 câu) - Cộng trừ trong 20, đếm, so sánh, hình ===
export const extraMathEasy = [
  // Cộng trừ đơn giản
  { question_text: "3 + 5 = ?", option_a: "8", option_b: "7", option_c: "9", option_d: "6", correct_answer: "a" },
  { question_text: "4 + 6 = ?", option_a: "9", option_b: "10", option_c: "11", option_d: "8", correct_answer: "b" },
  { question_text: "7 + 5 = ?", option_a: "11", option_b: "13", option_c: "12", option_d: "10", correct_answer: "c" },
  { question_text: "6 + 8 = ?", option_a: "13", option_b: "15", option_c: "12", option_d: "14", correct_answer: "d" },
  { question_text: "9 + 4 = ?", option_a: "13", option_b: "12", option_c: "14", option_d: "11", correct_answer: "a" },
  { question_text: "11 - 3 = ?", option_a: "7", option_b: "8", option_c: "9", option_d: "6", correct_answer: "b" },
  { question_text: "14 - 8 = ?", option_a: "5", option_b: "7", option_c: "6", option_d: "4", correct_answer: "c" },
  { question_text: "17 - 9 = ?", option_a: "7", option_b: "9", option_c: "6", option_d: "8", correct_answer: "d" },
  // Đếm đồ vật
  { question_text: "Có 6 quả cam, mẹ mua thêm 4 quả. Có tất cả mấy quả?", option_a: "10", option_b: "9", option_c: "11", option_d: "8", correct_answer: "a" },
  { question_text: "Có 12 con cá, bán 5 con. Còn mấy con?", option_a: "6", option_b: "7", option_c: "8", option_d: "5", correct_answer: "b" },
  { question_text: "Có 3 con mèo trắng và 6 con mèo đen. Có tất cả mấy con?", option_a: "8", option_b: "10", option_c: "9", option_d: "7", correct_answer: "c" },
  { question_text: "Trong rổ có 13 quả trứng, bể 4 quả. Còn lại mấy quả?", option_a: "8", option_b: "10", option_c: "7", option_d: "9", correct_answer: "d" },
  // So sánh và sắp xếp
  { question_text: "Số nào lớn nhất: 11, 19, 15, 13?", option_a: "19", option_b: "15", option_c: "13", option_d: "11", correct_answer: "a" },
  { question_text: "Số nào nhỏ nhất: 16, 9, 12, 20?", option_a: "12", option_b: "9", option_c: "16", option_d: "20", correct_answer: "b" },
  { question_text: "Điền dấu: 13 ... 17", option_a: ">", option_b: "=", option_c: "<", option_d: "Không biết", correct_answer: "c" },
  { question_text: "Số liền sau số 17 là?", option_a: "16", option_b: "19", option_c: "15", option_d: "18", correct_answer: "d" },
  { question_text: "Số liền trước số 20 là?", option_a: "19", option_b: "18", option_c: "21", option_d: "17", correct_answer: "a" },
  { question_text: "Số nào đứng giữa 11 và 13?", option_a: "10", option_b: "12", option_c: "14", option_d: "11", correct_answer: "b" },
  // Hình học
  { question_text: "Mặt bàn hình gì?", option_a: "Hình tam giác", option_b: "Hình tròn", option_c: "Hình chữ nhật", option_d: "Hình vuông", correct_answer: "c" },
  { question_text: "Bánh xe hình gì?", option_a: "Hình vuông", option_b: "Hình tam giác", option_c: "Hình chữ nhật", option_d: "Hình tròn", correct_answer: "d" },
  { question_text: "Hình chữ nhật có mấy cạnh?", option_a: "4", option_b: "3", option_c: "5", option_d: "6", correct_answer: "a" },
  { question_text: "Hình nào có tất cả các cạnh bằng nhau?", option_a: "Hình chữ nhật", option_b: "Hình vuông", option_c: "Hình tam giác", option_d: "Hình tròn", correct_answer: "b" },
  // Số chẵn lẻ
  { question_text: "Số nào là số lẻ?", option_a: "4", option_b: "8", option_c: "5", option_d: "6", correct_answer: "c" },
  { question_text: "Số chẵn lớn nhất nhỏ hơn 10 là?", option_a: "7", option_b: "9", option_c: "6", option_d: "8", correct_answer: "d" },
  // Phép cộng 3 số
  { question_text: "3 + 2 + 4 = ?", option_a: "9", option_b: "8", option_c: "10", option_d: "7", correct_answer: "a" },
  { question_text: "5 + 3 + 2 = ?", option_a: "9", option_b: "10", option_c: "11", option_d: "8", correct_answer: "b" },
  { question_text: "1 + 6 + 5 = ?", option_a: "11", option_b: "10", option_c: "12", option_d: "13", correct_answer: "c" },
  { question_text: "4 + 4 + 6 = ?", option_a: "12", option_b: "13", option_c: "15", option_d: "14", correct_answer: "d" },
  { question_text: "2 + 8 + 5 = ?", option_a: "15", option_b: "14", option_c: "16", option_d: "13", correct_answer: "a" },
  { question_text: "Có 5 bạn nam và 7 bạn nữ trong lớp. Có tất cả bao nhiêu bạn?", option_a: "11", option_b: "12", option_c: "13", option_d: "10", correct_answer: "b" },
  // === CỘNG TRỪ TRONG PHẠM VI 100 (không nhớ) ===
  { question_text: "20 + 10 = ?", option_a: "30", option_b: "31", option_c: "29", option_d: "28", correct_answer: "a" },
  { question_text: "30 + 20 = ?", option_a: "40", option_b: "50", option_c: "45", option_d: "55", correct_answer: "b" },
  { question_text: "25 + 14 = ?", option_a: "38", option_b: "40", option_c: "39", option_d: "37", correct_answer: "c" },
  { question_text: "32 + 15 = ?", option_a: "46", option_b: "48", option_c: "45", option_d: "47", correct_answer: "d" },
  { question_text: "41 + 23 = ?", option_a: "64", option_b: "63", option_c: "65", option_d: "62", correct_answer: "a" },
  { question_text: "53 + 24 = ?", option_a: "76", option_b: "77", option_c: "75", option_d: "78", correct_answer: "b" },
  { question_text: "62 + 31 = ?", option_a: "92", option_b: "94", option_c: "93", option_d: "91", correct_answer: "c" },
  { question_text: "44 + 33 = ?", option_a: "76", option_b: "78", option_c: "75", option_d: "77", correct_answer: "d" },
  { question_text: "51 + 26 = ?", option_a: "77", option_b: "76", option_c: "78", option_d: "75", correct_answer: "a" },
  { question_text: "35 + 42 = ?", option_a: "76", option_b: "77", option_c: "78", option_d: "75", correct_answer: "b" },
  { question_text: "60 + 30 = ?", option_a: "80", option_b: "85", option_c: "90", option_d: "95", correct_answer: "c" },
  { question_text: "43 + 51 = ?", option_a: "93", option_b: "95", option_c: "92", option_d: "94", correct_answer: "d" },
  { question_text: "72 + 16 = ?", option_a: "88", option_b: "86", option_c: "89", option_d: "87", correct_answer: "a" },
  { question_text: "54 + 35 = ?", option_a: "88", option_b: "89", option_c: "90", option_d: "87", correct_answer: "b" },
  { question_text: "61 + 28 = ?", option_a: "88", option_b: "90", option_c: "89", option_d: "87", correct_answer: "c" },
  { question_text: "45 + 50 = ?", option_a: "90", option_b: "94", option_c: "96", option_d: "95", correct_answer: "d" },
  { question_text: "33 + 44 = ?", option_a: "77", option_b: "76", option_c: "78", option_d: "75", correct_answer: "a" },
  { question_text: "70 + 21 = ?", option_a: "90", option_b: "91", option_c: "89", option_d: "92", correct_answer: "b" },
  { question_text: "46 + 52 = ?", option_a: "97", option_b: "99", option_c: "98", option_d: "96", correct_answer: "c" },
  { question_text: "55 + 34 = ?", option_a: "88", option_b: "90", option_c: "87", option_d: "89", correct_answer: "d" },
  // Phép trừ trong phạm vi 100 (không nhớ)
  { question_text: "50 - 20 = ?", option_a: "30", option_b: "25", option_c: "35", option_d: "28", correct_answer: "a" },
  { question_text: "60 - 30 = ?", option_a: "20", option_b: "30", option_c: "25", option_d: "35", correct_answer: "b" },
  { question_text: "45 - 12 = ?", option_a: "32", option_b: "34", option_c: "33", option_d: "31", correct_answer: "c" },
  { question_text: "57 - 23 = ?", option_a: "33", option_b: "35", option_c: "32", option_d: "34", correct_answer: "d" },
  { question_text: "68 - 35 = ?", option_a: "33", option_b: "32", option_c: "34", option_d: "31", correct_answer: "a" },
  { question_text: "79 - 46 = ?", option_a: "32", option_b: "33", option_c: "34", option_d: "31", correct_answer: "b" },
  { question_text: "84 - 51 = ?", option_a: "32", option_b: "34", option_c: "33", option_d: "31", correct_answer: "c" },
  { question_text: "96 - 62 = ?", option_a: "33", option_b: "35", option_c: "32", option_d: "34", correct_answer: "d" },
  { question_text: "73 - 41 = ?", option_a: "32", option_b: "31", option_c: "33", option_d: "30", correct_answer: "a" },
  { question_text: "85 - 43 = ?", option_a: "41", option_b: "42", option_c: "43", option_d: "40", correct_answer: "b" },
  { question_text: "99 - 55 = ?", option_a: "43", option_b: "45", option_c: "44", option_d: "42", correct_answer: "c" },
  { question_text: "77 - 34 = ?", option_a: "42", option_b: "44", option_c: "41", option_d: "43", correct_answer: "d" },
  { question_text: "88 - 56 = ?", option_a: "32", option_b: "31", option_c: "33", option_d: "30", correct_answer: "a" },
  { question_text: "65 - 22 = ?", option_a: "42", option_b: "43", option_c: "44", option_d: "41", correct_answer: "b" },
  { question_text: "90 - 40 = ?", option_a: "45", option_b: "55", option_c: "50", option_d: "60", correct_answer: "c" },
  { question_text: "76 - 31 = ?", option_a: "44", option_b: "46", option_c: "43", option_d: "45", correct_answer: "d" },
  { question_text: "100 - 50 = ?", option_a: "50", option_b: "45", option_c: "55", option_d: "40", correct_answer: "a" },
  { question_text: "82 - 61 = ?", option_a: "20", option_b: "21", option_c: "19", option_d: "22", correct_answer: "b" },
  { question_text: "94 - 72 = ?", option_a: "21", option_b: "23", option_c: "22", option_d: "20", correct_answer: "c" },
  { question_text: "100 - 37 = ?", option_a: "62", option_b: "64", option_c: "61", option_d: "63", correct_answer: "d" },
];


// === TOÁN TRUNG BÌNH (30 câu) - Cộng trừ có nhớ trong 100, nhân chia, đo lường, giờ ===
export const extraMathMedium = [
  // Cộng trừ có nhớ
  { question_text: "34 + 29 = ?", option_a: "63", option_b: "62", option_c: "64", option_d: "61", correct_answer: "a" },
  { question_text: "45 + 38 = ?", option_a: "82", option_b: "83", option_c: "81", option_d: "84", correct_answer: "b" },
  { question_text: "56 + 27 = ?", option_a: "82", option_b: "84", option_c: "83", option_d: "81", correct_answer: "c" },
  { question_text: "68 + 15 = ?", option_a: "82", option_b: "84", option_c: "81", option_d: "83", correct_answer: "d" },
  { question_text: "72 - 35 = ?", option_a: "37", option_b: "36", option_c: "38", option_d: "35", correct_answer: "a" },
  { question_text: "83 - 47 = ?", option_a: "35", option_b: "36", option_c: "37", option_d: "34", correct_answer: "b" },
  { question_text: "91 - 54 = ?", option_a: "36", option_b: "38", option_c: "37", option_d: "35", correct_answer: "c" },
  { question_text: "65 - 28 = ?", option_a: "36", option_b: "38", option_c: "35", option_d: "37", correct_answer: "d" },
  // Bảng nhân
  { question_text: "3 x 7 = ?", option_a: "21", option_b: "18", option_c: "24", option_d: "15", correct_answer: "a" },
  { question_text: "4 x 6 = ?", option_a: "20", option_b: "24", option_c: "28", option_d: "16", correct_answer: "b" },
  { question_text: "5 x 8 = ?", option_a: "35", option_b: "45", option_c: "40", option_d: "30", correct_answer: "c" },
  { question_text: "2 x 9 = ?", option_a: "16", option_b: "20", option_c: "14", option_d: "18", correct_answer: "d" },
  { question_text: "4 x 8 = ?", option_a: "32", option_b: "28", option_c: "36", option_d: "24", correct_answer: "a" },
  { question_text: "5 x 6 = ?", option_a: "25", option_b: "30", option_c: "35", option_d: "20", correct_answer: "b" },
  // Phép chia
  { question_text: "18 : 2 = ?", option_a: "8", option_b: "10", option_c: "9", option_d: "7", correct_answer: "c" },
  { question_text: "24 : 3 = ?", option_a: "6", option_b: "9", option_c: "7", option_d: "8", correct_answer: "d" },
  { question_text: "28 : 4 = ?", option_a: "7", option_b: "6", option_c: "8", option_d: "5", correct_answer: "a" },
  { question_text: "45 : 5 = ?", option_a: "8", option_b: "9", option_c: "10", option_d: "7", correct_answer: "b" },
  { question_text: "16 : 4 = ?", option_a: "3", option_b: "5", option_c: "4", option_d: "6", correct_answer: "c" },
  { question_text: "27 : 3 = ?", option_a: "8", option_b: "7", option_c: "6", option_d: "9", correct_answer: "d" },
  // Đo lường
  { question_text: "3m = ? cm", option_a: "300", option_b: "30", option_c: "3000", option_d: "3", correct_answer: "a" },
  { question_text: "1m 50cm = ? cm", option_a: "105", option_b: "150", option_c: "1050", option_d: "15", correct_answer: "b" },
  { question_text: "2kg 500g = ? g", option_a: "250", option_b: "2050", option_c: "2500", option_d: "25000", correct_answer: "c" },
  { question_text: "60 phút = ? giờ", option_a: "2", option_b: "30", option_c: "6", option_d: "1", correct_answer: "d" },
  // Đọc giờ
  { question_text: "Kim ngắn chỉ số 5, kim dài chỉ số 12. Mấy giờ?", option_a: "5 giờ", option_b: "12 giờ", option_c: "5 giờ 12 phút", option_d: "12 giờ 5 phút", correct_answer: "a" },
  { question_text: "Kim ngắn chỉ giữa 10 và 11, kim dài chỉ số 6. Mấy giờ?", option_a: "6 giờ 10 phút", option_b: "10 giờ 30 phút", option_c: "11 giờ 30 phút", option_d: "10 giờ 6 phút", correct_answer: "b" },
  { question_text: "2 giờ = ? phút", option_a: "60", option_b: "100", option_c: "120", option_d: "90", correct_answer: "c" },
  { question_text: "Từ 8 giờ đến 10 giờ là mấy giờ?", option_a: "1 giờ", option_b: "3 giờ", option_c: "4 giờ", option_d: "2 giờ", correct_answer: "d" },
  // Bài toán có lời văn
  { question_text: "Mẹ mua 4 túi kẹo, mỗi túi có 5 cái. Mẹ mua tất cả mấy cái kẹo?", option_a: "20", option_b: "15", option_c: "25", option_d: "9", correct_answer: "a" },
  { question_text: "Có 36 học sinh chia đều thành 4 nhóm. Mỗi nhóm có mấy bạn?", option_a: "8", option_b: "9", option_c: "10", option_d: "7", correct_answer: "b" },
];


// === TOÁN KHÓ (30 câu) - Tìm số, quy luật, toán đố 2 bước, tính nhanh, logic ===
export const extraMathHard = [
  // Tìm số thiếu
  { question_text: "? + 15 = 32. Số cần tìm là?", option_a: "17", option_b: "16", option_c: "18", option_d: "15", correct_answer: "a" },
  { question_text: "48 - ? = 19. Số cần tìm là?", option_a: "28", option_b: "29", option_c: "30", option_d: "27", correct_answer: "b" },
  { question_text: "? x 4 = 28. Số cần tìm là?", option_a: "6", option_b: "8", option_c: "7", option_d: "9", correct_answer: "c" },
  { question_text: "? : 5 = 6. Số cần tìm là?", option_a: "25", option_b: "35", option_c: "11", option_d: "30", correct_answer: "d" },
  { question_text: "? + 27 = 50. Số cần tìm là?", option_a: "23", option_b: "22", option_c: "24", option_d: "25", correct_answer: "a" },
  { question_text: "63 - ? = 28. Số cần tìm là?", option_a: "34", option_b: "35", option_c: "36", option_d: "33", correct_answer: "b" },
  // Quy luật dãy số
  { question_text: "Dãy số: 2, 4, 6, 8, ? Số tiếp theo là?", option_a: "9", option_b: "11", option_c: "10", option_d: "12", correct_answer: "c" },
  { question_text: "Dãy số: 5, 10, 15, 20, ? Số tiếp theo là?", option_a: "30", option_b: "22", option_c: "24", option_d: "25", correct_answer: "d" },
  { question_text: "Dãy số: 1, 3, 5, 7, ? Số tiếp theo là?", option_a: "9", option_b: "8", option_c: "10", option_d: "11", correct_answer: "a" },
  { question_text: "Dãy số: 3, 6, 9, 12, ? Số tiếp theo là?", option_a: "14", option_b: "15", option_c: "16", option_d: "13", correct_answer: "b" },
  { question_text: "Dãy số: 20, 18, 16, 14, ? Số tiếp theo là?", option_a: "10", option_b: "11", option_c: "12", option_d: "13", correct_answer: "c" },
  { question_text: "Dãy số: 4, 8, 12, 16, ? Số tiếp theo là?", option_a: "18", option_b: "22", option_c: "24", option_d: "20", correct_answer: "d" },
  // Toán đố 2 bước
  { question_text: "An có 25 viên bi, An cho Bình 8 viên rồi mua thêm 5 viên. An có mấy viên bi?", option_a: "22", option_b: "20", option_c: "18", option_d: "23", correct_answer: "a" },
  { question_text: "Mẹ mua 3 hộp bánh, mỗi hộp 4 cái. Mẹ cho em 2 cái. Mẹ còn mấy cái?", option_a: "9", option_b: "10", option_c: "11", option_d: "8", correct_answer: "b" },
  { question_text: "Lớp có 32 bạn, có 5 bạn nghỉ, cuối giờ thêm 3 bạn đến muộn. Lớp có mấy bạn?", option_a: "29", option_b: "31", option_c: "30", option_d: "28", correct_answer: "c" },
  { question_text: "Có 40 quả táo chia đều cho 5 bạn. Mỗi bạn ăn 2 quả. Mỗi bạn còn mấy quả?", option_a: "5", option_b: "4", option_c: "7", option_d: "6", correct_answer: "d" },
  // Tính nhanh
  { question_text: "25 + 36 + 14 = ?", option_a: "75", option_b: "74", option_c: "76", option_d: "73", correct_answer: "a" },
  { question_text: "48 + 25 - 13 = ?", option_a: "59", option_b: "60", option_c: "61", option_d: "58", correct_answer: "b" },
  { question_text: "5 x 4 + 12 = ?", option_a: "30", option_b: "33", option_c: "32", option_d: "31", correct_answer: "c" },
  { question_text: "3 x 9 - 7 = ?", option_a: "19", option_b: "21", option_c: "18", option_d: "20", correct_answer: "d" },
  { question_text: "100 - 45 - 25 = ?", option_a: "30", option_b: "28", option_c: "32", option_d: "35", correct_answer: "a" },
  { question_text: "4 x 5 + 3 x 5 = ?", option_a: "30", option_b: "35", option_c: "40", option_d: "25", correct_answer: "b" },
  // Logic
  { question_text: "Có bao nhiêu số có 2 chữ số mà cả hai chữ số đều giống nhau?", option_a: "8", option_b: "10", option_c: "9", option_d: "11", correct_answer: "c" },
  { question_text: "Tổng của số lớn nhất có 1 chữ số và số nhỏ nhất có 2 chữ số là?", option_a: "18", option_b: "11", option_c: "20", option_d: "19", correct_answer: "d" },
  { question_text: "Hiệu của số lớn nhất có 2 chữ số và số nhỏ nhất có 2 chữ số là?", option_a: "89", option_b: "90", option_c: "88", option_d: "91", correct_answer: "a" },
  { question_text: "Một hình vuông có cạnh 3cm. Chu vi hình vuông là?", option_a: "6cm", option_b: "12cm", option_c: "9cm", option_d: "15cm", correct_answer: "b" },
  { question_text: "Lan hơn Hoa 5 tuổi. Hoa 7 tuổi. Hỏi Lan mấy tuổi?", option_a: "11", option_b: "2", option_c: "12", option_d: "10", correct_answer: "c" },
  { question_text: "Một hình chữ nhật có chiều dài 5cm, chiều rộng 3cm. Chu vi là?", option_a: "8cm", option_b: "15cm", option_c: "10cm", option_d: "16cm", correct_answer: "d" },
  { question_text: "Có 5 hàng ghế, mỗi hàng 4 ghế. Có tất cả bao nhiêu ghế?", option_a: "20", option_b: "9", option_c: "15", option_d: "25", correct_answer: "a" },
  { question_text: "Số nào cộng với chính nó bằng 18?", option_a: "8", option_b: "9", option_c: "10", option_d: "7", correct_answer: "b" },
];


// === TIẾNG VIỆT DỄ (30 câu) - Chính tả, vần, đếm tiếng, từ vựng cơ bản ===
export const extraVietEasy = [
  // Chính tả l/n
  { question_text: "Từ nào viết đúng chính tả?", option_a: "lước uống", option_b: "nắng nóng", option_c: "lắng lóng", option_d: "nàm việc", correct_answer: "b" },
  { question_text: "Điền l hoặc n: '...á cây'", option_a: "nà", option_b: "là", option_c: "lá", option_d: "ná", correct_answer: "c" },
  { question_text: "Từ nào viết đúng?", option_a: "lăm nay", option_b: "lăm lay", option_c: "năm lay", option_d: "năm nay", correct_answer: "d" },
  { question_text: "Điền l hoặc n: '...ước mắm'", option_a: "nước", option_b: "lước", option_c: "Nước", option_d: "Lước", correct_answer: "a" },
  // Chính tả s/x
  { question_text: "Từ nào viết đúng: 'con ..ẻ'?", option_a: "sẻ", option_b: "xẻ", option_c: "se", option_d: "xe", correct_answer: "a" },
  { question_text: "Điền s hoặc x: '...e đạp'", option_a: "se", option_b: "xe", option_c: "sẹ", option_d: "xẹ", correct_answer: "b" },
  { question_text: "Từ nào viết đúng: '...ách vở'?", option_a: "xách", option_b: "xach", option_c: "sách", option_d: "sach", correct_answer: "c" },
  { question_text: "Điền s hoặc x: '...uân'", option_a: "Suan", option_b: "Xuan", option_c: "Suân", option_d: "Xuân", correct_answer: "d" },
  // Chính tả ch/tr
  { question_text: "Từ nào viết đúng: '...ời mưa'?", option_a: "trời", option_b: "chời", option_c: "troi", option_d: "choi", correct_answer: "a" },
  { question_text: "Điền ch hoặc tr: '...iếc lá'", option_a: "triếc", option_b: "chiếc", option_c: "triêc", option_d: "chiêc", correct_answer: "b" },
  { question_text: "Từ nào viết đúng: '...ung thực'?", option_a: "chung", option_b: "Chung", option_c: "trung", option_d: "Trung", correct_answer: "c" },
  { question_text: "Điền ch hoặc tr: '...ăm chỉ'", option_a: "trăm", option_b: "Trăm", option_c: "Chăm", option_d: "chăm", correct_answer: "d" },
  // Vần và ghép vần
  { question_text: "Chữ 'm' ghép với vần 'ưa' thành?", option_a: "mưa", option_b: "mừa", option_c: "múa", option_d: "mựa", correct_answer: "a" },
  { question_text: "Chữ 'đ' ghép với vần 'ẹp' thành?", option_a: "đẹn", option_b: "đẹp", option_c: "đep", option_d: "đepp", correct_answer: "b" },
  { question_text: "Từ 'bướm' có vần gì?", option_a: "ươn", option_b: "ươi", option_c: "ươm", option_d: "ước", correct_answer: "c" },
  { question_text: "Từ 'trường' có vần gì?", option_a: "ương", option_b: "ưởng", option_c: "uông", option_d: "ường", correct_answer: "d" },
  // Đếm tiếng (âm tiết)
  { question_text: "Từ 'hoa hồng' có mấy tiếng?", option_a: "2", option_b: "3", option_c: "1", option_d: "4", correct_answer: "a" },
  { question_text: "Câu 'Em đi học' có mấy tiếng?", option_a: "2", option_b: "3", option_c: "4", option_d: "1", correct_answer: "b" },
  { question_text: "Từ 'con bướm vàng' có mấy tiếng?", option_a: "2", option_b: "4", option_c: "3", option_d: "5", correct_answer: "c" },
  { question_text: "Câu 'Mẹ em rất đẹp' có mấy tiếng?", option_a: "3", option_b: "3", option_c: "5", option_d: "4", correct_answer: "d" },
  // Từ vựng cơ bản
  { question_text: "Con vật nào biết bay?", option_a: "Chim", option_b: "Cá", option_c: "Mèo", option_d: "Chó", correct_answer: "a" },
  { question_text: "Quả nào có màu vàng?", option_a: "Dưa hấu", option_b: "Chuối", option_c: "Nho", option_d: "Mận", correct_answer: "b" },
  { question_text: "Mùa nào nóng nhất?", option_a: "Mùa xuân", option_b: "Mùa đông", option_c: "Mùa hè", option_d: "Mùa thu", correct_answer: "c" },
  { question_text: "Bộ phận nào dùng để nghe?", option_a: "Mắt", option_b: "Mũi", option_c: "Miệng", option_d: "Tai", correct_answer: "d" },
  { question_text: "Con vật nào sống dưới nước?", option_a: "Cá", option_b: "Gà", option_c: "Chim", option_d: "Bò", correct_answer: "a" },
  { question_text: "Tháng nào có Tết Nguyên Đán?", option_a: "Tháng 3", option_b: "Tháng 1 âm lịch", option_c: "Tháng 12", option_d: "Tháng 9", correct_answer: "b" },
  // Từ chỉ màu sắc
  { question_text: "Lá cây thường có màu gì?", option_a: "Đỏ", option_b: "Vàng", option_c: "Xanh", option_d: "Trắng", correct_answer: "c" },
  { question_text: "Bầu trời ban ngày có màu gì?", option_a: "Đen", option_b: "Trắng", option_c: "Đỏ", option_d: "Xanh", correct_answer: "d" },
  { question_text: "Từ nào chỉ màu sắc?", option_a: "Tím", option_b: "To", option_c: "Cao", option_d: "Nhanh", correct_answer: "a" },
  { question_text: "Mặt trời có màu gì?", option_a: "Xanh", option_b: "Đỏ (vàng)", option_c: "Trắng", option_d: "Tím", correct_answer: "b" },
];


// === TIẾNG VIỆT TRUNG BÌNH (30 câu) - Trái nghĩa, đồng nghĩa, điền từ, phân loại từ, sắp xếp câu ===
export const extraVietMedium = [
  // Trái nghĩa
  { question_text: "Từ trái nghĩa với 'nóng' là?", option_a: "lạnh", option_b: "ấm", option_c: "mát", option_d: "nắng", correct_answer: "a" },
  { question_text: "Từ trái nghĩa với 'cao' là?", option_a: "to", option_b: "thấp", option_c: "nhỏ", option_d: "lớn", correct_answer: "b" },
  { question_text: "Từ trái nghĩa với 'sáng' là?", option_a: "trắng", option_b: "đẹp", option_c: "tối", option_d: "mờ", correct_answer: "c" },
  { question_text: "Từ trái nghĩa với 'nhanh' là?", option_a: "chạy", option_b: "mạnh", option_c: "khỏe", option_d: "chậm", correct_answer: "d" },
  { question_text: "Từ trái nghĩa với 'dài' là?", option_a: "ngắn", option_b: "rộng", option_c: "hẹp", option_d: "nhỏ", correct_answer: "a" },
  { question_text: "Từ trái nghĩa với 'khóc' là?", option_a: "buồn", option_b: "cười", option_c: "vui", option_d: "hát", correct_answer: "b" },
  // Đồng nghĩa
  { question_text: "Từ nào có nghĩa giống 'xinh đẹp'?", option_a: "xấu xí", option_b: "to lớn", option_c: "đẹp đẽ", option_d: "dễ thương", correct_answer: "c" },
  { question_text: "Từ nào có nghĩa giống 'vui vẻ'?", option_a: "buồn bã", option_b: "lo lắng", option_c: "bực bội", option_d: "vui mừng", correct_answer: "d" },
  { question_text: "Từ nào có nghĩa giống 'chăm chỉ'?", option_a: "siêng năng", option_b: "lười biếng", option_c: "mệt mỏi", option_d: "vui vẻ", correct_answer: "a" },
  { question_text: "Từ nào có nghĩa giống 'bé nhỏ'?", option_a: "to lớn", option_b: "nhỏ bé", option_c: "cao to", option_d: "khổng lồ", correct_answer: "b" },
  // Điền từ vào chỗ trống
  { question_text: "Điền từ: 'Con mèo ... rất nhanh'", option_a: "bay", option_b: "bơi", option_c: "chạy", option_d: "bò", correct_answer: "c" },
  { question_text: "Điền từ: 'Hoa hồng rất ...'", option_a: "chua", option_b: "mặn", option_c: "xấu", option_d: "thơm", correct_answer: "d" },
  { question_text: "Điền từ: 'Bầu trời ... xanh'", option_a: "rất", option_b: "không", option_c: "chưa", option_d: "đã", correct_answer: "a" },
  { question_text: "Điền từ: 'Em bé đang ... sữa'", option_a: "ăn", option_b: "uống", option_c: "ngủ", option_d: "chơi", correct_answer: "b" },
  // Phân loại từ (danh từ / động từ / tính từ)
  { question_text: "Từ nào là danh từ (chỉ sự vật)?", option_a: "chạy", option_b: "đẹp", option_c: "bàn", option_d: "nhanh", correct_answer: "c" },
  { question_text: "Từ nào là động từ (chỉ hành động)?", option_a: "cây", option_b: "nhà", option_c: "to", option_d: "đọc", correct_answer: "d" },
  { question_text: "Từ nào là tính từ (chỉ đặc điểm)?", option_a: "đẹp", option_b: "sách", option_c: "viết", option_d: "bạn", correct_answer: "a" },
  { question_text: "Từ nào là danh từ?", option_a: "hát", option_b: "trường", option_c: "xanh", option_d: "chạy", correct_answer: "b" },
  { question_text: "Từ nào là động từ?", option_a: "lớn", option_b: "nhỏ", option_c: "nhảy", option_d: "đỏ", correct_answer: "c" },
  { question_text: "Từ nào là tính từ?", option_a: "ăn", option_b: "uống", option_c: "ngủ", option_d: "ngoan", correct_answer: "d" },
  // Sắp xếp câu
  { question_text: "Sắp xếp thành câu đúng: 'học / Em / chăm chỉ'", option_a: "Em học chăm chỉ", option_b: "Chăm chỉ em học", option_c: "Học em chăm chỉ", option_d: "Em chăm chỉ học", correct_answer: "a" },
  { question_text: "Sắp xếp thành câu đúng: 'rất / Bông hoa / đẹp'", option_a: "Rất bông hoa đẹp", option_b: "Bông hoa rất đẹp", option_c: "Đẹp rất bông hoa", option_d: "Bông hoa đẹp rất", correct_answer: "b" },
  { question_text: "Sắp xếp thành câu đúng: 'ở / Con mèo / nhà / ngủ'", option_a: "Nhà con mèo ở ngủ", option_b: "Ở nhà ngủ con mèo", option_c: "Con mèo ngủ ở nhà", option_d: "Ngủ con mèo ở nhà", correct_answer: "c" },
  { question_text: "Sắp xếp thành câu đúng: 'trên / chim / Đàn / bay / trời'", option_a: "Trời bay đàn chim trên", option_b: "Chim đàn bay trên trời", option_c: "Bay trên trời đàn chim", option_d: "Đàn chim bay trên trời", correct_answer: "d" },
  // Từ loại
  { question_text: "Nhóm từ nào cùng chỉ con vật?", option_a: "gà, vịt, chó", option_b: "gà, bàn, mèo", option_c: "cá, hoa, ong", option_d: "chó, cây, bò", correct_answer: "a" },
  { question_text: "Nhóm từ nào cùng chỉ đồ vật?", option_a: "bút, mèo, vở", option_b: "bàn, ghế, tủ", option_c: "sách, chim, bút", option_d: "vở, cá, bàn", correct_answer: "b" },
  { question_text: "Nhóm từ nào cùng chỉ hoa quả?", option_a: "cam, gà, xoài", option_b: "táo, bàn, chuối", option_c: "cam, xoài, chuối", option_d: "nho, chó, bưởi", correct_answer: "c" },
  { question_text: "Từ nào không cùng nhóm: mèo, chó, bàn, gà?", option_a: "mèo", option_b: "chó", option_c: "gà", option_d: "bàn", correct_answer: "d" },
  { question_text: "Từ nào không cùng nhóm: đỏ, xanh, vàng, chạy?", option_a: "chạy", option_b: "đỏ", option_c: "xanh", option_d: "vàng", correct_answer: "a" },
  { question_text: "Từ nào không cùng nhóm: ăn, uống, đẹp, ngủ?", option_a: "ăn", option_b: "đẹp", option_c: "uống", option_d: "ngủ", correct_answer: "b" },
];


// === TIẾNG VIỆT KHÓ (30 câu) - Lỗi chính tả, đọc hiểu, tục ngữ, ngữ pháp, biện pháp tu từ ===
export const extraVietHard = [
  // Tìm lỗi chính tả
  { question_text: "Câu nào viết đúng chính tả?", option_a: "Em chăm chỉ học bài", option_b: "Em trăm trỉ học bài", option_c: "Em chăm trỉ học bài", option_d: "Em trăm chỉ học bài", correct_answer: "a" },
  { question_text: "Từ nào viết SAI chính tả?", option_a: "sạch sẽ", option_b: "xạch xẽ", option_c: "sáng sủa", option_d: "sắp xếp", correct_answer: "b" },
  { question_text: "Câu nào viết đúng chính tả?", option_a: "Nời nói của cô rất hay", option_b: "Lời lói của cô rất hay", option_c: "Lời nói của cô rất hay", option_d: "Nời lói của cô rất hay", correct_answer: "c" },
  { question_text: "Từ nào viết SAI chính tả?", option_a: "trung thực", option_b: "chân thật", option_c: "siêng năng", option_d: "chung thực", correct_answer: "d" },
  { question_text: "Câu nào viết đúng chính tả?", option_a: "Con trâu cày ruộng", option_b: "Con châu cày ruộng", option_c: "Con trâu cài ruộng", option_d: "Con châu cài ruộng", correct_answer: "a" },
  { question_text: "Từ nào viết SAI chính tả?", option_a: "xinh đẹp", option_b: "sông nước", option_c: "sung sướng", option_d: "xông nước", correct_answer: "d" },
  // Đọc hiểu
  { question_text: "'Mỗi sáng, Lan dậy sớm tập thể dục rồi ăn sáng.' Lan làm gì trước khi ăn sáng?", option_a: "Đi học", option_b: "Đọc sách", option_c: "Tập thể dục", option_d: "Xem tivi", correct_answer: "c" },
  { question_text: "'Trời mưa to, các bạn không ra sân chơi.' Tại sao các bạn không ra sân?", option_a: "Vì trời nóng", option_b: "Vì bận học", option_c: "Vì mệt", option_d: "Vì trời mưa", correct_answer: "d" },
  { question_text: "'Nam là học sinh giỏi nhất lớp. Bạn ấy luôn giúp đỡ các bạn.' Nam là người thế nào?", option_a: "Giỏi và tốt bụng", option_b: "Lười biếng", option_c: "Nghịch ngợm", option_d: "Nhút nhát", correct_answer: "a" },
  { question_text: "'Mùa xuân, hoa đào nở rộ khắp vườn.' Hoa đào nở vào mùa nào?", option_a: "Mùa hè", option_b: "Mùa xuân", option_c: "Mùa thu", option_d: "Mùa đông", correct_answer: "b" },
  // Tục ngữ, thành ngữ
  { question_text: "Hoàn thành câu: 'Có công mài sắt, có ngày ...'", option_a: "nên vàng", option_b: "thành công", option_c: "nên kim", option_d: "hết khổ", correct_answer: "c" },
  { question_text: "Hoàn thành câu: 'Tốt gỗ hơn tốt ...'", option_a: "vàng", option_b: "bạc", option_c: "tiền", option_d: "nước sơn", correct_answer: "d" },
  { question_text: "Câu 'Gần mực thì đen, gần đèn thì sáng' khuyên ta điều gì?", option_a: "Chọn bạn tốt mà chơi", option_b: "Phải học giỏi", option_c: "Phải chăm chỉ", option_d: "Phải ngoan ngoãn", correct_answer: "a" },
  { question_text: "'Ăn quả nhớ kẻ trồng cây' có nghĩa là gì?", option_a: "Phải trồng cây", option_b: "Phải biết ơn", option_c: "Phải ăn nhiều", option_d: "Phải nhớ lâu", correct_answer: "b" },
  // Ngữ pháp (chủ ngữ / vị ngữ)
  { question_text: "Trong câu 'Bạn Lan hát rất hay', chủ ngữ là gì?", option_a: "hát rất hay", option_b: "rất hay", option_c: "Bạn Lan", option_d: "Lan hát", correct_answer: "c" },
  { question_text: "Trong câu 'Con mèo đang ngủ', vị ngữ là gì?", option_a: "Con mèo", option_b: "mèo đang", option_c: "con", option_d: "đang ngủ", correct_answer: "d" },
  { question_text: "Trong câu 'Cô giáo giảng bài', chủ ngữ là gì?", option_a: "Cô giáo", option_b: "giảng bài", option_c: "bài", option_d: "giảng", correct_answer: "a" },
  { question_text: "Trong câu 'Trời đang mưa', vị ngữ là gì?", option_a: "Trời", option_b: "đang mưa", option_c: "mưa", option_d: "đang", correct_answer: "b" },
  { question_text: "Câu nào đặt đúng dấu chấm?", option_a: "Em đi. học mỗi ngày", option_b: "Em đi học. mỗi ngày", option_c: "Em đi học mỗi ngày.", option_d: "Em. đi học mỗi ngày", correct_answer: "c" },
  { question_text: "Câu nào là câu hỏi?", option_a: "Em thích ăn kem", option_b: "Em đi học nhé", option_c: "Hôm nay trời đẹp", option_d: "Bạn tên gì?", correct_answer: "d" },
  // Biện pháp tu từ (so sánh)
  { question_text: "'Mặt trời đỏ như quả cầu lửa' là câu có biện pháp gì?", option_a: "So sánh", option_b: "Nhân hóa", option_c: "Điệp từ", option_d: "Đảo ngữ", correct_answer: "a" },
  { question_text: "'Dòng sông hiền hòa chảy' - từ 'hiền hòa' là biện pháp gì?", option_a: "So sánh", option_b: "Nhân hóa", option_c: "Điệp từ", option_d: "Ẩn dụ", correct_answer: "b" },
  { question_text: "Trong câu 'Em vẽ đẹp như tranh', từ so sánh là từ nào?", option_a: "đẹp", option_b: "tranh", option_c: "như", option_d: "vẽ", correct_answer: "c" },
  { question_text: "'Ông mặt trời thức dậy' - 'mặt trời' được gọi là gì?", option_a: "danh từ", option_b: "tính từ", option_c: "động từ", option_d: "nhân hóa", correct_answer: "d" },
  // Từ ghép, từ láy
  { question_text: "Từ nào là từ láy?", option_a: "lung linh", option_b: "xe đạp", option_c: "cây cối", option_d: "hoa quả", correct_answer: "a" },
  { question_text: "Từ nào là từ ghép?", option_a: "lấp lánh", option_b: "quần áo", option_c: "xinh xắn", option_d: "long lanh", correct_answer: "b" },
  { question_text: "Từ nào là từ láy?", option_a: "học hành", option_b: "sách vở", option_c: "xanh xao", option_d: "bàn ghế", correct_answer: "c" },
  { question_text: "Từ nào là từ ghép?", option_a: "mênh mông", option_b: "bao la", option_c: "lênh đênh", option_d: "nhà cửa", correct_answer: "d" },
  { question_text: "Dấu phẩy dùng để làm gì trong câu?", option_a: "Ngăn cách các bộ phận", option_b: "Kết thúc câu", option_c: "Đặt câu hỏi", option_d: "Thể hiện cảm xúc", correct_answer: "a" },
  { question_text: "Dấu chấm hỏi đặt cuối câu nào?", option_a: "Câu kể", option_b: "Câu hỏi", option_c: "Câu cảm", option_d: "Câu khiến", correct_answer: "b" },
];
