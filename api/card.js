// api/card.js - 更新版（支持主题选择）
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
    const [userRes, relationRes, videoRes, upStatRes] = await Promise.allSettled([
      axios.get(`https://uapis.cn/api/v1/social/bilibili/userinfo?uid=${uid}`, { timeout: CONFIG.TIMEOUT }),
      axios.get(`https://api.bilibili.com/x/relation/stat?vmid=${uid}`, {
        headers: { 'User-Agent': CONFIG.USER_AGENT, 'Referer': 'https://www.bilibili.com/' },
        timeout: CONFIG.TIMEOUT
      }),
      axios.get(`https://uapis.cn/api/v1/social/bilibili/archives?mid=${uid}&ps=1`, { timeout: CONFIG.TIMEOUT }),
      // 新增：获取用户空间统计信息（包含获赞数）
      axios.get(`https://api.bilibili.com/x/space/upstat?mid=${uid}`, {
        headers: { 'User-Agent': CONFIG.USER_AGENT, 'Referer': 'https://www.bilibili.com/' },
        timeout: CONFIG.TIMEOUT
      })
    ]);

    const userData = userRes.status === 'fulfilled' ? userRes.value.data : {};
    const relationData = relationRes.status === 'fulfilled' ? relationRes.value.data.data : {};
    const videoData = videoRes.status === 'fulfilled' ? videoRes.value.data?.videos?.[0] : null;
    const upStatData = upStatRes.status === 'fulfilled' ? upStatRes.value.data.data : {};

    const data = {
      name: esc(userData.name || 'Unknown'),
      face: proxyImg(userData.face),
      level: userData.level || 0,
      sign: esc(userData.sign || '这个人很懒，什么都没有写...'),
      follower: relationData?.follower || 0,
      following: relationData?.following || 0,
      likes: upStatData?.likes || 0, // 新增：获赞数
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