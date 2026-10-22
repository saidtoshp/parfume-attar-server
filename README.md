# Parfume Attar (server)

## Ishga tushirish
1. Kompyuteringizga Node.js (18 yoki yangi) o‘rnating: https://nodejs.org
2. Shu papkada terminal oching va yozing:  `node server.js`
3. Brauzerda oching: http://localhost:3000

Hech qanday qo‘shimcha o‘rnatish (npm install) kerak emas.

## Sinab ko‘rish
- Profil > Yangi hisob ochish: telefon, ism, parol kiriting. "Kod yuborish" bosilganda kod ekranda va terminalda chiqadi (test rejimi).
- Savatga atir qo‘shib, buyurtma bering. Buyurtmalar http://localhost:3000/admin.html sahifasida ko‘rinadi (kalit: admin123).

## Narx va izohlarni o‘zgartirish
`products.json` faylini oching: har bir atirda `"price"` (so‘mda) va `"notes"` (izoh) bor. Saqlang va sahifani yangilang.

## Muhim
- Ma‘lumotlar `data/db.json` faylida saqlanadi (nusxasini oling).
- Admin kalitini o‘zgartiring: `ADMIN_KEY=mening-kalitim node server.js` (Windows: `set ADMIN_KEY=mening-kalitim` keyin `node server.js`).
- Haqiqiy SMS yuborish uchun `server.js` ichidagi `sendSms` funksiyasiga SMS xizmati (masalan, Eskiz.uz) ulanadi.
- Internetga chiqarishdan oldin `NODE_ENV=production` qo‘ying (shunda kod ekranda ko‘rsatilmaydi) va HTTPS ishlating.

## Idish va nakleyka
`options.json` faylida idishlar (`bottles`) va nakleykalar (`labels`) ro‘yxati bor. Nomini yozing, `"price"` ga qo‘shimcha narxni qo‘ying (0 bo‘lsa qo‘shilmaydi). `"custom": true` bo‘lgan nakleyka uchun mijoz o‘zi yozuv kiritadi.

## Admin
`http://localhost:3000/admin.html`: **Buyurtmalar** (idish, nakleyka va sticker tafsilotlari bilan) va **Mijozlar** (ro‘yxatdan o‘tganlar) bo‘limlari.

## Sticker sozlamalari
`options.json` ichida: `shop` (idishdagi do‘kon nomi), `templates` (andozalar), `colors` (ranglar), `icons` (belgilar). Sticker idishdagi atir nomi va do‘kon nomi joyini yopmaydi, faqat pastdagi bo‘sh joyga qo‘yiladi.

## Idish hajmlari
`options.json` > `bottles`: har bir hajmning o‘z flakoni bor (`style`: vial = mini, flask = oddiy, spray = sprey, factory = zavod idishi; `w` va `h` flakon o‘lchami). 100 ml "factory" ko‘rinishida: atir nomi va brend idishning o‘zida bosilgan, do‘kon nakleykasi qo‘yilmaydi. Kichik hajmlarda esa oq nakleykada do‘kon nomi va atir nomi turadi. Sticker har bir idishning o‘lchamiga moslab kichrayadi yoki kattalashadi. Yangi hajm qo‘shish uchun shu ro‘yxatga yangi qator qo‘shing (`id` takrorlanmasin).

## Idishlar rasmi
Idish rasmlari `public/bottles/` papkasida (3, 5, 10, 20, 30, 50, 100 ml). Atirning rangi idishning ichida suyuqlik sifatida ko‘rinadi.

## Yetkazib berish va to‘lov
- Mijoz buyurtma berganda manzilni yozadi va xaritada joyni belgilaydi (yoki "Joylashuvimni aniqlash"). Xarita uchun internet kerak (OpenStreetMap). Admin sahifasida har bir buyurtmada "Xaritada ochish" havolasi bor.
- To‘lov: **Naxt** (yetkazilganda) va **Karta orqali o‘tkazma**. Karta raqami va egasini `options.json` > `card` ga yozing. To‘lov tushgach, admin sahifasida "To‘landi deb belgilash" tugmasini bosasiz. Buyurtma holati (yangi, yig‘ilmoqda, yo‘lda, yetkazildi) ham shu yerda o‘zgaradi.
- **Payme / Click** (onlayn to‘lov): `options.json` ichida `payme.merchant_id` yoki `click.service_id` va `click.merchant_id` ni yozsangiz, to‘lov usullari ro‘yxatida avtomatik chiqadi va mijoz to‘lov sahifasiga o‘tadi. Buning uchun Payme/Click bilan shartnoma (merchant hisobi) kerak. Hozircha to‘lov tushganini admin qo‘lda belgilaydi; avtomatik tasdiqlash uchun ularning callback manzillarini ulash kerak bo‘ladi. Internetga chiqqach `publicUrl` ni saytingiz manziliga almashtiring.

