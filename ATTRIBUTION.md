# Attribution

The exercise library bundled with this app is assembled at build time by
`scripts/build-library.mjs` from the following sources.

## Free Exercise DB

- Source: <https://github.com/yuhonas/free-exercise-db>
- Licence: **The Unlicense** (public domain dedication)
- Used for: strength exercises and stretching/mobility movements, including
  their names, instructions, equipment/level metadata, and photographs.
- Images are loaded directly from the project's GitHub raw URLs under
  `exercises/`.

> This is free and unencumbered software released into the public domain.
> For more information, please refer to <https://unlicense.org>

## Yoga API

- Source: <https://github.com/rebeccaestes/yoga_api> — API host:
  <https://yoga-api-nzy4.onrender.com>
- Licence: pose images are the project's **CC0** (public domain) image set.
- Used for: yoga pose names, Sanskrit names, descriptions, benefits, and PNG
  pose illustrations.
- The API is a free, cold-starting host. If it is unreachable during a build,
  the build logs a warning and ships without the yoga category rather than
  failing.

## Seeded mobility movements

The knees-friendly mobility movements (Tibialis Raise, ATG-style Split Squat,
Backward Treadmill Walk, Elevated Standing Calf Raise, Standing Knee-over-Toe
Stretch, Couch Stretch, Seated Good Morning) are described in this repository in
our own words using generic, descriptive names. They carry no images and are not
affiliated with, endorsed by, or derived from any commercial training program or
brand.

## Fonts

- **Archivo** and **Inter**, served via `next/font/google`. Both are licensed
  under the SIL Open Font License 1.1.

---

Nothing in this app is medical advice. Exercise descriptions are reference
information only.
