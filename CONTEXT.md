# Context — zistgah/zindagi

## What this is
*Geometry of Living* (a sequel to *Geometry of Becoming*) published as an eighteen-chapter
poster collection on the **kitab** template. One poster per chapter; each poster is a
self-describing "talking artifact" figure with a pop-out explanation, browser read-aloud (TTS),
and BYOK Ask-AI. Three interchangeable readers (paginated, scroll, liquid) render the same content.

## Built on kitab (data replaced, plumbing untouched)
- **Data (this repo authored):** config/book.config.json (title, author, licence, chapter
  manifest, theme tokens), content/ch-01..18.json (the eighteen chapters), assets/figures/
  (the poster PNGs + cover.png), metadata/misty.json.
- **Plumbing (kitab's, unchanged):** index.html (root), js/{app,core,features}.js,
  readers/{paginated,scroll,liquid}.js, assets/theme/. See github.com/zistgah/kitab.

## Chapter mapping
Flat: 1 poster = 1 chapter, 18 chapters, named by poster title, in collection order.
Grouped for navigation into four parts (Perpetuation of Life; Geometry of Living;
Breath, Mind & Music; Body, Health & Civilization). The book cover is the cover asset.

## Provenance
Author Abhishek Choudhary; affiliation AyeAI only; ORCID 0009-0002-0684-8320;
ISBN 978-81-985634-0-7; posters CC-BY-SA-4.0. Framework presented as research proposal.

## Contributions
GitHub issue templates route work with `needs:*` capability labels (needs:code, needs:proof,
needs:ontology, needs:visual, needs:testing, needs:legal, needs:human) per master C36 — the
human routes at dispatch. Learning links → zistgah/varzish; litigation hook → zistgah/vakil.
