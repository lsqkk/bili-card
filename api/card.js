// api/card.js - 诊断版本
const axios = require('axios');

module.exports = async (req, res) => {
  console.log('=== API请求开始 ===');
  console.log('请求URL:', req.url);
  console.log('查询参数:', req.query);
  console.log('当前目录:', __dirname);
  console.log('工作目录:', process.cwd());

  try {
    // 测试最简单的SVG生成
    const testSVG = `
      <svg width="400" height="120" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="120" fill="#f5f5f5" rx="6"/>
        <text x="200" y="50" text-anchor="middle" font-family="system-ui" font-size="16" fill="#333">
          诊断模式 - 基础SVG正常
        </text>
        <text x="200" y="80" text-anchor="middle" font-family="monospace" font-size="12" fill="#666">
          时间: ${new Date().toISOString()}
        </text>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(testSVG);

  } catch (error) {
    console.error('=== 捕获到错误 ===');
    console.error('错误名称:', error.name);
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);

    // 返回包含详细错误的SVG（仅用于调试）
    const errorSVG = `
      <svg width="600" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#fff8f8"/>
        <text x="300" y="40" text-anchor="middle" font-family="system-ui" font-size="18" fill="#d00">
          调试信息 - 错误详情
        </text>
        <text x="300" y="70" text-anchor="middle" font-family="monospace" font-size="12" fill="#666">
          错误类型: ${error.name || 'Unknown'}
        </text>
        <text x="300" y="95" text-anchor="middle" font-family="monospace" font-size="11" fill="#444">
          ${(error.message || 'No message').substring(0, 80)}
        </text>
        <text x="300" y="130" text-anchor="middle" font-family="monospace" font-size="10" fill="#888">
          路径: ${__dirname}
        </text>
        <g transform="translate(50, 160)">
          <text font-family="monospace" font-size="9" fill="#999">
            ${error.stack ? error.stack.substring(0, 200).replace(/</g, '&lt;') : '无堆栈信息'}
          </text>
        </g>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(500).send(errorSVG);
  }
};