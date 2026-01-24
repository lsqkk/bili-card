// api/card.js - 快速验证版本
const axios = require('axios');

module.exports = async (req, res) => {
    console.log('=== Bili-Card API 被调用 ===');
    console.log('请求参数:', req.query);
    console.log('请求时间:', new Date().toISOString());
    console.log('Node版本:', process.version);

    try {
        const { uid, theme = 'default', hide = '' } = req.query;

        // 验证UID
        if (!uid || !/^\d+$/.test(uid)) {
            console.log('UID验证失败:', uid);
            return sendSVG(res, 400, '错误：UID格式不正确，应为纯数字', '#dc3545');
        }

        console.log('开始获取用户数据，UID:', uid);

        // 1. 获取用户信息
        const userUrl = 'https://uapis.cn/api/v1/social/bilibili/userinfo';
        const userResponse = await axios.get(userUrl, {
            params: { uid },
            timeout: 8000
        });

        console.log('用户API响应状态:', userResponse.status);

        if (userResponse.data.code !== 0) {
            console.log('用户API返回错误:', userResponse.data);
            return sendSVG(res, 404, '错误：用户不存在或无法访问', '#6c757d');
        }

        const userInfo = userResponse.data.data;
        console.log('用户信息获取成功:', userInfo.name);

        // 2. 获取最新视频
        const videoUrl = 'https://uapis.cn/api/v1/social/bilibili/archives';
        let latestVideo = null;

        try {
            const videoResponse = await axios.get(videoUrl, {
                params: {
                    mid: uid,
                    orderby: 'pubdate',
                    ps: 1,
                    pn: 1
                },
                timeout: 8000
            });

            if (videoResponse.data.videos && videoResponse.data.videos.length > 0) {
                latestVideo = videoResponse.data.videos[0];
                console.log('最新视频获取成功:', latestVideo.title.substring(0, 30) + '...');
            }
        } catch (videoError) {
            console.warn('获取视频数据失败:', videoError.message);
        }

        // 3. 生成SVG卡片
        const svg = generateSVG(userInfo, latestVideo, { theme, hide });
        console.log('SVG生成完成，长度:', svg.length);

        // 4. 返回响应
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=600');
        res.status(200).send(svg);

    } catch (error) {
        console.error('=== 严重错误 ===');
        console.error('错误名称:', error.name);
        console.error('错误信息:', error.message);
        console.error('错误堆栈:', error.stack);

        // 根据错误类型返回不同的错误信息
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            return sendSVG(res, 504, '错误：API请求超时，请稍后重试', '#ff6b35');
        } else if (error.response) {
            console.error('API响应状态:', error.response.status);
            console.error('API响应数据:', error.response.data);
            return sendSVG(res, 502, '错误：B站API服务暂时不可用', '#6c757d');
        } else {
            return sendSVG(res, 500, '错误：服务器内部错误', '#6c757d');
        }
    }
};

