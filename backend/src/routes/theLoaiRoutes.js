const express = require('express');
const router = express.Router();

const theLoai = require('../controllers/theLoaiController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', theLoai.listTheLoai);
router.post('/', requireAuth, requireRole('admin'), theLoai.createTheLoai);
router.put('/:id', requireAuth, requireRole('admin'), theLoai.updateTheLoai);
router.delete('/:id', requireAuth, requireRole('admin'), theLoai.deleteTheLoai);

module.exports = router;