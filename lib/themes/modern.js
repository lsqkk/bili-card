// modern.js
const generateSVG = (data, palette) => {

    const formatNum = (v) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v;

    // 分割签名文本为两行（modern模板为两行）
    const splitSignature = (signature) => {
        const maxLength = 16; // 每行最大字符数
        const lines = [];

        if (!signature || signature.length <= maxLength) {
            lines.push(signature || '');
            lines.push('');
            return lines;
        }

        // 简单分割逻辑
        let remaining = signature;
        for (let i = 0; i < 2; i++) {
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

        return lines;
    };

    // 分割视频标题为两行
    const splitVideoTitle = (title) => {
        const maxLength = 18; // 每行最大字符数
        const lines = [];

        if (!title || title.length <= maxLength) {
            lines.push(title || '');
            lines.push('');
            return lines;
        }

        // 简单分割逻辑
        let slicePoint = maxLength;
        for (let i = maxLength; i > 0; i--) {
            if (/[，。,.!?;；]/.test(title[i]) || title[i] === ' ') {
                slicePoint = i + 1;
                break;
            }
        }

        lines.push(title.slice(0, slicePoint));
        lines.push(title.slice(slicePoint));

        return lines;
    };

    const signatureLines = splitSignature(data.sign);
    const videoTitleLines = data.video ? splitVideoTitle(data.video.title) : ['最新视频标题第一行，最大', '标题第二行，同样'];

    return `
<svg width="885" height="535" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" overflow="hidden">
    <defs>
        <image width="233" height="233" xlink:href="${data.face}" preserveAspectRatio="none" id="img0"></image>
        <clipPath id="clip1">
            <path
                d="M38.0002 416.5C38.0002 375.907 71.131 343 112 343 152.869 343 186 375.907 186 416.5 186 457.093 152.869 490 112 490 71.131 490 38.0002 457.093 38.0002 416.5Z"
                fill-rule="evenodd" clip-rule="evenodd" />
        </clipPath>
        <image width="509" height="286" xlink:href="${data.video ? data.video.cover : ''}" preserveAspectRatio="none" id="img2"></image>
        <clipPath id="clip3">
            <path
                d="M388 107.235C388 101.582 392.583 96.9999 398.235 96.9999L739.765 96.9999C745.418 96.9999 750 101.582 750 107.235L750 289.765C750 295.418 745.418 300 739.765 300L398.235 300C392.583 300 388 295.418 388 289.765Z"
                fill-rule="evenodd" clip-rule="evenodd" />
        </clipPath>
    </defs>
    <g transform="translate(1 1)">
        <path
            d="M0.499836 16.0713C0.499836 7.47144 7.47143 0.499836 16.0713 0.499836L776.928 0.499836C785.528 0.499836 792.5 7.47144 792.5 16.0713L792.5 516.928C792.5 525.528 785.528 532.5 776.928 532.5L16.0713 532.5C7.47143 532.5 0.499836 525.528 0.499836 516.928Z"
            stroke="${palette.strokeColor}" stroke-width="3.4375" stroke-miterlimit="8" fill="${palette.cardBg}" fill-rule="evenodd" />
        <g clip-path="url(#clip1)">
            <use width="100%" height="100%" xlink:href="#img0" transform="matrix(0.635192 0 0 0.6309 38.0002 343)">
            </use>
        </g>
        <path
            d="M112 341.849 127.142 343.365 141.249 347.714 154.015 354.596 165.137 363.711 174.314 374.759 181.245 387.44 185.625 401.456 187.152 416.5 185.625 431.544 181.245 445.559 174.314 458.241 165.137 469.289 154.015 478.403 141.249 485.286 127.142 489.635 112 491.151 96.8584 489.635 82.7511 485.286 69.9851 478.403 58.863 469.289 49.6859 458.241 42.7556 445.559 38.3753 431.544 36.8484 416.5 38.3753 401.456 42.7556 387.44 49.6859 374.759 58.863 363.711 69.9851 354.596 82.7511 347.714 96.8584 343.365Z"
            stroke="${palette.strokeColor}" stroke-width="2.29167" stroke-linejoin="round" stroke-miterlimit="10" fill="none"
            fill-rule="evenodd" />
        <text fill="${palette.textColor}" font-weight="700" font-size="46"
            transform="matrix(1 0 0 1 217.586 397)">${data.name}</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="28"
            transform="matrix(1 0 0 1 39.8891 76)">关注</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="28"
            transform="matrix(1 0 0 1 39.8891 174)">粉丝</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="28"
            transform="matrix(1 0 0 1 39.8891 276)">获赞</text>
        <text fill="${palette.textColor2}" font-weight="700" font-size="46"
            transform="matrix(1 0 0 1 136.15 78)">${formatNum(data.following)}</text>
        <text fill="${palette.textColor2}" font-weight="700" font-size="46"
            transform="matrix(1 0 0 1 136.15 175)">${formatNum(data.follower)}</text>
        <text fill="${palette.textColor2}" font-weight="700" font-size="46"
            transform="matrix(1 0 0 1 136.15 278)">${formatNum(data.like)}</text>
        <text fill="${palette.textColor2}" font-weight="400" font-size="23"
            transform="matrix(1 0 0 1 223.781 449)">${signatureLines[0]}</text>
        <text fill="${palette.textColor2}" font-weight="400" font-size="23"
            transform="matrix(1 0 0 1 223.781 477)">${signatureLines[1]}</text>
        <g transform="translate(145 450)">
            ${data.level >= 0 && data.level <= 6 ? `
                <image 
                    x="0" 
                    y="0" 
                    width="60" 
                    height="30" 
                    xlink:href="${data.levelIcon}"
                    preserveAspectRatio="xMidYMid meet"
                />
            ` : `
                <rect width="60" height="30" rx="15" fill="${palette.accentColor}" />
                <text x="30" y="21" text-anchor="middle" font-family="Microsoft YaHei" font-weight="700" font-size="16" fill="white">LV${data.level}</text>
            `}
        </g>
        <g clip-path="url(#clip3)">
            <use width="100%" height="100%" xlink:href="#img2" transform="matrix(0.711198 0 0 0.709791 388 96.9999)">
            </use>
        </g>
        <path
            d="M398.121 95.8541 739.879 95.8541 744.2 96.7264 747.828 99.1724 750.274 102.8 751.146 107.121 751.146 289.879 750.274 294.2 747.828 297.828 744.2 300.274 739.879 301.146 398.121 301.146 393.8 300.274 390.173 297.828 387.727 294.2 386.854 289.879 386.854 107.121 387.727 102.8 390.173 99.1724 393.8 96.7264Z"
            stroke="${palette.strokeColor}" stroke-width="2.29167" stroke-linejoin="round" stroke-miterlimit="10" fill="none"
            fill-rule="evenodd" />
        <text fill="${palette.textColor2}" font-weight="400" font-size="18"
            transform="matrix(1 0 0 1 390.744 56)">${videoTitleLines[0]}</text>
        <text fill="${palette.textColor2}" font-weight="400" font-size="18"
            transform="matrix(1 0 0 1 390.744 78)">${videoTitleLines[1]}</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="18"
            transform="matrix(1 0 0 1 623.165 513)">bili</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="18"
            transform="matrix(1 0 0 1 650.092 513)">-</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="18"
            transform="matrix(1 0 0 1 658.112 513)">card © 2026</text>
        <text fill="${palette.textColor}" font-weight="700" font-size="23"
            transform="matrix(1 0 0 1 658.004 337)">最新视频</text>
    </g>
</svg>
  `;
};

// 错误SVG函数（与default.js保持一致）
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

module.exports = { generateSVG, sendErrorSVG };