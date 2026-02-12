// api/card.js - 支持图片Base64内嵌
const { sendErrorSVG } = require('../lib/utils/errors');
const imageCache = new Map();
const axios = require('axios');
const COMMENTS = require('../lib/utils/comments');

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


const proxyImageUrl = (url) => {
  if (!url) return '';

  // 如果是B站图片，使用代理
  if (url.includes('hdslb.com') || url.includes('bilivideo.com') || url.includes('bilibili.com')) {
    // 使用第三方图片代理服务
    const encodedUrl = encodeURIComponent(url);
    return `https://images.weserv.nl/?url=${encodedUrl}&w=400&h=225&output=webp&q=80`;
  }

  return url;
};

// 修改 fetchImageToBase64 函数，添加代理
const fetchImageToBase64 = async (url) => {
  if (!url || !url.startsWith('http')) return '';

  // 使用代理后的URL
  const proxiedUrl = proxyImageUrl(url);

  // 检查缓存
  const cacheKey = url; // 使用原始URL作为缓存键
  const cacheEntry = imageCache.get(cacheKey);
  if (cacheEntry && Date.now() - cacheEntry.timestamp < 30 * 60 * 1000) { // 30分钟缓存
    return cacheEntry.base64;
  }

  try {
    const response = await axios.get(proxiedUrl, {
      responseType: 'arraybuffer',
      timeout: 5000,
      headers: {
        'User-Agent': CONFIG.USER_AGENT,
        'Accept': 'image/webp,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        // 注意：代理服务可能不需要Referer，所以这里可以移除或修改
      }
    });

    // 获取图片格式
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    // 存入缓存
    imageCache.set(cacheKey, {
      base64: dataUrl,
      timestamp: Date.now()
    });

    return dataUrl;
  } catch (error) {
    console.warn(`Failed to fetch image: ${url} (proxied: ${proxiedUrl})`, error.message);

    // 尝试使用原始URL作为备选方案
    if (proxiedUrl !== url) {
      try {
        const fallbackResponse = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 3000,
          headers: {
            'User-Agent': CONFIG.USER_AGENT,
            'Referer': 'https://www.bilibili.com/',
            'Origin': 'https://www.bilibili.com'
          }
        });

        const contentType = fallbackResponse.headers['content-type'] || 'image/jpeg';
        const base64 = Buffer.from(fallbackResponse.data, 'binary').toString('base64');
        const dataUrl = `data:${contentType};base64,${base64}`;

        imageCache.set(cacheKey, {
          base64: dataUrl,
          timestamp: Date.now()
        });

        return dataUrl;
      } catch (fallbackError) {
        console.warn(`Fallback also failed for image: ${url}`, fallbackError.message);
      }
    }

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
  const { uid, theme = 'default', color = 'white' } = req.query;
  if (!uid || !/^\d+$/.test(uid)) {
    return sendErrorSVG(res, 'ID_ERROR', 'Invalid UID'); // 直接使用导入的函数
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
      colorScheme = require('../lib/colors/white');
    }

    // 获取用户数据
    // 修改视频数据API请求和处理
    const [cardRes, videoRes] = await Promise.allSettled([
      axios.get(`https://api.bilibili.com/x/web-interface/card?mid=${uid}`, {
        headers: {
          'User-Agent': CONFIG.USER_AGENT,
          'Referer': 'https://www.bilibili.com/'
        },
        timeout: CONFIG.TIMEOUT
      }),
      // 替换为B站置顶视频API
      axios.get(`https://api.bilibili.com/x/space/top/arc?vmid=${uid}`, {
        headers: {
          'User-Agent': CONFIG.USER_AGENT,
          'Referer': 'https://www.bilibili.com/'
        },
        timeout: CONFIG.TIMEOUT
      })
    ]);

    const cardData = cardRes.status === 'fulfilled' ? cardRes.value.data : {};
    let videoData = null;


    // 处理置顶视频响应
    if (videoRes.status === 'fulfilled' && videoRes.value.data?.code === 0) {
      const topArc = videoRes.value.data.data;
      if (topArc) {
        videoData = {
          title: esc(topArc.title || ''),
          cover: topArc.pic || '',
          play: topArc.stat?.view || 0,      // 播放数（原play字段）
          coin: topArc.stat?.coin || 0,      // 硬币数
          share: topArc.stat?.share || 0,    // 分享数
          like: topArc.stat?.like || 0,      // 点赞数
          bvid: topArc.bvid || '',           // 可选：视频BV号
          pubdate: topArc.pubdate || 0       // 可选：发布时间
        };
      }
    }

    // 并行下载所有图片到Base64
    const imagePromises = [];

    // 头像
    const faceUrl = cardData.data?.card?.face;
    if (faceUrl) {
      imagePromises.push(fetchImageToBase64(faceUrl).then(base64 => ({ type: 'face', base64 })));
    }

    // 视频封面
    let videoCoverBase64 = '';

    if (videoData && videoData.cover) {
      imagePromises.push(
        fetchImageToBase64(videoData.cover).then(base64 => ({
          type: 'videoCover',
          base64
        }))
      );
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
      face: images.face,
      level: level,
      sign: esc(cardData.data?.card?.sign || '这个人很懒，什么都没有写...'),
      follower: cardData.data?.follower || 0,
      following: cardData.data?.card?.attention || 0,
      like: cardData.data?.like_num || 0,
      video: videoData, // 直接使用处理好的视频对象（含coin/share/like等）
      levelIcon: images.levelIcon
    };

    // 生成SVG，传递颜色方案
    const svgContent = themeModule.generateSVG(data, colorScheme.palette);

    // 统一添加注释
    const svg = `${COMMENTS.banner}
${svgContent}`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}`);
    res.send(svg);
  } catch (err) {
    console.error('Card generation error:', err);
    sendErrorSVG(res, 'FETCH_ERROR', 'API Request Failed');
  }
};