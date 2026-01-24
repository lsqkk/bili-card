// api/card.js - API诊断测试版
const axios = require('axios');

module.exports = async (req, res) => {
  console.log('=== API诊断测试开始 ===');

  try {
    const { uid, debug = 'false' } = req.query;
    const showDebug = debug === 'true';

    if (!uid || !/^\d+$/.test(uid)) {
      return sendErrorSVG(res, 'UID格式不正确，应为纯数字');
    }

    console.log(`测试UID: ${uid}`);
    console.log(`当前时间: ${new Date().toISOString()}`);

    // 测试多个可能的API端点
    const testResults = await testAllAPIs(uid);

    // 生成诊断报告
    const diagnosticSVG = generateDiagnosticSVG(uid, testResults, showDebug);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(diagnosticSVG);

  } catch (error) {
    console.error('诊断过程中出现异常:', error);
    const errorSVG = generateErrorSVG(error);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(500).send(errorSVG);
  }
};

// 测试所有可能的API
async function testAllAPIs(uid) {
  const results = {};

  // 测试1: 原始uapis.cn接口
  console.log('\n--- 测试1: uapis.cn接口 ---');
  try {
    const response = await axios.get('https://uapis.cn/api/v1/social/bilibili/userinfo', {
      params: { uid },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    results.uapis = {
      success: true,
      status: response.status,
      data: response.data,
      requestUrl: `https://uapis.cn/api/v1/social/bilibili/userinfo?uid=${uid}`,
      details: `code: ${response.data.code}, message: ${response.data.message || '无'}`
    };

    console.log('uapis.cn响应:', {
      status: response.status,
      code: response.data.code,
      message: response.data.message,
      hasData: !!response.data.data
    });

  } catch (error) {
    results.uapis = {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      details: error.code || '未知错误'
    };
    console.log('uapis.cn失败:', error.message);
  }

  // 测试2: 备用API - B站官方风格
  console.log('\n--- 测试2: 备用API（官方风格） ---');
  try {
    const response = await axios.get(`https://api.bilibili.com/x/space/acc/info`, {
      params: { mid: uid },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://space.bilibili.com'
      }
    });

    results.official = {
      success: true,
      status: response.status,
      data: response.data,
      requestUrl: `https://api.bilibili.com/x/space/acc/info?mid=${uid}`,
      details: `code: ${response.data.code}, message: ${response.data.message || '无'}`
    };

    console.log('官方API响应:', {
      status: response.status,
      code: response.data.code,
      message: response.data.message,
      hasData: !!response.data.data
    });

  } catch (error) {
    results.official = {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      details: error.code || '未知错误'
    };
    console.log('官方API失败:', error.message);
  }

  // 测试3: 社区维护的API
  console.log('\n--- 测试3: 社区API ---');
  try {
    const response = await axios.get(`https://api.bilibili.com/x/relation/stat`, {
      params: { vmid: uid },
      timeout: 10000
    });

    results.community = {
      success: true,
      status: response.status,
      data: response.data,
      requestUrl: `https://api.bilibili.com/x/relation/stat?vmid=${uid}`,
      details: `code: ${response.data.code}`
    };

    console.log('社区API响应:', {
      status: response.status,
      code: response.data.code
    });

  } catch (error) {
    results.community = {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      details: error.code || '未知错误'
    };
    console.log('社区API失败:', error.message);
  }

  return results;
}

// 生成诊断报告SVG
function generateDiagnosticSVG(uid, results, showDebug = false) {
  const now = new Date();
  const timestamp = now.toLocaleString('zh-CN');

  // 计算总体状态
  const anySuccess = Object.values(results).some(r => r.success);
  const overallStatus = anySuccess ? '✅ 部分API可用' : '❌ 所有API均失败';

  let svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8f9fa"/>
          <stop offset="100%" stop-color="#e9ecef"/>
        </linearGradient>
        <linearGradient id="success" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#d4edda"/>
          <stop offset="100%" stop-color="#c3e6cb"/>
        </linearGradient>
        <linearGradient id="failure" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8d7da"/>
          <stop offset="100%" stop-color="#f5c6cb"/>
        </linearGradient>
      </defs>
      
      <style>
        .card { font-family: 'Consolas', 'Monaco', 'Courier New', monospace; }
        .title { font-size: 28px; font-weight: bold; fill: #343a40; }
        .subtitle { font-size: 16px; fill: #6c757d; }
        .status-success { fill: #28a745; font-weight: bold; }
        .status-failure { fill: #dc3545; font-weight: bold; }
        .section-title { font-size: 18px; font-weight: 600; fill: #495057; }
        .api-name { font-size: 16px; fill: #212529; }
        .api-details { font-size: 12px; fill: #6c757d; }
        .debug-info { font-size: 10px; fill: #868e96; font-family: monospace; }
        .timestamp { font-size: 11px; fill: #adb5bd; }
      </style>
      
      <!-- 背景 -->
      <rect width="800" height="600" fill="url(#bg)" rx="12" ry="12"/>
      <rect x="20" y="20" width="760" height="560" fill="white" rx="8" ry="8" stroke="#dee2e6" stroke-width="1"/>
      
      <!-- 标题 -->
      <text x="400" y="60" text-anchor="middle" class="title">B站API诊断报告</text>
      <text x="400" y="90" text-anchor="middle" class="subtitle">UID: ${uid}</text>
      
      <!-- 总体状态 -->
      <text x="400" y="130" text-anchor="middle" class="${anySuccess ? 'status-success' : 'status-failure'}" font-size="20">
        ${overallStatus}
      </text>
      
      <!-- API测试结果 -->
      <g transform="translate(50, 170)">
        <!-- uapis.cn结果 -->
        <g transform="translate(0, 0)">
          <rect width="700" height="70" fill="${results.uapis.success ? 'url(#success)' : 'url(#failure)'}" rx="6" ry="6" opacity="0.3"/>
          <text y="25" class="api-name">1. uapis.cn (原始API)</text>
          <text y="45" class="api-details">
            状态: ${results.uapis.success ? '✅ 成功' : '❌ 失败'} | 
            响应码: ${results.uapis.status || 'N/A'} | 
            详情: ${results.uapis.details || '无'}
          </text>
          ${showDebug && results.uapis.data ? `
            <text y="65" class="debug-info" width="680">
              响应: ${JSON.stringify(results.uapis.data).substring(0, 120)}...
            </text>
          ` : ''}
        </g>
        
        <!-- 官方API结果 -->
        <g transform="translate(0, 90)">
          <rect width="700" height="70" fill="${results.official.success ? 'url(#success)' : 'url(#failure)'}" rx="6" ry="6" opacity="0.3"/>
          <text y="25" class="api-name">2. B站官方API</text>
          <text y="45" class="api-details">
            状态: ${results.official.success ? '✅ 成功' : '❌ 失败'} | 
            响应码: ${results.official.status || 'N/A'} | 
            详情: ${results.official.details || '无'}
          </text>
          ${showDebug && results.official.data ? `
            <text y="65" class="debug-info" width="680">
              响应: ${JSON.stringify(results.official.data).substring(0, 120)}...
            </text>
          ` : ''}
        </g>
        
        <!-- 社区API结果 -->
        <g transform="translate(0, 180)">
          <rect width="700" height="70" fill="${results.community.success ? 'url(#success)' : 'url(#failure)'}" rx="6" ry="6" opacity="0.3"/>
          <text y="25" class="api-name">3. 社区API (关系数据)</text>
          <text y="45" class="api-details">
            状态: ${results.community.success ? '✅ 成功' : '❌ 失败'} | 
            响应码: ${results.community.status || 'N/A'} | 
            详情: ${results.community.details || '无'}
          </text>
          ${showDebug && results.community.data ? `
            <text y="65" class="debug-info" width="680">
              响应: ${JSON.stringify(results.community.data).substring(0, 120)}...
            </text>
          ` : ''}
        </g>
      </g>
      
      <!-- 建议 -->
      <g transform="translate(50, 450)">
        <text class="section-title">💡 诊断建议:</text>
        <g transform="translate(0, 30)">
          ${anySuccess ? `
            <text y="0" font-size="14" fill="#28a745">✅ 至少有一个API可用，可以继续开发</text>
            <text y="25" font-size="12" fill="#6c757d">建议使用成功的API作为数据源</text>
          ` : `
            <text y="0" font-size="14" fill="#dc3545">❌ 所有API均失败，可能原因:</text>
            <text y="25" font-size="12" fill="#6c757d">1. 网络限制（Vercel IP被限制）</text>
            <text y="45" font-size="12" fill="#6c757d">2. API服务临时故障</text>
            <text y="65" font-size="12" fill="#6c757d">3. 请求频率过高被限制</text>
          `}
        </g>
      </g>
      
      <!-- 调试提示 -->
      <g transform="translate(50, 550)">
        <text class="timestamp">诊断时间: ${timestamp}</text>
        <text x="400" y="0" text-anchor="middle" font-size="11" fill="#6c757d">
          添加 &debug=true 查看详细响应数据
        </text>
      </g>
    </svg>
  `;

  return svg;
}

// 生成错误SVG
function generateErrorSVG(error) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="200" viewBox="0 0 600 200">
      <rect width="100%" height="100%" fill="#f8d7da" rx="12" ry="12"/>
      <text x="300" y="80" text-anchor="middle" font-size="24" fill="#721c24" font-weight="bold">
        诊断程序自身出错
      </text>
      <text x="300" y="120" text-anchor="middle" font-size="14" fill="#721c24">
        ${error.message || '未知错误'}
      </text>
      <text x="300" y="160" text-anchor="middle" font-size="12" fill="#856404">
        请检查Vercel日志获取详细错误信息
      </text>
    </svg>
  `;
}

function sendErrorSVG(res, message) {
  const errorSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="150" viewBox="0 0 400 150">
      <rect width="100%" height="100%" fill="#f8f9fa" rx="8" ry="8"/>
      <text x="200" y="60" text-anchor="middle" font-size="18" fill="#dc3545">
        ${message}
      </text>
      <text x="200" y="90" text-anchor="middle" font-size="12" fill="#6c757d">
        请提供有效的B站UID（纯数字）
      </text>
    </svg>
  `;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(errorSVG);
}
