const express = require('express');
const router = express.Router();
const catalog = require('../lib/catalog');
const { findMatches } = require('../lib/matcher');
const { logAudit } = require('../lib/audit');

router.post('/request', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  const result = findMatches(message, catalog, { limit: 3 });
  logAudit('buyer_agent_search', { message, ...result });

  if (!result.best) {
    return res.json({
      found: false,
      message: result.mentionedMerchant
        ? `Nothing at ${result.mentionedMerchant} matched that within budget.`
        : 'No matching product found within that budget.'
    });
  }

  res.json({
    found: true,
    product: result.best,
    reasoning: result.reasoning,
    alternatives: result.alternatives
  });
});

router.get('/merchants', (req, res) => {
  const merchants = [...new Set(catalog.map((p) => p.merchant))];
  res.json({ merchants, productCount: catalog.length });
});

module.exports = router;
