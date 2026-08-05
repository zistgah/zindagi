// core.js — kitab engine. Loads config + content, applies theme, shared by all
// readers. Book-specific data lives in config/ and content/; this file does not.
// © 1900–2000 Auctor Nomen. All rights reserved. · model: Claude Opus 4.8

const CONFIG_BASE = 'config/';
const cache = {};

async function loadJSON(path) {
  if (cache[path]) return cache[path];
  const res = await fetch(path);
  if (!res.ok) throw new Error(`kitab: cannot load ${path} (${res.status})`);
  const data = await res.json();
  cache[path] = data;
  return data;
}

export async function loadConfigs() {
  const [book, readers, features] = await Promise.all([
    loadJSON(CONFIG_BASE + 'book.config.json'),
    loadJSON(CONFIG_BASE + 'readers.config.json'),
    loadJSON(CONFIG_BASE + 'features.config.json'),
  ]);
  return { book, readers, features };
}

// Apply theme tokens from book.config.json to :root as CSS variables.
export function applyTheme(book) {
  const tokens = (book.theme && book.theme.tokens) || {};
  const root = document.documentElement;
  for (const [k, v] of Object.entries(tokens)) root.style.setProperty(k, v);
  if (book.meta && book.meta.title) document.title = book.meta.title;
}

// Load every chapter's content, in the order declared by structure.chapters.
export async function loadBookContent(book) {
  const chapters = (book.structure && book.structure.chapters) || [];
  const out = [];
  for (const ch of chapters) {
    try {
      const content = await loadJSON(ch.source);
      out.push({ ...ch, content });
    } catch (e) {
      out.push({ ...ch, content: { blocks: [{ type: 'paragraph', text: `[missing content: ${ch.source}]` }] }, error: String(e) });
    }
  }
  return out;
}

// Render one content block to an HTMLElement. Figures become "talking artifacts".
export function renderBlock(block, ctx) {
  const el = document.createElement('div');
  switch (block.type) {
    case 'heading': {
      const h = document.createElement('h' + (block.level || 2));
      h.textContent = block.text;
      h.className = 'kitab-heading';
      return h;
    }
    case 'paragraph': {
      const p = document.createElement('p');
      p.textContent = block.text;
      p.className = 'kitab-para';
      return p;
    }
    case 'callout': {
      el.className = 'kitab-callout kitab-callout-' + (block.variant || 'note');
      el.textContent = block.text;
      return el;
    }
    case 'figure':
      return renderFigure(block, ctx);
    default: {
      el.className = 'kitab-para';
      el.textContent = block.text || '';
      return el;
    }
  }
}

// A figure that explains itself: image + caption + pop-out explanation + TTS +
// optional AI-explain (BYOK) + dimensional declaration for 3d/hyper hooks.
function renderFigure(fig, ctx) {
  const features = ctx.features || {};
  const ta = features.talking_artifacts || {};
  const wrap = document.createElement('figure');
  wrap.className = 'kitab-figure';
  wrap.dataset.dimension = fig.dimension || '2d';
  if (fig.id) wrap.id = fig.id;

  // Media (or a declared 3d/hyper placeholder with a renderer hook).
  const media = document.createElement('div');
  media.className = 'kitab-figure-media';
  if (fig.src) {
    const img = document.createElement('img');
    img.src = fig.src;
    img.alt = fig.alt || fig.caption || 'figure';
    img.loading = 'lazy';
    media.appendChild(img);
  }
  if (fig.declares) {
    const badge = document.createElement('div');
    badge.className = 'kitab-figure-declares';
    badge.textContent = `${fig.declares.kind} · hook: ${fig.declares.renderer_hook}`;
    badge.title = fig.declares.descriptor || '';
    media.appendChild(badge);
  }
  wrap.appendChild(media);

  // Caption.
  if (fig.caption) {
    const cap = document.createElement('figcaption');
    cap.className = 'kitab-figure-caption';
    cap.textContent = fig.caption;
    wrap.appendChild(cap);
  }

  // Controls row: explain (pop-out), TTS, AI-explain.
  const bar = document.createElement('div');
  bar.className = 'kitab-figure-bar';

  if (ta.popout !== false && fig.explanation) {
    const b = ctrl('Explain', () => togglePop(wrap, fig.explanation));
    bar.appendChild(b);
  }
  if ((ta.tts && ta.tts.enabled) && (fig.tts || fig.explanation)) {
    const b = ctrl('Read aloud', () => speak(fig.tts || fig.explanation));
    bar.appendChild(b);
  }
  if (ta.ai_explain && ta.ai_explain.enabled && fig.seed && fig.seed.enabled) {
    const b = ctrl('Ask AI', () => ctx.onSeedFigure && ctx.onSeedFigure(fig));
    bar.appendChild(b);
  }
  if (bar.children.length) wrap.appendChild(bar);

  return wrap;
}

function ctrl(label, fn) {
  const b = document.createElement('button');
  b.className = 'kitab-btn kitab-btn-small';
  b.textContent = label;
  b.addEventListener('click', fn);
  return b;
}

function togglePop(wrap, text) {
  let pop = wrap.querySelector('.kitab-figure-pop');
  if (pop) { pop.remove(); return; }
  pop = document.createElement('div');
  pop.className = 'kitab-figure-pop';
  pop.textContent = text;
  wrap.appendChild(pop);
}

function speak(text) {
  if (!('speechSynthesis' in window)) { alert('Text-to-speech is not available in this browser.'); return; }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

// Flatten a book into a list of pages for the paginated reader: a title page,
// then each chapter split into pages by its blocks.
export function paginate(chapters, perPage = 6) {
  const pages = [];
  for (const ch of chapters) {
    const blocks = (ch.content && ch.content.blocks) || [];
    const header = { type: 'chapter-title', number: ch.number, title: ch.title, subtitle: ch.subtitle };
    let cursor = [header];
    for (const b of blocks) {
      cursor.push(b);
      if (cursor.length >= perPage) { pages.push({ chapter: ch, blocks: cursor }); cursor = []; }
    }
    if (cursor.length) pages.push({ chapter: ch, blocks: cursor });
  }
  return pages;
}
