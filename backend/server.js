require('dotenv').config();
const express = require('express');
const cors = require('cors');
const razorpay = require('./lib/razorpay');

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection (server staying up):', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (server staying up):', err);
});

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/policy', require('./routes/policy'));
app.use('/api/agent', require('./routes/agent'));
app.use('/api/mandate', require('./routes/mandate'));
app.use('/api/audit', require('./routes/audit'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, razorpayMock: razorpay.MOCK });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mandate backend running on http://localhost:${PORT}`);
  console.log(`Razorpay mode: ${razorpay.MOCK ? 'MOCK (no real money moves)' : 'LIVE'}`);
});
