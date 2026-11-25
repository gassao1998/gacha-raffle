# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-25

### Added

- Cartoon gacha machine drawn in SVG: glass dome with up to 30 capsules, handle, exit flap.
- Name list box (one name per line, blank lines skipped, duplicates kept with a notice) and a remaining-count display.
- Draw by button, handle click, Space or Enter; about 3.3 second animation (crank, tumble, drop, roll to the front, wobble, open) with confetti and a very large winner card; skippable.
- Winners removed from the list by default, optional repeat mode, winner log with time and "put back", exhausted-list notice.
- Sound effects synthesized with Web Audio (ratchet clicks, thud, bell) with a remembered mute switch.
- Fullscreen and focus (projection) modes; layouts for 1920x1080, 1280x720 and 390x844.
- Unbiased winner selection with `crypto.getRandomValues` and rejection sampling, decided before the animation starts.
- `prefers-reduced-motion` support, keyboard operation, aria labels.
- State kept in `localStorage` (guarded, works without it) with a clear-all button; no network requests.
- `tools/selftest.mjs` (logic checks) and `tools/shot.mjs` (Puppeteer screenshots and behavior checks).
- `docs/references.md` with art direction and references.
