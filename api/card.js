// api/card.js - 增强鲁棒性版
const axios = require('axios');

const CONFIG = {
  CACHE_TTL: 3600,
  TIMEOUT: 6000,
  // 模拟更真实的浏览器 User-Agent
  UA: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

const cache = new Map();

const esc = (str) => !str ? '' : str.replace(/[&<>"']/g, (m) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
}[m]));

const proxyImg = (url) => {
  if (!url) return '';
  const pureUrl = url.replace(/^https?:\/\//, '');
  return `https://images.weserv.nl/?url=${pureUrl}&amp;default=${encodeURIComponent(url)}`;
};

module.exports = async (req, res) => {
  const { uid, theme = 'light', cache: cacheParam = 'true' } = req.query;

  if (!uid || !/^\d+$/.test(uid)) return sendErrorSVG(res, 'INVALID_UID', 'UID 格式不正确');

  const cacheKey = `bili_v4_${uid}_${theme}`;
  if (cacheParam !== 'false' && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (cached.expiry > Date.now()) return sendSVG(res, cached.svg);
  }

  try {
    // 使用 allSettled 确保局部失败不影响全局渲染
    const results = await Promise.allSettled([
      fetchBili(`https://api.bilibili.com/x/space/acc/info?mid=${uid}`),
      fetchBili(`https://api.bilibili.com/x/relation/stat?vmid=${uid}`),
      fetchBili(`https://api.bilibili.com/x/space/arc/search?mid=${uid}&ps=1`)
    ]);

    const userRes = results[0].status === 'fulfilled' ? results[0].value : null;
    const statRes = results[1].status === 'fulfilled' ? results[1].value : null;
    const videoRes = results[2].status === 'fulfilled' ? results[2].value : null;

    // 基础信息是核心，如果获取不到则报错
    if (!userRes || userRes.code !== 0) {
      throw new Error(userRes?.message || 'B站接口拒绝请求');
    }

    const userData = userRes.data;
    const statData = statRes?.data || { follower: 0, following: 0 };
    const videoData = videoRes?.data?.list?.vlist?.[0];

    const data = {
      name: esc(userData.name),
      face: proxyImg(userData.face),
      level: userData.level,
      sign: esc(userData.sign),
      follower: statData.follower,
      following: statData.following,
      video: videoData ? {
        title: esc(videoData.title),
        play: videoData.play,
        cover: proxyImg(videoData.pic)
      } : null
    };

    const svg = generateSVG(data, theme);
    cache.set(cacheKey, { svg, expiry: Date.now() + CONFIG.CACHE_TTL * 1000 });
    sendSVG(res, svg);

  } catch (err) {
    console.error('Fetch Error:', err.message);
    sendErrorSVG(res, 'FETCH_FAILED', err.message || 'B站接口限制，请稍后再试');
  }
};

async function fetchBili(url) {
  const res = await axios.get(url, {
    headers: {
      'User-Agent': CONFIG.UA,
      'Referer': 'https://www.bilibili.com/',
      'Origin': 'https://www.bilibili.com'
    },
    timeout: CONFIG.TIMEOUT
  });
  return res.data;
}

// ... generateSVG, sendSVG, sendErrorSVG 函数保持与上一版一致，但确保 generateSVG 逻辑健壮 ...
function generateSVG(data, theme) {
  const isDark = theme === 'dark';
  const color = {
    bg: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#E5E5E5' : '#18191C',
    sub: isDark ? '#808080' : '#9499A0',
    border: isDark ? '#333333' : '#E3E5E7',
    accent: '#00A1D6'
  };

  const formatNum = (v) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v;

  return `
    <svg width="480" height="160" viewBox="0 0 480 160" xmlns="http://www.w3.org/2000/svg">
      <style>
        .base { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .name { font-size: 18px; font-weight: 700; fill: ${color.text}; }
        .sign { font-size: 12px; fill: ${color.sub}; }
        .level { font-size: 10px; font-weight: 800; fill: #FFF; }
        .stat-val { font-size: 14px; font-weight: 600; fill: ${color.text}; }
        .stat-lbl { font-size: 12px; fill: ${color.sub}; }
        .video-t { font-size: 12px; font-weight: 600; fill: ${color.text}; }
        .fade { opacity: 0; animation: fadeIn 0.5s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      </style>

      <rect width="480" height="160" rx="12" fill="${color.bg}" stroke="${color.border}" stroke-width="1"/>
      
      <g transform="translate(24, 24)">
        <defs><clipPath id="circle"><circle cx="40" cy="40" r="40"/></clipPath></defs>
        <circle cx="40" cy="40" r="42" fill="${color.accent}" opacity="0.1"/>
        <image href="${data.face}" width="80" height="80" clip-path="url(#circle)"/>
        <rect x="55" y="65" width="28" height="14" rx="4" fill="${color.accent}"/>
        <text x="69" y="76" text-anchor="middle" class="base level">LV${data.level}</text>
      </g>

      <g transform="translate(124, 35)" class="base fade">
        <text class="name">${data.name}</text>
        <text y="24" class="sign">${data.sign.substring(0, 26)}${data.sign.length > 26 ? '...' : ''}</text>
        <g transform="translate(0, 50)">
          <text class="stat-val">${formatNum(data.follower)}</text>
          <text y="18" class="stat-lbl">粉丝</text>
          <g transform="translate(70, 0)">
            <text class="stat-val">${formatNum(data.following)}</text>
            <text y="18" class="stat-lbl">关注</text>
          </g>
        </g>
      </g>

      ${data.video ? `
      <g transform="translate(290, 24)" class="base fade" style="animation-delay: 0.1s">
        <rect width="166" height="112" rx="8" fill="${isDark ? '#252525' : '#F6F7F8'}"/>
        <clipPath id="v-clip"><rect width="150" height="70" rx="4"/></clipPath>
        <g transform="translate(8, 8)">
          <image href="${data.video.cover}" width="150" height="70" preserveAspectRatio="xMidYMid slice" clip-path="url(#v-clip)"/>
          <text y="86" class="video-t">
            <tspan x="0" dy="0">${data.video.title.substring(0, 11)}</tspan>
            <tspan x="0" dy="16">${data.video.title.substring(11, 20)}${data.video.title.length > 20 ? '...' : ''}</tspan>
          </text>
        </g>
      </g>` : ''}
    </svg>
  `;
}

function sendSVG(res, svg) {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
  res.status(200).send(svg);
}

function sendErrorSVG(res, code, msg) {
  const svg = `<svg width="480" height="160" viewBox="0 0 480 160" xmlns="http://www.w3.org/2000/svg">
    <rect width="478" height="158" x="1" y="1" rx="12" fill="#FFF1F0" stroke="#FFA39E"/>
    <text x="24" y="45" fill="#CF1322" font-family="sans-serif" font-size="20" font-weight="bold">${code}</text>
    <text x="24" y="80" fill="#F5222D" font-family="sans-serif" font-size="14">${msg}</text>
    <text x="24" y="110" fill="#8C8C8C" font-family="sans-serif" font-size="12">提示：可能是该UID请求过于频繁或已被B站风控</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).send(svg);
}