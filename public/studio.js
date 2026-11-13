const form = document.querySelector('#controls');
const uid = form.elements.uid;
const card = document.querySelector('#card');
const status = document.querySelector('#status');
const source = document.querySelector('#source');
const embed = document.querySelector('#embed');
const format = document.querySelector('#format');
const openLink = document.querySelector('#open');
const copyStatus = document.querySelector('#copy-status');

let theme = 'modern';
let color = 'cobalt';
let activeUid = '';
let currentUrl;
let pending;
let previewImage;

function updateEmbed() {
  if (!currentUrl) return;
  const { href } = currentUrl;
  const profile = activeUid ? 'https://space.bilibili.com/' + activeUid : '';
  const markdown = '![B 站卡片](' + href + ')';
  const html = '<img src="' + href.replaceAll('&', '&amp;') + '" alt="B 站卡片">';
  embed.value = format.value === 'URL' ? href
    : format.value === 'HTML' ? (profile ? '<a href="' + profile + '">' + html + '</a>' : html)
      : (profile ? '[' + markdown + '](' + profile + ')' : markdown);
  copyStatus.textContent = '';
}

function updateVideoOptions() {
  const hiddenVideo = form.querySelector('[name="hide"][value="video"]');
  if (!hiddenVideo) return;
  const supported = form.querySelector('#themes [aria-pressed="true"]')?.dataset.video === 'true';
  hiddenVideo.disabled = !supported;
  form.elements.video.disabled = !supported || hiddenVideo.checked;
}

async function refresh() {
  const next = new URL('/api/card', location.origin);
  const params = next.searchParams;
  updateVideoOptions();
  const data = new FormData(form);
  params.set(activeUid ? 'uid' : 'demo', activeUid || 'true');
  params.set('theme', theme);
  params.set('color', color);
  for (const [key, defaultValue] of [['lang', 'zh-CN'], ['number', 'compact'], ['video', 'latest']]) {
    const value = data.get(key);
    if (value && value !== defaultValue && !form.elements[key].disabled) params.set(key, value);
  }
  const width = form.elements.width;
  if (width.value && width.validity.valid) params.set('width', width.value);
  if (data.has('transparent')) params.set('bg', 'transparent');
  if (data.has('motion')) params.set('motion', 'true');
  const hidden = data.getAll('hide').filter(key => key !== 'video' || !form.querySelector('[name="hide"][value="video"]').disabled);
  if (hidden.length) params.set('hide', hidden.join(','));

  currentUrl = next;
  openLink.href = next.href;
  source.textContent = activeUid ? 'UID ' + activeUid : '示例资料';
  updateEmbed();
  pending?.abort();
  const controller = new AbortController();
  pending = controller;
  status.textContent = activeUid ? '正在加载卡片…' : '';
  try {
    const response = await fetch(next, { signal: controller.signal });
    const blob = await response.blob();
    if (controller.signal.aborted) return;
    if (previewImage) URL.revokeObjectURL(previewImage);
    previewImage = URL.createObjectURL(blob);
    card.src = previewImage;
    card.hidden = false;
    status.textContent = response.ok ? '' : response.status === 404 ? '找不到该 UID，请检查后重试。'
      : response.status === 429 ? '请求过于频繁，请稍后重试。' : '暂时无法生成卡片，请稍后重试。';
  } catch (error) {
    if (controller.signal.aborted) return;
    card.hidden = true;
    status.textContent = '预览加载失败，请稍后重试。';
  }
}

function addButtons(items, target, selected, choose) {
  const group = document.querySelector(target);
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.title = item.description;
    button.setAttribute('aria-pressed', String(item.id === selected));
    if (item.swatches) {
      const { accent, canvas } = item.swatches;
      const swatch = item.type === 'auto' ? '#f1f4fa 50%, #111821 50%' : accent + ' 50%, ' + canvas + ' 50%';
      button.style.setProperty('--swatch', 'linear-gradient(135deg,' + swatch + ')');
      button.setAttribute('aria-label', item.name);
      button.title = item.name;
      if (item.id === selected) document.querySelector('#color-name').textContent = item.name;
    } else {
      button.textContent = item.name;
      button.dataset.video = item.video;
    }
    button.addEventListener('click', () => {
      group.querySelector('[aria-pressed="true"]')?.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-pressed', 'true');
      choose(item);
      refresh();
    });
    group.append(button);
  }
}

async function init() {
  try {
    const response = await fetch('/api?action=list');
    if (!response.ok) throw new Error('Catalog unavailable');
    const { data } = await response.json();
    addButtons(data.themes, '#themes', theme, item => { theme = item.id; });
    addButtons(data.colors, '#colors', color, item => {
      color = item.id;
      document.querySelector('#color-name').textContent = item.name;
    });
    const fields = document.querySelector('#fields');
    for (const item of data.fields) {
      const label = document.createElement('label');
      label.className = 'check';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'hide';
      input.value = item.id;
      label.append(input, item.name);
      fields.append(label);
    }
    updateVideoOptions();
  } catch {
    status.textContent = '布局和配色目录加载失败。';
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (Number(uid.value) < 1 || !Number.isSafeInteger(Number(uid.value))) {
    uid.setCustomValidity('请输入有效的 B 站 UID');
    uid.reportValidity();
    return;
  }
  activeUid = String(Number(uid.value));
  refresh();
});
uid.addEventListener('input', () => uid.setCustomValidity(''));
form.addEventListener('change', event => { if (event.target !== uid) refresh(); });
document.querySelector('#use-demo').addEventListener('click', () => {
  uid.value = '';
  uid.setCustomValidity('');
  activeUid = '';
  refresh();
});
format.addEventListener('change', updateEmbed);
document.querySelector('#copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(embed.value);
    copyStatus.textContent = '已复制';
  } catch {
    embed.focus();
    embed.select();
    copyStatus.textContent = '已选中代码，可手动复制';
  }
});
const initialUid = new URLSearchParams(location.search).get('uid');
if (/^\d{1,16}$/.test(initialUid || '') && Number(initialUid) > 0 && Number.isSafeInteger(Number(initialUid))) {
  activeUid = uid.value = String(Number(initialUid));
}
refresh();
init();
