// Generate 550 sticker entries matching the 5 sprite sheets
// Run: node scripts/gen-stickers-550.js > /dev/null
// This outputs the JS array to paste into collection.js

const SHEET_DATA = [
  // Sheet 1: Animals & Sea (110)
  ['Cún Con','Mèo Mướp','Thỏ Trắng','Gấu Trúc','Cáo Lửa','Hổ Con','Sư Tử','Rồng Con','Gấu Koala','Ếch Xanh',
   'Khỉ Con','Gấu Nâu','Chim Cánh Cụt','Chim Sẻ','Cú Mèo','Đại Bàng','Sói Xám','Kỳ Lân','Voi Lớn','Hươu Cao Cổ',
   'Nai Nhỏ','Chuột Hamster','Nhím','Vẹt','Hồng Hạc','Gấu Mèo','Ngựa Vằn','Hà Mã','Cá Sấu','Tắc Kè Hoa',
   'Cá Vàng','Rùa Biển','Bạch Tuộc','Cá Mập','Cá Voi Xanh','Cua Đỏ','Vỏ Sò','Mực Ống','Cá Nóc','Tôm',
   'Cá Heo','Tôm Hùm','Sứa','Cá Ngựa','Sao Biển','Cá Hề','Cá Đuối','Kỳ Lân Biển','Cá Voi Sát Thủ','Cá Lồng Đèn',
   'San Hô','Ốc Mượn Hồn','Cầu Gai','Ốc Anh Vũ','Lợn Biển','Hải Mã','Hải Cẩu','Bồ Nông','Hải Âu','Hải Đăng',
   'Tàu Cướp Biển','Mỏ Neo','Rương Kho Báu','La Bàn','Cuộn Bản Đồ','Mũ Lặn','Tàu Ngầm','Đinh Ba','Đuôi Tiên Cá','Ngọc Trai',
   'T-Rex','Brachiosaurus','Triceratops','Stegosaurus','Thằn Lằn Bay','Raptor','Ankylosaurus','Spinosaurus','Trứng Khủng Long','Dấu Chân KL',
   'Xương Hóa Thạch','Hổ Phách','Núi Lửa','Thiên Thạch','Gậy Người Hang','Hổ Răng Kiếm','Voi Ma Mút','Chim Dodo','Ốc Hóa Thạch','Cuốc KH',
   'Phượng Hoàng','Gryphon','Cerberus','Ngựa Có Cánh','Kraken','Người Tuyết','Chim Sấm','Thằn Lằn Chúa','Chimera','Hydra',
   'Rồng Tiên','Rồng Băng','Rồng Lửa','Rồng Bóng Tối','Rồng Vàng','Rồng Pha Lê','Rồng Thiên Nhiên','Rồng Bão','Rồng Trăng','Rồng Mặt Trời'],
  // Sheet 2: Space & Weather & Nature (110)
  ['Tên Lửa','Ngôi Sao Vàng','Sao Thổ','Trăng Lưỡi Liềm','Sao Chổi','Đĩa Bay','Trái Đất','Mặt Trời','Sao Băng','Kính Viễn Vọng',
   'Phi Hành Gia','Vệ Tinh','Trạm Vũ Trụ','Xe Mặt Trăng','Người Ngoài HL','Hố Đen','Tinh Vân','Chòm Sao','Sao Hỏa','Sao Mộc',
   'Mưa Sao Băng','Nhật Thực','Nguyệt Thực','Thiên Hà','Tàu Con Thoi','Tiểu Hành Tinh','Module Mặt Trăng','Kính Hubble','Pin MT','Robot Thám Hiểm',
   'Giông Bão','Lốc Xoáy','Bông Tuyết','Mây Trắng','Sóng Biển','Sét','Lửa Trại','Giọt Nước','Nắng Đẹp','Mưa Phùn',
   'Cầu Vồng','Cực Quang','Mưa Đá','Sương Mù','Bão Cát','Sóng Thần','Tinh Thể Băng','Gió Xoáy','Khí Nóng','Sương Mai',
   'Hoa Anh Đào','Hoa Hồng','Hướng Dương','Hoa Tulip','Hoa Sen','Hoa Oải Hương','Hoa Cúc','Hoa Lan','Hoa Loa Kèn','Hoa Vạn Thọ',
   'Cỏ May Mắn','Cỏ Ba Lá','Tre','Bonsai','Cọ','Thông','Sồi','Lá Phong','Liễu','Bao Báp',
   'Nấm Đỏ','Xương Rồng','Bẫy Ruồi','Dương Xỉ','Quả Sồi','Quả Thông','Dừa','Mầm Non','Bồ Công Anh','Dây Thường Xuân',
   'Bướm Xanh','Bọ Rùa','Ong Mật','Chuồn Chuồn','Đom Đóm','Sâu Bướm','Châu Chấu','Kiến','Nhện','Bọ Cánh Cứng Vàng',
   'Ốc Sên','Giun Đất','Bọ Ngựa','Bướm Đêm','Ve Sầu','Rết','Bọ Que','Bọ Cạp','Cuốn Chiếu','Bọ Hung',
   'Chim Ruồi','Công','Chim Toucan','Bói Cá','Chim Cổ Đỏ','Hồng Y','Chim Ác Là','Giẻ Xanh','Vẹt Mào','Chim Kiwi'],
  // Sheet 3: Food & Fruits & Sweets (110)
  ['Bánh Donut','Kem Ốc Quế','Dâu Tây','Pizza','Bánh Sinh Nhật','Bánh Quy','Kẹo Mút','Sô-cô-la','Cupcake Hồng','Bắp Rang',
   'Trà Sữa','Hamburger','Taco','Bánh Phô Mai','Bánh Sừng Bò','Sushi','Trà Bong Bóng','Dango','Khoai Chiên','Hotdog',
   'Pretzel','Waffle','Pancake','Cuộn Quế','Macaron','Kẹo Gậy','Gấu Kẹo Dẻo','Kẹo Bông','Cake Pop','Churro',
   'Mì Ramen','Sủi Cảo','Onigiri','Chả Giò','Dim Sum','Cơm Cà Ri','Pad Thái','Phở','Bibimbap','Sashimi',
   'Táo Đỏ','Cam','Chanh Vàng','Nho','Dưa Hấu','Đào','Kiwi','Dứa','Xoài','Việt Quất',
   'Cherry','Dừa','Chuối','Ô Liu','Bơ','Lựu','Thanh Long','Chanh Dây','Vải','Sung',
   'Cà Rốt','Bông Cải','Ngô','Ớt Chuông','Cà Tím','Bí Ngô','Cà Chua','Hành','Tỏi','Ớt',
   'Lọ Mứt','Bình Mật Ong','Siro Cây Phong','Hộp Sữa','Hộp Nước Ép','Sinh Tố','Cacao Nóng','Cà Phê','Trà Matcha','Trà Sữa Trân Châu',
   'Mũ Đầu Bếp','Chảo','Phới','Cán Bột','Găng Tay Lò','Bát Trộn','Cốc Đo','Xẻng','Tạp Dề','Sách Nấu Ăn',
   'Giỏ Picnic','Kẹo Nướng','Lò Nướng BBQ','Ly Nước','Đũa','Dao Dĩa','Khăn Ăn','Bảng Menu','Hũ Tip','Chuông Phục Vụ',
   'Người Gừng','Pudding Noel','Trứng Phục Sinh','Bánh Trung Thu','Mochi','Baklava','Tiramisu','Croffle','Taiyaki','Bingsu'],
  // Sheet 4: Vehicles & Sports & Music & Toys (110)
  ['Ô Tô Đỏ','Xe Cứu Hỏa','Trực Thăng','Thuyền Buồm','Khinh Khí Cầu','Xe Lửa Hơi Nước','Phi Thuyền','Xe Đua F1','Xe Đạp','Máy Bay Cánh Quạt',
   'Máy Cày','Xe Buýt','Thuyền Kayak','Ngựa Gỗ','Mô Tô','Xe Tải Quái Vật','Xe Cấp Cứu','Xe Cảnh Sát','Taxi','Xe Kem',
   'Tàu Cướp Biển','Tàu Du Lịch','Mô Tô Nước','Tàu Đệm Khí','Cáp Treo','Tàu Cao Tốc','Máy Bay Đôi','Khinh Khí Cầu Zeppelin','Ván Trượt','Xe Scooter',
   'Bóng Đá','Bóng Rổ','Bóng Chuyền','Bóng Tennis','Bóng Bàn','Găng Boxing','Huy Chương Vàng','Bia Phi Tiêu','Cầu Lông','Giày Trượt Băng',
   'Ván Trượt Tuyết','Lướt Sóng','Dụng Cụ Leo Núi','Dải Thể Dục','Bowling','Cúp Vàng','Gậy Bóng Chày','Gậy Hockey','Bóng Rugby','Gậy Golf',
   'Kính Bơi','Cung Tên','Kiếm Đấu','Đai Karate','Tạ','Xe BMX','Ván Trượt Trick','Bạt Nhún','Nhảy Dây','Lắc Vòng',
   'Nốt Nhạc','Guitar Điện','Kèn Trumpet','Bộ Trống','Piano','Violon','Micro','Saxophone','Đàn Harp','Accordion',
   'Tai Nghe','Đĩa Than','Boombox','Bàn DJ','Maracas','Trống Lắc','Sáo','Ukulele','Banjo','Xylophone',
   'Gấu Bông','Xúc Xắc Đôi','Mảnh Ghép','Diều','Lều Xiếc','Đu Quay','Tàu Lượn','Yo-yo','Robot Đồ Chơi','Tay Cầm Game',
   'Búp Bê Nga','Quả Cầu 8','Rubik','Lính Chì','Hộp Bật','Con Quay','Bi Ve','Kính Vạn Hoa','Quả Cầu Tuyết','Hộp Nhạc',
   'Gạch LEGO','Xe Lửa Đồ Chơi','Ngựa Bập Bênh','Máy Bay Giấy','Hạc Giấy','Khối ABC','Rối Ngón Tay','Rối Vớ','Chong Chóng','Trống Đồ Chơi'],
  // Sheet 5: Treasures & Jobs & Magic & Symbols (110)
  ['Vương Miện Vàng','Kim Cương','Cúp Vàng','Hộp Quà','Đũa Phép','Chìa Khóa Vàng','Chuỗi Ngọc Trai','Chìa Khóa Cổ','Túi Vàng','Bùa Mắt Thần',
   'Bình Cổ','Đồng Tiền Vàng','Nhẫn Ruby','Mặt Dây Ngọc Lục','Quả Cầu Sapphire','Gương Phép','Đèn Thần','Quả Cầu Pha Lê','Đá Triết Gia','Chén Thánh',
   'Sách Phép (Mở)','Cuộn Bùa Chú','Bình Thuốc Tím','Bình Thuốc Xanh','Bình Thuốc Đỏ','Mũ Phù Thủy','Gậy Pháp Sư','Kiếm Phép','Khiên Phép','Trứng Rồng',
   'Bác Sĩ','Cô Giáo','Đầu Bếp','Nhà Khoa Học','Lính Cứu Hỏa','Cảnh Sát','Họa Sĩ','Nông Dân','Công Nhân','Phi Công',
   'Phù Thủy','Tiên Nữ','Siêu Anh Hùng','Ninja','Cướp Biển','Hiệp Sĩ','Công Chúa','Phi Hành Gia','Thám Tử','Robot Thân Thiện',
   'Tim Đỏ','Tim Tím','Tim Vàng','Tim Xanh Lá','Tim Xanh Biển','Lấp Lánh','Sao Xoay','Nơ Hồng','Huy Hiệu','Huân Chương',
   'Nam Châm','Bóng Đèn','Pin Đầy','Sóng Wifi','Đồng Hồ Cát','Đồng Hồ Bấm','Kính Lúp','Hoa Gió','Ghim Bản Đồ','Ống Nhòm',
   'Nhà Xinh','Trường Học','Bệnh Viện','Nhà Hát','Tháp Eiffel','Lâu Đài NB','Pháo Hoa','Pháo Sáng','Núi Phú Sĩ','Đảo Nhiệt Đới',
   'Lều Cắm Trại','Nhà Gỗ','Nhà Trên Cây','Cối Xay Gió','Hải Đăng','Cầu','Suối Nước Nóng','Thác Nước','Cửa Hang','Cổng Cầu Vồng',
   'Phong Bì','Bưu Thiếp','Con Tem','Nhật Ký','Bút Lông & Mực','Máy Đánh Chữ','Báo','Loa Phóng Thanh','Bóng Hội Thoại','Bóng Suy Nghĩ',
   'Thích','Hòa Bình','Vỗ Tay','Nắm Đấm','OK','Vẫy Tay','Chỉ Lên','Bắt Chéo Ngón','Rock','Bắt Tay']
];

// Generate rarity based on position
function rarity(sheetIdx, row, col) {
  // Last 2 rows of each sheet = more rare/epic
  if (row >= 9) return Math.random() < 0.4 ? 'epic' : 'rare';
  if (row >= 7) return Math.random() < 0.5 ? 'rare' : 'common';
  // Random distribution
  const r = Math.random();
  if (r < 0.08) return 'epic';
  if (r < 0.3) return 'rare';
  return 'common';
}

const allStickers = [];
SHEET_DATA.forEach((sheet, si) => {
  sheet.forEach((name, i) => {
    const row = Math.floor(i / 10);
    const col = i % 10;
    const id = `s${si + 1}_${i}`;
    const r = rarity(si, row, col);
    allStickers.push({ id, e: '', n: name, r });
  });
});

// Output as JS
const lines = allStickers.map(s => `    { id: '${s.id}', e: '', n: '${s.n}', r: '${s.r}' },`);
console.log('  const STICKERS = [\n' + lines.join('\n') + '\n  ];');
console.log(`\n  // Total: ${allStickers.length} stickers`);
