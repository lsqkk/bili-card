# bili-card — 项目指南

## 项目概述

零依赖 B 站用户信息 SVG 卡片生成器。通过 API 获取 B 站用户数据，渲染为可嵌入的 SVG 卡片。

- **技术栈**: Node.js 20+ (纯 JavaScript, 无依赖, 无 TypeScript)
- **部署**: Vercel Serverless
- **许可证**: MIT

## 目录结构

```
api/
  card.js          # 核心 API: 获取 B 站数据 + 生成 SVG 卡片
  index.js         # 查询 API: 主题/配色列表、预览、详情
lib/
  themes/          # 卡片主题 (布局/结构)
    default.js     # 经典风格 (1945×894)
    modern.js      # 现代风格 (885×535)
    btv.js         # B站小电视风格 (813×709)
    simple.js      # 极简风格 (587×311)
  colors/          # 配色方案 (调色板)
    white.js       # 纯净白 (默认 fallback)
    blue.js        # B站蓝
    pink.js        # 樱花粉
    green.js       # 清新绿
    purple.js      # 优雅紫
    dark.js        # 深邃黑
  config/
    themes-colors.json  # 主题/配色元数据 (API 查询用)
  utils/
    common.js      # 工具函数: HTML转义、数字格式化、文字换行、错误SVG、等级图标渲染、图片缓存
    styleGenerator.js  # CSS 样式生成、palette 校验
    errors.js      # 错误 SVG (重新导出 common.sendErrorSVG)
    comments.js    # SVG 注释横幅
  rate-limit.js    # 内存滑动窗口限流 (单实例有效)
  level-icons.js   # 等级图标 base64 数据
assets/
  demo.svg         # README 示例卡片
  LV*.svg          # 等级图标源文件
test/
  utils.test.js    # 工具函数单元测试 (30 个用例)
.github/workflows/
  test.yml         # CI: push/PR 自动跑测试
```

## 核心架构

**请求流**: `GET /api/card?uid=X&theme=Y&color=Z` → api/card.js 获取 B 站数据 → 加载 theme 和 color 模块 → 生成 SVG → 返回

**主题系统**: 主题 (布局) 与配色 (色彩) 分离。每个 theme 导出一个 `generateSVG(data, palette)` 函数；每个 color 导出一个 `{ palette: { ...9个字段... } }`。

**数据来源**: 并行请求 B 站 API (`api.bilibili.com/x/web-interface/card`) 和视频 API (`uapis.cn/api/v1/social/bilibili/archives`)，使用 `Promise.allSettled` 保证单一路径失败不影响整体。

## 常用命令

```bash
npm run dev        # 启动本地开发服务器 (端口 3000, 支持热加载)
npm test           # 运行所有测试 (node --test)
npm run deploy     # 部署到 Vercel
```

## 开发规范

### 新增配色
1. 在 `lib/colors/` 下新建文件，导出 `{ palette: { bgGradientStart, bgGradientMiddle, bgGradientEnd, strokeColor, textColor, textColor2, cardBg, accentColor, shadowColor } }`
2. 在 `lib/config/themes-colors.json` 的 `colors` 数组添加条目
3. 在每个主题的 `compatibility.colors` 中添加新配色 ID

### 新增主题
1. 在 `lib/themes/` 下新建文件，导出 `generateSVG(data, palette)` 函数
2. 在 `lib/config/themes-colors.json` 的 `themes` 数组添加条目并填写实际 SVG 尺寸
3. 在 `dev-server.js` 的 `THEMES` 数组添加主题 ID

### SVG 要求
- 所有 `<svg>` 标签必须包含 `width`, `height`, `viewBox` 属性
- 图片使用同时使用 `href` 和 `xlink:href` (兼容 SVG 2 + 旧渲染器)
- 用户文本必须通过 `esc()` 转义 (防 XSS)

### 色彩 palette 结构 (9 字段)

| 字段 | 用途 |
|------|------|
| bgGradientStart | 背景渐变起始色 |
| bgGradientMiddle | 背景渐变中间色 |
| bgGradientEnd | 背景渐变结束色 |
| strokeColor | 边框/描边色 |
| textColor | 主文字色 (标题/数值标签) |
| textColor2 | 次要文字色 (签名/视频标题) |
| cardBg | 卡片背景色 |
| accentColor | 强调色 (等级图标/页脚/标签) |
| shadowColor | 阴影色 |

### CI/CD
- GitHub Actions 自动在 push/PR 时执行 `npm test`
- 项目零依赖，无需 `npm install` 步骤
- 部署通过 Vercel 平台 (`vercel --prod`)
