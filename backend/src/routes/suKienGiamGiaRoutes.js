const express = require('express');
const router = express.Router();

const sk = require('../controllers/suKienGiamGiaController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/cong-khai', sk.listCongKhai);
router.get('/', requireAuth, requireRole('admin'), sk.listSuKien);
router.get('/:id', requireAuth, requireRole('admin'), sk.getSuKien);
router.post('/', requireAuth, requireRole('admin'), sk.createSuKien);
router.put('/:id', requireAuth, requireRole('admin'), sk.updateSuKien);
router.patch('/:id/end', requireAuth, requireRole('admin'), sk.endSuKien);
router.patch('/:id/toggle', requireAuth, requireRole('admin'), sk.toggleSuKien);

module.exports = router;