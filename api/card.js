// api/card.js - 极致工艺·重构 3.0 版
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
    const [uRes, rRes, vRes] = await Promise.allSettled([
      axios.get(`https://uapis.cn/api/v1/social/bilibili/userinfo?uid=${uid}`, { timeout: CONFIG.TIMEOUT }),
      axios.get(`https://api.bilibili.com/x/relation/stat?vmid=${uid}`, {
        headers: { 'User-Agent': CONFIG.USER_AGENT, 'Referer': 'https://www.bilibili.com/' },
        timeout: CONFIG.TIMEOUT
      }),
      axios.get(`https://uapis.cn/api/v1/social/bilibili/archives?mid=${uid}&ps=1`, { timeout: CONFIG.TIMEOUT })
    ]);

    const uData = uRes.status === 'fulfilled' ? uRes.value.data : {};
    const rData = rRes.status === 'fulfilled' ? rRes.value.data.data : {};
    const vData = vRes.status === 'fulfilled' ? vRes.value.data?.videos?.[0] : null;

    const data = {
      name: esc(uData.name || 'Bilibili 用户'),
      face: proxyImg(uData.face),
      level: uData.level || 0,
      sign: esc(uData.sign || '此人行踪神秘，未留下任何签名。'),
      follower: rData?.follower || 0,
      following: rData?.following || 0,
      video: vData ? {
        title: esc(vData.title),
        play: vData.play_count || 0,
        cover: proxyImg(vData.cover || vData.pic),
      } : null
    };

    const svg = generateSVG(data, theme);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
    res.status(200).send(svg);
  } catch (err) {
    sendErrorSVG(res, 'FETCH_ERROR', 'Render Failed');
  }
};

