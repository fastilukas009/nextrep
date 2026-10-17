# FastRep · beta 0.2

A Finnish, mobile-first training app for basketball players. React + TypeScript, Vinext, Cloudflare Workers and D1. No paid AI calls or advertising SDKs in this version.

## GitHub Pages – avaa FastRep selaimessa

Julkaistu sovellus: **https://fastilukas009.github.io/nextrep/**

GitHub Pages on käytössä. Julkaisulähde on **gh-pages-haaran juuri (/)**. Haara sisältää valmiin `docs/`-kansion tiedostot juuressaan. Main-haarassa säilyvät lähdekoodi ja valmis docs-versio. Erillistä käyttöönottoa ei tarvita.

Tämä versio avautuu ilman tiliä tai ChatGPT-kirjautumista. Treenit, ateriat, makrotavoitteen laskuri, heittohaasteet, taitoharjoitteet, ohjattu jumpshot-videoanalyysi, palkinnot ja profiili toimivat selaimessa. Valmiit kirjaukset tallentuvat paikallisesti selaimeen. **Oma profiili → Lataa varmuuskopio** tallentaa JSON-tiedoston, jonka voi palauttaa toisella laitteella. Selaintietojen tyhjentäminen poistaa paikalliset kirjaukset. Videot eivät tallennu päiväkirjaan eivätkä varmuuskopioon.

Pages-versiossa ei ole yhteistä palvelinta: kirjautuminen, automaattinen laitteiden välinen synkronointi ja live-kisahuoneet eivät ole käytössä. Vanhan palvelinversion tietoja ei siirretä automaattisesti. Kolikot ja XP ovat paikallisia, eikä niitä voi käyttää varmennettuun julkiseen kilpailuun.

### Päivitä GitHub-sivusto

Node 22.13+ ja pnpm 11.25.0:
```sh
pnpm install --frozen-lockfile
pnpm build:pages
```

Vie lähdekoodimuutokset **sekä päivitetty docs-kansio** GitHubin main-haaraan. Julkaise sitten docs-kansion sisältö gh-pages-haaran juureen tavallisena uutena commitina: GitHub Pages seuraa gh-pages-haaraa, joten pelkkä main-päivitys ei päivitä julkista sivua. `docs/` luodaan uudelleen `pages/`-aloitustiedostoista ja yhteisistä `app/`-komponenteista. Älä muokkaa generoituja tiedostoja käsin. Suhteelliset resurssipolut ja hash-navigaatio tukevat `/nextrep/`-alihakemistoa.

Tarkistukset: `pnpm test:pages`, `node tests/core.test.cjs` ja `node node_modules/typescript/bin/tsc --noEmit`. Core-testit käyttävät Node 24:n SQLitea. Selain-/kameratestiä ei ole suoritettu tässä ympäristössä.

## Server version: working features
- Persistent signed-in profile, goal preferences and training diary.
- Three example workout plans with guided exercise navigation, set-by-set weights/reps, pauseable session timer, rest timer, notes and effort tracking. Minimize/resume an active session in the current page.
- Three step-by-step skill drills.
- Date-selectable meal diary, edit existing entries, repeat previous meals, multi-ingredient portion calculator and meal ideas.
- Local video upload and camera recording; timeline seeking, slow playback, frame stepping, guided elbow/knee/body 2D measurements, repetition comparison and saved personal observations.
- A daily macro-target calculator that derives carbohydrate grams from calories, protein and fat, then tracks daily remaining/over amounts.
- Three manually scored solo shooting challenges and personal records.
- Invite-code two-player rooms with server-timed countdown and 60-second competition, polled scores and player authorization.
- XP, daily activity rewards, achievements and a cosmetic shop with server-side balance checks.
- Responsive FastRep dashboard, five-section navigation, workout filters, activity history/details, weekly progress and web-app manifest.

## Not implemented yet
- Food-photo AI recognition. Selecting a food photo does not estimate macros.
- Automatic shot detection, video-based result verification and automated technique/movement feedback.
- Coach-approved individualized PT and diet plans; the current content is explicitly labeled example material.
- Uploaded coach instruction videos, public verified leaderboard, public matchmaking, sponsors and advertising.
- App Store packaging and multi-user field testing on real phones.

Unfinished workout drafts stay in page memory and are lost on a full page reload; the app warns before leaving an active session. Completed workouts save structured logs in the existing entry JSON, without migrating or replacing earlier data.

Recorded videos and food photos stay in browser memory; they are not uploaded. Download a recorded video before leaving the page. Profile, diary records, notes and rewards are stored in D1 under the authenticated user's Sites-specific ID. Only the player's name and manually entered score are shared with the other participant in an invited room. A private Site requires granting the invited player access before live play. No personal founder details are included.

The first completion of each activity kind per Helsinki calendar day earns rewards. Repeat sessions are saved without additional daily rewards. The UI loads the latest 300 diary records; lifetime XP and coin balances use all entries. Times and hosted accounts are controlled by the server. Competition results are unverified and have no cash value.

## Local development
Use Node 22.13+ and the supplied lockfile. Install dependencies with `pnpm install --frozen-lockfile`. Run `pnpm dev` in a supported local Sites environment. The supplied Sites helpers manage the environment profile. The production authentication path is dispatch-owned; do not expose the Worker directly without a verified authentication boundary.

`node node_modules/typescript/bin/tsc --noEmit`
`node tests/core.test.cjs` (Node 24, built-in SQLite)
`pnpm build`

D1 schema lives in `db/schema.ts`; generated migrations are in `drizzle/`. Bind `DB` in `.openai/hosting.json`. The publication workflow applies migrations. Local preview migrations are separate.

## GitHub
Public source mirror: https://github.com/fastilukas009/nextrep. The repository URL and `/api/nextrep` compatibility endpoint are retained after the FastRep rename. The default server build retains its D1 database and authentication. The separate `build:pages` target creates the browser-local GitHub Pages version described above. Never commit runtime credentials or `.env` files.

## Validation
TypeScript compilation, production build and API/core checks are run before deployment. The API checks execute the actual route handlers against an isolated in-memory SQLite adapter. Browser and device testing has not been performed in this environment; camera permissions/codec support, accessibility and two-phone live play still need real-device verification.

## Solo training library

The training library has 11 areas: strength, explosiveness, mobility, core, legs, arms, finishing, midrange, three-point shooting, passing and defending. Program equipment, solo setup and prescriptions live in `app/model.ts`. Video links, chapter offsets, coaching cues, tracking modes and rest periods live in `app/video-guides.ts`. Links open YouTube only when selected; no embedded players or third-party thumbnails load in the app.

The original three program definitions remain in `legacyPrograms` so existing histories and backups still validate. Do not change historical prescriptions in place. The active library uses separate program IDs.

Run `node tests/catalog.test.cjs` to check catalog coverage, workout rendering, filters, timed-set handling and old/new backup roundtrips.
