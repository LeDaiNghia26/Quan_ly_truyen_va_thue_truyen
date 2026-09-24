const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `bia-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpe?g|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(Object.assign(new Error('Chỉ cho phép file ảnh (jpg, png, gif, webp).'), { status: 400 }));
  },
});

function uploadAnhBia(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Chưa chọn file ảnh.' });
  return res.json({ message: 'Tải ảnh bìa thành công.', url: `/uploads/${req.file.filename}` });
}

module.exports = { upload, uploadAnhBia };
