const themes = require('./themes');

class Renderer {
    constructor() {
        this.themeManager = themes;
    }

    async renderSVG(data, options = {}) {
        const {
            theme = 'default',
            options: displayOptions = {}
        } = options;

        // 获取主题配置
        const themeConfig = this.themeManager.getTheme(theme);
        if (!themeConfig) {
            throw new Error(`Theme "${theme}" not found`);
        }

        // 使用主题渲染
        return themeConfig.render(data, displayOptions);
    }
}

module.exports = new Renderer();