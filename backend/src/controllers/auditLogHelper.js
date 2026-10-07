const { query } = require('../config/db');

// Ghi nhật ký hệ thống. Nhận conn hoặc fallback về query (ngoài transaction).
async function writeAudit(run, req, hanhDong, doiTuong, idDoiTuong, lyDo) {
  const conn = run && typeof run.query === 'function' ? run : { query };
  await conn
    .query(
      'INSERT INTO auditlog (ma_tai_khoan, vai_tro, hanh_dong, doi_tuong, id_doi_tuong, ly_do) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req?.user?.id ?? null,
        req?.user?.role ?? null,
        hanhDong,
        doiTuong || null,
        idDoiTuong ?? null,
        lyDo || null,
      ]
    )
    .catch(() => {});
}

module.exports = { writeAudit };
