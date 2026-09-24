const express = require('express');
const router = express.Router();

const pt = require('../controllers/phieuThueController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('admin', 'staff'), pt.listPhieuThue);
router.get('/:id', requireAuth, requireRole('admin', 'staff'), pt.getPhieuThue);
router.post('/', requireAuth, requireRole('staff', 'admin'), pt.createPhieuThue);
router.post('/:id/huy', requireAuth, requireRole('admin', 'staff'), pt.huyPhieuThue);

module.exports = router;