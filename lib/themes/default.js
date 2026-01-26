const { formatNum, splitText, renderLevelIcon } = require('../utils/common');
const { generateStyles } = require('../utils/styleGenerator');

const generateSVG = (data, palette) => {
    const SIG = {
        maxLength: 12,
        maxLines: 3
    };
    const VID = {
        maxLength: 15,
        maxLines: 2
    };

    const styleConfig = {
        colors: {},
        textStyles: {
            title: {
                fontWeight: '700',
                fontSize: 73,
                colorType: 'textColor'
            },
            label: {
                fontWeight: '400',
                fontSize: 46,
                colorType: 'textColor'
            },
            stat: {
                fontWeight: '700',
                fontSize: 83,
                colorType: 'textColor2'
            },
            signature: {
                fontWeight: '400',
                fontSize: 50,
                colorType: 'textColor2'
            },
            'video-title': {
                fontWeight: '400',
                fontSize: 46,
                colorType: 'textColor2'
            },
            footer: {
                fontWeight: '400',
                fontSize: 37,
                colorType: 'accentColor'
            },
            'video-label': {
                fontWeight: '700',
                fontSize: 73,
                colorType: 'textColor'
            }
        }
    };

    const signatureLines = splitText(data.sign, SIG.maxLength, SIG.maxLines);
    const videoTitleLines = splitText(data.video?.title || '', VID.maxLength, VID.maxLines);
    const styleString = generateStyles(palette, styleConfig);

    return `
<svg width="1945" height="894" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" overflow="hidden">
    <defs>
        <style type="text/css">
            ${styleString}
        </style>
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
        <text class="title" transform="matrix(1 0 0 1 463.608 169)">${data.name}</text>
        <text class="label" transform="matrix(1 0 0 1 103.121 766)">关注</text>
        <text class="label" transform="matrix(1 0 0 1 354.763 766)">粉丝</text>
        <text class="label" transform="matrix(1 0 0 1 750.283 766)">获赞</text>
        <text class="stat" transform="matrix(1 0 0 1 93.955 683)">${formatNum(data.following)}</text>
        <text class="stat" transform="matrix(1 0 0 1 345.597 683)">${formatNum(data.follower)}</text>
        <text class="stat" transform="matrix(1 0 0 1 741.117 683)">${formatNum(data.like)}</text>
        <text class="signature" transform="matrix(1 0 0 1 463.607 290)">${signatureLines[0]}</text>
        <text class="signature" transform="matrix(1 0 0 1 463.607 381)">${signatureLines[1]}</text>
        <text class="signature" transform="matrix(1 0 0 1 463.607 472)">${signatureLines[2]}</text>
        
        <g transform="translate(290 420)">
            ${renderLevelIcon(data.level, data.levelIcon, palette.accentColor)}
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
        <text class="video-title" transform="matrix(1 0 0 1 1138.44 573)">${videoTitleLines[0]}</text>
        <text class="video-title" transform="matrix(1 0 0 1 1138.44 628)">${videoTitleLines[1]}</text>
        ` : ''}
        
        <text class="video-label" transform="matrix(1 0 0 1 1553.46 729)">最新视频</text>
        <text class="footer" transform="matrix(1 0 0 1 1558.33 822)">bili</text>
        <text class="footer" transform="matrix(1 0 0 1 1611.04 822)">-</text>
        <text class="footer" transform="matrix(1 0 0 1 1627.08 822)">card © 2026</text>
    </g>
</svg>
  `;
};

module.exports = { generateSVG };