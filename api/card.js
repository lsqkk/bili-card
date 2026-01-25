// api/card.js - 重构版（支持模板和颜色分离）
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

// 移除proxyImg函数，直接使用原始链接
// 因为GitHub的camo代理会处理外部图片

module.exports = async (req, res) => {
  const { uid, theme = 'default', color = 'blue' } = req.query;
  if (!uid || !/^\d+$/.test(uid)) {
    // 使用默认主题的错误SVG
    const { sendErrorSVG } = require('../lib/themes/default');
    return sendErrorSVG(res, 'ID_ERROR', 'Invalid UID');
  }

  try {
    // 动态加载主题模板
    let themeModule;
    try {
      themeModule = require(`../lib/themes/${theme}`);
    } catch (err) {
      // 如果主题不存在，使用默认主题
      themeModule = require('../lib/themes/default');
    }

    // 动态加载颜色方案
    let colorScheme;
    try {
      colorScheme = require(`../lib/colors/${color}`);
    } catch (err) {
      // 如果颜色不存在，使用默认蓝色
      colorScheme = require('../lib/colors/blue');
    }

    // 获取数据
    const [cardRes, videoRes] = await Promise.allSettled([
      axios.get(`https://api.bilibili.com/x/web-interface/card?mid=${uid}`, {
        headers: {
          'User-Agent': CONFIG.USER_AGENT,
          'Referer': 'https://www.bilibili.com/'
        },
        timeout: CONFIG.TIMEOUT
      }),
      axios.get(`https://uapis.cn/api/v1/social/bilibili/archives?mid=${uid}&ps=1`, { timeout: CONFIG.TIMEOUT })
    ]);

    const cardData = cardRes.status === 'fulfilled' ? cardRes.value.data : {};
    const videoData = videoRes.status === 'fulfilled' ? videoRes.value.data?.videos?.[0] : null;

    const data = {
      name: esc(cardData.data?.card?.name || 'Unknown'),
      // 直接使用原始头像链接
      face: cardData.data?.card?.face || '',
      level: cardData.data?.card?.level_info?.current_level || 0,
      sign: esc(cardData.data?.card?.sign || '这个人很懒，什么都没有写...'),
      follower: cardData.data?.follower || 0,
      following: cardData.data?.card?.attention || 0,
      like: cardData.data?.like_num || 0,
      video: videoData ? {
        title: esc(videoData.title),
        play: videoData.play_count || 0,
        // 直接使用原始封面链接
        cover: videoData.cover || videoData.pic || '',
      } : null
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