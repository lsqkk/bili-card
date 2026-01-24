const axios = require('axios');
const { proxyImageURL } = require('../utils/image-proxy');

class BilibiliAPI {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    }

    async getUserInfo(uid) {
        const response = await axios.get(
            'https://uapis.cn/api/v1/social/bilibili/userinfo',
            {
                params: { uid },
                headers: { 'User-Agent': this.userAgent },
                timeout: 10000
            }
        );

        if (response.data && response.data.mid) {
            // 处理图片URL，防止403
            return {
                mid: response.data.mid,
                name: response.data.name,
                avatar: proxyImageURL(response.data.face),
                level: response.data.level,
                sign: response.data.sign || '',
                sex: response.data.sex
            };
        }

        throw new Error('User not found');
    }

    async getRelationStats(uid) {
        try {
            const response = await axios.get(
                'https://api.bilibili.com/x/relation/stat',
                { params: { vmid: uid }, timeout: 8000 }
            );

            if (response.data.code === 0) {
                return {
                    followers: response.data.data.follower || 0,
                    following: response.data.data.following || 0
                };
            }
        } catch (error) {
            console.warn('Failed to fetch relation stats:', error.message);
        }

        return { followers: 0, following: 0 };
    }

    async getVideos(uid) {
        try {
            const [latest, popular] = await Promise.all([
                axios.get('https://uapis.cn/api/v1/social/bilibili/archives', {
                    params: { mid: uid, orderby: 'pubdate', ps: 1 },
                    timeout: 8000
                }),
                axios.get('https://uapis.cn/api/v1/social/bilibili/archives', {
                    params: { mid: uid, orderby: 'views', ps: 1 },
                    timeout: 8000
                })
            ]);

            const videos = {};

            if (latest.data?.videos?.[0]) {
                videos.latest = {
                    ...latest.data.videos[0],
                    cover: proxyImageURL(latest.data.videos[0].cover)
                };
            }

            if (popular.data?.videos?.[0]) {
                videos.popular = {
                    ...popular.data.videos[0],
                    cover: proxyImageURL(popular.data.videos[0].cover)
                };
            }

            return {
                videos,
                total: latest.data?.total || popular.data?.total || 0
            };
        } catch (error) {
            console.warn('Failed to fetch videos:', error.message);
            return { videos: {}, total: 0 };
        }
    }

    async fetchBilibiliData(uid) {
        const [userInfo, relationStats, videoData] = await Promise.all([
            this.getUserInfo(uid),
            this.getRelationStats(uid),
            this.getVideos(uid)
        ]);

        return {
            user: userInfo,
            stats: {
                followers: relationStats.followers,
                following: relationStats.following,
                videos: videoData.total
            },
            videos: videoData.videos,
            meta: {
                uid,
                fetchedAt: new Date().toISOString()
            }
        };
    }
}

module.exports = {
    BilibiliAPI,
    fetchBilibiliData: (uid) => new BilibiliAPI().fetchBilibiliData(uid)
};