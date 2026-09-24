const express = require('express');
const router = express.Router();

const dt = require('../controllers/datTruocController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('admin', 'staff', 'customer'), dt.listDatTruoc);
router.get('/auto-expire', requireAuth, requireRole('admin', 'staff'), dt.autoExpireDatTruoc);
router.post('/:id/huy', requireAuth, requireRole('admin', 'staff', 'customer'), dt.cancelDatTruoc);
router.get('/:id', requireAuth, requireRole('admin', 'staff', 'customer'), dt.getDatTruoc);
router.post('/', requireAuth, requireRole('customer'), dt.createDatTruoc);
router.patch('/:id/cancel', requireAuth, requireRole('customer'), dt.cancelDatTruoc);

module.exports = router;