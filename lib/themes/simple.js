// 极简主题示例，展示扩展性
const BaseTheme = require('./default');

class SimpleTheme extends BaseTheme {
  constructor() {
    super();
    this.name = 'simple';
    this.height = 200;
    this.colors = {
      ...this.colors,
      background: '#FAFAFA'
    };
  }

  render(data) {
    // 简化版本，只显示核心信息
    const { user, stats } = data;
    const { colors, width, height } = this;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="${width}" height="${height}" fill="${colors.background}" rx="6"/>
        
        <g transform="translate(20, 30)">
          <!-- 头像 -->
          <circle cx="30" cy="30" r="25" fill="${colors.border}"/>
          
          <!-- 用户信息 -->
          <g transform="translate(70, 0)">
            <text y="25" font-size="18" font-weight="600" fill="${colors.textPrimary}">
              ${this.truncateText(user.name, 12)}
            </text>
            <text y="50" font-size="14" fill="${colors.textSecondary}">Lv${user.level} · ${user.sex}</text>
          </g>
        </g>
        
        <g transform="translate(20, 100)">
          <g transform="translate(0, 0)">
            <text font-size="12" fill="${colors.textTertiary}">粉丝</text>
            <text y="25" font-size="20" font-weight="700" fill="${colors.primary}">
              ${this.formatNumber(stats.followers)}
            </text>
          </g>
          
          <g transform="translate(120, 0)">
            <text font-size="12" fill="${colors.textTertiary}">投稿</text>
            <text y="25" font-size="20" font-weight="700" fill="${colors.primary}">
              ${this.formatNumber(stats.totalVideos)}
            </text>
          </g>
        </g>
        
        <text x="${width - 20}" y="${height - 10}" text-anchor="end" font-size="10" fill="${colors.textTertiary}">
          ${new Date().toLocaleDateString('zh-CN')}
        </text>
      </svg>
    `;
  }
}

module.exports = new SimpleTheme();