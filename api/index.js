// api/index.js - 主题和颜色信息查询API
const themesConfig = require('../lib/config/themes-colors.json');

module.exports = async (req, res) => {
    const { action = 'list', type } = req.query;

    try {
        // 设置响应头
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        switch (action) {
            case 'list':
                // 列出所有主题和颜色
                if (type === 'themes') {
                    res.json({
                        success: true,
                        data: themesConfig.themes,
                        count: themesConfig.themes.length
                    });
                } else if (type === 'colors') {
                    res.json({
                        success: true,
                        data: themesConfig.colors,
                        count: themesConfig.colors.length
                    });
                } else {
                    res.json({
                        success: true,
                        message: 'Available themes and colors',
                        data: {
                            themes: themesConfig.themes.map(t => ({
                                id: t.id,
                                name: t.name,
                                description: t.description
                            })),
                            colors: themesConfig.colors.map(c => ({
                                id: c.id,
                                name: c.name,
                                description: c.description
                            }))
                        }
                    });
                }
                break;

            case 'preview':
                // 获取预览信息
                const { theme = 'default', color = 'blue' } = req.query;
                const themeInfo = themesConfig.themes.find(t => t.id === theme);
                const colorInfo = themesConfig.colors.find(c => c.id === color);

                if (!themeInfo || !colorInfo) {
                    return res.status(404).json({
                        success: false,
                        error: 'Theme or color not found'
                    });
                }

                // 生成预览URL（使用您的UID）
                const previewUrl = `/api/card?uid=2105459088&theme=${theme}&color=${color}`;

                res.json({
                    success: true,
                    data: {
                        theme: themeInfo,
                        color: colorInfo,
                        preview: {
                            url: previewUrl,
                            example_uid: '2105459088',
                            description: `卡片预览 - ${themeInfo.name} 主题 + ${colorInfo.name} 配色`
                        },
                        usage: {
                            basic: `/api/card?uid={UID}&theme=${theme}&color=${color}`,
                            with_cache: `/api/card?uid={UID}&theme=${theme}&color=${color}&cache=3600`
                        }
                    }
                });
                break;

            case 'details':
                // 获取详细信息
                const { id } = req.query;
                if (!id) {
                    return res.status(400).json({
                        success: false,
                        error: 'Missing id parameter'
                    });
                }

                // 在主题和颜色中查找
                const item = [
                    ...themesConfig.themes,
                    ...themesConfig.colors
                ].find(item => item.id === id);

                if (!item) {
                    return res.status(404).json({
                        success: false,
                        error: 'Item not found'
                    });
                }

                res.json({
                    success: true,
                    data: item
                });
                break;

            default:
                res.status(400).json({
                    success: false,
                    error: 'Invalid action parameter',
                    valid_actions: ['list', 'preview', 'details']
                });
        }
    } catch (error) {
        console.error('Index API error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};