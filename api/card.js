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
<svg width="600" height="260" viewBox="0 0 600 260" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- 多层背景渐变系统 -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0F1A2F"/>
      <stop offset="50%" stop-color="#1A2942"/>
      <stop offset="100%" stop-color="#0F1A2F"/>
    </linearGradient>
    
    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="rgba(30, 40, 60, 0.85)"/>
      <stop offset="100%" stop-color="rgba(20, 30, 50, 0.85)"/>
    </linearGradient>
    
    <!-- 霓虹发光效果 -->
    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feFlood flood-color="#00AEEC" flood-opacity="0.6"/>
      <feComposite in2="blur" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="12"/>
      <feOffset dx="0" dy="8"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.2"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <filter id="accentGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur2"/>
      <feFlood flood-color="#FB7299" flood-opacity="0.8"/>
      <feComposite in2="blur2" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- 头像圆形遮罩 -->
    <clipPath id="avatarClip">
      <circle cx="88" cy="88" r="78"/>
    </clipPath>
    
    <!-- 等级徽章遮罩 -->
    <clipPath id="levelBadgeClip">
      <circle cx="144" cy="144" r="20"/>
    </clipPath>
    
    <!-- 视频封面遮罩 -->
    <clipPath id="videoClip">
      <rect width="220" height="124" rx="16"/>
    </clipPath>
    
    <!-- 字体导入 -->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
      .name-primary {
        font-family: 'Poppins', sans-serif;
        font-weight: 700;
        fill: #FFFFFF;
        font-size: 32px;
        letter-spacing: 0.5px;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }
      
      .name-secondary {
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        fill: #00AEEC;
        font-size: 28px;
        letter-spacing: 0.3px;
      }
      
      .level-badge {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 800;
        fill: #FFFFFF;
        font-size: 14px;
        letter-spacing: 1px;
      }
      
      .signature {
        font-family: 'Inter', sans-serif;
        font-weight: 400;
        fill: #A0B4C6;
        font-size: 15px;
        line-height: 1.5;
      }
      
      .stat-number {
        font-family: 'Poppins', sans-serif;
        font-weight: 700;
        fill: #00AEEC;
        font-size: 24px;
        letter-spacing: 0.5px;
      }
      
      .stat-label {
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        fill: #8CA0B8;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .social-icon {
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        fill: #FB7299;
        font-size: 13px;
      }
      
      .video-title {
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        fill: #FFFFFF;
        font-size: 16px;
        line-height: 1.3;
      }
      
      .play-count {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 500;
        fill: #FFFFFF;
        font-size: 12px;
      }
      
      .section-label {
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        fill: #00AEEC;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }
      
      .badge-label {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        fill: #FFFFFF;
        font-size: 10px;
        letter-spacing: 0.8px;
      }
    </style>
    
    <!-- 装饰性图案 -->
    <pattern id="gridPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="transparent"/>
      <path d="M40 0L0 0 0 40" fill="none" stroke="rgba(0, 174, 236, 0.05)" stroke-width="1"/>
    </pattern>
    
    <!-- 动画效果 -->
    <style type="text/css">
      <![CDATA[
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(0, 174, 236, 0.5)); }
          50% { filter: drop-shadow(0 0 16px rgba(0, 174, 236, 0.8)); }
        }
        
        .avatar-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .stat-pulse {
          animation: pulse 3s ease-in-out infinite;
        }
        
        .badge-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        .hover-lift {
          transition: transform 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-2px);
        }
      ]]>
    </style>
  </defs>
  
  <!-- 背景层 -->
  <rect width="600" height="260" fill="url(#bgGradient)"/>
  <rect width="600" height="260" fill="url(#gridPattern)" opacity="0.3"/>
  
  <!-- 主卡片 -->
  <g filter="url(#softShadow)">
    <rect x="20" y="20" width="560" height="220" rx="28" fill="url(#cardGradient)"/>
    <rect x="20" y="20" width="560" height="220" rx="28" stroke="rgba(0, 174, 236, 0.15)" stroke-width="1"/>
  </g>
  
  <!-- 装饰边框 -->
  <rect x="24" y="24" width="552" height="212" rx="24" fill="none" stroke="rgba(0, 174, 236, 0.3)" stroke-width="0.5" stroke-dasharray="4 4"/>
  
  <!-- 内容区域 -->
  <g transform="translate(40, 40)">
    
    <!-- 头像区域 -->
    <g class="avatar-float">
      <!-- 头像背景光晕 -->
      <circle cx="88" cy="88" r="84" fill="rgba(0, 174, 236, 0.1)" filter="url(#neonGlow)"/>
      <circle cx="88" cy="88" r="80" fill="rgba(20, 30, 50, 0.9)" stroke="rgba(0, 174, 236, 0.4)" stroke-width="2"/>
      
      <!-- 头像图片 -->
      <g clip-path="url(#avatarClip)">
        <rect x="10" y="10" width="156" height="156" fill="rgba(0, 0, 0, 0.3)"/>
        <image href="${data.face}" x="10" y="10" width="156" height="156" preserveAspectRatio="xMidYMid slice"/>
        <!-- 头像遮罩渐变 -->
        <rect x="10" y="10" width="156" height="156" fill="url(#avatarOverlay)" opacity="0.2"/>
      </g>
      
      <!-- 头像边框装饰 -->
      <circle cx="88" cy="88" r="78" fill="none" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1"/>
      <circle cx="88" cy="88" r="75" fill="none" stroke="rgba(0, 174, 236, 0.5)" stroke-width="1" stroke-dasharray="3 3"/>
      
      <!-- 等级徽章 -->
      <g transform="translate(144, 144)" class="badge-glow">
        <!-- 徽章背景渐变 -->
        <linearGradient id="levelBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF4D8D"/>
          <stop offset="100%" stop-color="#FB7299"/>
        </linearGradient>
        
        <circle cx="0" cy="0" r="24" fill="url(#levelBadgeGrad)" filter="url(#accentGlow)"/>
        <circle cx="0" cy="0" r="22" fill="url(#levelBadgeGrad)"/>
        
        <!-- 徽章装饰光环 -->
        <circle cx="0" cy="0" r="20" fill="none" stroke="rgba(255, 255, 255, 0.3)" stroke-width="1"/>
        
        <!-- 等级文字 -->
        <text x="0" y="4" text-anchor="middle" class="level-badge">Lv${data.level}</text>
        
        <!-- 徽章装饰点 -->
        <circle cx="-15" cy="-15" r="2" fill="rgba(255, 255, 255, 0.6)"/>
        <circle cx="15" cy="15" r="2" fill="rgba(255, 255, 255, 0.6)"/>
      </g>
    </g>
    
    <!-- 用户信息区域 -->
    <g transform="translate(200, 0)">
      
      <!-- 昵称显示区域 -->
      <g class="hover-lift">
        <!-- 昵称主标签 -->
        <text x="0" y="38" class="name-primary">${data.name}</text>
        
        <!-- 昵称装饰下划线 -->
        <path d="M0 48 L160 48" stroke="#00AEEC" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        <path d="M0 48 L40 48" stroke="#00AEEC" stroke-width="3" stroke-linecap="round"/>
      </g>
      
      <!-- 个性签名区域 -->
      <g transform="translate(0, 70)">
        <!-- 签名标签 -->
        <text x="0" y="0" class="section-label">SIGNATURE</text>
        
        <!-- 签名内容容器 -->
        <foreignObject x="0" y="12" width="260" height="60">
          <div xmlns="http://www.w3.org/1999/xhtml" style="
            color: #A0B4C6;
            font-family: 'Inter', sans-serif;
            font-size: 15px;
            font-weight: 400;
            line-height: 1.5;
            margin: 0;
            padding: 4px 0;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          ">
            ${data.sign}
          </div>
        </foreignObject>
        
        <!-- 签名装饰线 -->
        <path d="M0 80 L260 80" stroke="rgba(160, 180, 198, 0.2)" stroke-width="1" stroke-dasharray="2 2"/>
      </g>
      
      <!-- 社交信息区域 -->
      <g transform="translate(0, 140)">
        <!-- 区域标题 -->
        <text x="0" y="0" class="section-label">SOCIAL STATS</text>
        
        <!-- 关注者数据 -->
        <g transform="translate(0, 30)" class="hover-lift stat-pulse">
          <g transform="translate(0, 0)">
            <!-- 数据装饰背景 -->
            <rect x="0" y="-20" width="110" height="50" rx="12" fill="rgba(0, 174, 236, 0.08)"/>
            
            <!-- 图标 -->
            <text x="15" y="5" class="social-icon">👥</text>
            
            <!-- 数据 -->
            <text x="60" y="5" class="stat-number">${formatNum(data.follower)}</text>
            
            <!-- 标签 -->
            <text x="60" y="24" class="stat-label">Followers</text>
            
            <!-- 装饰线 -->
            <path d="M15 10 L50 10" stroke="rgba(0, 174, 236, 0.3)" stroke-width="1"/>
          </g>
        </g>
        
        <!-- 关注数据 -->
        <g transform="translate(130, 30)" class="hover-lift">
          <g transform="translate(0, 0)">
            <!-- 数据装饰背景 -->
            <rect x="0" y="-20" width="110" height="50" rx="12" fill="rgba(251, 114, 153, 0.08)"/>
            
            <!-- 图标 -->
            <text x="15" y="5" class="social-icon">❤️</text>
            
            <!-- 数据 -->
            <text x="60" y="5" class="stat-number" fill="#FB7299">${formatNum(data.following)}</text>
            
            <!-- 标签 -->
            <text x="60" y="24" class="stat-label">Following</text>
            
            <!-- 装饰线 -->
            <path d="M15 10 L50 10" stroke="rgba(251, 114, 153, 0.3)" stroke-width="1"/>
          </g>
        </g>
        
        <!-- 社交信息装饰 -->
        <path d="M0 60 L240 60" stroke="rgba(0, 174, 236, 0.1)" stroke-width="1"/>
      </g>
    </g>
    
    <!-- 视频展示区域 -->
    ${data.video ? `
    <g transform="translate(480, 0)" class="hover-lift">
      <!-- 视频卡片背景 -->
      <rect x="-220" y="0" width="220" height="180" rx="20" fill="rgba(15, 25, 40, 0.9)" stroke="rgba(0, 174, 236, 0.2)" stroke-width="1"/>
      
      <!-- 区域标题 -->
      <text x="-210" y="18" class="section-label">LATEST VIDEO</text>
      
      <!-- 视频封面 -->
      <g transform="translate(-210, 30)">
        <!-- 封面容器 -->
        <rect width="200" height="112" rx="12" fill="rgba(0, 0, 0, 0.4)"/>
        
        <!-- 封面图片 -->
        <g clip-path="url(#videoClip)">
          <image href="${data.video.cover}" x="-10" y="-10" width="220" height="132" preserveAspectRatio="xMidYMid slice"/>
          
          <!-- 封面渐变遮罩 -->
          <rect width="200" height="112" fill="url(#videoOverlay)" opacity="0.4"/>
        </g>
        
        <!-- 播放量指示器 -->
        <rect x="0" y="80" width="200" height="32" fill="rgba(0, 0, 0, 0.7)"/>
        <rect x="0" y="80" width="200" height="32" fill="url(#playOverlay)" opacity="0.5"/>
        
        <!-- 播放图标和计数 -->
        <g transform="translate(12, 94)">
          <circle cx="8" cy="8" r="6" fill="#00AEEC"/>
          <text x="8" y="11" text-anchor="middle" class="badge-label" font-size="9">▶</text>
          <text x="28" y="12" class="play-count">${formatNum(data.video.play)} plays</text>
        </g>
        
        <!-- 视频标题 -->
        <foreignObject x="0" y="120" width="200" height="48">
          <div xmlns="http://www.w3.org/1999/xhtml" style="
            color: #FFFFFF;
            font-family: 'Poppins', sans-serif;
            font-size: 14px;
            font-weight: 600;
            line-height: 1.3;
            margin: 0;
            padding: 4px 8px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          ">
            ${data.video.title}
          </div>
        </foreignObject>
        
        <!-- 新发布徽章 -->
        <g transform="translate(140, 12)">
          <rect width="52" height="20" rx="10" fill="#00AEEC" opacity="0.9"/>
          <rect width="52" height="20" rx="10" fill="none" stroke="rgba(255, 255, 255, 0.3)" stroke-width="1"/>
          <text x="26" y="13" text-anchor="middle" class="badge-label">NEW</text>
        </g>
        
        <!-- 视频卡片装饰 -->
        <rect x="0" y="0" width="200" height="112" rx="12" fill="none" stroke="rgba(255, 255, 255, 0.1)" stroke-width="0.5"/>
      </g>
      
      <!-- 视频区域装饰线 -->
      <path d="M-210 172 L10 172" stroke="rgba(0, 174, 236, 0.3)" stroke-width="1" stroke-dasharray="3 3"/>
    </g>
    ` : ''}
    
    <!-- 底部装饰 -->
    <g transform="translate(0, 190)">
      <!-- 主装饰线 -->
      <path d="M0 0 L520 0" stroke="url(#lineGradient)" stroke-width="2" stroke-linecap="round"/>
      
      <!-- 装饰点 -->
      <circle cx="0" cy="0" r="3" fill="#00AEEC"/>
      <circle cx="130" cy="0" r="2" fill="#00AEEC" opacity="0.6"/>
      <circle cx="260" cy="0" r="2" fill="#00AEEC" opacity="0.6"/>
      <circle cx="390" cy="0" r="2" fill="#00AEEC" opacity="0.6"/>
      <circle cx="520" cy="0" r="3" fill="#00AEEC"/>
      
      <!-- 版权信息 -->
      <text x="520" y="15" text-anchor="end" class="stat-label" opacity="0.5">Bili-Card Modern UI</text>
    </g>
    
    <!-- 动态装饰元素 -->
    <!-- 漂浮点1 -->
    <circle cx="180" cy="40" r="1.5" fill="#00AEEC" opacity="0.4">
      <animate attributeName="cy" values="40;35;40" dur="3s" repeatCount="indefinite"/>
    </circle>
    
    <!-- 漂浮点2 -->
    <circle cx="300" cy="100" r="1.5" fill="#FB7299" opacity="0.4">
      <animate attributeName="cx" values="300;305;300" dur="4s" repeatCount="indefinite"/>
    </circle>
    
    <!-- 漂浮点3 -->
    <circle cx="400" cy="160" r="1.5" fill="#00AEEC" opacity="0.4">
      <animate attributeName="cy" values="160;165;160" dur="5s" repeatCount="indefinite"/>
    </circle>
    
  </g>
  
  <!-- 额外的渐变定义 -->
  <defs>
    <linearGradient id="avatarOverlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="100%" stop-color="rgba(0, 0, 0, 0.6)"/>
    </linearGradient>
    
    <linearGradient id="videoOverlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="100%" stop-color="rgba(0, 0, 0, 0.8)"/>
    </linearGradient>
    
    <linearGradient id="playOverlay" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00AEEC" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#00AEEC" stop-opacity="0.1"/>
    </linearGradient>
    
    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00AEEC" stop-opacity="0"/>
      <stop offset="20%" stop-color="#00AEEC"/>
      <stop offset="80%" stop-color="#00AEEC"/>
      <stop offset="100%" stop-color="#00AEEC" stop-opacity="0"/>
    </linearGradient>
  </defs>
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