// Jalankan: npm test
import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import { rankScore, tierColor, toBoard, type Cell } from "./parse.ts";
import { readXlsx } from "./xlsx.ts";

const grid = (rows: string[][]): Cell[][] => rows.map((r) => r.map((text) => ({ text, links: [] })));

// Tab Eartips: baris 1 catatan, header di baris 2, rank acak, nama + subtitle satu sel.
const eartips = toBoard(grid([
  ["-Catatan pemilik", "", "", "", "", "", ""],
  ["Rank", "Eartips", "Price + LINK", "Shopee", "Dipakai Di", "karakter", "Pernah dipakai di"],
  ["S", "Infitear ie45 pro\nA Better JVC Spiral", "170,000", "Shopee", "IEM", 'Sub bass "dalem"', "Tangzu Xuan Nv"],
  ["B", "Tangzu Sancai", "59,000", "Shopee", "IEM & TWS", "Bikin warm", ""],
  ["A", "Feaulle H570", "89,000", "Shopee", "IEM", "Lebar ceper", ""],
  ["B+", "Final Audio Fusion G", "312,000", "Shopee", "IEM dan TWS", "Cocok untuk XM5", ""],
  ["C", "Tri clarion", "25,000", "Shopee", "TWS and IEM", "murah", ""],
  ["", "", "", "", "", "", ""],
]))!;
assert.deepEqual(eartips.notes, ["-Catatan pemilik"]);
assert.deepEqual(eartips.tiers.map((t) => t.rank), ["S", "A", "B+", "B", "C"]);
const first = eartips.tiers[0].items[0];
assert.equal(first.name, "Infitear ie45 pro");
assert.equal(first.subtitle, "A Better JVC Spiral");
assert.equal(first.price, "170,000");
assert.deepEqual(eartips.tags, ["IEM", "TWS"]);
assert.deepEqual(eartips.tiers[3].items[0].tags, ["IEM", "TWS"]);

// Tab IEM/TWS: header kolom A bukan "Rank", ada peringkat kedua sebelum kolom nama,
// dan kolom harga tanpa judul. Baris catatan diawali "TIER LIST" tidak boleh jadi header.
const tws = toBoard(grid([
  ["TIER LIST INI SANGAT SUBJEKTIF", "", "", "", ""],
  ["Value\nmoney", "Sound", "TWS", "", "Shopee"],
  ["A", "SS", "JBL Live Flex 3\nBest Sounding", "2,800,000", "Shopee"],
  ["B-", "A+", "Airpods 4 ANC", "Rp2,799,000", "Shopee"],
]))!;
assert.deepEqual(tws.notes, ["TIER LIST INI SANGAT SUBJEKTIF"]);
assert.deepEqual(tws.tiers.map((t) => t.rank), ["A", "B-"]);
assert.equal(tws.tiers[0].items[0].name, "JBL Live Flex 3");
assert.equal(tws.tiers[0].items[0].subtitle, "Best Sounding");
assert.equal(tws.tiers[0].items[0].price, "2,800,000");
assert.equal(tws.tiers[1].items[0].price, "Rp2,799,000");
assert.deepEqual(tws.tiers[0].items[0].fields[0], { label: "Sound", text: "SS", links: [] });

// Tab DAP/Charger: tidak ada kolom peringkat, nama langsung di kolom A.
const flat = toBoard(grid([
  ["Name", "", "link Tiktok"],
  ["UNEED GaN Charger 65W", "294,000", "tiktok"],
  ["Baseus GaN6 Pro 65W", "284,000", "tiktok"],
]))!;
assert.equal(flat.tiers.length, 1);
assert.equal(flat.tiers[0].rank, "");
assert.equal(flat.tiers[0].items[0].name, "UNEED GaN Charger 65W");
assert.equal(flat.tiers[0].items[0].price, "294,000");

// --- skor rank: varian bebas bentuk harus urut sendiri, tanpa daftar hardcoded ---
const urut = ["SSS+++", "SSS", "SS", "S+++++", "S+", "S", "S-", "A++", "A+", "A", "B+", "B", "C", "D+", "D", "E-", "F"];
for (let i = 1; i < urut.length; i++) {
  assert.ok(rankScore(urut[i - 1]) < rankScore(urut[i]), `${urut[i - 1]} harus di atas ${urut[i]}`);
}
assert.equal(rankScore("B +"), rankScore("B+"));            // spasi diabaikan
assert.ok(rankScore("-") > rankScore("F"));                 // tanpa huruf: paling bawah
assert.equal(rankScore(""), rankScore("-"));                // tab daftar datar tidak punya rank
assert.equal(tierColor(""), "#c7ccd6");
assert.equal(tierColor("S"), "#ff5a4e");
assert.equal(tierColor("-"), "#c7ccd6");
assert.ok(tierColor("A++").startsWith("color-mix("));       // di antara S dan A, bukan abu-abu

// Harga yang di sheet tidak diformat ikut dirapikan.
const mentah = toBoard(grid([["Rank", "Nama", "", "Shopee"], ["S", "Sony XM6", "2499000", "Shopee"]]))!;
assert.equal(mentah.tiers[0].items[0].price, "2,499,000");

// Tanpa baris header sama sekali: bukan tabel yang bisa ditampilkan.
assert.equal(toBoard(grid([["Nama"]])), null);

// --- pembaca xlsx: shared string bergaya campuran, format angka, dan hyperlink ---
const xlsx = zipSync(Object.fromEntries(Object.entries({
  "xl/workbook.xml": `<workbook><sheets><sheet state="visible" name="Demo" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  "xl/_rels/workbook.xml.rels": `<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>`,
  "xl/sharedStrings.xml": `<sst><si><t>Rank</t></si><si><r><t>Sony </t></r><r><t>XM6 &amp; co</t></r></si><si><t>Shopee</t></si></sst>`,
  "xl/styles.xml": `<styleSheet><numFmts><numFmt numFmtId="165" formatCode="[$Rp]#,##0"/></numFmts><cellXfs count="3"><xf numFmtId="0"/><xf numFmtId="3"/><xf numFmtId="165"/></cellXfs></styleSheet>`,
  "xl/worksheets/sheet1.xml": `<worksheet><sheetData>` +
    `<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" s="0"/><c r="C1" t="s"><v>2</v></c></row>` +
    `<row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2" s="1"><v>4999000</v></c><c r="C2" t="s"><v>2</v></c></row>` +
    `<row r="3"><c r="A3" t="inlineStr"><is><t>Bose</t></is></c><c r="B3" s="2"><v>2499000</v></c></row>` +
    `</sheetData><hyperlinks><hyperlink r:id="rId1" ref="C2"/></hyperlinks></worksheet>`,
  "xl/worksheets/_rels/sheet1.xml.rels": `<Relationships><Relationship Id="rId1" Target="https://s.shopee.co.id/abc"/></Relationships>`,
}).map(([k, v]) => [k, strToU8(v)])));

const demo = readXlsx(xlsx.buffer.slice(xlsx.byteOffset, xlsx.byteOffset + xlsx.byteLength) as ArrayBuffer).get("Demo")!;
assert.equal(demo[1][0].text, "Sony XM6 & co");        // dua run + entity digabung
assert.equal(demo[1][1].text, "4,999,000");            // numFmt bawaan #,##0
assert.deepEqual(demo[1][2].links, ["https://s.shopee.co.id/abc"]);
assert.equal(demo[2][0].text, "Bose");                 // inlineStr
assert.equal(demo[2][1].text, "Rp2,499,000");          // numFmt kustom [$Rp]#,##0
assert.equal(demo[0][2].text, "Shopee");

console.log("ok");
