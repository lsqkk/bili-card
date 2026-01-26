# Bili Card - 一行代码返回B站展示SVG卡片

一款优雅、现代的B站用户卡片生成工具，通过简洁的API接口将B站用户信息转化为精美的SVG卡片。无需复杂的配置，只需一个UID，即可获得美观、可自定义的用户信息展示卡片，完美嵌入个人网站、GitHub Profile或任何需要展示B站身份的场景。

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![API Status](https://img.shields.io/badge/API-Live-success)](https://bili-card.lsqkk.space/api/card?uid=2105459088)

## ✨ 即刻体验

![Bilibili用户卡片示例](/assets/demo.svg)

## 🚀 快速开始

### 基本使用

获取指定B站用户的卡片，只需在URL中传入用户的UID：

```md
![蓝色奇夸克的B站卡片](https://bili-card.lsqkk.space/api/card?uid=2105459088)
```

### 自定义主题和颜色

我们提供多种卡片主题，让你的卡片更有个性：

| 主题 | 示例URL |
|---------|---------|
| 默认主题 `default` | `/api/card?uid=2105459088` |
| 现代主题 `modern` | `/api/card?uid=2105459088&theme=modern` |

每种主题均有多种配色方案，卡片搭配更加多样：

| 配色方案 | 示例URL |
|---------|---------|
| B站蓝 | `/api/card?uid=2105459088&color=blue` |
| 樱花粉 | `/api/card?uid=2105459088&color=pink` |
| 清新绿 | `/api/card?uid=2105459088&color=green` |
| 优雅紫 | `/api/card?uid=2105459088&color=purple` |
| 深邃黑 | `/api/card?uid=2105459088&color=dark` |


## 📋 API文档

### 卡片生成接口

**端点**：`GET /api/card`

**参数**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|---------|------|
| `uid` | string | 是 | - | B站用户UID |
| `theme` | string | 否 | `default` | 主题样式 |
| `color` | string | 否 | `blue` | 配色方案 |

**示例请求**：

```bash
curl "https://bili-card.lsqkk.space/api/card?uid=2105459088&theme=default&color=blue"
```

**响应**：
- Content-Type: `image/svg+xml`
- Cache-Control: `public, max-age=3600`

### 主题信息查询接口

**端点**：`GET /api/`

**参数**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|---------|------|
| `action` | string | 否 | `list` | 操作类型：`list`, `preview`, `details` |
| `type` | string | 否 | - | 类型：`themes`, `colors` |
| `id` | string | 否 | - | 项目ID（用于`details`操作） |

**操作示例**：

1. 查看所有可用主题和颜色：
   ```
   GET /api/?action=list
   ```

2. 预览特定主题+颜色组合：
   ```
   GET /api/?action=preview&theme=default&color=blue
   ```

3. 获取详细信息：
   ```
   GET /api/?action=details&id=default
   ```

## 🎨 主题系统

我们的卡片系统采用模块化设计，将**视觉样式**与**色彩方案**分离：

- **主题 (Themes)**：定义卡片的布局、结构和视觉元素
- **颜色方案 (Colors)**：提供完整的配色调色板

目前支持：
- **默认主题**：经典的B站风格卡片设计
- **5种配色方案**：B站蓝、樱花粉、清新绿、优雅紫、深邃黑

## 🔧 技术特性

### 智能数据处理
- 自动获取用户基本信息、粉丝数、获赞数和最新视频
- 签名和视频标题智能换行，确保内容美观
- 数字格式化（如"1.2万"）

### 性能优化
- SVG响应，体积小加载快
- 内置缓存机制，减少API调用
- 异步并行请求，提升生成速度

### 安全防护
- UID格式验证
- 内容HTML转义，防止XSS攻击
- 图片代理，避免跨域问题

## 📊 成功案例

这里有一些使用我们卡片生成服务的用户示例：

| 用户 | 卡片展示 |
|------|----------|
| 老番茄 | ![老番茄卡片](https://bili-card.lsqkk.space/api/card?uid=546195&color=green) |
| 嘉然今天吃什么 | ![嘉然卡片](https://bili-card.lsqkk.space/api/card?uid=672328094&color=pink) |
| 陈睿 | ![陈睿卡片](https://bili-card.lsqkk.space/api/card?uid=208259&color=dark) |

## 🔗 使用场景

### 个人网站
在个人简历或作品集中展示B站身份：
```html
<img src="https://bili-card.lsqkk.space/api/card?uid=你的UID" 
     alt="Bilibili卡片" 
     width="540" 
     height="220">
```

### GitHub Profile
在GitHub个人主页展示B站信息：
```markdown
![我的B站卡片](https://bili-card.lsqkk.space/api/card?uid=你的UID)
```

### 技术博客
在技术文章作者信息处使用：
```html
<div class="author-card">
  <h3>关于作者</h3>
  <img src="https://bili-card.lsqkk.space/api/card?uid=你的UID" 
       alt="作者B站卡片">
</div>
```

## 🤝 贡献与支持

### 问题反馈
如果您发现任何问题或有改进建议，请通过[GitHub Issues](https://github.com/your-repo/issues)提交。

### 开发贡献
我们欢迎社区贡献，特别是：
- 新的主题样式
- 更多的配色方案
- 性能优化
- 文档改进

请查看[贡献指南](CONTRIBUTING.md)了解如何开始。

### 寻找你的UID
不知道自己的B站UID？访问你的B站个人主页，URL中的数字就是你的UID：
```
https://space.bilibili.com/12345678
                              ↑
                             UID
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**立即开始** → `https://bili-card.lsqkk.space/api/card?uid=你的UID`

希望这张小小的卡片能为你的线上身份增添一抹独特的色彩。如果你喜欢这个项目，别忘了给我们一个⭐️！