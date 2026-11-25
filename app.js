/* Gacha raffle UI. Draw logic lives in raffle.js; everything here is presentation and local state. */
(() => {
  "use strict";
  const R = window.Raffle;
  const $ = (id) => document.getElementById(id);
  const els = Object.fromEntries(
    ["app", "names", "dupe", "repeat", "btnClearAll", "btnClearLog", "btnFocus", "btnSound", "btnFull", "btnDraw", "btnNext",
      "remain", "hint", "winners", "logEmpty", "caps", "crank", "flap", "exitDoor", "knob", "reveal", "backdrop", "confetti",
      "rcap", "rcapInner", "rtop", "rbot", "card", "cardLabel", "cardName", "live"].map((k) => [k, $(k)])
  );
  const PALETTE = ["#FF5A5F", "#FFC93C", "#2EC4B6", "#FF8FB1", "#8E6CEF", "#4D9DE0", "#7BD389", "#FF9F43"];
  const MAX_CAPS = 30;
  const KEY = "gacha-raffle:v1";
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- state + storage (every access wrapped; works with no localStorage) ---------- */
  const state = { winners: [], repeat: false, muted: false, focus: false };
  let memo = null;
  function load() {
    try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) { /* storage blocked */ }
    return memo;
  }
  function save() {
    memo = { text: els.names.value, winners: state.winners, repeat: state.repeat, muted: state.muted, focus: state.focus };
    try { localStorage.setItem(KEY, JSON.stringify(memo)); } catch (e) { /* storage blocked or full */ }
  }

  /* ---------- sound (Web Audio, synthesized) ---------- */
  const sfx = (() => {
    let ctx = null;
    const get = () => {
      if (state.muted) return null;
      try {
        if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
      } catch (e) { return null; }
    };
    const env = (g, t, peak, dur) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    };
    const osc = (c, { type = "sine", f0, f1, t = 0, dur, peak }) => {
      const o = c.createOscillator(), g = c.createGain(), s = c.currentTime + t;
      o.type = type;
      o.frequency.setValueAtTime(f0, s);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, s + dur);
      env(g, s, peak, dur);
      o.connect(g).connect(c.destination);
      o.start(s); o.stop(s + dur + 0.03);
    };
    const noise = (c, { t = 0, dur, peak, hp }) => {
      const len = Math.ceil(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), s = c.currentTime + t;
      src.buffer = buf; f.type = "highpass"; f.frequency.value = hp;
      env(g, s, peak, dur);
      src.connect(f).connect(g).connect(c.destination);
      src.start(s);
    };
    return {
      unlock: get,
      tick() { const c = get(); if (!c) return; noise(c, { dur: 0.03, peak: 0.25, hp: 2500 }); osc(c, { type: "square", f0: 1300, f1: 700, dur: 0.035, peak: 0.07 }); },
      thud(p = 0.5) { const c = get(); if (!c) return; osc(c, { f0: 190, f1: 48, dur: 0.24, peak: p }); noise(c, { dur: 0.06, peak: p * 0.3, hp: 400 }); },
      ding() {
        const c = get(); if (!c) return;
        osc(c, { f0: 1568, dur: 1.0, peak: 0.22 }); osc(c, { f0: 2349, dur: 0.8, peak: 0.1 });
        osc(c, { f0: 2093, t: 0.1, dur: 1.1, peak: 0.2 }); osc(c, { f0: 3136, t: 0.1, dur: 0.8, peak: 0.08 });
      },
    };
  })();

  /* ---------- machine drawing ---------- */
  function mulberry32(a) {
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // Rows of capsules piled from the bottom of the dome up; fewer names means a lower pile.
  function layoutCaps(k) {
    // Fewer names get bigger, chubbier capsules; 30 still fit (capacity per size checked by hand: 16, 22, 29, 35).
    const r = k <= 10 ? 28 : k <= 18 ? 25 : k <= 24 ? 22 : 20;
    const cx = 200, cy = 165, R0 = 118, rowH = r * 1.4, step0 = r * 1.9, bottom = 276 - r;
    const rnd = mulberry32(k * 7919 + 13);
    const items = [];
    let left = k;
    for (let row = 0; left > 0 && row < 10; row++) {
      const y = bottom - row * rowH, dy = y - cy;
      const hw = Math.sqrt(Math.max(0, R0 * R0 - dy * dy)) - r - 2;
      if (hw <= 0) break;
      const m = Math.min(left, Math.floor((2 * hw) / step0) + 1);
      const step = m > 1 ? Math.min(step0, (2 * hw) / (m - 1)) : 0;
      for (let j = 0; j < m; j++) {
        items.push({ s: r / 20, x: cx + (j - (m - 1) / 2) * step + (rnd() - 0.5) * 7, y: y + (rnd() - 0.5) * 7, row, c: PALETTE[(j * 3 + row * 5) % PALETTE.length], rot: Math.round(rnd() * 360), jx: Math.round((rnd() - 0.5) * 22) });
      }
      left -= m;
    }
    return items.reverse(); // top rows first, so lower capsules are drawn in front
  }
  function capMarkup(c, s) {
    return `<g transform="scale(${s})"><path d="M-20 0A20 20 0 0 1 20 0Z" fill="${c}"/><path d="M-20 0A20 20 0 0 0 20 0Z" fill="#FFF8E8"/>` +
      `<circle r="20" class="capline"/><path d="M-20 0H20" class="capline"/><path d="M-12 -8A14 14 0 0 1 -5 -13" class="capshine"/></g>`;
  }
  let capCount = -1;
  function renderCaps(k, force) {
    k = Math.min(k, MAX_CAPS);
    if (k === capCount && !force) return;
    capCount = k;
    els.caps.innerHTML = layoutCaps(k)
      .map((c, i) => `<g class="cap" style="--x:${c.x.toFixed(1)}px;--y:${c.y.toFixed(1)}px;--r:${c.rot}deg;--jx:${c.jx}px;--i:${i}">${capMarkup(c.c, c.s)}</g>`)
      .join("");
  }

  /* ---------- rendering ---------- */
  const names = () => R.parseNames(els.names.value);
  function setHint(text, alert) {
    els.hint.textContent = text || "";
    els.hint.classList.toggle("alert", !!(alert && text));
  }
  function fmtTime(t) {
    try { return new Date(t).toLocaleTimeString("zh-TW", { hour12: false, hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; }
  }
  function render() {
    const list = names(), n = list.length;
    els.remain.textContent = state.repeat ? `共 ${n} 人（可重複）` : `剩 ${n} 人`;
    renderCaps(n);
    const spent = n === 0;
    els.btnDraw.classList.toggle("spent", spent);
    els.btnDraw.textContent = spent ? (state.winners.length ? "名單抽完了" : "先貼上名單") : "抽一顆！";
    els.btnDraw.setAttribute("aria-label", spent ? "名單是空的，無法抽獎" : "抽獎：抽出下一位");

    const dupes = R.findDuplicates(list);
    els.dupe.hidden = dupes.length === 0;
    if (dupes.length) {
      const shown = dupes.slice(0, 4).map((d) => `${d.name}（${d.count} 次）`).join("、") + (dupes.length > 4 ? `…共 ${dupes.length} 個` : "");
      els.dupe.textContent = `有重複的名字：${shown}。照常保留，各算一人；要合併請直接改名單。`;
    }

    els.winners.innerHTML = "";
    for (const w of state.winners.slice().reverse()) {
      const li = document.createElement("li");
      const no = document.createElement("span"); no.className = "no"; no.textContent = `第 ${w.n} 位`;
      const who = document.createElement("span"); who.className = "who"; who.textContent = w.name;
      const when = document.createElement("span"); when.className = "when"; when.textContent = fmtTime(w.t);
      li.append(no, who, when);
      if (!state.repeat) {
        const b = document.createElement("button");
        b.type = "button"; b.className = "btn back"; b.textContent = "放回名單";
        b.setAttribute("aria-label", `把 ${w.name} 放回名單（第 ${w.n} 位）`);
        b.addEventListener("click", () => putBack(w));
        li.append(b);
      }
      els.winners.append(li);
    }
    els.logEmpty.hidden = state.winners.length > 0;
    els.btnClearLog.disabled = state.winners.length === 0;
    els.btnClearLog.style.opacity = state.winners.length ? "" : ".5";

    els.repeat.checked = state.repeat;
    els.app.classList.toggle("focus", state.focus);
    els.btnFocus.setAttribute("aria-pressed", String(state.focus));
    els.btnSound.setAttribute("aria-pressed", String(state.muted));
    els.btnSound.textContent = state.muted ? "音效 關" : "音效 開";
    els.btnSound.setAttribute("aria-label", state.muted ? "音效已靜音，按一下開啟" : "音效開啟中，按一下靜音");
  }
  function putBack(w) {
    state.winners = state.winners.filter((x) => x !== w);
    els.names.value = els.names.value.replace(/\s+$/, "") + (els.names.value.trim() ? "\n" : "") + w.name;
    setHint(`已把 ${w.name} 放回名單`);
    save(); render();
  }

  /* ---------- draw flow ---------- */
  let phase = "idle"; // idle | animating | result
  let run = null;
  let pending = null;

  function onAction() {
    if (phase === "idle") startDraw();
    else if (phase === "animating") skip();
    else dismiss();
  }

  function startDraw() {
    const list = names();
    const res = R.drawOne(list, { repeat: state.repeat }); // the winner is fixed here; the animation is only theater
    if (!res) {
      setHint(state.winners.length ? "名單抽完了！貼上新名單，或勾選「可重複中獎」。" : "先在名單框貼上名字，一行一個。", true);
      if (!state.winners.length) els.names.focus();
      return;
    }
    setHint("");
    sfx.unlock();
    pending = { res, color: PALETTE[Math.floor(Math.random() * PALETTE.length)], n: state.winners.length ? state.winners[state.winners.length - 1].n + 1 : 1 };
    els.rcap.style.setProperty("--capc", pending.color);
    phase = "animating";
    els.reveal.classList.remove("done");
    els.reveal.hidden = false;
    els.card.hidden = true;
    els.backdrop.style.opacity = "0";
    els.rcap.style.opacity = "0";
    if (reduced()) { finish(true); return; }
    run = { skipped: false, done: false, anims: new Set(), timers: new Set(), wakes: new Set() };
    sequence(run).catch(() => finish(true));
  }

  const sleep = (r, ms) => new Promise((res) => {
    const t = setTimeout(() => { r.timers.delete(t); r.wakes.delete(res); res(); }, ms);
    r.timers.add(t); r.wakes.add(res);
  });
  const play = (r, el, frames, opts) => {
    const a = el.animate(frames, { fill: "forwards", ...opts });
    r.anims.add(a);
    return a.finished.catch(() => {});
  };

  async function sequence(r) {
    const alive = () => !r.skipped;
    const exit = els.exitDoor.getBoundingClientRect();
    const cap = els.rcap.getBoundingClientRect(); // untransformed: sits at screen center
    const S = cap.width, cx = cap.left + S / 2, cy = cap.top + S / 2;
    const k0 = (exit.width * 0.34) / S;
    const dx = exit.left + exit.width / 2 - cx, dy = exit.top + exit.height * 0.5 - cy;
    const fall = exit.height * 1.05;
    const at = (x, y, s, rot) => `translate(${x}px, ${y}px) scale(${s}) rotate(${rot}deg)`;

    // 0.0s: crank turns once, capsules tumble, ratchet clicks
    els.caps.classList.add("shaking");
    play(r, els.crank, [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], { duration: 900, easing: "ease-in-out" });
    [0, 110, 230, 360, 500, 650, 800].forEach((ms) => { const t = setTimeout(() => alive() && sfx.tick(), ms); r.timers.add(t); });
    await sleep(r, 900); if (!alive()) return;

    // 0.9s: one capsule slips out of the pile
    const chosen = els.caps.lastElementChild;
    if (chosen) play(r, chosen, [{ translate: "0 0", opacity: 1 }, { translate: "0 46px", opacity: 0 }], { duration: 300, easing: "ease-in" });
    await sleep(r, 300); if (!alive()) return;

    // 1.2s: flap swings open, capsule drops out
    play(r, els.flap, [{ transform: "scaleY(1)" }, { transform: "scaleY(.12)" }], { duration: 220, easing: "ease-out" });
    play(r, els.rcap, [
      { opacity: 0, transform: at(dx, dy, k0, 0), offset: 0 },
      { opacity: 1, transform: at(dx, dy, k0, 0), offset: 0.12 },
      { opacity: 1, transform: at(dx, dy + fall, k0, 40), offset: 1 },
    ], { duration: 380, easing: "cubic-bezier(.5,0,.9,.6)" });
    await sleep(r, 380); if (!alive()) return;
    sfx.thud(0.5);

    // 1.6s: it rolls to the front and grows, screen dims
    play(r, els.backdrop, [{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
    play(r, els.flap, [{ transform: "scaleY(.12)" }, { transform: "scaleY(1)" }], { duration: 300, delay: 250 });
    play(r, els.rcap, [
      { transform: at(dx, dy + fall, k0, 40) },
      { transform: at(dx * 0.4, dy * 0.15, 0.7, 360), offset: 0.55 },
      { transform: at(0, 0, 1, 720) },
    ], { duration: 800, easing: "cubic-bezier(.25,.9,.3,1.12)" });
    await sleep(r, 560); els.caps.classList.remove("shaking");
    await sleep(r, 240); if (!alive()) return;
    sfx.thud(0.7);

    // 2.4s: wobble
    await play(r, els.rcapInner, [
      { transform: "rotate(0) scale(1,1)" }, { transform: "rotate(-16deg) scale(1.04,.96)" }, { transform: "rotate(13deg) scale(.97,1.03)" },
      { transform: "rotate(-9deg)" }, { transform: "rotate(5deg)" }, { transform: "rotate(0)" },
    ], { duration: 750, easing: "ease-in-out" });
    if (!alive()) return;

    // 3.1s: pop open
    play(r, els.rtop, [{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: "translate(-30px,-62px) rotate(-38deg)", opacity: 0 }], { duration: 420, easing: "ease-out" });
    play(r, els.rbot, [{ transform: "translate(0,0)", opacity: 1 }, { transform: "translate(6px,22px)", opacity: 0 }], { duration: 420, delay: 60, easing: "ease-in" });
    await sleep(r, 90); if (!alive()) return;
    finish(false);
  }

  function skip() {
    if (!run || run.skipped) return;
    run.skipped = true;
    run.timers.forEach(clearTimeout); run.timers.clear();
    run.wakes.forEach((w) => w()); run.wakes.clear();
    run.anims.forEach((a) => { try { a.cancel(); } catch (e) { /* already gone */ } });
    run.anims.clear();
    finish(true);
  }

  function finish(quick) {
    if (phase !== "animating") return;
    phase = "result";
    if (run) run.done = true;
    const { res, n } = pending;
    state.winners.push({ n, name: res.name, t: Date.now() });
    if (!state.repeat) els.names.value = res.rest.join("\n");
    save();

    els.caps.classList.remove("shaking");
    if (quick) hideCap(); else setTimeout(() => phase === "result" && hideCap(), 480); // let the two halves finish flying away
    els.reveal.classList.add("done");
    els.backdrop.style.opacity = "1";
    if (quick) { els.backdrop.getAnimations().forEach((a) => a.cancel()); }
    render();

    els.cardLabel.textContent = `第 ${n} 位`;
    els.cardName.textContent = res.name;
    els.btnNext.textContent = !state.repeat && res.rest.length === 0 ? "名單抽完了，收下" : "好，繼續";
    els.card.hidden = false;
    fitName();
    els.card.classList.remove("pop", "quick");
    void els.card.offsetWidth;
    els.card.classList.add("pop");
    if (quick || reduced()) els.card.classList.add("quick");
    els.live.textContent = `第 ${n} 位：${res.name}`;
    sfx.ding();
    confetti();
    els.btnNext.focus({ preventScroll: true });
  }

  function hideCap() {
    [els.rcap, els.rcapInner, els.rtop, els.rbot].forEach((e) => e.getAnimations().forEach((a) => a.cancel()));
    els.rcap.style.opacity = "0";
  }

  function dismiss() {
    if (phase !== "result") return;
    phase = "idle";
    stopConfetti();
    els.reveal.hidden = true;
    els.card.hidden = true;
    [els.rcap, els.rcapInner, els.rtop, els.rbot, els.flap, els.crank, els.backdrop].forEach((e) => e.getAnimations().forEach((a) => a.cancel()));
    renderCaps(names().length, true);
    if (names().length === 0) setHint("名單抽完了！貼上新名單，或勾選「可重複中獎」。", true);
    els.btnDraw.focus({ preventScroll: true });
  }

  function fitName() {
    const el = els.cardName;
    el.classList.remove("wrap");
    const avail = el.parentElement.clientWidth - 48;
    let size = Math.max(40, Math.min(window.innerHeight * 0.24, window.innerWidth * 0.17));
    el.style.fontSize = `${size}px`;
    for (let i = 0; i < 40 && el.scrollWidth > avail && size > 34; i++) { size *= 0.93; el.style.fontSize = `${size}px`; }
    if (el.scrollWidth > avail) el.classList.add("wrap");
  }

  /* ---------- confetti ---------- */
  let confettiId = 0;
  function stopConfetti() {
    confettiId++;
    const c = els.confetti, x = c.getContext("2d");
    if (x) x.clearRect(0, 0, c.width, c.height);
  }
  function confetti() {
    stopConfetti();
    if (reduced()) return;
    const id = confettiId, c = els.confetti, dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(innerWidth * dpr); c.height = Math.round(innerHeight * dpr);
    const x = c.getContext("2d");
    if (!x) return;
    const W = innerWidth, H = innerHeight, u = Math.min(W, H) / 800 + 0.6;
    const parts = Array.from({ length: 160 }, () => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = (9 + Math.random() * 15) * u;
      return { x: W / 2, y: H * 0.45, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: (6 + Math.random() * 8) * u, h: (4 + Math.random() * 6) * u, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, c: PALETTE[Math.floor(Math.random() * PALETTE.length)], round: Math.random() < 0.25 };
    });
    let last = performance.now();
    const t0 = last;
    (function frame(now) {
      if (id !== confettiId) return;
      const dt = Math.min((now - last) / 16.7, 3); last = now;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.clearRect(0, 0, W, H);
      const fade = Math.max(0, Math.min(1, (3600 - (now - t0)) / 800));
      x.globalAlpha = fade;
      for (const p of parts) {
        p.vy += 0.42 * u * dt; p.vx *= 0.992; p.vy *= 0.992;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.fillStyle = p.c; x.strokeStyle = "#2B2A4C"; x.lineWidth = 1.5;
        if (p.round) { x.beginPath(); x.arc(0, 0, p.w / 2, 0, 6.28); x.fill(); x.stroke(); } else { x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        x.restore();
      }
      if (now - t0 < 3600) requestAnimationFrame(frame); else x.clearRect(0, 0, W, H);
    })(last);
  }

  /* ---------- events ---------- */
  function armConfirm(btn, armedText, action) {
    const idle = btn.textContent;
    let timer = 0;
    btn.addEventListener("click", () => {
      if (btn.classList.contains("armed")) { clearTimeout(timer); btn.classList.remove("armed"); btn.textContent = idle; action(); return; }
      btn.classList.add("armed"); btn.textContent = armedText;
      timer = setTimeout(() => { btn.classList.remove("armed"); btn.textContent = idle; }, 3500);
    });
  }

  els.names.addEventListener("input", () => { setHint(""); save(); render(); });
  els.repeat.addEventListener("change", () => { state.repeat = els.repeat.checked; save(); render(); });
  els.btnDraw.addEventListener("click", onAction);
  els.knob.addEventListener("click", onAction);
  els.btnNext.addEventListener("click", dismiss);
  els.reveal.addEventListener("click", (e) => { if (phase === "animating" && e.target !== els.btnNext) skip(); });
  els.btnSound.addEventListener("click", () => { state.muted = !state.muted; if (!state.muted) sfx.tick(); save(); render(); });
  els.btnFocus.addEventListener("click", () => { state.focus = !state.focus; save(); render(); });
  armConfirm(els.btnClearAll, "再按一次確認清除", () => {
    els.names.value = ""; state.winners = [];
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    memo = null; save(); setHint("已清除名單與紀錄"); render();
  });
  armConfirm(els.btnClearLog, "再按一次確認", () => { state.winners = []; save(); render(); });

  document.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    if (e.key === "Escape" && phase !== "idle") { e.preventDefault(); onAction(); return; }
    if (e.key !== " " && e.key !== "Enter") return;
    if (e.target.closest && e.target.closest("textarea,input,select,button,a,[contenteditable]")) return; // native behavior wins
    e.preventDefault();
    onAction();
  });

  if (document.fullscreenEnabled) {
    const sync = () => { els.btnFull.textContent = document.fullscreenElement ? "離開全螢幕" : "全螢幕"; els.btnFull.setAttribute("aria-label", document.fullscreenElement ? "離開全螢幕" : "進入全螢幕"); };
    els.btnFull.addEventListener("click", () => {
      (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});
    });
    document.addEventListener("fullscreenchange", sync);
  } else {
    els.btnFull.hidden = true;
  }

  /* ---------- boot ---------- */
  const saved = load();
  if (saved && typeof saved === "object") {
    els.names.value = typeof saved.text === "string" ? saved.text : "";
    if (Array.isArray(saved.winners)) state.winners = saved.winners.filter((w) => w && typeof w.name === "string" && Number.isFinite(w.n));
    state.repeat = !!saved.repeat; state.muted = !!saved.muted; state.focus = !!saved.focus;
  }
  render();
})();
