// === Học Vui — Sticker Collection ("Bộ Sưu Tập") ===
// A self-contained collectible loop: finishing a game has a chance to unlock a
// random sticker (rarer ones need a win / 3 stars). Stickers are stored in
// localStorage per profile. A reveal animation makes each unlock feel exciting,
// and an album modal shows collected vs locked ("12/40 — sưu tập hết nào!").
// No backend, no admin setup — works offline and drives daily return.
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.HocVuiCollection) return;

  // Sticker catalog — themed sets. rarity: common / rare / epic.
  // Kept to pre-2020 emojis to match the project's banned-emoji rule.
  const STICKERS = [
    // ══════ Animals (20) ══════
    { id: 'a1', e: '🐶', n: 'Cún Con', r: 'common' },
    { id: 'a2', e: '🐱', n: 'Mèo Mướp', r: 'common' },
    { id: 'a3', e: '🐰', n: 'Thỏ Trắng', r: 'common' },
    { id: 'a4', e: '🐼', n: 'Gấu Trúc', r: 'common' },
    { id: 'a5', e: '🦊', n: 'Cáo Lửa', r: 'common' },
    { id: 'a6', e: '🐯', n: 'Hổ Con', r: 'rare' },
    { id: 'a7', e: '🦁', n: 'Sư Tử', r: 'rare' },
    { id: 'a8', e: '🐲', n: 'Rồng Xanh', r: 'epic' },
    { id: 'a9', e: '🐨', n: 'Gấu Koala', r: 'common' },
    { id: 'a10', e: '🐸', n: 'Ếch Xanh', r: 'common' },
    { id: 'a11', e: '🐵', n: 'Khỉ Con', r: 'common' },
    { id: 'a12', e: '🐻', n: 'Gấu Nâu', r: 'common' },
    { id: 'a13', e: '🐧', n: 'Chim Cánh Cụt', r: 'common' },
    { id: 'a14', e: '🐦', n: 'Chim Sẻ', r: 'common' },
    { id: 'a15', e: '🦉', n: 'Cú Mèo', r: 'rare' },
    { id: 'a16', e: '🦅', n: 'Đại Bàng', r: 'rare' },
    { id: 'a17', e: '🐺', n: 'Sói Xám', r: 'rare' },
    { id: 'a18', e: '🦄', n: 'Kỳ Lân', r: 'epic' },
    { id: 'a19', e: '🐘', n: 'Voi Lớn', r: 'rare' },
    { id: 'a20', e: '🦒', n: 'Hươu Cao Cổ', r: 'rare' },
    // ══════ Sea (12) ══════
    { id: 's1', e: '🐠', n: 'Cá Vàng', r: 'common' },
    { id: 's2', e: '🐢', n: 'Rùa Biển', r: 'common' },
    { id: 's3', e: '🐙', n: 'Bạch Tuộc', r: 'rare' },
    { id: 's4', e: '🦈', n: 'Cá Mập', r: 'rare' },
    { id: 's5', e: '🐳', n: 'Cá Voi', r: 'epic' },
    { id: 's6', e: '🦀', n: 'Cua Đỏ', r: 'common' },
    { id: 's7', e: '🐚', n: 'Vỏ Sò', r: 'common' },
    { id: 's8', e: '🦑', n: 'Mực Ống', r: 'common' },
    { id: 's9', e: '🐡', n: 'Cá Nóc', r: 'rare' },
    { id: 's10', e: '🦐', n: 'Tôm Hùm', r: 'common' },
    { id: 's11', e: '🐬', n: 'Cá Heo', r: 'rare' },
    { id: 's12', e: '🦞', n: 'Tôm Càng', r: 'rare' },
    // ══════ Space (12) ══════
    { id: 'p1', e: '🚀', n: 'Tên Lửa', r: 'common' },
    { id: 'p2', e: '🌟', n: 'Ngôi Sao', r: 'common' },
    { id: 'p3', e: '🪐', n: 'Hành Tinh', r: 'rare' },
    { id: 'p4', e: '🌙', n: 'Mặt Trăng', r: 'rare' },
    { id: 'p5', e: '☄️', n: 'Sao Chổi', r: 'epic' },
    { id: 'p6', e: '🛸', n: 'Đĩa Bay', r: 'rare' },
    { id: 'p7', e: '🌍', n: 'Trái Đất', r: 'common' },
    { id: 'p8', e: '☀️', n: 'Mặt Trời', r: 'common' },
    { id: 'p9', e: '🌠', n: 'Sao Băng', r: 'rare' },
    { id: 'p10', e: '🔭', n: 'Kính Viễn Vọng', r: 'rare' },
    { id: 'p11', e: '👨‍🚀', n: 'Phi Hành Gia', r: 'epic' },
    { id: 'p12', e: '🛰️', n: 'Vệ Tinh', r: 'rare' },
    // ══════ Food (18) ══════
    { id: 'f1', e: '🍩', n: 'Bánh Vòng', r: 'common' },
    { id: 'f2', e: '🍦', n: 'Kem Ốc Quế', r: 'common' },
    { id: 'f3', e: '🍓', n: 'Dâu Tây', r: 'common' },
    { id: 'f4', e: '🍕', n: 'Pizza', r: 'common' },
    { id: 'f5', e: '🎂', n: 'Bánh Kem', r: 'rare' },
    { id: 'f6', e: '🍪', n: 'Bánh Quy', r: 'common' },
    { id: 'f7', e: '🍭', n: 'Kẹo Mút', r: 'common' },
    { id: 'f8', e: '🍫', n: 'Sô-cô-la', r: 'common' },
    { id: 'f9', e: '🧁', n: 'Cupcake', r: 'common' },
    { id: 'f10', e: '🍿', n: 'Bắp Rang', r: 'common' },
    { id: 'f11', e: '🥤', n: 'Nước Ngọt', r: 'common' },
    { id: 'f12', e: '🍔', n: 'Hamburger', r: 'common' },
    { id: 'f13', e: '🌮', n: 'Taco', r: 'common' },
    { id: 'f14', e: '🍰', n: 'Bánh Phô Mai', r: 'rare' },
    { id: 'f15', e: '🥐', n: 'Bánh Sừng Bò', r: 'common' },
    { id: 'f16', e: '🍣', n: 'Sushi', r: 'rare' },
    { id: 'f17', e: '🧋', n: 'Trà Sữa', r: 'rare' },
    { id: 'f18', e: '🍡', n: 'Bánh Dango', r: 'common' },
    // ══════ Nature (16) ══════
    { id: 'n1', e: '🌈', n: 'Cầu Vồng', r: 'rare' },
    { id: 'n2', e: '🌺', n: 'Hoa Râm Bụt', r: 'common' },
    { id: 'n3', e: '🍀', n: 'Cỏ May Mắn', r: 'rare' },
    { id: 'n4', e: '🦋', n: 'Bươm Bướm', r: 'common' },
    { id: 'n5', e: '🌻', n: 'Hướng Dương', r: 'common' },
    { id: 'n6', e: '🌸', n: 'Hoa Đào', r: 'common' },
    { id: 'n7', e: '🌵', n: 'Xương Rồng', r: 'common' },
    { id: 'n8', e: '🍄', n: 'Nấm Đỏ', r: 'common' },
    { id: 'n9', e: '🌲', n: 'Cây Thông', r: 'common' },
    { id: 'n10', e: '🍁', n: 'Lá Phong', r: 'common' },
    { id: 'n11', e: '🌷', n: 'Hoa Tulip', r: 'common' },
    { id: 'n12', e: '🪷', n: 'Hoa Sen', r: 'rare' },
    { id: 'n13', e: '🌾', n: 'Bông Lúa', r: 'common' },
    { id: 'n14', e: '☘️', n: 'Cỏ Ba Lá', r: 'common' },
    { id: 'n15', e: '🐝', n: 'Ong Mật', r: 'common' },
    { id: 'n16', e: '🐞', n: 'Bọ Rùa', r: 'common' },
    // ══════ Treasures (12) ══════
    { id: 't1', e: '👑', n: 'Vương Miện', r: 'epic' },
    { id: 't2', e: '💎', n: 'Kim Cương', r: 'epic' },
    { id: 't3', e: '🏆', n: 'Cúp Vàng', r: 'epic' },
    { id: 't4', e: '🎁', n: 'Hộp Quà', r: 'rare' },
    { id: 't5', e: '🪄', n: 'Đũa Phép', r: 'epic' },
    { id: 't6', e: '🔑', n: 'Chìa Khóa Vàng', r: 'epic' },
    { id: 't7', e: '📿', n: 'Chuỗi Ngọc', r: 'rare' },
    { id: 't8', e: '🗝️', n: 'Chìa Cổ', r: 'rare' },
    { id: 't9', e: '💰', n: 'Túi Vàng', r: 'epic' },
    { id: 't10', e: '🧿', n: 'Mắt Thần', r: 'epic' },
    { id: 't11', e: '⚱️', n: 'Bình Cổ', r: 'rare' },
    { id: 't12', e: '🪙', n: 'Đồng Xu Vàng', r: 'rare' },
    // ══════ Vehicles (14) ══════
    { id: 'v1', e: '🚗', n: 'Ô Tô', r: 'common' },
    { id: 'v2', e: '🚒', n: 'Xe Cứu Hỏa', r: 'common' },
    { id: 'v3', e: '🚁', n: 'Trực Thăng', r: 'rare' },
    { id: 'v4', e: '⛵', n: 'Thuyền Buồm', r: 'common' },
    { id: 'v5', e: '🎈', n: 'Bóng Bay', r: 'common' },
    { id: 'v6', e: '🚂', n: 'Xe Lửa', r: 'common' },
    { id: 'v7', e: '🚀', n: 'Phi Thuyền', r: 'rare' },
    { id: 'v8', e: '🏎️', n: 'Xe Đua', r: 'rare' },
    { id: 'v9', e: '🚲', n: 'Xe Đạp', r: 'common' },
    { id: 'v10', e: '🛩️', n: 'Máy Bay Nhỏ', r: 'common' },
    { id: 'v11', e: '🚜', n: 'Máy Cày', r: 'common' },
    { id: 'v12', e: '🚌', n: 'Xe Buýt', r: 'common' },
    { id: 'v13', e: '🛶', n: 'Thuyền Kayak', r: 'common' },
    { id: 'v14', e: '🎠', n: 'Ngựa Gỗ', r: 'rare' },
    // ══════ Music & Art (14) ══════
    { id: 'm1', e: '🎵', n: 'Nốt Nhạc', r: 'common' },
    { id: 'm2', e: '🎸', n: 'Đàn Ghi-ta', r: 'rare' },
    { id: 'm3', e: '🎺', n: 'Kèn Trumpet', r: 'rare' },
    { id: 'm4', e: '🥁', n: 'Trống', r: 'common' },
    { id: 'm5', e: '🎹', n: 'Đàn Piano', r: 'rare' },
    { id: 'm6', e: '🎻', n: 'Vĩ Cầm', r: 'rare' },
    { id: 'm7', e: '🎤', n: 'Micro', r: 'common' },
    { id: 'm8', e: '🎨', n: 'Bảng Màu', r: 'common' },
    { id: 'm9', e: '🖌️', n: 'Cọ Vẽ', r: 'common' },
    { id: 'm10', e: '✏️', n: 'Bút Chì', r: 'common' },
    { id: 'm11', e: '📖', n: 'Sách Mở', r: 'common' },
    { id: 'm12', e: '🎭', n: 'Mặt Nạ', r: 'rare' },
    { id: 'm13', e: '🎬', n: 'Phim', r: 'common' },
    { id: 'm14', e: '📷', n: 'Máy Ảnh', r: 'common' },
    // ══════ Sports (16) ══════
    { id: 'sp1', e: '⚽', n: 'Bóng Đá', r: 'common' },
    { id: 'sp2', e: '🏀', n: 'Bóng Rổ', r: 'common' },
    { id: 'sp3', e: '🏐', n: 'Bóng Chuyền', r: 'common' },
    { id: 'sp4', e: '🎾', n: 'Bóng Tennis', r: 'common' },
    { id: 'sp5', e: '🏓', n: 'Bóng Bàn', r: 'common' },
    { id: 'sp6', e: '🥊', n: 'Găng Boxing', r: 'rare' },
    { id: 'sp7', e: '🏆', n: 'Huy Chương', r: 'rare' },
    { id: 'sp8', e: '🎯', n: 'Bia Bắn', r: 'common' },
    { id: 'sp9', e: '🏸', n: 'Cầu Lông', r: 'common' },
    { id: 'sp10', e: '⛸️', n: 'Giày Trượt', r: 'rare' },
    { id: 'sp11', e: '🎿', n: 'Trượt Tuyết', r: 'rare' },
    { id: 'sp12', e: '🏄', n: 'Lướt Sóng', r: 'rare' },
    { id: 'sp13', e: '🧗', n: 'Leo Núi', r: 'rare' },
    { id: 'sp14', e: '🤸', n: 'Thể Dục', r: 'common' },
    { id: 'sp15', e: '🎳', n: 'Bowling', r: 'common' },
    { id: 'sp16', e: '🥇', n: 'HCV', r: 'epic' },
    // ══════ Dinosaurs (12) ══════
    { id: 'd1', e: '🦕', n: 'Khủng Long Cổ Dài', r: 'common' },
    { id: 'd2', e: '🦖', n: 'T-Rex', r: 'rare' },
    { id: 'd3', e: '🐊', n: 'Cá Sấu', r: 'common' },
    { id: 'd4', e: '🦎', n: 'Thằn Lằn', r: 'common' },
    { id: 'd5', e: '🐍', n: 'Rắn', r: 'common' },
    { id: 'd6', e: '🪺', n: 'Tổ Trứng', r: 'common' },
    { id: 'd7', e: '🦴', n: 'Xương Hóa Thạch', r: 'rare' },
    { id: 'd8', e: '🪨', n: 'Hóa Thạch', r: 'rare' },
    { id: 'd9', e: '🌋', n: 'Núi Lửa', r: 'epic' },
    { id: 'd10', e: '🥚', n: 'Trứng Khủng Long', r: 'rare' },
    { id: 'd11', e: '🐉', n: 'Rồng Lửa', r: 'epic' },
    { id: 'd12', e: '🦤', n: 'Chim Dodo', r: 'epic' },
    // ══════ Weather (10) ══════
    { id: 'w1', e: '⛈️', n: 'Giông Bão', r: 'rare' },
    { id: 'w2', e: '🌪️', n: 'Lốc Xoáy', r: 'epic' },
    { id: 'w3', e: '❄️', n: 'Bông Tuyết', r: 'common' },
    { id: 'w4', e: '☁️', n: 'Mây Trắng', r: 'common' },
    { id: 'w5', e: '🌊', n: 'Sóng Biển', r: 'common' },
    { id: 'w6', e: '⚡', n: 'Sét', r: 'rare' },
    { id: 'w7', e: '🔥', n: 'Lửa', r: 'rare' },
    { id: 'w8', e: '💧', n: 'Giọt Nước', r: 'common' },
    { id: 'w9', e: '🌤️', n: 'Nắng Nhẹ', r: 'common' },
    { id: 'w10', e: '🌧️', n: 'Mưa', r: 'common' },
    // ══════ Toys & Games (14) ══════
    { id: 'g1', e: '🧸', n: 'Gấu Bông', r: 'common' },
    { id: 'g2', e: '🎲', n: 'Xúc Xắc', r: 'common' },
    { id: 'g3', e: '🧩', n: 'Mảnh Ghép', r: 'common' },
    { id: 'g4', e: '🪁', n: 'Diều', r: 'common' },
    { id: 'g5', e: '🎪', n: 'Lều Xiếc', r: 'rare' },
    { id: 'g6', e: '🎡', n: 'Đu Quay', r: 'rare' },
    { id: 'g7', e: '🎢', n: 'Tàu Lượn', r: 'rare' },
    { id: 'g8', e: '🪀', n: 'Yo-yo', r: 'common' },
    { id: 'g9', e: '🤖', n: 'Robot', r: 'rare' },
    { id: 'g10', e: '👾', n: 'Người Ngoài HL', r: 'epic' },
    { id: 'g11', e: '🎮', n: 'Tay Cầm', r: 'common' },
    { id: 'g12', e: '🪆', n: 'Búp Bê Nga', r: 'rare' },
    { id: 'g13', e: '🏰', n: 'Lâu Đài', r: 'epic' },
    { id: 'g14', e: '⛲', n: 'Đài Phun Nước', r: 'rare' },
    // ══════ Fruits (14) ══════
    { id: 'fr1', e: '🍎', n: 'Táo Đỏ', r: 'common' },
    { id: 'fr2', e: '🍊', n: 'Cam', r: 'common' },
    { id: 'fr3', e: '🍋', n: 'Chanh Vàng', r: 'common' },
    { id: 'fr4', e: '🍇', n: 'Nho', r: 'common' },
    { id: 'fr5', e: '🍉', n: 'Dưa Hấu', r: 'common' },
    { id: 'fr6', e: '🍑', n: 'Đào', r: 'common' },
    { id: 'fr7', e: '🥝', n: 'Kiwi', r: 'common' },
    { id: 'fr8', e: '🍍', n: 'Dứa', r: 'common' },
    { id: 'fr9', e: '🥭', n: 'Xoài', r: 'common' },
    { id: 'fr10', e: '🫐', n: 'Việt Quất', r: 'common' },
    { id: 'fr11', e: '🍒', n: 'Cherry', r: 'common' },
    { id: 'fr12', e: '🥥', n: 'Dừa', r: 'common' },
    { id: 'fr13', e: '🍌', n: 'Chuối', r: 'common' },
    { id: 'fr14', e: '🫒', n: 'Ô Liu', r: 'common' },
    // ══════ Professions (14) ══════
    { id: 'j1', e: '👨‍⚕️', n: 'Bác Sĩ', r: 'rare' },
    { id: 'j2', e: '👩‍🏫', n: 'Cô Giáo', r: 'common' },
    { id: 'j3', e: '👨‍🍳', n: 'Đầu Bếp', r: 'common' },
    { id: 'j4', e: '👩‍🔬', n: 'Nhà Khoa Học', r: 'rare' },
    { id: 'j5', e: '👨‍🚒', n: 'Lính Cứu Hỏa', r: 'rare' },
    { id: 'j6', e: '👮', n: 'Cảnh Sát', r: 'common' },
    { id: 'j7', e: '👩‍🎨', n: 'Họa Sĩ', r: 'common' },
    { id: 'j8', e: '🧑‍🌾', n: 'Nông Dân', r: 'common' },
    { id: 'j9', e: '👷', n: 'Công Nhân', r: 'common' },
    { id: 'j10', e: '🧑‍✈️', n: 'Phi Công', r: 'rare' },
    { id: 'j11', e: '🧙', n: 'Phù Thủy', r: 'epic' },
    { id: 'j12', e: '🧚', n: 'Tiên Nữ', r: 'epic' },
    { id: 'j13', e: '🦸', n: 'Siêu Anh Hùng', r: 'epic' },
    { id: 'j14', e: '🥷', n: 'Ninja', r: 'epic' },
    // ══════ Flags & Symbols (12) ══════
    { id: 'x1', e: '❤️', n: 'Trái Tim Đỏ', r: 'common' },
    { id: 'x2', e: '💜', n: 'Trái Tim Tím', r: 'common' },
    { id: 'x3', e: '💛', n: 'Trái Tim Vàng', r: 'common' },
    { id: 'x4', e: '💚', n: 'Trái Tim Xanh', r: 'common' },
    { id: 'x5', e: '🩵', n: 'Trái Tim Biển', r: 'common' },
    { id: 'x6', e: '✨', n: 'Lấp Lánh', r: 'common' },
    { id: 'x7', e: '💫', n: 'Ngôi Sao Xoay', r: 'rare' },
    { id: 'x8', e: '🎀', n: 'Nơ Hồng', r: 'common' },
    { id: 'x9', e: '🏅', n: 'Huy Hiệu', r: 'rare' },
    { id: 'x10', e: '🎖️', n: 'Huân Chương', r: 'epic' },
    { id: 'x11', e: '🧲', n: 'Nam Châm', r: 'rare' },
    { id: 'x12', e: '💡', n: 'Bóng Đèn', r: 'common' },
    // ══════ Buildings & Places (10) ══════
    { id: 'b1', e: '🏠', n: 'Nhà Xinh', r: 'common' },
    { id: 'b2', e: '🏫', n: 'Trường Học', r: 'common' },
    { id: 'b3', e: '🏥', n: 'Bệnh Viện', r: 'common' },
    { id: 'b4', e: '🎭', n: 'Nhà Hát', r: 'rare' },
    { id: 'b5', e: '🗼', n: 'Tháp Eiffel', r: 'rare' },
    { id: 'b6', e: '🏯', n: 'Lâu Đài NB', r: 'rare' },
    { id: 'b7', e: '🎆', n: 'Pháo Hoa', r: 'rare' },
    { id: 'b8', e: '🎇', n: 'Pháo Sáng', r: 'common' },
    { id: 'b9', e: '🗻', n: 'Núi Phú Sĩ', r: 'epic' },
    { id: 'b10', e: '🏝️', n: 'Đảo Nhiệt Đới', r: 'epic' },
  ];

  const RARITY = {
    common: { label: 'Thường', color: '#7bb86f', glow: 'rgba(123,184,111,0.5)' },
    rare: { label: 'Hiếm', color: '#4a90e2', glow: 'rgba(74,144,226,0.55)' },
    epic: { label: 'Cực Hiếm', color: '#b65fe0', glow: 'rgba(182,95,224,0.6)' },
  };

  function profileId() {
    try { const p = JSON.parse(localStorage.getItem('hocvui_profile') || '{}'); return p.id || 'guest'; } catch (e) { return 'guest'; }
  }
  function storeKey() { return 'hocvui_stickers_' + profileId(); }
  function getOwned() { try { return JSON.parse(localStorage.getItem(storeKey()) || '[]'); } catch (e) { return []; } }
  function setOwned(a) { try { localStorage.setItem(storeKey(), JSON.stringify(a)); } catch (e) {} }

  // Roll a reward. `quality` 0..3 (e.g. stars earned); higher = better odds &
  // access to rarer stickers. Returns the unlocked sticker, or null (no unlock).
  function roll(quality) {
    const owned = getOwned();
    // Drop chance scales with how well the child did.
    const chance = quality >= 3 ? 0.9 : quality >= 2 ? 0.7 : quality >= 1 ? 0.5 : 0.3;
    if (Math.random() > chance) return null;
    // Pick a rarity tier based on quality.
    let tier;
    const r = Math.random();
    if (quality >= 3) tier = r < 0.25 ? 'epic' : r < 0.6 ? 'rare' : 'common';
    else if (quality >= 2) tier = r < 0.1 ? 'epic' : r < 0.45 ? 'rare' : 'common';
    else tier = r < 0.03 ? 'epic' : r < 0.25 ? 'rare' : 'common';
    // Prefer not-yet-owned stickers in that tier; fall back to any tier.
    const pool = STICKERS.filter(s => s.r === tier && !owned.includes(s.id));
    let candidates = pool.length ? pool : STICKERS.filter(s => !owned.includes(s.id));
    if (!candidates.length) return null; // album complete
    const pickItem = candidates[Math.floor(Math.random() * candidates.length)];
    owned.push(pickItem.id);
    setOwned(owned);
    return pickItem;
  }

  // ── Styles ──
  function injectStyles() {
    if (document.getElementById('hv-collection-style')) return;
    const s = document.createElement('style');
    s.id = 'hv-collection-style';
    s.textContent = `
    .hvc-overlay { position: fixed; inset: 0; z-index: 2147483600; display: none; align-items: center; justify-content: center;
      background: rgba(20,10,40,0.62); backdrop-filter: blur(4px); font-family: 'Nunito', system-ui, sans-serif; }
    .hvc-overlay.show { display: flex; animation: hvcFade .25s ease; }
    @keyframes hvcFade { from { opacity: 0; } to { opacity: 1; } }
    /* reveal card */
    .hvc-reveal { background: linear-gradient(180deg,#fff,#f3efff); border-radius: 26px; padding: 26px 24px; width: min(90%,330px);
      text-align: center; box-shadow: 0 24px 60px rgba(0,0,0,0.4); animation: hvcPop .45s cubic-bezier(.34,1.56,.64,1) both; position: relative; overflow: hidden; }
    .hvc-reveal::before { content: ''; position: absolute; top: -40%; left: 50%; width: 240px; height: 240px; transform: translateX(-50%);
      background: conic-gradient(from 0deg, transparent, var(--rg,#ffd24d), transparent 30%); animation: hvcSpin 4s linear infinite; opacity: 0.5; }
    @keyframes hvcSpin { to { transform: translateX(-50%) rotate(360deg); } }
    @keyframes hvcPop { 0% { opacity: 0; transform: scale(0.5) rotate(-8deg); } 100% { opacity: 1; transform: scale(1) rotate(0); } }
    .hvc-reveal > * { position: relative; z-index: 1; }
    .hvc-banner { font-size: 0.95rem; font-weight: 900; color: #8a5cf6; letter-spacing: 1px; }
    .hvc-sticker { font-size: 5.5rem; margin: 10px 0 6px; filter: drop-shadow(0 6px 8px rgba(0,0,0,0.2)); animation: hvcBounce 1.4s ease-in-out infinite; }
    @keyframes hvcBounce { 50% { transform: translateY(-10px) scale(1.05); } }
    .hvc-name { font-size: 1.4rem; font-weight: 900; color: #2a2150; }
    .hvc-rarity { display: inline-block; margin-top: 6px; padding: 3px 14px; border-radius: 999px; color: #fff; font-weight: 800; font-size: 0.8rem; }
    .hvc-progress { margin-top: 12px; font-size: 0.9rem; color: #6a6a8a; font-weight: 700; }
    .hvc-btn { margin-top: 16px; width: 100%; padding: 13px; border: none; border-radius: 14px; background: linear-gradient(135deg,#a06bff,#7a3bd6);
      color: #fff; font-size: 1.05rem; font-weight: 900; cursor: pointer; box-shadow: 0 5px 0 #5a2aa0; }
    .hvc-btn:active { transform: translateY(3px); box-shadow: 0 2px 0 #5a2aa0; }
    .hvc-confetti { position: fixed; top: -10px; width: 9px; height: 15px; border-radius: 2px; z-index: 2147483601; pointer-events: none; animation: hvcConf 1.6s ease-in forwards; }
    @keyframes hvcConf { to { transform: translateY(105vh) rotate(540deg); opacity: 0.2; } }
    /* album */
    .hvc-album { background: #fff; border-radius: 24px; padding: 20px 18px; width: min(94%,520px); max-height: 88vh; overflow-y: auto;
      box-shadow: 0 24px 60px rgba(0,0,0,0.4); animation: hvcPop .35s cubic-bezier(.34,1.56,.64,1) both; }
    .hvc-album-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .hvc-album-head h2 { font-size: 1.4rem; font-weight: 900; color: #2a2150; }
    .hvc-close { width: 36px; height: 36px; border: none; border-radius: 50%; background: #eee; font-size: 1.1rem; cursor: pointer; }
    .hvc-album-sub { color: #8a87a0; font-weight: 800; font-size: 0.95rem; margin-bottom: 14px; }
    .hvc-bar { height: 10px; background: #ede9f7; border-radius: 999px; overflow: hidden; margin-bottom: 16px; }
    .hvc-bar-fill { height: 100%; background: linear-gradient(90deg,#a06bff,#ff7a59); border-radius: 999px; transition: width .4s; }
    .hvc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(62px,1fr)); gap: 10px; }
    .hvc-cell { aspect-ratio: 1; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.9rem;
      background: #f4f1fb; border: 2px solid #eae6f7; position: relative; }
    .hvc-cell.owned { background: #fff; border-color: var(--c,#a06bff); box-shadow: 0 4px 10px var(--g,rgba(160,107,255,0.25)); }
    .hvc-cell.locked { color: transparent; }
    .hvc-cell.locked::after { content: '❓'; position: absolute; font-size: 1.4rem; color: #c9c3e0; }
    `;
    document.head.appendChild(s);
  }

  // ── Reveal animation ──
  let overlay = null;
  function ensureOverlay() {
    injectStyles();
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'hvc-overlay';
    document.body.appendChild(overlay);
  }

  function showReveal(sticker) {
    ensureOverlay();
    const owned = getOwned().length, total = STICKERS.length;
    const rar = RARITY[sticker.r];
    overlay.innerHTML = `
      <div class="hvc-reveal" style="--rg:${rar.glow}">
        <div class="hvc-banner">✨ NHÃN DÁN MỚI ✨</div>
        <div class="hvc-sticker">${sticker.e}</div>
        <div class="hvc-name">${sticker.n}</div>
        <div class="hvc-rarity" style="background:${rar.color}">${rar.label}</div>
        <div class="hvc-progress">Bộ sưu tập: ${owned}/${total}</div>
        <button class="hvc-btn" id="hvc-reveal-ok">Tuyệt vời! 🎉</button>
      </div>`;
    overlay.classList.add('show');
    document.getElementById('hvc-reveal-ok').addEventListener('click', () => overlay.classList.remove('show'));
    if (window.HocVuiSound) window.HocVuiSound.play(sticker.r === 'epic' ? 'win' : 'star');
    if (window.HocVuiMascot) window.HocVuiMascot.say('Có nhãn dán mới nè! 🎉', 'good');
    burstConfetti();
  }

  function burstConfetti() {
    const colors = ['#ffd54f', '#ff7043', '#81c784', '#64b5f6', '#ba68c8', '#fff'];
    for (let i = 0; i < 28; i++) {
      const c = document.createElement('span');
      c.className = 'hvc-confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (Math.random() * 0.5) + 's';
      document.body.appendChild(c);
      c.addEventListener('animationend', () => c.remove(), { once: true });
    }
  }

  // ── Album modal ──
  function showAlbum() {
    ensureOverlay();
    const owned = getOwned();
    const total = STICKERS.length;
    const pct = Math.round(owned.length / total * 100);
    const cells = STICKERS.map(s => {
      const has = owned.includes(s.id);
      const rar = RARITY[s.r];
      return has
        ? `<div class="hvc-cell owned" style="--c:${rar.color};--g:${rar.glow}" title="${s.n} (${rar.label})">${s.e}</div>`
        : `<div class="hvc-cell locked" title="Chưa mở khoá"></div>`;
    }).join('');
    overlay.innerHTML = `
      <div class="hvc-album">
        <div class="hvc-album-head">
          <h2>📔 Bộ Sưu Tập</h2>
          <button class="hvc-close" id="hvc-album-close">✕</button>
        </div>
        <div class="hvc-album-sub">Đã sưu tập ${owned.length}/${total} nhãn dán — chơi tiếp để mở hết nhé!</div>
        <div class="hvc-bar"><div class="hvc-bar-fill" style="width:${pct}%"></div></div>
        <div class="hvc-grid">${cells}</div>
      </div>`;
    overlay.classList.add('show');
    document.getElementById('hvc-album-close').addEventListener('click', () => overlay.classList.remove('show'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('show'); });
  }

  // ── Public API ──
  let lastReward = 0;
  function rewardOnce(stars, minGap) {
    // Guard against double rewards when a game both posts a session AND calls
    // reward() directly. Only one unlock per `minGap` ms.
    const now = Date.now();
    if (now - lastReward < (minGap || 2500)) return null;
    lastReward = now;
    const s = roll(Math.max(0, Math.min(3, stars | 0)));
    if (s) { setTimeout(() => showReveal(s), 600); return s; }
    return null;
  }

  window.HocVuiCollection = {
    // Call on game finish with stars earned (0..3). Shows a reveal if unlocked.
    reward(stars) { return rewardOnce(stars); },
    showAlbum,
    owned: () => getOwned().slice(),
    total: () => STICKERS.length,
    count: () => getOwned().length,
  };

  // ── Universal hook: any game that saves a session earns a sticker chance ──
  // Wraps window.fetch so a POST to /api/sessions auto-rewards based on
  // `stars_earned`. This covers every game version (incl. v4, v5, v11–v60)
  // without per-game edits. The cooldown above dedupes with direct reward() calls.
  if (!window.__hvSessionHook) {
    window.__hvSessionHook = true;
    const origFetch = window.fetch ? window.fetch.bind(window) : null;
    if (origFetch) {
      window.fetch = function (input, init) {
        let url = '';
        try { url = typeof input === 'string' ? input : (input && input.url) || ''; } catch (e) {}
        const method = ((init && init.method) || (typeof input === 'object' && input && input.method) || 'GET').toUpperCase();
        let stars = null;
        if (/\/api\/sessions/.test(url) && method === 'POST') {
          try {
            const body = init && init.body;
            if (typeof body === 'string') {
              const data = JSON.parse(body);
              if (data && data.stars_earned != null) stars = Number(data.stars_earned);
            }
          } catch (e) {}
        }
        const p = origFetch(input, init);
        if (stars != null) {
          // Fire after the request kicks off; doesn't block the save.
          setTimeout(() => { try { rewardOnce(stars); } catch (e) {} }, 50);
        }
        return p;
      };
    }
  }
})();
