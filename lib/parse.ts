export type Cell = { text: string; links: string[] };
export type Field = { label: string; text: string; links: string[] };
export type Item = { id: string; rank: string; name: string; subtitle: string; price: string; tags: string[]; fields: Field[] };
export type Tier = { rank: string; items: Item[] };
export type Board = { notes: string[]; tiers: Tier[]; tags: string[] };

// Rank di sheet bebas bentuk: "S", "SS", "S+++++", "A++", "B--", "B +", "-". Skornya
// dihitung dari huruf + jumlah plus/minus, bukan dicocokkan ke daftar, supaya varian
// baru ikut urut sendiri tanpa perlu diubah di sini. Makin kecil skor makin tinggi.
const LETTERS = "SABCDEF";

export function rankScore(rank: string) {
  const r = rank.replace(/\s+/g, "").toUpperCase();
  const base = r ? LETTERS.indexOf(r[0]) : -1; // indexOf("") = 0, jadi string kosong dicegat dulu
  if (base < 0) return Number.MAX_SAFE_INTEGER; // "-", "" dan teman-temannya ke paling bawah
  const repeat = /^(.)\1*/.exec(r)![0].length; // "SSS" di atas "SS" di atas "S"
  return base * 100 - (repeat - 1) * 50 - (r.match(/\+/g)?.length ?? 0) * 5 + (r.match(/-/g)?.length ?? 0) * 5;
}

// Warna tier: satu skala merah -> ungu, posisinya diambil dari skor rank. Jadi "A++"
// otomatis jatuh di antara S dan A, bukan abu-abu seperti waktu warnanya didaftar satu-satu.
const SCALE = ["#ff3d6e", "#ff5a4e", "#ff9f40", "#ffe066", "#8fd694", "#6fb7e8", "#8e9cf0", "#b09cf0"];

export function tierColor(rank: string) {
  const score = rankScore(rank);
  if (score > 1e6) return "#c7ccd6";
  const pos = Math.min(Math.max(score / 100 + 1, 0), SCALE.length - 1);
  const i = Math.floor(pos);
  return i === pos ? SCALE[i] : `color-mix(in oklab, ${SCALE[i]}, ${SCALE[i + 1]} ${Math.round((pos - i) * 100)}%)`;
}

// Sebagian sel harga tidak diformat di sheet ("2499000"); rapikan biar seragam.
const groupDigits = (s: string) => (/^\d{4,}$/.test(s) ? Number(s).toLocaleString("en-US") : s);

const clean = (s = "") => s.replace(/\r/g, "").trim();

// Baris header tier list. Kolom A-nya beda-beda tiap tab ("Rank", "Tier", "Value money",
// "Value Rank", ...), dan harus punya >=2 sel terisi supaya baris catatan pemilik yang
// kebetulan diawali "TIER LIST INI..." tidak ikut terbaca sebagai header.
// Baris catatan pemilik cuma satu sel; baris header selalu punya beberapa kolom terisi.
const isHeader = (r: Cell[]) => !!clean(r[0]?.text) && r.filter((c) => clean(c?.text)).length >= 2;
const isRankHeader = (r: Cell[]) => isHeader(r) && /^(rank|tier|value)\b/i.test(clean(r[0]?.text));

/** "S", "SS", "B+", "S+++++", "-", atau kosong: isi kolom peringkat, bukan nama barang. */
const isRankValue = (s: string) => !s || s === "-" || /^[a-fs]{1,5}[+-]{0,6}$/i.test(s);

/** Ubah grid sheet jadi tier list, atau daftar datar kalau tabnya tanpa peringkat. */
export function toBoard(grid: Cell[][]): Board | null {
  // Tab DAP dan Charger tidak punya kolom peringkat sama sekali: nama langsung di kolom A.
  const ranked = grid.findIndex(isRankHeader);
  const headerAt = ranked >= 0 ? ranked : grid.findIndex(isHeader);
  if (headerAt < 0) return null;

  const headers = grid[headerAt].map((c) => clean(c?.text));
  const rows = grid.slice(headerAt + 1);
  const width = Math.max(headers.length, ...rows.map((r) => r.length));

  // Kolom nama tidak selalu B: sebagian tab menyelipkan peringkat kedua ("Sound",
  // "Value money") dulu. Ambil kolom pertama yang isinya bukan kode tier.
  let nameCol = ranked >= 0 ? 1 : 0;
  while (nameCol < width && rows.every((r) => isRankValue(clean(r[nameCol]?.text)))) nameCol++;
  if (nameCol >= width) return null;

  const usageCol = headers.findIndex((h) => /^dipakai di$/i.test(h));
  const labelledPrice = headers.findIndex((h) => /price|harga/i.test(h));
  // Di sheet aslinya kolom harga tidak pernah diberi judul; letaknya setelah kolom nama.
  const priceCol = labelledPrice >= 0 ? labelledPrice : headers.findIndex((h, j) => j > nameCol && !h);

  const notes = grid.slice(0, headerAt).flatMap((r) => r.map((c) => clean(c?.text)).filter(Boolean));

  const items: Item[] = [];
  for (const [i, r] of rows.entries()) {
    const rank = ranked >= 0 ? clean(r[0]?.text).toUpperCase().replace(/\s+/g, "") : ""; // "B +" = "B+"
    const [name, ...rest] = clean(r[nameCol]?.text).split("\n").map((s) => s.trim()).filter(Boolean);
    if (!name || (ranked >= 0 && !rank)) continue;

    const fields: Field[] = [];
    for (let j = 1; j < r.length; j++) {
      if (j === nameCol) continue;
      const text = clean(r[j]?.text), links = r[j]?.links ?? [];
      if (text || links.length) fields.push({ label: headers[j] || "Lainnya", text, links });
    }
    const tags = usageCol < 0 ? [] : clean(r[usageCol]?.text)
      .split(/\s*(?:&|\+|,|\/|\bdan\b|\band\b)\s*/i)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);

    items.push({
      id: `${headerAt + 2 + i}`, // nomor baris di sheet
      rank, name, subtitle: rest.join(" "),
      // "Rp69.000 link 2" -> "Rp69.000", "link 2" -> ""
      price: priceCol < 0 ? "" : groupDigits(clean(r[priceCol]?.text).match(/^(?:rp\s*)?[\d.,]+/i)?.[0] ?? ""),
      tags, fields,
    });
  }

  const ranks = [...new Set(items.map((i) => i.rank))].sort((a, b) => rankScore(a) - rankScore(b));

  return {
    notes,
    tiers: ranks.map((rank) => ({ rank, items: items.filter((i) => i.rank === rank) })),
    tags: [...new Set(items.flatMap((i) => i.tags))].sort(),
  };
}
