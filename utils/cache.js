// 使用内存缓存（生产环境可替换为Redis）
const cache = new Map();

module.exports = {
    async getCached(key) {
        const item = cache.get(key);
        if (item && item.expiry > Date.now()) {
            return item.value;
        }
        return null;
    },

    async setCached(key, value, ttl = 3600) {
        const expiry = Date.now() + ttl * 1000;
        cache.set(key, { value, expiry });

        // 自动清理过期缓存
        if (cache.size > 1000) {
            for (const [k, v] of cache.entries()) {
                if (v.expiry < Date.now()) cache.delete(k);
            }
        }
    }
};