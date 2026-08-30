const MOCK = process.env.RAZORPAY_MOCK !== 'false';
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const BASE_URL = 'https://api.razorpay.com/v1';

function randomId(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 10);
}

function authHeader() {
  return 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
}

function assertCredentials() {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error('RAZORPAY_MOCK=false but RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set in .env');
  }
}

async function rzpPost(path, body) {
  assertCredentials();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
    body: JSON.stringify(body)
  });
  let data = {};
  try {
    data = await res.json();
  } catch (e) {

  }
  if (!res.ok) {
    const detail = data?.error?.description || `HTTP ${res.status} ${res.statusText}`;
    throw new Error(`Razorpay ${path} failed: ${detail}`);
  }
  return data;
}

async function rzpGet(path) {
  assertCredentials();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: authHeader() }
  });
  let data = {};
  try {
    data = await res.json();
  } catch (e) {

  }
  if (!res.ok) {
    const detail = data?.error?.description || `HTTP ${res.status} ${res.statusText}`;
    throw new Error(`Razorpay ${path} failed: ${detail}`);
  }
  return data;
}

async function registerMandate({ maxAmount, name, email, contact }) {
  if (MOCK) {
    return {
      status: 'active',
      token_id: randomId('token_mock'),
      payment_id: randomId('pay_mock')
    };
  }

  const tenYears = 10 * 365 * 24 * 3600;
  const invoice = await rzpPost('/subscription_registration/auth_links', {
    customer: {
      name: name || process.env.DEMO_CUSTOMER_NAME || 'Demo User',
      email: email || process.env.DEMO_CUSTOMER_EMAIL,
      contact: contact || process.env.DEMO_CUSTOMER_CONTACT
    },
    type: 'link',
    amount: '100',
    currency: 'INR',
    description: 'Register your Mandate spending mandate',
    subscription_registration: {
      method: 'upi',
      max_amount: String(Math.round(maxAmount * 100)),
      expire_at: Math.floor(Date.now() / 1000) + tenYears,
      frequency: 'as_presented'
    },
    receipt: 'mandate_link_' + Date.now(),
    email_notify: true,
    sms_notify: true
  });

  return {
    status: 'awaiting_approval',
    method: 'link',
    shortUrl: invoice.short_url,
    invoiceId: invoice.id
  };
}

async function checkApprovalStatus({ paymentId, invoiceId }) {
  if (MOCK) {
    return { status: 'captured', token_id: randomId('token_mock') };
  }

  if (invoiceId) {
    const invoice = await rzpGet(`/invoices/${invoiceId}`);
    if (invoice.status !== 'paid' || !invoice.payment_id) {
      return { status: invoice.status, token_id: null };
    }
    const payment = await rzpGet(`/payments/${invoice.payment_id}`);
    return { status: payment.status, token_id: payment.token_id || null, customerId: payment.customer_id };
  }

  const payment = await rzpGet(`/payments/${paymentId}`);
  return { status: payment.status, token_id: payment.token_id || null, customerId: payment.customer_id };
}

async function scheduleDebit({ tokenId, customerId, amount, email, contact }) {
  if (MOCK) {
    return {
      debit_id: randomId('dbt_mock'),
      status: 'pre_debit_notice_sent',
      notice_sent_at: new Date().toISOString()
    };
  }

  const order = await rzpPost('/orders', {
    amount: Math.round(amount * 100),
    currency: 'INR',
    payment_capture: true,
    receipt: 'debit_' + tokenId + '_' + Date.now()
  });

  const payment = await rzpPost('/payments/create/recurring', {
    email: email || process.env.DEMO_CUSTOMER_EMAIL,
    contact: contact || process.env.DEMO_CUSTOMER_CONTACT,
    amount: Math.round(amount * 100),
    currency: 'INR',
    order_id: order.id,
    customer_id: customerId,
    token: tokenId,
    recurring: true,
    description: 'Mandate purchase'
  });

  return {
    debit_id: payment.razorpay_payment_id || payment.id,
    status: payment.status || 'created',
    notice_sent_at: new Date().toISOString()
  };
}

module.exports = { registerMandate, checkApprovalStatus, scheduleDebit, MOCK };
