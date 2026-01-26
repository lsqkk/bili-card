// simple.js
const generateSVG = (data, palette) => {

    const formatNum = (v) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v;

    // 分割签名文本为三行
    const splitSignature = (signature) => {
        const maxLength = 16; // 每行最大字符数
        const lines = [];

        if (!signature || signature.length <= maxLength) {
            lines.push(signature || '');
            lines.push('');
            lines.push('');
            return lines;
        }

        // 简单分割逻辑
        let remaining = signature;
        for (let i = 0; i < 3; i++) {
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

    const signatureLines = splitSignature(data.sign);

    return `
<svg width="587" height="311" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" overflow="hidden">
    <defs>
        <image width="233" height="233" xlink:href="${data.face}" preserveAspectRatio="none" id="img0"></image>
        <clipPath id="clip1">
            <path
                d="M1098 439.5C1098 403.325 1127.33 374 1163.5 374 1199.67 374 1229 403.325 1229 439.5 1229 475.675 1199.67 505 1163.5 505 1127.33 505 1098 475.675 1098 439.5Z"
                fill-rule="evenodd" clip-rule="evenodd" />
        </clipPath>
    </defs>
    <g transform="translate(-1064 -348)">
        <path
            d="M1065.5 358.223C1065.5 353.405 1069.41 349.5 1074.22 349.5L1598.78 349.5C1603.59 349.5 1607.5 353.405 1607.5 358.223L1607.5 638.777C1607.5 643.595 1603.59 647.5 1598.78 647.5L1074.22 647.5C1069.41 647.5 1065.5 643.595 1065.5 638.777Z"
            stroke="${palette.strokeColor}" stroke-width="3.4375" stroke-miterlimit="8" fill="${palette.cardBg}" fill-rule="evenodd" />
        <g clip-path="url(#clip1)">
            <use width="100%" height="100%" xlink:href="#img0" transform="matrix(0.562232 0 0 0.562232 1098 374)"></use>
        </g>
        <path
            d="M1163.5 372.848 1176.93 374.202 1189.44 378.086 1200.77 384.232 1210.63 392.371 1218.77 402.234 1224.91 413.557 1228.8 426.07 1230.15 439.5 1228.8 452.93 1224.91 465.443 1218.77 476.766 1210.63 486.629 1200.77 494.768 1189.44 500.914 1176.93 504.798 1163.5 506.152 1150.07 504.798 1137.56 500.914 1126.23 494.768 1116.37 486.629 1108.23 476.766 1102.09 465.443 1098.2 452.93 1096.85 439.5 1098.2 426.07 1102.09 413.557 1108.23 402.234 1116.37 392.371 1126.23 384.232 1137.56 378.086 1150.07 374.202Z"
            stroke="${palette.strokeColor}" stroke-width="2.29167" stroke-linejoin="round" stroke-miterlimit="10" fill="none"
            fill-rule="evenodd" />
        <text fill="${palette.textColor}" font-weight="700" font-size="37"
            transform="matrix(1 0 0 1 1256.86 425)">${data.name}</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="23"
            transform="matrix(1 0 0 1 1110.77 594)">粉丝</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="23"
            transform="matrix(1 0 0 1 1352.01 594)">获赞</text>
        <text fill="${palette.textColor2}" font-weight="700" font-size="41"
            transform="matrix(1 0 0 1 1182.58 593)">${formatNum(data.follower)}</text>
        <text fill="${palette.textColor2}" font-weight="700" font-size="41"
            transform="matrix(1 0 0 1 1428.41 592)">${formatNum(data.like)}</text>
        <text fill="${palette.textColor2}" font-weight="400" font-size="18"
            transform="matrix(1 0 0 1 1260.11 472)">${signatureLines[0]}</text>
        <text fill="${palette.textColor2}" font-weight="400" font-size="18"
            transform="matrix(1 0 0 1 1260.11 494)">${signatureLines[1]}</text>
        <text fill="${palette.textColor2}" font-weight="400" font-size="18"
            transform="matrix(1 0 0 1 1260.11 516)">${signatureLines[2]}</text>
        <g transform="translate(1190 520)">
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
        <text fill="${palette.textColor}" font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif"
            font-weight="400" font-size="14" transform="matrix(1 0 0 1 1492.97 639)">bili</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="14"
            transform="matrix(1 0 0 1 1511.88 639)">-</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="14"
            transform="matrix(1 0 0 1 1517.61 639)">card © 2026</text>
        <path d="M1258 443 1514 443" stroke="${palette.strokeColor}" stroke-width="2.29167" stroke-miterlimit="8" fill="none"
            fill-rule="evenodd" />
        <path d="M1169 576 1169 602.163" stroke="${palette.strokeColor}" stroke-width="2.29167" stroke-miterlimit="8" fill="none"
            fill-rule="evenodd" />
        <path d="M1410 576 1410 602.163" stroke="${palette.strokeColor}" stroke-width="2.29167" stroke-miterlimit="8" fill="none"
            fill-rule="evenodd" />
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