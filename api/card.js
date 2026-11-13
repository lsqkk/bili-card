const { sendErrorSVG } = require('../lib/utils/errors');
const logger = require('../lib/utils/logger');
const { parseOptions, validUid } = require('../lib/card-options');
const { getUser } = require('../lib/bilibili');
const { embedImage } = require('../lib/images');
const { renderCard } = require('../lib/card-svg');
const { limitRequest, prepare, setCache } = require('../lib/http');
const demo = require('../lib/demo');

module.exports = async (req, res) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src data:; style-src 'unsafe-inline'; frame-ancestors 'none'");
  const error = (code, status, message) => sendErrorSVG(res, code, message, status);
  if (!prepare(req, res, (status, message) => error('METHOD_ERROR', status, message))) return;
  const query = req.query || {};
  const options = parseOptions(query);
  if (!options.demo && !validUid(query.uid)) return error('ID_ERROR', 400, 'Invalid UID');
  if (!options.demo && !limitRequest(req, res)) return error('RATE_LIMIT', 429, 'Too many requests');
  try {
    let data = demo;
    let partial = false;
    if (!options.demo) {
      const user = await getUser(query.uid, options.hide.has('video') ? null : options.order);
      const { face, video } = user.data;
      const [avatar, cover] = await Promise.all([
        options.hide.has('avatar') ? '' : embedImage(face, 'avatar', options.animated),
        video ? embedImage(video.cover, 'cover', options.animated) : ''
      ]);
      partial = user.partial || Boolean(!options.hide.has('avatar') && face && !avatar)
        || Boolean(video?.cover && !cover);
      data = { ...user.data, face: avatar, video: video && { ...video, cover } };
    }
    const svg = renderCard(data, options);
    setCache(res, options.cache, partial);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (cause) {
    if (cause.status === 404) return error('NOT_FOUND', 404, 'User not found');
    logger.warn('Card request failed', { uid: query.uid, error: cause.message });
    return error('FETCH_ERROR', 502, 'Profile temporarily unavailable');
  }
};
