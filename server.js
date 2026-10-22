const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const PORT = +process.env.PORT || 3000;
let ADMIN_KEY = process.env.ADMIN_KEY;
const DEV = process.env.NODE_ENV !== "production"; // DEV rejimida SMS kodi ekranda ham ko‘rsatiladi
const DIR = __dirname, PUB = path.join(DIR, "public"), DBF = path.join(DIR, "data", "db.json");

fs.mkdirSync(path.dirname(DBF), { recursive: true });
if (!process.env.ADMIN_KEY && !DEV) { // internetda: tasodifiy admin kaliti (data/admin-key.txt)
  const kf = path.join(path.dirname(DBF), "admin-key.txt");
  try { ADMIN_KEY = fs.readFileSync(kf, "utf8").trim(); } catch (e) { ADMIN_KEY = crypto.randomBytes(6).toString("hex"); fs.writeFileSync(kf, ADMIN_KEY); }
  console.log("Admin kaliti: " + ADMIN_KEY + "  (fayl: " + kf + ")");
}
let db = { users: {}, sessions: {}, codes: {}, orders: [], promos: {}, spins: {}, promoUses: {} };
try { Object.assign(db, JSON.parse(fs.readFileSync(DBF, "utf8"))); } catch (e) {}
function save() { const t = DBF + ".tmp"; fs.writeFileSync(t, JSON.stringify(db, null, 1)); fs.renameSync(t, DBF); }
const options = () => JSON.parse(fs.readFileSync(path.join(DIR, "options.json"), "utf8"));
function publicOptions() {
  const O = options(), pay = (O.payments || []).slice();
  if (O.payme && O.payme.merchant_id) pay.push({ id: "payme", name: "Payme" });
  if (O.click && O.click.service_id && O.click.merchant_id) pay.push({ id: "click", name: "Click" });
  return Object.assign({}, O, { payments: pay, payme: undefined, click: undefined, publicUrl: undefined, telegram: undefined, eskiz: undefined });
}
function payInfo(o) {
  const O = options(), base = process.env.PUBLIC_URL || O.publicUrl || "", r = { method: o.pay.method, name: o.pay.name, amount: o.total };
  if (o.pay.method === "card") r.card = O.card;
  if (o.pay.method === "payme") r.url = "https://checkout.paycom.uz/" + Buffer.from("m=" + O.payme.merchant_id + ";ac." + (O.payme.account_field || "order_id") + "=" + o.id + ";a=" + Math.round(o.total * 100) + ";c=" + base).toString("base64");
  if (o.pay.method === "click") r.url = "https://my.click.uz/services/pay?service_id=" + encodeURIComponent(O.click.service_id) + "&merchant_id=" + encodeURIComponent(O.click.merchant_id) + "&amount=" + o.total + "&transaction_param=" + o.id + "&return_url=" + encodeURIComponent(base);
  return r;
}
function cleanDesign(d) {
  if (!d || typeof d !== "object") return null;
  const str = (v, n) => String(v == null ? "" : v).slice(0, n), id = v => /^[a-z0-9]{1,12}$/i.test(String(v)) ? String(v) : "";
  const lines = (Array.isArray(d.lines) ? d.lines : []).slice(0, 3).map(x => str(x, 40));
  if (!lines.some(x => x.trim())) return null;
  return { tpl: id(d.tpl), lay: id(d.lay), border: id(d.border), font: id(d.font), icon: id(d.icon), inv: !!d.inv, lines };
}
const nz = v => Math.min(1e9, Math.max(0, Math.round(+v || 0)));
const ip = req => String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
const atomic = (f, o) => { const t = f + ".tmp"; fs.writeFileSync(t, JSON.stringify(o, null, 1)); fs.renameSync(t, f); };
const writeProducts = P => atomic(path.join(DIR, "products.json"), P);
const writeOptions = O => atomic(path.join(DIR, "options.json"), O);
function unitPrice(p, bo) { // narx: 100 ml uchun alohida narx, aks holda 1 ml narxi x hajm, aks holda eski "price"
  const ml = bo ? bo.ml : 0;
  if (p.prices && p.prices[ml] > 0) return p.prices[ml];
  if (p.ppm > 0 && ml) return Math.round(p.ppm * ml);
  return p.price > 0 ? p.price : 0;
}
function promoCheck(pm, phone, code) {
  if (!pm || !pm.active) return "Promo kod noto‘g‘ri yoki faol emas.";
  if (pm.expires && new Date(pm.expires + "T23:59:59") < new Date()) return "Promo kod muddati tugagan.";
  if (pm.maxUses > 0 && (pm.uses || 0) >= pm.maxUses) return "Promo kod limiti tugagan.";
  if (((db.promoUses || {})[code] || []).includes(phone)) return "Siz bu promo koddan allaqachon foydalangansiz.";
  return "";
}
function likeCounts() { const c = {}; Object.values(db.users).forEach(u => (u.likes || []).forEach(i => { c[i] = (c[i] || 0) + 1; })); return c; }
const gname = x => (x.brand ? x.brand + " — " : "") + x.name;
function sample(arr, n) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); }
function wheelOf(sp, pool) {
  const segs = sample(pool.filter(x => x.id !== sp.gift.id), 7).map(x => ({ id: x.id, label: gname(x) }));
  const idx = crypto.randomInt(segs.length + 1); segs.splice(idx, 0, { id: sp.gift.id, label: gname(sp.gift) });
  return { gift: sp.gift, wheel: segs, index: idx };
}
function orderText(o, po) {
  return "Yangi buyurtma #" + o.id + "\nIsm: " + o.name + "\nTelefon: +" + o.phone + "\nYetkazish: " + o.delivery.name + "\nManzil: " + o.address +
    (o.lat != null ? "\nXarita: https://www.google.com/maps?q=" + o.lat + "," + o.lng : "") + (o.note ? "\nIzoh: " + o.note : "") +
    "\nTo‘lov: " + o.pay.name + "\n\n" + po.lines + (o.promo ? "\nPromo kod: " + o.promo.code + " (−" + o.promo.percent + "%: −" + o.promo.discount + " so‘m)" : "") + (o.fee ? "\nYetkazib berish: " + o.fee + " so‘m" : "") + (o.total ? "\nJami: " + o.total + " so‘m" : "");
}
function backup() { // kuniga bitta nusxa, oxirgi 14 tasi saqlanadi
  try {
    const dir = path.join(path.dirname(DBF), "backups"); fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, "db-" + new Date().toISOString().slice(0, 10) + ".json");
    if (!fs.existsSync(f) && fs.existsSync(DBF)) fs.copyFileSync(DBF, f);
    fs.readdirSync(dir).sort().slice(0, -14).forEach(x => fs.unlinkSync(path.join(dir, x)));
  } catch (e) {}
}
backup(); setInterval(backup, 6 * 3600 * 1000);
const STAT = ["yangi", "yig‘ilmoqda", "yo‘lda", "yetkazildi", "bekor qilindi"];
const num = (v, m) => (v === null || v === undefined || v === "" || !Number.isFinite(+v) || Math.abs(+v) > m) ? null : +v;
const products = () => JSON.parse(fs.readFileSync(path.join(DIR, "products.json"), "utf8"));

