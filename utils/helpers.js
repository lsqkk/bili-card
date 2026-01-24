// 简单的内存缓存（生产环境可替换为Redis）
const cache = new Map()

module.exports = {
    // 获取缓存数据
    async getCachedData(key) {
        const item = cache.get(key)
        if (item && item.expiry > Date.now()) {
            return item.value
        }
        cache.delete(key)
        return null
    },

    // 设置缓存数据
    async setCachedData(key, value, ttlSeconds = 3600) {
        const expiry = Date.now() + ttlSeconds * 1000
        cache.set(key, { value, expiry })

        // 限制缓存大小
        if (cache.size > 1000) {
            const firstKey = cache.keys().next().value
            cache.delete(firstKey)
        }
    },

    // 格式化时间戳
    formatTimestamp(timestamp) {
        const date = new Date(timestamp * 1000)
        return date.toLocaleDateString('zh-CN')
    },

    // 验证UID
    isValidUID(uid) {
        return /^\d+$/.test(uid) && uid.length >= 3 && uid.length <= 10
    }
}