# 贡献指南

欢迎贡献 bili-card！本文档帮助你快速上手。

## 开发环境

- Node.js 20+
- 无需安装依赖（零依赖项目）

```bash
git clone <your-fork>
cd bili-card
npm run dev  # 启动本地开发服务器 http://localhost:3000
```

## 你可以贡献什么

### 新配色方案
1. 在 `lib/colors/` 下新建文件，参考 `white.js` 导出 `{ palette }`
2. 在 `lib/config/themes-colors.json` 的 `colors` 数组添加条目
3. 在 `lib/config/themes-colors.json` 中每个主题的 `compatibility.colors` 添加新配色 ID

### 新主题
1. 在 `lib/themes/` 下新建文件，导出 `generateSVG(data, palette)` 函数
2. SVG 中所有 `<svg>` 标签必须包含 `width`、`height`、`viewBox`
3. 图片标签同时使用 `href` 和 `xlink:href` 属性
4. 用户文本必须通过 `esc()` 转义
5. 在 `lib/config/themes-colors.json` 的 `themes` 数组添加条目（填写实际 SVG 尺寸）
6. 在 `dev-server.js` 的 `THEMES` 数组添加主题 ID

### 修复 bug 或优化
- 确保 `npm test` 全部通过
- 尽量保持零依赖

## PR 流程

1. Fork 仓库并创建分支
2. 提交改动
3. 确保 CI 通过
4. 提交 PR

## 代码规范

- 纯 JavaScript，不使用 TypeScript
- 不引入外部依赖（零依赖原则）
- 函数保持聚焦（<50行）
- 用户输入必须转义（使用 `esc()`）

## 问题反馈

提交 [Issue](https://github.com/lsqkk/bili-card/issues) 时请附上：
- 使用的 UID、主题、配色
- 完整的报错信息或截图
- 如果是功能建议，描述使用场景
