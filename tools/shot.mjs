// Run: node tools/shot.mjs  -> screenshots in tools/preview/, plus behavior checks.
// Uses puppeteer-core from the einfo-widgets video package and the system Chrome. Serves the site on 127.0.0.1 only.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const puppeteer = createRequire("C:/Research-Lab/einfo-widgets/interactive-maps/video/package.json")("puppeteer-core");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "tools", "preview");
fs.mkdirSync(OUT, { recursive: true });

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".md": "text/plain" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/\/$/, "/index.html"));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404).end("nf"); return; }
  res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" }).end(fs.readFileSync(p));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const NAMES = ["王小明", "李大華", "陳怡君", "林志豪", "張雅婷", "黃建宏", "吳佩珊", "劉冠廷", "蔡欣怡", "鄭宇軒", "謝佳穎", "歐陽慕容"];
const SIZES = [
  { tag: "1920x1080", width: 1920, height: 1080, dpr: 1, mobile: false },
  { tag: "1280x720", width: 1280, height: 720, dpr: 1, mobile: false },
  { tag: "390x844", width: 390, height: 844, dpr: 2, mobile: true },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) fails++; };

const browser = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new", args: ["--no-sandbox"] });

async function open(size, { reduced = false, noStorage = false } = {}) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: size.width, height: size.height, deviceScaleFactor: size.dpr, isMobile: size.mobile, hasTouch: size.mobile });
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  if (noStorage) await page.evaluateOnNewDocument(() => { Object.defineProperty(window, "localStorage", { get() { throw new DOMException("blocked", "SecurityError"); } }); });
  const problems = [];
  const external = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") problems.push(`console.${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => problems.push(`requestfailed: ${r.url()}`));
  page.on("request", (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith("data:")) external.push(r.url()); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  return { ctx, page, problems, external };
}
const fill = (page, names) => page.evaluate((t) => { const el = document.getElementById("names"); el.value = t; el.dispatchEvent(new Event("input", { bubbles: true })); }, names.join("\n"));
const shot = (page, size, name, full = false) => page.screenshot({ path: path.join(OUT, `${size.tag}-${name}.png`), fullPage: full && size.mobile });
const visible = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.hidden && e.getBoundingClientRect().width > 0; }, sel);

for (const size of SIZES) {
  console.log(`\n== ${size.tag}`);
  const { ctx, page, problems, external } = await open(size);
  await shot(page, size, "1-empty", true);
  await page.click("#btnDraw"); // empty list: hint, no crash
  check((await page.$eval("#hint", (e) => e.textContent)).includes("貼上"), "empty list shows a hint");

  await fill(page, ["", ...NAMES.slice(0, 5), "  ", ...NAMES.slice(5), "王小明"]);
  await shot(page, size, "2-filled", true);
  check((await page.$eval("#remain", (e) => e.textContent)) === "剩 13 人", "remaining count = 13 (blank lines skipped, duplicate kept)");
  check(await visible(page, "#dupe"), "duplicate warning is shown");
  await fill(page, NAMES);

  // animation frames
  const t0 = Date.now();
  await page.click("#btnDraw");
  for (const [ms, tag] of [[800, "3a-anim-0.8s"], [1600, "3b-anim-1.6s"], [2400, "3c-anim-2.4s"]]) {
    await sleep(Math.max(0, t0 + ms - 90 - Date.now()));
    await shot(page, size, tag);
    console.log(`   ${tag} captured at ${Date.now() - t0}ms`);
  }
  await page.waitForSelector("#card:not([hidden])", { timeout: 6000 });
  console.log(`   card visible at ~${Date.now() - t0}ms`);
  await sleep(800);
  await shot(page, size, "4-result");
  const first = await page.$eval("#cardName", (e) => e.textContent);
  check(NAMES.includes(first), `winner "${first}" is from the list`);
  check((await page.$eval("#remain", (e) => e.textContent)) === "剩 11 人", "remaining count dropped to 11");
  check(await page.evaluate(() => { const c = document.getElementById("card").getBoundingClientRect(), n = document.getElementById("cardName"); const r = n.getBoundingClientRect(); return c.left >= 0 && c.right <= innerWidth && r.left >= c.left && r.right <= c.right + 1 && c.top >= 0 && c.bottom <= innerHeight; }), "result card and name fit in the viewport/card");
  await page.click("#btnNext");

  // draw everyone with skip
  for (let i = 0; i < 11; i++) {
    await page.click("#btnDraw");
    await sleep(120);
    await page.mouse.click(5, 5); // click on overlay = skip
    await page.waitForSelector("#card:not([hidden])", { timeout: 3000 });
    await page.click("#btnNext");
  }
  await sleep(300);
  await shot(page, size, "5-exhausted", true);
  check((await page.$eval("#remain", (e) => e.textContent)) === "剩 0 人", "list exhausted (剩 0 人)");
  check((await page.$eval("#hint", (e) => e.textContent)).includes("抽完"), "exhausted hint shown");
  const winners = await page.$$eval("#winners .who", (els) => els.map((e) => e.textContent));
  check(winners.length === 12 && new Set(winners).size === 12, "12 distinct winners in the log");
  await page.click("#btnDraw"); // draw on empty again: must not hang
  check(!(await visible(page, "#reveal")), "drawing from an empty list does not open the overlay");
  check(external.length === 0, `no requests left 127.0.0.1 (${external.length})`);
  check(problems.length === 0, `console clean (${problems.join(" | ") || "no errors"})`);
  await ctx.close();
}

