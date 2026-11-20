# Gita Companion

A mobile-first, installable web app (PWA) for reading and reflecting on the Bhagavad Gita.

**Live:** https://rangasaishreyas.github.io/gita-companion/ (open it on your phone and choose *Add to Home Screen*). Every push to `main` redeploys via GitHub Actions.

- **Read**: all 18 chapters / 701 verses: Sanskrit, transliteration, word-by-word meanings
- **Translations**: 7 translators (English and Hindi). Pick your main one and pin favourites
- **Commentaries**: 16 commentators (Shankaracharya, Ramanuja, Madhva, Sridhara, Madhusudana, Abhinavagupta, Sivananda, Chinmayananda, Ramsukhdas…) in English, Hindi and Sanskrit
- **Stories**: a curated starter set of anecdotes and context notes, plus your own on any verse
- **Highlight** any text (4 colours, optional note), **bookmark**, and add **notes** (observation / learning / question, with tags)
- **Journal**: dated entries with mood, tags and linked verses
- **Library**: one searchable, filterable catalogue of everything you've saved
- **Progress**: per-verse Read / Revisit / Unread, chapter rings, a revisit queue and a streak
- Works offline; all your data stays on the device (IndexedDB). Export/import a JSON backup from Settings

## Run

```bash
npm install
npm run build-data   # downloads the gita/gita dataset and splits it into public/data (already done)
npm run dev          # http://localhost:5173
```

Production build: `npm run build`, then serve the `dist/` folder from any static host (GitHub Pages, Netlify, Cloudflare Pages). Paths are relative, so it also works from a sub-folder. Open it on your phone and use **Add to Home Screen** to install it.

## Code map

- `scripts/build-data.mjs`: fetches and cleans the source data
- `src/db/schema.ts`, `src/db/repo.ts`: the local database. All UI goes through `repo.ts`; every record has `id`/`createdAt`/`updatedAt`/`deleted` so cross-device sync can be added there later
- `src/db/backup.ts`: export / merge-import / erase
- `src/screens/`: Home, Read (chapters), Verse, Journal, Library, Progress, Settings
- `src/content/anecdotes.ts`: curated stories (edit or extend freely)

Data: [gita/gita](https://github.com/gita/gita), public domain (Unlicense).