// SMS yuborish. Hozircha faqat terminalga yozadi.
// Haqiqiy SMS uchun shu funksiyaga Eskiz.uz (yoki boshqa xizmat) so‘rovini qo‘shing.
let eskizTok = null;
async function eskiz(p, fd, tok) { const r = await fetch("https://notify.eskiz.uz/api" + p, { method: "POST", headers: tok ? { Authorization: "Bearer " + tok } : {}, body: fd }); return r.json(); }
function sendSms(phone, text) {
  console.log("[SMS] +" + phone + ": " + text);
  const E = options().eskiz || {}, em = process.env.ESKIZ_EMAIL || E.email, pw = process.env.ESKIZ_PASSWORD || E.password;
  if (!em || !pw) return;
  (async () => {
    if (!eskizTok) { const f = new FormData(); f.append("email", em); f.append("password", pw); const j = await eskiz("/auth/login", f); eskizTok = j && j.data && j.data.token; }
    const f2 = new FormData(); f2.append("mobile_phone", phone); f2.append("message", text); f2.append("from", "4546");
    console.log("[Eskiz]", JSON.stringify(await eskiz("/message/sms/send", f2, eskizTok)).slice(0, 200));
  })().catch(e => { eskizTok = null; console.log("[Eskiz xato]", e.message); });
}
function tg(text) { // yangi buyurtma haqida Telegramga xabar
  const T = options().telegram || {}, token = process.env.TELEGRAM_BOT_TOKEN || T.token, chat = process.env.TELEGRAM_CHAT_ID || T.chat;
  if (!token || !chat) return;
  fetch("https://api.telegram.org/bot" + token + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chat, text: text.slice(0, 3900) }) })
    .catch(e => console.log("[Telegram xato]", e.message));
}

