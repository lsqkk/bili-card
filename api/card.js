const { fetchBilibiliData } = require('../lib/bilibili');
const { renderSVG } = require('../lib/renderer');
const { getCached, setCached } = require('../utils/cache');

module.exports = async (req, res) => {
    const { uid, theme = 'default', hide = '', debug } = req.query;

    // 验证参数
    if (!uid || !/^\d{3,10}$/.test(uid)) {
        return sendErrorSVG(res, 'Invalid UID', 'UID应为3到10位数字');
    }

    // 缓存键
    const cacheKey = `card:${uid}:${theme}:${hide}`;

    try {
        // 检查缓存
        const cached = await getCached(cacheKey);
        if (cached) {
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return res.send(cached);
        }

        // 获取数据
        const data = await fetchBilibiliData(uid);

        // 解析显示选项
        const hidden = new Set(hide.split(',').map(h => h.trim()));
        const options = {
            showSignature: !hidden.has('signature'),
            showVideos: !hidden.has('videos'),
            showStats: !hidden.has('stats'),
            showFollowers: !hidden.has('followers')
        };

        // 渲染SVG
        const svg = await renderSVG(data, { theme, options });

        // 设置缓存
        await setCached(cacheKey, svg, 3600);

        // 返回响应
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(svg);

    } catch (error) {
        console.error('Error:', error);
        // 返回错误信息的SVG，以便调试
        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(500).send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">
        <rect width="400" height="200" fill="#f8f9fa"/>
        <text x="200" y="100" text-anchor="middle" font-family="Arial" fill="#dc3545">
          Error: ${error.message}
        </text>
      </svg>
    `);
    }
};

function sendErrorSVG(res, title, message) {
    const errorSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">
      <rect width="400" height="200" fill="#f8f9fa"/>
      <text x="200" y="90" text-anchor="middle" font-family="Arial" font-size="16" fill="#dc3545">
        ${title}
      </text>
      <text x="200" y="120" text-anchor="middle" font-family="Arial" font-size="12" fill="#6c757d">
        ${message}
      </text>
    </svg>
  `;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(400).send(errorSVG);
}