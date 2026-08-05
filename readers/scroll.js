// scroll.js — continuous scroll reader. Same content via core.js, one column.
import { renderBlock } from '../js/core.js';

export function mount(root, chapters, ctx) {
  const view = document.createElement('div');
  view.className = 'kitab-scroll';
  for (const ch of chapters) {
    const head = document.createElement('div');
    head.className = 'kitab-chapter-title';
    head.innerHTML = `<div class="kitab-chapter-num">Chapter ${ch.number}</div><h1>${ch.title}</h1>${ch.subtitle ? `<div class="kitab-chapter-sub">${ch.subtitle}</div>` : ''}`;
    view.appendChild(head);
    const blocks = (ch.content && ch.content.blocks) || [];
    for (const b of blocks) view.appendChild(renderBlock(b, ctx));
  }
  root.innerHTML = '';
  root.appendChild(view);
  return { destroy() { root.innerHTML = ''; } };
}
