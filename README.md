# Gacha Raffle

A cartoon capsule-toy (gachapon) machine for live raffles at talks. Paste a list of names, turn the handle, a capsule drops out and opens to show the winner in huge type. It is a static site: plain HTML, CSS and JavaScript, no build step, no framework, no external requests.

The interface is in Traditional Chinese (Taiwan).

## How to use

1. Paste names into the list box on the left, one per line. Blank lines are ignored. Duplicate names are kept (each counts as one person) and a notice lists them so you can decide.
2. Press the big button, click the machine's handle, or press Space or Enter. Press once more during the animation (or click anywhere) to skip straight to the result.
3. The winner is removed from the list by default. Tick "可重複中獎" to let people win again. The log on the right keeps order, name and time; "放回名單" puts a winner back (for example when they are not in the room).
4. When the list is empty the machine says so and nothing breaks.

Other controls: "專注" hides the side panels for projection, "音效" mutes or unmutes (remembered), "全螢幕" toggles fullscreen, "清除全部" clears the list and the log (press twice to confirm).

Keys: Space or Enter draws, skips the animation, or dismisses the result card; Esc skips or dismisses. With the cursor in the list box the keys type normally.

With `prefers-reduced-motion` set, the animation and confetti are skipped and the result shows immediately.

## Fairness

The winner is chosen before the animation starts, using `crypto.getRandomValues` and rejection sampling (`randomInt` in `raffle.js`), so there is no modulo bias. The animation is only a show. `node tools/selftest.mjs` checks the rejection logic and that 140,000 draws over 7 names land within 3% of the mean each.

## Privacy

Names never leave your browser. The page makes no network requests after it loads: no analytics, no trackers, no web fonts (it uses system fonts), no CDN scripts. The list, the log and your sound and layout settings are stored in `localStorage` under the key `gacha-raffle:v1` so a reload does not lose them. If `localStorage` is unavailable (private mode, blocked storage) the app still works for the session. "清除全部" removes the stored list and log. On a shared computer, press it when you are done.

## Run locally

Because the scripts are classic scripts (not ES modules), you can simply open `index.html` in a browser. Or serve the folder:

```
python -m http.server 8000      # then open http://127.0.0.1:8000/
```

## Deploy

Serve the repository root as a static site, for example GitHub Pages from the main branch. Nothing needs building. `tools/` and `docs/` are not needed at runtime.

## Files

| File | Purpose |
|------|---------|
| `index.html`, `style.css` | Page and styling (machine drawn as inline SVG) |
| `raffle.js` | Pure draw logic: `parseNames`, `findDuplicates`, `randomInt`, `drawOne`. Works in the browser and in Node |
| `app.js` | UI, animation timeline, Web Audio sound effects, confetti, storage |
| `tools/selftest.mjs` | `node tools/selftest.mjs`: logic checks, no browser needed |
| `tools/shot.mjs` | Puppeteer script: screenshots at 1920x1080, 1280x720 and 390x844, plus behavior checks. It imports `puppeteer-core` from a path on the author's machine and uses the system Chrome, so edit the two paths at the top to run it elsewhere |
| `docs/references.md` | Art direction and references |

## Test

```
node tools/selftest.mjs
node tools/shot.mjs        # writes tools/preview/*.png (not meant to be committed)
```
