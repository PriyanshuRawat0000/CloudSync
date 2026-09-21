const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const providerName = process.env.PROVIDER_NAME || 'AWS';

const provider = {
  provider: providerName,
  status: 'healthy',
  region: 'india',
  metrics: {
    latencyMs: 72,
    availability: 99.96,
    errorRate: 0.2,
    cpuUtilization: 62,
    memoryUtilization: 54,
    throughput: 1200,
    costPerHour: 0.12,
    carbonIntensity: 420,
    activeWorkloads: 12,
    health: 'healthy'
  },
  services: [
    { id: 'aws-compute-1', category: 'compute', name: 'AWS Compute', region: 'india', cpu: 4, ram: 16, storage: 100, pricePerHour: 0.12, availability: 99.96, latencyMs: 72, throughput: 1200 },
    { id: 'aws-storage-1', category: 'storage', name: 'AWS Storage', region: 'india', cpu: 2, ram: 8, storage: 500, pricePerHour: 0.08, availability: 99.98, latencyMs: 80, throughput: 900 },
    { id: 'aws-database-1', category: 'database', name: 'AWS Database', region: 'india', cpu: 6, ram: 32, storage: 250, pricePerHour: 0.18, availability: 99.95, latencyMs: 65, throughput: 1100 }
  ],
  resources: [
    { type: 'compute', available: 18 },
    { type: 'storage', available: 820 },
    { type: 'database', available: 24 }
  ],
  workloads: [
    { id: 'aws-wl-101', workload: 'analytics-job', status: 'active', service: 'aws-compute-1' },
    { id: 'aws-wl-102', workload: 'archive', status: 'active', service: 'aws-storage-1' }
  ],
  users: [
    { id: 'aws-user-1', name: 'Demo User', region: 'india' }
  ]
};

app.get('/api/provider', (req, res) => {
  res.json(provider);
});

app.get('/api/services', (req, res) => {
  res.json({ provider: providerName, services: provider.services });
});

app.get('/api/services/:category', (req, res) => {
  const category = req.params.category;
  const filtered = provider.services.filter((s) => s.category === category);
  res.json({ provider: providerName, category, services: filtered });
});

app.get('/api/metrics', (req, res) => {
  res.json({ provider: providerName, metrics: provider.metrics, status: provider.status });
});

app.get('/api/health', (req, res) => {
  res.json({ provider: providerName, status: provider.status, healthy: provider.status === 'healthy' });
});

app.get('/api/cost', (req, res) => {
  res.json({ provider: providerName, costPerHour: provider.metrics.costPerHour });
});

app.get('/api/workloads', (req, res) => {
  res.json({ provider: providerName, workloads: provider.workloads });
});

app.post('/api/workloads', (req, res) => {
  const { workload, service } = req.body;
  const newItem = { id: `aws-wl-${Date.now()}`, workload, service, status: 'active' };
  provider.workloads.push(newItem);
  res.status(201).json({ message: 'Workload created', workload: newItem });
});

app.get('/api/resources', (req, res) => {
  res.json({ provider: providerName, resources: provider.resources });
});

app.get('/api/users', (req, res) => {
  res.json({ provider: providerName, users: provider.users });
});

app.patch('/api/admin/metrics', (req, res) => {
  const { latencyMs, availability, errorRate, cpuUtilization, memoryUtilization, throughput, costPerHour, carbonIntensity } = req.body;
  if (typeof latencyMs !== 'undefined') provider.metrics.latencyMs = latencyMs;
  if (typeof availability !== 'undefined') provider.metrics.availability = availability;
  if (typeof errorRate !== 'undefined') provider.metrics.errorRate = errorRate;
  if (typeof cpuUtilization !== 'undefined') provider.metrics.cpuUtilization = cpuUtilization;
  if (typeof memoryUtilization !== 'undefined') provider.metrics.memoryUtilization = memoryUtilization;
  if (typeof throughput !== 'undefined') provider.metrics.throughput = throughput;
  if (typeof costPerHour !== 'undefined') provider.metrics.costPerHour = costPerHour;
  if (typeof carbonIntensity !== 'undefined') provider.metrics.carbonIntensity = carbonIntensity;
  provider.metrics.health = provider.metrics.availability < 95 || provider.metrics.errorRate > 5 ? 'warning' : 'healthy';
  res.json({ provider: providerName, metrics: provider.metrics, updated: true });
});

app.patch('/api/admin/availability', (req, res) => {
  provider.metrics.availability = req.body.availability;
  provider.status = req.body.availability < 95 ? 'degraded' : 'healthy';
  res.json({ provider: providerName, availability: provider.metrics.availability, status: provider.status });
});

app.patch('/api/admin/status', (req, res) => {
  provider.status = req.body.status || provider.status;
  provider.metrics.health = provider.status;
  res.json({ provider: providerName, status: provider.status });
});

app.post('/api/admin/simulate-failure', (req, res) => {
  provider.status = 'unhealthy';
  provider.metrics.health = 'critical';
  provider.metrics.errorRate = 10;
  provider.metrics.latencyMs = 300;
  provider.metrics.availability = 80;
  res.json({ provider: providerName, status: provider.status, metrics: provider.metrics, message: 'Failure simulated.' });
});

app.post('/api/admin/reset', (req, res) => {
  provider.status = 'healthy';
  provider.metrics = {
    latencyMs: 72,
    availability: 99.96,
    errorRate: 0.2,
    cpuUtilization: 62,
    memoryUtilization: 54,
    throughput: 1200,
    costPerHour: 0.12,
    carbonIntensity: 420,
    activeWorkloads: 12,
    health: 'healthy'
  };
  res.json({ provider: providerName, reset: true, metrics: provider.metrics });
});

module.exports = app;
