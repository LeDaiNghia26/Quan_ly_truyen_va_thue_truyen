const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { query, transaction } = require('../config/db');
const { signToken, getTokenUser } = require('../middlewares/auth');
const { mapHang } = require('./cauHinhHelper');

function sinhOtp() {
  return String(crypto.randomInt(100000, 999999));
}

async function getKhachByAccountId(maTaiKhoan) {
  const [rows] = await query('SELECT id FROM khachhang WHERE ma_tai_khoan = ?', [maTaiKhoan]);
  return rows[0]?.id || null;
}

// Gửi mã OTP (môi trường dev: trả về mã trong response để nhập trực tiếp)
async function sendOtp(req, res) {
  const { so_dien_thoai, loai } = req.body;
  if (!so_dien_thoai) return res.status(400).json({ message: 'Thiếu số điện thoại.' });
  if (!['dang_ky', 'quen_mat_khau'].includes(loai)) return res.status(400).json({ message: 'Loại OTP không hợp lệ.' });
  try {
    if (loai === 'quen_mat_khau') {
      const [exists] = await query('SELECT id FROM taikhoan WHERE so_dien_thoai = ?', [so_dien_thoai]);
      if (exists.length === 0) return res.status(404).json({ message: 'Số điện thoại chưa được đăng ký.' });
    }
    const ma = sinhOtp();
    const han = new Date(Date.now() + 5 * 60 * 1000);
    await query(
      'INSERT INTO maxacthuc (so_dien_thoai, ma_otp, loai, han) VALUES (?, ?, ?, ?)',
      [so_dien_thoai, ma, loai, han]
    );
    return res.json({ message: 'Đã gửi mã xác thực.', ma_otp_hienthi: ma });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function verifyOtp(req, res) {
  const { so_dien_thoai, ma_otp, loai } = req.body;
  if (!so_dien_thoai || !ma_otp) return res.status(400).json({ message: 'Thiếu số điện thoại hoặc mã OTP.' });
  try {
    const [rows] = await query(
      'SELECT id, han, da_dung FROM maxacthuc WHERE so_dien_thoai = ? AND ma_otp = ? AND loai = ? ORDER BY id DESC LIMIT 1',
      [so_dien_thoai, ma_otp.trim(), loai || 'dang_ky']
    );
    if (rows.length === 0) return res.status(400).json({ message: 'Mã OTP không đúng.' });
    if (rows[0].da_dung === 1) return res.status(400).json({ message: 'Mã OTP đã được sử dụng.' });
    if (new Date(rows[0].han) < new Date()) return res.status(400).json({ message: 'Mã OTP đã hết hạn.' });
    await query('UPDATE maxacthuc SET da_dung = 1 WHERE id = ?', [rows[0].id]);
    return res.json({ message: 'Xác thực thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function forgotPassword(req, res) {
  const { so_dien_thoai, ma_otp, mat_khau_moi } = req.body;
  if (!so_dien_thoai || !ma_otp || !mat_khau_moi) {
    return res.status(400).json({ message: 'Thiếu thông tin.' });
  }
  try {
    const [rows] = await query(
      'SELECT id, han, da_dung FROM maxacthuc WHERE so_dien_thoai = ? AND ma_otp = ? AND loai = "quen_mat_khau" ORDER BY id DESC LIMIT 1',
      [so_dien_thoai, ma_otp.trim()]
    );
    if (rows.length === 0) return res.status(400).json({ message: 'Mã OTP không đúng.' });
    if (rows[0].da_dung === 1) return res.status(400).json({ message: 'Mã OTP đã được sử dụng.' });
    if (new Date(rows[0].han) < new Date()) return res.status(400).json({ message: 'Mã OTP đã hết hạn.' });
    const hash = await bcrypt.hash(mat_khau_moi, 10);
    await transaction(async (conn) => {
      await conn.query('UPDATE taikhoan SET mat_khau = ? WHERE so_dien_thoai = ?', [hash, so_dien_thoai]);
      await conn.query('UPDATE maxacthuc SET da_dung = 1 WHERE id = ?', [rows[0].id]);
    });
    return res.json({ message: 'Đặt lại mật khẩu thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Đăng ký khách hàng bằng số điện thoại + OTP (email không bắt buộc)
async function register(req, res) {
  const { ho_ten, email, so_dien_thoai, mat_khau, dia_chi, ngay_sinh, ma_otp, so_thich } = req.body;
  if (!ho_ten || (!email && !so_dien_thoai) || !mat_khau) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc.' });
  }
  try {
    const [existing] = await query(
      'SELECT id FROM taikhoan WHERE email = ? OR (so_dien_thoai IS NOT NULL AND so_dien_thoai = ?)',
      [email || null, so_dien_thoai || null]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email hoặc số điện thoại đã được sử dụng.' });
    }
    if (so_dien_thoai) {
      const [ro] = await query(
        'SELECT id, han, da_dung FROM maxacthuc WHERE so_dien_thoai = ? AND ma_otp = ? AND loai = "dang_ky" ORDER BY id DESC LIMIT 1',
        [so_dien_thoai, (ma_otp || '').trim()]
      );
      if (ro.length === 0) return res.status(400).json({ message: 'Mã OTP không đúng.' });
      if (ro[0].da_dung === 1) return res.status(400).json({ message: 'Mã OTP đã được sử dụng.' });
      if (new Date(ro[0].han) < new Date()) return res.status(400).json({ message: 'Mã OTP đã hết hạn.' });
    }

    const hash = await bcrypt.hash(mat_khau, 10);
    const account = await transaction(async (conn) => {
      const [r1] = await conn.query(
        'INSERT INTO taikhoan (email, so_dien_thoai, mat_khau, vai_tro) VALUES (?, ?, ?, "customer")',
        [email || null, so_dien_thoai || null, hash]
      );
      const [r2] = await conn.query(
        'INSERT INTO khachhang (ma_tai_khoan, ho_ten, dia_chi, ngay_sinh) VALUES (?, ?, ?, ?)',
        [r1.insertId, ho_ten, dia_chi || null, ngay_sinh || null]
      );
      if (Array.isArray(so_thich) && so_thich.length) {
        for (const tl of so_thich) {
          await conn.query(
            'INSERT IGNORE INTO khachhangsothich (ma_khach_hang, ma_the_loai) VALUES (?, ?)',
            [r2.insertId, tl]
          );
        }
      }
      if (ma_otp) await conn.query('UPDATE maxacthuc SET da_dung = 1 WHERE so_dien_thoai = ?', [so_dien_thoai]);
      return r1.insertId;
    });

    // Tự động đăng nhập sau khi đăng ký
    const [rows] = await query('SELECT * FROM taikhoan WHERE id = ?', [account]);
    const user = rows[0];
    const token = signToken(user);
    const profile = await getProfile(user.id, 'customer');
    return res.status(201).json({ message: 'Đăng ký thành công.', token, user: { id: user.id, email: user.email, so_dien_thoai: user.so_dien_thoai, vai_tro: 'customer', profile: profile || {} } });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

// Đăng nhập bằng Google (mô phỏng: tài khoản Google hợp lệ được cấp phiên)
async function loginGoogle(req, res) {
  const { email, ho_ten } = req.body;
  if (!email) return res.status(400).json({ message: 'Thiếu email tài khoản Google.' });
  try {
    const [rows] = await query('SELECT * FROM taikhoan WHERE email = ?', [email]);
    if (rows.length === 0) {
      const hash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      const account = await transaction(async (conn) => {
        const [r1] = await conn.query(
          'INSERT INTO taikhoan (email, mat_khau, vai_tro) VALUES (?, ?, "customer")',
          [email, hash]
        );
        await conn.query('INSERT INTO khachhang (ma_tai_khoan, ho_ten) VALUES (?, ?)', [r1.insertId, ho_ten || email.split('@')[0]]);
        return r1.insertId;
      });
      const [nr] = await query('SELECT * FROM taikhoan WHERE id = ?', [account]);
      const token = signToken(nr[0]);
      const profile = await getProfile(account, 'customer');
      return res.json({ message: 'Đăng nhập Google thành công.', token, user: { id: account, email, so_dien_thoai: nr[0].so_dien_thoai, vai_tro: 'customer', profile: profile || {} } });
    }
    const user = rows[0];
    if (user.trang_thai === 'khoa') return res.status(403).json({ message: 'Tài khoản đã bị khóa.' });
    const token = signToken(user);
    const profile = await getProfile(user.id, user.vai_tro);
    return res.json({ message: 'Đăng nhập Google thành công.', token, user: { id: user.id, email: user.email, so_dien_thoai: user.so_dien_thoai, vai_tro: user.vai_tro, profile: profile || {} } });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function login(req, res) {
  const { email, so_dien_thoai, mat_khau } = req.body;
  if ((!email && !so_dien_thoai) || !mat_khau) {
    return res.status(400).json({ message: 'Thiếu thông tin đăng nhập.' });
  }
  try {
    const [rows] = await query(
      'SELECT tk.*, kh.hang_thanh_vien, kh.diem_tich_luy FROM taikhoan tk ' +
      'LEFT JOIN khachhang kh ON kh.ma_tai_khoan = tk.id ' +
      'WHERE tk.email = ? OR tk.so_dien_thoai = ?',
      [email || null, so_dien_thoai || email || null]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Sai email/số điện thoại hoặc mật khẩu.' });
    if (user.trang_thai === 'khoa') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa.' });
    }
    const ok = await bcrypt.compare(mat_khau, user.mat_khau);
    if (!ok) return res.status(401).json({ message: 'Sai email/số điện thoại hoặc mật khẩu.' });

    const token = signToken(user);
    const profile = await getProfile(user.id, user.vai_tro);
    return res.json({
      message: 'Đăng nhập thành công.',
      token,
      user: {
        id: user.id,
        email: user.email,
        so_dien_thoai: user.so_dien_thoai,
        vai_tro: user.vai_tro,
        profile: profile || {},
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function getProfile(userId, role) {
  if (role === 'customer') {
    const [rows] = await query(
      'SELECT kh.id AS profile_id, kh.ho_ten, kh.dia_chi, kh.ngay_sinh, kh.anh_dai_dien, kh.diem_tich_luy, kh.tong_diem_tich_luy, kh.hang_thanh_vien, tk.mat_khau ' +
      'FROM khachhang kh JOIN taikhoan tk ON tk.id = kh.ma_tai_khoan WHERE kh.ma_tai_khoan = ?', [userId]);
    if (!rows[0]) return null;
    const { mat_khau, ...profile } = rows[0];
    const matKhauMacDinh = await bcrypt.compare('123456', mat_khau).catch(() => false);
    return { ...profile, mat_khau_mac_dinh: matKhauMacDinh };
  }
  const table = role === 'admin' ? 'quantrivien' : 'nhanvien';
  const [rows] = await query(`SELECT id AS profile_id, ho_ten, chuc_vu FROM ?? WHERE ma_tai_khoan = ?`, [table, userId]);
  return rows[0] || null;
}

async function getMe(req, res) {
  try {
    const user = await getTokenUser(req.user.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    const profile = await getProfile(user.id, user.vai_tro);
    return res.json({ user, profile });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function updateMe(req, res) {
  const { ho_ten, dia_chi, ngay_sinh, anh_dai_dien, so_thich } = req.body;
  try {
    const profile = await getProfile(req.user.id, req.user.role);
    if (!profile) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    const table = req.user.role === 'admin' ? 'quantrivien' : req.user.role === 'staff' ? 'nhanvien' : 'khachhang';
    await transaction(async (conn) => {
      if (ho_ten) await conn.query('UPDATE ?? SET ho_ten = ? WHERE ma_tai_khoan = ?', [table, ho_ten, req.user.id]);
      if (dia_chi !== undefined && req.user.role === 'customer') {
        await conn.query('UPDATE khachhang SET dia_chi = ? WHERE ma_tai_khoan = ?', [dia_chi, req.user.id]);
      }
      if (ngay_sinh !== undefined && req.user.role === 'customer') {
        await conn.query('UPDATE khachhang SET ngay_sinh = ? WHERE ma_tai_khoan = ?', [ngay_sinh, req.user.id]);
      }
      if (anh_dai_dien !== undefined && req.user.role === 'customer') {
        await conn.query('UPDATE khachhang SET anh_dai_dien = ? WHERE ma_tai_khoan = ?', [anh_dai_dien, req.user.id]);
      }
      // Sở thích thể loại (chỉ khách hàng): danh sách mới thay toàn bộ danh sách cũ
      if (Array.isArray(so_thich) && req.user.role === 'customer') {
        await conn.query('DELETE FROM khachhangsothich WHERE ma_khach_hang = ?', [profile.profile_id]);
        for (const tl of so_thich) {
          await conn.query('INSERT IGNORE INTO khachhangsothich (ma_khach_hang, ma_the_loai) VALUES (?, ?)', [profile.profile_id, tl]);
        }
      }
    });
    return res.json({ message: 'Cập nhật thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

async function changePassword(req, res) {
  const { mat_khau_cu, mat_khau_moi } = req.body;
  if (!mat_khau_cu || !mat_khau_moi) {
    return res.status(400).json({ message: 'Thiếu thông tin mật khẩu.' });
  }
  try {
    const [rows] = await query('SELECT mat_khau FROM taikhoan WHERE id = ?', [req.user.id]);
    const ok = await bcrypt.compare(mat_khau_cu, rows[0].mat_khau);
    if (!ok) return res.status(400).json({ message: 'Mật khẩu cũ không đúng.' });
    const hash = await bcrypt.hash(mat_khau_moi, 10);
    await query('UPDATE taikhoan SET mat_khau = ? WHERE id = ?', [hash, req.user.id]);
    return res.json({ message: 'Đổi mật khẩu thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ.', error: err.message });
  }
}

module.exports = { register, login, getMe, updateMe, changePassword, mapHang, sendOtp, verifyOtp, forgotPassword, loginGoogle, getKhachByAccountId };