// api/card.js - 极致设计·极简主义版
const axios = require('axios');

const CONFIG = {
  CACHE_TTL: 3600,
  TIMEOUT: 8000,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const cache = new Map();

// 字符转义
const esc = (str) => {
  if (!str) return '';
  return str.toString().replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[m]));
};

// 图片代理
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
      sign: esc(userData.sign || ''),
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
  const color = {
    bg: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#E5E5E5' : '#18191C', // 主文字
    sub: isDark ? '#888888' : '#9499A0',  // 副文字
    blue: '#00A1D6',                       // B站蓝
    pink: '#FB7299',                       // 等级粉
    border: isDark ? '#2D2D2D' : '#F1F2F3',
    card: isDark ? '#1E1E1E' : '#F6F7F8'
  };

  const formatNum = (v) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v;

  return `
    <svg width="480" height="160" viewBox="0 0 480 160" xmlns="http://www.w3.org/2000/svg">
      <style>
        .base { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", "Microsoft YaHei", sans-serif; }
        .name { font-size: 22px; font-weight: 800; fill: ${color.blue}; }
        .sign { font-size: 12px; fill: ${color.sub}; }
        .stat-v { font-size: 18px; font-weight: 700; fill: ${color.text}; }
        .stat-l { font-size: 11px; font-weight: 400; fill: ${color.sub}; letter-spacing: 1px; }
        .v-title { font-size: 12px; font-weight: 600; fill: ${color.text}; }
        .play-txt { font-size: 10px; font-weight: 700; fill: #FFF; }
        .lvl-txt { font-size: 10px; font-weight: 900; fill: #FFF; }
      </style>

      <rect width="480" height="160" rx="14" fill="${color.bg}" stroke="${color.border}" stroke-width="1"/>

      <g transform="translate(24, 24)">
        <g>
          <defs><clipPath id="h"><circle cx="36" cy="36" r="36"/></clipPath></defs>
          <circle cx="36" cy="36" r="38" fill="${color.blue}" opacity="0.1"/>
          <image href="${data.face}" width="72" height="72" clip-path="url(#h)"/>
          <rect x="52" y="58" width="26" height="14" rx="4" fill="${color.pink}"/>
          <text x="65" y="69" text-anchor="middle" class="base lvl-txt">L${data.level}</text>
        </g>

        <g transform="translate(90, 10)">
          <text class="base name">${data.name}</text>
          <text y="24" class="base sign">${data.sign.substring(0, 20)}${data.sign.length > 20 ? '...' : ''}</text>
          
          <g transform="translate(0, 55)">
            <g>
              <text class="base stat-v">${formatNum(data.follower)}</text>
              <text y="18" class="base stat-l">粉丝</text>
            </g>
            <g transform="translate(75, 0)">
              <text class="base stat-v">${formatNum(data.following)}</text>
              <text y="18" class="base stat-l">关注</text>
            </g>
          </g>
        </g>
      </g>

      ${data.video ? `
      <g transform="translate(290, 20)">
        <rect width="170" height="120" rx="12" fill="${color.card}"/>
        <g transform="translate(10, 10)">
          <defs><clipPath id="v"><rect width="150" height="68" rx="6"/></clipPath></defs>
          <image href="${data.video.cover}" width="150" height="68" preserveAspectRatio="xMidYMid slice" clip-path="url(#v)"/>
          
          <rect y="52" width="45" height="16" rx="4" fill="#000" fill-opacity="0.5"/>
          <text x="22.5" y="63" text-anchor="middle" class="base play-txt">▶ ${formatNum(data.video.play)}</text>

          <foreignObject y="76" width="150" height="34">
            <div xmlns="http://www.w3.org/1999/xhtml" style="color:${color.text}; font-family:sans-serif; font-size:11px; font-weight:600; line-height:1.3; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
              ${data.video.title}
            </div>
          </foreignObject>
        </g>
      </g>
      ` : ''}
    </svg>
  `;
}

function sendErrorSVG(res, code, msg) {
  const svg = `<svg width="400" height="80" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="80" rx="10" fill="#FFF1F0" stroke="#FFA39E"/>
    <text x="20" y="35" fill="#CF1322" font-family="sans-serif" font-weight="bold">${code}</text>
    <text x="20" y="55" fill="#F5222D" font-family="sans-serif" font-size="12">${msg}</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).send(svg);
}