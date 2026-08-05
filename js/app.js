// app.js — the shell. Loads configs, applies theme, mounts the selected reader,
// wires the feature chrome. Book content is data; this file is plumbing.
// © 1900–2000 Auctor Nomen. All rights reserved. · model: Claude Opus 4.8

import { loadConfigs, applyTheme, loadBookContent } from './core.js';
import * as F from './features.js';

const state = { book: null, readers: null, features: null, chapters: null, current: null, active: null };

async function boot() {
  const cfg = await loadConfigs();
  state.book = cfg.book; state.readers = cfg.readers; state.features = cfg.features;
  applyTheme(cfg.book);
  state.chapters = await loadBookContent(cfg.book);

  renderChrome();
  const initial = pickInitialReader();
  switchReader(initial);
  wireSelectToLearn();
}

function ctx() {
  return {
    features: state.features,
    readers: state.readers,
    onSeedFigure: seedFigure,
  };
}

function pickInitialReader() {
  const url = new URLSearchParams(window.location.search);
  const asked = url.get('reader');
  const formats = state.readers.formats;
  if (asked && formats[asked] && formats[asked].enabled) return asked;
  const def = state.readers.default;
  if (formats[def] && formats[def].enabled) return def;
  return Object.keys(formats).find(k => formats[k].enabled);
}

async function switchReader(fmt) {
  const f = state.readers.formats[fmt];
  if (!f || !f.enabled) return;
  if (state.active && state.active.destroy) state.active.destroy();
  const mod = await import('../' + f.module);
  const root = document.getElementById('reader-root');
  state.active = mod.mount(root, state.chapters, ctx());
  state.current = fmt;
  document.querySelectorAll('[data-reader-fmt]').forEach(b =>
    b.classList.toggle('active', b.dataset.readerFmt === fmt));
  const u = new URL(window.location.href); u.searchParams.set('reader', fmt); history.replaceState({}, '', u);
}

function renderChrome() {
  const b = state.book, feat = state.features;

  // Header: title + reader switch + feature buttons.
  const header = document.getElementById('kitab-header');
  header.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'kitab-title';
  title.textContent = b.meta.title;
  header.appendChild(title);

  const tools = document.createElement('div');
  tools.className = 'kitab-tools';

  // Reader switch (only enabled formats).
  for (const [fmt, f] of Object.entries(state.readers.formats)) {
    if (!f.enabled) continue;
    const btn = document.createElement('button');
    btn.className = 'kitab-btn kitab-btn-small';
    btn.dataset.readerFmt = fmt;
    btn.textContent = f.label;
    btn.title = f.description || '';
    btn.addEventListener('click', () => switchReader(fmt));
    tools.appendChild(btn);
  }

  // Share.
  if (feat.share && feat.share.enabled) tools.appendChild(iconBtn('Share', openShare));
  // Ratings.
  if (feat.ratings && feat.ratings.enabled) tools.appendChild(renderStars(feat.ratings));
  // BYOK settings.
  if (feat.seeding && feat.seeding.byok && feat.seeding.byok.enabled) tools.appendChild(iconBtn('Key', openBYOK));
  // Fork.
  if (feat.participation && feat.participation.fork_button) {
    tools.appendChild(linkBtn('Fork', F.forkURL(b.meta.repo)));
  }
  // Litigation stub entry (from every context, per C34).
  const lit = F.litigationEntry(feat.litigation_sim);
  if (lit) {
    const el = linkBtn(lit.label + (lit.stub ? ' (stub)' : ''), lit.href);
    el.title = lit.note;
    tools.appendChild(el);
  }

  header.appendChild(tools);
}

function iconBtn(label, fn) {
  const b = document.createElement('button');
  b.className = 'kitab-btn kitab-btn-small';
  b.textContent = label;
  b.addEventListener('click', fn);
  return b;
}
function linkBtn(label, href) {
  const a = document.createElement('a');
  a.className = 'kitab-btn kitab-btn-small';
  a.href = href; a.target = '_blank'; a.rel = 'noopener';
  a.textContent = label;
  return a;
}

// ---- Ratings UI ------------------------------------------------------------
function renderStars(cfg) {
  const wrap = document.createElement('span');
  wrap.className = 'kitab-stars';
  const cur = F.getRating(cfg);
  for (let n = 1; n <= 5; n++) {
    const s = document.createElement('button');
    s.className = 'kitab-star' + (n <= cur ? ' on' : '');
    s.textContent = '★';
    s.title = `${n} / 5`;
    s.addEventListener('click', () => { F.setRating(cfg, n); renderChrome(); });
    wrap.appendChild(s);
  }
  if (cfg.github_stars) {
    const gh = linkBtn('☆ Star on GitHub', `https://github.com/${state.book.meta.repo}`);
    gh.classList.add('kitab-ghstar');
    wrap.appendChild(gh);
  }
  return wrap;
}

