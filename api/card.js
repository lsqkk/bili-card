// api/card.js - 现代极简 & 高级感排版版
const axios = require('axios');

const CONFIG = {
  CACHE_TTL: 3600,
  TIMEOUT: 8000,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const cache = new Map();

// 核心：字符安全转义
const esc = (str) => {
  if (!str) return '';
  return str.toString().replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[m]));
};

// 核心：图片防盗链代理 (weserv.nl)
const proxyImg = (url) => {
  if (!url) return '';
  const pureUrl = url.replace(/^https?:\/\//, '');
  return `https://images.weserv.nl/?url=${pureUrl}&amp;we&amp;default=${encodeURIComponent(url)}`;
};

module.exports = async (req, res) => {
  const { uid, theme = 'light' } = req.query;

  if (!uid || !/^\d+$/.test(uid)) {
    return sendErrorSVG(res, 'INVALID_UID', '请输入有效的数字 UID');
  }

  try {
    // 1. 并发抓取：uapis 提供基础信息和视频，B站官方提供关系数据
    const [userRes, relationRes, videoRes] = await Promise.allSettled([
      axios.get(`https://uapis.cn/api/v1/social/bilibili/userinfo?uid=${uid}`, { timeout: CONFIG.TIMEOUT }),
      axios.get(`https://api.bilibili.com/x/relation/stat?vmid=${uid}`, {
        headers: { 'User-Agent': CONFIG.USER_AGENT, 'Referer': 'https://www.bilibili.com/' },
        timeout: CONFIG.TIMEOUT
      }),
      axios.get(`https://uapis.cn/api/v1/social/bilibili/archives?mid=${uid}&ps=1`, { timeout: CONFIG.TIMEOUT })
    ]);

    const userData = userRes.status === 'fulfilled' ? userRes.value.data : null;
    const relationData = relationRes.status === 'fulfilled' ? relationRes.value.data.data : null;
    const videoData = videoRes.status === 'fulfilled' ? videoRes.value.data?.videos?.[0] : null;

    if (!userData || !userData.mid) throw new Error('User Data Missing');

    const data = {
      name: esc(userData.name),
      face: proxyImg(userData.face),
      level: userData.level || 0,
      sign: esc(userData.sign || '暂无签名'),
      follower: relationData ? relationData.follower : '--',
      following: relationData ? relationData.following : '--',
      video: videoData ? {
        title: esc(videoData.title),
        play: videoData.play_count || 0,
        cover: proxyImg(videoData.cover),
        time: videoData.duration || '00:00'
      } : null
    };

    const svg = generateSVG(data, theme);
    sendSVG(res, svg);

  } catch (err) {
    sendErrorSVG(res, 'FETCH_FAILED', '数据获取异常，请稍后重试');
  }
};

function generateSVG(data, theme) {
  const isDark = theme === 'dark';
  const color = {
    bg: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#F0F0F0' : '#18191C',
    sub: isDark ? '#757575' : '#9499A0',
    border: isDark ? '#2D2D2D' : '#E3E5E7',
    accent: '#00A1D6',
    card: isDark ? '#1E1E1E' : '#F6F7F8',
    level: '#FB7299'
  };

  const formatNum = (v) => {
    if (typeof v !== 'number') return v;
    return v >= 10000 ? (v / 10000).toFixed(1) + '万' : v;
  };

  // 内联图标
  const iconPaths = {
    play: "M6 4l12 8-12 8V4z",
    users: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M8.5 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8z M17 11l2 2 4-4"
  };

  return `
    <svg width="480" height="170" viewBox="0 0 480 170" xmlns="http://www.w3.org/2000/svg">
      <style>
        .base { font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif; }
        .name { font-size: 20px; font-weight: 800; fill: ${color.text}; }
        .sign { font-size: 12px; fill: ${color.sub}; letter-spacing: 0.2px; }
        .stat-v { font-size: 16px; font-weight: 700; fill: ${color.text}; }
        .stat-l { font-size: 11px; fill: ${color.sub}; font-weight: 500; }
        .v-title { font-size: 12px; font-weight: 600; fill: ${color.text}; line-height: 1.4; }
        .badge { font-size: 10px; font-weight: 900; fill: #FFF; }
        .fade-in { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      </style>

      <rect width="480" height="170" rx="16" fill="${color.bg}" stroke="${color.border}" stroke-width="1.2"/>
      
      <g transform="translate(28, 28)" class="fade-in">
        <defs>
          <clipPath id="avatar-clip"><rect width="84" height="84" rx="42"/></clipPath>
        </defs>
        <rect width="84" height="84" rx="42" fill="${color.accent}" opacity="0.08"/>
        <image href="${data.face}" width="80" height="80" x="2" y="2" clip-path="url(#avatar-clip)"/>
        
        <rect x="58" y="64" width="30" height="15" rx="4" fill="${color.level}"/>
        <text x="73" y="75" text-anchor="middle" class="base badge">LV${data.level}</text>
      </g>

      <g transform="translate(132, 42)" class="base fade-in">
        <text class="name">${data.name}</text>
        <text y="24" class="sign">${data.sign.substring(0, 26)}${data.sign.length > 26 ? '...' : ''}</text>
        
        <g transform="translate(0, 56)">
          <g>
            <text class="stat-v">${formatNum(data.follower)}</text>
            <text y="18" class="stat-l">粉丝</text>
          </g>
          <g transform="translate(70, 0)">
            <text class="stat-v">${formatNum(data.following)}</text>
            <text y="18" class="stat-l">关注</text>
          </g>
        </g>
      </g>

      ${data.video ? `
      <g transform="translate(295, 24)" class="base fade-in" style="animation-delay: 0.2s">
        <rect width="160" height="122" rx="12" fill="${color.card}" />
        <clipPath id="video-clip"><rect width="144" height="74" rx="8"/></clipPath>
        
        <g transform="translate(8, 8)">
          <image href="${data.video.cover}" width="144" height="74" preserveAspectRatio="xMidYMid slice" clip-path="url(#video-clip)"/>
          
          <rect y="58" width="55" height="16" rx="4" fill="#000" fill-opacity="0.6" />
          <path d="${iconPaths.play}" fill="white" transform="translate(6, 62) scale(0.4)"/>
          <text x="18" y="70" font-size="9" font-weight="700" fill="white">${formatNum(data.video.play)}</text>

          <text y="92" class="v-title">
            <tspan x="0" dy="0">${data.video.title.substring(0, 11)}</tspan>
            <tspan x="0" dy="16">${data.video.title.substring(11, 20)}${data.video.title.length > 20 ? '...' : ''}</tspan>
          </text>
        </g>
      </g>
      ` : ''}
    </svg>
  `;
}

function sendSVG(res, svg) {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
  res.status(200).send(svg);
}

function sendErrorSVG(res, code, msg) {
  const svg = `<svg width="400" height="100" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="100" rx="12" fill="#FFF1F0" stroke="#FFA39E"/>
    <text x="20" y="45" fill="#CF1322" font-family="sans-serif" font-weight="bold">${code}</text>
    <text x="20" y="72" fill="#F5222D" font-family="sans-serif" font-size="13">${msg}</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).send(svg);
}