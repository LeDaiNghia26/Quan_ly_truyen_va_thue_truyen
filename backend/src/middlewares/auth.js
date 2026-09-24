const jwt = require('jsonwebtoken');

const { query } = require('../config/db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.vai_tro },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập.' });
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Phiên đăng nhập hết hạn.' });
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