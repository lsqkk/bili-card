const defaultTheme = require('./default');
// 后续可以添加更多主题：const simpleTheme = require('./simple');

class ThemeManager {
    constructor() {
        this.themes = new Map();
        this.register('default', defaultTheme);
    }

    register(name, theme) {
        if (typeof theme.render !== 'function') {
            throw new Error(`主题 "${name}" 必须提供 render 方法`);
        }
        this.themes.set(name, theme);
        console.log(`主题已注册: ${name}`);
    }

    get(name) {
        return this.themes.get(name);
    }

    list() {
        return Array.from(this.themes.keys());
    }
}

module.exports = new ThemeManager();