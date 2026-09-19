import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoard, SHEET_URL, TABS } from "@/lib/sheet";
import TierBoard from "@/components/TierBoard";

// Halaman di-cache lalu diambil ulang dari Google Sheets tiap 5 menit (ISR).
// Kalau Google sedang error, versi terakhir yang berhasil tetap ditampilkan.
export const revalidate = 300;

// Semua tab diprerender saat build. Unduhan workbook dari Google makan 15-18 detik,
// jadi jangan sampai ada pengunjung yang menanggungnya: setelah ini ISR menyajikan
// versi lama sambil regenerasi di latar belakang.
export function generateStaticParams() {
  return TABS.map((t) => ({ slug: t.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tab = TABS.find((t) => t.slug === slug);
  if (!tab) return { title: "Tier list" };

  const board = await getBoard(tab.name); // workbook-nya sudah di-memo, jadi tidak diunduh dua kali
  const title = heading(tab.name, board);
  const count = board?.tiers.reduce((n, t) => n + t.items.length, 0) ?? 0;
  const description = `${count} ${tab.name} diperingkat oleh Fernanda Gunsan, lengkap dengan harga, catatan, dan link belanja.`;

  return { title, description, openGraph: { title, description, url: `/${slug}` }, alternates: { canonical: `/${slug}` } };
}

/** Tab tanpa peringkat (DAP, Charger) bukan tier list, jadi jangan diberi judul begitu. */
function heading(name: string, board: Awaited<ReturnType<typeof getBoard>>) {
  return board?.tiers.some((t) => t.rank) ? `Tier list ${name}` : name;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const tab = TABS.find((t) => t.slug === slug);
  if (!tab) notFound();

  // Tab yang sedang dibuka digeser ke paling kiri biar langsung kelihatan; sisanya
  // tetap urutan asli (Array.sort stabil), jadi begitu pindah tab ia balik ke tempatnya.
  const tabs = [...TABS].sort((a, b) => Number(b.slug === slug) - Number(a.slug === slug));

  const board = await getBoard(tab.name);
  const updated = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short",
  });

  return (
    <main className="page">
      <header className="masthead">
        <p className="source">
          Dari <a href={SHEET_URL} target="_blank" rel="noreferrer">Kitab Audio Fernanda Gunsan</a>
        </p>
        <h1>{heading(tab.name, board)}</h1>
      </header>

      <nav className="tabs" aria-label="Kategori">
        {tabs.map((t) => (
          <Link key={t.slug} href={`/${t.slug}`} aria-current={t.slug === slug ? "page" : undefined}>
            {t.name}
          </Link>
        ))}
      </nav>

      {board ? (
        <TierBoard board={board} />
      ) : (
        <p className="empty">
          Tab {tab.name} belum berbentuk tier list karena tidak ada kolom Rank.{" "}
          <a href={SHEET_URL} target="_blank" rel="noreferrer">Buka sheet-nya</a> untuk melihat isinya.
        </p>
      )}

      <footer className="footer">
        Data diambil {updated} WIB dan diperbarui otomatis setiap 5 menit. Semua review milik Fernanda Gunsan.
      </footer>
    </main>
  );
}
