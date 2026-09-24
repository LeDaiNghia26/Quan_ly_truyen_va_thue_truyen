const { query } = require('../config/db');
const { writeAudit } = require('./auditLogHelper');

async function listBaoTri(req, res) {
  const { tu_khoa, tu_ngay, den_ngay } = req.query;
  try {
    let sql =
      'SELECT pbt.id, pbt.ma_ban_sao, pbt.ngay, pbt.chi_phi, pbt.noi_dung, pbt.ngay_tao, ' +
      'bs.ma_ban_sao AS ma, bs.tap, bs.trang_thai AS trang_thai_ban_sao, t.ten_truyen, t.ma_viet_tat, ' +
      'qtv.ho_ten AS ten_quan_tri_vien ' +
      'FROM phieubaotri pbt ' +
      'JOIN bansao bs ON bs.id = pbt.ma_ban_sao ' +
      'JOIN truyen t ON t.id = bs.ma_truyen ' +
      'JOIN quantrivien qtv ON qtv.id = pbt.ma_quan_tri_vien ';
    const params = [];
    const conds = [];
    if (tu_khoa) {
      conds.push('(bs.ma_ban_sao LIKE ? OR t.ten_truyen LIKE ? OR pbt.noi_dung LIKE ?)');
      params.push(`%${tu_khoa}%`, `%${tu_khoa}%`, `%${tu_khoa}%`);
    }
    if (tu_ngay) { conds.push('pbt.ngay >= ?'); params.push(tu_ngay); }
    if (den_ngay) { conds.push('pbt.ngay <= ?'); params.push(den_ngay); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY pbt.ngay DESC, pbt.id DESC';
    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function createBaoTri(req, res) {
  const { ma_ban_sao, ngay, chi_phi, noi_dung } = req.body;
  if (!ma_ban_sao || !ngay) return res.status(400).json({ message: 'Thiếu bản sao hoặc ngày bảo trì.' });
  try {
    const [qtvRows] = await query('SELECT id FROM quantrivien WHERE ma_tai_khoan = ?', [req.user.id]);
    if (qtvRows.length === 0) return res.status(403).json({ message: 'Không tìm thấy hồ sơ quản trị viên.' });
    const [bsRows] = await query('SELECT id, trang_thai FROM bansao WHERE id = ?', [ma_ban_sao]);
    if (bsRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy bản sao.' });

    const [r] = await query(
      'INSERT INTO phieubaotri (ma_ban_sao, ngay, chi_phi, noi_dung, ma_quan_tri_vien) VALUES (?, ?, ?, ?, ?)',
      [ma_ban_sao, ngay, chi_phi || 0, noi_dung || null, qtvRows[0].id]
    );
    if (bsRows[0].trang_thai !== 'da_ban' && bsRows[0].trang_thai !== 'ngung_luu_hanh') {
      await query('UPDATE bansao SET trang_thai = "bao_tri", ngay_cap_nhat = NOW() WHERE id = ?', [ma_ban_sao]);
    }
    await writeAudit(null, req, 'tao_bao_tri', 'phieu_bao_tri', r.insertId, `Bản sao #${ma_ban_sao}`);
    return res.status(201).json({ message: 'Đã ghi nhận phiếu bảo trì.', id: r.insertId });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function updateBaoTri(req, res) {
  const { id } = req.params;
  const fields = ['ngay', 'chi_phi', 'noi_dung'];
  try {
    const [rows] = await query('SELECT id FROM phieubaotri WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy phiếu bảo trì.' });
    const sets = [];
    const params = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = ?`); params.push(req.body[f]); }
    }
    if (!sets.length) return res.status(400).json({ message: 'Không có trường nào để cập nhật.' });
    params.push(id);
    await query(`UPDATE phieubaotri SET ${sets.join(', ')} WHERE id = ?`, params);
    await writeAudit(null, req, 'sua_bao_tri', 'phieu_bao_tri', Number(id));
    return res.json({ message: 'Đã cập nhật phiếu bảo trì.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function xoaBaoTri(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query('SELECT id FROM phieubaotri WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy phiếu bảo trì.' });
    await query('DELETE FROM phieubaotri WHERE id = ?', [id]);
    await writeAudit(null, req, 'xoa_bao_tri', 'phieu_bao_tri', Number(id));
    return res.json({ message: 'Đã xóa phiếu bảo trì.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function hoanTatBaoTri(req, res) {
  const { id } = req.params;
  const { tinh_trang_hien_tai } = req.body;
  try {
    const [rows] = await query(
      'SELECT pbt.id, pbt.ma_ban_sao, bs.trang_thai FROM phieubaotri pbt JOIN bansao bs ON bs.id = pbt.ma_ban_sao WHERE pbt.id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy phiếu bảo trì.' });
    if (rows[0].trang_thai === 'bao_tri') {
      const tt = ['moi', 'tot', 'cu', 'hu_hong'].includes(tinh_trang_hien_tai) ? tinh_trang_hien_tai : 'tot';
      await query('UPDATE bansao SET trang_thai = "san_sang", tinh_trang_hien_tai = ?, ngay_cap_nhat = NOW() WHERE id = ?', [tt, rows[0].ma_ban_sao]);
    }
    await writeAudit(null, req, 'hoan_tat_bao_tri', 'phieu_bao_tri', Number(id));
    return res.json({ message: 'Đã hoàn tất bảo trì, bản sao trở về trạng thái sẵn sàng.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { listBaoTri, createBaoTri, updateBaoTri, xoaBaoTri, hoanTatBaoTri };
