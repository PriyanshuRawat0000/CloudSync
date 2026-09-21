import { useMemo, useState, useEffect } from 'react';
import { authApi, providerApi, decisionApi, workloadApi, routingApi, adminApi, aiApi, setAuthToken } from './services/api';

const demoUser = { email: 'client@example.com', password: 'password123' };

const initialRequirements = {
  serviceCategory: 'compute',
  maxLatencyMs: 100,
  minimumAvailability: 99.9,
  maxCostPerHour: 0.2,
  maxCarbonIntensity: '',
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('cloudsync_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('cloudsync_user') || 'null'));
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: demoUser.email, password: demoUser.password, role: 'CLIENT' });
  const [requirements, setRequirements] = useState(initialRequirements);
  const [mode, setMode] = useState('automatic');
  const [providers, setProviders] = useState([]);
  const [routing, setRouting] = useState(null);
  const [decision, setDecision] = useState(null);
  const [workloads, setWorkloads] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('AWS');
  const [selectedService, setSelectedService] = useState('aws-compute-1');
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: 'Welcome to CloudSync AI. Ask about provider health, monitoring, routing, and decisions.', timestamp: new Date().toLocaleTimeString() }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adminProvider, setAdminProvider] = useState('AWS');
  const [adminMetrics, setAdminMetrics] = useState({
    latencyMs: 72,
    availability: 99.96,
    errorRate: 0.2,
    cpuUtilization: 62,
    costPerHour: 0.12,
    carbonIntensity: 420,
  });
  const [adminProcessing, setAdminProcessing] = useState(false);

  useEffect(() => {
    setAuthToken(token);
    if (token) {
      localStorage.setItem('cloudsync_token', token);
      loadDashboard();
      const refreshTimer = user?.role === 'ADMIN' ? setInterval(loadDashboard, 5000) : null;
      return () => {
        if (refreshTimer) clearInterval(refreshTimer);
      };
    } else {
      localStorage.removeItem('cloudsync_token');
      localStorage.removeItem('cloudsync_user');
    }
  }, [token]);

  const loadDashboard = async () => {
    try {
      const [providersResponse, routingResponse, workloadResponse] = await Promise.all([
        providerApi.getAll(),
        routingApi.current(),
        workloadApi.list(),
      ]);
      const providerList = providersResponse.data.providers || [];
      setProviders(providerList);
      setRouting(routingResponse.data.routing || null);
      setWorkloads(workloadResponse.data.workloads || []);
      if (providerList.length) {
        const defaultProvider = providerList[0];
        setSelectedProvider(defaultProvider.provider);
        const firstService = defaultProvider.services?.[0];
        if (firstService) {
          setSelectedService(firstService.id);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      };
      const response = authMode === 'login'
        ? await authApi.login({ email: form.email, password: form.password })
        : await authApi.register(payload);

      const tokenValue = response.data.token;
      const userValue = response.data.user;
      setToken(tokenValue);
      setUser(userValue);
      localStorage.setItem('cloudsync_user', JSON.stringify(userValue));
    } catch (error) {
      alert(error.response?.data?.message || 'Authentication failed');
    }
  };

  const evaluateDecision = async () => {
    setProcessing(true);
    try {
      const payload = {
        requirements: {
          serviceCategory: requirements.serviceCategory,
          maxLatencyMs: Number(requirements.maxLatencyMs) || null,
          minimumAvailability: Number(requirements.minimumAvailability) || null,
          maxCostPerHour: Number(requirements.maxCostPerHour) || null,
          maxCarbonIntensity: requirements.maxCarbonIntensity ? Number(requirements.maxCarbonIntensity) : null,
        },
        priorities: {
          cost: 0.3,
          latency: 0.3,
          reliability: 0.2,
          performance: 0.1,
          carbon: 0.1,
        },
      };

      const response = await decisionApi.evaluate(payload);
      const result = response.data.decision;
      setDecision(result);

      if (result.selectedProvider) {
        setSelectedProvider(result.selectedProvider);
        const selectedProviderDetails = providers.find((item) => item.provider === result.selectedProvider);
        const chosenService = selectedProviderDetails?.services?.[0];
        if (chosenService) {
          setSelectedService(chosenService.id);
        }
      }
    } catch (error) {
      console.error(error);
      alert('Decision evaluation failed.');
    } finally {
      setProcessing(false);
    }
  };

  const applyRouting = async () => {
    try {
      const targetProvider = mode === 'automatic' ? decision?.selectedProvider : selectedProvider;
      const providerDetails = providers.find((item) => item.provider === targetProvider);
      const providerService = providerDetails?.services?.find((service) => service.id === selectedService) || providerDetails?.services?.[0];

      const payload = {
        workloadId: 'wl-demo-1',
        provider: targetProvider,
        service: providerService?.id || selectedService,
        mode,
      };

      if (mode === 'automatic') {
        await routingApi.automatic(payload);
      } else {
        await routingApi.manual(payload);
      }

      const result = await routingApi.current();
      setRouting(result.data.routing);
      alert(`Routing updated to ${targetProvider} in ${mode} mode.`);
    } catch (error) {
      console.error(error);
      alert('Routing update failed.');
    }
  };

  const createWorkload = async () => {
    try {
      const providerDetails = providers.find((item) => item.provider === selectedProvider);
      const providerService = providerDetails?.services?.find((service) => service.id === selectedService) || providerDetails?.services?.[0];

      const payload = {
        serviceCategory: requirements.serviceCategory,
        provider: selectedProvider,
        service: providerService?.id || selectedService,
        mode,
      };

      const response = await workloadApi.create(payload);
      setWorkloads((current) => [...current, response.data.workload]);
      await evaluateDecision();
    } catch (error) {
      console.error(error);
      alert('Workload creation failed.');
    }
  };

  const updateAdminMetrics = async () => {
    setAdminProcessing(true);
    try {
      const response = await adminApi.updateProvider(adminProvider, 'metrics', {
        latencyMs: Number(adminMetrics.latencyMs),
        availability: Number(adminMetrics.availability),
        errorRate: Number(adminMetrics.errorRate),
        cpuUtilization: Number(adminMetrics.cpuUtilization),
        costPerHour: Number(adminMetrics.costPerHour),
        carbonIntensity: Number(adminMetrics.carbonIntensity),
      });
      setProviders(response.data.providers || []);
      alert(`${adminProvider} metrics updated. Client evaluations will use these values.`);
    } catch (error) {
      alert(error.response?.data?.message || `Could not update ${adminProvider}.`);
    } finally {
      setAdminProcessing(false);
    }
  };

  const runAdminProviderAction = async (action) => {
    setAdminProcessing(true);
    try {
      const response = await adminApi.updateProvider(adminProvider, action);
      setProviders(response.data.providers || []);
      alert(`${adminProvider} ${action} completed.`);
    } catch (error) {
      alert(error.response?.data?.message || `Could not update ${adminProvider}.`);
    } finally {
      setAdminProcessing(false);
    }
  };

  const selectAdminProvider = (providerName) => {
    setAdminProvider(providerName);
    const provider = providers.find((item) => item.provider === providerName);
    if (!provider?.metrics) return;
    setAdminMetrics((current) => ({
      ...current,
      latencyMs: provider.metrics.latencyMs,
      availability: provider.metrics.availability,
      errorRate: provider.metrics.errorRate,
      cpuUtilization: provider.metrics.cpuUtilization,
      costPerHour: provider.metrics.costPerHour,
      carbonIntensity: provider.metrics.carbonIntensity,
    }));
  };

  const sendAiMessage = async () => {
    if (!aiInput.trim()) return;
    const message = aiInput.trim();
    setAiInput('');
    setLoading(true);
    setAiMessages((current) => [...current, { sender: 'user', text: message, timestamp: new Date().toLocaleTimeString() }]);
    try {
      const response = await aiApi.chat({
        message,
        token,
        userRole: user?.role || 'CLIENT',
      });
      setAiMessages((current) => [...current, {
        sender: 'ai',
        text: response.data.response || 'No answer returned.',
        timestamp: new Date().toLocaleTimeString(),
      }]);
    } catch (error) {
      setAiMessages((current) => [...current, {
        sender: 'ai',
        text: 'The AI could not reach the CloudSync service. Please try again later.',
        timestamp: new Date().toLocaleTimeString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const providerSummary = useMemo(() => {
    return providers.map((provider) => ({
      name: provider.provider,
      status: provider.status,
      latency: provider.metrics?.latencyMs,
      availability: provider.metrics?.availability,
      cost: provider.metrics?.costPerHour,
    }));
  }, [providers]);

  const manualServices = useMemo(() => {
    const providerDetails = providers.find((item) => item.provider === selectedProvider);
    return providerDetails?.services || [];
  }, [providers, selectedProvider]);

  if (!token || !user) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>CloudSync</h1>
          <p>Multi-cloud orchestration and AI insights</p>
          <div className="toggle-row">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
            <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Register</button>
          </div>
          <form onSubmit={handleAuth}>
            {authMode === 'register' && (
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {authMode === 'register' && (
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="CLIENT">Client</option>
                <option value="ADMIN">Admin</option>
              </select>
            )}
            <button type="submit">{authMode === 'login' ? 'Login' : 'Create account'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>CloudSync</h2>
        <div className="user-pill">{user.role}</div>
        <button onClick={() => setToken('')}>Logout</button>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <h3>Overview Dashboard</h3>
            <span>Welcome, {user.name}</span>
          </div>
          {user.role !== 'ADMIN' && <button onClick={createWorkload}>Create workload</button>}
        </header>

        <section className="stats-grid">
          {providerSummary.map((provider) => (
            <div key={provider.name} className="stat-card">
              <h4>{provider.name}</h4>
              <p className="status">{provider.status}</p>
              <p>Latency: {provider.latency} ms</p>
              <p>Availability: {provider.availability}%</p>
              <p>Cost: ${provider.cost}/hr</p>
            </div>
          ))}
        </section>

        {user.role === 'ADMIN' && (
          <section className="panel admin-panel">
            <div className="section-heading">
              <div>
                <h3>Provider Control Center</h3>
                <p>Change the dummy provider state. The core server will fetch these values for client decisions.</p>
              </div>
              <select value={adminProvider} onChange={(e) => selectAdminProvider(e.target.value)}>
                {providers.map((provider) => (
                  <option key={provider.provider} value={provider.provider}>{provider.provider}</option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              {Object.entries(adminMetrics).map(([key, value]) => (
                <label key={key}>
                  {key}
                  <input
                    type="number"
                    step="any"
                    value={value}
                    onChange={(e) => setAdminMetrics({ ...adminMetrics, [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>

            <div className="action-row">
              <button onClick={updateAdminMetrics} disabled={adminProcessing}>
                {adminProcessing ? 'Updating...' : 'Update metrics'}
              </button>
              <button onClick={() => runAdminProviderAction('failure')} disabled={adminProcessing}>Simulate failure</button>
              <button onClick={() => runAdminProviderAction('reset')} disabled={adminProcessing}>Reset provider</button>
            </div>
          </section>
        )}

        {user.role === 'ADMIN' && (
          <section className="panel">
            <h3>Provider Operations</h3>
            <div className="provider-operations">
              {providers.map((provider) => (
                <article key={provider.provider} className="provider-operation">
                  <div className="section-heading">
                    <div>
                      <h4>{provider.provider} · {provider.region}</h4>
                      <p className="status">{provider.status}</p>
                    </div>
                    <div className="provider-counts">
                      <strong>{provider.workloadCount || 0}</strong> workloads
                      <strong>{provider.userCount || 0}</strong> users
                    </div>
                  </div>
                  <div className="metric-grid">
                    {Object.entries(provider.metrics || {}).map(([key, value]) => (
                      <span key={key}><b>{key}</b>{String(value)}</span>
                    ))}
                  </div>
                  <h5>Workloads by service</h5>
                  <div className="service-stats">
                    {(provider.serviceStats || []).map((service) => (
                      <div key={service.serviceId} className="list-row">
                        <span>{service.serviceName} ({service.category})</span>
                        <strong>{service.workloadCount} workloads</strong>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {user.role === 'ADMIN' && (
          <section className="panel">
            <h3>Current Routing</h3>
            {routing ? (
              <div className="routing-summary">
                <span><b>Workload</b>{routing.workloadId}</span>
                <span><b>Provider</b>{routing.provider}</span>
                <span><b>Service</b>{routing.service}</span>
                <span><b>Mode</b>{routing.mode}</span>
                <span><b>Updated</b>{new Date(routing.updatedAt).toLocaleString()}</span>
              </div>
            ) : (
              <p>No routing has been recorded yet.</p>
            )}
          </section>
        )}

        {user.role !== 'ADMIN' && <section className="content-grid">
          <div className="panel">
            <h3>Workload Requirements</h3>
            <div className="form-grid">
              <label>
                Service category
                <select value={requirements.serviceCategory} onChange={(e) => setRequirements({ ...requirements, serviceCategory: e.target.value })}>
                  <option value="compute">Compute</option>
                  <option value="storage">Storage</option>
                  <option value="database">Database</option>
                </select>
              </label>

              <label>
                Max latency (ms)
                <input type="number" value={requirements.maxLatencyMs} onChange={(e) => setRequirements({ ...requirements, maxLatencyMs: e.target.value })} />
              </label>

              <label>
                Min availability (%)
                <input type="number" step="0.01" value={requirements.minimumAvailability} onChange={(e) => setRequirements({ ...requirements, minimumAvailability: e.target.value })} />
              </label>

              <label>
                Max cost/hr
                <input type="number" step="0.01" value={requirements.maxCostPerHour} onChange={(e) => setRequirements({ ...requirements, maxCostPerHour: e.target.value })} />
              </label>

              <label>
                Max carbon intensity
                <input type="number" value={requirements.maxCarbonIntensity} onChange={(e) => setRequirements({ ...requirements, maxCarbonIntensity: e.target.value })} />
              </label>
            </div>

            <div className="mode-row">
              <button className={mode === 'automatic' ? 'active' : ''} onClick={() => setMode('automatic')}>Automatic</button>
              <button className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')}>Manual</button>
            </div>

            <div className="action-row">
              <button onClick={evaluateDecision} disabled={processing}>{processing ? 'Evaluating...' : 'Evaluate decision'}</button>
              <button onClick={applyRouting}>Apply routing</button>
            </div>
          </div>

          <div className="panel">
            <h3>Latest Decision</h3>
            {decision ? (
              <div>
                <p><strong>Selected provider:</strong> {decision.selectedProvider}</p>
                <p><strong>Score:</strong> {decision.score}</p>
                <p><strong>Service:</strong> {decision.selectedService?.name || 'N/A'}</p>
                <p><strong>Reason:</strong> {decision.winner?.reasons?.[0] || 'Meets constraints.'}</p>
              </div>
            ) : (
              <p>No evaluation has run yet.</p>
            )}
          </div>
        </section>}

        {user.role !== 'ADMIN' && <section className="panel">
          <h3>Manual Provider Selection</h3>
          <div className="manual-form">
            <label>
              Provider
              <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)}>
                {providers.map((provider) => (
                  <option key={provider.provider} value={provider.provider}>{provider.provider}</option>
                ))}
              </select>
            </label>

            <label>
              Service
              <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                {manualServices.map((service) => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </label>
          </div>
        </section>}

        {user.role !== 'ADMIN' && <section className="content-grid">
          <div className="panel">
            <h3>Current Routing</h3>
            {routing ? (
              <ul>
                <li>Workload: {routing.workloadId}</li>
                <li>Provider: {routing.provider}</li>
                <li>Service: {routing.service}</li>
                <li>Mode: {routing.mode}</li>
              </ul>
            ) : (
              <p>No routing data</p>
            )}
          </div>

          <div className="panel">
            <h3>Workloads</h3>
            <div className="list-box">
              {workloads.map((item) => (
                <div key={item.id} className="list-row">
                  <span>{item.id}</span>
                  <span>{item.provider}</span>
                  <span>{item.mode}</span>
                </div>
              ))}
            </div>
          </div>
        </section>}

        {user.role !== 'ADMIN' && <section className="panel ai-panel">
          <h3>CloudSync AI</h3>
          <div className="chat-box">
            {aiMessages.map((message, index) => (
              <div key={`${message.sender}-${index}`} className={`message ${message.sender}`}>
                <span>{message.sender === 'ai' ? 'AI' : 'You'}</span>
                <p>{message.text}</p>
                <small>{message.timestamp}</small>
              </div>
            ))}
          </div>
          <div className="chat-input-row">
            <input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Ask CloudSync AI..." />
            <button onClick={sendAiMessage} disabled={loading}>{loading ? 'Thinking...' : 'Send'}</button>
          </div>
        </section>}
      </main>
    </div>
  );
}
