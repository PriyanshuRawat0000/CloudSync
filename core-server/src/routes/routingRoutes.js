const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const routingHistory = [
  {
    workloadId: 'wl-1',
    provider: 'AWS',
    service: 'aws-compute-1',
    mode: 'automatic',
    updatedAt: new Date().toISOString(),
  },
];

router.get('/current', protect, (req, res) => {
  const visibleHistory = req.user.role === 'ADMIN'
    ? routingHistory
    : routingHistory.filter((item) => item.userId === req.user.id);
  const current = visibleHistory[visibleHistory.length - 1] || null;
  res.json({ routing: current });
});

router.post('/manual', protect, (req, res) => {
  const updated = {
    workloadId: req.body.workloadId || 'wl-1',
    provider: req.body.provider || 'AWS',
    service: req.body.service || 'aws-compute-1',
    mode: req.body.mode || 'manual',
    userId: req.user.id,
    updatedAt: new Date().toISOString(),
  };
  routingHistory.push(updated);
  res.json({ message: 'Manual routing updated.', routing: updated });
});

router.post('/automatic', protect, (req, res) => {
  const updated = {
    workloadId: req.body.workloadId || 'wl-1',
    provider: req.body.provider || 'AWS',
    service: req.body.service || 'aws-compute-1',
    mode: 'automatic',
    userId: req.user.id,
    updatedAt: new Date().toISOString(),
  };
  routingHistory.push(updated);
  res.json({ message: 'Automatic routing restored.', routing: updated });
});

router.post('/shift', protect, authorize('ADMIN'), (req, res) => {
  const updated = {
    workloadId: req.body.workloadId || 'wl-1',
    provider: req.body.provider || 'AZURE',
    service: req.body.service || 'azure-compute-1',
    mode: 'automatic',
    userId: req.user.id,
    updatedAt: new Date().toISOString(),
  };
  routingHistory.push(updated);
  res.json({ message: 'Routing shifted.', routing: updated });
});

module.exports = router;
