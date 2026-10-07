const { query, transaction } = require('../config/db');
const { writeAudit } = require('./auditLogHelper');

const TRANG_THAI_BAN_SAO = ['san_sang', 'dang_giu', 'dang_cho_thue', 'da_ban', 'ngung_luu_hanh', 'bao_tri'];

const SORT_MAP = {
  moi_nhat: 't.id DESC',
  top_thue: 't.luot_thue DESC, t.id',
  top_mua: 't.luot_mua DESC, t.id',
  gia_thue_asc: 't.gia_thue ASC, t.id',
  gia_thue_desc: 't.gia_thue DESC, t.id',
  danh_gia: 'danh_gia_tb DESC, t.id',
};

async function listTruyen(req, res) {
  const {
    tu_khoa, the_loai, chi_con_hang, chi_thue, chi_ban,
    gia_thue_from, gia_thue_to, gia_ban_from, gia_ban_to, loai_hinh, loai, sort,
  } = req.query;
  try {
    let sql =
      'SELECT t.*, ' +
      '(SELECT GROUP_CONCAT(tl2.ten_the_loai SEPARATOR ", ") FROM TruyenTheLoai ttl ' +
      'JOIN TheLoai tl2 ON tl2.id = ttl.ma_the_loai WHERE ttl.ma_truyen = t.id) AS the_loai_ten, ' +
      '(SELECT GROUP_CONCAT(ttl.ma_the_loai SEPARATOR ",") FROM TruyenTheLoai ttl WHERE ttl.ma_truyen = t.id) AS the_loai_ids, ' +
      'ROUND(AVG(dg.so_sao), 1) AS danh_gia_tb, COUNT(DISTINCT dg.id) AS so_danh_gia, ' +
      // Tồn kho gom từ subquery theo bansao, KHÔNG join chung với danhgia.
      // Nếu LEFT JOIN cả hai rồi SUM(CASE...), mỗi bản sao bị đếm lặp theo số giờ giữ
      // (Nếu bản sao được giữ ở nhiều thời điểm) thì so_san_sang/so_dang_giu bị nhầm lẫn.
      'COALESCE(bs.so_san_sang, 0) AS so_san_sang, ' +
      'COALESCE(bs.so_dang_giu, 0) AS so_dang_giu, ' +
      'COALESCE(bs.so_dang_cho_thue, 0) AS so_dang_cho_thue, ' +
      'COALESCE(bs.so_da_ban, 0) AS so_da_ban, ' +
      'COALESCE(bs.so_ngung_luu_hanh, 0) AS so_ngung_luu_hanh, ' +
      'COALESCE(bs.tong_ban_sao, 0) AS tong_ban_sao ' +
      'FROM truyen t ' +
      'LEFT JOIN (' +
      '  SELECT ma_truyen, ' +
      '    SUM(trang_thai = "san_sang") AS so_san_sang, ' +
      '    SUM(trang_thai = "dang_giu") AS so_dang_giu, ' +
      '    SUM(trang_thai = "dang_cho_thue") AS so_dang_cho_thue, ' +
      '    SUM(trang_thai = "da_ban") AS so_da_ban, ' +
      '    SUM(trang_thai = "ngung_luu_hanh") AS so_ngung_luu_hanh, ' +
      '    COUNT(*) AS tong_ban_sao ' +
      '  FROM bansao GROUP BY ma_truyen' +
      ') bs ON bs.ma_truyen = t.id ' +
      'LEFT JOIN danhgia dg ON dg.ma_truyen = t.id ';
    const params = [];
    const conds = [];
    if (chi_thue === '1') conds.push('t.gia_thue > 0');
    if (chi_ban === '1') conds.push('t.gia_ban > 0');
    if (loai) { conds.push('t.loai = ?'); params.push(loai); }
    if (the_loai) {
      const ids = String(the_loai).split(',').map((x) => Number(x.trim())).filter((x) => x > 0);
      if (ids.length) {
        conds.push(`t.id IN (SELECT ma_truyen FROM TruyenTheLoai WHERE ma_the_loai IN (${ids.map(() => '?').join(',')}))`);
        params.push(...ids);
      }
    }
    if (tu_khoa) {
      conds.push('(t.ten_truyen LIKE ? OR t.tac_gia LIKE ? OR t.nha_xuat_ban LIKE ? OR t.ma_viet_tat LIKE ?)');
      params.push(`%${tu_khoa}%`, `%${tu_khoa}%`, `%${tu_khoa}%`, `%${tu_khoa}%`);
    }
    if (gia_thue_from !== undefined && gia_thue_from !== '') { conds.push('t.gia_thue >= ?'); params.push(gia_thue_from); }
    if (gia_thue_to !== undefined && gia_thue_to !== '') { conds.push('t.gia_thue <= ?'); params.push(gia_thue_to); }
    if (gia_ban_from !== undefined && gia_ban_from !== '') { conds.push('t.gia_ban >= ?'); params.push(gia_ban_from); }
    if (gia_ban_to !== undefined && gia_ban_to !== '') { conds.push('t.gia_ban <= ?'); params.push(gia_ban_to); }
    if (loai_hinh) {
      const ten = String(loai_hinh);
      if (ten.includes('tranh')) { conds.push('t.loai = ?'); params.push('TRUYEN_TRANH'); }
      else if (ten.includes('novel')) { conds.push('t.loai = ?'); params.push('LIGHT_NOVEL'); }
      else if (ten.includes('ngan')) { conds.push('t.loai = ?'); params.push('TRUYEN_NGAN'); }
      else if (ten.includes('thuy')) { conds.push('t.loai = ?'); params.push('TIEU_THUYET'); }
    }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' GROUP BY t.id ';
    sql += ' HAVING (t.trang_thai = "hoat_dong" OR ? = 1) ';
    params.push(0);
    if (chi_con_hang === '1') sql += ' AND (SELECT COUNT(*) FROM bansao b2 WHERE b2.ma_truyen = t.id AND b2.trang_thai = "san_sang") > 0 ';
    sql += ' ORDER BY ' + (SORT_MAP[sort] || 't.id');
    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function getTruyen(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await query(
      'SELECT t.*, ' +
      '(SELECT GROUP_CONCAT(tl2.ten_the_loai SEPARATOR ", ") FROM TruyenTheLoai ttl ' +
      'JOIN TheLoai tl2 ON tl2.id = ttl.ma_the_loai WHERE ttl.ma_truyen = t.id) AS the_loai_ten, ' +
      'ROUND(AVG(dg.so_sao), 1) AS danh_gia_tb, COUNT(DISTINCT dg.id) AS so_danh_gia, ' +
      '(SELECT COUNT(*) FROM bansao b2 WHERE b2.ma_truyen = t.id AND b2.trang_thai = "san_sang") AS so_san_sang, ' +
      '(SELECT COUNT(*) FROM bansao b3 WHERE b3.ma_truyen = t.id AND b3.trang_thai = "dang_giu") AS so_dang_giu ' +
      'FROM truyen t ' +
      'LEFT JOIN danhgia dg ON dg.ma_truyen = t.id WHERE t.id = ? ' +
      'GROUP BY t.id',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy truyện.' });
    const [banSao] = await query(
      'SELECT id, ma_ban_sao, tinh_trang_hien_tai, trang_thai, ngay_nhap FROM bansao WHERE ma_truyen = ? ORDER BY id',
      [id]
    );
    const [danhGia] = await query(
      'SELECT dg.id, dg.so_sao, dg.noi_dung, dg.ngay_danh_gia, kh.ho_ten FROM danhgia dg ' +
      'JOIN khachhang kh ON kh.id = dg.ma_khach_hang WHERE dg.ma_truyen = ? ORDER BY dg.ngay_danh_gia DESC',
      [id]
    );
    const [tlRows] = await query('SELECT ma_the_loai FROM TruyenTheLoai WHERE ma_truyen = ?', [id]);
    return res.json({ ...rows[0], ban_sao: banSao, danh_gia: danhGia, danh_sach_the_loai: tlRows.map((r) => r.ma_the_loai) });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

function chuanHoaTheLoai(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((x) => Number(x)).filter((x) => x > 0))];
}

const CAC_LOAI = ['TRUYEN_TRANH', 'TIEU_THUYET', 'TRUYEN_NGAN', 'LIGHT_NOVEL'];

async function createTruyen(req, res) {
  const {
    ten_truyen, tac_gia, loai, gia_thue, gia_ban, anh_bia, mo_ta,
    ma_viet_tat, danh_sach_the_loai,
  } = req.body;
  if (!ten_truyen || !gia_thue || !gia_ban) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc.' });
  }
  if (!CAC_LOAI.includes(loai)) {
    return res.status(400).json({ message: 'Loại truyện phải là TRUYEN_TRANH, TIEU_THUYET, TRUYEN_NGAN hoặc LIGHT_NOVEL.' });
  }
  const dsTheLoai = chuanHoaTheLoai(danh_sach_the_loai);
  if (dsTheLoai.length === 0) {
    return res.status(400).json({ message: 'Chọn ít nhất 1 thể loại.' });
  }
  try {
    const id = await transaction(async (conn) => {
      const [r] = await conn.query(
        'INSERT INTO truyen (ten_truyen, tac_gia, loai, gia_thue, gia_ban, anh_bia, mo_ta, ma_viet_tat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [ten_truyen, tac_gia || null, loai, gia_thue, gia_ban, anh_bia || null, mo_ta || null, ma_viet_tat || null]
      );
      for (const tl of dsTheLoai) {
        await conn.query('INSERT IGNORE INTO TruyenTheLoai (ma_truyen, ma_the_loai) VALUES (?, ?)', [r.insertId, tl]);
      }
      return r.insertId;
    });
    await writeAudit(null, req, 'tao_truyen', 'truyen', id, ten_truyen);
    return res.status(201).json({ message: 'Thêm mới thành công.', id });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function updateTruyen(req, res) {
  const { id } = req.params;
  const {
    ten_truyen, tac_gia, loai, gia_thue, gia_ban, anh_bia, mo_ta,
    ma_viet_tat, danh_sach_the_loai,
  } = req.body;
  if (loai !== undefined && !CAC_LOAI.includes(loai)) {
    return res.status(400).json({ message: 'Loại truyện phải là TRUYEN_TRANH, TIEU_THUYET, TRUYEN_NGAN hoặc LIGHT_NOVEL.' });
  }
  try {
    const fields = [];
    const params = [];
    if (ten_truyen) { fields.push('ten_truyen = ?'); params.push(ten_truyen); }
    if (tac_gia !== undefined) { fields.push('tac_gia = ?'); params.push(tac_gia); }
    if (loai !== undefined) { fields.push('loai = ?'); params.push(loai); }
    if (gia_thue !== undefined) { fields.push('gia_thue = ?'); params.push(gia_thue); }
    if (gia_ban !== undefined) { fields.push('gia_ban = ?'); params.push(gia_ban); }
    if (anh_bia !== undefined) { fields.push('anh_bia = ?'); params.push(anh_bia); }
    if (mo_ta !== undefined) { fields.push('mo_ta = ?'); params.push(mo_ta); }
    if (ma_viet_tat !== undefined) { fields.push('ma_viet_tat = ?'); params.push(ma_viet_tat || null); }
    if (fields.length === 0 && danh_sach_the_loai === undefined) {
      return res.status(400).json({ message: 'Không có dữ liệu cập nhật.' });
    }
    await transaction(async (conn) => {
      if (fields.length) {
        params.push(id);
        await conn.query(`UPDATE truyen SET ${fields.join(', ')} WHERE id = ?`, params);
      }
      if (danh_sach_the_loai !== undefined) {
        const dsTheLoai = chuanHoaTheLoai(danh_sach_the_loai);
        if (dsTheLoai.length === 0) throw Object.assign(new Error('Chọn ít nhất 1 thể loại.'), { status: 400 });
        await conn.query('DELETE FROM TruyenTheLoai WHERE ma_truyen = ?', [id]);
        for (const tl of dsTheLoai) {
          await conn.query('INSERT IGNORE INTO TruyenTheLoai (ma_truyen, ma_the_loai) VALUES (?, ?)', [id, tl]);
        }
      }
    });
    await writeAudit(null, req, 'sua_truyen', 'truyen', Number(id), ten_truyen);
    return res.json({ message: 'Cập nhật thành công.' });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function deleteTruyen(req, res) {
  const { id } = req.params;
  try {
    const [count] = await query(
      `SELECT COUNT(*) AS n FROM bansao WHERE ma_truyen = ? AND trang_thai IN ('dang_giu','dang_cho_thue')`,
      [id]
    );
    if (count[0].n > 0) {
      await query('UPDATE truyen SET trang_thai = "ngung_kinh_doanh" WHERE id = ?', [id]);
      await writeAudit(null, req, 'ngung_truyen', 'truyen', Number(id), 'Đang được giữ/cho thuê');
      return res.json({ message: 'Truyện đang được giữ/cho thuê, đã chuyển sang ngừng kinh doanh.' });
    }
    await query('UPDATE truyen SET trang_thai = "ngung_kinh_doanh" WHERE id = ?', [id]);
    await writeAudit(null, req, 'ngung_truyen', 'truyen', Number(id), 'Hủy kinh doanh');
    return res.json({ message: 'Đã ngừng kinh doanh truyện.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { listTruyen, getTruyen, createTruyen, updateTruyen, deleteTruyen, TRANG_THAI_BAN_SAO };
