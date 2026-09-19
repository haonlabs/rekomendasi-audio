import { toBoard, type Cell } from "./parse";
import { readXlsx } from "./xlsx";

export const SHEET_ID = process.env.SHEET_ID ?? "1KXDCrMErS1ZjjJhxjTYqNax1bjWWl4peXv0eaLMlxVc";
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;
export const REVALIDATE_SECONDS = 300;

// Untuk URL absolut di Open Graph, sitemap, dan robots. Vercel mengisi yang kedua otomatis.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  ?? "http://localhost:3000";

// Nama tab persis seperti di Google Sheets. Tambah/hapus di sini kalau tab-nya berubah.
const TAB_NAMES = [
  "Eartips", "IEM", "TWS", "TWS NO KARET", "OWS", "W. Headphone", "Headphone", "Dongle DAC",
  "Blutut DAC", "Kabel", "Desktop DAC", "Gaming", "Mic", "Headphone Amp", "Speaker 2 unit",
  "Blutut Speaker", "Soundbar", "DAP", "Soundcard", "Clip On Wireless", "Charger",
];

export const TABS = TAB_NAMES.map((name) => ({
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
}));

type ApiCell = { formattedValue?: string; hyperlink?: string; textFormatRuns?: { format?: { link?: { uri?: string } } }[] };

/** Sheets API v4: nilai apa adanya + hyperlink (termasuk beberapa link dalam satu sel). */
async function fromApi(tab: string, key: string): Promise<Cell[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?` + new URLSearchParams({
    key,
    ranges: `'${tab}'`,
    includeGridData: "true",
    fields: "sheets.data.rowData.values(formattedValue,hyperlink,textFormatRuns.format.link.uri)",
  });
  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`Sheets API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const rows: { values?: ApiCell[] }[] = json.sheets?.[0]?.data?.[0]?.rowData ?? [];
  return rows.map((r) => (r.values ?? []).map((c) => ({
    text: c.formattedValue ?? "",
    links: [...new Set([c.hyperlink, ...(c.textFormatRuns ?? []).map((t) => t.format?.link?.uri)].filter((u): u is string => !!u))],
  })));
}

/** Tanpa API key: export xlsx publik. Berisi nilai terformat sekaligus hyperlink. */
// ponytail: workbook di-memo di memori proses karena ukurannya ~2,6 MB, di atas batas entri
// Next Data Cache. Pindah ke object storage kalau sheetnya membengkak. `revalidate` tetap
// dipakai (bukan "no-store") supaya halamannya masih bisa diprerender jadi statis; efeknya
// build memuntahkan "Failed to set Next.js data cache, items over 2MB" sekali per worker.
// Itu wajar dan tidak perlu diperbaiki — memo di bawah ini yang mengerjakan cachenya.
let book: { at: number; tabs: Map<string, Cell[][]> } | undefined;

async function fromXlsx(tab: string): Promise<Cell[][]> {
  if (!book || Date.now() - book.at > REVALIDATE_SECONDS * 1000) {
    const res = await fetch(`${SHEET_URL}/export?format=xlsx`, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) throw new Error(`Google Sheets ${res.status} saat mengunduh xlsx`);
    book = { at: Date.now(), tabs: readXlsx(await res.arrayBuffer()) };
  }
  return book.tabs.get(tab) ?? [];
}

export async function getBoard(tab: string) {
  const key = process.env.GOOGLE_SHEETS_API_KEY;
  return toBoard(key ? await fromApi(tab, key) : await fromXlsx(tab));
}
