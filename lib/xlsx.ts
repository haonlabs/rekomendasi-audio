import { strFromU8, unzipSync } from "fflate";
import type { Cell } from "./parse";

// Format angka bawaan xlsx yang dipakai sheet ini; sisanya didefinisikan di styles.xml.
const BUILTIN_FORMAT: Record<string, string> = {
  "0": "General", "1": "0", "2": "0.00", "3": "#,##0", "4": "#,##0.00",
  "9": "0%", "10": "0.00%", "49": "@",
};

const decode = (s: string) =>
  s.replace(/_x000D_/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, "&");

const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? "";

const rels = (xml: string) =>
  Object.fromEntries([...xml.matchAll(/<Relationship [^>]*>/g)].map(([t]) => [attr(t, "Id"), attr(t, "Target")]));

/** "A1" -> 0, "AB7" -> 27 */
function columnOf(ref: string) {
  let n = 0;
  for (const ch of ref) {
    if (ch < "A" || ch > "Z") break;
    n = n * 26 + ch.charCodeAt(0) - 64;
  }
  return n - 1;
}

// ponytail: cukup untuk format yang dipakai sheet ini (#,##0, #,##0.0, [$Rp]#,##0, 0%).
// Tanggal masih keluar sebagai angka serial; tambahkan kalau nanti ada kolom tanggal.
function formatNumber(value: number, code: string) {
  if (!code || code === "General") return String(value);
  const percent = code.includes("%");
  const decimals = code.match(/\.(0+)/)?.[1].length ?? 0;
  const prefix = code.match(/\[\$([^\]\-]*)[^\]]*\]/)?.[1] ?? "";
  const n = (percent ? value * 100 : value).toLocaleString("en-US", {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: code.includes("#,#"),
  });
  return `${prefix}${n}${percent ? "%" : ""}`;
}

/** Baca export xlsx Google Sheets jadi grid per tab, lengkap dengan hyperlink tiap sel. */
export function readXlsx(buffer: ArrayBuffer): Map<string, Cell[][]> {
  const zip = unzipSync(new Uint8Array(buffer));
  const xml = (path: string) => (zip[path] ? strFromU8(zip[path]) : "");

  // <si> bisa terpecah jadi beberapa <r><t>…</t></r> kalau satu sel punya beberapa gaya.
  const shared = [...xml("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)]
    .map(([, si]) => decode([...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join("")));

  const styles = xml("xl/styles.xml");
  const custom = Object.fromEntries(
    [...styles.matchAll(/<numFmt numFmtId="(\d+)" formatCode="([^"]*)"/g)].map(([, id, code]) => [id, decode(code)]),
  );
  const formats = [...(styles.match(/<cellXfs[\s\S]*?<\/cellXfs>/)?.[0] ?? "").matchAll(/<xf [^>]*numFmtId="(\d+)"/g)]
    .map(([, id]) => custom[id] ?? BUILTIN_FORMAT[id] ?? "General");

  const book = rels(xml("xl/_rels/workbook.xml.rels"));
  const sheets = new Map<string, Cell[][]>();

  for (const [tag] of xml("xl/workbook.xml").matchAll(/<sheet [^>]*>/g)) {
    const path = book[attr(tag, "r:id")];
    const sheet = path && xml(`xl/${path}`);
    if (!sheet) continue;

    const targets = rels(xml(`xl/worksheets/_rels/${path.split("/").pop()}.rels`));
    const links = new Map<string, string>();
    for (const [t] of sheet.matchAll(/<hyperlink [^>]*>/g)) {
      const url = targets[attr(t, "r:id")];
      if (url) links.set(attr(t, "ref").split(":")[0], decode(url)); // rentang -> sel kiri atas
    }

    const grid: Cell[][] = [];
    for (const [, head, body] of sheet.matchAll(/<row ([^>]*)>([\s\S]*?)<\/row>/g)) {
      const row: Cell[] = [];
      for (const [, cell, inner = ""] of body.matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = attr(cell, "r"), type = attr(cell, "t");
        const raw = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
        const text =
          type === "s" ? shared[+raw] ?? ""
          : type === "inlineStr" ? decode([...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(""))
          : type === "str" || type === "e" ? decode(raw)
          : type === "b" ? (raw === "1" ? "TRUE" : "FALSE")
          : raw ? formatNumber(+raw, formats[+attr(cell, "s") || 0])
          : "";
        const url = links.get(ref);
        if (text || url) row[columnOf(ref)] = { text, links: url ? [url] : [] };
      }
      grid[+attr(head, "r") - 1] = row;
    }
    for (let i = 0; i < grid.length; i++) grid[i] ??= []; // baris kosong tetap ada supaya nomor baris cocok

    sheets.set(decode(attr(tag, "name")), grid);
  }
  return sheets;
}
