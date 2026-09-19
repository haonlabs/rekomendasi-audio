import Link from "next/link";
import { TABS } from "@/lib/sheet";

export default function NotFound() {
  return (
    <main className="page">
      <h1>Halaman tidak ada</h1>
      <p className="empty">
        Kategori yang kamu cari tidak ada di sheet ini.{" "}
        <Link href={`/${TABS[0].slug}`}>Lihat tier list {TABS[0].name}</Link>.
      </p>
    </main>
  );
}
