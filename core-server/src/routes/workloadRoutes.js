const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { createProviderWorkload } = require('../services/providerService');

const router = express.Router();
const workloads = [
  {
    id: 'wl-1',
    userId: 'user-1',
    serviceCategory: 'compute',
    provider: 'AWS',
    service: 'aws-compute-1',
    mode: 'automatic',
    status: 'active',
  },
];

router.post('/', protect, authorize('CLIENT'), async (req, res, next) => {
  const workload = {
    id: `wl-${Date.now()}`,
    userId: req.user.id,
    serviceCategory: req.body.serviceCategory || 'compute',
    provider: req.body.provider || 'AWS',
    service: req.body.service || 'aws-compute-1',
    mode: req.body.mode || 'automatic',
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  try {
    const providerWorkload = await createProviderWorkload(workload.provider, workload.id, workload.service);
    workloads.push({ ...workload, providerWorkloadId: providerWorkload.workload?.id });
    res.status(201).json({ workload: workloads[workloads.length - 1] });
  } catch (error) {
    next(error);
  }
});

router.get('/', protect, (req, res) => {
  const visibleWorkloads = req.user.role === 'ADMIN'
    ? workloads
    : workloads.filter((item) => item.userId === req.user.id);
  res.json({ workloads: visibleWorkloads });
});

router.get('/:id', protect, (req, res) => {
  const workload = workloads.find((item) => item.id === req.params.id
    && (req.user.role === 'ADMIN' || item.userId === req.user.id));
  if (!workload) {
    return res.status(404).json({ message: 'Workload not found.' });
  }
  res.json({ workload });
});

module.exports = router;
