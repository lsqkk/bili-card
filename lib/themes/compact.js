// 紧凑主题示例，展示主题系统的扩展性
class CompactTheme {
    constructor() {
        this.name = 'compact';
    }

    formatNumber(num) {
        if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
        return num.toString();
    }

    render(data, options) {
        const { user, stats } = data;

        return `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">
        <rect width="400" height="100" fill="#FFFFFF" rx="6" stroke="#E1E4E8" stroke-width="1"/>
        
        <image href="${user.avatar}" x="20" y="20" width="60" height="60" rx="30"/>
        
        <text x="100" y="35" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="600" fill="#24292E">
          ${user.name}
        </text>
        
        <text x="100" y="55" font-family="'Segoe UI', sans-serif" font-size="12" fill="#586069">
          LV${user.level} · 粉丝 ${this.formatNumber(stats.followers)} · 视频 ${stats.videos}
        </text>
        
        <text x="100" y="75" font-family="'Segoe UI', sans-serif" font-size="11" fill="#6A737D" width="280">
          ${user.sign ? user.sign.substring(0, 50) + (user.sign.length > 50 ? '...' : '') : '暂无签名'}
        </text>
      </svg>
    `;
    }
}

module.exports = new CompactTheme();