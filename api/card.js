// api/card.js - 修正转义错误后的版本
const axios = require('axios');

const CONFIG = {
  CACHE_TTL: 3600,
  TIMEOUT: 8000,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

const cache = new Map();

// 核心修正：XML 转义处理
const esc = (str) => {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[m]));
};

// 核心修正：图片代理 URL 中的 & 必须转义为 &amp;
const proxyImg = (url) => {
  if (!url) return '';
  const pureUrl = url.replace(/^https?:\/\//, '');
  // 注意这里的 & 变成了 &amp;
  return `https://images.weserv.nl/?url=${pureUrl}&amp;default=${encodeURIComponent(url)}`;
};

module.exports = async (req, res) => {
  const { uid, theme = 'light', cache: cacheParam = 'true' } = req.query;

  if (!uid || !/^\d+$/.test(uid)) {
    return sendErrorSVG(res, 'INVALID_UID', '请输入正确的数字UID');
  }

  const cacheKey = `bili_v3_${uid}_${theme}`;
  if (cacheParam !== 'false' && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (cached.expiry > Date.now()) return sendSVG(res, cached.svg);
  }

  try {
    const [userRes, statRes, videoRes] = await Promise.all([
      fetchBili(`/x/space/acc/info?mid=${uid}`),
      fetchBili(`/x/relation/stat?vmid=${uid}`),
      fetchBili(`/x/space/arc/search?mid=${uid}&ps=1&tid=0&pn=1&order=pubdate`)
    ]);

    const userData = userRes.data;
    const statData = statRes.data;
    const vlist = videoRes.data?.list?.vlist || [];
    const videoData = vlist[0];

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
        cover: proxyImg(videoData.pic),
        length: videoData.length
      } : null
    };

    const svg = generateSVG(data, theme);
    cache.set(cacheKey, { svg, expiry: Date.now() + CONFIG.CACHE_TTL * 1000 });
    sendSVG(res, svg);

  } catch (err) {
    sendErrorSVG(res, 'FETCH_FAILED', '无法获取数据，请检查UID或稍后重试');
  }
};

async function fetchBili(path) {
  const res = await axios.get(`https://api.bilibili.com${path}`, {
    headers: { 'User-Agent': CONFIG.USER_AGENT, 'Referer': 'https://www.bilibili.com/' },
    timeout: CONFIG.TIMEOUT
  });
  if (res.data.code !== 0) throw new Error('BiliAPI Error');
  return res.data;
}

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
        <defs>
          <clipPath id="circle">
            <circle cx="40" cy="40" r="40"/>
          </clipPath>
        </defs>
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
            <tspan x="0" dy="0">${data.video.title.substring(0, 12)}</tspan>
            <tspan x="0" dy="16">${data.video.title.substring(12, 22)}${data.video.title.length > 22 ? '...' : ''}</tspan>
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
  const svg = `<svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="100" rx="10" fill="#FFF1F0" stroke="#FFA39E"/>
    <text x="20" y="45" fill="#CF1322" font-family="sans-serif" font-weight="bold">${code}</text>
    <text x="20" y="70" fill="#F5222D" font-family="sans-serif" font-size="12">${msg}</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).send(svg);
}