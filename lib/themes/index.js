const defaultTheme = require('./default');
const compactTheme = require('./compact');

class ThemeManager {
    constructor() {
        this.themes = new Map();
        this.registerTheme('default', defaultTheme);
        this.registerTheme('compact', compactTheme);
    }

    registerTheme(name, theme) {
        if (typeof theme.render !== 'function') {
            throw new Error(`Theme "${name}" must have a render method`);
        }
        this.themes.set(name, theme);
    }

    getTheme(name) {
        return this.themes.get(name);
    }

    listThemes() {
        return Array.from(this.themes.keys());
    }
}

module.exports = new ThemeManager();