console.log("\n== behavior checks @1280x720");
const S = SIZES[1];
{ // keyboard flow + persistence + repeat mode + focus mode
  const { ctx, page, problems } = await open(S);
  await fill(page, NAMES);
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press("Space");
  await sleep(300);
  check(await visible(page, "#reveal"), "Space starts a draw");
  await page.keyboard.press("Space");
  await page.waitForSelector("#card:not([hidden])", { timeout: 3000 });
  check(true, "Space skips the animation to the result");
  await page.keyboard.press("Enter");
  await sleep(200);
  check(!(await visible(page, "#reveal")), "Enter on the result card dismisses it");
  await page.reload({ waitUntil: "networkidle0" });
  check((await page.$eval("#remain", (e) => e.textContent)) === "剩 11 人" && (await page.$$eval("#winners li", (l) => l.length)) === 1, "list and log survive a reload (localStorage)");
  await page.click("#repeat");
  await page.click("#btnDraw"); await sleep(150); await page.mouse.click(5, 5);
  await page.waitForSelector("#card:not([hidden])"); await page.click("#btnNext");
  check((await page.$eval("#remain", (e) => e.textContent)).startsWith("共 11 人"), "repeat mode keeps the list at 11");
  await page.click("#btnFocus");
  check(!(await visible(page, "#names")), "focus mode hides the side panels");
  await page.click("#btnFocus");
  await page.click("#btnClearAll"); await page.click("#btnClearAll");
  check((await page.$eval("#names", (e) => e.value)) === "" && (await page.$$eval("#winners li", (l) => l.length)) === 0, "clear-all empties list and log (two-step confirm)");
  await page.reload({ waitUntil: "networkidle0" });
  check((await page.$eval("#names", (e) => e.value)) === "", "cleared state persists");
  check(problems.length === 0, `console clean (${problems.join(" | ") || "no errors"})`);
  await ctx.close();
}
{ // reduced motion
  const { ctx, page, problems } = await open(S, { reduced: true });
  await fill(page, NAMES);
  const t0 = Date.now();
  await page.click("#btnDraw");
  await page.waitForSelector("#card:not([hidden])", { timeout: 2000 });
  check(Date.now() - t0 < 1500, `reduced motion shows the result immediately (${Date.now() - t0}ms)`);
  await sleep(300);
  await shot(page, S, "6-reduced-motion");
  check(problems.length === 0, `console clean (${problems.join(" | ") || "no errors"})`);
  await ctx.close();
}
{ // no localStorage at all
  const { ctx, page, problems } = await open(S, { noStorage: true });
  await fill(page, NAMES);
  await page.click("#btnDraw"); await sleep(150); await page.mouse.click(5, 5);
  await page.waitForSelector("#card:not([hidden])", { timeout: 3000 });
  check(true, "works with localStorage blocked");
  check(problems.length === 0, `console clean (${problems.join(" | ") || "no errors"})`);
  await ctx.close();
}
{ // long name + 40 names (capsule cap at 30)
  const { ctx, page, problems } = await open(S);
  await fill(page, Array.from({ length: 40 }, (_, i) => `人員${i + 1}`));
  check((await page.$$eval("#caps .cap", (c) => c.length)) === 30, "dome draws at most 30 capsules for 40 names");
  await shot(page, S, "7-forty-names");
  await fill(page, ["Wolfgang Amadeus Mozart-Kowalski-Yamamoto the Third of Salzburg"]);
  await page.click("#btnDraw"); await sleep(150); await page.mouse.click(5, 5);
  await page.waitForSelector("#card:not([hidden])");
  await sleep(500);
  await shot(page, S, "8-long-name");
  check(problems.length === 0, `console clean (${problems.join(" | ") || "no errors"})`);
  await ctx.close();
}

await browser.close();
server.close();
console.log(fails ? `\n${fails} check(s) FAILED` : "\nall checks passed");
process.exit(fails ? 1 : 0);
