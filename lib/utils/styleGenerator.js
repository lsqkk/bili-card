// lib/utils/styleGenerator.js
const generateStyles = (palette, themeConfig) => {
    const { textStyles, colors } = themeConfig;

    let css = '';
    Object.entries(textStyles).forEach(([className, style]) => {
        css += `
        .${className} {
            font-weight: ${style.fontWeight};
            font-size: ${style.fontSize}px;
            fill: ${colors?.[style.colorType] || palette?.[style.colorType] || style.fill || '#000'};
        }`;
    });

    return css.trim();
};

module.exports = { generateStyles };