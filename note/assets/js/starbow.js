/**
 * Star Rainbow (Starbow) Simulator
 * =================================
 * Relativistic aberration + Doppler shift visualisation.
 * Drop this script into a page with:
 *   <canvas id="starbow" width="800" height="640"></canvas>
 *   <script src="starbow.js"></script>
 */
(function () {
  "use strict";

  // ── config ──────────────────────────────────────────────────────────────
  const N_STARS   = 2000;
  const BASE_WL   = 550.0; // nm (green)
  const BETA_INIT = 0.80;

  const BG        = "#0a0a0a";
  const PANEL_BG  = "#141414";
  const GRID_COL  = "rgba(255,255,255,0.08)";
  const LABEL_COL = "#666";

  // ── seeded PRNG (xoshiro128**) ──────────────────────────────────────────
  function splitmix32(a) {
    return function () {
      a |= 0; a = (a + 0x9e3779b9) | 0;
      let t = a ^ (a >>> 16); t = Math.imul(t, 0x21f0aaad);
      t = t ^ (t >>> 15); t = Math.imul(t, 0x735a2d97);
      return ((t ^ (t >>> 15)) >>> 0) / 4294967296;
    };
  }
  const rand = splitmix32(42);

  // ── star field (uniform on sphere) ──────────────────────────────────────
  const thetaRest = new Float64Array(N_STARS);
  const phi       = new Float64Array(N_STARS);
  for (let i = 0; i < N_STARS; i++) {
    thetaRest[i] = Math.acos(2 * rand() - 1);
    phi[i]       = 2 * Math.PI * rand();
  }

  // ── physics ─────────────────────────────────────────────────────────────
  function aberration(thetaR, beta) {
    const cosT  = Math.cos(thetaR);
    const cosT2 = (cosT - beta) / (1.0 - beta * cosT);
    return Math.acos(Math.max(-1, Math.min(1, cosT2)));
  }

  function dopplerWL(thetaObs, beta) {
    const gamma = 1.0 / Math.sqrt(1.0 - beta * beta);
    return BASE_WL * gamma * (1.0 - beta * Math.cos(thetaObs));
  }

  // ── wavelength → RGB ────────────────────────────────────────────────────
  function wlToRGB(wl) {
    let r = 0, g = 0, b = 0;

    if      (wl < 380)                { r = 0.5; b = 0.5; }
    else if (wl < 440) { r = (440 - wl) / 60;              b = 1.0; }
    else if (wl < 490) {              g = (wl - 440) / 50;  b = 1.0; }
    else if (wl < 510) {              g = 1.0; b = (510 - wl) / 20; }
    else if (wl < 580) { r = (wl - 510) / 70; g = 1.0; }
    else if (wl < 645) { r = 1.0; g = (645 - wl) / 65; }
    else if (wl <= 780) { r = 1.0; }
    else                { r = 0.5; }

    let fac = 1.0;
    if      (wl >= 380 && wl < 420) fac = 0.3 + 0.7 * (wl - 380) / 40;
    else if (wl >  700 && wl <= 780) fac = 0.3 + 0.7 * (780 - wl) / 80;

    return [
      Math.round(Math.min(1, r * fac) * 255),
      Math.round(Math.min(1, g * fac) * 255),
      Math.round(Math.min(1, b * fac) * 255),
    ];
  }

  // ── canvas setup ────────────────────────────────────────────────────────
  const canvas = document.getElementById("starbow");
  if (!canvas) { console.error("starbow: <canvas id='starbow'> not found"); return; }
  const ctx = canvas.getContext("2d");

  const W = canvas.width;
  const H = canvas.height;

  const PANEL_H = 80;
  const CX = W / 2;
  const CY = (H - PANEL_H) / 2;
  const RADIUS = Math.min(W, H - PANEL_H) / 2 - 20;

  // slider geometry
  const SL_X = 80, SL_W = W - 160, SL_H = 8;
  const SL_Y = H - 45;

  let beta = BETA_INIT;

  // ── view direction ────────────────────────────────────────────────────
  let viewTheta = 0;        // 0 = forward, π = rear
  let viewPhi   = 0;
  const VIEW_FOV = Math.PI; // half-angle shown in the disk (180° = full sphere)

  // ── projection (equidistant azimuthal around view direction) ──────────
  // Returns [x, y, angDist] or null if outside FOV.
  function projectStar(starTheta, starPhi) {
    // angular distance from view centre
    const cosD = Math.cos(starTheta) * Math.cos(viewTheta)
               + Math.sin(starTheta) * Math.sin(viewTheta) * Math.cos(starPhi - viewPhi);
    const angDist = Math.acos(Math.max(-1, Math.min(1, cosD)));
    if (angDist > VIEW_FOV) return null;

    // position angle (azimuth in projected disk)
    const sinDphi = Math.sin(starPhi - viewPhi);
    const cosDphi = Math.cos(starPhi - viewPhi);
    const posAngle = Math.atan2(
      Math.sin(starTheta) * sinDphi,
      Math.sin(viewTheta) * Math.cos(starTheta) - Math.cos(viewTheta) * Math.sin(starTheta) * cosDphi
    );

    const r = (angDist / VIEW_FOV) * RADIUS;
    return [CX + r * Math.sin(posAngle), CY - r * Math.cos(posAngle), angDist];
  }

  // ── drawing ─────────────────────────────────────────────────────────────
  function draw() {
    const gamma = 1.0 / Math.sqrt(1.0 - beta * beta);
    const dpr = window.devicePixelRatio || 1;

    // handle hi-dpi
    if (canvas.getAttribute("data-dpr") !== String(dpr)) {
      canvas.setAttribute("data-dpr", dpr);
      canvas.style.width  = W + "px";
      canvas.style.height = H + "px";
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // grid circles
    ctx.strokeStyle = GRID_COL;
    ctx.lineWidth = 1;
    for (const frac of [0.25, 0.5, 0.75, 1.0]) {
      const r = frac * RADIUS;
      ctx.beginPath();
      ctx.arc(CX, CY, r, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // grid labels
    ctx.fillStyle = LABEL_COL;
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    for (const [frac, label] of [[0.25, "45°"], [0.5, "90°"], [0.75, "135°"]]) {
      ctx.fillText(label, CX + frac * RADIUS + 4, CY - 2);
    }

    // view direction label
    const viewDeg = (viewTheta * 180 / Math.PI).toFixed(1);
    ctx.textAlign = "center";
    ctx.fillStyle = "#aaa";
    ctx.font = "12px monospace";
    ctx.fillText(`View: θ=${viewDeg}°`, CX, CY - RADIUS - 8);
    ctx.fillStyle = "#555";
    ctx.font = "11px monospace";
    ctx.fillText("(drag sky to look around)", CX, CY + RADIUS + 16);

    // stars — clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, RADIUS, 0, 2 * Math.PI);
    ctx.clip();

    for (let i = 0; i < N_STARS; i++) {
      const tObs = aberration(thetaRest[i], beta);
      const wl   = Math.max(200, Math.min(950, dopplerWL(tObs, beta)));
      const [r, g, b] = wlToRGB(wl);
      const p = projectStar(tObs, phi[i]);
      if (!p) continue;
      const [x, y] = p;

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
    ctx.restore();

    // ── panel ─────────────────────────────────────────────────────────────
    ctx.fillStyle = PANEL_BG;
    ctx.fillRect(0, H - PANEL_H, W, PANEL_H);

    // title
    ctx.fillStyle = "#ddd";
    ctx.font = "bold 15px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      `Star Rainbow Simulator   β = ${beta.toFixed(4)}c   γ = ${gamma.toFixed(4)}`,
      W / 2, H - PANEL_H + 18
    );

    // slider track
    ctx.fillStyle = "#333";
    roundRect(ctx, SL_X, SL_Y, SL_W, SL_H, 4);
    ctx.fill();

    // slider fill
    const fillW = (beta / 0.9999) * SL_W;
    ctx.fillStyle = "#4466cc";
    roundRect(ctx, SL_X, SL_Y, fillW, SL_H, 4);
    ctx.fill();

    // slider thumb
    const sx = SL_X + fillW;
    ctx.beginPath();
    ctx.arc(sx, SL_Y + SL_H / 2, 9, 0, 2 * Math.PI);
    ctx.fillStyle = "#c8d2ff";
    ctx.fill();

    // slider labels
    ctx.fillStyle = LABEL_COL;
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText("0", SL_X - 6, SL_Y + 7);
    ctx.textAlign = "left";
    ctx.fillText("0.9999", SL_X + SL_W + 6, SL_Y + 7);

    // help
    ctx.fillStyle = "#555";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("β: slider / ←→↑↓   View: drag sky / WASD   R: reset view", W / 2, H - 6);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // ── interaction ─────────────────────────────────────────────────────────
  function canvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return [
      (e.clientX - rect.left) * (W / rect.width),
      (e.clientY - rect.top)  * (H / rect.height),
    ];
  }

  function setBetaFromX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) * (W / rect.width);
    const t = (mx - SL_X) / SL_W;
    beta = Math.max(0, Math.min(0.9999, t * 0.9999));
    draw();
  }

  let dragMode = null; // "slider" | "sky" | null
  let lastPointerX = 0, lastPointerY = 0;

  function isInSlider(mx, my) {
    return my >= SL_Y - 12 && my <= SL_Y + SL_H + 12 &&
           mx >= SL_X - 10 && mx <= SL_X + SL_W + 10;
  }

  function isInSky(mx, my) {
    const dx = mx - CX, dy = my - CY;
    return Math.sqrt(dx * dx + dy * dy) <= RADIUS + 5 && my < H - PANEL_H;
  }

  canvas.addEventListener("pointerdown", function (e) {
    const [mx, my] = canvasCoords(e);
    if (isInSlider(mx, my)) {
      dragMode = "slider";
      canvas.setPointerCapture(e.pointerId);
      setBetaFromX(e.clientX);
    } else if (isInSky(mx, my)) {
      dragMode = "sky";
      canvas.setPointerCapture(e.pointerId);
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    }
  });

  canvas.addEventListener("pointermove", function (e) {
    if (dragMode === "slider") {
      setBetaFromX(e.clientX);
    } else if (dragMode === "sky") {
      const rect = canvas.getBoundingClientRect();
      const sensitivity = (VIEW_FOV * 2) / rect.height;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      viewPhi   -= dx * sensitivity;
      viewTheta += dy * sensitivity;
      viewTheta  = Math.max(0, Math.min(Math.PI, viewTheta));
      // normalise phi to [0, 2π)
      viewPhi = ((viewPhi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      draw();
    }
  });

  canvas.addEventListener("pointerup",     function () { dragMode = null; });
  canvas.addEventListener("pointercancel",  function () { dragMode = null; });

  // keyboard: arrows for beta, WASD / hjkl for view direction
  document.addEventListener("keydown", function (e) {
    const step = 0.005, fine = 0.0001;
    const viewStep = 5 * Math.PI / 180; // 5°
    let handled = true;

    switch (e.key) {
      // beta control
      case "ArrowRight": beta = Math.min(0.9999, beta + step); break;
      case "ArrowLeft":  beta = Math.max(0, beta - step);      break;
      case "ArrowUp":    beta = Math.min(0.9999, beta + fine);  break;
      case "ArrowDown":  beta = Math.max(0, beta - fine);       break;
      // view direction
      case "w": case "k": viewTheta = Math.max(0, viewTheta - viewStep);          break;
      case "s": case "j": viewTheta = Math.min(Math.PI, viewTheta + viewStep);     break;
      case "a": case "h": viewPhi   = (viewPhi + viewStep) % (2 * Math.PI);        break;
      case "d": case "l": viewPhi   = (viewPhi - viewStep + 2 * Math.PI) % (2 * Math.PI); break;
      case "r":           viewTheta = 0; viewPhi = 0; break; // reset view
      default: handled = false;
    }
    if (handled) { e.preventDefault(); draw(); }
  });

  // touch-friendly: prevent scroll when interacting
  canvas.addEventListener("touchstart", function (e) {
    const [, my] = canvasCoords(e.touches[0]);
    if (my >= SL_Y - 20 && my <= SL_Y + SL_H + 20 || my < H - PANEL_H) {
      e.preventDefault();
    }
  }, { passive: false });

  // ── init ────────────────────────────────────────────────────────────────
  draw();
})();