// ---- Share sheet -----------------------------------------------------------
async function openShare() {
  const urls = F.shareURLs(state.features.share, state.book);
  const lines = urls.map(u => u.href
    ? `<a class="kitab-btn kitab-btn-small" target="_blank" rel="noopener" href="${u.href}">${u.channel}</a>`
    : `<button class="kitab-btn kitab-btn-small" id="kitab-copy">copy link</button>`).join(' ');
  modal('Share', lines, () => {
    const c = document.getElementById('kitab-copy');
    if (c) c.addEventListener('click', async () => { c.textContent = (await F.copyLink()) ? 'copied' : 'failed'; });
  });
}

// ---- BYOK sheet ------------------------------------------------------------
function openBYOK() {
  const cfg = state.features.seeding.byok;
  const cur = F.getKey(cfg);
  const rows = (cfg.providers || []).map(p =>
    `<label class="kitab-field"><span>${p}</span><input data-byok="${p}" type="password" placeholder="paste key (stored in your browser only)" value="${cur[p] ? '••••••••' : ''}"></label>`
  ).join('');
  modal('Your API keys (BYOK)',
    `<p class="kitab-note">${cfg.note}</p>${rows}<button class="kitab-btn" id="kitab-byok-save">Save</button>`,
    () => {
      document.getElementById('kitab-byok-save').addEventListener('click', () => {
        document.querySelectorAll('[data-byok]').forEach(inp => {
          if (inp.value && inp.value !== '••••••••') F.setKey(cfg, inp.dataset.byok, inp.value);
        });
        closeModal();
      });
    });
}

// ---- Figure seeding --------------------------------------------------------
async function seedFigure(fig) {
  const ok = await F.seedPrompt(fig.seed.prompt);
  modal('Ask AI about this figure',
    `<p class="kitab-note">${ok ? 'Prompt copied to your clipboard.' : 'Copy failed — select and copy below.'}</p><pre class="kitab-pre">${fig.seed.prompt}</pre><a class="kitab-btn" target="_blank" rel="noopener" href="https://claude.ai">Open Claude</a>`,
    () => {});
}

// ---- Select-to-learn + comment/flag on selection ---------------------------
function wireSelectToLearn() {
  const feat = state.features;
  if (!feat.learning || !feat.learning.enabled) return;

  document.addEventListener('mouseup', () => {
    const sel = String(window.getSelection() || '').trim();
    removeSelBar();
    if (sel.length < 8) return;
    const bar = document.createElement('div');
    bar.className = 'kitab-selbar';
    bar.id = 'kitab-selbar';

    if (feat.learning.select_to_learn) {
      const courses = F.courseLinksFor(sel, feat.learning);
      if (courses.length) {
        courses.slice(0, 3).forEach(c => bar.appendChild(linkBtn('Course: ' + c.title, c.url)));
      } else {
        bar.appendChild(linkBtn('Request a course', F.requestCourseURL(sel, feat.learning)));
      }
    }
    if (feat.participation && feat.participation.comment_via_issue) {
      bar.appendChild(linkBtn('Comment', F.commentURL(state.book.meta.repo, sel)));
    }
    if (feat.participation && feat.participation.flag_concern_via_issue) {
      bar.appendChild(linkBtn('Flag concern', F.flagURL(state.book.meta.repo, sel)));
    }
    document.body.appendChild(bar);
    const r = window.getSelection().getRangeAt(0).getBoundingClientRect();
    bar.style.top = (window.scrollY + r.bottom + 6) + 'px';
    bar.style.left = (window.scrollX + r.left) + 'px';
  });
}
function removeSelBar() { const b = document.getElementById('kitab-selbar'); if (b) b.remove(); }

// ---- Minimal modal ---------------------------------------------------------
function modal(title, html, after) {
  closeModal();
  const back = document.createElement('div');
  back.className = 'kitab-modal-back'; back.id = 'kitab-modal';
  back.innerHTML = `<div class="kitab-modal"><div class="kitab-modal-head"><b>${title}</b><button class="kitab-x" id="kitab-x">×</button></div><div class="kitab-modal-body">${html}</div></div>`;
  document.body.appendChild(back);
  document.getElementById('kitab-x').addEventListener('click', closeModal);
  back.addEventListener('click', e => { if (e.target === back) closeModal(); });
  if (after) after();
}
function closeModal() { const m = document.getElementById('kitab-modal'); if (m) m.remove(); }

boot().catch(e => {
  document.getElementById('reader-root').innerHTML =
    `<p style="color:#c66">kitab failed to load: ${e.message}</p>`;
});
