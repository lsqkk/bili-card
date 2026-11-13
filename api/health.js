const { prepare } = require('../lib/http');

module.exports = async (req, res) => {
  const error = (status, message) => res.status(status).json({ status: 'error', error: message });
  if (!prepare(req, res, error)) return;
  res.json({ status: 'ok', timestamp: Date.now(), uptime: process.uptime() });
};
