// api/card.js - 简化调试版
const axios = require('axios')

module.exports = async (req, res) => {
    console.log('API被调用，参数:', req.query)

    try {
        const { uid } = req.query

        if (!uid) {
            return res.status(400).send(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">
          <rect width="400" height="100" fill="#f0f0f0"/>
          <text x="200" y="50" text-anchor="middle" fill="red" font-family="Arial">
            错误：缺少UID参数
          </text>
        </svg>
      `)
        }

        // 1. 测试直接返回简单SVG
        const testSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="540" height="240" viewBox="0 0 540 240">
        <rect width="100%" height="100%" fill="#00a1d6" rx="10" ry="10"/>
        <text x="270" y="120" text-anchor="middle" fill="white" font-family="Arial" font-size="24">
          Bili-Card 测试版
        </text>
        <text x="270" y="160" text-anchor="middle" fill="white" font-family="Arial" font-size="16">
          UID: ${uid}
        </text>
        <text x="270" y="190" text-anchor="middle" fill="white" font-family="Arial" font-size="12">
          服务正常，正在加载数据...
        </text>
      </svg>
    `

        console.log('成功生成SVG，长度:', testSVG.length)

        res.setHeader('Content-Type', 'image/svg+xml')
        res.setHeader('Cache-Control', 'public, max-age=300')
        res.send(testSVG)

    } catch (error) {
        console.error('致命错误:', error)
        console.error('错误堆栈:', error.stack)

        // 返回包含详细错误信息的SVG（仅用于调试）
        const errorSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300">
        <rect width="100%" height="100%" fill="#ffebee"/>
        <text x="300" y="50" text-anchor="middle" fill="#d32f2f" font-family="Arial" font-size="20" font-weight="bold">
          Bili-Card 调试信息
        </text>
        <text x="300" y="90" text-anchor="middle" fill="#d32f2f" font-family="Arial" font-size="14">
          错误类型: ${error.name || 'Unknown'}
        </text>
        <text x="300" y="120" text-anchor="middle" fill="#d32f2f" font-family="Arial" font-size="12">
          错误信息: ${error.message || '无'}
        </text>
        <text x="300" y="150" text-anchor="middle" fill="#666" font-family="Arial" font-size="10">
          时间: ${new Date().toISOString()}
        </text>
        <g transform="translate(50, 180)">
          <text fill="#333" font-family="monospace" font-size="8">
            ${error.stack ? error.stack.substring(0, 100).replace(/[<>]/g, '') : '无堆栈信息'}
          </text>
        </g>
      </svg>
    `

        res.setHeader('Content-Type', 'image/svg+xml')
        res.status(500).send(errorSVG)
    }
}