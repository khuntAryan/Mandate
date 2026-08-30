const express = require('express');
const router = express.Router();
const { createMandate } = require('../lib/mandate');
const razorpay = require('../lib/razorpay');
const catalog = require('../lib/catalog');
const { load, save } = require('../lib/store');
const { logAudit } = require('../lib/audit');

const DEMO_DELAY_MS = parseInt(process.env.DEMO_DEBIT_DELAY_MS || '8000', 10);

router.post('/confirm', async (req, res) => {
  try {
    const { productId, simulateDrift } = req.body;

    const policy = load('policy', null);
    if (!policy) {
      return res.status(400).json({ error: 'No mandate registered yet. Set a policy first.' });
    }
    if (!policy.tokenId) {
      return res.json({
        status: 'blocked',
        reason: 'Mandate not approved yet. Open the approval link on your phone, then check approval status.'
      });
    }

    const product = catalog.find((p) => p.id === productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const cartMandate = createMandate('cart', {
      merchant: product.merchant,
      productId: product.id,
      lockedPrice: product.price,
      parentIntentId: policy.id
    });
    logAudit('cart_mandate_created', cartMandate);

    const currentPrice = simulateDrift ? product.price + 350 : product.price;

    if (currentPrice !== cartMandate.lockedPrice) {
      logAudit('purchase_blocked', {
        reason: 'price_mismatch',
        lockedPrice: cartMandate.lockedPrice,
        currentPrice
      });
      return res.json({
        status: 'blocked',
        reason: 'Price changed since the cart mandate was signed. Blocking and escalating to you instead of guessing.',
        lockedPrice: cartMandate.lockedPrice,
        currentPrice
      });
    }

    if (!policy.merchants.includes(product.merchant)) {
      logAudit('purchase_blocked', { reason: 'merchant_not_allowed', merchant: product.merchant });
      return res.json({ status: 'blocked', reason: `${product.merchant} is not on your allowed list.` });
    }

    if (policy.spent + currentPrice > policy.capAmount) {
      logAudit('purchase_blocked', {
        reason: 'over_cap',
        spent: policy.spent,
        capAmount: policy.capAmount
      });
      return res.json({ status: 'blocked', reason: 'This purchase would go over your spending cap.' });
    }

    const paymentMandate = createMandate('payment', {
      amount: currentPrice,
      parentCartId: cartMandate.id,
      tokenId: policy.tokenId,
      singleUse: true
    });
    logAudit('payment_mandate_created', paymentMandate);

    const debit = await razorpay.scheduleDebit({
      tokenId: policy.tokenId,
      customerId: policy.customerId,
      amount: currentPrice,
      merchant: product.merchant,
      email: process.env.DEMO_CUSTOMER_EMAIL,
      contact: process.env.DEMO_CUSTOMER_CONTACT
    });
    logAudit('pre_debit_notice_sent', debit);

    setTimeout(() => {
      try {
        const latestPolicy = load('policy', policy);
        latestPolicy.spent += currentPrice;
        save('policy', latestPolicy);
        logAudit('debit_executed', { debitId: debit.debit_id, amount: currentPrice, merchant: product.merchant });
      } catch (err) {
        console.error('Failed to finalize scheduled debit:', err.message);
        logAudit('debit_finalize_failed', { error: err.message });
      }
    }, DEMO_DELAY_MS);

    res.json({
      status: 'scheduled',
      amount: currentPrice,
      merchant: product.merchant,
      debitId: debit.debit_id,
      noticeWindowMs: DEMO_DELAY_MS,
      note: 'In production this window is a real 24-hour RBI pre-debit notice, compressed here for the demo.'
    });
  } catch (err) {
    console.error('Purchase confirm failed:', err.message);
    logAudit('purchase_error', { error: err.message });
    res.status(502).json({ status: 'blocked', reason: err.message });
  }
});

module.exports = router;
