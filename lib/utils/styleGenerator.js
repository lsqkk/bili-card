// lib/utils/styleGenerator.js

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

    return css.trim();
};

module.exports = { generateStyles, validatePalette };