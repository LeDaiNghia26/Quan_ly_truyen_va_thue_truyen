const express = require('express');
const router = express.Router();

const tk = require('../controllers/thongKeController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/dashboard', requireAuth, requireRole('admin', 'staff'), tk.dashboard);
router.get('/', requireAuth, requireRole('admin'), tk.thongKe);

module.exports = router;