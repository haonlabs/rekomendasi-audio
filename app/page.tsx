import Link from "next/link";
import { tierColor } from "@/lib/parse";
import { SHEET_URL, TABS } from "@/lib/sheet";

// Contoh peringkat buat legenda warna; diambil dari rank yang betulan dipakai di sheet.
const LEGEND = ["SSS", "S+++++", "S", "A++", "A", "B+", "C", "D", "F", "-"];

export default function Home() {
  return (
    <main className="page">
      <header className="masthead">
        <p className="source">
          Dari <a href={SHEET_URL} target="_blank" rel="noreferrer">Kitab Audio Fernanda Gunsan</a>
        </p>
        <h1>Tier list Kitab Audio</h1>
        <p className="lede">
          Peringkat {TABS.length} kategori audio — dari eartips sampai soundbar — beserta harga,
          catatan, dan link belanjanya. Semua datanya ditarik langsung dari spreadsheet milik
          Fernanda Gunsan, jadi yang kamu lihat di sini selalu sama dengan yang ada di sana.
        </p>
      </header>

      <section>
        <h2 className="sec">Cara bacanya</h2>
        <ol className="steps">
          <li>
            <strong>Urutan dibaca dari atas ke bawah.</strong> Makin banyak tanda <code>+</code> makin
            tinggi, makin banyak <code>-</code> makin rendah. Jadi <code>A++</code> ada di antara
            <code> S</code> dan <code>A</code>, bukan di bawah <code>D</code>. Warnanya ikut urutan itu.
          </li>
          <li><strong>Klik kartu barangnya</strong> untuk melihat harga, review lengkap, dan link ke Shopee atau Tiktok.</li>
          <li><strong>Pakai kolom cari</strong> kalau sudah tahu mau apa. Beberapa kategori juga punya filter tambahan.</li>
          <li><strong>Link bisa dibagikan.</strong> Alamat yang muncul saat kamu membuka satu barang bisa langsung dikirim ke orang lain.</li>
        </ol>
        <ul className="legend" aria-label="Contoh urutan peringkat">
          {LEGEND.map((rank) => (
            <li key={rank} style={{ "--tier": tierColor(rank) } as React.CSSProperties}>{rank}</li>
          ))}
        </ul>
        <p className="empty">
          Peringkatnya subjektif dan memang begitu maksudnya — ini selera dan pengalaman satu orang,
          bukan hasil pengukuran. Pakai sebagai titik awal, bukan vonis.
        </p>
      </section>

      <section>
        <h2 className="sec">Pilih kategori</h2>
        <ul className="cats">
          {TABS.map((t) => (
            <li key={t.slug}><Link href={`/${t.slug}`}>{t.name}</Link></li>
          ))}
        </ul>
      </section>

      <footer className="footer">
        Data diperbarui otomatis setiap 5 menit dari{" "}
        <a href={SHEET_URL} target="_blank" rel="noreferrer">sheet aslinya</a>.
        Semua data dan review milik Fernanda Gunsan.
      </footer>
    </main>
  );
}
