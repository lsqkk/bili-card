// lib/utils/common.js - 完整修正版

// HTML 转义
const esc = (str) => {
  if (!str) return '';
  return str.toString().replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[m]));
};

// 有限大小的图片缓存（最多100项，超限时淘汰最旧）
class LimitedCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.set(key, value);
      return;
    }
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    this.cache.set(key, value);
  }

  delete(key) {
    this.cache.delete(key);
  }
}

const imageCache = new LimitedCache(100);

// 格式化数字
const formatNum = (v) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v;

// 通用文本分割函数（用于签名和视频标题），只返回有内容的行
const splitText = (text, maxLength, maxLines) => {
    const lines = [];

    if (!text) return [];

    if (text.length <= maxLength) {
        return [text];
    }

    let remaining = text;
    for (let i = 0; i < maxLines; i++) {
        if (!remaining) break;

        if (remaining.length <= maxLength) {
            lines.push(remaining);
            remaining = '';
        } else {
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

    if (remaining.length > 0 && lines.length > 0) {
        const last = lines[lines.length - 1];
        lines[lines.length - 1] = last.slice(0, -1) + '…';
    }

    return lines;
};

// 渲染多行文本到SVG（只渲染非空行）
const renderTextLines = (lines, className, x, y, lineHeight) => {
    return lines.map((line, i) =>
        `<text class="${className}" transform="matrix(1 0 0 1 ${x} ${y + i * lineHeight})">${esc(line)}</text>`
    ).join('\n        ');
};

// 统一的错误SVG生成
const sendErrorSVG = (res, code, msg, httpStatus = 200) => {
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
    res.status(httpStatus).send(svg);
};

// 通用的等级图标渲染逻辑
const renderLevelIcon = (level, levelIcon, accentColor) => {
    if (level <= 0) return '';
    if (level <= 6 && levelIcon) {
        return `<image
            x="0"
            y="0"
            width="60"
            height="30"
            xlink:href="${levelIcon}"
            preserveAspectRatio="xMidYMid meet"
        />`;
    }
    return `<rect width="60" height="30" rx="15" fill="${accentColor}" />
            <text x="30" y="21" text-anchor="middle" font-family="Microsoft YaHei" font-weight="700" font-size="16" fill="white">LV${level}</text>`;
};

module.exports = {
    esc,
    formatNum,
    splitText,
    sendErrorSVG,
    renderLevelIcon,
    imageCache,
    renderTextLines
};