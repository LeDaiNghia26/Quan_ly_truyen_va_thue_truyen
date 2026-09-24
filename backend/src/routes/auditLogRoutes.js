const express = require('express');
const router = express.Router();

const { listAuditLog } = require('../controllers/auditLogController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('admin'), listAuditLog);

module.exports = router;