## Nakleyka bo‘limi (NIIMBOT B21S va M2_H)
- Saytda alohida **Nakleyka** bo‘limi bor (Katalog va Savat orasida): 12 ta shablon, shrift, ramka, belgi, joylashuv va teskari (qora fon) tanlanadi. Hammasi faqat **oq-qora**, o‘lchami **50×30 mm**.
- Mijoz nakleykani saqlaydi, katalogda atirni tanlaganda «Mening nakleykam» orqali biriktiradi. Admin sahifasida har bir buyurtmada nakleyka rasmi va **PNG** yuklab olish tugmalari bor: «B21S (203 dpi)» 400×240 piksel, «300 dpi» 591×354 piksel.
- Chop etish: PNG ni NIIMBOT ilovasida rasm sifatida qo‘shib 50×30 mm etiketkaga chop etasiz. M2_H uchun 300 dpi ni, bo‘lmasa 203 dpi ni sinab ko‘ring.
- Shrift va ikonkalar uchun internet kerak (Google Fonts); internet bo‘lmasa oddiy shriftlar ishlatiladi.

## Yetkazib berish
Toshkent shahri: Yandex taksi (manzil + xarita). Boshqa viloyatlar: BTS pochta (viloyat va eng yaqin BTS bo‘limi yoziladi). Matn va viloyatlar `options.json` > `delivery` da. To‘lov kartasi va telefon `options.json` > `card`, `phone` da.

## Admin sahifasi (`/admin.html`)
Bo‘limlar: **Buyurtmalar**, **Mijozlar**, **Atirlar**, **Sozlamalar**.
- **Atirlar**: har bir atirning 1 ml narxi (narx = 1 ml narxi × idish hajmi + idish qo‘shimcha narxi), 100 ml uchun alohida narx, izoh va «Sotuvda bor» belgisi. JSON faylni qo‘lda o‘zgartirish shart emas.
- **Sozlamalar**: do‘kon nomi, telefon, karta, yetkazib berish narxi, idish narxlari, Telegram va SMS.

## Telegramga yangi buyurtma xabari
1. Telegramda @BotFather ga `/newbot` yozing va bot token oling.
2. Botingizga `/start` yozing. Chat ID ni @userinfobot dan bilib oling.
3. Admin > Sozlamalar ga token va Chat ID ni yozib saqlang. Endi har bir yangi buyurtma Telegramga keladi.

## SMS (Eskiz.uz)
Eskiz.uz akkauntingiz bo‘lsa, Sozlamalar ga email va parolni yozing. Hozircha test rejimida kod terminalda va ekranda chiqadi. Eskiz ulanishi sinab ko‘rilmagan, birinchi marta ishlatganda terminaldagi `[Eskiz]` qatorini tekshiring.

## Hisob va nakleykalar
Nakleykalar mijoz hisobiga saqlanadi (istalgan qurilmadan kirsa ko‘rinadi). Ma‘lumotlarning kunlik nusxasi `data/backups` papkasida (oxirgi 14 kun).

## Internetga chiqarish (qisqacha)
1. Node.js 18+ o‘rnatilgan server (VPS) oling, loyiha papkasini yuklang.
2. `NODE_ENV=production node server.js` bilan ishga tushiring (pm2 yoki systemd bilan doimiy ishlaydi). Shunda test kodi ekranda ko‘rsatilmaydi va admin kaliti `data/admin-key.txt` da tasodifiy yaratiladi.
3. HTTPS kerak (nginx + Let‘s Encrypt), aks holda telefon joylashuvi ishlamaydi.
4. SMS ishlashi uchun Eskiz.uz ulanishi shart, aks holda mijozlar ro‘yxatdan o‘ta olmaydi.
5. `options.json` > `publicUrl` ga sayt manzilini yozing.

