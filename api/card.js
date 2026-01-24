// api/card.js - 现代化UI重构版
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

  // 现代化色彩系统 - 增强对比度和视觉层次
  const palette = {
    bg: isDark ? '#0F0F12' : '#FFFFFF',
    card: isDark ? 'rgba(25, 26, 30, 0.9)' : 'rgba(248, 249, 252, 0.9)',
    primary: '#00AEEC',
    primaryLight: isDark ? '#1AC4FF' : '#00B7FF',
    accent: '#FB7299',
    accentLight: isDark ? '#FF8AB0' : '#FF85AD',
    textMain: isDark ? '#FFFFFF' : '#1A1A1E',
    textSecondary: isDark ? '#B0B4BB' : '#5A5E66',
    textTertiary: isDark ? '#8A8E95' : '#7A7E85',
    border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    shadow: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)',
    levelBg: isDark ? '#FF4D7C' : '#FF2E63',
    statsBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
  };

  const formatNum = (v) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v;

  return `
    <svg width="540" height="220" viewBox="0 0 540 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&amp;display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&amp;display=swap');
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&amp;display=swap');
        </style>
        
        <!-- 现代化阴影效果 -->
        <filter id="shadow-lg" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="12"/>
          <feOffset dx="0" dy="6" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="${isDark ? '0.25' : '0.15'}"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <filter id="shadow-sm" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.15"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <!-- 渐变背景 -->
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.bg}" />
          <stop offset="100%" stop-color="${isDark ? '#17181C' : '#F8F9FC'}" />
        </linearGradient>
        
        <!-- 头像圆形遮罩 -->
        <clipPath id="avatarClip">
          <circle cx="60" cy="60" r="58" />
        </clipPath>
        
        <!-- 等级徽章渐变 -->
        <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.levelBg}" />
          <stop offset="100%" stop-color="${palette.accent}" />
        </linearGradient>
        
        <!-- 主内容样式 -->
        <style type="text/css">
          <![CDATA[
            .name-text {
              font-family: 'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              font-weight: 700;
              font-size: 26px;
              fill: ${palette.textMain};
              letter-spacing: -0.3px;
            }
            
            .sign-text {
              font-family: 'Inter', -apple-system, 'SF Pro Text', 'PingFang SC', sans-serif;
              font-weight: 400;
              font-size: 13px;
              line-height: 1.5;
              fill: ${palette.textSecondary};
            }
            
            .level-badge {
              font-family: 'Poppins', 'Inter', sans-serif;
              font-weight: 700;
              font-size: 11px;
              letter-spacing: 0.5px;
              fill: white;
            }
            
            .stat-num {
              font-family: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
              font-weight: 600;
              font-size: 20px;
              fill: ${palette.primaryLight};
            }
            
            .stat-label {
              font-family: 'Inter', -apple-system, sans-serif;
              font-weight: 500;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.6px;
              fill: ${palette.textTertiary};
            }
            
            .video-title {
              font-family: 'Inter', -apple-system, sans-serif;
              font-weight: 600;
              font-size: 12px;
              line-height: 1.4;
              fill: ${palette.textMain};
            }
            
            .video-play {
              font-family: 'Inter', sans-serif;
              font-weight: 500;
              font-size: 10px;
              fill: white;
              letter-spacing: 0.3px;
            }
            
            .video-tag {
              font-family: 'Poppins', sans-serif;
              font-weight: 700;
              font-size: 9px;
              fill: ${palette.accentLight};
              letter-spacing: 0.8px;
            }
          ]]>
        </style>
      </defs>

      <!-- 背景 -->
      <rect width="540" height="220" rx="26" fill="url(#bgGradient)" />
      
      <!-- 装饰性边框 -->
      <rect x="0.5" y="0.5" width="539" height="219" rx="25.5" stroke="${palette.border}" stroke-width="1" stroke-opacity="0.5" />

      <!-- 主要内容容器 -->
      <g transform="translate(32, 32)">
        <!-- 头像区域 -->
        <g filter="url(#shadow-lg)">
          <!-- 头像背景光环 -->
          <circle cx="60" cy="60" r="64" fill="${palette.primary}" fill-opacity="${isDark ? '0.15' : '0.08'}" />
          
          <!-- 头像外框 -->
          <circle cx="60" cy="60" r="58" fill="none" stroke="${palette.primary}" stroke-width="1.5" stroke-opacity="0.3" />
          
          <!-- 头像图片 -->
          <image href="${data.face}" x="2" y="2" width="116" height="116" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice" />
          
          <!-- 等级徽章 -->
          <g transform="translate(85, 95)">
            <rect width="36" height="20" rx="10" fill="url(#levelGradient)" />
            <text x="18" y="14" text-anchor="middle" class="level-badge">LV${data.level}</text>
          </g>
        </g>

        <!-- 用户信息区域 -->
        <g transform="translate(140, 8)">
          <!-- 昵称 -->
          <text x="0" y="28" class="name-text">${data.name}</text>
          
          <!-- 签名 - 使用foreignObject实现多行文本 -->
          <foreignObject x="0" y="42" width="180" height="44">
            <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${palette.textSecondary}; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-weight: 400;">
              ${data.sign}
            </div>
          </foreignObject>

          <!-- 社交统计数据 -->
          <g transform="translate(0, 102)">
            <!-- 统计容器背景 -->
            <rect width="170" height="56" rx="12" fill="${palette.statsBg}" />
            
            <!-- 粉丝数 -->
            <g transform="translate(16, 18)">
              <text class="stat-num">${formatNum(data.follower)}</text>
              <text y="22" class="stat-label">粉丝</text>
            </g>
            
            <!-- 分隔线 -->
            <line x1="86" y1="16" x2="86" y2="40" stroke="${palette.border}" stroke-width="1" />
            
            <!-- 关注数 -->
            <g transform="translate(100, 18)">
              <text class="stat-num">${formatNum(data.following)}</text>
              <text y="22" class="stat-label">关注</text>
            </g>
          </g>
        </g>
      </g>

      <!-- 视频卡片区域 -->
      ${data.video ? `
      <g transform="translate(340, 28)" filter="url(#shadow-sm)">
        <!-- 卡片背景 -->
        <rect width="180" height="164" rx="18" fill="${palette.card}" stroke="${palette.border}" stroke-width="0.5" />
        
        <!-- 视频内容 -->
        <g transform="translate(14, 14)">
          <!-- 视频封面 -->
          <rect width="152" height="86" rx="10" fill="rgba(0,0,0,0.1)" />
          <image href="${data.video.cover}" width="152" height="86" preserveAspectRatio="xMidYMid slice" clip-path="inset(0 round 10)" />
          
          <!-- 播放量遮罩 -->
          <rect y="66" width="152" height="20" fill="rgba(0,0,0,0.7)" rx="0 0 10 10" />
          <text x="8" y="80" class="video-play">▶ ${formatNum(data.video.play)} 播放</text>
          
          <!-- 视频标题 -->
          <foreignObject y="96" width="152" height="44">
            <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${palette.textMain}; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; line-height: 1.4; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${data.video.title}
            </div>
          </foreignObject>
          
          <!-- 标签 -->
          <g transform="translate(0, 142)">
            <rect width="70" height="18" rx="9" fill="${isDark ? 'rgba(251, 114, 153, 0.15)' : 'rgba(251, 114, 153, 0.08)'}" />
            <text x="35" y="12.5" text-anchor="middle" class="video-tag">最新视频</text>
          </g>
        </g>
      </g>
      ` : ''}

      <!-- 装饰性分隔线 -->
      <line x1="32" y1="190" x2="320" y2="190" stroke="${palette.primary}" stroke-width="2" stroke-linecap="round" stroke-opacity="0.4">
        <animate attributeName="stroke-dasharray" values="0, 288; 288, 0" dur="2s" repeatCount="indefinite" />
      </line>
      
      <!-- 底部装饰性小点 -->
      <g transform="translate(32, 195)">
        <circle cx="0" cy="0" r="2" fill="${palette.primary}" opacity="0.6">
          <animate attributeName="cx" values="0; 288; 0" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  `;
}

function sendErrorSVG(res, code, msg) {
  const svg = `
    <svg width="400" height="120" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="errorBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF1F0" />
          <stop offset="100%" stop-color="#FFE9E8" />
        </linearGradient>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600&amp;display=swap');
          .error-code { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 18px; }
          .error-msg { font-family: 'Inter', sans-serif; font-weight: 500; font-size: 14px; }
        </style>
      </defs>
      
      <rect width="400" height="120" rx="20" fill="url(#errorBg)"/>
      <circle cx="40" cy="60" r="20" fill="#FF4D4F" opacity="0.1"/>
      <path d="M30 50L50 70M30 70L50 50" stroke="#FF4D4F" stroke-width="2.5" stroke-linecap="round"/>
      <text x="70" y="55" fill="#FF4D4F" class="error-code">${code}</text>
      <text x="70" y="80" fill="#F5222D" class="error-msg">${msg}</text>
      <rect x="0.5" y="0.5" width="399" height="119" rx="19.5" stroke="#FFA39E" stroke-opacity="0.6"/>
    </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).send(svg);
}