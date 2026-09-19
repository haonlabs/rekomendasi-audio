import Link from "next/link";
import { tierColor } from "@/lib/parse";
import { getBoard, REVALIDATE_SECONDS, SHEET_URL, TABS } from "@/lib/sheet";

export const revalidate = 300;

// Tangga peringkat buat strip contoh; diambil dari rank yang betulan dipakai di sheet.
const SCALE = ["SSS", "S++", "S", "A+", "A", "B", "C", "D", "F"];

export default async function Home() {
  // Workbook-nya satu file untuk semua tab dan sudah di-memo, jadi menghitung isi
  // ke-21 tab di sini cuma menambah satu kali parse, bukan 21 kali unduh.
  const boards = await Promise.all(TABS.map(async (t) => {
    const board = await getBoard(t.name);
    return { ...t, board, count: board?.tiers.reduce((n, x) => n + x.items.length, 0) ?? 0 };
  }));
  const total = boards.reduce((n, b) => n + b.count, 0);

  // Contoh hidup: tier teratas dari kategori paling ramai, pakai komponen yang sama
  // persis dengan halaman tier list, supaya yang dilihat di sini bukan mock-up.
  const busiest = [...boards].sort((a, b) => b.count - a.count)[0];
  const tiers = busiest.board?.tiers ?? [];
  // Tier paling atas yang isinya cukup untuk dilihat; yang teratas kadang cuma satu barang.
  const top = tiers.find((t) => t.items.length >= 4) ?? tiers[0];

  return (
    <main className="page">
      <header className="hero">
        <p className="source">
          Dari <a href={SHEET_URL} target="_blank" rel="noreferrer">Kitab Audio Fernanda Gunsan</a>
        </p>
        <h1>Peringkat audio,<br />bukan tebak-tebakan.</h1>
        <p className="lede">
          {total.toLocaleString("id-ID")} barang di {TABS.length} kategori — dari eartips sampai
          soundbar — lengkap dengan harga, catatan panjang, dan link belanjanya. Semua ditarik
          langsung dari spreadsheet Fernanda Gunsan, jadi tidak pernah basi.
        </p>

        <dl className="stats">
          <div><dt>Kategori</dt><dd>{TABS.length}</dd></div>
          <div><dt>Barang diperingkat</dt><dd>{total.toLocaleString("id-ID")}</dd></div>
          <div><dt>Disegarkan tiap</dt><dd>{REVALIDATE_SECONDS / 60} menit</dd></div>
        </dl>

        <p className="cta">
          <Link className="btn btn-primary" href={`/${busiest.slug}`}>Mulai dari {busiest.name}</Link>
          <a className="btn" href="#kategori">Lihat semua kategori</a>
        </p>
      </header>

      {top && (
        <section className="sample">
          <h2 className="sec">Begini bentuknya</h2>
          <p className="sec-note">
            Tier {top.rank} kategori {busiest.name}, langsung dari sheet. Klik salah satunya
            untuk melihat isi detailnya.
          </p>
          <div className="board">
            <section className="tier" style={{ "--tier": tierColor(top.rank), "--len": top.rank.length } as React.CSSProperties}>
              <h3 className="tier-label" aria-label={`Tier ${top.rank}`}>{top.rank}</h3>
              <ul className="tier-items">
                {top.items.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <Link className="tile" href={`/${busiest.slug}?item=${item.id}`}>
                      <span className="tile-name">{item.name}</span>
                      {item.price && <span className="tile-meta">{item.price}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </section>
      )}

      <section>
        <h2 className="sec">Cara bacanya</h2>
        <div className="guide">
          <article>
            <h3>Urutan dibaca dari atas</h3>
            <p>
              Makin banyak <code>+</code> makin tinggi, makin banyak <code>-</code> makin rendah.
              Jadi <code>A++</code> duduk di antara <code>S</code> dan <code>A</code>, bukan di
              bawah <code>D</code>. Warnanya mengikuti urutan yang sama.
            </p>
            <ul className="scale" aria-label="Tangga peringkat dari tertinggi ke terendah">
              {SCALE.map((rank) => (
                <li key={rank} style={{ "--tier": tierColor(rank) } as React.CSSProperties}>{rank}</li>
              ))}
            </ul>
            <p className="scale-ends"><span>Tertinggi</span><span>Terendah</span></p>
          </article>
          <article>
            <h3>Kartunya bisa diklik</h3>
            <p>
              Di balik tiap kartu ada harga, review panjang dari Fernanda, dan link ke Shopee atau
              Tiktok kalau memang ada. Alamat yang muncul saat kartu terbuka bisa langsung dikirim
              ke orang lain — mereka akan mendarat tepat di barang itu.
            </p>
          </article>
          <article>
            <h3>Datanya hidup</h3>
            <p>
              Tidak ada yang disalin tangan. Begitu Fernanda mengubah isi spreadsheet-nya, situs
              ini ikut berubah paling lambat {REVALIDATE_SECONDS / 60} menit kemudian. Kalau ada
              yang terasa janggal, <a href={SHEET_URL} target="_blank" rel="noreferrer">sheet aslinya</a> selalu jadi acuan.
            </p>
          </article>
        </div>
        <p className="disclaimer">
          Peringkatnya subjektif, dan memang begitu maksudnya. Ini selera dan pengalaman satu orang
          yang sudah mendengarkan banyak, bukan hasil pengukuran laboratorium. Pakai sebagai titik
          awal, bukan vonis.
        </p>
      </section>

      <section id="kategori">
        <h2 className="sec">Pilih kategori</h2>
        <ul className="cats">
          {boards.map((t) => (
            <li key={t.slug}>
              <Link href={`/${t.slug}`}>
                <span className="cat-name">{t.name}</span>
                <span className="cat-count">{t.count} barang</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="footer">
        Semua data dan review milik Fernanda Gunsan.{" "}
        <a href={SHEET_URL} target="_blank" rel="noreferrer">Buka sheet aslinya</a>.
      </footer>
    </main>
  );
}
