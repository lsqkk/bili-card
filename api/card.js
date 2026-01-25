// api/card.js - 支持图片Base64内嵌
const axios = require('axios');

const CONFIG = {
  CACHE_TTL: 3600,
  TIMEOUT: 15000, // 增加超时时间，因为要下载图片
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const esc = (str) => {
  if (!str) return '';
  return str.toString().replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[m]));
};

// 下载图片并转换为Base64
const fetchImageToBase64 = async (url) => {
  if (!url || !url.startsWith('http')) return '';

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 5000,
      headers: {
        'User-Agent': CONFIG.USER_AGENT,
        'Referer': 'https://www.bilibili.com/'
      }
    });

    // 获取图片格式
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.warn(`Failed to fetch image: ${url}`, error.message);
    return ''; // 返回空字符串，让前端显示默认样式
  }
};

// 获取等级图标的Base64（从CDN下载）
const fetchLevelIcon = async (level) => {
  if (level < 0 || level > 6) return '';

  try {
    const levelSuffix = level === 6 ? '_Lightning' : '';
    const url = `https://cdn.jsdelivr.net/gh/lsqkk/bili-card/assets/LV${level}${levelSuffix}.svg`;

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 5000
    });

    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  } catch (error) {
    console.warn(`Failed to fetch level icon for level ${level}`, error.message);
    return '';
  }
};

module.exports = async (req, res) => {
  const { uid, theme = 'default', color = 'blue' } = req.query;
  if (!uid || !/^\d+$/.test(uid)) {
    const { sendErrorSVG } = require('../lib/themes/default');
    return sendErrorSVG(res, 'ID_ERROR', 'Invalid UID');
  }

  try {
    // 动态加载主题模板
    let themeModule;
    try {
      themeModule = require(`../lib/themes/${theme}`);
    } catch (err) {
      themeModule = require('../lib/themes/default');
    }

    // 动态加载颜色方案
    let colorScheme;
    try {
      colorScheme = require(`../lib/colors/${color}`);
    } catch (err) {
      colorScheme = require('../lib/colors/blue');
    }

    // 获取用户数据
    const [cardRes, videoRes] = await Promise.allSettled([
      axios.get(`https://api.bilibili.com/x/web-interface/card?mid=${uid}`, {
        headers: {
          'User-Agent': CONFIG.USER_AGENT,
          'Referer': 'https://www.bilibili.com/'
        },
        timeout: CONFIG.TIMEOUT
      }),
      axios.get(`https://uapis.cn/api/v1/social/bilibili/archives?mid=${uid}&ps=1`, {
        timeout: CONFIG.TIMEOUT
      })
    ]);

    const cardData = cardRes.status === 'fulfilled' ? cardRes.value.data : {};
    const videoData = videoRes.status === 'fulfilled' ? videoRes.value.data?.videos?.[0] : null;

    // 并行下载所有图片到Base64
    const imagePromises = [];

    // 头像
    const faceUrl = cardData.data?.card?.face;
    if (faceUrl) {
      imagePromises.push(fetchImageToBase64(faceUrl).then(base64 => ({ type: 'face', base64 })));
    }

    // 视频封面
    let videoCoverBase64 = '';
    if (videoData) {
      const coverUrl = videoData.cover || videoData.pic;
      if (coverUrl) {
        imagePromises.push(fetchImageToBase64(coverUrl).then(base64 => ({ type: 'videoCover', base64 })));
      }
    }

    // 等级图标
    const level = cardData.data?.card?.level_info?.current_level || 0;
    if (level >= 0 && level <= 6) {
      imagePromises.push(fetchLevelIcon(level).then(base64 => ({ type: 'levelIcon', base64 })));
    }

    // 等待所有图片下载完成
    const imageResults = await Promise.allSettled(imagePromises);

    // 提取Base64数据
    const images = {
      face: '',
      videoCover: '',
      levelIcon: ''
    };

    imageResults.forEach(result => {
      if (result.status === 'fulfilled') {
        images[result.value.type] = result.value.base64;
      }
    });

    // 构建数据对象
    const data = {
      name: esc(cardData.data?.card?.name || 'Unknown'),
      face: images.face, // 使用Base64
      level: level,
      sign: esc(cardData.data?.card?.sign || '这个人很懒，什么都没有写...'),
      follower: cardData.data?.follower || 0,
      following: cardData.data?.card?.attention || 0,
      like: cardData.data?.like_num || 0,
      video: videoData ? {
        title: esc(videoData.title),
        play: videoData.play_count || 0,
        cover: images.videoCover || '', // 使用Base64
      } : null,
      // 添加等级图标的Base64
      levelIcon: images.levelIcon
    };

    // 生成SVG，传递颜色方案
    const svg = themeModule.generateSVG(data, colorScheme.palette);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
    res.send(svg);
  } catch (err) {
    console.error('Card generation error:', err);
    const { sendErrorSVG } = require('../lib/themes/default');
    sendErrorSVG(res, 'FETCH_ERROR', 'API Request Failed');
  }
};