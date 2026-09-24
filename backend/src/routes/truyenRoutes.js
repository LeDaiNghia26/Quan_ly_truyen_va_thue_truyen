const express = require('express');
const router = express.Router();

const truyen = require('../controllers/truyenController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', truyen.listTruyen);
router.get('/:id', truyen.getTruyen);
router.post('/', requireAuth, requireRole('admin'), truyen.createTruyen);
router.put('/:id', requireAuth, requireRole('admin'), truyen.updateTruyen);
router.delete('/:id', requireAuth, requireRole('admin'), truyen.deleteTruyen);

module.exports = router;