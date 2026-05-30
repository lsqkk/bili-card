// api/card.js - 支持图片Base64内嵌
const { sendErrorSVG } = require('../lib/utils/errors');
const { imageCache, esc } = require('../lib/utils/common');
const { validatePalette } = require('../lib/utils/styleGenerator');
const { getLevelIcon } = require('../lib/level-icons');
const { rateLimit } = require('../lib/rate-limit');
const logger = require('../lib/utils/logger');
const COMMENTS = require('../lib/utils/comments');

const CONFIG = {
  CACHE_TTL: 3600,
  TIMEOUT: 15000,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// 模块加载时预校验所有主题和配色，防止运行时才发现语法错误
const THEME_IDS = ['default', 'modern', 'btv', 'simple'];
const COLOR_IDS = ['white', 'blue', 'pink', 'green', 'purple', 'dark'];

for (const id of THEME_IDS) {
  try {
    const mod = require(`../lib/themes/${id}`);
    if (typeof mod.generateSVG !== 'function') {
      logger.warn(`Theme "${id}" missing generateSVG export`);
    }
  } catch (err) {
    logger.error(`Theme "${id}" failed to load`, { error: err.message });
  }
}

for (const id of COLOR_IDS) {
  try {
    const mod = require(`../lib/colors/${id}`);
    if (!mod.palette || typeof mod.palette !== 'object') {
      logger.warn(`Color "${id}" missing palette export`);
    }
  } catch (err) {
    logger.error(`Color "${id}" failed to load`, { error: err.message });
  }
}

const proxyImageUrl = (url, options = {}) => {
  if (!url) return '';

  // 允许通过环境变量禁用图片代理
  if (process.env.IMAGE_PROXY_DISABLED === 'true' || process.env.IMAGE_PROXY_DISABLED === '1') {
    return url;
  }

  // 允许自定义图片代理 URL，使用 {url} 作为占位符
  if (process.env.IMAGE_PROXY_URL && (url.includes('hdslb.com') || url.includes('bilivideo.com') || url.includes('bilibili.com'))) {
    return process.env.IMAGE_PROXY_URL.replace('{url}', encodeURIComponent(url));
  }

  if (url.includes('hdslb.com') || url.includes('bilivideo.com') || url.includes('bilibili.com')) {
    const encodedUrl = encodeURIComponent(url);
    // animated=true 时跳过 WebP 转换，保留原始格式（用于 GIF 动图）
    const output = options.animated ? '' : '&output=webp&q=80';
    return `https://images.weserv.nl/?url=${encodedUrl}&w=400&h=225${output}`;
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

const fetchImageToBase64 = async (url, options = {}) => {
  if (!url || !url.startsWith('http')) return '';

  const proxiedUrl = proxyImageUrl(url, options);

  const cacheKey = url;
  const cacheEntry = imageCache.get(cacheKey);
  if (cacheEntry && Date.now() - cacheEntry.timestamp < 60 * 60 * 1000) {
    return cacheEntry.base64;
  }

  try {
    const { contentType, buffer } = await fetchBuffer(proxiedUrl, { timeout: 5000 });
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    imageCache.set(cacheKey, { base64: dataUrl, timestamp: Date.now() });
    return dataUrl;
  } catch (error) {
    logger.warn('Image proxy fetch failed, falling back to direct', { url, proxy: proxiedUrl, error: error.message });

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
        logger.warn('Direct image fetch also failed', { url, error: fallbackError.message });
      }
    }

    return '';
  }
};

module.exports = async (req, res) => {
  const { uid, theme = 'default', color = 'white', animated } = req.query;
  const imgOptions = { animated: animated === 'true' };
  if (!uid || !/^\d+$/.test(uid)) {
    return sendErrorSVG(res, 'ID_ERROR', 'Invalid UID', 400);
  }

  // 限流：同一 IP 每分钟最多 30 次
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.connection?.remoteAddress
    || 'unknown';
  const limit = rateLimit(ip);
  if (!limit.allowed) {
    res.setHeader('Retry-After', limit.retryAfter);
    return sendErrorSVG(res, 'RATE_LIMIT', `请求过于频繁，请 ${limit.retryAfter} 秒后重试`, 429);
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
      validatePalette(colorScheme.palette);
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
    const videoOk = videoRes.status === 'fulfilled';
    const videoData = videoOk ? videoRes.value?.videos?.[0] : null;

    const images = { face: '', videoCover: '', levelIcon: '' };
    const imagePromises = [];

    const faceUrl = cardData.data?.card?.face;
    if (faceUrl) {
      imagePromises.push(fetchImageToBase64(faceUrl, imgOptions).then(base64 => ({ type: 'face', base64 })));
    }

    if (videoData) {
      const coverUrl = videoData.cover || videoData.pic;
      if (coverUrl) {
        imagePromises.push(fetchImageToBase64(coverUrl, imgOptions).then(base64 => ({ type: 'videoCover', base64 })));
      }
    }

    const level = cardData.data?.card?.level_info?.current_level || 0;
    images.levelIcon = getLevelIcon(level);

    const imageResults = await Promise.allSettled(imagePromises);
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
      } : videoOk ? null : { error: true },
      levelIcon: images.levelIcon
    };

    const svgContent = themeModule.generateSVG(data, colorScheme.palette);

    const svg = `${COMMENTS.banner}
${svgContent}`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
    res.send(svg);
  } catch (err) {
    logger.error('Card generation failed', { error: err.message, uid: req.query?.uid, theme: req.query?.theme });
    sendErrorSVG(res, 'FETCH_ERROR', 'API Request Failed', 502);
  }
};