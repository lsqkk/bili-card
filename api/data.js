// api/data.js - JSON 数据 API，返回 B 站用户数据
const logger = require('../lib/utils/logger');

const CONFIG = {
  CACHE_TTL: 3600,
  TIMEOUT: 15000,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

module.exports = async (req, res) => {
  const { uid } = req.query;
  if (!uid || !/^\d+$/.test(uid)) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ success: false, error: 'Invalid UID' });
  }

  try {
    const [cardRes, videoRes] = await Promise.allSettled([
      fetch(`https://api.bilibili.com/x/web-interface/card?mid=${uid}`, {
        signal: AbortSignal.timeout(CONFIG.TIMEOUT),
        headers: {
          'User-Agent': CONFIG.USER_AGENT,
          'Referer': 'https://www.bilibili.com/'
        }
      }).then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))),
      fetch(`https://uapis.cn/api/v1/social/bilibili/archives?mid=${uid}&ps=1`, {
        signal: AbortSignal.timeout(CONFIG.TIMEOUT)
      }).then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
    ]);

    const cardData = cardRes.status === 'fulfilled' ? cardRes.value : null;
    const videoOk = videoRes.status === 'fulfilled';
    const videoData = videoOk ? videoRes.value?.videos?.[0] : null;

    if (!cardData?.data?.card) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const data = {
      uid: parseInt(uid),
      name: cardData.data.card.name || 'Unknown',
      face: cardData.data.card.face || '',
      level: cardData.data.card.level_info?.current_level || 0,
      sign: cardData.data.card.sign || '',
      follower: cardData.data.follower || 0,
      following: cardData.data.card.attention || 0,
      like: cardData.data.like_num || 0,
      video: videoData ? {
        title: videoData.title,
        cover: videoData.cover || videoData.pic || '',
        play: videoData.play_count || 0,
        danmaku: videoData.danmaku_count || 0,
        created: videoData.created || 0,
      } : null,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
    res.json({ success: true, data });
  } catch (err) {
    logger.error('Data API error', { error: err.message, uid });
    res.setHeader('Content-Type', 'application/json');
    res.status(502).json({ success: false, error: 'API Request Failed' });
  }
};
