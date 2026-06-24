# 212 Studio · Carousel Maker

A fast, opinionated tool for making **Instagram and TikTok carousels** that don't look like everyone else's. Pick a hook style, write your text, pick a photo, export PNGs ready to upload. No Canva, no Figma, no fiddling — open it, type, ship.

> Built and used at [212 Studio](https://github.com/andriybobchuk). Open-source — PRs welcome.

## What's in the box

- **22+ hook styles** for the first slide of a carousel — typography variants (Bold, Question, Split, Diagonal, Quote, Highlight, Sticker, Stacked, Glitch, Big Stat, POV, Tape, Card, Neon, Editorial, Block, Pillar, Outlined, Two-Tone, Tag, Ribbon) and a separate **Photo** collection (Title with dark overlay, Hook with red highlight + arrow, Notes with draggable per-line stickers).
- **4 tip slides** with auto-generated abstract art (14 styles, 12 positions, 5 palettes — practically infinite combinations).
- **Save & follow slide** as an editorial banner pinned before the final CTA.
- **Final CTA** with app icon, gradient headline, app store badge.
- **Dark and light themes**, slide-level text-size slider, format toggle (Instagram portrait 4:5 / square 1:1).
- **2× export resolution** so PNGs stay crisp on retina.
- **Inline editing on the preview** for photo slides — tap any text to edit, drag stickers to reposition, color pickers for note backgrounds.
- **Twemoji injection on export** so color emojis ✈️ 🌍 actually render in the PNG (`html-to-image` drops the color layer of system fonts).

## Run it locally

```bash
git clone git@github.com:andriybobchuk/timesheet-app.git
cd timesheet-app
npm install
npm run dev
```

Open <http://localhost:5173>. The carousel maker is the default route.

## Build

```bash
npm run build
```

Output goes to `dist/`. Drop it on any static host.

## Deploy

The repo is wired to **Netlify** via `netlify.toml`. Push to `main` and it auto-builds + publishes.

## Architecture

- `src/App.jsx` — top-level router (path-based: `/` → carousel maker).
- `src/MooneyDesigner.jsx` — the carousel maker itself; all slide components, the variant picker, the editor panel, export logic.
- `src/MooneyDesigner.css` — every design token. Scoped under `.mooney-app` so it doesn't fight Tailwind.
- `public/mooney/` — mock app screenshots and app icon used by the screenshots/icon tools.

The other routes (`/inbox`, `/residency`) are personal-use tools used as Submit-to-Notion and visa-tracker; they're hidden in the UI but the routes still work if you want to fork them out.

## Contributing

Open a PR against `main`. Good first improvements:

- More hook styles (the bar is "does it survive the Instagram feed at thumb-scroll speed").
- More photo overlay treatments (the Photo collection has 3, lots of room).
- Drag-to-reposition for typography hook elements too.
- Color picker for the take slides' accent.
- A "saved drafts" panel (currently each session is ephemeral).

The CSS uses BEM-ish prefixes per slide kind (`hook-`, `take-`, `save-`, `cta-`, `hp-` for photo). Keep new variants scoped that way.

## Stack

- React 19, Vite
- `html-to-image` for PNG export
- `@twemoji/api` for emoji rendering in export
- `framer-motion` (only on the personal pages)
- Plain CSS, no Tailwind on the carousel maker

## License

MIT
