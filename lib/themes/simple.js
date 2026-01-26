const { formatNum, splitText, renderLevelIcon } = require('../utils/common');
const { generateStyles } = require('../utils/styleGenerator');

const generateSVG = (data, palette) => {

    const SIG = {
        maxLength: 16,
        maxLines: 3
    };

    const styleConfig = {
        colors: {},
        textStyles: {
            title: {
                fontWeight: '700',
                fontSize: 37,
                colorType: 'textColor'
            },
            label: {
                fontWeight: '400',
                fontSize: 23,
                colorType: 'textColor'
            },
            stat: {
                fontWeight: '700',
                fontSize: 41,
                colorType: 'textColor2'
            },
            signature: {
                fontWeight: '400',
                fontSize: 18,
                colorType: 'textColor2'
            },
            footer: {
                fontWeight: '400',
                fontSize: 14,
                colorType: 'accentColor'
            }
        }
    };

    const signatureLines = splitText(data.sign, SIG.maxLength, SIG.maxLines);
    const styleString = generateStyles(palette, styleConfig);

    return `
<svg width="587" height="311" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" overflow="hidden">
    <defs>
        <style type="text/css">
            ${styleString}
        </style>
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
        <text class="title" transform="matrix(1 0 0 1 1256.86 425)">${data.name}</text>
        <text class="label" transform="matrix(1 0 0 1 1110.77 594)">粉丝</text>
        <text class="label" transform="matrix(1 0 0 1 1352.01 594)">获赞</text>
        <text class="stat" transform="matrix(1 0 0 1 1182.58 593)">${formatNum(data.follower)}</text>
        <text class="stat" transform="matrix(1 0 0 1 1428.41 592)">${formatNum(data.like)}</text>
        <text class="signature" transform="matrix(1 0 0 1 1260.11 472)">${signatureLines[0]}</text>
        <text class="signature" transform="matrix(1 0 0 1 1260.11 494)">${signatureLines[1]}</text>
        <text class="signature" transform="matrix(1 0 0 1 1260.11 516)">${signatureLines[2]}</text>
        <g transform="translate(1190 520)">
            ${renderLevelIcon(data.level, data.levelIcon, palette.accentColor)}
        </g>
        <text class="footer" font-family="Microsoft YaHei,Microsoft YaHei_MSFontService,sans-serif"
            transform="matrix(1 0 0 1 1492.97 639)">bili</text>
        <text class="footer" transform="matrix(1 0 0 1 1511.88 639)">-</text>
        <text class="footer" transform="matrix(1 0 0 1 1517.61 639)">card © 2026</text>
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

module.exports = { generateSVG };