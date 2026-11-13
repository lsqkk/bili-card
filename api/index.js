const { EXAMPLE_UID, themes, colors, fields, queryParams } = require('../lib/card-options');
const { prepare, setCache } = require('../lib/http');

const catalog = {
  themes: [...themes.values()].map(({ layout, ...theme }) => ({
    ...theme,
    compatibility: { colors: [...colors.keys()] },
    example: { with_uid: `/api/card?uid=${EXAMPLE_UID}&theme=${theme.id}`, description: theme.name }
  })),
  colors: [...colors.values()],
  fields: [...fields].map(([id, [en, name]]) => ({ id, name, en })),
  query_params: queryParams
};

module.exports = async (req, res) => {
  const error = (status, message) => res.status(status).json({ success: false, error: message });
  if (!prepare(req, res, error)) return;
  const { action = 'list', type, id, theme = 'default', color = 'blue' } = req.query || {};
  let data;
  let extra = {};
  switch (action) {
    case 'list':
      if (type === 'themes' || type === 'colors') {
        data = catalog[type];
        extra = { count: data.length };
      } else {
        data = catalog;
        extra = { message: 'Available themes and colors' };
      }
      break;
    case 'preview': {
      const themeInfo = catalog.themes.find(item => item.id === theme);
      const colorInfo = colors.get(color);
      if (!themeInfo || !colorInfo) return error(404, 'Theme or color not found');
      const style = 'theme=' + theme + '&color=' + color;
      const basic = '/api/card?uid={UID}&' + style;
      data = {
        theme: themeInfo, color: colorInfo,
        preview: {
          url: '/api/card?uid=' + EXAMPLE_UID + '&' + style,
          demo_url: '/api/card?demo=true&' + style,
          example_uid: EXAMPLE_UID,
          description: `${themeInfo.name} · ${colorInfo.name}`
        },
        usage: { basic, with_cache: basic + '&cache=3600' }
      };
      break;
    }
    case 'details':
      if (!id) return error(400, 'Missing id parameter');
      data = [...catalog.themes, ...catalog.colors].find(item => item.id === id);
      if (!data) return error(404, 'Item not found');
      break;
    default:
      return res.status(400).json({ success: false, error: 'Invalid action parameter',
        valid_actions: ['list', 'preview', 'details'] });
  }
  setCache(res, 3600);
  res.json({ success: true, ...extra, data });
};
