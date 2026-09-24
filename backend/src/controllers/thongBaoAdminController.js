const { query } = require('../config/db');

async function list(req, res) {
  try {
    const [rows] = await query(
      'SELECT * FROM ThongBaoAdmin ORDER BY da_doc ASC, ngay_tao DESC LIMIT 50'
    );
    const [cnt] = await query('SELECT COUNT(*) AS chua_doc FROM ThongBaoAdmin WHERE da_doc = 0');
    return res.json({ danh_sach: rows, chua_doc: Number(cnt[0].chua_doc) || 0 });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function markRead(req, res) {
  try {
    await query('UPDATE ThongBaoAdmin SET da_doc = 1 WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Đã đánh dấu đã đọc.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function markAllRead(req, res) {
  try {
    await query('UPDATE ThongBaoAdmin SET da_doc = 1 WHERE da_doc = 0');
    return res.json({ message: 'Đã đánh dấu tất cả đã đọc.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { list, markRead, markAllRead };
