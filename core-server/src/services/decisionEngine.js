function normalizeScore(value, min, max) {
  if (max === min) return 1;
  return (value - min) / (max - min);
}

function evaluateProvider(provider, requirements = {}, priorities = {}) {
  const metric = provider.metrics || {};
  const services = provider.services || [];
  const normalized = {
    provider: provider.provider,
    services,
    score: 0,
    breakdown: {},
    reasons: [],
  };

  const costLimit = requirements.maxCostPerHour;
  const latencyLimit = requirements.maxLatencyMs;
  const availabilityMin = requirements.minimumAvailability;
  const maxCarbon = requirements.maxCarbonIntensity;

  const costScore = costLimit ? (costLimit >= (metric.costPerHour || 0) ? 1 : 0.3) : 1;
  const latencyScore = latencyLimit ? (latencyLimit >= (metric.latencyMs || 0) ? 1 : 0.2) : 1;
  const reliabilityScore = availabilityMin ? ((metric.availability || 0) >= availabilityMin ? 1 : 0.35) : 1;
  const performanceScore = 1 - Math.min((metric.cpuUtilization || 0) / 100, 1) * 0.6;
  const carbonScore = maxCarbon ? ((maxCarbon >= (metric.carbonIntensity || 0)) ? 1 : 0.4) : 1;

  normalized.breakdown = {
    cost: costScore,
    latency: latencyScore,
    reliability: reliabilityScore,
    performance: performanceScore,
    carbon: carbonScore,
  };

  const effectivePriorities = {
    cost: priorities.cost || 0.3,
    latency: priorities.latency || 0.3,
    reliability: priorities.reliability || 0.2,
    performance: priorities.performance || 0.1,
    carbon: priorities.carbon || 0.1,
  };

  normalized.score = Object.entries(normalized.breakdown).reduce((total, [key, value]) => {
    return total + (value * (effectivePriorities[key] || 0));
  }, 0);

  const hardConstraintFailed = (
    (latencyLimit && (metric.latencyMs || 0) > latencyLimit) ||
    (availabilityMin && (metric.availability || 0) < availabilityMin) ||
    (costLimit && (metric.costPerHour || 0) > costLimit) ||
    (maxCarbon && (metric.carbonIntensity || 0) > maxCarbon)
  );

  if (hardConstraintFailed) {
    normalized.score = 0;
    normalized.reasons.push('Provider failed one or more hard constraints.');
  }

  if (metric.status === 'unhealthy' || metric.health === 'critical') {
    normalized.score = 0;
    normalized.reasons.push('Provider is unhealthy or critical.');
  }

  return normalized;
}

function decideBestProvider(providers, requirements = {}, priorities = {}) {
  const evaluations = providers.map((provider) => evaluateProvider(provider, requirements, priorities));
  const valid = evaluations.filter((entry) => entry.score > 0);
  const selected = valid.sort((a, b) => b.score - a.score)[0] || evaluations[0];

  if (!selected) {
    return { selectedProvider: null, selectedService: null, score: 0, evaluations: [] };
  }

  const chosenService = (selected.services || [])[0] || null;

  return {
    provider: selected.provider,
    selectedProvider: selected.provider,
    selectedService: chosenService,
    score: selected.score,
    evaluations,
    winner: selected,
  };
}

module.exports = { decideBestProvider, evaluateProvider };
