const defaultTheme = require('./default')

class ThemeManager {
    constructor() {
        this.themes = new Map()
        this.registerTheme('default', defaultTheme)
    }

    registerTheme(name, themeConfig) {
        if (!themeConfig || typeof themeConfig.render !== 'function') {
            throw new Error(`主题 "${name}" 必须包含 render 函数`)
        }
        this.themes.set(name, themeConfig)
        console.log(`主题已注册: ${name}`)
    }

    getTheme(name) {
        return this.themes.get(name)
    }

    listThemes() {
        return Array.from(this.themes.keys())
    }
}

module.exports = new ThemeManager()