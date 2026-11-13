const logger = require('../lib/utils/logger');
const { validUid } = require('../lib/card-options');
const { getUser } = require('../lib/bilibili');
const { limitRequest, prepare, setCache } = require('../lib/http');

module.exports = async (req, res) => {
  const error = (status, message) => res.status(status).json({ success: false, error: message });
  if (!prepare(req, res, error)) return;
  const { uid, hideVideo, video } = req.query || {};
  if (!validUid(uid)) return error(400, 'Invalid UID');
  if (!limitRequest(req, res)) return error(429, 'Too many requests');

  try {
    const order = hideVideo === 'true' ? null : video === 'popular' ? 'views' : 'pubdate';
    const result = await getUser(uid, order);
    const data = { ...result.data };
    // Keep the original numeric JSON fields for existing clients.
    for (const key of ['level', 'follower', 'following', 'like']) data[key] ??= 0;
    if (data.video) {
      for (const key of ['play', 'danmaku', 'created']) data.video[key] ??= 0;
    }
    setCache(res, 3600, result.partial);
    res.json({ success: true, data, ...(result.partial && { partial: true }) });
  } catch (cause) {
    if (cause.status === 404) return error(404, 'User not found');
    logger.warn('Data request failed', { uid, error: cause.message });
    return error(502, 'API Request Failed');
  }
};
