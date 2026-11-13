const { rateLimit } = require('./rate-limit');

function limitRequest(req, res) {
  const forwarded = req.headers?.['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' && forwarded.split(',')[0].trim())
    || req.socket?.remoteAddress || 'unknown';
  const result = rateLimit(ip);
  if (!result.allowed) res.setHeader('Retry-After', result.retryAfter);
  return result.allowed;
}

function prepare(req, res, error) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return false;
  }
  if (req.method && !['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD, OPTIONS');
    error(405, 'Method not allowed');
    return false;
  }
  return true;
}

function setCache(res, seconds, partial = false) {
  if (!seconds) return;
  const ttl = partial ? Math.min(seconds, 60) : seconds;
  res.setHeader('Cache-Control', 'public, max-age=' + ttl + ', s-maxage=' + ttl + (partial ? '' : ', stale-while-revalidate=300'));
}

module.exports = { limitRequest, prepare, setCache };
