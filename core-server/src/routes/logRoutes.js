const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();
const logStore = [
  { timestamp: new Date().toISOString(), eventType: 'LOGIN', severity: 'INFO', message: 'Demo login recorded.' },
  { timestamp: new Date().toISOString(), eventType: 'DECISION_MADE', severity: 'INFO', message: 'AWS selected for compute workload.' },
];

router.get('/', protect, (req, res) => {
  res.json({ logs: logStore });
});

router.get('/errors', protect, (req, res) => {
  res.json({ logs: logStore.filter((item) => item.severity === 'ERROR') });
});

router.get('/decisions', protect, (req, res) => {
  res.json({ logs: logStore.filter((item) => item.eventType === 'DECISION_MADE') });
});

router.get('/routing', protect, (req, res) => {
  res.json({ logs: logStore.filter((item) => item.eventType === 'ROUTING_CHANGED') });
});

router.get('/events', protect, (req, res) => {
  res.json({ logs: logStore });
});

module.exports = router;
