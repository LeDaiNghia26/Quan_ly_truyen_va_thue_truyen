const express = require('express');
const router = express.Router();

const bs = require('../controllers/banSaoController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('admin', 'staff'), bs.listBanSao);
router.get('/tim-theo-ma/:ma', requireAuth, requireRole('admin', 'staff'), bs.timTheoMa);
router.get('/:id', requireAuth, requireRole('admin', 'staff'), bs.getBanSao);
router.put('/:id', requireAuth, requireRole('admin', 'staff'), bs.updateBanSao);

module.exports = router;