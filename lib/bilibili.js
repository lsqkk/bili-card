// 确保与现有API兼容，添加必要的字段
const axios = require('axios');

class BilibiliAPI {
    // ... 现有代码保持不变 ...

    async fetchBilibiliData(uid) {
        try {
            // 并行获取数据
            const [userInfo, relationData, latestVideoData, popularVideoData] = await Promise.all([
                this.getUserInfo(uid),
                this.getRelationInfo(uid),
                this.getVideos(uid, { orderby: 'pubdate', ps: 1 }),
                this.getVideos(uid, { orderby: 'views', ps: 1 })
            ]);

            return {
                user: userInfo || null,
                stats: {
                    followers: relationData?.follower || 0,
                    following: relationData?.following || 0,
                    totalVideos: latestVideoData?.total || 0
                },
                videos: {
                    latest: latestVideoData?.video || null,
                    popular: popularVideoData?.video || null
                }
            };
        } catch (error) {
            console.error('Data fetch error:', error);
            throw error;
        }
    }

    // 新增：获取关系数据
    async getRelationInfo(uid) {
        try {
            const response = await axios.get('https://api.bilibili.com/x/relation/stat', {
                params: { vmid: uid },
                timeout: 8000
            });

            if (response.data.code === 0) {
                return response.data.data;
            }
        } catch (error) {
            console.warn('Relation API failed:', error.message);
        }
        return null;
    }
}

module.exports = {
    BilibiliAPI,
    fetchBilibiliData: (uid) => new BilibiliAPI().fetchBilibiliData(uid)
};