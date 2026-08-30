const express = require('express');
const router = express.Router();
const { createMandate } = require('../lib/mandate');
const razorpay = require('../lib/razorpay');
const { save, load } = require('../lib/store');
const { logAudit } = require('../lib/audit');

router.post('/', async (req, res) => {
  const { capAmount, merchants, category, expiryDays, name, email, contact } = req.body;
  if (!capAmount || !merchants || !merchants.length) {
    return res.status(400).json({ error: 'capAmount and at least one merchant are required' });
  }

  const expiresAt = new Date(Date.now() + (expiryDays || 30) * 86400000).toISOString();
  const intentMandate = createMandate('intent', {
    capAmount,
    merchants,
    category: category || 'any',
    expiresAt
  });
  logAudit('intent_mandate_created', intentMandate);

  try {
    const auth = await razorpay.registerMandate({ maxAmount: capAmount, name, email, contact });
    logAudit('upi_autopay_registration_started', auth);

    const policy = {
      ...intentMandate,
      tokenId: auth.token_id || null,
      customerId: auth.customer_id || null,
      paymentId: auth.payment_id || null,
      invoiceId: auth.invoiceId || null,
      shortUrl: auth.shortUrl || null,
      status: auth.status,
      spent: 0
    };
    save('policy', policy);
    res.json(policy);
  } catch (err) {
    console.error('UPI Autopay registration failed:', err.message);
    logAudit('upi_autopay_registration_failed', { error: err.message });
    res.status(502).json({ error: err.message });
  }
});

router.post('/check-approval', async (req, res) => {
  const policy = load('policy', null);
  if (!policy || (!policy.paymentId && !policy.invoiceId)) {
    return res.status(400).json({ error: 'No pending mandate registration found.' });
  }
  try {
    const result = await razorpay.checkApprovalStatus({
      paymentId: policy.paymentId,
      invoiceId: policy.invoiceId
    });
    if (result.token_id) {
      policy.tokenId = result.token_id;
      policy.customerId = result.customerId || policy.customerId;
      policy.status = 'active';
      save('policy', policy);
      logAudit('upi_autopay_registered', result);
    } else {
      logAudit('upi_autopay_approval_pending', result);
    }
    res.json(policy);
  } catch (err) {
    console.error('Approval status check failed:', err.message);
    res.status(502).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  res.json(load('policy', null));
});

module.exports = router;
