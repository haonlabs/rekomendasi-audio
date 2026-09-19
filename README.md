# Tier list Kitab Audio

Tier list yang datanya diambil langsung dari Google Sheets publik. Kalau isi sheet berubah, website ikut berubah paling lambat 5 menit kemudian (ISR, `revalidate = 300`).

Semua tab diprerender saat build. Ini disengaja: mengunduh export `.xlsx` dari Google makan 15-18 detik karena filenya dibangkitkan on-demand, jadi jangan sampai ada pengunjung yang menanggungnya. Setelah build, ISR menyajikan versi lama sambil regenerasi di latar belakang. Konsekuensinya build jadi ~60 detik lebih lama.

## Jalankan

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # cek parser
```

## Konfigurasi (`.env.local`, opsional)

- `GOOGLE_SHEETS_API_KEY`: opsional. Tanpa key, data diambil dari export `.xlsx` publik yang sudah memuat link Shopee/Tiktok dan nilai sel apa adanya. Key dipakai kalau mau lewat Sheets API resmi (lebih tahan perubahan format export, dan mendukung beberapa link dalam satu sel). Cara buat: Google Cloud Console → aktifkan "Google Sheets API" → Credentials → API key (batasi ke Sheets API saja).
- `SHEET_ID`: ganti kalau mau pakai spreadsheet lain.

## Struktur

- `lib/sheet.ts`: daftar tab dan cara ambil data (Sheets API kalau ada key, kalau tidak export `.xlsx` publik).
- `lib/xlsx.ts`: buka zip xlsx, ambil nilai terformat + hyperlink tiap sel.
- `lib/parse.ts`: ubah grid sheet jadi tier. Baris header dikenali dari kolom A (`Rank`/`Tier`/`Value…`), kolom nama dicari otomatis karena letaknya beda-beda tiap tab, kolom lain tampil di detail.
- `app/[slug]/page.tsx`: satu halaman per tab, misalnya `/eartips`.
- `components/TierBoard.tsx`: pencarian, filter "Dipakai Di", dan dialog detail.

Tab tanpa kolom peringkat (DAP, Charger) ditampilkan sebagai daftar datar tanpa label tier.

## Deploy

Push ke GitHub lalu import di Vercel. Tidak perlu environment variable apa pun; isi `GOOGLE_SHEETS_API_KEY` hanya kalau mau lewat Sheets API.

Data dan review milik Fernanda Gunsan. Cantumkan kredit dan minta izin sebelum dipublikasikan.
