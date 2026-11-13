# bili-card

零运行时依赖的 Node.js 22 项目，通过 Vercel Serverless 生成 B 站用户 SVG 卡片。

- `api/` 提供 SVG、JSON 资料、主题目录和健康检查。
- `lib/card-options.js` 定义卡片参数及布局元数据，`lib/colors/index.js` 定义色板。
- `lib/card-svg.js` 组合 SVG 布局，`lib/svg-text.js` 处理文本。
- `lib/bilibili.js` 归一化用户资料和视频，`lib/images.js` 负责内嵌 CDN 图片。
- `public/` 是静态卡片生成器，通过目录 API 获取可用的主题和配色。

`npm run dev` 启动本地服务器，`npm test` 运行测试。使用 `/api/card?demo=true` 检查离线样式。开发流程参见 [CONTRIBUTING.md](CONTRIBUTING.md)。
