// api/card.js - 优化版：解决图片403和UI问题
const axios = require('axios');

module.exports = async (req, res) => {
  console.log('=== Bili-Card API 调用开始 ===');

  try {
    const { uid, hide = '' } = req.query;

    // 验证UID
    if (!uid || !/^\d{3,10}$/.test(uid)) {
      return sendErrorSVG('无效的UID', '请提供有效的B站UID（纯数字）');
    }

    console.log(`处理UID: ${uid}`);

    // 并行获取数据
    const [userInfo, videosData, relationData] = await Promise.allSettled([
      getUserInfo(uid),
      getVideosData(uid),
      getRelationData(uid)
    ]);

    // 检查用户数据
    if (userInfo.status !== 'fulfilled' || !userInfo.value.success) {
      return sendErrorSVG('用户数据获取失败', '请确认UID正确且用户存在');
    }

    const user = userInfo.value.data;
    console.log(`获取用户: ${user.name}, 等级: ${user.level}`);

    // 构建卡片数据
    const cardData = {
      user: {
        name: user.name,
        avatar: fixImageUrl(user.face),
        level: user.level,
        sign: user.sign,
        gender: user.sex
      },
      stats: {
        followers: relationData.status === 'fulfilled' && relationData.value.success
          ? relationData.value.data.followers
          : 0,
        following: relationData.status === 'fulfilled' && relationData.value.success
          ? relationData.value.data.following
          : 0,
        videos: videosData.status === 'fulfilled' && videosData.value.success
          ? videosData.value.total
          : 0
      },
      videos: {
        latest: videosData.status === 'fulfilled' && videosData.value.success
          ? videosData.value.latest
          : null,
        popular: videosData.status === 'fulfilled' && videosData.value.success
          ? videosData.value.popular
          : null
      }
    };

    // 解析隐藏选项
    const hiddenItems = hide.split(',').map(item => item.trim().toLowerCase());
    const options = {
      showSign: !hiddenItems.includes('signature'),
      showLatest: !hiddenItems.includes('latest'),
      showPopular: !hiddenItems.includes('popular'),
      showStats: !hiddenItems.includes('stats')
    };

    // 生成SVG
    const svg = generateCardSVG(cardData, options);

    // 返回响应
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);

    console.log('=== 请求处理完成 ===');

  } catch (error) {
    console.error('处理错误:', error.message);
    return sendErrorSVG('服务器错误', '请稍后重试');
  }

  // 返回SVG响应的辅助函数
  function sendErrorSVG(title, message) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="540" height="180" viewBox="0 0 540 180">
        <rect width="100%" height="100%" fill="#f8f9fa" rx="8"/>
        <text x="270" y="80" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" 
              font-size="18" fill="#dc3545" font-weight="500">${title}</text>
        <text x="270" y="110" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" 
              font-size="14" fill="#6c757d">${message}</text>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(400).send(svg);
  }
};

// ==================== API 函数 ====================

/**
 * 修复图片URL - 解决403问题
 * 将B站图片URL转换为可访问的CDN地址
 */
function fixImageUrl(url) {
  if (!url) return '';

  // 替换为B站官方可访问的图片CDN
  return url
    .replace('http://i0.hdslb.com', 'https://i0.hdslb.com')
    .replace('http://i1.hdslb.com', 'https://i1.hdslb.com')
    .replace('http://i2.hdslb.com', 'https://i2.hdslb.com')
    .replace(/^http:/, 'https:');
}

/**
 * 获取用户信息
 */
async function getUserInfo(uid) {
  try {
    const response = await axios.get('https://uapis.cn/api/v1/social/bilibili/userinfo', {
      params: { uid },
      timeout: 10000
    });

    if (response.data && response.data.mid) {
      return {
        success: true,
        data: {
          name: response.data.name,
          face: response.data.face,
          level: response.data.level,
          sign: response.data.sign || '这个人很懒，什么都没有写',
          sex: response.data.sex,
          mid: response.data.mid
        }
      };
    }
  } catch (error) {
    console.error('获取用户信息失败:', error.message);
  }

  return { success: false, error: '用户信息获取失败' };
}

/**
 * 获取视频数据
 */
