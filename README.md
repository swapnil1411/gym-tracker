# GYM·LOG

A personal gym + mobility tracker. Next.js PWA, installable on Android, with
Firebase Auth and Cloud Firestore so your plan and history follow you across
devices — and keep working when the gym wifi doesn't.

- **Today** — your plan for the day as tappable cards, with a progress ring that
  fills as you tick things off.
- **Plan** — decide what each weekday is for: focus label, rest-day toggle,
  which exercises, in what order, at what sets × reps.
- **Stats** — streaks, a month heatmap, this week at a glance, weekly volume per
  muscle group, and recent sessions.

## Stack

| Piece | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth | Firebase Auth — email/password + Google |
| Data | Cloud Firestore with `persistentLocalCache` (offline-first) |
| PWA | `@ducanh2912/next-pwa` |
| Exercise library | Bundled at build time as static JSON — no runtime API calls |

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase values (below)
npm run dev                  # http://localhost:3000
```

`npm run dev` and `npm run build` both run `scripts/build-library.mjs` first,
which fetches and merges the exercise library into `data/library.json` and
`public/library.json`. **The first run needs an internet connection.**

Until you add Firebase env vars the app boots and shows a short setup note
instead of the login screen — that's expected, not a crash.

## Firebase setup

### 1. Create the project

1. Go to the [Firebase console](https://console.firebase.google.com) → **Add project**.
2. Name it (e.g. `gym-log`). Google Analytics is optional — you don't need it.

### 2. Register a web app

1. In the project, click the **Web** icon (`</>`) to add a web app.
2. Give it a nickname. **Don't** enable Firebase Hosting — Vercel handles hosting.
3. Copy the `firebaseConfig` values it shows you. You'll need them in step 5.

### 3. Enable authentication

**Build → Authentication → Get started**, then under **Sign-in method**:

- Enable **Email/Password**.
- Enable **Google**. Pick a support email when prompted.

Then under **Authentication → Settings → Authorized domains**, add your Vercel
domain (e.g. `gym-log.vercel.app`). `localhost` is already there. Google
sign-in fails with `auth/unauthorized-domain` if you skip this.

### 4. Create Firestore

**Build → Firestore Database → Create database**. Choose a region close to you.
Start in **production mode** — the rules in this repo replace the defaults.

### 5. Add the env vars

Fill in `.env.local` from the config in step 2:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

These are `NEXT_PUBLIC_*` and ship to the browser. That's how Firebase web apps
work and it's fine — the Firebase web config is an identifier, not a credential.
Your data is protected by the security rules in the next step, so deploying them
is not optional.

### 6. Deploy the security rules

`firestore.rules` locks every user to their own subtree:

```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

Deploy with the Firebase CLI:

```bash
npm i -g firebase-tools
firebase login
firebase use --add          # pick your project
firebase deploy --only firestore:rules
```

Or paste the file's contents into **Firestore Database → Rules → Publish**.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import it. Framework preset: Next.js.
3. **Settings → Environment Variables**: add all six `NEXT_PUBLIC_FIREBASE_*`
   values for Production, Preview, and Development.
4. Deploy. The build runs the library bundler automatically.
5. Back in Firebase, add your `*.vercel.app` domain to **Authentication →
   Settings → Authorized domains** (step 3 above).

### Installing on Android

Open the deployed site in Chrome → menu → **Add to Home screen**. It installs
standalone with its own icon. The service worker is disabled in development, so
test install behaviour against a production build (`npm run build && npm start`)
or the Vercel deployment.

## Data model

Everything lives under `users/{uid}`:

```
users/{uid}
  profile                    { displayName, createdAt }
  settings                   { weekStartsOn, units }
  plan/{dayOfWeek}           dayOfWeek 0=Mon … 6=Sun
                             { focusLabel, isRestDay,
                               items: [{ exerciseId, sets, reps, order }] }
  completions/{YYYY-MM-DD}   { entries: { [exerciseId]: { done, setsDone, at } } }
```

Two deliberate choices:

- **Completions are keyed to real calendar dates**, not weekdays, so streaks and
  history stay accurate across weeks.
- **The exercise library is not in Firestore.** It's public reference data, so it
  ships as a static file — no per-user reads, no cost, and it works offline.

Firestore is initialised with `persistentLocalCache` and a multi-tab manager, so
reads come from IndexedDB and writes queue locally and sync when you're back on
a signal.

## The exercise library

`scripts/build-library.mjs` merges three sources into ~900 exercises:

1. **Free Exercise DB** — strength + stretching, with photos.
2. **Yoga API** — yoga poses with CC0 images. This host is free and slow; if it's
   down at build time the script warns, reuses yoga from the previous build if
   there is one, and continues. It never fails the build.
3. **Seeded mobility moves** — seven knees-friendly movements described in-repo.

`primaryMuscles` is normalised into the app's groups (chest, back, legs,
shoulders, biceps, triceps, core), anything in the `stretching` category becomes
`mobility`, and yoga poses become `yoga`.

Rerun it any time with `npm run build:library`.

See [ATTRIBUTION.md](./ATTRIBUTION.md) for licences.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Bundle library, start dev server |
| `npm run build` | Bundle library, production build |
| `npm start` | Serve the production build |
| `npm run build:library` | Rebuild `library.json` only |
| `npm run typecheck` | `tsc --noEmit` |

## Notes

- Design follows the supplied prototype: dark athletic theme, Archivo + Inter,
  mobile-first at a 460px max width.
- `prefers-reduced-motion` is respected and focus states are visible throughout.
- Exercise images lazy-load and fall back to a coloured muscle-group tile if the
  remote image 404s.
- **Next.js is pinned to 15.x on purpose.** `next-pwa` generates the service
  worker through a webpack plugin, and Next 16 builds with Turbopack by default,
  which skips it — you'd get a silently non-installable app. Upgrade only
  alongside a PWA plugin that supports Turbopack.
