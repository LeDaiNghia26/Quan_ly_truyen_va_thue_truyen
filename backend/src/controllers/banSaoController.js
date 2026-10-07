const { query } = require('../config/db');
const { writeAudit } = require('./auditLogHelper');

const TT_MAP = {
  san_sang: 'Sẵn sàng',
  dang_giu: 'Đang giữ',
  dang_cho_thue: 'Đang cho thuê',
  da_ban: 'Đã bán',
  ngung_luu_hanh: 'Ngừng lưu hành',
  bao_tri: 'Bảo trì / Sửa chữa',
};

async function listBanSao(req, res) {
  const { tu_khoa, trang_thai, ma_truyen, an_luu_hanh } = req.query;
  try {
    let sql =
      'SELECT bs.id, bs.ma_ban_sao, bs.ma_truyen, bs.ma_chi_tiet_nhap, bs.vi_tri_ke, bs.tap, ' +
      'bs.tinh_trang_hien_tai, bs.trang_thai, bs.ngay_nhap, bs.ngay_cap_nhat, ' +
      't.ten_truyen, t.tac_gia, t.gia_thue, t.gia_ban, t.anh_bia ' +
      'FROM bansao bs JOIN truyen t ON t.id = bs.ma_truyen ';
    const params = [];
    const conds = [];
    if (tu_khoa) {
      conds.push('(bs.ma_ban_sao LIKE ? OR t.ten_truyen LIKE ? OR bs.vi_tri_ke LIKE ?)');
      params.push(`%${tu_khoa}%`, `%${tu_khoa}%`, `%${tu_khoa}%`);
    }
    if (trang_thai) { conds.push('bs.trang_thai = ?'); params.push(trang_thai); }
    if (an_luu_hanh === '1' && !trang_thai) conds.push('bs.trang_thai NOT IN ("ngung_luu_hanh", "da_ban")');
    if (ma_truyen) { conds.push('bs.ma_truyen = ?'); params.push(ma_truyen); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY bs.ma_ban_sao';
    const [rows] = await query(sql, params);
    const view = rows.map((r) => ({ ...r, ten_trang_thai: TT_MAP[r.trang_thai] || r.trang_thai }));
    return res.json(view);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function getBanSao(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query(
      'SELECT bs.*, t.ten_truyen, t.tac_gia, t.gia_thue, t.gia_ban FROM bansao bs JOIN truyen t ON t.id = bs.ma_truyen WHERE bs.id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy bản sao.' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Tìm bản sao theo mã (dùng cho máy quét mã vạch / POS)
async function timTheoMa(req, res) {
  const { ma } = req.params;
  try {
    const [rows] = await query(
      'SELECT bs.id, bs.ma_ban_sao, bs.ma_truyen, bs.vi_tri_ke, bs.tap, bs.tinh_trang_hien_tai, bs.trang_thai, ' +
      't.ten_truyen, t.tac_gia, t.gia_thue, t.gia_ban, t.tien_coc ' +
      'FROM bansao bs JOIN truyen t ON t.id = bs.ma_truyen WHERE bs.ma_ban_sao = ? LIMIT 1',
      [ma]
    );
    if (rows.length === 0) return res.status(404).json({ message: `Không tìm thấy bản sao "${ma}".` });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Cập nhật nhanh: vị trí kệ, tình trạng vật lý, trạng thái (kể cả chuyển sang bảo trì)
async function updateBanSao(req, res) {
  const { id } = req.params;
  const { vi_tri_ke, tinh_trang_hien_tai, trang_thai } = req.body;
  try {
    const [rows] = await query('SELECT id FROM bansao WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy bản sao.' });
    const fields = [];
    const params = [];
    if (vi_tri_ke !== undefined) { fields.push('vi_tri_ke = ?'); params.push(vi_tri_ke || null); }
    if (tinh_trang_hien_tai !== undefined) {
      if (!['moi', 'tot', 'cu', 'hu_hong'].includes(tinh_trang_hien_tai)) return res.status(400).json({ message: 'Tình trạng vật lý không hợp lệ.' });
      fields.push('tinh_trang_hien_tai = ?'); params.push(tinh_trang_hien_tai);
    }
    if (trang_thai !== undefined) {
      if (!Object.keys(TT_MAP).includes(trang_thai)) return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
      fields.push('trang_thai = ?'); params.push(trang_thai);
    }
    if (!fields.length) return res.status(400).json({ message: 'Không có trường nào để cập nhật.' });
    fields.push('ngay_cap_nhat = NOW()');
    params.push(id);
    await query(`UPDATE bansao SET ${fields.join(', ')} WHERE id = ?`, params);
    await writeAudit(null, req, 'sua_ban_sao', 'ban_sao', Number(id), fields.join(', '));
    return res.json({ message: 'Đã cập nhật bản sao.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { listBanSao, getBanSao, timTheoMa, updateBanSao };
