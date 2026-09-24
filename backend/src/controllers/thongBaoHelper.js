const { query } = require('../config/db');

// Chèn thông báo, tránh trùng lặp theo (ma_khach_hang, loai, ma_tham_chieu, tieu_de)
async function notify(conn, maKhach, tieuDe, noiDung, loai, maThamChieu) {
  const run = conn && typeof conn.query === 'function' ? conn : { query };
  const [rows] = await run.query(
    'SELECT id FROM thongbao WHERE ma_khach_hang = ? AND loai = ? AND (ma_tham_chieu = ? OR (ma_tham_chieu IS NULL AND ? IS NULL)) AND tieu_de = ? LIMIT 1',
    [maKhach, loai, maThamChieu || null, maThamChieu || null, tieuDe]
  );
  if (rows.length > 0) return;
  await run.query(
    'INSERT INTO thongbao (ma_khach_hang, tieu_de, noi_dung, loai, ma_tham_chieu) VALUES (?, ?, ?, ?, ?)',
    [maKhach, tieuDe, noiDung, loai, maThamChieu || null]
  );
}

module.exports = { notify };