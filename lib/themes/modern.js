const { formatNum, splitText, renderLevelIcon } = require('../utils/common');
const { generateStyles } = require('../utils/styleGenerator');

const generateSVG = (data, palette) => {
    const SIG = {
        maxLength: 16,
        maxLines: 2
    };
    const VID = {
        maxLength: 18,
        maxLines: 2
    };

    const styleConfig = {
        colors: {},
        textStyles: {
            title: {
                fontWeight: '700',
                fontSize: 46,
                colorType: 'textColor'
            },
            label: {
                fontWeight: '400',
                fontSize: 28,
                colorType: 'textColor'
            },
            stat: {
                fontWeight: '700',
                fontSize: 46,
                colorType: 'textColor2'
            },
            signature: {
                fontWeight: '400',
                fontSize: 23,
                colorType: 'textColor2'
            },
            'video-title': {
                fontWeight: '400',
                fontSize: 18,
                colorType: 'textColor2'
            },
            footer: {
                fontWeight: '400',
                fontSize: 18,
                colorType: 'accentColor'
            },
            'video-label': {
                fontWeight: '700',
                fontSize: 23,
                colorType: 'textColor'
            }
        }
    };

    const signatureLines = splitText(data.sign, SIG.maxLength, SIG.maxLines);
    const videoTitleLines = splitText(data.video?.title || '', VID.maxLength, VID.maxLines);
    const styleString = generateStyles(palette, styleConfig);

    return `
<svg width="885" height="535" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" overflow="hidden">
    <defs>
        <style type="text/css">
            ${styleString}
        </style>
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
        <text class="title" transform="matrix(1 0 0 1 217.586 397)">${data.name}</text>
        <text class="label" transform="matrix(1 0 0 1 39.8891 76)">关注</text>
        <text class="label" transform="matrix(1 0 0 1 39.8891 174)">粉丝</text>
        <text class="label" transform="matrix(1 0 0 1 39.8891 276)">获赞</text>
        <text class="stat" transform="matrix(1 0 0 1 136.15 78)">${formatNum(data.following)}</text>
        <text class="stat" transform="matrix(1 0 0 1 136.15 175)">${formatNum(data.follower)}</text>
        <text class="stat" transform="matrix(1 0 0 1 136.15 278)">${formatNum(data.like)}</text>
        <text class="signature" transform="matrix(1 0 0 1 223.781 449)">${signatureLines[0]}</text>
        <text class="signature" transform="matrix(1 0 0 1 223.781 477)">${signatureLines[1]}</text>
        <g transform="translate(145 450)">
            ${renderLevelIcon(data.level, data.levelIcon, palette.accentColor)}
        </g>
        <g clip-path="url(#clip3)">
            <use width="100%" height="100%" xlink:href="#img2" transform="matrix(0.711198 0 0 0.709791 388 96.9999)">
            </use>
        </g>
        <path
            d="M398.121 95.8541 739.879 95.8541 744.2 96.7264 747.828 99.1724 750.274 102.8 751.146 107.121 751.146 289.879 750.274 294.2 747.828 297.828 744.2 300.274 739.879 301.146 398.121 301.146 393.8 300.274 390.173 297.828 387.727 294.2 386.854 289.879 386.854 107.121 387.727 102.8 390.173 99.1724 393.8 96.7264Z"
            stroke="${palette.strokeColor}" stroke-width="2.29167" stroke-linejoin="round" stroke-miterlimit="10" fill="none"
            fill-rule="evenodd" />
        <text class="video-title" transform="matrix(1 0 0 1 390.744 56)">${videoTitleLines[0]}</text>
        <text class="video-title" transform="matrix(1 0 0 1 390.744 78)">${videoTitleLines[1]}</text>
        <text class="footer" transform="matrix(1 0 0 1 623.165 513)">bili</text>
        <text class="footer" transform="matrix(1 0 0 1 650.092 513)">-</text>
        <text class="footer" transform="matrix(1 0 0 1 658.112 513)">card © 2026</text>
        <text class="video-label" transform="matrix(1 0 0 1 658.004 337)">最新视频</text>
    </g>
</svg>
  `;
};

module.exports = { generateSVG };