// utils/image-proxy.js
/**
 * 处理B站图片防盗链
 * 方案：添加referrer头并使用B站官方CDN
 */
module.exports = {
    getSafeAvatarUrl: (faceUrl) => {
        if (!faceUrl) return null;
        // 转换为B站官方CDN地址
        return faceUrl.replace(/\/\/.*\.hdslb\.com/, '//i0.hdslb.com');
    },

    getSafeCoverUrl: (coverUrl) => {
        if (!coverUrl) return null;
        // 统一使用https
        return coverUrl.replace('http://', 'https://');
    },

    // 可选：base64转换（避免跨域，但增加响应大小）
    // async fetchImageAsBase64(url) { ... }
};