async function getVideosData(uid) {
  try {
    // 获取最新视频
    const latestRes = await axios.get('https://uapis.cn/api/v1/social/bilibili/archives', {
      params: { mid: uid, orderby: 'pubdate', ps: 1, pn: 1 },
      timeout: 10000
    });

    // 获取最热视频
    const popularRes = await axios.get('https://uapis.cn/api/v1/social/bilibili/archives', {
      params: { mid: uid, orderby: 'views', ps: 1, pn: 1 },
      timeout: 10000
    });

    const latest = latestRes.data?.videos?.[0] || null;
    const popular = popularRes.data?.videos?.[0] || null;

    return {
      success: true,
      total: latestRes.data?.total || popularRes.data?.total || 0,
      latest: latest ? {
        title: latest.title,
        cover: fixImageUrl(latest.cover),
        play: latest.play_count,
        duration: latest.duration,
        bvid: latest.bvid
      } : null,
      popular: popular ? {
        title: popular.title,
        cover: fixImageUrl(popular.cover),
        play: popular.play_count,
        duration: popular.duration,
        bvid: popular.bvid
      } : null
    };

  } catch (error) {
    console.error('获取视频数据失败:', error.message);
    return { success: false, error: '视频数据获取失败' };
  }
}

/**
 * 获取关系数据（粉丝数/关注数）
 */
async function getRelationData(uid) {
  try {
    const response = await axios.get('https://api.bilibili.com/x/relation/stat', {
      params: { vmid: uid },
      timeout: 10000
    });

    if (response.data.code === 0) {
      return {
        success: true,
        data: {
          followers: response.data.data.follower || 0,
          following: response.data.data.following || 0
        }
      };
    }
  } catch (error) {
    console.error('获取关系数据失败:', error.message);
  }

  return { success: false, error: '关系数据获取失败' };
}

// ==================== SVG 生成函数 ====================

/**
 * 生成卡片SVG
 */
