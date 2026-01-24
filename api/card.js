const { fetchBilibiliData } = require('../lib/bilibili');
const { renderSVG } = require('../lib/renderer');
const { getCached, setCached } = require('../utils/cache');

module.exports = async (req, res) => {
    const { uid, theme = 'default', hide = '', debug } = req.query;

    // 验证参数
    if (!uid || !/^\d{3,10}$/.test(uid)) {
        return res.status(400).send('Invalid UID');
    }

    // 缓存键
    const cacheKey = `card:${uid}:${theme}:${hide}`;

    try {
        // 检查缓存
        if (req.headers['if-none-match'] === cacheKey) {
            return res.status(304).end();
        }

        const cached = await getCached(cacheKey);
        if (cached) {
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.setHeader('ETag', cacheKey);
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
        res.setHeader('ETag', cacheKey);
        res.send(svg);

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
};