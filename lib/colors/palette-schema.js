/**
 * @typedef {Object} Palette
 * @property {string} bgGradientStart   - 背景渐变起始色
 * @property {string} bgGradientMiddle  - 背景渐变中间色
 * @property {string} bgGradientEnd     - 背景渐变结束色
 * @property {string} strokeColor       - 边框/描边色
 * @property {string} textColor         - 主文字色（标题/数值标签）
 * @property {string} textColor2        - 次要文字色（签名/视频标题）
 * @property {string} cardBg            - 卡片背景色
 * @property {string} accentColor       - 强调色（等级图标/页脚）
 * @property {string} shadowColor       - 阴影色
 *
 * 所有字段均为 CSS 颜色值（hex, rgba, 或命名色）。
 * 新增配色文件时复制此结构，所有 9 个字段必填。
 */

/**
 * @typedef {Object} ColorModule
 * @property {Palette} palette - 调色板对象
 */

/**
 * @typedef {Object} ThemeModule
 * @property {function(Object, Palette): string} generateSVG - 生成 SVG 卡片
 * @property {Object} [styleConfig] - 可选样式配置
 */

// 此文件仅用于 JSDoc 类型定义，无运行时导出