// 辅助函数：生成错误SVG
function sendSVG(res, status, message, color = '#dc3545') {
    const errorSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="540" height="180" viewBox="0 0 540 180">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8f9fa" />
          <stop offset="100%" stop-color="#e9ecef" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" rx="10" ry="10"/>
      <rect x="10" y="10" width="520" height="160" fill="white" rx="8" ry="8" 
            stroke="#dee2e6" stroke-width="1"/>
      
      <!-- 错误图标 -->
      <circle cx="270" cy="60" r="25" fill="${color}" opacity="0.1"/>
      <path d="M270,45 L270,65 M270,70 L270,75" stroke="${color}" stroke-width="3" 
            stroke-linecap="round" fill="none"/>
      <circle cx="270" cy="60" r="23" stroke="${color}" stroke-width="2" fill="none"/>
      
      <!-- 错误信息 -->
      <text x="270" y="110" text-anchor="middle" fill="#495057" 
            font-family="'Segoe UI', system-ui, sans-serif" font-size="16" font-weight="600">
        ${message}
      </text>
      
      <!-- 提示信息 -->
      <text x="270" y="140" text-anchor="middle" fill="#6c757d" 
            font-family="'Segoe UI', system-ui, sans-serif" font-size="12">
        请检查UID是否正确，或稍后重试
      </text>
    </svg>
  `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(status).send(errorSVG);
}

// 辅助函数：生成B站卡片SVG
function generateSVG(userInfo, latestVideo, options) {
    const { theme, hide } = options;
    const hiddenItems = hide.split(',').map(item => item.trim());

    // 格式化数字
    const formatNumber = (num) => {
        if (!num) return '0';
        return num >= 10000 ? (num / 10000).toFixed(1) + '万' : num.toString();
    };

    // 截断文本
    const truncateText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // 生成SVG
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="540" height="280" viewBox="0 0 540 280">
      <defs>
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f8f9fa" />
        </linearGradient>
        
        <linearGradient id="headerBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00a1d6" />
          <stop offset="100%" stop-color="#0092c7" />
        </linearGradient>
        
        <clipPath id="avatarClip">
          <circle cx="70" cy="70" r="40"/>
        </clipPath>
        
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.1)"/>
        </filter>
      </defs>
      
      <style>
        .card { font-family: 'Segoe UI', 'Microsoft YaHei', system-ui, sans-serif; }
        .header-title { font-size: 24px; font-weight: 700; fill: white; }
        .user-name { font-size: 22px; font-weight: 600; fill: #1a1a1a; }
        .user-level { font-size: 12px; font-weight: 600; fill: white; }
        .signature { font-size: 14px; fill: #666; font-style: italic; }
        .stat-label { font-size: 12px; fill: #6c757d; }
        .stat-value { font-size: 18px; font-weight: 600; fill: #00a1d6; }
        .video-title { font-size: 14px; font-weight: 500; fill: #333; }
        .video-info { font-size: 12px; fill: #666; }
        .section-title { font-size: 16px; font-weight: 600; fill: #495057; }
      </style>
      
      <!-- 卡片背景 -->
      <rect width="540" height="280" fill="url(#cardBg)" rx="12" ry="12" 
            stroke="#e9ecef" stroke-width="1" filter="url(#shadow)"/>
      
      <!-- 头部区域 -->
      <rect x="0" y="0" width="540" height="80" fill="url(#headerBg)" rx="12" ry="12"/>
      <text x="270" y="30" text-anchor="middle" class="header-title">B站用户卡片</text>
      <text x="270" y="55" text-anchor="middle" fill="rgba(255,255,255,0.8)" 
            font-size="12">UID: ${userInfo.mid}</text>
      
      <!-- 用户信息 -->
      <g transform="translate(30, 100)">
        <!-- 头像 -->
        <image href="${userInfo.face}" x="0" y="0" width="80" height="80" 
               clip-path="url(#avatarClip)"/>
        <circle cx="40" cy="40" r="41" stroke="#00a1d6" stroke-width="2" fill="none"/>
        
        <!-- 用户名和等级 -->
        <text x="100" y="30" class="user-name">${userInfo.name}</text>
        <rect x="100" y="40" width="50" height="22" rx="6" ry="6" fill="#00a1d6"/>
        <text x="125" y="55" text-anchor="middle" class="user-level">LV${userInfo.level}</text>
        
        <!-- 签名 -->
        ${!hiddenItems.includes('signature') && userInfo.sign ? `
          <text x="100" y="80" class="signature" width="380">${truncateText(userInfo.sign, 35)}</text>
        ` : ''}
        
        <!-- 性别和其他信息 -->
        <g transform="translate(160, 40)">
          <rect width="100" height="22" rx="6" ry="6" fill="#f1f3f5"/>
          <text x="50" y="16" text-anchor="middle" font-size="12" fill="#495057">${userInfo.sex}</text>
        </g>
      </g>
      
      <!-- 统计信息 -->
      <g transform="translate(30, 200)">
        <text y="-5" class="section-title">📊 数据统计</text>
        
        ${!hiddenItems.includes('stats') ? `
          <g transform="translate(0, 25)">
            <!-- 这里可以添加更多的统计数据 -->
            <text x="0" y="0" class="stat-label">用户等级</text>
            <text x="0" y="20" class="stat-value">${userInfo.level}</text>
          </g>
        ` : ''}
      </g>
      
      <!-- 最新视频 -->
      ${!hiddenItems.includes('latest') && latestVideo ? `
        <g transform="translate(280, 200)">
          <text y="-5" class="section-title">🎬 最新视频</text>
          
          <g transform="translate(0, 25)">
            <rect width="240" height="60" fill="#f8f9fa" rx="6" ry="6" 
                  stroke="#dee2e6" stroke-width="1"/>
            
            <text x="10" y="20" class="video-title" width="220">
              ${truncateText(latestVideo.title, 28)}
            </text>
            
            <text x="10" y="40" class="video-info">
              播放: ${formatNumber(latestVideo.play_count)} | 
              时长: ${Math.floor(latestVideo.duration / 60)}:${(latestVideo.duration % 60).toString().padStart(2, '0')}
            </text>
            
            ${latestVideo.cover ? `
              <image href="${latestVideo.cover}" x="160" y="5" width="70" height="50" 
                     preserveAspectRatio="xMidYMid slice" opacity="0.8" rx="4" ry="4"/>
            ` : ''}
          </g>
        </g>
      ` : ''}
      
      <!-- 底部信息 -->
      <text x="270" y="270" text-anchor="middle" font-size="10" fill="#adb5bd">
        由 bili-card.lsqkk.space 生成 • ${new Date().toLocaleDateString('zh-CN')}
      </text>
    </svg>
  `;
}