function generateCardSVG(data, options) {
  const { user, stats, videos } = data;
  const { showSign, showLatest, showPopular, showStats } = options;

  // 工具函数
  const formatNumber = (num) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return num.toString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const truncateText = (text, max) => {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  };

  // 计算卡片高度
  let cardHeight = 200; // 基础高度
  if (showSign) cardHeight += 30;
  if (showLatest || showPopular) cardHeight += 90;
  if (showStats) cardHeight += 40;

  // 主SVG结构
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="${cardHeight}" viewBox="0 0 600 ${cardHeight}">
      <defs>
        <clipPath id="avatarClip">
          <circle cx="60" cy="60" r="55"/>
        </clipPath>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.12)"/>
        </filter>
        <linearGradient id="levelBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00a1d6"/>
          <stop offset="100%" stop-color="#0092c7"/>
        </linearGradient>
      </defs>
      
      <style>
        .card-bg { fill: #ffffff; }
        .username { font: 600 26px 'Segoe UI', 'Microsoft YaHei', system-ui, sans-serif; fill: #18191c; }
        .signature { font: 14px 'Segoe UI', 'Microsoft YaHei', system-ui, sans-serif; fill: #61666d; }
        .stat-value { font: 700 22px 'Segoe UI', system-ui, sans-serif; fill: #00a1d6; }
        .stat-label { font: 12px 'Segoe UI', system-ui, sans-serif; fill: #9499a0; letter-spacing: 0.5px; }
        .video-title { font: 500 15px 'Segoe UI', 'Microsoft YaHei', system-ui, sans-serif; fill: #18191c; }
        .video-meta { font: 12px 'Segoe UI', system-ui, sans-serif; fill: #61666d; }
        .gender-male { fill: #00a1d6; }
        .gender-female { fill: #fb7299; }
        .gender-secret { fill: #9499a0; }
      </style>
      
      <!-- 卡片背景 -->
      <rect width="600" height="${cardHeight}" rx="12" class="card-bg" filter="url(#shadow)"/>
      <rect x="1" y="1" width="598" height="${cardHeight - 2}" rx="11" fill="none" stroke="#f1f2f3" stroke-width="1"/>
      
      <!-- 用户头像 -->
      <g transform="translate(30, 30)">
        <image href="${user.avatar}" x="0" y="0" width="110" height="110" clip-path="url(#avatarClip)"/>
        <circle cx="55" cy="55" r="56" fill="none" stroke="#e3e5e7" stroke-width="2"/>
        
        <!-- 等级徽章 -->
        <g transform="translate(85, 85)">
          <circle r="18" fill="url(#levelBg)"/>
          <text text-anchor="middle" dy="5" font-size="12" font-weight="600" fill="white">${user.level}</text>
        </g>
      </g>
      
      <!-- 用户信息 -->
      <g transform="translate(160, 35)">
        <!-- 用户名和性别 -->
        <text class="username">${user.name}</text>
        <g transform="translate(${user.name.length * 16 + 15}, 5)">
          <svg width="20" height="20" viewBox="0 0 20 20">
            ${user.gender === '男' ?
      '<path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm3-9c0-1.7-1.3-3-3-3s-3 1.3-3 3 1.3 3 3 3 3-1.3 3-3zm-3 1c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" class="gender-male"/>' :
      user.gender === '女' ?
        '<path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm3-9c0-1.7-1.3-3-3-3s-3 1.3-3 3 1.3 3 3 3 3-1.3 3-3zm-3 1c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" class="gender-female"/>' :
        '<circle cx="10" cy="10" r="8" class="gender-secret"/>'
    }
          </svg>
        </g>
        
        <!-- 签名 -->
        ${showSign ? `
          <text y="45" class="signature">${truncateText(user.sign, 36)}</text>
        ` : ''}
      </g>
      
      <!-- 统计数据 -->
      ${showStats ? `
        <g transform="translate(30, 160)">
          <g transform="translate(0, 0)">
            <text class="stat-value">${formatNumber(stats.followers)}</text>
            <text y="25" class="stat-label">粉丝</text>
          </g>
          
          <g transform="translate(100, 0)">
            <text class="stat-value">${formatNumber(stats.following)}</text>
            <text y="25" class="stat-label">关注</text>
          </g>
          
          <g transform="translate(200, 0)">
            <text class="stat-value">${formatNumber(stats.videos)}</text>
            <text y="25" class="stat-label">视频</text>
          </g>
        </g>
      ` : ''}
      
      <!-- 最新视频 -->
      ${showLatest && videos.latest ? `
        <g transform="translate(30, ${showStats ? 220 : 180})">
          <rect width="260" height="80" rx="8" fill="#f8f9fa" stroke="#e9ecef" stroke-width="1"/>
          <g transform="translate(15, 15)">
            <text class="video-title" width="230">${truncateText(videos.latest.title, 32)}</text>
            <text y="25" class="video-meta">播放 ${formatNumber(videos.latest.play)} · 时长 ${formatDuration(videos.latest.duration)}</text>
            <text y="45" class="video-meta" font-size="11" fill="#00a1d6">最新发布</text>
            ${videos.latest.cover ? `
              <image href="${videos.latest.cover}" x="180" y="-5" width="70" height="55" preserveAspectRatio="xMidYMid slice" opacity="0.95" rx="4"/>
            ` : ''}
          </g>
        </g>
      ` : ''}
      
      <!-- 最热视频 -->
      ${showPopular && videos.popular ? `
        <g transform="translate(${showLatest ? 310 : 30}, ${showStats ? 220 : 180})">
          <rect width="260" height="80" rx="8" fill="#f8f9fa" stroke="#e9ecef" stroke-width="1"/>
          <g transform="translate(15, 15)">
            <text class="video-title" width="230">${truncateText(videos.popular.title, 32)}</text>
            <text y="25" class="video-meta">播放 ${formatNumber(videos.popular.play)} · 时长 ${formatDuration(videos.popular.duration)}</text>
            <text y="45" class="video-meta" font-size="11" fill="#ff6b35">最受欢迎</text>
            ${videos.popular.cover ? `
              <image href="${videos.popular.cover}" x="180" y="-5" width="70" height="55" preserveAspectRatio="xMidYMid slice" opacity="0.95" rx="4"/>
            ` : ''}
          </g>
        </g>
      ` : ''}
      
      <!-- 底部信息 -->
      <text x="300" y="${cardHeight - 15}" text-anchor="middle" font-size="11" fill="#adb5bd" font-family="system-ui, sans-serif">
        bili-card.lsqkk.space · ${new Date().toLocaleDateString('zh-CN')}
      </text>
    </svg>
  `;
}