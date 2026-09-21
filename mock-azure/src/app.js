const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const providerName = process.env.PROVIDER_NAME || 'AZURE';

const provider = {
  provider: providerName,
  status: 'healthy',
  region: 'us-east',
  metrics: {
    latencyMs: 88,
    availability: 99.91,
    errorRate: 0.5,
    cpuUtilization: 58,
    memoryUtilization: 51,
    throughput: 1090,
    costPerHour: 0.14,
    carbonIntensity: 480,
    activeWorkloads: 10,
    health: 'healthy'
  },
  services: [
    { id: 'azure-compute-1', category: 'compute', name: 'Azure Compute', region: 'us-east', cpu: 4, ram: 16, storage: 120, pricePerHour: 0.14, availability: 99.91, latencyMs: 88, throughput: 1100 },
    { id: 'azure-storage-1', category: 'storage', name: 'Azure Storage', region: 'us-east', cpu: 2, ram: 8, storage: 550, pricePerHour: 0.09, availability: 99.9, latencyMs: 95, throughput: 840 },
    { id: 'azure-database-1', category: 'database', name: 'Azure Database', region: 'us-east', cpu: 5, ram: 24, storage: 220, pricePerHour: 0.16, availability: 99.92, latencyMs: 82, throughput: 980 }
  ],
  resources: [
    { type: 'compute', available: 20 },
    { type: 'storage', available: 900 },
    { type: 'database', available: 18 }
  ],
  workloads: [
    { id: 'azure-wl-201', workload: 'customer-portal', status: 'active', service: 'azure-compute-1' },
    { id: 'azure-wl-202', workload: 'media-store', status: 'active', service: 'azure-storage-1' }
  ],
  users: [
    { id: 'azure-user-1', name: 'Demo User', region: 'us-east' }
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
  const newItem = { id: `azure-wl-${Date.now()}`, workload, service, status: 'active' };
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
    latencyMs: 88,
    availability: 99.91,
    errorRate: 0.5,
    cpuUtilization: 58,
    memoryUtilization: 51,
    throughput: 1090,
    costPerHour: 0.14,
    carbonIntensity: 480,
    activeWorkloads: 10,
    health: 'healthy'
  };
  res.json({ provider: providerName, reset: true, metrics: provider.metrics });
});

module.exports = app;
