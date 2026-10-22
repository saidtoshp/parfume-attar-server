// Nakleyka (50x30 mm, faqat oq-qora). Hamma chizma 400x240 koordinatada: 203 dpi da 400x240 piksel = 50x30 mm.
(function () {
  const FONTS = {
    f1: { n: "Qalin", css: '700 {s}px Inter, Arial, sans-serif' },
    f2: { n: "Klassik", css: '600 {s}px "Playfair Display", Georgia, serif' },
    f3: { n: "Yozma", css: '400 {s}px Pacifico, "Brush Script MT", cursive' },
    f4: { n: "Tor", css: '500 {s}px Oswald, "Arial Narrow", sans-serif' },
    f5: { n: "Qo‘lyozma", css: '600 {s}px Caveat, "Comic Sans MS", cursive' }
  };
  const BORDERS = [
    { id: "b0", n: "Ramkasiz" }, { id: "b1", n: "Oddiy" }, { id: "b2", n: "Qo‘sh" }, { id: "b3", n: "Yumaloq" },
    { id: "b4", n: "Punktir" }, { id: "b5", n: "Nuqtali" }, { id: "b6", n: "Burchak" }, { id: "b7", n: "Bezakli" }];
  const LAYOUTS = [{ id: "c", n: "Markazda" }, { id: "l", n: "Belgi chapda" }, { id: "r", n: "Belgi o‘ngda" }, { id: "t", n: "Sarlavhali" }];
  const ICONS = [
    { id: "i0", n: "Belgisiz", ch: "" }, { id: "i1", n: "Yurak", ch: "♥" }, { id: "i2", n: "Yulduz", ch: "★" },
    { id: "i3", n: "Toj", ch: "♛" }, { id: "i4", n: "Gul", ch: "✿" }, { id: "i5", n: "Yaltirash", ch: "✦" },
    { id: "i6", n: "Barg", ch: "❦" }, { id: "i7", n: "Tomchi", ch: "●" }, { id: "i8", n: "Nota", ch: "♪" }, { id: "i9", n: "Brilliant", ch: "◆" }];
  const P = {
    i1: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    i2: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
    i3: "M3 7l5 4 4-7 4 7 5-4-2 11H5L3 7zM5 20h14v2H5z",
    i5: "M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z",
    i6: "M12 2C20 8 20 16 12 22 4 16 4 8 12 2z",
    i7: "M12 2.7c-3.5 4.4-6.5 7.5-6.5 11a6.5 6.5 0 0 0 13 0c0-3.5-3-6.6-6.5-11z",
    i8: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
    i9: "M12 2l8 7-8 13L4 9l8-7z"
  };
  const T = (id, name, lay, border, font, icon, lines, inv) => ({ id, name, lay, border, font, icon, lines, inv: !!inv });
  const TEMPLATES = [
    T("t1", "Oddiy", "c", "b1", "f1", "i0", ["ISMINGIZ", "atir", "50 ml"]),
    T("t2", "Yurakli", "c", "b3", "f3", "i1", ["Sevgi bilan", "Aziz uchun", ""]),
    T("t3", "Qirollik", "c", "b2", "f2", "i3", ["QIROL", "Eksklyuziv atir", "100 ml"]),
    T("t4", "Gulli", "l", "b4", "f5", "i4", ["Gul atiri", "Bahor hidi", "30 ml"]),
    T("t5", "Zamonaviy", "t", "b0", "f4", "i0", ["PARFYUM", "Aziz", "10 ml"]),
    T("t6", "Yulduz", "r", "b6", "f1", "i2", ["YULDUZ", "Maxsus atir", ""]),
    T("t7", "Mini", "c", "b0", "f4", "i7", ["AZIZ", "atir 5 ml", ""]),
    T("t8", "Sovg‘a", "t", "b3", "f3", "i1", ["Sovg‘a", "Aziz uchun", "Tug‘ilgan kun muborak"]),
    T("t9", "Teskari", "c", "b0", "f1", "i5", ["PARFUME ATTAR", "Original", "100 ml"], true),
    T("t10", "Nota", "l", "b1", "f2", "i8", ["Melodiya", "Yengil atir", ""]),
    T("t11", "Barg", "r", "b5", "f5", "i6", ["Tabiat", "Yashil hid", ""]),
    T("t12", "Brilliant", "c", "b7", "f2", "i9", ["BRILLIANT", "Premium atir", "50 ml"])
  ];

  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function border(c, b) {
    c.save(); c.strokeStyle = c.fillStyle = "#000"; c.lineWidth = 5;
    if (b === "b1") c.strokeRect(6, 6, 388, 228);
    else if (b === "b2") { c.lineWidth = 3.5; c.strokeRect(6, 6, 388, 228); c.strokeRect(16, 16, 368, 208); }
    else if (b === "b3") { rr(c, 6, 6, 388, 228, 30); c.stroke(); }
    else if (b === "b4") { c.setLineDash([16, 10]); rr(c, 6, 6, 388, 228, 12); c.stroke(); }
    else if (b === "b5") { c.lineWidth = 6; c.lineCap = "round"; c.setLineDash([0.1, 14]); c.strokeRect(10, 10, 380, 220); }
    else if (b === "b6") {
      [[6, 6, 1, 1], [394, 6, -1, 1], [6, 234, 1, -1], [394, 234, -1, -1]].forEach(a => {
        c.beginPath(); c.moveTo(a[0], a[1] + a[3] * 56); c.lineTo(a[0], a[1]); c.lineTo(a[0] + a[2] * 56, a[1]); c.stroke();
      });
    } else if (b === "b7") {
      c.lineWidth = 3; rr(c, 12, 12, 376, 216, 10); c.stroke();
      [[12, 12], [388, 12], [12, 228], [388, 228]].forEach(a => {
        c.beginPath(); c.moveTo(a[0], a[1] - 11); c.lineTo(a[0] + 11, a[1]); c.lineTo(a[0], a[1] + 11); c.lineTo(a[0] - 11, a[1]); c.closePath(); c.fill();
      });
    }
    c.restore();
  }
  function icon(c, id, cx, cy, s) {
    c.save(); c.translate(cx - s / 2, cy - s / 2); c.scale(s / 24, s / 24); c.fillStyle = "#000";
    if (id === "i4") {
      for (let k = 0; k < 5; k++) { c.save(); c.translate(12, 12); c.rotate(k * Math.PI * 2 / 5); c.beginPath(); c.ellipse(0, -6.2, 3.6, 6, 0, 0, 7); c.fill(); c.restore(); }
      c.beginPath(); c.arc(12, 12, 3.2, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(12, 12, 1.5, 0, 7); c.fill();
    } else if (P[id]) {
      c.fill(new Path2D(P[id]));
      c.strokeStyle = "#fff";
      if (id === "i6") { c.lineWidth = 1.3; c.beginPath(); c.moveTo(12, 6); c.lineTo(12, 19); c.stroke(); }
      if (id === "i9") { c.lineWidth = 0.9; c.beginPath(); c.moveTo(4, 9); c.lineTo(20, 9); c.moveTo(12, 2); c.lineTo(9, 9); c.lineTo(12, 22); c.lineTo(15, 9); c.lineTo(12, 2); c.stroke(); }
    }
    c.restore();
  }
  function fit(c, css, t, mw, cap) {
    c.font = css.replace("{s}", cap); const w = c.measureText(t).width;
    return w > mw ? Math.max(10, Math.floor(cap * mw / w)) : cap;
  }
  function block(c, L, fk, cx, y, w, h, col, caps) {
    const F = FONTS[fk] || FONTS.f1, cp = caps || [64, 40, 28], q = [];
    L.forEach(t => { t = (t || "").trim(); if (t) q.push({ t: t, s: fit(c, F.css, t, w, cp[q.length] || 24) }); });
    if (!q.length) return;
    let tot = q.reduce((a, x) => a + x.s * 1.2, 0);
    if (tot > h) { const f = h / tot; q.forEach(x => { x.s = Math.max(9, Math.floor(x.s * f)); }); tot = q.reduce((a, x) => a + x.s * 1.2, 0); }
    let yy = y + (h - tot) / 2; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = col || "#000";
    q.forEach(x => { c.font = F.css.replace("{s}", x.s); c.fillText(x.t, cx, yy + x.s * 0.6); yy += x.s * 1.2; });
  }
  function draw(c, d) {
    c.save(); c.fillStyle = "#fff"; c.fillRect(0, 0, 400, 240); c.fillStyle = c.strokeStyle = "#000"; c.lineJoin = "round";
    const bd = d.border || "b0"; border(c, bd);
    const p = bd === "b0" ? 14 : 30, X0 = p, X1 = 400 - p, Y0 = p, Y1 = 240 - p, W = X1 - X0, H = Y1 - Y0;
    const ic = d.icon && d.icon !== "i0" ? d.icon : "", L = d.lines || [], lay = d.lay || "c";
    if (lay === "t") {
      const bh = Math.min(80, H * 0.42); c.fillStyle = "#000"; c.fillRect(X0, Y0, W, bh);
      block(c, [L[0]], d.font, 200, Y0 + 4, W - 16, bh - 8, "#fff", [60]);
      const ty = Y0 + bh + 6, th = Y1 - ty; let w2 = W;
      if (ic) { icon(c, ic, X1 - 30, ty + th / 2, Math.min(50, th)); w2 = W - 72; }
      block(c, [L[1], L[2]], d.font, X0 + w2 / 2, ty, w2 - 8, th, "#000", [44, 30]);
    } else if (lay === "l" || lay === "r") {
      const isz = ic ? Math.min(H * 0.8, 120) : 0, gap = ic ? 14 : 0, tw = W - isz - gap;
      const ix = lay === "l" ? X0 + isz / 2 : X1 - isz / 2, tx = lay === "l" ? X0 + isz + gap + tw / 2 : X0 + tw / 2;
      if (ic) icon(c, ic, ix, Y0 + H / 2, isz);
      block(c, L, d.font, tx, Y0, tw, H);
    } else {
      const isz = ic ? Math.min(54, H * 0.32) : 0;
      if (ic) icon(c, ic, 200, Y0 + isz / 2, isz);
      block(c, L, d.font, 200, Y0 + isz + (ic ? 4 : 0), W, H - isz - (ic ? 4 : 0));
    }
    if (d.inv) { c.globalCompositeOperation = "difference"; c.fillStyle = "#fff"; c.fillRect(0, 0, 400, 240); }
    c.restore();
  }
  const Label = {
    FONTS, BORDERS, LAYOUTS, ICONS, TEMPLATES,
    render(cv, d, w) { cv.width = w; cv.height = Math.round(w * 0.6); const c = cv.getContext("2d"); c.setTransform(w / 400, 0, 0, w / 400, 0, 0); draw(c, d || {}); },
    url(d, w) { const cv = document.createElement("canvas"); Label.render(cv, d, w); return cv.toDataURL("image/png"); },
    // printerga: faqat toza oq-qora (203 dpi = 400x240 px, 300 dpi = 591x354 px)
    png(d, dpi) {
      const w = Math.round(50 / 25.4 * dpi), cv = document.createElement("canvas"); Label.render(cv, d, w);
      const c = cv.getContext("2d"), im = c.getImageData(0, 0, cv.width, cv.height), a = im.data;
      for (let i = 0; i < a.length; i += 4) { const v = (a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11) > 140 ? 255 : 0; a[i] = a[i + 1] = a[i + 2] = v; a[i + 3] = 255; }
      c.putImageData(im, 0, 0); return cv.toDataURL("image/png");
    },
    ready() {
      if (!document.fonts || !document.fonts.load) return Promise.resolve();
      return Promise.all(Object.keys(FONTS).map(k => document.fonts.load(FONTS[k].css.replace("{s}", 24), "Aa Бб").catch(() => 0))).catch(() => 0);
    }
  };
  window.Label = Label;
})();
