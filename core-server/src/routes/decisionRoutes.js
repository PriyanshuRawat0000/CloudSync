const express = require('express');
const { protect } = require('../middleware/auth');
const { fetchAllProviders } = require('../services/providerService');
const { decideBestProvider } = require('../services/decisionEngine');

const router = express.Router();
const decisions = [];

router.post('/evaluate', protect, async (req, res, next) => {
  try {
    const { requirements = {}, priorities = {} } = req.body;
    const providers = await fetchAllProviders();
    const decision = decideBestProvider(providers, requirements, priorities);
    const record = {
      id: `decision-${Date.now()}`,
      userId: req.user.id,
      createdAt: new Date().toISOString(),
      selectedProvider: decision.selectedProvider,
      selectedService: decision.selectedService,
      score: decision.score,
      evaluations: decision.evaluations,
      requirements,
      priorities,
    };
    decisions.push(record);
    res.status(201).json({ decision: record });
  } catch (error) {
    next(error);
  }
});

router.get('/history', protect, (req, res) => {
  res.json({ decisions });
});

router.get('/:id', protect, (req, res) => {
  const decision = decisions.find((item) => item.id === req.params.id);
  if (!decision) {
    return res.status(404).json({ message: 'Decision not found.' });
  }
  res.json({ decision });
});

module.exports = router;
