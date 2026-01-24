const themes = require('./themes')

class SVGRenderer {
    constructor() {
        this.themes = themes
    }

    async renderSVG(data, options = {}) {
        const {
            theme = 'default',
            showSignature = true,
            showLatestVideo = true,
            showPopularVideo = true,
            showStats = true
        } = options

        // 获取主题配置
        const themeConfig = this.themes.getTheme(theme)
        if (!themeConfig) {
            throw new Error(`主题 "${theme}" 不存在`)
        }

        // 准备渲染数据
        const renderData = {
            ...data,
            options: {
                showSignature,
                showLatestVideo,
                showPopularVideo,
                showStats
            }
        }

        // 使用主题的render函数生成SVG
        return themeConfig.render(renderData)
    }
}

module.exports = {
    SVGRenderer,
    renderSVG: (data, options) => new SVGRenderer().renderSVG(data, options)
}