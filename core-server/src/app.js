const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const providerRoutes = require('./routes/providerRoutes');
const requirementRoutes = require('./routes/requirementRoutes');
const workloadRoutes = require('./routes/workloadRoutes');
const decisionRoutes = require('./routes/decisionRoutes');
const routingRoutes = require('./routes/routingRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const logRoutes = require('./routes/logRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CloudSync Core Server' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/workloads', workloadRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/routing', routingRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

module.exports = app;
