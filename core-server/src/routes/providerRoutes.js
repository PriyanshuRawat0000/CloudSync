const express = require('express');
const { protect } = require('../middleware/auth');
const { fetchAllProviders, fetchProviderSnapshot } = require('../services/providerService');

const router = express.Router();

router.get('/', protect, async (req, res, next) => {
  try {
    const providers = await fetchAllProviders();
    res.json({ providers });
  } catch (error) {
    next(error);
  }
});

router.get('/:provider', protect, async (req, res, next) => {
  try {
    const provider = await fetchProviderSnapshot(req.params.provider.toUpperCase());
    res.json(provider);
  } catch (error) {
    next(error);
  }
});

router.get('/:provider/services', protect, async (req, res, next) => {
  try {
    const provider = await fetchProviderSnapshot(req.params.provider.toUpperCase());
    res.json({ provider: provider.provider, services: provider.services });
  } catch (error) {
    next(error);
  }
});

router.get('/:provider/metrics', protect, async (req, res, next) => {
  try {
    const provider = await fetchProviderSnapshot(req.params.provider.toUpperCase());
    res.json({ provider: provider.provider, metrics: provider.metrics, status: provider.status });
  } catch (error) {
    next(error);
  }
});

router.get('/:provider/health', protect, async (req, res, next) => {
  try {
    const provider = await fetchProviderSnapshot(req.params.provider.toUpperCase());
    res.json({ provider: provider.provider, status: provider.status, healthy: provider.status === 'healthy' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
