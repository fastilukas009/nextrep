# NextRep · beta 0.1

A Finnish, mobile-first training app for basketball players. React + TypeScript, Vinext, Cloudflare Workers and D1. No paid AI calls or advertising SDKs in this version.

## Working features
- Persistent signed-in profile, goal preferences and training diary.
- Three example workout plans with completion tracking; three step-by-step skill drills.
- Meal diary, editable macro values, ingredient/portion calculator and meal ideas.
- Local video upload and camera recording; slow playback, frame stepping, three-point 2D angle measurement, saved personal observations.
- Three manually scored solo shooting challenges and personal records.
- Invite-code two-player rooms with server-timed countdown and 60-second competition, polled scores and player authorization.
- XP, daily activity rewards, achievements and a cosmetic shop with server-side balance checks.
- Responsive dashboard and web-app manifest.

## Not implemented yet
- Food-photo AI recognition. Selecting a food photo does not estimate macros.
- Automatic shot detection, video-based result verification and automated technique/movement feedback.
- Coach-approved individualized PT and diet plans; the current content is explicitly labeled example material.
- Uploaded coach instruction videos, public verified leaderboard, public matchmaking, sponsors and advertising.
- App Store packaging and multi-user field testing on real phones.

Recorded videos and food photos stay in browser memory; they are not uploaded. Download a recorded video before leaving the page. Profile, diary records, notes and rewards are stored in D1 under the authenticated user's Sites-specific ID. Only the player's name and manually entered score are shared with the other participant in an invited room. A private Site requires granting the invited player access before live play. No personal founder details are included.

The first completion of each activity kind per Helsinki calendar day earns rewards. Repeat sessions are saved without additional daily rewards. The UI loads the latest 300 diary records; lifetime XP and coin balances use all entries. Times and hosted accounts are controlled by the server. Competition results are unverified and have no cash value.

## Local development
Use Node 22.13+ and the supplied lockfile. Install dependencies with `pnpm install --frozen-lockfile`. Run `pnpm dev` in a supported local Sites environment. The supplied Sites helpers manage the environment profile. The production authentication path is dispatch-owned; do not expose the Worker directly without a verified authentication boundary.

`node node_modules/typescript/bin/tsc --noEmit`
`node tests/core.test.cjs` (Node 24, built-in SQLite)
`pnpm build`

D1 schema lives in `db/schema.ts`; generated migrations are in `drizzle/`. Bind `DB` in `.openai/hosting.json`. The publication workflow applies migrations. Local preview migrations are separate.

## GitHub

Source repository: https://github.com/fastilukas009/nextrep

Hosted beta: https://nextrep-beta.qwerxm.chatgpt.site

The app uses a server and D1 database; GitHub Pages alone cannot run it. Runtime credentials and user data are not included in this repository. Never commit `.env` or `.dev.vars` files.

## Validation
TypeScript compilation, production build and API/core checks are run before deployment. The API checks execute the actual route handlers against an isolated in-memory SQLite adapter. Browser and device testing has not been performed in this environment; camera permissions/codec support, accessibility and two-phone live play still need real-device verification.
