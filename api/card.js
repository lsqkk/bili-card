const { fetchBilibiliData } = require('../lib/bilibili');
const { renderSVG } = require('../lib/render');

module.exports = async (req, res) => {
  try {
    const { uid, theme = 'default', hide = '' } = req.query;

    // 参数验证
    if (!uid || !/^\d{3,10}$/.test(uid)) {
      return sendErrorSVG(res, '无效的UID', '请提供有效的B站UID');
    }

    // 获取数据
    const data = await fetchBilibiliData(uid);
    if (!data.user) {
      return sendErrorSVG(res, '用户不存在', '请确认UID是否正确');
    }

    // 解析显示选项
    const hiddenItems = hide.split(',').map(h => h.trim().toLowerCase());
    const options = {
      showSignature: !hiddenItems.includes('signature'),
      showLatestVideo: !hiddenItems.includes('latest'),
      showPopularVideo: !hiddenItems.includes('popular'),
      showStats: !hiddenItems.includes('stats'),
      showFollowers: !hiddenItems.includes('followers')
    };

    // 渲染SVG
    const svg = await renderSVG(data, { theme, ...options });

    // 返回响应
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);

  } catch (error) {
    console.error('Card generation error:', error);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(500).send(`
      <svg width="400" height="120" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="120" fill="#f5f5f5" rx="6"/>
        <text x="200" y="50" text-anchor="middle" font-family="system-ui" font-size="14" fill="#666">
          服务暂时不可用
        </text>
        <text x="200" y="75" text-anchor="middle" font-family="system-ui" font-size="12" fill="#999">
          请稍后重试
        </text>
      </svg>
    `);
  }
};

function sendErrorSVG(res, title, subtitle) {
  const svg = `
    <svg width="400" height="120" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="120" fill="#fff3f3" rx="6" stroke="#ffcdd2" stroke-width="1"/>
      <text x="200" y="50" text-anchor="middle" font-family="system-ui" font-size="14" fill="#d32f2f" font-weight="500">
        ${title}
      </text>
      <text x="200" y="75" text-anchor="middle" font-family="system-ui" font-size="12" fill="#666">
        ${subtitle}
      </text>
    </svg>
  `;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
}