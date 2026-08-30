const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const SECRET = process.env.MANDATE_SECRET || 'dev-secret-change-me';

function sign(payload) {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHmac('sha256', SECRET).update(canonical).digest('hex');
}

function createMandate(type, payload) {
  const body = {
    id: uuidv4(),
    type,
    createdAt: new Date().toISOString(),
    ...payload
  };
  const signature = sign(body);
  return { ...body, signature };
}

function verifyMandate(mandate) {
  const { signature, ...body } = mandate;
  return sign(body) === signature;
}

module.exports = { createMandate, verifyMandate };
