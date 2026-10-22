// Atir tanlash yordamchisi: savollarni bittadan beradi, javoblarga qarab katalogdan 3 ta mos atir tavsiya qiladi.
(function () {
  const FAM = { S: "shirin", F: "yangi va tetik", W: "yog‘ochsimon", P: "achchiq va ziravorli", G: "gulli", M: "mevali", O: "sharqona (oud, mushk)" };
  const SEA = { Y: "yoz", Q: "qish", B: "bahor", K: "kuz", A: "barcha fasllar" };
  const OCC = { D: "kundalik", I: "ish yoki o‘qish", U: "uchrashuv", T: "to‘y va tadbirlar", S: "sport va sayr" };
  const STR = ["", "yengil", "o‘rtacha", "kuchli"];
  const STEPS = [
    { k: "who", q: "Atir o‘zingiz uchunmi yoki sovg‘agami?", o: [["self", "O‘zim uchun"], ["gift", "Sovg‘a uchun"]] },
    { k: "fam", q: "Qanday hidlarni yoqtirasiz? Bir nechtasini tanlashingiz mumkin.", multi: true, o: [["S", "Shirin"], ["F", "Yangi, toza va tetik"], ["W", "Yog‘ochsimon"], ["P", "Achchiq va ziravorli"], ["G", "Gulli"], ["M", "Mevali"], ["O", "Sharqona, oud va mushk hidlari"], ["dk", "Qaysi biri yoqishini bilmayman"]] },
    { k: "str", q: "Yengil hid yoqadimi yoki kuchli, sezilarli hidmi?", o: [["1", "Yengil hid"], ["3", "Kuchli, sezilarli hid"], ["2", "O‘rtacha"], ["0", "Farqi yo‘q"]] },
    { k: "occ", q: "Atirni qayerda ishlatasiz?", o: [["D", "Har kuni"], ["I", "Ishda yoki o‘qishda"], ["U", "Uchrashuvda"], ["T", "To‘y va tadbirlarda"], ["S", "Sport yoki sayrda"]] },
    { k: "sea", q: "Qaysi fasl uchun kerak?", o: [["Y", "Yoz"], ["Q", "Qish"], ["B", "Bahor"], ["K", "Kuz"], ["A", "Barcha fasllar"]] },
    { k: "prev", q: "Oldin qaysi atirlarni ishlatgansiz? Qaysi biri sizga yoqqan yoki yoqmagan?", text: true },
    { k: "bud", q: "Budjetingiz qancha? Narx oralig‘ini yozing (so‘mda).", budget: true },
    { k: "g", q: "Erkaklar, ayollar yoki uniseks atir kerakmi?", o: [["m", "Erkaklar"], ["w", "Ayollar"], ["u", "Uniseks"], ["0", "Farqi yo‘q"]] }
  ];
  const INTRO = "Sizga aynan didingizga mos atir tanlab beraman. Buning uchun bir nechta qisqa savol beraman. Birinchi savol: atir o‘zingiz uchunmi yoki sovg‘agami?";
  const Q = () => (window.QZ = window.QZ || { n: 0, a: {}, sel: [] });
  const nm = s => String(s || "").toLowerCase().replace(/[^a-z0-9а-яё ]/g, " ").replace(/\s+/g, " ").trim();
  const label = (st, v) => Array.isArray(v) ? (v.length ? v.map(x => (st.o.find(o => o[0] === x) || [0, x])[1]).join(", ") : "—") : ((st.o || []).find(o => o[0] === v) || [0, v])[1];

  function answerText(st, a) {
    if (st.text) return (a.like ? "Yoqqan: " + a.like : "") + (a.like && a.dis ? ". " : "") + (a.dis ? "Yoqmagan: " + a.dis : "") || "Aytmayman";
    if (st.budget) return a.bmax || a.bmin ? (a.bmin ? money(a.bmin) + " dan " : "") + (a.bmax ? money(a.bmax) + " gacha" : "") : "Farqi yo‘q";
    return label(st, a[st.k]);
  }
  function match(txt) {
    const out = [];
    String(txt || "").split(/[,;\n]/).map(nm).filter(t => t.length >= 3).forEach(t => items.forEach(p => {
      const full = nm((p.b || "") + " " + p.n), n = nm(p.n);
      if (full.includes(t) || (n.length >= 4 && t.includes(n))) out.push(p);
    }));
    return out;
  }
  const overlap = (a, b) => (a.fam || []).filter(f => (b.fam || []).includes(f)).length;
  const gender = p => ((p.tags || []).includes("men") ? "m" : "") + ((p.tags || []).includes("women") ? "w" : "") + ((p.tags || []).includes("unisex") ? "u" : "");

  function score(p, a, likes, dislikes) {
    if (!p.st || !(p.fam && p.fam.length)) return null;
    let s = 0; const why = [];
    const fams = (a.fam || []).filter(f => f !== "dk"), hit = fams.filter(f => p.fam.includes(f));
    hit.forEach(f => { s += 3 + (p.fam[0] === f ? 1 : 0); }); if (hit.length) why.push(hit.map(f => FAM[f]).join(" va ") + " yo‘nalishga mos");
    const st = +a.str; if (st) { const d = Math.abs(p.str - st); s += d === 0 ? 3 : d === 1 ? 1 : -2; if (d === 0) why.push(STR[st] + " hid talabingizga to‘g‘ri keladi"); }
    if (a.sea && a.sea !== "A") { if (p.sea.includes(a.sea) || p.sea.includes("A")) { s += 2; why.push(SEA[a.sea] + " faslida yaxshi ochiladi"); } else s -= 2; }
    if (a.occ) { if (p.occ.includes(a.occ)) { s += 2; why.push(OCC[a.occ] + " uchun mos"); } }
    const g = gender(p);
    if (a.g === "m") { if (g.includes("m")) s += 4; else if (g.includes("u")) s += 2; else return null; }
    if (a.g === "w") { if (g.includes("w")) s += 4; else if (g.includes("u")) s += 2; else return null; }
    if (a.g === "u") { if (g.includes("u")) s += 4; else s -= 3; }
    likes.forEach(L => { if (L.id === p.id) s -= 100; else { const o = overlap(L, p); if (o) { s += 2 * o; why.push("oldin yoqqan «" + L.n + "» atiriga o‘xshash yo‘nalishda"); } } });
    dislikes.forEach(D => { if (D.id === p.id) s -= 100; else s -= 3 * overlap(D, p); });
    const pr = prc(p, OPT.displayMl || 10);
    if (pr && a.bmax) { if (pr.v > a.bmax * 1.15) s -= 6; else if (pr.v <= a.bmax) s += 1; }
    return s < -50 ? null : { p, s, why: why.slice(0, 3) };
  }
  function recommend(a) {
    const likes = match(a.like), dislikes = match(a.dis);
    const L = items.map(p => score(p, a, likes, dislikes)).filter(Boolean).sort((x, y) => y.s - x.s);
    if (!L.length) return [];
    const r = [L[0]], rest = L.slice(1, 25);
    const alt = rest.slice(0, 8).sort((x, y) => (y.s + 2 * overlap(L[0].p, y.p)) - (x.s + 2 * overlap(L[0].p, x.p)))[0];
    if (alt) { r.push(alt); }
    const rem = L.filter(x => !r.includes(x)).slice(0, 20);
    const diff = rem.sort((x, y) => (y.s + (y.p.fam[0] !== L[0].p.fam[0] ? 3 : 0) - 2 * overlap(L[0].p, y.p)) - (x.s + (x.p.fam[0] !== L[0].p.fam[0] ? 3 : 0) - 2 * overlap(L[0].p, x.p)))[0];
    if (diff) r.push(diff);
    return r;
  }
  const dur = p => p.str === 3 ? "Kuchli atirlar odatda ancha uzoq saqlanadi va sezilarli bo‘ladi; aniq davomiylik teri turi va ob-havoga bog‘liq." : p.str === 1 ? "Yengil atirlar tezroq tarqalishi mumkin; teri va ob-havoga qarab farq qiladi, shuning uchun aniq vaqt va‘da qilmaymiz." : "O‘rtacha turg‘unlik kutiladi; teri va ob-havoga qarab farq qiladi, terida sinab ko‘rish eng to‘g‘ri baho beradi.";
  function notesHtml(p) {
    if (!p.z) return '<div class="br">Notalar hali kiritilmagan. Umumiy xarakteri: ' + esc(p.fam.map(f => FAM[f]).join(", ")) + ' (taxminiy).</div>';
    return p.z.split(";").map(s => { const i = s.indexOf(":"); return '<div><b>' + esc(s.slice(0, i).trim()) + ':</b> ' + esc(s.slice(i + 1).trim()) + '</div>'; }).join("");
  }
  function result(a) {
    const rec = recommend(a), T = ["1. Eng mos variant", "2. Shu yo‘nalishdagi muqobil variant", "3. Boshqacharoq, lekin yoqishi mumkin"];
    if (!rec.length) return '<div class="empty">Javoblaringizga mos atir topilmadi. Boshqa javoblar bilan qayta urinib ko‘ring.<br><button data-qa="restart">Qayta boshlash</button></div>';
    let h = '<div class="qb a">Javoblaringiz asosida 3 ta atirni tanladim:</div>';
    rec.forEach((x, i) => {
      const p = x.p, g = gender(p), pr = prc(p, OPT.displayMl || 10);
      h += '<div class="qres"><div class="qt">' + T[i] + '</div><div class="qh">' + pimgQ(p) + '<div><b>' + esc((p.b ? p.b + " — " : "") + p.n) + '</b><div class="br">' + (g.includes("u") ? "Uniseks" : (g.includes("m") ? "Erkaklar" : "") + (g.includes("m") && g.includes("w") ? " / " : "") + (g.includes("w") ? "Ayollar" : "")) + '</div></div></div>'
        + '<div class="qn">' + notesHtml(p) + '</div>'
        + '<div class="br" style="margin-top:6px">Fasl: ' + esc(p.sea.split("").map(c => SEA[c]).join(", ")) + ' · Vaziyat: ' + esc(p.occ.split("").map(c => OCC[c]).join(", ")) + ' · Hid kuchi: ' + STR[p.str] + '</div>'
        + '<div class="br">' + esc(dur(p)) + '</div>'
        + '<div class="br">' + (pr ? (OPT.displayMl || 10) + ' ml: ' + money(pr.v) + (a.bmax ? (pr.v <= a.bmax * 1.15 ? " (budjetingizga mos)" : " (budjetdan biroz yuqori)") : "") : "Narx hali belgilanmagan, budjetga mosligini aniq ayta olmayman.") + '</div>'
        + '<p style="margin:8px 0 0"><b>Nega aynan siz uchun:</b> ' + esc(x.why.length ? x.why.join("; ") + "." : "Javoblaringizga umumiy jihatdan mos keladi.") + '</p>'
        + '<div style="display:flex;gap:8px;margin-top:10px"><button class="soft" data-qa="open" data-id="' + p.id + '" style="flex:1;margin:0">Batafsil</button><button data-qa="order" data-id="' + p.id + '" style="flex:1;margin:0">Savatga</button></div></div>';
    });
    h += '<div class="box"><b>Sinab ko‘rish uchun maslahat</b><ul style="margin:8px 0 0;padding-left:18px"><li>Atirni qog‘ozga emas, bilak terisiga sepib ko‘ring.</li><li>Hid boshida, o‘rtasida va keyinroq farq qiladi: hukm chiqarishdan oldin 20-30 daqiqa kuting.</li><li>Bir vaqtda 2-3 tadan ortiq atir sinamang, aks holda hidlar aralashib ketadi.</li></ul></div>';
    return h + '<button class="soft" style="width:100%;margin-top:12px" data-qa="restart">Qaytadan boshlash</button>';
  }
  function pimgQ(p) { return '<div class="qi">' + (typeof pimg === "function" ? pimg(p) : "") + '</div>'; }

  window.quizV = function () {
    const q = Q(), n = q.n;
    let h = '<div class="topb"><button class="hbtn" data-qa="back" aria-label="Orqaga"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><h1>Atir tanlash</h1><span class="br">' + Math.min(n + 1, 8) + '/8</span></div><div class="qbar"><i style="width:' + Math.round(n / 8 * 100) + '%"></i></div>';
    for (let k = 0; k < Math.min(n, 8); k++) { const st = STEPS[k]; h += '<div class="qb a">' + (k === 0 ? esc(INTRO.replace(/ Birinchi savol:.*$/, "")) + '<br>' : "") + esc(st.q) + '</div><div class="qb u">' + esc(answerText(st, q.a)) + '</div>'; }
    if (n >= 8) return h + result(q.a);
    const st = STEPS[n];
    h += '<div class="qb a">' + (n === 0 ? esc(INTRO) : esc(st.q)) + '</div>';
    if (st.o) h += '<div class="qo">' + st.o.map(o => '<button class="chip" data-qa="' + (st.multi ? "tog" : "pick") + '" data-qv="' + esc(o[0]) + '" aria-pressed="' + (st.multi ? q.sel.includes(o[0]) : false) + '">' + esc(o[1]) + '</button>').join("") + '</div>' + (st.multi ? '<button style="width:100%;margin-top:8px" data-qa="next">Davom etish</button>' : "");
    if (st.text) h += '<div class="box"><label for="qa1">Yoqqan atirlar</label><input id="qa1" placeholder="Masalan: Sauvage, Aventus" value="' + esc(q.a.like || "") + '"><label for="qa2">Yoqmagan atirlar</label><input id="qa2" placeholder="Ixtiyoriy" value="' + esc(q.a.dis || "") + '"><button style="width:100%;margin-top:12px" data-qa="next">Davom etish</button><button class="soft" style="width:100%;margin-top:8px" data-qa="skip">Aytmayman, o‘tkazib yuborish</button></div>';
    if (st.budget) h += '<div class="box"><label for="qb1">Dan (so‘m)</label><input id="qb1" type="number" inputmode="numeric" min="0" placeholder="Masalan: 100000"><label for="qb2">Gacha (so‘m)</label><input id="qb2" type="number" inputmode="numeric" min="0" placeholder="Masalan: 300000"><button style="width:100%;margin-top:12px" data-qa="next">Davom etish</button><button class="soft" style="width:100%;margin-top:8px" data-qa="skip">Farqi yo‘q</button></div>';
    return h;
  };
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-qa]"); if (!b) return;
    const q = Q(), d = b.dataset, st = STEPS[q.n], go = () => { render(); window.scrollTo(0, document.body.scrollHeight); };
    if (d.qa === "pick") { q.a[st.k] = d.qv; q.n++; q.sel = []; go(); }
    else if (d.qa === "tog") { const v = d.qv; q.sel = v === "dk" ? (q.sel.includes("dk") ? [] : ["dk"]) : q.sel.filter(x => x !== "dk").includes(v) ? q.sel.filter(x => x !== v) : q.sel.filter(x => x !== "dk").concat(v); render(); }
    else if (d.qa === "next") {
      if (st.multi) { if (!q.sel.length) { alert("Hech bo‘lmasa bitta variantni tanlang."); return; } q.a[st.k] = q.sel.slice(); q.sel = []; }
      else if (st.text) { q.a.like = $("#qa1").value.trim(); q.a.dis = $("#qa2").value.trim(); }
      else if (st.budget) { q.a.bmin = +$("#qb1").value || 0; q.a.bmax = +$("#qb2").value || 0; }
      q.n++; go();
    } else if (d.qa === "skip") { if (st.text) { q.a.like = ""; q.a.dis = ""; } else { q.a.bmin = 0; q.a.bmax = 0; } q.n++; go(); }
    else if (d.qa === "back") { if (q.n > 0) { q.n--; q.sel = STEPS[q.n].multi ? (q.a[STEPS[q.n].k] || []).slice() : []; render(); } else { S.v = "home"; render(); } }
    else if (d.qa === "restart") { window.QZ = null; render(); window.scrollTo(0, 0); }
    else if (d.qa === "open") openM(+d.id, "info");
    else if (d.qa === "order") openM(+d.id, "order");
  });
})();