## Bosh sahifa, katalog va kartochkalar (Uzum uslubida)
- Bosh sahifa: shahar tanlash (Toshkent yoki viloyat), qidiruv, banner, brendlar doirachalari, «Tavsiya etilgan atirlar» va atir kartochkalari. Kartochkada rasm, narx, atirning **notalari**, «Savatga» tugmasi va sevimlilar (yurakcha) bor.
- Katalog: kategoriyalar (Erkaklar, Ayollar, Uniseks, Nish, Arab, Mini, Attar moylari, Sovg‘a to‘plamlari) va brendlar. Bo‘sh kategoriyalar ko‘rinmaydi.
- Admin > Atirlar: har bir atirga **rasm yuklash**, kategoriya belgilari, «Tavsiya» va «Sotuvda bor». Admin > Brendlar: brend rasmi. Admin > Sozlamalar: logotip, mashhur brendlar tartibi, kartochkadagi asosiy hajm.
- Kategoriya belgilari (erkak/ayol/uniseks/nish) taxminiy qo‘yilgan, admin sahifasida tekshirib to‘g‘rilang. Rasm yuklanmagan atirlar uchun idish rasmi avtomatik chiziladi.

## Yangi imkoniyatlar (so‘nggi yangilanish)
- **Idish hajmlari:** 3, 10, 20, 30, 40, 50 va 100 ml. Buyurtma oynasida mijozdan faqat idish hajmi so‘raladi (nakleyka ixtiyoriy, yig‘iladigan bo‘limda). 10 ml uchun idish turi tanlanadi: shisha yoki charm qoplamali (6 rang).
- **Narxlar:** Admin > Atirlar da har bir atirning HAR BIR hajmi uchun alohida narx yoziladi va hajmni o‘chirib qo‘yish mumkin. Narx yozilmasa, «narx belgilanmagan» chiqadi.
- **Original flakon rasmlari:** hozircha rasm yo‘q atirlar uchun brend bosh harflari bilan vaqtinchalik belgi chiqadi. Haqiqiy rasmlarni Admin > Rasmlar (ommaviy) orqali yuklang: fayl nomi atir yoki brend nomiga o‘xshash bo‘lsin (masalan `dior-sauvage.jpg`, `chanel.jpg`). Tizim moslashtiradi, siz tasdiqlaysiz. Yangi atir qo‘shish: Admin > Atirlar > «Yangi atir qo‘shish».
- **Atir tanlash yordamchisi:** bosh sahifa va katalogdagi oltin tugma. 8 ta savol bittadan beriladi, keyin 3 ta atir tavsiya qilinadi. Tavsiya atirlarning hid yo‘nalishi, kuchi, fasli va vaziyat belgilariga (`products.json` ichida `fam`, `str`, `sea`, `occ`) tayanadi. Bu belgilar taxminiy qo‘yilgan, kerak bo‘lsa to‘g‘rilang. Narx, mavjudlik va davomiylik uydirilmaydi.
- **Promo kodlar:** Admin > Promo kodlar. Kod kiritgan mijozga 20% (o‘zgartirsa bo‘ladi) chegirma va bir marta omad g‘ildiragi beriladi. Yutgan sovg‘a atir (hajmi Sozlamalarda) buyurtma bilan tekin yuboriladi. G‘ildirakdagi atirlar: Atirlar bo‘limida «Sovg‘a» belgisi qo‘yilganlar. Natijani server tanlaydi, mijoz o‘zgartira olmaydi. Bitta kod bitta mijozga bir marta ishlaydi.
- **Yog‘li atrlar (masla):** Atirlar bo‘limida «Yog‘li atr» belgisi va 1 ml masla narxi. Mijoz masla miqdorini tanlaydi (idish hajmining 70 % igacha, Sozlamalarda o‘zgaradi), qolgani «parfumerniy vada» bilan to‘ldiriladi.
- **Layklar:** yurakcha mijoz hisobiga saqlanadi, kartochkada layklar soni ko‘rinadi. Admin > Layklar da qaysi atirga kim layk bosgani chiqadi.
