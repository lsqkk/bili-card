// api/card.js - 精致美学·现代主义重构版
const axios = require('axios');

const CONFIG = {
  CACHE_TTL: 3600,
  TIMEOUT: 8000,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const esc = (str) => {
  if (!str) return '';
  return str.toString().replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[m]));
};

const proxyImg = (url) => {
  if (!url) return '';
  const pureUrl = url.replace(/^https?:\/\//, '');
  return `https://images.weserv.nl/?url=${pureUrl}&amp;we&amp;default=${encodeURIComponent(url)}`;
};

module.exports = async (req, res) => {
  const { uid, theme = 'light' } = req.query;
  if (!uid || !/^\d+$/.test(uid)) return sendErrorSVG(res, 'ID_ERROR', 'Invalid UID');

  try {
    const [userRes, relationRes, videoRes] = await Promise.allSettled([
      axios.get(`https://uapis.cn/api/v1/social/bilibili/userinfo?uid=${uid}`, { timeout: CONFIG.TIMEOUT }),
      axios.get(`https://api.bilibili.com/x/relation/stat?vmid=${uid}`, {
        headers: { 'User-Agent': CONFIG.USER_AGENT, 'Referer': 'https://www.bilibili.com/' },
        timeout: CONFIG.TIMEOUT
      }),
      axios.get(`https://uapis.cn/api/v1/social/bilibili/archives?mid=${uid}&ps=1`, { timeout: CONFIG.TIMEOUT })
    ]);

    const userData = userRes.status === 'fulfilled' ? userRes.value.data : {};
    const relationData = relationRes.status === 'fulfilled' ? relationRes.value.data.data : {};
    const videoData = videoRes.status === 'fulfilled' ? videoRes.value.data?.videos?.[0] : null;

    const data = {
      name: esc(userData.name || 'Unknown'),
      face: proxyImg(userData.face),
      level: userData.level || 0,
      sign: esc(userData.sign || '这个人很懒，什么都没有写...'),
      follower: relationData?.follower || 0,
      following: relationData?.following || 0,
      video: videoData ? {
        title: esc(videoData.title),
        play: videoData.play_count || 0,
        cover: proxyImg(videoData.cover || videoData.pic),
      } : null
    };

    const svg = generateSVG(data, theme);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
    res.send(svg);
  } catch (err) {
    sendErrorSVG(res, 'FETCH_ERROR', 'API Request Failed');
  }
};

function generateSVG(data, theme) {
  const isDark = theme === 'dark';

  // 色彩矩阵：定义严谨的视觉语言
  const palette = {
    bg: isDark ? '#0F1011' : '#FFFFFF',
    card: isDark ? 'rgba(30, 31, 34, 0.8)' : 'rgba(241, 242, 246, 0.7)',
    primary: '#00AEEC', // 品牌蓝
    accent: '#FB7299',  // 品牌粉
    textMain: isDark ? '#FFFFFF' : '#18191C',
    textSub: isDark ? '#9499A0' : '#61666D',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    shadow: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'
  };

  const formatNum = (v) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v;

  return `
    <svg width="520" height="210" viewBox="0 0 520 210" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
          <feOffset dx="0" dy="4" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <clipPath id="circleMask">
          <circle cx="54" cy="54" r="54"/>
        </clipPath>

        <linearGradient id="cardGrad" x1="0" y1="0" x2="520" y2="210" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette.bg}"/>
          <stop offset="1" stop-color="${isDark ? '#1A1C1E' : '#F8F9FA'}"/>
        </linearGradient>

        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&amp;display=swap');
          .font-main { font-family: 'Inter', -apple-system, 'PingFang SC', sans-serif; }
          .name-text { font-size: 24px; font-weight: 800; fill: ${palette.textMain}; }
          .sign-text { font-size: 13px; fill: ${palette.textSub}; line-height: 1.5; }
          .stat-num { font-size: 20px; font-weight: 800; fill: ${palette.primary}; }
          .stat-label { font-size: 11px; font-weight: 600; fill: ${palette.textSub}; text-transform: uppercase; letter-spacing: 0.5px; }
          .video-title { font-size: 12px; font-weight: 600; fill: ${palette.textMain}; }
          .badge-text { font-size: 10px; font-weight: 800; fill: #FFF; }
          .play-count { font-size: 10px; font-weight: 600; fill: #FFF; }
        </style>
      </defs>

      <rect width="520" height="210" rx="24" fill="url(#cardGrad)" />
      <rect x="0.5" y="0.5" width="519" height="209" rx="23.5" stroke="${palette.border}" />

      <g transform="translate(32, 32)">
        <g filter="url(#shadow)">
          <circle cx="54" cy="54" r="58" fill="${palette.primary}" fill-opacity="0.15"/>
          <image href="${data.face}" x="0" y="0" width="108" height="108" clip-path="url(#circleMask)"/>
          
          <g transform="translate(75, 85)">
            <rect width="36" height="18" rx="9" fill="${palette.accent}"/>
            <text x="18" y="13" text-anchor="middle" class="font-main badge-text">LV${data.level}</text>
          </g>
        </g>

        <g transform="translate(132, 8)">
          <text class="font-main name-text">${data.name}</text>
          
          <foreignObject y="18" width="170" height="40">
            <div xmlns="http://www.w3.org/1999/xhtml" style="margin-top:8px;">
              <p class="font-main sign-text" style="margin:0; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                ${data.sign}
              </p>
            </div>
          </foreignObject>

          <g transform="translate(0, 80)">
            <g>
              <text class="font-main stat-num">${formatNum(data.follower)}</text>
              <text y="18" class="font-main stat-label">Followers</text>
            </g>
            <g transform="translate(85, 0)">
              <text class="font-main stat-num">${formatNum(data.following)}</text>
              <text y="18" class="font-main stat-label">Following</text>
            </g>
          </g>
        </g>
      </g>

      ${data.video ? `
      <g transform="translate(330, 24)">
        <rect width="166" height="162" rx="20" fill="${palette.card}" stroke="${palette.border}"/>
        
        <g transform="translate(12, 12)">
          <clipPath id="videoClip">
            <rect width="142" height="80" rx="12"/>
          </clipPath>
          <image href="${data.video.cover}" width="142" height="80" preserveAspectRatio="xMidYMid slice" clip-path="url(#videoClip)"/>
          
          <rect y="60" width="142" height="20" fill="black" fill-opacity="0.4" clip-path="url(#videoClip)"/>
          <text x="8" y="74" class="font-main play-count">▶ ${formatNum(data.video.play)}</text>

          <foreignObject y="92" width="142" height="48">
            <div xmlns="http://www.w3.org/1999/xhtml" style="color:${palette.textMain}; font-family:'Inter', sans-serif; font-size:12px; font-weight:600; line-height:1.4; display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical; overflow:hidden;">
              ${data.video.title}
            </div>
          </foreignObject>
          
          <text x="0" y="145" style="fill:${palette.accent}; font-size:9px; font-weight:800; font-family:sans-serif;">NEW RELEASE</text>
        </g>
      </g>
      ` : ''}

      <path d="M32 190 H300" stroke="${palette.primary}" stroke-width="2" stroke-linecap="round" opacity="0.3" />
    </svg>
  `;
}

function sendErrorSVG(res, code, msg) {
  const svg = `
    <svg width="400" height="100" viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="100" rx="20" fill="#FFF1F0"/>
      <path d="M20 50L40 30M20 30L40 50" stroke="#CF1322" stroke-width="3" stroke-linecap="round"/>
      <text x="60" y="45" fill="#CF1322" font-family="sans-serif" font-size="16" font-weight="bold">${code}</text>
      <text x="60" y="70" fill="#F5222D" font-family="sans-serif" font-size="14">${msg}</text>
      <rect x="0.5" y="0.5" width="399" height="99" rx="19.5" stroke="#FFA39E"/>
    </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).send(svg);
}