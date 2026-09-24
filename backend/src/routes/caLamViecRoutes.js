const express = require('express');
const router = express.Router();

const cl = require('../controllers/caLamViecController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('admin', 'staff'), cl.listCaLamViec);
router.get('/hien-tai', requireAuth, requireRole('admin', 'staff'), cl.caHienTai);
router.post('/', requireAuth, requireRole('staff', 'admin'), cl.moCaLamViec);
router.get('/:id', requireAuth, requireRole('admin', 'staff'), cl.getCaLamViec);
router.post('/:id/chot', requireAuth, requireRole('staff', 'admin'), cl.chotCaLamViec);

module.exports = router;