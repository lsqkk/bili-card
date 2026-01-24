// 解决图片403问题：使用Vercel函数代理图片请求
const PROXY_BASE = '/api/proxy-image'; // 需要额外部署一个代理端点

module.exports = {
    proxyImageURL: (url) => {
        if (!url) return '';

        // 如果是B站图片，使用代理
        if (url.includes('hdslb.com') || url.includes('bilibili.com')) {
            // 返回原始URL，前端通过CSS处理（更简单方案）
            // 或者编码后使用代理端点
            const encoded = encodeURIComponent(url);
            return `${PROXY_BASE}?url=${encoded}`;
        }

        return url;
    },

    // 简单方案：直接使用B站CDN的稳定域名
    getStableImageURL: (url) => {
        if (!url) return '';

        // 统一使用i0.hdslb.com域名
        const match = url.match(/\/\/[^/]+\/(bfs\/[^?]+)/);
        if (match) {
            return `https://i0.hdslb.com/${match[1]}`;
        }

        return url;
    }
};