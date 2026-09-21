const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('ADMIN'), (req, res) => {
  res.json({ users: [
    { id: 'user-1', name: 'Demo Client', email: 'client@example.com', role: 'CLIENT' },
    { id: 'admin-1', name: 'Demo Admin', email: 'admin@example.com', role: 'ADMIN' },
  ]});
});

router.get('/:id', protect, (req, res) => {
  res.json({ user: { id: req.params.id, name: 'Sample User', role: 'CLIENT' } });
});

module.exports = router;