function generateSVG(data, theme) {
  const isDark = theme === 'dark';

  // 严谨的色彩对比度计算
  const colors = {
    bgStart: isDark ? '#141417' : '#FDFDFD',
    bgEnd: isDark ? '#1C1C21' : '#F4F7FF',
    textMain: isDark ? '#F0F0F2' : '#1A1B1F', // 保证可见性
    textSub: isDark ? '#9A9AA5' : '#71717A',
    brand: '#00A1D6',
    brandLight: '#33B4DE',
    accent: '#FB7299',
    glass: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,161,214,0.08)'
  };

  const formatNum = (v) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v;

  return `
    <svg width="520" height="240" viewBox="0 0 520 240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&amp;family=Outfit:wght@600;800&amp;display=swap');
          
          .font-title { font-family: 'Outfit', 'Noto Sans SC', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
          .font-body { font-family: 'Noto Sans SC', sans-serif; font-weight: 400; }
          .font-number { font-family: 'Outfit', sans-serif; font-weight: 700; }
          
          .text-main { fill: ${colors.textMain}; }
          .text-sub { fill: ${colors.textSub}; }
          .text-brand { fill: ${colors.brand}; }
          
          @keyframes slideIn { from { transform: translateX(-10px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          .animate-fade { animation: slideIn 0.8s ease-out forwards; }
        </style>

        <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${isDark ? '#000' : '#D0D7DE'}" flood-opacity="0.2"/>
        </filter>

        <mask id="avatarMask">
          <rect x="0" y="0" width="100" height="100" rx="50" fill="white" />
        </mask>

        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colors.bgStart}" />
          <stop offset="100%" stop-color="${colors.bgEnd}" />
        </linearGradient>

        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(520 0) rotate(135) scale(200)">
          <stop stop-color="${colors.brand}" stop-opacity="0.1" />
          <stop offset="1" stop-color="${colors.brand}" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect width="520" height="240" rx="28" fill="url(#bgGrad)" filter="url(#cardShadow)"/>
      <rect width="520" height="240" rx="28" fill="url(#glow)"/>
      <rect x="0.5" y="0.5" width="519" height="239" rx="27.5" stroke="${colors.border}" stroke-opacity="0.5"/>

      <path d="M0 80 Q0 120 0 160" stroke="${colors.brand}" stroke-width="4" stroke-linecap="round"/>

      <g transform="translate(32, 40)" class="animate-fade">
        <g>
          <circle cx="50" cy="50" r="54" fill="none" stroke="${colors.brand}" stroke-width="2" stroke-dasharray="20 10"/>
          <image href="${data.face}" width="100" height="100" mask="url(#avatarMask)"/>
          
          <g transform="translate(65, 80)">
            <rect width="42" height="20" rx="10" fill="${colors.accent}" />
            <text x="21" y="14" text-anchor="middle" class="font-number" style="font-size: 11px; fill: white;">LV${data.level}</text>
          </g>
        </g>

        <g transform="translate(130, 10)">
          <text x="0" y="15" class="font-title text-main" style="font-size: 26px;">${data.name}</text>
          
          <foreignObject x="0" y="30" width="200" height="45">
            <div xmlns="http://www.w3.org/1999/xhtml" style="padding-top: 8px;">
              <p class="font-body" style="margin: 0; color: ${colors.textSub}; font-size: 13px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${data.sign}
              </p>
            </div>
          </foreignObject>

          <g transform="translate(0, 95)">
            <g>
              <text x="0" y="0" class="font-number text-brand" style="font-size: 22px;">${formatNum(data.follower)}</text>
              <text x="0" y="20" class="font-title text-sub" style="font-size: 10px; text-transform: uppercase;">Followers</text>
            </g>
            <g transform="translate(90, 0)">
              <text x="0" y="0" class="font-number text-main" style="font-size: 22px;">${formatNum(data.following)}</text>
              <text x="0" y="20" class="font-title text-sub" style="font-size: 10px; text-transform: uppercase;">Following</text>
            </g>
          </g>
        </g>
      </g>

      ${data.video ? `
      <g transform="translate(350, 30)">
        <rect width="140" height="180" rx="20" fill="${colors.glass}" stroke="${colors.border}" stroke-width="1"/>
        
        <g transform="translate(10, 10)">
          <clipPath id="vClip">
            <rect width="120" height="75" rx="12"/>
          </clipPath>
          <image href="${data.video.cover}" width="120" height="75" preserveAspectRatio="xMidYMid slice" clip-path="url(#vClip)"/>
          
          <g transform="translate(5, 55)">
            <rect width="50" height="16" rx="8" fill="rgba(0,0,0,0.5)" style="backdrop-filter: blur(4px);"/>
            <text x="25" y="12" text-anchor="middle" class="font-number" style="font-size: 9px; fill: white;">▶ ${formatNum(data.video.play)}</text>
          </g>

          <foreignObject x="0" y="85" width="120" height="60">
            <div xmlns="http://www.w3.org/1999/xhtml">
              <div class="font-body" style="color: ${colors.textMain}; font-size: 11px; font-weight: 500; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                ${data.video.title}
              </div>
            </div>
          </foreignObject>

          <rect x="0" y="150" width="20" height="3" rx="1.5" fill="${colors.brand}" />
        </g>
      </g>
      ` : ''}

      <g transform="translate(32, 215)" opacity="0.5">
        <circle cx="4" cy="0" r="2" fill="${colors.brand}" />
        <text x="12" y="4" class="font-title text-sub" style="font-size: 9px;">BILIBILI PASSPORT SYSTEM</text>
      </g>
    </svg>
  `;
}

function sendErrorSVG(res, code, msg) {
  const svg = `
    <svg width="400" height="120" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="120" rx="24" fill="#FFF5F5" stroke="#FECACA" stroke-width="2"/>
      <circle cx="40" cy="40" r="15" fill="#EF4444" opacity="0.1"/>
      <text x="35" y="46" fill="#EF4444" font-family="monospace" font-weight="bold" font-size="20">!</text>
      <text x="70" y="45" fill="#1F2937" font-family="sans-serif" font-weight="bold" font-size="16">${code}</text>
      <text x="70" y="75" fill="#6B7280" font-family="sans-serif" font-size="14">${msg}</text>
    </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).send(svg);
}