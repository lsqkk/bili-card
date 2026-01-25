// api/card.js - 完整更新版（添加获赞数API调用）
const axios = require('axios');

// 在 CONFIG 中添加更完整的请求头配置
const CONFIG = {
  CACHE_TTL: 3600,
  TIMEOUT: 8000,
  // 更新 User-Agent 为更真实的浏览器标识
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  // 添加常用的请求头配置
  HEADERS: {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Connection': 'keep-alive',
    'DNT': '1',
    'Origin': 'https://www.bilibili.com',
    'Referer': 'https://www.bilibili.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"'
  }
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
  const { uid, theme = 'default' } = req.query;
  if (!uid || !/^\d+$/.test(uid)) {
    // 使用默认主题的错误SVG
    const { sendErrorSVG } = require('../lib/themes/default');
    return sendErrorSVG(res, 'ID_ERROR', 'Invalid UID');
  }

  try {
    // 动态加载所选主题
    let themeModule;
    try {
      themeModule = require(`../lib/themes/${theme}`);
    } catch (err) {
      // 如果主题不存在，使用默认主题
      themeModule = require('../lib/themes/default');
    }

    // 替换原来的多个API调用，使用 x/web-interface/card 接口
    const [cardRes, videoRes] = await Promise.allSettled([
      // 用户信息、关注数、粉丝数、获赞数（整合到一个接口）
      axios.get(`https://api.bilibili.com/x/web-interface/card?mid=${uid}`, {
        headers: {
          'User-Agent': CONFIG.USER_AGENT,
          'Referer': 'https://www.bilibili.com/'
        },
        timeout: CONFIG.TIMEOUT
      }),
      // 最新视频
      axios.get(`https://uapis.cn/api/v1/social/bilibili/archives?mid=${uid}&ps=1`, { timeout: CONFIG.TIMEOUT })
    ]);

    // 提取数据
    const cardData = cardRes.status === 'fulfilled' ? cardRes.value.data : {};
    const videoData = videoRes.status === 'fulfilled' ? videoRes.value.data?.videos?.[0] : null;

    // 构建数据对象
    const data = {
      name: esc(cardData.data?.card?.name || 'Unknown'),
      face: proxyImg(cardData.data?.card?.face),
      level: cardData.data?.card?.level_info?.current_level || 0,
      sign: esc(cardData.data?.card?.sign || '这个人很懒，什么都没有写...'),
      follower: cardData.data?.follower || 0,
      following: cardData.data?.card?.attention || 0,
      like: cardData.data?.like_num || 0,  // 获赞数
      video: videoData ? {
        title: esc(videoData.title),
        play: videoData.play_count || 0,
        cover: proxyImg(videoData.cover || videoData.pic),
      } : null
    };

    // 生成SVG
    const svg = themeModule.generateSVG(data, theme.includes('dark') ? 'dark' : 'light');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
    res.send(svg);
  } catch (err) {
    const { sendErrorSVG } = require('../lib/themes/default');
    sendErrorSVG(res, 'FETCH_ERROR', 'API Request Failed');
  }
};