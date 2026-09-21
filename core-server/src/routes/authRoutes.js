const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { protect } = require('../middleware/auth');

const router = express.Router();
const users = [
  {
    id: 'user-1',
    name: 'Demo Client',
    email: 'client@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'CLIENT',
  },
  {
    id: 'admin-1',
    name: 'Demo Admin',
    email: 'admin@example.com',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'ADMIN',
  },
];

const generateToken = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  const { name, email, password, role = 'CLIENT' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  const user = {
    id: `user-${Date.now()}`,
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role,
  };
  users.push(user);

  const token = generateToken(user);
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const token = generateToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', protect, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

module.exports = router;
