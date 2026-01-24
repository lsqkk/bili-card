class DefaultTheme {
    constructor() {
        this.name = 'default'
        this.width = 540
        this.height = 240
    }

    formatNumber(num) {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + '万'
        }
        return num.toString()
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    render(data) {
        const { user, latestVideo, popularVideo, stats, options } = data
        const { width, height } = this

        // 主题CSS样式
        const styles = `
      <style>
        .card {
          font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
          fill: #1a1a1a;
        }
        .header {
          fill: #00a1d6;
        }
        .stat-item {
          font-size: 12px;
          fill: #666;
        }
        .video-title {
          font-size: 13px;
          font-weight: 500;
        }
        .signature {
          font-size: 12px;
          fill: #888;
          font-style: italic;
        }
      </style>
    `

        // 构建SVG
        let svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        ${styles}
        <rect width="100%" height="100%" fill="#ffffff" rx="8" ry="8" stroke="#e5e5e5" stroke-width="1"/>
        
        <!-- 用户信息区域 -->
        <g transform="translate(20, 20)">
          <!-- 头像 -->
          <defs>
            <clipPath id="avatarClip">
              <circle cx="40" cy="40" r="40"/>
            </clipPath>
          </defs>
          <image href="${user.face}" x="0" y="0" width="80" height="80" clip-path="url(#avatarClip)"/>
          
          <!-- 用户名和等级 -->
          <text x="100" y="30" font-size="20" font-weight="bold">${user.name}</text>
          <rect x="100" y="40" width="40" height="20" rx="4" ry="4" fill="#00a1d6"/>
          <text x="120" y="55" text-anchor="middle" fill="white" font-size="12">LV${user.level}</text>
          
          <!-- 签名（条件显示） -->
          ${options.showSignature && user.sign ? `
            <text x="100" y="80" class="signature" width="400">${this.truncateText(user.sign, 40)}</text>
          ` : ''}
        </g>
        
        <!-- 统计数据区域 -->
        ${options.showStats ? `
          <g transform="translate(20, 120)">
            <text class="stat-item">投稿数: ${stats.totalVideos}</text>
          </g>
        ` : ''}
        
        <!-- 最新视频（条件显示） -->
        ${options.showLatestVideo && latestVideo ? `
          <g transform="translate(20, 160)">
            <rect width="240" height="60" fill="#f8f9fa" rx="4" ry="4"/>
            <text x="10" y="20" class="video-title">最新: ${this.truncateText(latestVideo.title, 30)}</text>
            <text x="10" y="40" class="stat-item">
              播放: ${this.formatNumber(latestVideo.play_count)} | 
              时长: ${this.formatTime(latestVideo.duration)}
            </text>
          </g>
        ` : ''}
        
        <!-- 最热视频（条件显示） -->
        ${options.showPopularVideo && popularVideo ? `
          <g transform="translate(280, 160)">
            <rect width="240" height="60" fill="#f8f9fa" rx="4" ry="4"/>
            <text x="10" y="20" class="video-title">最热: ${this.truncateText(popularVideo.title, 30)}</text>
            <text x="10" y="40" class="stat-item">
              播放: ${this.formatNumber(popularVideo.play_count)} | 
              时长: ${this.formatTime(popularVideo.duration)}
            </text>
          </g>
        ` : ''}
      </svg>
    `

        return svg
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text
        return text.substring(0, maxLength) + '...'
    }
}

module.exports = new DefaultTheme()