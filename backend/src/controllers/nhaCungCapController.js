const { query } = require('../config/db');

async function listNhaCungCap(req, res) {
  const { tu_khoa } = req.query;
  try {
    let sql = 'SELECT * FROM nhacungcap ';
    const params = [];
    if (tu_khoa) {
      sql += 'WHERE ten_ncc LIKE ? OR so_dien_thoai LIKE ?';
      params.push(`%${tu_khoa}%`, `%${tu_khoa}%`);
    }
    sql += ' ORDER BY id';
    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function createNhaCungCap(req, res) {
  const { ten_ncc, dia_chi, so_dien_thoai, email } = req.body;
  if (!ten_ncc) return res.status(400).json({ message: 'Thiếu tên nhà cung cấp.' });
  try {
    const [r] = await query(
      'INSERT INTO nhacungcap (ten_ncc, dia_chi, so_dien_thoai, email) VALUES (?, ?, ?, ?)',
      [ten_ncc, dia_chi || null, so_dien_thoai || null, email || null]
    );
    return res.status(201).json({ message: 'Thêm mới thành công.', id: r.insertId });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function updateNhaCungCap(req, res) {
  const { id } = req.params;
  const { ten_ncc, dia_chi, so_dien_thoai, email } = req.body;
  try {
    const fields = [];
    const params = [];
    if (ten_ncc) { fields.push('ten_ncc = ?'); params.push(ten_ncc); }
    if (dia_chi !== undefined) { fields.push('dia_chi = ?'); params.push(dia_chi); }
    if (so_dien_thoai !== undefined) { fields.push('so_dien_thoai = ?'); params.push(so_dien_thoai); }
    if (email !== undefined) { fields.push('email = ?'); params.push(email); }
    if (fields.length === 0) return res.status(400).json({ message: 'Không có dữ liệu cập nhật.' });
    params.push(id);
    await query(`UPDATE nhacungcap SET ${fields.join(', ')} WHERE id = ?`, params);
    return res.json({ message: 'Cập nhật thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function deleteNhaCungCap(req, res) {
  const { id } = req.params;
  try {
    const [count] = await query('SELECT COUNT(*) AS n FROM phieunhapkho WHERE ma_ncc = ?', [id]);
    if (count[0].n > 0) {
      await query('UPDATE nhacungcap SET trang_thai = "ngung_hop_tac" WHERE id = ?', [id]);
      return res.json({ message: 'Nhà cung cấp có phiếu nhập, đã chuyển sang ngừng hợp tác.' });
    }
    await query('DELETE FROM nhacungcap WHERE id = ?', [id]);
    return res.json({ message: 'Xóa thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { listNhaCungCap, createNhaCungCap, updateNhaCungCap, deleteNhaCungCap };
