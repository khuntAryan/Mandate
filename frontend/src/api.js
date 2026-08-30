const BASE = '/api';

async function req(path, options) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return res.json();
}

export const api = {
  getHealth: () => req('/health'),
  getMerchants: () => req('/agent/merchants'),
  getPolicy: () => req('/policy'),
  setPolicy: (body) => req('/policy', { method: 'POST', body: JSON.stringify(body) }),
  checkApproval: () => req('/policy/check-approval', { method: 'POST' }),
  agentRequest: (message) => req('/agent/request', { method: 'POST', body: JSON.stringify({ message }) }),
  confirmPurchase: (body) => req('/mandate/confirm', { method: 'POST', body: JSON.stringify(body) }),
  getAudit: () => req('/audit')
};
