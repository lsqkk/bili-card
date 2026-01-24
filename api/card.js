const { fetchBilibiliData } = require('../../lib/bilibili')
const { renderSVG } = require('../../lib/render')
const { getCachedData, setCachedData } = require('../../utils/helpers')

module.exports = async (req, res) => {
    const { uid, theme = 'default', hide = '' } = req.query

    // 参数验证
    if (!uid || isNaN(uid)) {
        res.setHeader('Content-Type', 'image/svg+xml')
        return res.status(400).send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">
        <rect width="400" height="100" fill="#f8f9fa"/>
        <text x="200" y="50" text-anchor="middle" fill="#dc3545" font-family="Arial">
          错误：UID格式不正确
        </text>
      </svg>
    `)
    }

    try {
        // 缓存键（包含所有定制参数）
        const cacheKey = `bili-${uid}-${theme}-${hide}`

        // 检查缓存
        const cached = await getCachedData(cacheKey)
        if (cached) {
            res.setHeader('Content-Type', 'image/svg+xml')
            res.setHeader('Cache-Control', 'public, max-age=3600')
            return res.send(cached)
        }

        // 获取B站数据
        const data = await fetchBilibiliData(uid)

        // 解析hide参数，生成显示选项
        const hiddenItems = hide.split(',').map(item => item.trim())
        const options = {
            showSignature: !hiddenItems.includes('signature'),
            showLatestVideo: !hiddenItems.includes('latest'),
            showPopularVideo: !hiddenItems.includes('popular'),
            showStats: !hiddenItems.includes('stats')
        }

        // 渲染SVG
        const svg = await renderSVG(data, { theme, ...options })

        // 设置缓存
        await setCachedData(cacheKey, svg, 3600)

        // 返回响应
        res.setHeader('Content-Type', 'image/svg+xml')
        res.setHeader('Cache-Control', 'public, max-age=3600')
        res.send(svg)

    } catch (error) {
        console.error('Error:', error.message)
        res.setHeader('Content-Type', 'image/svg+xml')
        res.status(500).send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">
        <rect width="400" height="100" fill="#f8f9fa"/>
        <text x="200" y="50" text-anchor="middle" fill="#6c757d" font-family="Arial">
          服务暂时不可用，请稍后重试
        </text>
      </svg>
    `)
    }
}