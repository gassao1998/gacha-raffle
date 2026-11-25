# Art references

## Direction

**Chunky sticker candy.** A gacha machine drawn like a die-cut sticker: thick navy outline, fat rounded shapes, flat candy colors, one highlight and one shade band per shape, hard offset shadows (no blur), on a warm cream paper background with a faint dot grid.

Concrete choices used in this repo:

- **Outline:** one ink color (`#2B2A4C`, never pure black), about 7 units on a 600-unit-tall machine (1.2% of its height), 5 for secondary details, round joins and caps.
- **Proportions:** a big round dome (almost the full width of the body), a squat body with an oversized rim, short feet. Capsules are chubby circles, not ovals. Fewer names get bigger capsules.
- **Palette:** red body, yellow trim, teal exit flap, plus pink, purple, blue, green and orange for capsules, all fully saturated but sitting on cream (`#FFF4D6`) instead of white so it stays easy on the eyes on a projector.
- **Capsule:** two halves, a colored top and a cream bottom, with a seam line and a small white shine. The reveal capsule is the same drawing scaled up so the two read as the same object.
- **Shadows:** hard offset only (`box-shadow: 0 .3rem 0 ink`), buttons press down by shrinking the shadow.
- **Motion:** squash and stretch on the wobble, overshoot easing when the capsule rolls to the front, a short pause before the pop. One draw lasts about 3.3 seconds and every phase can be skipped.

## References

Only style was borrowed; nothing is copied. Judgments below come from looking at the rendered thumbnails on Dribbble tag pages (opened in Chrome on 2026-11-25) and, for the last item, the page text. CodePen and Behance returned HTTP 403 to automated fetches, so no pens or Behance projects are cited. WebSearch was used 6 times.

| # | Source | Author | What to borrow |
|---|--------|--------|----------------|
| 1 | https://dribbble.com/shots/21363470-Fungi-Friends-Gachapon-Machine | Van Huynh | Flat, saturated illustration on a mustard ground. The dome is the character of the machine, with a purple body and warm accents. Borrowed: dome as the hero shape and a confident candy palette. |
| 2 | https://dribbble.com/shots/6228040-Hello-dribbble | Kai | A single gumball-style machine on a flat pink background, simple silhouette, clean outline. Borrowed: keep the silhouette readable at a glance, one flat background color behind it. |
| 3 | https://dribbble.com/shots/12835867-GashaMon | Danny Wan | Red background, heavy dark outline, a stacked machine with yellow accents and a marquee. Borrowed: very thick dark outlines and the red and yellow body pairing. |
| 4 | https://dribbble.com/shots/27021138-Gachapon | Lydia Amaruch | Sticker treatment (white die-cut edge) on a purple glitter ground, a cartoon character beside the machine. Borrowed: the sticker feel and the hard-edged look; character-like proportions. |
| 5 | https://dribbble.com/shots/20825599-Gatcha | Cat Hong | Flat shapes in a tight palette (mustard, teal, red), capsules drawn as overlapping plain circles with no detail. Borrowed: the overlapping pile of capsules and limiting how many colors appear at once. |
| 6 | https://dribbble.com/shots/22385490-GACHAPON | Nassima Hamidi | Soft pastel 3D render, a rounded chubby machine with a pile of capsules in the dome. Borrowed: proportions (big dome, squat body, round corners) and how the pile sits in the bottom of the dome. The 3D shading was not borrowed. |
| 7 | https://dribbble.com/shots/25943467-Stylized-gachapon | P.S. Blender | A purple stylized machine with a "LOADING" marquee and capsules in contrasting colors. Borrowed: the idea of a lettered sign on the body (the "好運扭蛋" plate) and capsule colors popping against a single-hue body. |
| 8 | https://flavortown.hackclub.com/projects/20889 | sadiyameem (Hack Club Flavortown, "Capsule Machine banner") | Web capsule machine; the project text describes shaking giving each capsule a random velocity, a smoothly rotating handle, and a flap that opens and closes. Borrowed: the motion order (crank, tumble, flap, drop). Its art is pixel style, so only the motion idea is used. |
