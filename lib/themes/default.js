// 专业简洁的默认主题
const { getSafeAvatarUrl, getSafeCoverUrl } = require('../../utils/image-proxy');

class DefaultTheme {
  constructor() {
    this.name = 'default';
    this.width = 540;
    this.height = 260;
    this.colors = {
      primary: '#00A1D6',    // B站品牌蓝
      textPrimary: '#18191C', // 主要文字
      textSecondary: '#61666D', // 次要文字
      textTertiary: '#9499A0', // 辅助文字
      border: '#E3E5E7',     // 边框
      background: '#FFFFFF',  // 背景
      cardBackground: '#F7F8FA' // 卡片背景
    };
  }

  // 格式化工具
  formatNumber(num) {
    if (!num && num !== 0) return 'N/A';
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  truncateText(text, maxLength, suffix = '...') {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + suffix;
  }

  render(data) {
    const { user, stats, videos, options } = data;
    const { colors, width, height } = this;

    // 安全图片URL
    const safeAvatar = getSafeAvatarUrl(user.face);
    const latestCover = videos.latest ? getSafeCoverUrl(videos.latest.cover) : null;
    const popularCover = videos.popular ? getSafeCoverUrl(videos.popular.cover) : null;

    // 主SVG结构
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <clipPath id="avatar-clip">
            <circle cx="45" cy="45" r="40"/>
          </clipPath>
          
          <clipPath id="cover-clip">
            <rect width="80" height="45" rx="4"/>
          </clipPath>
          
          <linearGradient id="level-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${colors.primary}"/>
            <stop offset="100%" stop-color="#0092C7"/>
          </linearGradient>
        </defs>
        
        <style>
          * {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', system-ui, sans-serif;
          }
          .text-primary {
            fill: ${colors.textPrimary};
            font-weight: 600;
          }
          .text-secondary {
            fill: ${colors.textSecondary};
          }
          .text-tertiary {
            fill: ${colors.textTertiary};
            font-size: 12px;
          }
          .text-small {
            font-size: 12px;
          }
          .text-normal {
            font-size: 14px;
          }
          .text-large {
            font-size: 18px;
            font-weight: 700;
          }
          .stat-value {
            font-size: 20px;
            font-weight: 700;
            fill: ${colors.primary};
          }
          .video-title {
            font-size: 13px;
            font-weight: 500;
            fill: ${colors.textPrimary};
          }
          .card {
            filter: drop-shadow(0 2px 8px rgba(0,0,0,0.06));
          }
        </style>
        
        <!-- 主卡片背景 -->
        <rect width="${width}" height="${height}" fill="${colors.background}" rx="8"/>
        
        <!-- 用户信息区域 -->
        <g transform="translate(20, 20)">
          <!-- 头像 -->
          ${safeAvatar ? `
            <image href="${safeAvatar}" x="5" y="5" width="80" height="80" clip-path="url(#avatar-clip)"/>
          ` : `
            <circle cx="45" cy="45" r="40" fill="${colors.border}"/>
            <text x="45" y="50" text-anchor="middle" fill="${colors.textTertiary}" font-size="12">头像</text>
          `}
          
          <!-- 用户基本信息 -->
          <g transform="translate(95, 0)">
            <!-- 用户名 -->
            <text y="25" class="text-large">${this.truncateText(user.name, 16)}</text>
            
            <!-- 等级和性别 -->
            <g transform="translate(0, 40)">
              <!-- 等级徽章 -->
              <rect width="42" height="20" rx="10" fill="url(#level-bg)"/>
              <text x="21" y="14" text-anchor="middle" fill="white" font-size="11" font-weight="600">Lv${user.level}</text>
              
              <!-- 性别 -->
              <g transform="translate(50, 0)">
                <rect width="36" height="20" rx="10" fill="${user.sex === '男' ? '#E6F4FF' : user.sex === '女' ? '#FFF0F6' : '#F6F6F6'}"/>
                <text x="18" y="14" text-anchor="middle" font-size="11" font-weight="500" 
                      fill="${user.sex === '男' ? '#1677FF' : user.sex === '女' ? '#EB2F96' : colors.textSecondary}">
                  ${user.sex === '男' ? '男' : user.sex === '女' ? '女' : '保密'}
                </text>
              </g>
            </g>
            
            <!-- 签名 -->
            ${options.showSignature && user.sign ? `
              <text y="75" class="text-tertiary" width="400">${this.truncateText(user.sign, 50)}</text>
            ` : ''}
          </g>
        </g>
        
        <!-- 统计数据区域 -->
        ${options.showStats || options.showFollowers ? `
          <g transform="translate(20, 115)">
            <rect width="500" height="1" fill="${colors.border}"/>
            
            <g transform="translate(0, 20)">
              ${options.showFollowers ? `
                <g transform="translate(0, 0)">
                  <text class="text-tertiary">粉丝</text>
                  <text y="25" class="stat-value">${this.formatNumber(stats.followers)}</text>
                </g>
                
                <g transform="translate(100, 0)">
                  <text class="text-tertiary">关注</text>
                  <text y="25" class="stat-value">${this.formatNumber(stats.following)}</text>
                </g>
              ` : ''}
              
              ${options.showStats ? `
                <g transform="translate(${options.showFollowers ? 200 : 0}, 0)">
                  <text class="text-tertiary">投稿</text>
                  <text y="25" class="stat-value">${this.formatNumber(stats.totalVideos)}</text>
                </g>
              ` : ''}
            </g>
          </g>
        ` : ''}
        
        <!-- 视频区域 -->
        <g transform="translate(20, ${(options.showStats || options.showFollowers) ? 180 : 120})">
          <!-- 最新视频 -->
          ${options.showLatestVideo && videos.latest ? `
            <g class="card" transform="translate(0, 0)">
              <rect width="240" height="80" fill="${colors.cardBackground}" rx="6" stroke="${colors.border}" stroke-width="1"/>
              
              ${latestCover ? `
                <image href="${latestCover}" x="150" y="10" width="80" height="45" clip-path="url(#cover-clip)"/>
              ` : ''}
              
              <text x="10" y="25" class="video-title" width="${latestCover ? 130 : 220}">
                ${this.truncateText(videos.latest.title, latestCover ? 24 : 40)}
              </text>
              
              <g transform="translate(10, 45)">
                <text class="text-tertiary">播放 ${this.formatNumber(videos.latest.play_count)}</text>
                <text x="80" y="0" class="text-tertiary">${this.formatDuration(videos.latest.duration)}</text>
              </g>
              
              <text x="10" y="70" class="text-tertiary">
                ${new Date(videos.latest.publish_time * 1000).toLocaleDateString('zh-CN')}
              </text>
            </g>
          ` : ''}
          
          <!-- 最热视频 -->
          ${options.showPopularVideo && videos.popular ? `
            <g class="card" transform="translate(${options.showLatestVideo ? 260 : 0}, 0)">
              <rect width="240" height="80" fill="${colors.cardBackground}" rx="6" stroke="${colors.border}" stroke-width="1"/>
              
              ${popularCover ? `
                <image href="${popularCover}" x="150" y="10" width="80" height="45" clip-path="url(#cover-clip)"/>
              ` : ''}
              
              <text x="10" y="25" class="video-title" width="${popularCover ? 130 : 220}">
                ${this.truncateText(videos.popular.title, popularCover ? 24 : 40)}
              </text>
              
              <g transform="translate(10, 45)">
                <text class="text-tertiary">播放 ${this.formatNumber(videos.popular.play_count)}</text>
                <text x="80" y="0" class="text-tertiary">${this.formatDuration(videos.popular.duration)}</text>
              </g>
              
              <text x="10" y="70" class="text-tertiary">
                ${new Date(videos.popular.publish_time * 1000).toLocaleDateString('zh-CN')}
              </text>
            </g>
          ` : ''}
        </g>
        
        <!-- 底部信息 -->
        <g transform="translate(${width - 150}, ${height - 15})">
          <text class="text-tertiary" font-size="10">bili-card.lsqkk.space</text>
        </g>
      </svg>
    `;
  }
}

module.exports = new DefaultTheme();