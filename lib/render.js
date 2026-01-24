const themes = require('./themes');

class Renderer {
    constructor() {
        this.themes = themes;
    }

    async renderSVG(data, options = {}) {
        const themeName = options.theme || 'default';
        const theme = this.themes.get(themeName);

        if (!theme) {
            throw new Error(`主题 "${themeName}" 不存在`);
        }

        // 准备渲染数据
        const renderData = {
            ...data,
            options: {
                showSignature: options.showSignature !== false,
                showLatestVideo: options.showLatestVideo !== false,
                showPopularVideo: options.showPopularVideo !== false,
                showStats: options.showStats !== false,
                showFollowers: options.showFollowers !== false
            },
            cacheTimestamp: Date.now()
        };

        // 调用主题渲染函数
        return theme.render(renderData);
    }

    // 注册新主题
    registerTheme(name, theme) {
        this.themes.register(name, theme);
    }
}

module.exports = new Renderer();