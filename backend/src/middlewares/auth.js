const jwt = require('jsonwebtoken');

const { query } = require('../config/db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.vai_tro },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập.' });
  }
  let payload;
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Phiên đăng nhập hết hạn.' });
  }
  try {
    // Token vẫn hợp lệ nhưng tài khoản có thể đã bị khóa sau khi phát hành.
    // Không kiểm tra tài khoản ở tầng khác vì token vẫn đang tồn tại (mã có hạn 7 ngày).
    const tk = await getTokenUser(payload.id);
    if (!tk) return res.status(401).json({ message: 'Tài khoản không tồn tại.' });
    if (tk.trang_thai === 'khoa') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa.' });
    }
    // Vai trò lấy từ DB, không tin claim trong token (tránh token tự ý sửa quyền).
    req.user = { id: tk.id, role: tk.vai_tro };
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Không xác minh được tài khoản. Vui lòng thử lại.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' });
    }
    next();
  };
}

async function getTokenUser(id) {
  const [rows] = await query(
    'SELECT tk.id, tk.email, tk.so_dien_thoai, tk.vai_tro, tk.trang_thai ' +
    'FROM taikhoan tk WHERE tk.id = ?',
    [id]
  );
  return rows[0];
}

module.exports = { signToken, requireAuth, requireRole, getTokenUser };
