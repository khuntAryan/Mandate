const express = require('express');
const router = express.Router();
const { getAudit } = require('../lib/audit');

router.get('/', (req, res) => {
  res.json(getAudit());
});

module.exports = router;
