const express = require('express');
const router = express.Router();

const ncc = require('../controllers/nhaCungCapController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('admin'), ncc.listNhaCungCap);
router.post('/', requireAuth, requireRole('admin'), ncc.createNhaCungCap);
router.put('/:id', requireAuth, requireRole('admin'), ncc.updateNhaCungCap);
router.delete('/:id', requireAuth, requireRole('admin'), ncc.deleteNhaCungCap);

module.exports = router;