const express = require('express');
const router = express.Router();

const bt = require('../controllers/baoTriController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('admin', 'staff'), bt.listBaoTri);
router.post('/', requireAuth, requireRole('admin'), bt.createBaoTri);
router.put('/:id', requireAuth, requireRole('admin'), bt.updateBaoTri);
router.delete('/:id', requireAuth, requireRole('admin'), bt.xoaBaoTri);
router.patch('/:id/hoan-tat', requireAuth, requireRole('admin'), bt.hoanTatBaoTri);

module.exports = router;
