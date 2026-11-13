# 贡献指南

使用 Node.js 22。运行 `npm run dev` 启动预览页，运行 `npm test` 执行测试。

- 新增主题时，在 `lib/card-options.js` 中注册尺寸和视频支持，在 `lib/card-svg.js` 中添加布局，复用头像、资料、统计和视频组件。
- 新增配色时，在 `lib/colors/index.js` 中定义画布、面板、描边、正文、次要文字和强调色。预览页和 API 目录会读取同一份配置。
- 用户文本先经过 `lib/svg-text.js` 的截断和 XML 转义，再写入 SVG。使用中英文、长昵称、Emoji、缺图和无投稿资料验证布局。
- 上游接口的变更应使用模拟响应验证，`demo=true` 可用来检查真实浏览器中的渲染。

提交 Issue 时可附上主题、配色、参数和预览截图。
