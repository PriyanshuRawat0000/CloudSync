const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { fetchAllProviders, updateProviderAdmin } = require('../services/providerService');

const router = express.Router();

router.get('/dashboard', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const providers = await fetchAllProviders();
    res.json({
      summary: {
        totalProviders: providers.length,
        healthyProviders: providers.filter((provider) => provider.status === 'healthy').length,
        activeWorkloads: providers.reduce((sum, provider) => sum + (provider.metrics?.activeWorkloads || 0), 0),
      },
      providers,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/providers', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const providers = await fetchAllProviders();
    res.json({ providers });
  } catch (error) {
    next(error);
  }
});

router.get('/workloads', protect, authorize('ADMIN'), (req, res) => {
  res.json({ workloads: [{ id: 'wl-1', provider: 'AWS', mode: 'automatic' }] });
});

router.post('/provider-refresh', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const providers = await fetchAllProviders();
    res.json({ message: 'Provider data refreshed.', providers });
  } catch (error) {
    next(error);
  }
});

router.post('/recalculate', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const providers = await fetchAllProviders();
    res.json({ message: 'Decision recalculated.', providers });
  } catch (error) {
    next(error);
  }
});

router.patch('/providers/:provider/:action', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const provider = req.params.provider.toUpperCase();
    const result = await updateProviderAdmin(provider, req.params.action, req.body);
    const providers = await fetchAllProviders();
    res.json({ message: 'Provider updated.', result, providers });
  } catch (error) {
    next(error);
  }
});

router.post('/providers/:provider/:action', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const provider = req.params.provider.toUpperCase();
    const result = await updateProviderAdmin(provider, req.params.action, req.body);
    const providers = await fetchAllProviders();
    res.json({ message: 'Provider updated.', result, providers });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
