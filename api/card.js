// api/card.js - 完整更新版（添加获赞数API调用）
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

    // 并行获取所有API数据
    const [userRes, relationRes, videoRes, upstatRes] = await Promise.allSettled([
      // 用户基本信息
      axios.get(`https://uapis.cn/api/v1/social/bilibili/userinfo?uid=${uid}`, { timeout: CONFIG.TIMEOUT }),
      // 关注/粉丝数
      axios.get(`https://api.bilibili.com/x/relation/stat?vmid=${uid}`, {
        headers: { 'User-Agent': CONFIG.USER_AGENT, 'Referer': 'https://www.bilibili.com/' },
        timeout: CONFIG.TIMEOUT
      }),
      // 最新视频
      axios.get(`https://uapis.cn/api/v1/social/bilibili/archives?mid=${uid}&ps=1`, { timeout: CONFIG.TIMEOUT }),
      // 获赞数（B站官方API）
      axios.get(`https://api.bilibili.com/x/space/upstat?mid=${uid}`, {
        headers: { 'User-Agent': CONFIG.USER_AGENT, 'Referer': 'https://www.bilibili.com/' },
        timeout: CONFIG.TIMEOUT
      })
    ]);

    // 提取用户数据
    const userData = userRes.status === 'fulfilled' ? userRes.value.data : {};
    const relationData = relationRes.status === 'fulfilled' ? relationRes.value.data.data : {};
    const videoData = videoRes.status === 'fulfilled' ? videoRes.value.data?.videos?.[0] : null;

    // 提取获赞数数据 - 根据实际返回结构调整
    let likeCount = 0;
    if (upstatRes.status === 'fulfilled') {
      const upstatData = upstatRes.value.data;
      if (upstatData.code === 0) {
        // 根据实际返回结构，获赞数在 data.likes 中
        likeCount = upstatData.data?.likes || 0;
      }
    }

    // 构建数据对象
    const data = {
      name: esc(userData.name || 'Unknown'),
      face: proxyImg(userData.face),
      level: userData.level || 0,
      sign: esc(userData.sign || '这个人很懒，什么都没有写...'),
      follower: relationData?.follower || 0,
      following: relationData?.following || 0,
      like: likeCount, // 添加获赞数
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