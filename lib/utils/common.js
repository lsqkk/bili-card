// lib/utils/common.js - 完整修正版

// 格式化数字
const formatNum = (v) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v;

// 通用文本分割函数（用于签名和视频标题）
const splitText = (text, maxLength, maxLines) => {
    const lines = [];

    if (!text || text.length <= maxLength) {
        lines.push(text || '');
        // 填充剩余行
        for (let i = 1; i < maxLines; i++) {
            lines.push('');
        }
        return lines;
    }

    let remaining = text;
    for (let i = 0; i < maxLines; i++) {
        if (remaining.length <= maxLength) {
            lines.push(remaining);
            remaining = '';
        } else {
            // 尝试在最后一个标点或空格处分行
            let slicePoint = maxLength;
            for (let j = maxLength; j > 0; j--) {
                if (/[，。,.!?;；]/.test(remaining[j]) || remaining[j] === ' ') {
                    slicePoint = j + 1;
                    break;
                }
            }
            lines.push(remaining.slice(0, slicePoint));
            remaining = remaining.slice(slicePoint);
        }
    }

    // 如果还有剩余文本，在最后一行添加省略号
    if (remaining.length > 0 && lines[maxLines - 1]) {
        lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…';
    }

    return lines;
};

// 统一的错误SVG生成
const sendErrorSVG = (res, code, msg) => {
    const svg = `
    <svg width="400" height="120" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="errorBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF1F0" />
          <stop offset="100%" stop-color="#FFE9E8" />
        </linearGradient>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600&amp;display=swap');
          .error-code { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 18px; }
          .error-msg { font-family: 'Inter', sans-serif; font-weight: 500; font-size: 14px; }
        </style>
      </defs>
      
      <rect width="400" height="120" rx="20" fill="url(#errorBg)"/>
      <circle cx="40" cy="60" r="20" fill="#FF4D4F" opacity="0.1"/>
      <path d="M30 50L50 70M30 70L50 50" stroke="#FF4D4F" stroke-width="2.5" stroke-linecap="round"/>
      <text x="70" y="55" fill="#FF4D4F" class="error-code">${code}</text>
      <text x="70" y="80" fill="#F5222D" class="error-msg">${msg}</text>
      <rect x="0.5" y="0.5" width="399" height="119" rx="19.5" stroke="#FFA39E" stroke-opacity="0.6"/>
    </svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svg);
};

// 通用的等级图标渲染逻辑
const renderLevelIcon = (level, levelIcon, accentColor) => {
    if (level >= 0 && level <= 6 && levelIcon) {
        return `<image 
            x="0" 
            y="0" 
            width="60" 
            height="30" 
            xlink:href="${levelIcon}"
            preserveAspectRatio="xMidYMid meet"
        />`;
    } else {
        return `<rect width="60" height="30" rx="15" fill="${accentColor}" />
                <text x="30" y="21" text-anchor="middle" font-family="Microsoft YaHei" font-weight="700" font-size="16" fill="white">LV${level}</text>`;
    }
};

module.exports = {
    formatNum,
    splitText,
    sendErrorSVG,
    renderLevelIcon
};