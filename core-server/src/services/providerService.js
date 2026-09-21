const axios = require('axios');
const { awsMockUrl, azureMockUrl } = require('../config/env');

const providerMap = {
  AWS: awsMockUrl,
  AZURE: azureMockUrl,
};

const normalizeProvider = (provider) => {
  const workloads = provider.workloads || [];
  const users = provider.users || [];
  const services = provider.services || [];

  return {
    provider: provider.provider || provider.name || 'UNKNOWN',
    status: provider.status || 'unknown',
    region: provider.region || 'global',
    metrics: {
    latencyMs: provider.metrics?.latencyMs ?? 0,
    availability: provider.metrics?.availability ?? 0,
    errorRate: provider.metrics?.errorRate ?? 0,
    cpuUtilization: provider.metrics?.cpuUtilization ?? 0,
    memoryUtilization: provider.metrics?.memoryUtilization ?? 0,
    throughput: provider.metrics?.throughput ?? 0,
    costPerHour: provider.metrics?.costPerHour ?? 0,
    carbonIntensity: provider.metrics?.carbonIntensity ?? 0,
    activeWorkloads: provider.metrics?.activeWorkloads ?? 0,
    health: provider.metrics?.health || provider.status || 'unknown',
    },
    users,
    workloadCount: workloads.length,
    userCount: users.length,
    serviceStats: services.map((service) => ({
      serviceId: service.id,
      serviceName: service.name,
      category: service.category,
      workloadCount: workloads.filter((workload) => workload.service === service.id).length,
    })),
    services: services.map((service) => ({
    id: service.id,
    category: service.category,
    name: service.name,
    region: service.region,
    cpu: service.cpu,
    ram: service.ram,
    storage: service.storage,
    pricePerHour: service.pricePerHour ?? service.costPerHour ?? 0,
    availability: service.availability ?? 99.9,
    latencyMs: service.latencyMs ?? 0,
    throughput: service.throughput ?? 0,
    })),
  };
};

async function fetchProviderSnapshot(name) {
  const baseUrl = providerMap[name];
  if (!baseUrl) {
    throw new Error(`Unsupported provider: ${name}`);
  }

  const response = await axios.get(`${baseUrl}/api/provider`);
  return normalizeProvider(response.data);
}

async function fetchAllProviders() {
  const providerNames = Object.keys(providerMap);
  const providerResults = await Promise.all(providerNames.map((name) => fetchProviderSnapshot(name)));
  return providerResults;
}

async function updateProviderAdmin(name, action, payload = {}) {
  const baseUrl = providerMap[name];
  if (!baseUrl) {
    throw new Error(`Unsupported provider: ${name}`);
  }

  const allowedActions = {
    metrics: { method: 'patch', path: '/api/admin/metrics' },
    status: { method: 'patch', path: '/api/admin/status' },
    availability: { method: 'patch', path: '/api/admin/availability' },
    failure: { method: 'post', path: '/api/admin/simulate-failure' },
    reset: { method: 'post', path: '/api/admin/reset' },
  };
  const target = allowedActions[action];
  if (!target) {
    throw new Error(`Unsupported provider admin action: ${action}`);
  }

  const response = await axios({
    method: target.method,
    url: `${baseUrl}${target.path}`,
    data: payload,
  });
  return response.data;
}

async function createProviderWorkload(name, workloadId, service) {
  const baseUrl = providerMap[name];
  if (!baseUrl) {
    throw new Error(`Unsupported provider: ${name}`);
  }

  const response = await axios.post(`${baseUrl}/api/workloads`, {
    workload: workloadId,
    service,
  });
  return response.data;
}

module.exports = { fetchProviderSnapshot, fetchAllProviders, updateProviderAdmin, createProviderWorkload };