const norm = s => { let d = String(s || "").replace(/\D/g, ""); if (d.length === 9) d = "998" + d; return /^998\d{9}$/.test(d) ? d : ""; };
const hash = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString("hex");
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const hits = {};
function tooMany(k, max, ms) { const n = Date.now(), f = (hits[k] = (hits[k] || []).filter(t => n - t < ms)); if (f.length >= max) return true; f.push(n); return false; }

function readBody(req, max = 1e5) {
  return new Promise((res, rej) => {
    let s = "";
    req.on("data", c => { s += c; if (s.length > max) { rej(new Error("big")); req.destroy(); } });
    req.on("end", () => { try { res(s ? JSON.parse(s) : {}); } catch (e) { rej(new Error("bad")); } });
  });
}
const send = (res, c, o) => { res.writeHead(c, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(o)); };
const bad = (res, m, c) => send(res, c || 400, { error: m });

function auth(req) {
  const t = (req.headers.authorization || "").replace("Bearer ", ""), s = db.sessions[t];
  return s && db.users[s.phone] && Date.now() - s.at < 30 * 864e5 ? { token: t, phone: s.phone, user: db.users[s.phone] } : null;
}
const pubUser = p => ({ phone: p, name: db.users[p].name });
const fmt = iso => { const d = new Date(iso); return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear(); };
const pubOrder = o => ({
  id: o.id, date: fmt(o.date), total: o.total, status: o.status, address: o.address, payName: o.pay && o.pay.name, paid: !!(o.pay && o.pay.paid),
  count: o.items.reduce((a, i) => a + i.qty, 0),
  lines: o.items.map((i, k) => (k + 1) + ". " + (i.gift ? "SOVG‘A (tekin): " : "") + (i.brand ? i.brand + " — " : "") + i.name + " × " + i.qty + (i.bottle ? " | idish: " + i.bottle : "") + (i.oil ? " | " + i.oil : "") + (i.label ? " | nakleyka: " + i.label + (i.text ? " «" + i.text + "»" : "") + (i.design ? " (" + i.design + ")" : "") : "")).join("\n")
});
const myOrders = p => db.orders.filter(o => o.phone === p).reverse().map(pubOrder);
function session(phone) { const t = crypto.randomBytes(24).toString("hex"); db.sessions[t] = { phone, at: Date.now() }; save(); return t; }

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".json": "application/json", ".jpeg": "image/jpeg" };

