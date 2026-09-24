const express = require('express');
const router = express.Router();

const { listYeuThich, toggleYeuThich } = require('../controllers/yeuThichController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('customer'), listYeuThich);
router.post('/toggle', requireAuth, requireRole('customer'), toggleYeuThich);

module.exports = router;