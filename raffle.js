/* Raffle logic: pure functions, no DOM. Works as a classic <script> (window.Raffle) and in Node (require). */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Raffle = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  // One uint32 from the platform CSPRNG.
  function cryptoRand32() {
    let c = root.crypto;
    if (!c || !c.getRandomValues) c = require("node:crypto").webcrypto;
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return buf[0];
  }

  // Uniform integer in [0, n) by rejection sampling: values in the biased tail are thrown away.
  function randomInt(n, rand32 = cryptoRand32) {
    if (!Number.isInteger(n) || n < 1 || n > 0x100000000) throw new RangeError("n must be an integer in 1..2^32");
    const limit = Math.floor(0x100000000 / n) * n;
    let v;
    do v = rand32(); while (v >= limit);
    return v % n;
  }

  // One name per line; trims (including full-width spaces) and drops blank lines. Duplicates are kept.
  function parseNames(text) {
    return String(text || "")
      .split(/\r\n|\r|\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // [{ name, count }] for names that appear more than once, in first-seen order.
  function findDuplicates(names) {
    const counts = new Map();
    for (const n of names) counts.set(n, (counts.get(n) || 0) + 1);
    return [...counts].filter(([, c]) => c > 1).map(([name, count]) => ({ name, count }));
  }

  // Decide the winner. Returns null when the list is empty.
  // repeat=false removes exactly one entry (the drawn index) from `rest`; repeat=true keeps everyone.
  function drawOne(names, { repeat = false, rand32 = cryptoRand32 } = {}) {
    if (!names.length) return null;
    const index = randomInt(names.length, rand32);
    const rest = repeat ? names.slice() : names.filter((_, i) => i !== index);
    return { index, name: names[index], rest };
  }

  return { randomInt, parseNames, findDuplicates, drawOne };
});
