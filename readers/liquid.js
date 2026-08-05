// liquid.js — liquid / reflowable reader. Same content via core.js; adds
// reader controls for measure (line width) and font size, driven by config.
import { renderBlock } from '../js/core.js';

export function mount(root, chapters, ctx) {
  const cfg = (ctx.readers && ctx.readers.liquid_controls) || {};
  const fMin = cfg.font_size_min_px ?? 14, fMax = cfg.font_size_max_px ?? 26, fDef = cfg.font_size_default_px ?? 18;
  const mMin = cfg.measure_min_ch ?? 45, mMax = cfg.measure_max_ch ?? 90, mDef = cfg.measure_default_ch ?? 66;

  const view = document.createElement('div');
  view.className = 'kitab-liquid';

  const controls = document.createElement('div');
  controls.className = 'kitab-liquid-controls';
  const fontRow = slider('Font', fMin, fMax, fDef, v => col.style.fontSize = v + 'px');
  const measRow = slider('Width', mMin, mMax, mDef, v => col.style.maxWidth = v + 'ch');
  controls.append(fontRow.el, measRow.el);

  const col = document.createElement('div');
  col.className = 'kitab-liquid-col';
  col.style.fontSize = fDef + 'px';
  col.style.maxWidth = mDef + 'ch';

  for (const ch of chapters) {
    const head = document.createElement('div');
    head.className = 'kitab-chapter-title';
    head.innerHTML = `<div class="kitab-chapter-num">Chapter ${ch.number}</div><h1>${ch.title}</h1>${ch.subtitle ? `<div class="kitab-chapter-sub">${ch.subtitle}</div>` : ''}`;
    col.appendChild(head);
    const blocks = (ch.content && ch.content.blocks) || [];
    for (const b of blocks) col.appendChild(renderBlock(b, ctx));
  }

  view.append(controls, col);
  root.innerHTML = '';
  root.appendChild(view);
  return { destroy() { root.innerHTML = ''; } };
}

function slider(label, min, max, val, fn) {
  const el = document.createElement('label');
  el.className = 'kitab-slider';
  const span = document.createElement('span'); span.textContent = label;
  const input = document.createElement('input');
  input.type = 'range'; input.min = min; input.max = max; input.value = val;
  input.addEventListener('input', () => fn(input.value));
  el.append(span, input);
  return { el, input };
}
