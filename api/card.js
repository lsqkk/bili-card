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
  const { uid, theme = 'default', color = 'white', animated, width: widthParam, hideVideo } = req.query;
  const imgOptions = { animated: animated === 'true' };
  const outputWidth = parseInt(widthParam) || 0;
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

    // hideVideo 参数：清空视频数据，主题自动隐藏视频区域
    if (hideVideo === 'true') {
      data.video = null;
    }

    let svgContent = themeModule.generateSVG(data, colorScheme.palette);

    // 数字计数 + 上飘动画：将 stat 类数字替换为 20 层从 0 递增的 CSS 动画
    // 注入计数关键帧（每个 stat 分组只需注入一次）
    svgContent = svgContent.replace('</defs>', `</defs>
        <style>
        @keyframes cntOn {
            0% { opacity: 0; }
            5% { opacity: 1; }
            95% { opacity: 1; }
            100% { opacity: 0; }
        }
        @keyframes cntFin {
            0% { opacity: 0; }
            5% { opacity: 1; }
            100% { opacity: 1; }
        }
        </style>`);

    svgContent = svgContent.replace(
      /<text class="stat"([^>]*)>([\d.]+万?)<\/text>/g,
      (match, attrs, textContent) => {
        const numMatch = textContent.match(/^([\d.]+)(.*)$/);
        if (!numMatch) return match;
        const target = parseFloat(numMatch[1]);
        const suffix = numMatch[2] || '';

        // 从 attrs 中提取原始 transform 位置，用于 animateTransform
        const transMatch = attrs.match(/matrix\(1 0 0 1 ([\d.]+) ([\d.]+)\)/);
        let wrapperAttrs = attrs;
        let slideAnimate = '';
        if (transMatch) {
          const origX = transMatch[1];
          const origY = parseFloat(transMatch[2]);
          wrapperAttrs = ` transform="translate(${origX}, ${origY})"`;
          slideAnimate = `<animateTransform attributeName="transform" type="translate" from="${origX} ${origY + 14}" to="${origX} ${origY}" dur="0.5s" fill="freeze" begin="0.2s"/>`;
        }

        const STEPS = 20; // 每 10ms 跳一个数，2 秒跑完
        let result = `<g${wrapperAttrs}>${slideAnimate}`;
        for (let i = 0; i < STEPS; i++) {
          const display = Math.round(target * (i + 1) / STEPS);
          const isLast = i === STEPS - 1;
          const begin = (0.25 + i * 0.1).toFixed(3);
          const kf = isLast ? 'cntFin' : 'cntOn';
          result += `<text class="stat" style="animation: ${kf} 0.1s ${begin}s both">${display}${suffix}</text>`;
        }
        result += '</g>';
        return result;
      }
    );

    // 非数字文字上飘动画：用 SVG 原生 animateTransform 避免 CSS 冲突
    const slideBeginMap = { title: '0.05s', label: '0.15s', signature: '0.25s', 'video-title': '0.3s', 'video-label': '0.3s' };
    const slideClasses = Object.keys(slideBeginMap).join('|');
    svgContent = svgContent.replace(
      new RegExp(`<text class="(${slideClasses})" transform="matrix\\(1 0 0 1 ([\\d.]+) ([\\d.]+)\\)">([^<]*)<\\/text>`, 'g'),
      (match, className, origX, origY, content) => {
        const begin = slideBeginMap[className];
        return `<g transform="translate(${origX}, ${parseFloat(origY) + 12})">
          <animateTransform attributeName="transform" type="translate" from="${origX} ${parseFloat(origY) + 12}" to="${origX} ${origY}" dur="0.5s" fill="freeze" begin="${begin}"/>
          <text class="${className}">${content}</text>
        </g>`;
      }
    );

    // width 参数：等比缩放 SVG 输出宽度
    if (outputWidth > 0) {
      svgContent = svgContent.replace(
        /<svg([^>]*)width="(\d+)"([^>]*)height="(\d+)"([^>]*)viewBox="([^"]+)"/,
        (match, before, oldW, mid, oldH, after, viewBox) => {
          const parts = viewBox.split(/[ ,]+/).map(Number);
          if (parts.length === 4 && parts[2] > 0) {
            const ratio = outputWidth / parts[2];
            const newHeight = Math.round(parts[3] * ratio);
            return `<svg${before}width="${outputWidth}"${mid}height="${newHeight}"${after}viewBox="${viewBox}"`;
          }
          return match;
        }
      );
    }

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