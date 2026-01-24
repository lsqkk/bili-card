// api/card.js - 纯净极简 + uapis.cn 驱动版
const axios = require('axios');

const CONFIG = {
  CACHE_TTL: 3600,
  TIMEOUT: 8000,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const cache = new Map();

// 字符转义：防止特殊字符搞崩溃 SVG
const esc = (str) => {
  if (!str) return '';
  return str.toString().replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[m]));
};

// 图片代理：解决 B 站图片 403 Forbidden
const proxyImg = (url) => {
  if (!url) return '';
  const pureUrl = url.replace(/^https?:\/\//, '');
  return `https://images.weserv.nl/?url=${pureUrl}&amp;default=${encodeURIComponent(url)}`;
};

module.exports = async (req, res) => {
  const { uid, theme = 'light', cache: cacheParam = 'true' } = req.query;

  if (!uid || !/^\d+$/.test(uid)) {
    return sendErrorSVG(res, 'UID_ERROR', '请提供有效的数字 UID');
  }

  const cacheKey = `bili_uapi_${uid}_${theme}`;
  if (cacheParam !== 'false' && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (cached.expiry > Date.now()) return sendSVG(res, cached.svg);
  }

  try {
    // 1. 获取用户信息 (uapis.cn)
    const userRes = await axios.get(`https://uapis.cn/api/v1/social/bilibili/userinfo?uid=${uid}`, { timeout: CONFIG.TIMEOUT });
    const userData = userRes.data;

    if (!userData || !userData.mid) throw new Error('User not found');

    // 2. 获取视频信息 (uapis.cn)
    const videoRes = await axios.get(`https://uapis.cn/api/v1/social/bilibili/archives?mid=${uid}&orderby=pubdate&ps=1&pn=1`, { timeout: CONFIG.TIMEOUT });
    const videoData = videoRes.data?.videos?.[0];

    // 组装美化数据
    const data = {
      name: esc(userData.name),
      face: proxyImg(userData.face),
      level: userData.level || 0,
      sign: esc(userData.sign || '该用户比较懒，暂无签名'),
      // 注意：uapis.cn 的用户信息接口中通常不带粉丝数，此处若缺失则显示 --
      follower: userData.fans || '--',
      video: videoData ? {
        title: esc(videoData.title),
        play: videoData.play_count || 0,
        cover: proxyImg(videoData.cover || videoData.pic),
      } : null
    };

    const svg = generateSVG(data, theme);
    cache.set(cacheKey, { svg, expiry: Date.now() + CONFIG.CACHE_TTL * 1000 });
    sendSVG(res, svg);

  } catch (err) {
    console.error(err);
    sendErrorSVG(res, 'FETCH_FAILED', 'API 接口请求失败，请稍后重试');
  }
};

function generateSVG(data, theme) {
  const isDark = theme === 'dark';
  const color = {
    bg: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#E5E5E5' : '#18191C',
    sub: isDark ? '#808080' : '#9499A0',
    border: isDark ? '#2D2D2D' : '#E3E5E7',
    accent: '#00A1D6',
    card: isDark ? '#1E1E1E' : '#F6F7F8'
  };

  const formatNum = (v) => {
    if (typeof v !== 'number') return v;
    return v >= 10000 ? (v / 10000).toFixed(1) + '万' : v;
  };

  return `
    <svg width="450" height="150" viewBox="0 0 450 150" xmlns="http://www.w3.org/2000/svg">
      <style>
        .base { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
        .name { font-size: 16px; font-weight: 700; fill: ${color.text}; }
        .sign { font-size: 12px; fill: ${color.sub}; }
        .level { font-size: 9px; font-weight: 800; fill: #FFF; }
        .stat-val { font-size: 13px; font-weight: 600; fill: ${color.text}; }
        .stat-lbl { font-size: 11px; fill: ${color.sub}; }
        .video-t { font-size: 11px; font-weight: 600; fill: ${color.text}; }
        .fade { opacity: 0; animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      </style>

      <rect width="450" height="150" rx="10" fill="${color.bg}" stroke="${color.border}" stroke-width="1"/>
      
      <g transform="translate(20, 25)">
        <defs>
          <clipPath id="circle"><circle cx="35" cy="35" r="35"/></clipPath>
        </defs>
        <image href="${data.face}" width="70" height="70" clip-path="url(#circle)"/>
        <rect x="48" y="58" width="24" height="12" rx="3" fill="${color.accent}"/>
        <text x="60" y="67" text-anchor="middle" class="base level">LV${data.level}</text>
      </g>

      <g transform="translate(105, 38)" class="base fade">
        <text class="name">${data.name}</text>
        <text y="22" class="sign">${data.sign.substring(0, 24)}${data.sign.length > 24 ? '...' : ''}</text>
        
        <g transform="translate(0, 48)">
          <text class="stat-val">${formatNum(data.follower)}</text>
          <text y="16" class="stat-lbl">粉丝</text>
        </g>
      </g>

      ${data.video ? `
      <g transform="translate(265, 20)" class="base fade">
        <rect width="165" height="110" rx="8" fill="${color.card}"/>
        <clipPath id="v-clip"><rect width="149" height="65" rx="4"/></clipPath>
        <g transform="translate(8, 8)">
          <image href="${data.video.cover}" width="149" height="65" preserveAspectRatio="xMidYMid slice" clip-path="url(#v-clip)"/>
          <text y="80" class="video-t">
            <tspan x="0" dy="0">${data.video.title.substring(0, 12)}</tspan>
            <tspan x="0" dy="15">${data.video.title.substring(12, 22)}${data.video.title.length > 22 ? '...' : ''}</tspan>
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
  const svg = `<svg width="400" height="80" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="80" rx="8" fill="#FFF1F0" stroke="#FFA39E"/>
    <text x="20" y="35" fill="#CF1322" font-family="sans-serif" font-weight="bold">${code}</text>
    <text x="20" y="55" fill="#F5222D" font-family="sans-serif" font-size="12">${msg}</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).send(svg);
}