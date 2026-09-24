const { query } = require('../config/db');
const { writeAudit } = require('./auditLogHelper');

async function listTheLoai(req, res) {
  const { tu_khoa } = req.query;
  try {
    let sql = 'SELECT * FROM theloai';
    const params = [];
    if (tu_khoa) {
      sql += ' WHERE ten_the_loai LIKE ? OR mo_ta LIKE ?';
      params.push(`%${tu_khoa}%`, `%${tu_khoa}%`);
    }
    sql += ' ORDER BY id';
    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function createTheLoai(req, res) {
  const { ten_the_loai, mo_ta } = req.body;
  if (!ten_the_loai) return res.status(400).json({ message: 'Thiếu tên thể loại.' });
  try {
    const [rows] = await query('SELECT id FROM theloai WHERE ten_the_loai = ?', [ten_the_loai]);
    if (rows.length > 0) return res.status(409).json({ message: 'Thể loại đã tồn tại.' });
    const [r] = await query('INSERT INTO theloai (ten_the_loai, mo_ta) VALUES (?, ?)', [ten_the_loai, mo_ta || null]);
    await writeAudit(null, req, 'tao_the_loai', 'the_loai', r.insertId, ten_the_loai);
    return res.status(201).json({ message: 'Thêm mới thành công.', id: r.insertId });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function updateTheLoai(req, res) {
  const { id } = req.params;
  const { ten_the_loai, mo_ta } = req.body;
  try {
    if (ten_the_loai) await query('UPDATE theloai SET ten_the_loai = ? WHERE id = ?', [ten_the_loai, id]);
    if (mo_ta !== undefined) await query('UPDATE theloai SET mo_ta = ? WHERE id = ?', [mo_ta, id]);
    await writeAudit(null, req, 'sua_the_loai', 'the_loai', Number(id), ten_the_loai || null);
    return res.json({ message: 'Cập nhật thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function deleteTheLoai(req, res) {
  const { id } = req.params;
  try {
    const [count] = await query('SELECT COUNT(*) AS n FROM TruyenTheLoai WHERE ma_the_loai = ?', [id]);
    if (count[0].n > 0) {
      await query('UPDATE theloai SET trang_thai = "ngung_hoat_dong" WHERE id = ?', [id]);
      await writeAudit(null, req, 'xoa_the_loai', 'the_loai', Number(id), 'Ngừng hoạt động (đang được sử dụng)');
      return res.json({ message: 'Thể loại đang có truyện, đã chuyển sang ngừng hoạt động.' });
    }
    await query('DELETE FROM theloai WHERE id = ?', [id]);
    await writeAudit(null, req, 'xoa_the_loai', 'the_loai', Number(id), 'Xóa hẳn');
    return res.json({ message: 'Xóa thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { listTheLoai, createTheLoai, updateTheLoai, deleteTheLoai };