http.createServer(async (req, res) => {
  const p = new URL(req.url, "http://x").pathname;
  try {
    if (p.startsWith("/api/")) {
      if (req.method === "GET" && p === "/api/products") { const lc = likeCounts(); return send(res, 200, products().map(x => Object.assign({}, x, { likes: lc[x.id] || 0 }))); }
      if (req.method === "GET" && p === "/api/options") return send(res, 200, publicOptions());
      if (req.method === "GET" && p === "/api/me") {
        const a = auth(req); if (!a) return bad(res, "Kirish kerak", 401);
        return send(res, 200, { user: pubUser(a.phone), orders: myOrders(a.phone), labels: a.user.labels || [], likes: a.user.likes || [] });
      }
      if (req.method === "GET" && p === "/api/admin/orders") {
        const key = new URL(req.url, "http://x").searchParams.get("key") || "";
        if (!same(key, ADMIN_KEY)) return bad(res, "Ruxsat yo‘q", 403);
        return send(res, 200, db.orders.slice().reverse());
      }
      if (req.method === "GET" && p === "/api/admin/users") {
        const key = new URL(req.url, "http://x").searchParams.get("key") || "";
        if (!same(key, ADMIN_KEY)) return bad(res, "Ruxsat yo‘q", 403);
        return send(res, 200, Object.keys(db.users).map(ph => ({ phone: ph, name: db.users[ph].name, created: db.users[ph].created, orders: db.orders.filter(o => o.phone === ph).length })).reverse());
      }
      if (req.method === "GET" && p === "/api/admin/promos") {
        if (!same(new URL(req.url, "http://x").searchParams.get("key") || "", ADMIN_KEY)) return bad(res, "Ruxsat yo‘q", 403);
        return send(res, 200, db.promos || {});
      }
      if (req.method === "GET" && p === "/api/admin/likes") {
        if (!same(new URL(req.url, "http://x").searchParams.get("key") || "", ADMIN_KEY)) return bad(res, "Ruxsat yo‘q", 403);
        const by = {}; Object.keys(db.users).forEach(ph => (db.users[ph].likes || []).forEach(id => { (by[id] = by[id] || []).push({ name: db.users[ph].name, phone: ph }); }));
        return send(res, 200, products().filter(x => by[x.id]).map(x => ({ id: x.id, name: gname(x), count: by[x.id].length, users: by[x.id] })).sort((a, b) => b.count - a.count));
      }
      if (req.method === "GET" && p === "/api/admin/options") {
        if (!same(new URL(req.url, "http://x").searchParams.get("key") || "", ADMIN_KEY)) return bad(res, "Ruxsat yo‘q", 403);
        return send(res, 200, options());
      }
      if (req.method !== "POST") return bad(res, "Topilmadi", 404);
      const b = await readBody(req, p === "/api/admin/upload" ? 4e6 : 1e5);
      if (p === "/api/admin/promo") {
        if (!same(String(b.key || ""), ADMIN_KEY)) return bad(res, "Ruxsat yo‘q", 403);
        const code = String(b.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 20); if (!code) return bad(res, "Kodni kiriting.");
        db.promos = db.promos || {};
        if (b.remove) { delete db.promos[code]; save(); return send(res, 200, { ok: true }); }
        const old = db.promos[code] || { uses: 0 };
        db.promos[code] = { percent: Math.min(90, Math.max(1, nz(b.percent) || 20)), maxUses: nz(b.maxUses), uses: old.uses || 0, active: b.active !== false, expires: /^\d{4}-\d{2}-\d{2}$/.test(String(b.expires || "")) ? b.expires : "" };
        save(); return send(res, 200, { ok: true });
      }
      if (p === "/api/admin/product-new") {
        if (!same(String(b.key || ""), ADMIN_KEY)) return bad(res, "Ruxsat yo‘q", 403);
        const PL = products(), brand = String(b.brand || "").trim().slice(0, 60), name = String(b.name || "").trim().slice(0, 80);
        if (!name) return bad(res, "Atir nomini kiriting.");
        const id = Math.max(0, ...PL.map(q => q.id)) + 1;
        PL.push({ id, brand, name, price: 0, ppm: 0, stock: true, notes: String(b.notes || "").slice(0, 500), tags: [], rec: false, img: "", fam: [], str: 2, sea: "A", occ: "D", gift: false, oil: false, oilPpm: 0, off: [], prices: {} });
        writeProducts(PL); return send(res, 200, { id });
      }
      if (p === "/api/admin/upload") {
        if (!same(String(b.key || ""), ADMIN_KEY)) return bad(res, "Ruxsat yo‘q", 403);
        const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(String(b.data || ""));
        if (!m) return bad(res, "Rasm formati noto‘g‘ri.");
        const buf = Buffer.from(m[2], "base64"); if (buf.length > 3e6) return bad(res, "Rasm juda katta.");
        const dir = path.join(PUB, "uploads"); fs.mkdirSync(dir, { recursive: true });
        const slug = String(b.name || b.id || "x").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) || "x";
        const file = b.kind + "-" + slug + "-" + Date.now().toString(36) + "." + (m[1] === "jpeg" ? "jpg" : m[1]), rel = "uploads/" + file;
        if (b.kind === "product") {
          const PL = products(), x = PL.find(q => q.id === +b.id); if (!x) return bad(res, "Topilmadi", 404);
          fs.writeFileSync(path.join(dir, file), buf); x.img = rel; writeProducts(PL); return send(res, 200, { img: rel });
        }
        if (b.kind === "brand" || b.kind === "category" || b.kind === "logo") {
          const O = options(); fs.writeFileSync(path.join(dir, file), buf);
          if (b.kind === "logo") O.logo = rel;
          else { const k = b.kind === "brand" ? "brandImages" : "categoryImages"; O[k] = O[k] || {}; O[k][String(b.name).slice(0, 60)] = rel; }
          writeOptions(O); return send(res, 200, { img: rel });
        }
        return bad(res, "Noma‘lum tur");
      }
      if (p === "/api/admin/product") {
        if (!same(String(b.key || ""), ADMIN_KEY)) return bad(res, "Ruxsat yo‘q", 403);
        const PL = products(), x = PL.find(q => q.id === +b.id); if (!x) return bad(res, "Topilmadi", 404);
        if (b.ppm !== undefined) x.ppm = nz(b.ppm);
        if (b.p100 !== undefined) { x.prices = x.prices || {}; if (nz(b.p100) > 0) x.prices["100"] = nz(b.p100); else delete x.prices["100"]; }
        if (typeof b.stock === "boolean") x.stock = b.stock;
        if (typeof b.rec === "boolean") x.rec = b.rec;
        if (typeof b.gift === "boolean") x.gift = b.gift;
        if (typeof b.oil === "boolean") x.oil = b.oil;
        if (b.oilPpm !== undefined) x.oilPpm = nz(b.oilPpm);
        if (Array.isArray(b.off)) x.off = b.off.map(Number).filter(n => n > 0 && n < 1000);
        if (b.prices && typeof b.prices === "object") { x.prices = {}; Object.keys(b.prices).forEach(k => { const v = nz(b.prices[k]); if (v > 0 && /^\d{1,3}$/.test(k)) x.prices[k] = v; }); }
        if (Array.isArray(b.tags)) { const ok = (options().categories || []).map(c => c.tag).filter(Boolean); x.tags = b.tags.filter(t => ok.includes(t)); }
        if (b.notes !== undefined) x.notes = String(b.notes).slice(0, 500);
        writeProducts(PL); return send(res, 200, x);
      }
      if (p === "/api/admin/options") {
        if (!same(String(b.key || ""), ADMIN_KEY)) return bad(res, "Ruxsat yo‘q", 403);
        const O = options(), T = v => String(v == null ? "" : v).trim();
        if (b.shop !== undefined) O.shop = T(b.shop).slice(0, 40) || O.shop;
        if (b.phone !== undefined) O.phone = T(b.phone).slice(0, 30);
        if (b.displayMl !== undefined) O.displayMl = nz(b.displayMl) || 10;
        if (b.giftMl !== undefined) O.gift = { ml: nz(b.giftMl) || 3 };
        if (b.oilMax !== undefined) O.oil = { maxRatio: Math.min(1, Math.max(0.1, (+b.oilMax || 70) / 100)), vadaPpm: nz(b.vadaPpm) };
        if (b.vprices && typeof b.vprices === "object") O.bottles.forEach(x => (x.variants || []).forEach(v => { const k = x.id + ":" + v.id; if (b.vprices[k] !== undefined) v.price = nz(b.vprices[k]); }));
        if (b.featuredBrands !== undefined) O.featuredBrands = String(b.featuredBrands).split(",").map(x => x.trim()).filter(Boolean).slice(0, 30);
        if (b.card && typeof b.card === "object") O.card = { number: T(b.card.number).slice(0, 40), owner: T(b.card.owner).slice(0, 60), note: T(b.card.note).slice(0, 200) };
        if (b.bottles && typeof b.bottles === "object") O.bottles.forEach(x => { if (b.bottles[x.id] !== undefined) x.price = nz(b.bottles[x.id]); });
        if (O.delivery) {
          if (b.deliveryNote !== undefined) O.delivery.note = T(b.deliveryNote).slice(0, 300);
          if (b.fees && typeof b.fees === "object") O.delivery.types.forEach(t => { if (b.fees[t.id] !== undefined) t.fee = nz(b.fees[t.id]); });
        }
        if (b.telegram && typeof b.telegram === "object") O.telegram = { token: T(b.telegram.token).slice(0, 120), chat: T(b.telegram.chat).slice(0, 40) };
        if (b.eskiz && typeof b.eskiz === "object") { O.eskiz = { email: T(b.eskiz.email).slice(0, 80), password: T(b.eskiz.password).slice(0, 80) }; eskizTok = null; }
        writeOptions(O); return send(res, 200, { ok: true });
      }
      if (p === "/api/admin/order") {
        if (!same(String(b.key || ""), ADMIN_KEY)) return bad(res, "Ruxsat yo‘q", 403);
        const o = db.orders.find(q => q.id === +b.id); if (!o) return bad(res, "Topilmadi", 404);
        if (STAT.includes(b.status)) o.status = b.status;
        if (typeof b.paid === "boolean" && o.pay) o.pay.paid = b.paid;
        save(); return send(res, 200, o);
      }

      if (p === "/api/send-code") {
        const ph = norm(b.phone); if (!ph) return bad(res, "Telefon raqam noto‘g‘ri.");
        if (tooMany("c" + ip(req), 8, 600000)) return bad(res, "Juda ko‘p so‘rov. Keyinroq urinib ko‘ring.", 429);
        if (db.users[ph]) return bad(res, "Bu raqam ro‘yxatdan o‘tgan. Kirish tugmasini bosing.", 409);
        const c = db.codes[ph]; if (c && Date.now() - c.last < 30000) return bad(res, "Kodni 30 soniyadan keyin qayta so‘rang.", 429);
        const code = String(crypto.randomInt(100000, 1000000));
        db.codes[ph] = { code, exp: Date.now() + 300000, tries: 0, last: Date.now() }; save();
        sendSms(ph, "Attar tasdiqlash kodi: " + code);
        return send(res, 200, { ok: true, devCode: DEV ? code : undefined });
      }
      if (p === "/api/register") {
        const ph = norm(b.phone), name = String(b.name || "").trim().slice(0, 60), pw = String(b.password || "");
        if (!ph || !name || pw.length < 6) return bad(res, "Ma‘lumotlar to‘liq emas.");
        if (db.users[ph]) return bad(res, "Bu raqam ro‘yxatdan o‘tgan.", 409);
        const c = db.codes[ph]; if (!c || c.exp < Date.now()) return bad(res, "Kod eskirgan. Qaytadan so‘rang.");
        if (++c.tries > 5) { delete db.codes[ph]; save(); return bad(res, "Juda ko‘p urinish. Yangi kod so‘rang.", 429); }
        if (!same(String(b.code || ""), c.code)) { save(); return bad(res, "Kod noto‘g‘ri."); }
        const salt = crypto.randomBytes(16).toString("hex");
        db.users[ph] = { name, salt, hash: hash(pw, salt), created: new Date().toISOString() }; delete db.codes[ph];
        return send(res, 200, { token: session(ph), user: pubUser(ph), orders: [] });
      }
      if (p === "/api/login") {
        const ph = norm(b.phone);
        if (!ph || tooMany("l" + ph, 10, 900000)) return bad(res, "Urinishlar ko‘p. Keyinroq urinib ko‘ring.", 429);
        const u = db.users[ph];
        if (!u || !same(hash(String(b.password || ""), u.salt), u.hash)) return bad(res, "Telefon raqam yoki parol noto‘g‘ri.", 401);
        return send(res, 200, { token: session(ph), user: pubUser(ph), orders: myOrders(ph), labels: u.labels || [], likes: u.likes || [] });
      }
      if (p === "/api/logout") {
        const a = auth(req); if (a) { delete db.sessions[a.token]; save(); }
        return send(res, 200, { ok: true });
      }
      if (p === "/api/promo") {
        const a = auth(req); if (!a) return bad(res, "Kirish kerak", 401);
        const code = String(b.code || "").trim().toUpperCase(), pm = (db.promos || {})[code], pe = promoCheck(pm, a.phone, code); if (pe) return bad(res, pe);
        const pool = products().filter(x => x.gift && x.stock !== false), sp = (db.spins || {})[a.phone + "|" + code];
        return send(res, 200, { code, percent: pm.percent, canSpin: pool.length > 0 && !(sp && sp.gift), gift: sp && sp.gift && !sp.used ? sp.gift : null,
          wheel: sample(pool, 8).map(x => ({ id: x.id, label: gname(x) })) });
      }
      if (p === "/api/spin") {
        const a = auth(req); if (!a) return bad(res, "Kirish kerak", 401);
        const code = String(b.code || "").trim().toUpperCase(), pe = promoCheck((db.promos || {})[code], a.phone, code); if (pe) return bad(res, pe);
        const pool = products().filter(x => x.gift && x.stock !== false); if (!pool.length) return bad(res, "Sovg‘alar hali belgilanmagan.");
        db.spins = db.spins || {}; const key = a.phone + "|" + code; let sp = db.spins[key];
        if (sp) return bad(res, "Siz bu promo kod uchun omadingizni allaqachon sinagansiz.");
        const w = pool[crypto.randomInt(pool.length)];
        sp = db.spins[key] = { gift: { id: w.id, brand: w.brand, name: w.name, ml: (options().gift || {}).ml || 3 }, used: false, at: new Date().toISOString() }; save();
        return send(res, 200, wheelOf(sp, pool));
      }
      if (p === "/api/likes") {
        const a = auth(req); if (!a) return bad(res, "Kirish kerak", 401);
        const ids = new Set(products().map(x => x.id));
        db.users[a.phone].likes = [...new Set((Array.isArray(b.ids) ? b.ids : []).map(Number).filter(n => ids.has(n)))].slice(0, 300); save();
        return send(res, 200, { ok: true });
      }
      if (p === "/api/labels") {
        const a = auth(req); if (!a) return bad(res, "Kirish kerak", 401);
        const out = [];
        for (const x of (Array.isArray(b.labels) ? b.labels : []).slice(0, 12)) {
          const d = cleanDesign(x && x.d), id = /^[a-z0-9]{1,24}$/i.test(String(x && x.id)) ? String(x.id) : "";
          if (d && id) out.push({ id, name: String(x.name || "Nakleyka").slice(0, 30), d });
        }
        db.users[a.phone].labels = out; save(); return send(res, 200, { ok: true });
      }
      if (p === "/api/orders") {
        const a = auth(req); if (!a) return bad(res, "Buyurtma berish uchun kiring.", 401);
        const P = products(), items = []; let total = 0;
        const O = options();
        for (const x of Array.isArray(b.items) ? b.items : []) {
          const pr = P.find(q => q.id === x.id), qty = Math.floor(+x.qty);
          if (!pr || !(qty > 0) || qty > 99) continue;
          if (pr.stock === false) return bad(res, (pr.brand ? pr.brand + " — " : "") + pr.name + " hozir sotuvda yo‘q.");
          const bo = O.bottles.find(q => q.id === x.bottle), lb = O.labels.find(q => q.id === x.label);
          if (!bo) return bad(res, pr.name + ": idish hajmini tanlang.");
          if ((pr.off || []).includes(bo.ml)) return bad(res, pr.name + ": " + bo.ml + " ml hozir mavjud emas.");
          const dz = lb && lb.custom ? cleanDesign(x.design) : null;
          if (lb && lb.custom && !dz) return bad(res, "Nakleyka dizayni noto‘g‘ri.");
          const design = dz ? dz.lines.filter(q => q.trim()).join(" / ") : "", text = "";
          const vr = bo.variants ? (bo.variants.find(q => q.id === x.variant) || bo.variants[0]) : null;
          let u, oilTxt = "";
          if (pr.oil) {
            const mx = Math.floor(bo.ml * ((O.oil && O.oil.maxRatio) || 0.7)), om = Math.floor(+x.oil);
            if (!(om >= 1 && om <= mx)) return bad(res, pr.name + ": masla miqdori 1 dan " + mx + " ml gacha bo‘lishi kerak.");
            const vd = bo.ml - om;
            u = pr.oilPpm > 0 ? Math.round(om * pr.oilPpm + vd * ((O.oil && O.oil.vadaPpm) || 0)) : 0;
            oilTxt = "masla " + om + " ml + parfumerniy vada " + vd + " ml";
          } else u = unitPrice(pr, bo);
          const price = u ? u + (bo.price || 0) + (vr ? vr.price || 0 : 0) + (lb ? lb.price || 0 : 0) : 0;
          items.push({ id: pr.id, brand: pr.brand, name: pr.name, qty, price, bottle: bo.name + (vr ? " · " + vr.name : ""), label: lb ? lb.name : "", text, design, dz, oil: oilTxt }); total += price * qty;
        }
        if (!items.length) return bad(res, "Savat bo‘sh.");
        let disc = 0, promoRec = null, spUsed = null;
        const pcode = String(b.promo || "").trim().toUpperCase();
        if (pcode) {
          const pm0 = (db.promos || {})[pcode], pe = promoCheck(pm0, a.phone, pcode); if (pe) return bad(res, pe);
          disc = Math.round(total * pm0.percent / 100);
          const sp = (db.spins || {})[a.phone + "|" + pcode], got = !!(sp && sp.gift && !sp.used);
          if (got) items.push({ id: sp.gift.id, brand: sp.gift.brand, name: sp.gift.name, qty: 1, price: 0, bottle: sp.gift.ml + " ml (sovg‘a)", label: "", text: "", design: "", gift: true });
          promoRec = { code: pcode, percent: pm0.percent, discount: disc, gift: got }; spUsed = got ? sp : null;
        }
        let address = String(b.address || "").trim().slice(0, 200), region = "", btsName = "";
        const DV = options().delivery || { types: [], regions: [] }, dl = b.delivery || {};
        const dt = (DV.types || []).find(q => q.id === dl.type) || (DV.types || [])[0] || { id: "taxi", name: "" };
        const fee = nz(dt.fee);
        if (dt.id === "bts") {
          region = (DV.regions || []).find(q => q === dl.region) || "";
          btsName = String(dl.bts || "").trim().slice(0, 150);
          if (!region) return bad(res, "Viloyatni tanlang.");
          if (btsName.length < 3) return bad(res, "Eng yaqin BTS pochta bo‘limini kiriting.");
          address = region + ", BTS: " + btsName;
        } else if (address.length < 5) return bad(res, "Yetkazib berish manzilini kiriting.");
        const pms = publicOptions().payments, pm = pms.find(q => q.id === b.pay) || pms[0];
        if ((pm.id === "payme" || pm.id === "click") && !(total > 0)) return bad(res, "Onlayn to‘lov uchun atir narxlari kiritilgan bo‘lishi kerak.");
        const o = { id: db.orders.length + 1, phone: a.phone, name: a.user.name, items, total: total - disc + fee, fee, promo: promoRec, date: new Date().toISOString(), status: "yangi",
          address, delivery: { type: dt.id, name: dt.name, region, bts: btsName }, lat: dt.id === "bts" ? null : num(b.lat, 90), lng: dt.id === "bts" ? null : num(b.lng, 180), note: String(b.note || "").trim().slice(0, 200), pay: { method: pm.id, name: pm.name, paid: false } };
        if (promoRec) {
          const pm1 = db.promos[promoRec.code]; pm1.uses = (pm1.uses || 0) + 1;
          db.promoUses = db.promoUses || {}; (db.promoUses[promoRec.code] = db.promoUses[promoRec.code] || []).push(a.phone);
          if (spUsed) spUsed.used = true;
        }
        db.orders.push(o); save();
        const po = pubOrder(o);
        console.log("[BUYURTMA #" + o.id + "] " + o.name + " +" + o.phone + "\n" + po.lines);
        const text = orderText(o, po);
        tg("Parfume Attar\n" + text + "\n\nAdmin: " + (process.env.PUBLIC_URL || options().publicUrl || "") + "/admin.html");
        return send(res, 200, { order: po, pay: payInfo(o), text });
      }
      return bad(res, "Topilmadi", 404);
    }
    const f = path.normalize(path.join(PUB, p === "/" ? "index.html" : p));
    if (f !== PUB && !f.startsWith(PUB + path.sep)) { res.writeHead(403); return res.end(); }
    fs.readFile(f, (e, d) => {
      if (e) { res.writeHead(404); return res.end("Topilmadi"); }
      res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(d);
    });
  } catch (e) { bad(res, "Server xatosi", 500); }
}).listen(PORT, () => console.log("Attar ishga tushdi: http://localhost:" + PORT + (DEV ? "  (test rejimi)" : "")));
