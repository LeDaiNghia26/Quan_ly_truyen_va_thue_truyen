const express = require('express');
const router = express.Router();

const pb = require('../controllers/phieuBanController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('admin', 'staff'), pb.listPhieuBan);
router.get('/:id', requireAuth, requireRole('admin', 'staff'), pb.getPhieuBan);
router.post('/', requireAuth, requireRole('staff', 'admin'), pb.createPhieuBan);
router.post('/:id/huy', requireAuth, requireRole('admin', 'staff'), pb.huyPhieuBan);

module.exports = router;