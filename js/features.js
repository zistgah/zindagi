// features.js — visitor participation. Pure GitHub Pages; no server we run.
// Everything is client-side or a pre-filled GitHub link.
// © 1900–2000 Auctor Nomen. All rights reserved. · model: Claude Opus 4.8

function issueURL(repo, title, body, labels) {
  const base = `https://github.com/${repo}/issues/new`;
  const p = new URLSearchParams();
  if (title) p.set('title', title);
  if (body) p.set('body', body);
  if (labels) p.set('labels', labels);
  return `${base}?${p.toString()}`;
}

// ---- Share -----------------------------------------------------------------
export function shareURLs(cfg, book) {
  const url = window.location.href;
  const text = book.meta.title;
  const map = {
    'copy-link': null,
    'x': `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    'whatsapp': `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
    'linkedin': `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    'email': `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
  };
  return (cfg.channels || []).map(c => ({ channel: c, href: map[c] }));
}

export async function copyLink() {
  try { await navigator.clipboard.writeText(window.location.href); return true; }
  catch { return false; }
}

// ---- Ratings (client-side only) --------------------------------------------
export function getRating(cfg) {
  try { return Number(window.localStorage.getItem(cfg.storage_key || 'kitab.rating')) || 0; }
  catch { return 0; }
}
export function setRating(cfg, stars) {
  try { window.localStorage.setItem(cfg.storage_key || 'kitab.rating', String(stars)); } catch {}
}

// ---- BYOK (bring your own key) ---------------------------------------------
export function getKey(cfg) {
  try { return JSON.parse(window.localStorage.getItem(cfg.storage_key || 'kitab.byok') || '{}'); }
  catch { return {}; }
}
export function setKey(cfg, provider, key) {
  const cur = getKey(cfg);
  cur[provider] = key;
  try { window.localStorage.setItem(cfg.storage_key || 'kitab.byok', JSON.stringify(cur)); } catch {}
}

// ---- Seeding: compose a prompt, copy it, and open the AI --------------------
// BYOK note: the key is stored only in the browser. This function does NOT call
// any provider itself; it copies the prompt so the visitor drives their own
// session. (A direct browser->provider call can be added later behind BYOK.)
export async function seedPrompt(promptText) {
  try { await navigator.clipboard.writeText(promptText); return true; }
  catch { return false; }
}

// ---- Select-to-learn -------------------------------------------------------
// On a text selection, offer linked courses if any exist for the selection's
// topic; otherwise raise a course request as an issue on the learning repo.
export function courseLinksFor(selection, learningCfg) {
  const courses = learningCfg.courses || [];
  const q = selection.toLowerCase();
  return courses.filter(c => (c.match || []).some(m => q.includes(m.toLowerCase())));
}
export function requestCourseURL(selection, learningCfg) {
  const title = `Course request: "${selection.slice(0, 60)}"`;
  const body = `A reader selected this passage and no linked course was found:\n\n> ${selection}\n\nPlease suggest or create a course covering it.`;
  return issueURL(learningCfg.repo, title, body, 'course-request');
}

// ---- Participation: comment / flag on a passage ----------------------------
export function commentURL(repo, passage) {
  return issueURL(repo, `Comment on a passage`, `> ${passage}\n\n(Your comment:)`, 'comment');
}
export function flagURL(repo, passage) {
  return issueURL(repo, `Concern about a passage`, `> ${passage}\n\n(Describe the concern:)`, 'concern');
}
export function forkURL(repo) {
  return `https://github.com/${repo}/fork`;
}

// ---- Litigation simulation (stub) ------------------------------------------
export function litigationEntry(cfg) {
  if (!cfg || !cfg.enabled && !cfg.stub) return null;
  return {
    label: cfg.entry_label || 'Litigation simulation',
    href: `https://github.com/${cfg.repo}`,
    stub: !!cfg.stub,
    note: cfg.note || '',
  };
}

export { issueURL };
