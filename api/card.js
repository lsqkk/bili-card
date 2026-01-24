// api/card.js - 最终完美版
const axios = require('axios');

// 配置
const CONFIG = {
    CACHE_TTL: 3600, // 缓存时间（秒）
    TIMEOUT: 8000,   // API超时时间（毫秒）
    RETRY_ATTEMPTS: 2, // 重试次数
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// 内存缓存（生产环境建议使用Redis）
const cache = new Map();

module.exports = async (req, res) => {
    const startTime = Date.now();

    try {
        // 解析参数
        const {
            uid,
            theme = 'default',
            hide = '',
            cache: cacheParam = 'true',
            debug = 'false'
        } = req.query;

        const showDebug = debug === 'true';
        const useCache = cacheParam !== 'false';

        // 验证UID
        if (!uid || !/^\d{2,10}$/.test(uid)) {
            return sendErrorSVG(res, 'UID格式错误', '请提供有效的B站UID（2-10位数字）');
        }

        // 缓存键
        const cacheKey = `bili_${uid}_${theme}_${hide}`;

        // 检查缓存
        if (useCache) {
            const cached = getCachedSVG(cacheKey);
            if (cached) {
                console.log(`[缓存命中] UID: ${uid}`);
                return sendSVGResponse(res, cached, true);
            }
        }

        console.log(`[开始处理] UID: ${uid}, 主题: ${theme}`);

        // 并行获取所有数据
        const [userData, relationData, videoData] = await Promise.allSettled([
            fetchUserInfo(uid),
            fetchRelationInfo(uid),
            fetchVideoInfo(uid)
        ]);

        // 检查用户数据是否成功
        if (userData.status === 'rejected' || !userData.value.success) {
            const errorMsg = userData.status === 'rejected'
                ? userData.reason?.message || '用户信息获取失败'
                : userData.value.error || '用户信息获取失败';

            console.error(`用户数据获取失败: ${errorMsg}`);
            return sendErrorSVG(res, '用户信息获取失败', '请确认UID正确且用户存在');
        }

        const userInfo = userData.value.data;
        console.log(`用户信息获取成功: ${userInfo.name} (Lv${userInfo.level})`);

        // 构建数据对象
        const cardData = {
            user: userInfo,
            stats: {
                // 粉丝数和关注数从relationAPI获取，如果失败则显示为0
                followers: relationData.status === 'fulfilled' && relationData.value.success
                    ? relationData.value.data.follower
                    : 0,
                following: relationData.status === 'fulfilled' && relationData.value.success
                    ? relationData.value.data.following
                    : 0,
                // 投稿总数从videoAPI获取
                totalVideos: videoData.status === 'fulfilled' && videoData.value.success
                    ? videoData.value.total
                    : 0
            },
            videos: {
                latest: videoData.status === 'fulfilled' && videoData.value.success
                    ? videoData.value.videos?.find(v => v.orderby === 'pubdate') || null
                    : null,
                popular: videoData.status === 'fulfilled' && videoData.value.success
                    ? videoData.value.videos?.find(v => v.orderby === 'views') || null
                    : null
            },
            meta: {
                uid,
                generatedAt: new Date().toISOString(),
                processingTime: Date.now() - startTime
            }
        };

        // 解析隐藏选项
        const hiddenItems = hide.split(',').map(item => item.trim().toLowerCase());
        const displayOptions = {
            showSignature: !hiddenItems.includes('signature'),
            showLatestVideo: !hiddenItems.includes('latest'),
            showPopularVideo: !hiddenItems.includes('popular'),
            showStats: !hiddenItems.includes('stats'),
            showFollowers: !hiddenItems.includes('followers')
        };

        // 生成SVG
        const svg = generateSVGCard(cardData, { theme, ...displayOptions }, showDebug);

        // 保存到缓存
        if (useCache) {
            setCachedSVG(cacheKey, svg, CONFIG.CACHE_TTL);
        }

        // 发送响应
        console.log(`[处理完成] UID: ${uid}, 耗时: ${cardData.meta.processingTime}ms`);
        return sendSVGResponse(res, svg, false);

    } catch (error) {
        console.error('[致命错误]', {
            name: error.name,
            message: error.message,
            stack: error.stack?.split('\n')[0]
        });

        return sendErrorSVG(
            res,
            '服务器内部错误',
            '请稍后重试或联系管理员<br/>' + (debug === 'true' ? error.message : '')
        );
    }
};

// ==================== API 函数 ====================

/**
 * 获取用户信息（主用：uapis.cn）
 */
async function fetchUserInfo(uid) {
    const urls = [
        `https://uapis.cn/api/v1/social/bilibili/userinfo?uid=${uid}`,
        // 备用API（如果主用失败）
        `https://api.bilibili.com/x/space/acc/info?mid=${uid}`
    ];

    for (let i = 0; i < CONFIG.RETRY_ATTEMPTS; i++) {
        for (const url of urls) {
            try {
                console.log(`[API请求] ${url}`);
                const response = await axios.get(url, {
                    timeout: CONFIG.TIMEOUT,
                    headers: { 'User-Agent': CONFIG.USER_AGENT }
                });

                // 处理不同API的响应格式
                if (url.includes('uapis.cn')) {
                    // uapis.cn 直接返回用户数据，没有嵌套的data字段
                    if (response.data && response.data.mid) {
                        return {
                            success: true,
                            data: {
                                mid: response.data.mid,
                                name: response.data.name,
                                face: response.data.face,
                                level: response.data.level,
                                sex: response.data.sex,
                                sign: response.data.sign || '暂无签名'
                            }
                        };
                    }
                } else {
                    // B站官方API格式：{ code: 0, data: {...} }
                    if (response.data.code === 0 && response.data.data) {
                        const data = response.data.data;
                        return {
                            success: true,
                            data: {
                                mid: data.mid,
                                name: data.name,
                                face: data.face,
                                level: data.level,
                                sex: data.sex,
                                sign: data.sign || '暂无签名'
                            }
                        };
                    }
                }
            } catch (error) {
                console.warn(`[API失败] ${url}: ${error.message}`);
                // 继续尝试下一个API
            }
        }

        // 如果所有URL都失败，等待后重试
        if (i < CONFIG.RETRY_ATTEMPTS - 1) {
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        }
    }

    return { success: false, error: '所有用户API请求失败' };
}

/**
 * 获取关系数据（粉丝数/关注数）
 */
async function fetchRelationInfo(uid) {
    try {
        const response = await axios.get(
            'https://api.bilibili.com/x/relation/stat',
            {
                params: { vmid: uid },
                timeout: CONFIG.TIMEOUT
            }
        );

        if (response.data.code === 0 && response.data.data) {
            return {
                success: true,
                data: {
                    follower: response.data.data.follower || 0,
                    following: response.data.data.following || 0
                }
            };
        }
    } catch (error) {
        console.warn(`[关系API失败] ${error.message}`);
    }

    return { success: false, error: '关系数据获取失败' };
}

/**
 * 获取视频信息
 */
async function fetchVideoInfo(uid) {
    try {
        // 并行获取最新和最热视频
        const [latestResponse, popularResponse] = await Promise.all([
            axios.get('https://uapis.cn/api/v1/social/bilibili/archives', {
                params: { mid: uid, orderby: 'pubdate', ps: 1, pn: 1 },
                timeout: CONFIG.TIMEOUT
            }),
            axios.get('https://uapis.cn/api/v1/social/bilibili/archives', {
                params: { mid: uid, orderby: 'views', ps: 1, pn: 1 },
                timeout: CONFIG.TIMEOUT
            })
        ]);

        const videos = [];

        if (latestResponse.data && latestResponse.data.videos && latestResponse.data.videos.length > 0) {
            videos.push({
                ...latestResponse.data.videos[0],
                orderby: 'pubdate'
            });
        }

        if (popularResponse.data && popularResponse.data.videos && popularResponse.data.videos.length > 0) {
            videos.push({
                ...popularResponse.data.videos[0],
                orderby: 'views'
            });
        }

        return {
            success: true,
            total: latestResponse.data?.total || popularResponse.data?.total || 0,
            videos
        };

    } catch (error) {
        console.warn(`[视频API失败] ${error.message}`);
        return { success: false, error: '视频数据获取失败' };
    }
}

// ==================== SVG 生成函数 ====================

/**
 * 生成SVG卡片
 */
function generateSVGCard(data, options, showDebug = false) {
    const { user, stats, videos, meta } = data;
    const { theme, showSignature, showLatestVideo, showPopularVideo, showStats, showFollowers } = options;

    // 工具函数
    const formatNumber = (num) => {
        if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
        if (num >= 10000) return (num / 10000).toFixed(1) + '万';
        return num.toString();
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const truncateText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // 主题配置
    const themes = {
        default: {
            primaryColor: '#00A1D6',
            secondaryColor: '#FB7299',
            bgGradient: ['#FFFFFF', '#F8F9FA'],
            textColor: '#18191C',
            subTextColor: '#9499A0'
        }
    };

    const themeConfig = themes[theme] || themes.default;

    // 生成SVG
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="540" height="320" viewBox="0 0 540 320">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${themeConfig.bgGradient[0]}" />
          <stop offset="100%" stop-color="${themeConfig.bgGradient[1]}" />
        </linearGradient>
        
        <linearGradient id="header" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${themeConfig.primaryColor}" />
          <stop offset="100%" stop-color="${themeConfig.secondaryColor}" />
        </linearGradient>
        
        <clipPath id="avatarClip">
          <circle cx="60" cy="60" r="48"/>
        </clipPath>
        
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(0,0,0,0.08)"/>
        </filter>
        
        <pattern id="avatarPattern" patternUnits="userSpaceOnUse" width="96" height="96">
          <image href="${user.face}" x="0" y="0" width="96" height="96" preserveAspectRatio="xMidYMid slice"/>
        </pattern>
      </defs>
      
      <style>
        .card { font-family: 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif; }
        .header { font-size: 20px; font-weight: 700; fill: white; }
        .username { font-size: 24px; font-weight: 700; fill: ${themeConfig.textColor}; }
        .level { font-size: 12px; font-weight: 600; fill: white; }
        .signature { font-size: 14px; fill: ${themeConfig.subTextColor}; font-style: italic; }
        .stat-label { font-size: 12px; fill: ${themeConfig.subTextColor}; }
        .stat-value { font-size: 20px; font-weight: 700; fill: ${themeConfig.primaryColor}; }
        .video-title { font-size: 14px; font-weight: 600; fill: ${themeConfig.textColor}; }
        .video-meta { font-size: 12px; fill: ${themeConfig.subTextColor}; }
        .section-title { font-size: 16px; font-weight: 700; fill: ${themeConfig.textColor}; }
        .debug-info { font-size: 10px; fill: #999; font-family: monospace; }
      </style>
      
      <!-- 背景 -->
      <rect width="540" height="320" fill="url(#bg)" rx="12" ry="12" stroke="#E3E5E7" stroke-width="1" filter="url(#shadow)"/>
      
      <!-- 头部区域 -->
      <rect x="0" y="0" width="540" height="80" fill="url(#header)" rx="12" ry="12"/>
      <text x="270" y="30" text-anchor="middle" class="header">Bilibili 用户卡片</text>
      <text x="270" y="55" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="11">UID: ${meta.uid}</text>
      
      <!-- 用户信息区域 -->
      <g transform="translate(30, 100)">
        <!-- 头像（使用pattern避免跨域问题） -->
        <circle cx="60" cy="60" r="50" fill="url(#avatarPattern)" stroke="${themeConfig.primaryColor}" stroke-width="2"/>
        
        <!-- 用户名和等级 -->
        <text x="120" y="40" class="username">${user.name}</text>
        <g transform="translate(120, 50)">
          <rect width="50" height="22" rx="11" ry="11" fill="${themeConfig.primaryColor}"/>
          <text x="25" y="16" text-anchor="middle" class="level">LV${user.level}</text>
        </g>
        
        <!-- 性别 -->
        <g transform="translate(180, 50)">
          <rect width="60" height="22" rx="11" ry="11" fill="#F0F2F4"/>
          <text x="30" y="16" text-anchor="middle" font-size="12" fill="#61666D">
            ${user.sex === '男' ? '♂' : user.sex === '女' ? '♀' : '⚥'} ${user.sex}
          </text>
        </g>
        
        <!-- 签名 -->
        ${showSignature ? `
          <text x="120" y="85" class="signature" width="380">
            ${truncateText(user.sign, 40)}
          </text>
        ` : ''}
      </g>
      
      <!-- 统计数据 -->
      ${showStats || showFollowers ? `
        <g transform="translate(30, 180)">
          <text y="-5" class="section-title">📊 数据统计</text>
          
          <g transform="translate(0, 30)">
            <!-- 粉丝数 -->
            ${showFollowers ? `
              <g transform="translate(0, 0)">
                <text class="stat-label">粉丝</text>
                <text y="25" class="stat-value">${formatNumber(stats.followers)}</text>
              </g>
            ` : ''}
            
            <!-- 关注数 -->
            ${showFollowers ? `
              <g transform="translate(80, 0)">
                <text class="stat-label">关注</text>
                <text y="25" class="stat-value">${formatNumber(stats.following)}</text>
              </g>
            ` : ''}
            
            <!-- 投稿数 -->
            ${showStats ? `
              <g transform="translate(160, 0)">
                <text class="stat-label">投稿</text>
                <text y="25" class="stat-value">${formatNumber(stats.totalVideos)}</text>
              </g>
            ` : ''}
          </g>
        </g>
      ` : ''}
      
      <!-- 最新视频 -->
      ${showLatestVideo && videos.latest ? `
        <g transform="translate(280, 180)">
          <text y="-5" class="section-title">🎬 最新视频</text>
          
          <g transform="translate(0, 30)">
            <rect width="240" height="70" fill="#F7F8FA" rx="8" ry="8" stroke="#E3E5E7" stroke-width="1"/>
            
            <text x="10" y="20" class="video-title" width="220">
              ${truncateText(videos.latest.title, 30)}
            </text>
            
            <text x="10" y="40" class="video-meta">
              ▶️ ${formatNumber(videos.latest.play_count)} 
              ⏱️ ${formatDuration(videos.latest.duration)}
            </text>
            
            <text x="10" y="60" class="video-meta" font-size="10">
              📅 ${new Date(videos.latest.publish_time * 1000).toLocaleDateString('zh-CN')}
            </text>
            
            ${videos.latest.cover ? `
              <image href="${videos.latest.cover}" x="160" y="10" width="70" height="50" 
                     preserveAspectRatio="xMidYMid slice" opacity="0.9" rx="4" ry="4"/>
            ` : ''}
          </g>
        </g>
      ` : ''}
      
      <!-- 最热视频 -->
      ${showPopularVideo && videos.popular ? `
        <g transform="translate(280, ${showLatestVideo ? 270 : 180})">
          <text y="-5" class="section-title">🔥 最热视频</text>
          
          <g transform="translate(0, 30)">
            <rect width="240" height="70" fill="#F7F8FA" rx="8" ry="8" stroke="#E3E5E7" stroke-width="1"/>
            
            <text x="10" y="20" class="video-title" width="220">
              ${truncateText(videos.popular.title, 30)}
            </text>
            
            <text x="10" y="40" class="video-meta">
              ▶️ ${formatNumber(videos.popular.play_count)} 
              ⏱️ ${formatDuration(videos.popular.duration)}
            </text>
            
            <text x="10" y="60" class="video-meta" font-size="10">
              📅 ${new Date(videos.popular.publish_time * 1000).toLocaleDateString('zh-CN')}
            </text>
            
            ${videos.popular.cover ? `
              <image href="${videos.popular.cover}" x="160" y="10" width="70" height="50" 
                     preserveAspectRatio="xMidYMid slice" opacity="0.9" rx="4" ry="4"/>
            ` : ''}
          </g>
        </g>
      ` : ''}
      
      <!-- 调试信息 -->
      ${showDebug ? `
        <g transform="translate(30, 300)">
          <text class="debug-info">
            生成时间: ${new Date(meta.generatedAt).toLocaleString('zh-CN')} | 
            处理耗时: ${meta.processingTime}ms
          </text>
        </g>
      ` : ''}
      
      <!-- 底部信息 -->
      <text x="270" y="310" text-anchor="middle" font-size="10" fill="#B1B3B8">
        bili-card.lsqkk.space · ${new Date().toLocaleDateString('zh-CN')}
      </text>
    </svg>
  `;
}

// ==================== 缓存函数 ====================

function getCachedSVG(key) {
    const item = cache.get(key);
    if (item && item.expiry > Date.now()) {
        return item.svg;
    }
    if (item) cache.delete(key);
    return null;
}

function setCachedSVG(key, svg, ttl) {
    const expiry = Date.now() + ttl * 1000;
    cache.set(key, { svg, expiry });

    // 清理过期缓存
    if (cache.size > 100) {
        for (const [k, v] of cache.entries()) {
            if (v.expiry < Date.now()) cache.delete(k);
        }
    }
}

// ==================== 响应函数 ====================

function sendSVGResponse(res, svg, fromCache) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', `public, max-age=${CONFIG.CACHE_TTL}, stale-while-revalidate=600`);

    if (fromCache) {
        res.setHeader('X-Cache', 'HIT');
    } else {
        res.setHeader('X-Cache', 'MISS');
    }

    res.send(svg);
}

function sendErrorSVG(res, title, message) {
    const errorSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="540" height="200" viewBox="0 0 540 200">
      <defs>
        <linearGradient id="errorBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF5F5"/>
          <stop offset="100%" stop-color="#FEEBEB"/>
        </linearGradient>
      </defs>
      
      <rect width="540" height="200" fill="url(#errorBg)" rx="12" ry="12" stroke="#FECACA" stroke-width="1"/>
      
      <g transform="translate(270, 70)">
        <!-- 错误图标 -->
        <circle cx="0" cy="-10" r="25" fill="#FEE2E2"/>
        <path d="M0,-25 L0,-5 M0,5 L0,10" stroke="#DC2626" stroke-width="3" stroke-linecap="round"/>
        <circle cx="0" cy="-10" r="23" stroke="#DC2626" stroke-width="2" fill="none"/>
        
        <!-- 错误标题 -->
        <text y="40" text-anchor="middle" fill="#7F1D1D" font-size="20" font-weight="600">
          ${title}
        </text>
        
        <!-- 错误信息 -->
        <text y="70" text-anchor="middle" fill="#991B1B" font-size="14" font-family="'Segoe UI', sans-serif">
          ${message}
        </text>
      </g>
      
      <!-- 提示 -->
      <text x="270" y="170" text-anchor="middle" fill="#92400E" font-size="11">
        请检查UID是否正确或稍后重试 · bili-card.lsqkk.space
      </text>
    </svg>
  `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(400).send(errorSVG);
}