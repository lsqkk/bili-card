// btv.js
const generateSVG = (data, palette) => {

    const formatNum = (v) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v;

    // 分割签名文本为三行
    const splitSignature = (signature) => {
        const maxLength = 15; // 每行最大字符数
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

    // 视频标题为一行
    const splitVideoTitle = (title) => {
        const maxLength = 30; // 单行最大字符数
        return [title && title.length > maxLength ? title.slice(0, maxLength) + '...' : title || ''];
    };

    const signatureLines = splitSignature(data.sign);
    const videoTitleLines = data.video ? splitVideoTitle(data.video.title) : ['最新视频标题'];

    return `
<!-- 一行代码生成 B 站卡片 | 本卡片由 bili-card 开源项目生成 项目地址https://github.com/lsqkk/bili-card -->
<!-- 您只需要在引入图片 https://bili-card.lsqkk.space/api/card?uid=[您的B站UID] 即可，您可以访问本项目以查看更多您喜欢的主题和配色-->
<svg width="813" height="709" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" overflow="hidden">
    <defs>
        <filter id="fx0" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse">
            <feComponentTransfer color-interpolation-filters="sRGB">
                <feFuncR type="discrete" tableValues="0 0" />
                <feFuncG type="discrete" tableValues="0 0" />
                <feFuncB type="discrete" tableValues="0 0" />
                <feFuncA type="linear" slope="0.4" intercept="0" />
            </feComponentTransfer>
            <feGaussianBlur stdDeviation="6.11111 6.11111" />
        </filter>
        <clipPath id="clip1">
            <rect x="120" y="97" width="813" height="709" />
        </clipPath>
        <image width="1017" height="572" xlink:href="${data.video ? data.video.cover : ''}" preserveAspectRatio="none" id="img2"></image>
        <clipPath id="clip3">
            <path
                d="M286.89 191 766.109 191C846.683 191 912 256.318 912 336.891L912 626 141 626 141 336.891C141 256.318 206.317 191 286.89 191Z"
                fill-rule="evenodd" clip-rule="evenodd" />
        </clipPath>
        <linearGradient x1="526.5" y1="338" x2="526.5" y2="629" gradientUnits="userSpaceOnUse" spreadMethod="reflect" id="fill4">
            <stop offset="0" stop-color="${palette.cardBg}" stop-opacity="0" />
            <stop offset="0.51" stop-color="${palette.cardBg}" />
            <stop offset="1" stop-color="${palette.cardBg}" />
        </linearGradient>
        <clipPath id="clip5">
            <path
                d="M0 205047C-2.59289e-11 91802.7 91182.6-2.61052e-11 203662-5.22104e-11 316141-1.04421e-10 407324 91802.7 407324 205047 407324 318291 316141 410094 203662 410094 91182.6 410094-1.29644e-10 318291 0 205047Z"
                fill-rule="evenodd" clip-rule="evenodd" />
        </clipPath>
        <image width="233" height="233" xlink:href="${data.face}" preserveAspectRatio="none" id="img6"></image>
        <clipPath id="clip7">
            <path
                d="M184 473C184 432.131 216.907 399 257.5 399 298.093 399 331 432.131 331 473 331 513.869 298.093 547 257.5 547 216.907 547 184 513.869 184 473Z"
                fill-rule="evenodd" clip-rule="evenodd" />
        </clipPath>
    </defs>
    <g clip-path="url(#clip1)" transform="translate(-120 -97)">
        <path
            d="M131 337.432C131 251.037 201.037 181 287.432 181L765.568 181C851.963 181 922 251.037 922 337.432L922 621.568C922 707.963 851.963 778 765.568 778L287.432 778C201.037 778 131 707.963 131 621.568Z"
            stroke="${palette.strokeColor}" stroke-width="21.7708" stroke-miterlimit="8" fill="${palette.cardBg}" fill-rule="evenodd" />
        <path
            d="M286.89 191 766.109 191C846.683 191 912 256.318 912 336.891L912 626 141 626 141 336.891C141 256.318 206.317 191 286.89 191Z"
            fill="#FFFFFF" fill-rule="evenodd" />
        <g clip-path="url(#clip3)">
            <use width="100%" height="100%" xlink:href="#img2" transform="matrix(0.758112 0 0 0.760489 141 191)"></use>
        </g>
        <rect x="141" y="338" width="771" height="291" fill="url(#fill4)" />
        <g filter="url(#fx0)" transform="translate(168 383)">
            <g>
                <g clip-path="url(#clip5)" transform="matrix(0.000360892 0 0 0.000360892 25.7226 25.7228)">
                    <rect x="0" y="-5.22104e-11" width="407324" height="410094" fill="${palette.shadowColor || '#FF0000'}" />
                </g>
                <path
                    d="M99.2227 22.8435 114.613 24.4056 128.957 28.8885 141.934 35.9801 153.237 45.3688 162.561 56.7464 169.601 69.8063 174.051 84.2388 175.602 99.7227 174.051 115.207 169.601 129.639 162.561 142.699 153.237 154.077 141.934 163.465 128.957 170.557 114.613 175.04 99.2227 176.602 83.8321 175.04 69.4882 170.557 56.511 163.465 45.2087 154.077 35.8847 142.699 28.8439 129.639 24.3941 115.207 22.8437 99.7227 24.3941 84.2388 28.8439 69.8063 35.8847 56.7464 45.2087 45.3688 56.511 35.9801 69.4882 28.8885 83.8321 24.4056Z"
                    stroke="${palette.strokeColor}" stroke-width="6" stroke-linejoin="round" stroke-miterlimit="10" fill="none"
                    fill-rule="evenodd" />
            </g>
        </g>
        <g clip-path="url(#clip7)">
            <use width="100%" height="100%" xlink:href="#img6" transform="matrix(0.630902 0 0 0.635192 184 399)"></use>
        </g>
        <path
            d="M257.5 396.121 272.891 397.683 287.235 402.166 300.212 409.257 311.514 418.646 320.838 430.024 327.879 443.084 332.329 457.516 333.879 473 332.329 488.484 327.879 502.916 320.838 515.976 311.514 527.354 300.212 536.743 287.235 543.834 272.891 548.317 257.5 549.879 242.109 548.317 227.765 543.834 214.788 536.743 203.486 527.354 194.162 515.976 187.121 502.916 182.671 488.484 181.121 473 182.671 457.516 187.121 443.084 194.162 430.024 203.486 418.646 214.788 409.257 227.765 402.166 242.109 397.683Z"
            stroke="${palette.strokeColor}" stroke-width="5.72917" stroke-linejoin="round" stroke-miterlimit="10" fill="none"
            fill-rule="evenodd" />
        <text fill="${palette.textColor}" font-weight="700" font-size="46"
            transform="matrix(1 0 0 1 195.31 614)">${data.name}</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="23"
            transform="matrix(1 0 0 1 584.619 557)">关注</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="23"
            transform="matrix(1 0 0 1 584.619 639)">粉丝</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="23"
            transform="matrix(1 0 0 1 584.619 721)">获赞</text>
        <text fill="${palette.textColor2}" font-weight="700" font-size="41"
            transform="matrix(1 0 0 1 678.235 555)">${formatNum(data.following)}</text>
        <text fill="${palette.textColor2}" font-weight="700" font-size="41"
            transform="matrix(1 0 0 1 678.235 637)">${formatNum(data.follower)}</text>
        <text fill="${palette.textColor2}" font-weight="700" font-size="41"
            transform="matrix(1 0 0 1 678.235 718)">${formatNum(data.like)}</text>
        <text fill="${palette.textColor2}" font-weight="400" font-size="18"
            transform="matrix(1 0 0 1 195.309 659)">${signatureLines[0]}</text>
        <text fill="${palette.textColor2}" font-weight="400" font-size="18"
            transform="matrix(1 0 0 1 195.309 681)">${signatureLines[1]}</text>
        <text fill="${palette.textColor2}" font-weight="400" font-size="18"
            transform="matrix(1 0 0 1 195.309 703)">${signatureLines[2]}</text>
        <g transform="translate(330 540)">
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
        <text fill="${palette.textColor2}" font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif"
            font-weight="400" font-size="14" transform="matrix(1 0 0 1 359.801 519)">${videoTitleLines[0]}</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="18"
            transform="matrix(1 0 0 1 456.901 785)">bili</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="18"
            transform="matrix(1 0 0 1 483.829 785)">-</text>
        <text fill="${palette.textColor}" font-weight="400" font-size="18"
            transform="matrix(1 0 0 1 491.849 785)">card © 2026</text>
        <text fill="${palette.textColor}" font-weight="700" font-size="18"
            transform="matrix(1 0 0 1 359.801 494)">最新视频</text>
        <path
            d="M299.285 101.005C304.266 96.2348 312.171 96.4058 316.941 101.387L379.105 166.298C383.875 171.279 383.704 179.184 378.723 183.954L378.723 183.954C373.742 188.725 365.837 188.554 361.066 183.573L298.903 118.661C294.133 113.68 294.304 105.775 299.285 101.005Z"
            fill="${palette.strokeColor}" fill-rule="evenodd" />
        <path
            d="M0 12.4878C-1.82777e-15 5.59097 5.59096-1.82778e-15 12.4878-3.65555e-15L102.364 0C109.261-3.65555e-15 114.852 5.59097 114.852 12.4878L114.852 12.4878C114.852 19.3846 109.261 24.9756 102.364 24.9756L12.4878 24.9756C5.59096 24.9756 0 19.3846 0 12.4878Z"
            fill="${palette.strokeColor}" fill-rule="evenodd" transform="matrix(-0.691653 0.72223 0.72223 0.691653 747.227 92.3678)" />
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