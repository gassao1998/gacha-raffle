// Run: node tools/selftest.mjs  (no browser needed)
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const { randomInt, parseNames, findDuplicates, drawOne } = createRequire(import.meta.url)("../raffle.js");

let passed = 0;
const test = (name, fn) => {
  fn();
  passed++;
  console.log(`ok  ${name}`);
};

test("parseNames trims, drops blank lines, handles CRLF and full-width spaces", () => {
  assert.deepEqual(parseNames("  王小明 \r\n\r\n　李大華　\n \n\tAlice Chen\t\nBob"), ["王小明", "李大華", "Alice Chen", "Bob"]);
  assert.deepEqual(parseNames(""), []);
  assert.deepEqual(parseNames("\n \n\t\n"), []);
  assert.deepEqual(parseNames(null), []);
});

test("findDuplicates reports repeats but parseNames keeps them", () => {
  const names = parseNames("A\nB\nA\nC\nA\nB");
  assert.equal(names.length, 6);
  assert.deepEqual(findDuplicates(names), [{ name: "A", count: 3 }, { name: "B", count: 2 }]);
  assert.deepEqual(findDuplicates(["x", "y"]), []);
});

test("drawOne removes the winner: everyone wins exactly once, then the list is empty", () => {
  const all = Array.from({ length: 50 }, (_, i) => `n${i}`);
  let pool = all.slice();
  const won = [];
  while (pool.length) {
    const before = pool.length;
    const r = drawOne(pool);
    assert.equal(r.rest.length, before - 1);
    assert.equal(r.name, pool[r.index]);
    assert.ok(!r.rest.includes(r.name));
    won.push(r.name);
    pool = r.rest;
  }
  assert.deepEqual(won.slice().sort(), all.slice().sort());
  assert.equal(drawOne(pool), null);
});

test("drawOne with duplicate names removes only one entry", () => {
  const r = drawOne(["A", "A", "A"]);
  assert.equal(r.name, "A");
  assert.deepEqual(r.rest, ["A", "A"]);
});

test("repeat mode keeps the list intact and never mutates the input", () => {
  const pool = ["a", "b", "c"];
  for (let i = 0; i < 100; i++) {
    const r = drawOne(pool, { repeat: true });
    assert.deepEqual(r.rest, ["a", "b", "c"]);
    assert.notEqual(r.rest, pool);
  }
  assert.deepEqual(pool, ["a", "b", "c"]);
});

test("empty list returns null without throwing, in both modes", () => {
  assert.equal(drawOne([]), null);
  assert.equal(drawOne([], { repeat: true }), null);
});

test("randomInt rejects the biased tail (n=3 rejects only 0xFFFFFFFF)", () => {
  const seq = [0xffffffff, 5];
  let calls = 0;
  assert.equal(randomInt(3, () => seq[calls++]), 5 % 3);
  assert.equal(calls, 2);
  // n=1 is always 0; invalid n throws.
  assert.equal(randomInt(1), 0);
  assert.throws(() => randomInt(0), RangeError);
  assert.throws(() => randomInt(1.5), RangeError);
});

test("randomInt with a large n (3e9, where modulo bias is worst) stays in range", () => {
  for (let i = 0; i < 1000; i++) {
    const v = randomInt(3_000_000_000);
    assert.ok(v >= 0 && v < 3_000_000_000);
  }
});

test("uniformity: 7 people x 140000 draws, each within 3% of the mean", () => {
  const people = ["a", "b", "c", "d", "e", "f", "g"];
  const draws = 140000;
  const counts = Object.fromEntries(people.map((p) => [p, 0]));
  for (let i = 0; i < draws; i++) counts[drawOne(people, { repeat: true }).name]++;
  const mean = draws / people.length;
  for (const p of people) {
    const dev = Math.abs(counts[p] - mean) / mean;
    assert.ok(dev < 0.03, `${p}: ${counts[p]} vs ${mean} (${(dev * 100).toFixed(2)}%)`);
  }
  console.log("    counts:", people.map((p) => counts[p]).join(" "), `(mean ${mean})`);
});

console.log(`\n${passed} tests passed`);
