const { load, save } = require('./store');

function logAudit(event, data) {
  try {
    const log = load('audit', []);
    log.push({ event, data, at: new Date().toISOString() });
    save('audit', log);
    return log;
  } catch (err) {
    console.error('Audit log write failed (continuing anyway):', err.message);
    return [];
  }
}

function getAudit() {
  try {
    return load('audit', []);
  } catch (err) {
    console.error('Audit log read failed:', err.message);
    return [];
  }
}

function clearAudit() {
  save('audit', []);
}

module.exports = { logAudit, getAudit, clearAudit };
