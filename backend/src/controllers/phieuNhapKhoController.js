const { query, transaction } = require('../config/db');
const { writeAudit } = require('./auditLogHelper');

async function listPhieuNhapKho(req, res) {
  const { tu_ncc, tu_ngay, den_ngay } = req.query;
  try {
    let sql =
      'SELECT pnk.id, pnk.ngay_nhap, pnk.tong_tien, ncc.ten_ncc, qtv.ho_ten AS nguoi_lap ' +
      'FROM phieunhapkho pnk ' +
      'JOIN nhacungcap ncc ON ncc.id = pnk.ma_ncc ' +
      'JOIN quantrivien qtv ON qtv.id = pnk.ma_quan_tri_vien ';
    const params = [];
    const conds = [];
    if (tu_ncc) conds.push('ncc.ten_ncc LIKE ?');
    if (tu_ngay) conds.push('pnk.ngay_nhap >= ?');
    if (den_ngay) conds.push('pnk.ngay_nhap <= ?');
    if (tu_ncc) params.push(`%${tu_ncc}%`);
    if (tu_ngay) params.push(tu_ngay);
    if (den_ngay) params.push(den_ngay);
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY pnk.id DESC';
    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function getPhieuNhapKho(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query(
      'SELECT pnk.*, ncc.ten_ncc, qtv.ho_ten AS nguoi_lap FROM phieunhapkho pnk ' +
      'JOIN nhacungcap ncc ON ncc.id = pnk.ma_ncc ' +
      'JOIN quantrivien qtv ON qtv.id = pnk.ma_quan_tri_vien WHERE pnk.id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy phiếu nhập.' });
    const [chiTiet] = await query(
      'SELECT ct.id, ct.ma_truyen, t.ten_truyen, ct.so_luong, ct.gia_nhap, ct.tap ' +
      'FROM chitietphieunhapkho ct JOIN truyen t ON t.id = ct.ma_truyen WHERE ct.ma_phieu_nhap = ?',
      [id]
    );
    return res.json({ ...rows[0], chi_tiet: chiTiet });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function createPhieuNhapKho(req, res) {
  const { ma_ncc, chi_tiet } = req.body;
  if (!ma_ncc || !Array.isArray(chi_tiet) || chi_tiet.length === 0) {
    return res.status(400).json({ message: 'Thiếu thông tin phiếu nhập.' });
  }
  try {
    const [qtvRows] = await query('SELECT id FROM quantrivien WHERE ma_tai_khoan = ?', [req.user.id]);
    if (qtvRows.length === 0) return res.status(403).json({ message: 'Không tìm thấy hồ sơ quản trị viên.' });
    const ma_q = qtvRows[0].id;

    let tongTien = 0;
    for (const item of chi_tiet) {
      if (!item.ma_truyen || !item.so_luong || !item.gia_nhap) {
        return res.status(400).json({ message: 'Chi tiết phiếu nhập không hợp lệ.' });
      }
      tongTien += Number(item.so_luong) * Number(item.gia_nhap);
    }

    const result = await transaction(async (conn) => {
      const [r1] = await conn.query(
        'INSERT INTO phieunhapkho (ma_ncc, ma_quan_tri_vien, tong_tien) VALUES (?, ?, ?)',
        [ma_ncc, ma_q, tongTien]
      );
      const phieuId = r1.insertId;
      for (const item of chi_tiet) {
        const tap = Number(item.tap) || 1;
        const [r2] = await conn.query(
          'INSERT INTO chitietphieunhapkho (ma_phieu_nhap, ma_truyen, so_luong, gia_nhap, tap) VALUES (?, ?, ?, ?, ?)',
          [phieuId, item.ma_truyen, item.so_luong, item.gia_nhap, tap]
        );
        const [trRows] = await conn.query('SELECT ma_viet_tat FROM truyen WHERE id = ?', [item.ma_truyen]);
        const prefix = String(trRows[0]?.ma_viet_tat || `TR${item.ma_truyen}`).toUpperCase();
        const [cntRows] = await conn.query('SELECT COUNT(*) AS n FROM bansao WHERE ma_truyen = ? AND tap = ?', [item.ma_truyen, tap]);
        let seq = Number(cntRows[0].n) || 0;
        // Tự sinh mã bản sao cho từng cuốn: {MÃ}-T{tập}-{STT}
        for (let i = 1; i <= Number(item.so_luong); i++) {
          let ma;
          do {
            seq += 1;
            ma = `${prefix}-T${String(tap).padStart(2, '0')}-${String(seq).padStart(3, '0')}`;
            const [ex] = await conn.query('SELECT id FROM bansao WHERE ma_ban_sao = ? LIMIT 1', [ma]);
            if (ex.length === 0) break;
          } while (true);
          await conn.query(
            'INSERT INTO bansao (ma_ban_sao, ma_truyen, ma_chi_tiet_nhap, tap, tinh_trang_hien_tai, trang_thai) VALUES (?, ?, ?, ?, ?, "san_sang")',
            [ma, item.ma_truyen, r2.insertId, tap, item.tinh_trang || 'moi']
          );
        }
      }
      return phieuId;
    });
    await writeAudit(null, req, 'nhap_kho', 'phieu_nhap_kho', result, `Tổng ${tongTien}`);
    return res.status(201).json({ message: 'Lập phiếu nhập thành công.', id: result });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { listPhieuNhapKho, getPhieuNhapKho, createPhieuNhapKho };
