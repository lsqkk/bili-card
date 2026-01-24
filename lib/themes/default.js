// 专业、简洁的默认主题设计
class DefaultTheme {
  constructor() {
    this.name = 'default';
    this.version = '1.0.0';
  }

  formatNumber(num) {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString('zh-CN');
  }

  formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  truncateText(text, maxLength = 30) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 1) + '…';
  }

  render(data, options) {
    const { user, stats, videos, meta } = data;
    const {
      showSignature = true,
      showVideos = true,
      showStats = true,
      showFollowers = true
    } = options;

    // 色彩方案 - 专业简洁
    const colors = {
      primary: '#00A1D6',     // B站蓝
      secondary: '#6C757D',   // 中性灰
      background: '#FFFFFF',
      surface: '#F8F9FA',
      border: '#E9ECEF',
      textPrimary: '#212529',
      textSecondary: '#6C757D',
      textMuted: '#868E96'
    };

    // 字体设置
    const fonts = {
      title: '14px "Segoe UI", "Microsoft YaHei", sans-serif',
      body: '12px "Segoe UI", "Microsoft YaHei", sans-serif',
      small: '11px "Segoe UI", "Microsoft YaHei", sans-serif'
    };

    // 计算布局
    const width = 540;
    const cardHeight = 260;
    const avatarSize = 64;
    const avatarX = 30;
    const avatarY = 30;
    const contentX = avatarX + avatarSize + 20;

    // 构建SVG
    const svgParts = [];

    // SVG开头
    svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${cardHeight}" viewBox="0 0 ${width} ${cardHeight}">`);

    // 样式定义
    svgParts.push(`
      <style>
        .title { font: ${fonts.title}; fill: ${colors.textPrimary}; font-weight: 600; }
        .body { font: ${fonts.body}; fill: ${colors.textSecondary}; }
        .small { font: ${fonts.small}; fill: ${colors.textMuted}; }
        .stat-value { font: ${fonts.body}; fill: ${colors.textPrimary}; font-weight: 600; }
        .stat-label { font: ${fonts.small}; fill: ${colors.textMuted}; }
        .video-title { font: ${fonts.body}; fill: ${colors.textPrimary}; font-weight: 500; }
        .signature { font: ${fonts.body}; fill: ${colors.textMuted}; font-style: italic; }
      </style>
    `);

    // 背景
    svgParts.push(`
      <rect width="${width}" height="${cardHeight}" fill="${colors.background}" rx="8"/>
      <rect x="1" y="1" width="${width - 2}" height="${cardHeight - 2}" 
            fill="${colors.background}" rx="7" stroke="${colors.border}" stroke-width="1"/>
    `);

    // 头像区域
    svgParts.push(`
      <defs>
        <clipPath id="avatarClip">
          <circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}"/>
        </clipPath>
      </defs>
      <image href="${user.avatar}" x="${avatarX}" y="${avatarY}" 
             width="${avatarSize}" height="${avatarSize}" clip-path="url(#avatarClip)"/>
      <circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" 
              r="${avatarSize / 2 + 0.5}" fill="none" stroke="${colors.border}" stroke-width="1"/>
    `);

    // 用户信息区域
    const nameY = avatarY + 18;
    const levelY = nameY + 20;
    const statsY = levelY + 24;

    svgParts.push(`
      <!-- 用户名 -->
      <text x="${contentX}" y="${nameY}" class="title">${user.name}</text>
      
      <!-- 等级 -->
      <rect x="${contentX}" y="${levelY - 12}" width="36" height="20" rx="4" fill="${colors.primary}"/>
      <text x="${contentX + 18}" y="${levelY}" text-anchor="middle" class="small" fill="white">LV${user.level}</text>
      
      <!-- 性别 -->
      <text x="${contentX + 45}" y="${levelY}" class="body">${user.sex}</text>
    `);

    // 签名（条件显示）
    if (showSignature && user.sign) {
      svgParts.push(`
        <text x="${contentX}" y="${levelY + 20}" class="signature" width="${width - contentX - 30}">
          ${this.truncateText(user.sign, 40)}
        </text>
      `);
    }

    // 统计数据
    if (showStats || showFollowers) {
      let statX = contentX;

      if (showFollowers) {
        svgParts.push(`
          <g transform="translate(${statX}, ${statsY})">
            <text class="stat-value">${this.formatNumber(stats.followers)}</text>
            <text y="16" class="stat-label">粉丝</text>
          </g>
        `);
        statX += 60;

        svgParts.push(`
          <g transform="translate(${statX}, ${statsY})">
            <text class="stat-value">${this.formatNumber(stats.following)}</text>
            <text y="16" class="stat-label">关注</text>
          </g>
        `);
        statX += 60;
      }

      if (showStats) {
        svgParts.push(`
          <g transform="translate(${statX}, ${statsY})">
            <text class="stat-value">${this.formatNumber(stats.videos)}</text>
            <text y="16" class="stat-label">视频</text>
          </g>
        `);
      }
    }

    // 视频区域
    if (showVideos) {
      const videoY = statsY + 50;
      const videoWidth = (width - contentX - 30) / 2;

      // 最新视频
      if (videos.latest) {
        const video = videos.latest;
        const videoX = contentX;

        svgParts.push(`
          <g transform="translate(${videoX}, ${videoY})">
            <rect width="${videoWidth - 10}" height="60" fill="${colors.surface}" rx="4" 
                  stroke="${colors.border}" stroke-width="0.5"/>
            
            <text x="10" y="18" class="video-title" width="${videoWidth - 30}">
              ${this.truncateText(video.title, 20)}
            </text>
            
            <text x="10" y="38" class="small">
              播放 ${this.formatNumber(video.play_count)} · ${this.formatDuration(video.duration)}
            </text>
            
            ${video.cover ? `
              <image href="${video.cover}" x="${videoWidth - 75}" y="5" 
                     width="60" height="50" preserveAspectRatio="xMidYMid slice" opacity="0.9" rx="2"/>
            ` : ''}
          </g>
        `);
      }

      // 最热视频
      if (videos.popular) {
        const video = videos.popular;
        const videoX = contentX + videoWidth;

        svgParts.push(`
          <g transform="translate(${videoX}, ${videoY})">
            <rect width="${videoWidth - 10}" height="60" fill="${colors.surface}" rx="4" 
                  stroke="${colors.border}" stroke-width="0.5"/>
            
            <text x="10" y="18" class="video-title" width="${videoWidth - 30}">
              ${this.truncateText(video.title, 20)}
            </text>
            
            <text x="10" y="38" class="small">
              播放 ${this.formatNumber(video.play_count)} · ${this.formatDuration(video.duration)}
            </text>
            
            ${video.cover ? `
              <image href="${video.cover}" x="${videoWidth - 75}" y="5" 
                     width="60" height="50" preserveAspectRatio="xMidYMid slice" opacity="0.9" rx="2"/>
            ` : ''}
          </g>
        `);
      }
    }

    // 底部信息
    svgParts.push(`
      <text x="${width - 30}" y="${cardHeight - 10}" text-anchor="end" class="small">
        ${new Date().toLocaleDateString('zh-CN')}
      </text>
    `);

    // SVG结束
    svgParts.push('</svg>');

    return svgParts.join('\n');
  }
}

module.exports = new DefaultTheme();