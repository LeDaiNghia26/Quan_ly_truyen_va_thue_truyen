const express = require('express');
const router = express.Router();

const tb = require('../controllers/thongBaoAdminController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('admin', 'staff'), tb.list);
router.put('/doc-tat-ca', requireAuth, requireRole('admin', 'staff'), tb.markAllRead);
router.put('/:id/doc', requireAuth, requireRole('admin', 'staff'), tb.markRead);

module.exports = router;
