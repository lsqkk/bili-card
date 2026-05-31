// lib/utils/styleGenerator.js
// Palette 结构定义见 lib/colors/palette-schema.js

const REQUIRED_PALETTE_KEYS = [
    'bgGradientStart', 'bgGradientMiddle', 'bgGradientEnd',
    'strokeColor', 'textColor', 'textColor2',
    'cardBg', 'accentColor', 'shadowColor'
];

const validatePalette = (palette) => {
    if (!palette || typeof palette !== 'object') {
        throw new Error(`Invalid palette: expected an object, got ${typeof palette}`);
    }
    const missing = REQUIRED_PALETTE_KEYS.filter(key => !(key in palette));
    if (missing.length > 0) {
        throw new Error(
            `Palette missing required keys: ${missing.join(', ')}. ` +
            `All palette modules must define: ${REQUIRED_PALETTE_KEYS.join(', ')}`
        );
    }
    // Warn if any value is empty
    REQUIRED_PALETTE_KEYS.forEach(key => {
        if (!palette[key] && palette[key] !== '') {
            console.warn(`Palette key "${key}" has an empty/falsy value: "${palette[key]}"`);
        }
    });
};

const generateStyles = (palette, themeConfig) => {
    const { textStyles } = themeConfig;

    let css = '';
    Object.entries(textStyles).forEach(([className, style]) => {
        css += `
        .${className} {
            font-weight: ${style.fontWeight};
            font-size: ${style.fontSize}px;
            fill: ${palette?.[style.colorType] || style.fill || '#000'};
        }`;
    });

    // 统一入场动画（所有主题自动生效，无需修改模板）
    // 注意：只使用 opacity，不用 CSS transform 以避免覆盖 SVG transform 属性
    css += `

        @keyframes biliFadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
        text, image, use {
            animation: biliFadeIn 0.55s ease-out forwards;
        }`;

    // 逐类微延迟，形成级联浮现效果
    const staggerMap = {
        title: 0.05,
        label: 0.15,
        stat: 0.2,
        signature: 0.25,
        'video-title': 0.3,
        'video-label': 0.3,
        footer: 0.4
    };
    Object.entries(textStyles).forEach(([className]) => {
        const delay = staggerMap[className];
        if (delay !== undefined) {
            css += `
        .${className} { animation-delay: ${delay}s; }`;
        }
    });

    // stat 数字由 SMIL 完全控制（计数闪现 + 最终可见），CSS 不参与任何动画
    css += `
        .stat { animation: none; }`;

    return css.trim();
};

module.exports = { generateStyles, validatePalette };