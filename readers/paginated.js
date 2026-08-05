// paginated.js — page-by-page reader. Reads the same content as the other
// readers via core.js; only the presentation differs.
import { renderBlock, paginate } from '../js/core.js';

export function mount(root, chapters, ctx) {
  const pages = paginate(chapters, 6);
  let i = 0;

  const view = document.createElement('div');
  view.className = 'kitab-paginated';
  const page = document.createElement('div');
  page.className = 'kitab-page';
  const nav = document.createElement('div');
  nav.className = 'kitab-page-nav';
  const prev = btn('‹ Prev', () => go(i - 1));
  const pos = document.createElement('span');
  pos.className = 'kitab-page-pos';
  const next = btn('Next ›', () => go(i + 1));
  nav.append(prev, pos, next);
  view.append(page, nav);
  root.innerHTML = '';
  root.appendChild(view);

  function renderPage() {
    page.innerHTML = '';
    const p = pages[i];
    if (!p) return;
    for (const b of p.blocks) {
      if (b.type === 'chapter-title') { page.appendChild(chapterTitle(b)); continue; }
      page.appendChild(renderBlock(b, ctx));
    }
    pos.textContent = `${i + 1} / ${pages.length}`;
    prev.disabled = i === 0;
    next.disabled = i === pages.length - 1;
    view.scrollTop = 0;
    if (window.scrollTo) try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }
  function go(n) { if (n < 0 || n >= pages.length) return; i = n; renderPage(); }

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') go(i - 1);
    if (e.key === 'ArrowRight') go(i + 1);
  });

  renderPage();
  return { destroy() { root.innerHTML = ''; } };
}

function btn(label, fn) {
  const b = document.createElement('button');
  b.className = 'kitab-btn';
  b.textContent = label;
  b.addEventListener('click', fn);
  return b;
}
function chapterTitle(b) {
  const d = document.createElement('div');
  d.className = 'kitab-chapter-title';
  d.innerHTML = `<div class="kitab-chapter-num">Chapter ${b.number}</div><h1>${b.title}</h1>${b.subtitle ? `<div class="kitab-chapter-sub">${b.subtitle}</div>` : ''}`;
  return d;
}
