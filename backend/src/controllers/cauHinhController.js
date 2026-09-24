const { query } = require('../config/db');
const { loadCauHinh, mapHang } = require('./cauHinhHelper');
const { writeAudit } = require('./auditLogHelper');

// GET /api/cau-hinh -> toàn bộ cấu hình cho FE dùng
async function getCauHinh(req, res) {
  try {
    const [tiers] = await query('SELECT * FROM HangThanhVien ORDER BY thu_tu, nguong_diem');
    const [qd] = await query('SELECT * FROM QuyDoiDiem ORDER BY id');
    return res.json({ hang_thanh_vien: tiers, quy_doi: qd });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function updateHang(req, res) {
  const { id } = req.params;
  const { ten_hang, nguong_diem, phan_tram_giam, thu_tu } = req.body;
  try {
    const sets = [];
    const params = [];
    if (ten_hang !== undefined) { sets.push('ten_hang = ?'); params.push(ten_hang); }
    if (nguong_diem !== undefined) { sets.push('nguong_diem = ?'); params.push(Number(nguong_diem)); }
    if (phan_tram_giam !== undefined) { sets.push('phan_tram_giam = ?'); params.push(Number(phan_tram_giam)); }
    if (thu_tu !== undefined) { sets.push('thu_tu = ?'); params.push(Number(thu_tu)); }
    if (!sets.length) return res.status(400).json({ message: 'Không có dữ liệu cập nhật.' });
    params.push(id);
    await query(`UPDATE HangThanhVien SET ${sets.join(', ')} WHERE id = ?`, params);
    await loadCauHinh(true);

    // Cập nhật lại hạng cho toàn bộ khách theo ngưỡng mới
    // Hạng luôn xét theo TỔNG điểm tích lũy (cumulative) - không dùng điểm hiện có
    const [khs] = await query('SELECT id, tong_diem_tich_luy, hang_thanh_vien FROM KhachHang');
    for (const k of khs) {
      const hangMoi = mapHang(k.tong_diem_tich_luy);
      if (hangMoi !== k.hang_thanh_vien) {
        await query('UPDATE KhachHang SET hang_thanh_vien = ? WHERE id = ?', [hangMoi, k.id]);
      }
    }
    await writeAudit(null, req, 'doi_hang_thanh_vien', 'hang_thanh_vien', Number(id));
    return res.json({ message: 'Cập nhật hạng thành viên thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function updateQuyDoi(req, res) {
  const { id } = req.params;
  const { gia_tri, mo_ta } = req.body;
  try {
    const sets = [];
    const params = [];
    if (gia_tri !== undefined) { sets.push('gia_tri = ?'); params.push(Number(gia_tri)); }
    if (mo_ta !== undefined) { sets.push('mo_ta = ?'); params.push(mo_ta); }
    if (!sets.length) return res.status(400).json({ message: 'Không có dữ liệu cập nhật.' });
    params.push(id);
    await query(`UPDATE QuyDoiDiem SET ${sets.join(', ')} WHERE id = ?`, params);
    await loadCauHinh(true);
    await writeAudit(null, req, 'doi_quy_doi_diem', 'quy_doi_diem', Number(id));
    return res.json({ message: 'Cập nhật quy tắc quy đổi điểm thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { getCauHinh, updateHang, updateQuyDoi };
