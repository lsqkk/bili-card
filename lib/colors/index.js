const palettes = {
  white: ['纯净白', 'light', '#F1F4FA', '#FFFFFF', '#D5DDEB', '#101B30', '#46546D', '#315BC6'],
  blue: ['海盐蓝', 'light', '#DCEEFF', '#F4FAFF', '#B6D4F1', '#112C47', '#385573', '#125EAA'],
  pink: ['樱花粉', 'light', '#FDE4EE', '#FFF7FA', '#F1BFD4', '#3C1830', '#754560', '#A5235D'],
  green: ['薄荷绿', 'light', '#DDF3E9', '#F4FCF8', '#B2DCCB', '#103229', '#3B5B50', '#117355'],
  purple: ['鸢尾紫', 'light', '#EEE4FC', '#FCF8FF', '#D8C6ED', '#29183D', '#594475', '#7139AC'],
  dark: ['石墨黑', 'dark', '#111821', '#1D2733', '#3C4A5B', '#F3F7FC', '#BAC8D9', '#A9C9FF'],
  sand: ['暖砂', 'light', '#F2E7D6', '#FFFAF0', '#E2CDAA', '#392713', '#69543C', '#8C4D14'],
  cobalt: ['钴蓝', 'dark', '#121C41', '#1B2A54', '#43568B', '#F0F4FF', '#C4D2F8', '#A8BDFF'],
  teal: ['深海青', 'dark', '#082E33', '#133B41', '#39646B', '#E8FCFA', '#ACD7D5', '#7CE4D2']
};

const colors = new Map(Object.entries(palettes).map(([id, values]) => {
  const [name, type, canvas, surface, border, ink, muted, accent] = values;
  return [id, { id, name, type, description: type === 'dark' ? '深色配色' : '浅色配色',
    swatches: { canvas, surface, border, ink, muted, accent } }];
}));
colors.set('auto', {
  id: 'auto', name: '跟随系统', type: 'auto', description: '按浏览器配色偏好切换浅色和深色',
  swatches: colors.get('white').swatches
});

module.exports = { colors };
