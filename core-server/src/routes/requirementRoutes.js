const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

const requirementsStore = [];

router.post('/', protect, (req, res) => {
  const requirement = {
    id: `req-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  requirementsStore.push(requirement);
  res.status(201).json({ requirement });
});

router.get('/:id', protect, (req, res) => {
  const requirement = requirementsStore.find((item) => item.id === req.params.id);
  if (!requirement) {
    return res.status(404).json({ message: 'Requirement not found.' });
  }
  res.json({ requirement });
});

module.exports = router;
