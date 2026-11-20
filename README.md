# Gita Companion

A mobile-first, installable web app (PWA) for reading and reflecting on the Bhagavad Gita.

**Live:** https://rangasaishreyas.github.io/gita-companion/ (open it on your phone and choose *Add to Home Screen*). Every push to `main` redeploys via GitHub Actions.

- **Read**: all 18 chapters / 701 verses: Sanskrit, transliteration, word-by-word meanings
- **Translations**: 8 translators (6 English incl. Prabhupada, 2 Hindi). Pick your main one and pin favourites
- **Commentaries**: 20 sources. In English: Shankaracharya, Ramanujacharya, Abhinavagupta, Sivananda and Prabhupada's purports. Plus Hindi and Sanskrit (Madhva, Sridhara, Madhusudana, Chinmayananda, Ramsukhdas…)
- **Stories**: a curated starter set of anecdotes and context notes, plus your own on any verse
- **Highlight** any text (4 colours, optional note), **bookmark**, and add **notes** (observation / learning / question, with tags)
- **Journal**: dated entries with mood, tags and linked verses
- **Library**: one searchable, filterable catalogue of everything you've saved
- **Progress**: per-verse Read / Revisit / Unread, chapter rings, a revisit queue and a streak
- **Themes**: 11 colour presets (6 light, 5 dark), match-system light/dark pairing, and a full colour editor with live preview and readability checks
- **Study together**: voice chat with up to 6 people, follow-the-leader through verses, and live cursors, touches and text selections (can be hidden). Peer-to-peer with no account or server: share a 6-letter code
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
- `src/styles/themes.ts`: theme presets, contrast helpers; `src/screens/ThemeSettings.tsx`: picker and editor
- `src/collab/`: study sessions. `CollabProvider` (room, voice, presence, follow), `anchor.ts` (content-relative cursor positions), `CursorLayer`, `PresenceBar`

### Study sessions: how they connect
Sessions use [Trystero](https://github.com/dmotz/trystero): browsers find each other through public Nostr relays (only encrypted connection offers pass through them) and then talk directly over WebRTC. There's no TURN relay server, so a few strict mobile or corporate networks can't connect. For local testing you can point the app at your own relay with `localStorage.setItem('gc-relays', '["ws://localhost:7777"]')`.

Data: [gita/gita](https://github.com/gita/gita) (Unlicense) and [vedicscriptures/bhagavad-gita-data](https://github.com/vedicscriptures/bhagavad-gita-data) (GPL-3.0). Modern translations and commentaries (including Prabhupada's *Bhagavad-gita As It Is*) remain under their translators' and publishers' copyright.
