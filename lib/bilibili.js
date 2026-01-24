const axios = require('axios')

class BilibiliAPI {
    constructor() {
        this.baseURL = 'https://uapis.cn/api/v1/social/bilibili'
        this.timeout = 10000
    }

    async getUserInfo(uid) {
        try {
            const response = await axios.get(`${this.baseURL}/userinfo`, {
                params: { uid },
                timeout: this.timeout
            })

            if (response.data.code === 0) {
                return response.data.data
            } else {
                throw new Error(response.data.message || '用户信息获取失败')
            }
        } catch (error) {
            if (error.response) {
                switch (error.response.status) {
                    case 404:
                        throw new Error('用户不存在')
                    case 502:
                        throw new Error('B站API暂时不可用')
                }
            }
            throw error
        }
    }

    async getVideos(mid, options = {}) {
        const { orderby = 'pubdate', ps = 1, pn = 1 } = options

        try {
            const response = await axios.get(`${this.baseURL}/archives`, {
                params: { mid, orderby, ps, pn },
                timeout: this.timeout
            })

            if (response.data.videos && response.data.videos.length > 0) {
                return {
                    video: response.data.videos[0],
                    total: response.data.total
                }
            }
            return null
        } catch (error) {
            console.warn(`获取视频数据失败 (orderby: ${orderby}):`, error.message)
            return null
        }
    }

    async fetchBilibiliData(uid) {
        // 并行获取所有数据
        const [userInfo, latestVideoData, popularVideoData] = await Promise.all([
            this.getUserInfo(uid),
            this.getVideos(uid, { orderby: 'pubdate', ps: 1 }),
            this.getVideos(uid, { orderby: 'views', ps: 1 })
        ])

        return {
            user: {
                mid: userInfo.mid,
                name: userInfo.name,
                face: userInfo.face,
                level: userInfo.level,
                sex: userInfo.sex,
                sign: userInfo.sign
            },
            latestVideo: latestVideoData?.video || null,
            popularVideo: popularVideoData?.video || null,
            stats: {
                totalVideos: latestVideoData?.total || 0
            }
        }
    }
}

module.exports = {
    BilibiliAPI,
    fetchBilibiliData: (uid) => new BilibiliAPI().fetchBilibiliData(uid)
}