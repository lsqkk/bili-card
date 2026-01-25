// lib/themes/blue.js - 更新版（使用实际的获赞数）
const generateSVG = (data, theme = 'light') => {
  // 蓝色主题固定调色板
  const palette = {
    bgGradientStart: '#F6F8FC',
    bgGradientMiddle: '#ABC0E4',
    bgGradientEnd: '#C7D5ED',
    strokeColor: '#8FAADC',
    textColor: '#2F5597',
    cardBg: '#FFFFFF',
    accentColor: '#2F5597',
    shadowColor: 'rgba(0,0,0,0.15)'
  };

  const formatNum = (v) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v;

  // 分割签名文本为三行
  const splitSignature = (signature) => {
    const maxLength = 12; // 每行最大字符数
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

  // 分割视频标题为两行
  const splitVideoTitle = (title) => {
    const maxLength = 15; // 每行最大字符数
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
  const videoTitleLines = data.video ? splitVideoTitle(data.video.title) : ['在此填入最新视频的标题，在此填', '入最新视频的标题。找规律，行距为628-573'];

  // 获取等级图标文件名 - 假设有 lv1.svg 到 lv6.svg 在 assets 目录
  const levelIcon = `LV${Math.min(data.level, 6)}.svg`; // 限制最高6级


  return `
<svg width="1945" height="894" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" overflow="hidden">
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
        <filter id="fx1" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse">
            <feComponentTransfer color-interpolation-filters="sRGB">
                <feFuncR type="discrete" tableValues="0 0" />
                <feFuncG type="discrete" tableValues="0 0" />
                <feFuncB type="discrete" tableValues="0 0" />
                <feFuncA type="linear" slope="0.4" intercept="0" />
            </feComponentTransfer>
            <feGaussianBlur stdDeviation="6.11111 6.11111" />
        </filter>
        <radialGradient cx="5375564" cy="2463339" r="5913098" gradientUnits="userSpaceOnUse" spreadMethod="pad" id="fill2" gradientTransform="matrix(0.000360892 0 0 0.000360892 0.499836 0.499836)">
            <stop offset="0" stop-color="${palette.bgGradientStart}" />
            <stop offset="0.74" stop-color="${palette.bgGradientMiddle}" />
            <stop offset="0.83" stop-color="${palette.bgGradientMiddle}" />
            <stop offset="1" stop-color="${palette.bgGradientEnd}" />
        </radialGradient>
        <clipPath id="clip3">
            <path d="M0 450272C-5.73258e-11 201594 201594-5.73257e-11 450273-1.14651e-10 698952-2.29303e-10 900546 201594 900546 450272 900546 698951 698952 900545 450273 900545 201594 900545-2.86629e-10 698951 0 450272Z" fill-rule="evenodd" clip-rule="evenodd" />
        </clipPath>
        <image width="465" height="465" xlink:href="${data.face}" preserveAspectRatio="none" id="img4"></image>
        <clipPath id="clip5">
            <path d="M74.9999 285.5C74.9999 195.754 147.754 123 237.5 123 327.246 123 400 195.754 400 285.5 400 375.246 327.246 448 237.5 448 147.754 448 74.9999 375.246 74.9999 285.5Z" fill-rule="evenodd" clip-rule="evenodd" />
        </clipPath>

        <clipPath id="clip7">
            <path d="M19.7228 102.433C19.7228 56.7533 56.7534 19.7227 102.433 19.7227L683.013 19.7227C728.692 19.7227 765.723 56.7533 765.723 102.433L765.723 356.012C765.723 401.692 728.692 438.723 683.013 438.723L102.433 438.723C56.7534 438.723 19.7228 401.692 19.7228 356.012Z" fill-rule="evenodd" clip-rule="evenodd" />
        </clipPath>
        <image width="1017" height="572" xlink:href="${data.video ? data.video.cover : ''}" preserveAspectRatio="none" id="img8"></image>
        <clipPath id="clip9">
            <path d="M1134 146.71C1134 101.031 1171.03 63.9999 1216.71 63.9999L1797.29 63.9999C1842.97 63.9999 1880 101.031 1880 146.71L1880 400.29C1880 445.969 1842.97 483 1797.29 483L1216.71 483C1171.03 483 1134 445.969 1134 400.29Z" fill-rule="evenodd" clip-rule="evenodd" />
        </clipPath>
    </defs>
    <g transform="translate(2 2)">
        <path d="M0.499836 115.981C0.499836 52.2027 52.2026 0.499836 115.981 0.499836L1825.02 0.499836C1888.8 0.499836 1940.5 52.2027 1940.5 115.981L1940.5 774.019C1940.5 837.797 1888.8 889.5 1825.02 889.5L115.981 889.5C52.2026 889.5 0.499836 837.797 0.499836 774.019Z" stroke="${palette.strokeColor}" stroke-width="4.58333" stroke-miterlimit="8" fill="url(#fill2)" fill-rule="evenodd" />
        <g filter="url(#fx0)" transform="translate(65 113)">
            <g>
                <g clip-path="url(#clip3)" transform="matrix(0.000360892 0 0 0.000360892 19.7227 19.7228)">
                    <rect x="-2.91038e-11" y="-1.14651e-10" width="900546" height="900545" fill="#FF0000" />
                </g>
            </g>
        </g>
        <g clip-path="url(#clip5)">
            <use width="100%" height="100%" xlink:href="#img4" transform="matrix(0.698925 0 0 0.698924 74.9999 123)">
            </use>
        </g>
        <text fill="${palette.textColor}" font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="700" font-size="73" transform="matrix(1 0 0 1 463.608 169)">${data.name}</text>
        <text fill="${palette.textColor}" font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="400" font-size="46" transform="matrix(1 0 0 1 153.121 766)">关注</text>
        <text fill="${palette.textColor}" font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="400" font-size="46" transform="matrix(1 0 0 1 454.763 765)">粉丝</text>
        <text fill="${palette.textColor}" font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="400" font-size="46" transform="matrix(1 0 0 1 800.283 766)">获赞</text>
        <text font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="700" font-size="83" transform="matrix(1 0 0 1 143.955 683)">${formatNum(data.following)}</text>
        <text font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="700" font-size="83" transform="matrix(1 0 0 1 445.597 683)">${formatNum(data.follower)}</text>
        <text font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="700" font-size="83" transform="matrix(1 0 0 1 791.117 683)">${formatNum(data.like)}</text>
        <text font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="400" font-size="50" transform="matrix(1 0 0 1 463.607 290)">${signatureLines[0]}</text>
        <text font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="400" font-size="50" transform="matrix(1 0 0 1 463.607 381)">${signatureLines[1]}</text>
        <text font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="400" font-size="50" transform="matrix(1 0 0 1 463.607 472)">${signatureLines[2]}</text>
        


                <!-- 等级图标 -->
        <g transform="translate(405 483)">
            <!-- 使用实际的等级SVG文件 -->
            ${data.level >= 0 && data.level <= 6 ? `
                <image 
                    x="0" 
                    y="0" 
                    width="60" 
                    height="30" 
                    xlink:href="/assets/lv${data.level}${data.level === 6 ? '_Lightning' : ''}.svg"
                    preserveAspectRatio="xMidYMid meet"
                />
            ` : `
                <!-- 如果等级不在0-6范围内，显示默认等级徽章 -->
                <rect width="60" height="30" rx="15" fill="${palette.accentColor}" />
                <text x="30" y="21" text-anchor="middle" font-family="Microsoft YaHei" font-weight="700" font-size="16" fill="white">LV${data.level}</text>
            `}
        </g>
        
        ${data.video ? `
        <g filter="url(#fx1)" transform="translate(1124 54)">
            <g>
                <g clip-path="url(#clip7)">
                    <use width="100%" height="100%" xlink:href="#img8" transform="matrix(0.73353 0 0 0.732518 19.7228 19.7227)"></use>
                </g>
            </g>
        </g>
        <g clip-path="url(#clip9)">
            <use width="100%" height="100%" xlink:href="#img8" transform="matrix(0.73353 0 0 0.732518 1134 63.9999)">
            </use>
        </g>
        <text font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="400" font-size="46" transform="matrix(1 0 0 1 1138.44 573)">${videoTitleLines[0]}</text>
        <text font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="400" font-size="46" transform="matrix(1 0 0 1 1138.44 628)">${videoTitleLines[1]}</text>
        ` : ''}
        
        <text fill="${palette.accentColor}" font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="700" font-size="73" transform="matrix(1 0 0 1 1553.46 729)">最新视频</text>
        <text fill="${palette.accentColor}" font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="400" font-size="37" transform="matrix(1 0 0 1 1558.33 822)">bili</text>
        <text fill="${palette.accentColor}" font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="400" font-size="37" transform="matrix(1 0 0 1 1611.04 822)">-</text>
        <text fill="${palette.accentColor}" font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif" font-weight="400" font-size="37" transform="matrix(1 0 0 1 1627.08 822)">card © 2026</text>
    </g>
</svg>
  `;
};

// 使用默认的错误SVG或创建新的
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