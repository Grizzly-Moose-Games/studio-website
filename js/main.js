(() => {
  const STUDIO_EMAIL = "GrizzlyMooseGames@gmail.com";

  // ---------- Inked illustrations ----------
  // Every shape is knocked out in paper, filled with a spot colour nudged off-register,
  // then outlined in ink along a slightly wandering line, like a screen print of a pen drawing.
  const MISREGISTER = [2.5, 1.8];
  const INK_WIDTH = 2.6;
  const WANDER = 1.5;
  const STEP = 6;

  const rng = (seed) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const smoothNoise = (r) => {
    const pts = Array.from({ length: 64 }, () => r() * 2 - 1);
    return (x) => {
      const i = Math.floor(x);
      const f = x - i;
      const t = f * f * (3 - 2 * f);
      const a = pts[i & 63];
      const b = pts[(i + 1) & 63];
      return a + (b - a) * t;
    };
  };

  const handPath = (pts, closed, r, wander = WANDER) => {
    const nx = smoothNoise(r);
    const ny = smoothNoise(r);
    const seq = closed ? [...pts, pts[0]] : pts;
    const path = new Path2D();
    let dist = 0;
    for (let i = 0; i < seq.length - 1; i++) {
      const [x0, y0] = seq[i];
      const [x1, y1] = seq[i + 1];
      const len = Math.hypot(x1 - x0, y1 - y0);
      const n = Math.max(1, Math.ceil(len / STEP));
      for (let k = i === 0 ? 0 : 1; k <= n; k++) {
        const t = k / n;
        const d = (dist + len * t) * 0.035;
        const x = x0 + (x1 - x0) * t + nx(d) * wander;
        const y = y0 + (y1 - y0) * t + ny(d) * wander;
        if (i === 0 && k === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
      dist += len;
    }
    if (closed) path.closePath();
    return path;
  };

  const inked = (ctx, c, path, fill, width = INK_WIDTH) => {
    ctx.fillStyle = c.paper;
    ctx.fill(path);
    if (fill) {
      ctx.save();
      ctx.translate(MISREGISTER[0], MISREGISTER[1]);
      ctx.fillStyle = fill;
      ctx.fill(path);
      ctx.restore();
    }
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = c.ink;
    ctx.stroke(path);
  };

  const stroke = (ctx, c, path, width) => {
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = c.ink;
    ctx.stroke(path);
  };

  // A spruce: drooping tiers, never quite symmetrical
  const sprucePoints = (x, base, h, r) => {
    const w = h * (0.34 + r() * 0.08);
    const tiers = 5 + Math.floor(r() * 3);
    const top = base - h;
    const crown = h * 0.86;
    const right = [];
    const left = [];
    for (let i = 1; i <= tiers; i++) {
      const t = i / tiers;
      const y = top + crown * t;
      const reach = w * t * 0.5;
      right.push([x + reach * (0.88 + r() * 0.24), y]);
      left.push([x - reach * (0.88 + r() * 0.24), y]);
      if (i < tiers) {
        right.push([x + reach * 0.42, y - h * 0.012]);
        left.push([x - reach * 0.42, y - h * 0.012]);
      }
    }
    const trunk = Math.max(2, w * 0.055);
    right.push([x + trunk, top + crown], [x + trunk, base]);
    left.push([x - trunk, top + crown], [x - trunk, base]);
    return [[x + (r() - 0.5) * 2, top], ...right, ...left.reverse()];
  };

  const rolling = (r, amp, freq) => {
    const p = [r() * 6, r() * 6];
    return (x) => amp * (Math.sin(x * freq + p[0]) * 0.7 + Math.sin(x * freq * 2.6 + p[1]) * 0.3);
  };

  const groundLine = (r, w, y, amp) => {
    const roll = rolling(r, amp, 0.006);
    const pts = [];
    for (let x = -10; x <= w + 10; x += 24) pts.push([x, y + roll(x)]);
    return { pts, at: (x) => y + roll(x) };
  };

  const trees = (r, w, spacing, minH, maxH, baseAt) => {
    const list = [];
    for (let x = -20 + r() * spacing; x < w + 20; x += spacing * (0.55 + r() * 0.9)) {
      list.push({ x, base: baseAt(x) + 4 + r() * 6, h: minH + r() * (maxH - minH) });
    }
    return list.sort((a, b) => a.base - b.base);
  };

  const drawTrees = (ctx, c, r, list, fill, width) => {
    for (const t of list) inked(ctx, c, handPath(sprucePoints(t.x, t.base, t.h, r), true, r, 1.1), fill, width);
  };

  // Back layer of the home hero: birds, Rockies with snowcaps and hatching, far spruce on a hill
  const drawBack = (ctx, c, w, h, reserved) => {
    const r = rng(11);
    const bottom = h;

    const peaks = [];
    let x = -60;
    while (x < w + 80) {
      const valleyY = bottom - reserved * (0.42 + r() * 0.12);
      peaks.push([x, valleyY]);
      x += 70 + r() * 90;
      peaks.push([x, bottom - reserved * (0.82 + r() * 0.3)]);
      x += 70 + r() * 90;
    }
    const range = [[-80, bottom], ...peaks, [x + 40, bottom]];
    inked(ctx, c, handPath(range, true, r), c.mountain);

    for (let i = 1; i < range.length - 1; i++) {
      const p = range[i];
      const prev = range[i - 1];
      const next = range[i + 1];
      if (p[1] > prev[1] || p[1] > next[1]) continue;
      const along = (a, t) => [p[0] + (a[0] - p[0]) * t, p[1] + (a[1] - p[1]) * t];
      const depth = 0.28 + r() * 0.1;
      const L = along(prev, depth);
      const R = along(next, depth);
      const cap = [p, along(next, depth * 0.5), R];
      const teeth = 3 + Math.floor(r() * 2);
      for (let k = 1; k < teeth; k++) {
        const t = k / teeth;
        const mx = R[0] + (L[0] - R[0]) * t;
        const my = R[1] + (L[1] - R[1]) * t;
        cap.push([mx, my + (k % 2 ? 10 + r() * 8 : -2)]);
      }
      cap.push(L, along(prev, depth * 0.5));
      inked(ctx, c, handPath(cap, true, r, 0.8), c.snow, 2.2);

      // Hatching down the shadowed slope
      for (let k = 0; k < 7; k++) {
        const s = along(next, depth + 0.06 + k * 0.075);
        const len = 14 + r() * 16;
        stroke(ctx, c, handPath([[s[0] - 3, s[1] + 4], [s[0] - len * 0.45, s[1] + len]], false, r, 0.4), 1.5);
      }
    }

    const hill = groundLine(r, w, bottom - reserved * 0.3, reserved * 0.05);
    const far = trees(r, w, 22, reserved * 0.14, reserved * 0.26, hill.at);
    drawTrees(ctx, c, r, far, c.spruceLight, 2);
    inked(ctx, c, handPath([[-10, bottom + 10], ...hill.pts, [w + 10, bottom + 10]], true, r), c.spruceLight);
  };

  // Front layer: big spruce standing on an inked ground line
  const drawFront = (ctx, c, w, h, groundFill, seed, scale = 1) => {
    const r = rng(seed);
    const ground = groundLine(r, w, h - 18, 4);
    const near = trees(r, w, 48 * scale, h * 0.5, h * 0.92, ground.at);
    drawTrees(ctx, c, r, near, c.spruce, 2.6);
    const groundPath = handPath([[-10, h + 10], ...ground.pts, [w + 10, h + 10]], true, r);
    ctx.fillStyle = groundFill;
    ctx.fill(groundPath);
    stroke(ctx, c, handPath(ground.pts, false, r), 2.8);
  };

  const colors = () => {
    const s = getComputedStyle(document.documentElement);
    const v = (n) => s.getPropertyValue(n).trim();
    return {
      ink: v("--ink"), paper: v("--paper"), spruce: v("--spruce"), spruceLight: v("--spruce-light"),
      mountain: v("--mountain"), snow: v("--snow"),
    };
  };

  const canvases = [...document.querySelectorAll("canvas[data-draw]")];

  const render = () => {
    const c = colors();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const canvas of canvases) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const kind = canvas.dataset.draw;
      if (kind === "back") {
        const reserved = parseFloat(getComputedStyle(canvas.parentElement).paddingBottom) || h * 0.5;
        drawBack(ctx, c, w, h, reserved);
      } else if (kind === "front") {
        drawFront(ctx, c, w, h, c.paper, 23);
      } else if (kind === "strip") {
        const fill = canvas.dataset.ground === "ink" ? c.ink : c.paper;
        drawFront(ctx, c, w, h, fill, Number(canvas.dataset.seed || 5), 0.55);
      }
    }
  };

  if (canvases.length) {
    const start = () => render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
    else start();
    let lastWidth = window.innerWidth;
    let timer = 0;
    window.addEventListener("resize", () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      clearTimeout(timer);
      timer = setTimeout(render, 150);
    });
  }

  // ---------- Forms: a static site hands off to the visitor's mail client ----------
  const openMail = (subject, body) => {
    window.location.href = `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  document.querySelectorAll("form[data-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const note = form.querySelector(".form-note");

      if (form.dataset.form === "notify") {
        openMail("Notify me when BioRogue's Steam page launches", `Please add ${data.get("email")} to the BioRogue launch list.`);
        if (note) note.textContent = `Your email app should open with this request. If it doesn't, write to ${STUDIO_EMAIL}.`;
      } else {
        const name = `${data.get("first") || ""} ${data.get("last") || ""}`.trim();
        openMail(`Website enquiry from ${name || data.get("email")}`, `${data.get("message")}\n\n— ${name}\n${data.get("email")}`);
        if (note) note.textContent = `Your email app should open with this message. If it doesn't, write to ${STUDIO_EMAIL}.`;
      }
    });
  });

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
