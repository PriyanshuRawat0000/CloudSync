const express = require('express');
const { protect } = require('../middleware/auth');
const { fetchAllProviders } = require('../services/providerService');

const router = express.Router();
const monitoringHistory = [];

router.get('/metrics', protect, async (req, res, next) => {
  try {
    const providers = await fetchAllProviders();
    monitoringHistory.push({ timestamp: new Date().toISOString(), providers });
    res.json({ metrics: providers });
  } catch (error) {
    next(error);
  }
});

router.get('/health', protect, async (req, res, next) => {
  try {
    const providers = await fetchAllProviders();
    res.json({ health: providers.map((provider) => ({ provider: provider.provider, status: provider.status, healthy: provider.status === 'healthy' })) });
  } catch (error) {
    next(error);
  }
});

router.get('/history', protect, (req, res) => {
  res.json({ history: monitoringHistory });
});

module.exports = router;
