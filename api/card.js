// api/card.js - 支持图片Base64内嵌
const { sendErrorSVG } = require('../lib/utils/errors');
const { imageCache, esc } = require('../lib/utils/common');
const COMMENTS = require('../lib/utils/comments');

const CONFIG = {
  CACHE_TTL: 3600,
  TIMEOUT: 15000,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const proxyImageUrl = (url) => {
  if (!url) return '';

  if (url.includes('hdslb.com') || url.includes('bilivideo.com') || url.includes('bilibili.com')) {
    const encodedUrl = encodeURIComponent(url);
    return `https://images.weserv.nl/?url=${encodedUrl}&w=400&h=225&output=webp&q=80`;
  }

  return url;
};

const fetchBuffer = async (url, options = {}) => {
  const response = await fetch(url, {
    signal: options.signal || AbortSignal.timeout(options.timeout || 5000),
    headers: {
      'User-Agent': CONFIG.USER_AGENT,
      ...options.headers
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await response.arrayBuffer());
  return { contentType, buffer };
};

const fetchImageToBase64 = async (url) => {
  if (!url || !url.startsWith('http')) return '';

  const proxiedUrl = proxyImageUrl(url);

  const cacheKey = url;
  const cacheEntry = imageCache.get(cacheKey);
  if (cacheEntry && Date.now() - cacheEntry.timestamp < 30 * 60 * 1000) {
    return cacheEntry.base64;
  }

  try {
    const { contentType, buffer } = await fetchBuffer(proxiedUrl, { timeout: 5000 });
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    imageCache.set(cacheKey, { base64: dataUrl, timestamp: Date.now() });
    return dataUrl;
  } catch (error) {
    console.warn(`Failed to fetch image: ${url} (proxied: ${proxiedUrl})`, error.message);

    if (proxiedUrl !== url) {
      try {
        const { contentType, buffer } = await fetchBuffer(url, {
          timeout: 3000,
          headers: { 'Referer': 'https://www.bilibili.com/' }
        });
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${contentType};base64,${base64}`;

        imageCache.set(cacheKey, { base64: dataUrl, timestamp: Date.now() });
        return dataUrl;
      } catch (fallbackError) {
        console.warn(`Fallback also failed for image: ${url}`, fallbackError.message);
      }
    }

    return '';
  }
};

const fetchLevelIcon = async (level) => {
  if (level < 0 || level > 6) return '';

  try {
    const levelSuffix = level === 6 ? '_Lightning' : '';
    const url = `https://cdn.jsdelivr.net/gh/lsqkk/bili-card/assets/LV${level}${levelSuffix}.svg`;

    const { buffer } = await fetchBuffer(url, { timeout: 5000 });
    const base64 = buffer.toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  } catch (error) {
    console.warn(`Failed to fetch level icon for level ${level}`, error.message);
    return '';
  }
};

module.exports = async (req, res) => {
  const { uid, theme = 'default', color = 'white' } = req.query;
  if (!uid || !/^\d+$/.test(uid)) {
    return sendErrorSVG(res, 'ID_ERROR', 'Invalid UID', 400);
  }

  try {
    let themeModule;
    try {
      themeModule = require(`../lib/themes/${theme}`);
    } catch (err) {
      themeModule = require('../lib/themes/default');
    }

    let colorScheme;
    try {
      colorScheme = require(`../lib/colors/${color}`);
    } catch (err) {
      colorScheme = require('../lib/colors/white');
    }

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

    const cardData = cardRes.status === 'fulfilled' ? cardRes.value : {};
    const videoData = videoRes.status === 'fulfilled' ? videoRes.value?.videos?.[0] : null;

    const imagePromises = [];

    const faceUrl = cardData.data?.card?.face;
    if (faceUrl) {
      imagePromises.push(fetchImageToBase64(faceUrl).then(base64 => ({ type: 'face', base64 })));
    }

    if (videoData) {
      const coverUrl = videoData.cover || videoData.pic;
      if (coverUrl) {
        imagePromises.push(fetchImageToBase64(coverUrl).then(base64 => ({ type: 'videoCover', base64 })));
      }
    }

    const level = cardData.data?.card?.level_info?.current_level || 0;
    if (level >= 0 && level <= 6) {
      imagePromises.push(fetchLevelIcon(level).then(base64 => ({ type: 'levelIcon', base64 })));
    }

    const imageResults = await Promise.allSettled(imagePromises);

    const images = { face: '', videoCover: '', levelIcon: '' };
    imageResults.forEach(result => {
      if (result.status === 'fulfilled') {
        images[result.value.type] = result.value.base64;
      }
    });

    const data = {
      name: esc(cardData.data?.card?.name || 'Unknown'),
      face: images.face,
      level: level,
      sign: esc(cardData.data?.card?.sign || '这个人很懒，什么都没有写...'),
      follower: cardData.data?.follower || 0,
      following: cardData.data?.card?.attention || 0,
      like: cardData.data?.like_num || 0,
      video: videoData ? {
        title: esc(videoData.title),
        play: videoData.play_count || 0,
        cover: images.videoCover || '',
      } : null,
      levelIcon: images.levelIcon
    };

    const svgContent = themeModule.generateSVG(data, colorScheme.palette);

    const svg = `${COMMENTS.banner}
${svgContent}`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
    res.send(svg);
  } catch (err) {
    console.error('Card generation error:', err);
    sendErrorSVG(res, 'FETCH_ERROR', 'API Request Failed', 502);
  }
};