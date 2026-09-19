"use client";

import { SHEET_URL } from "@/lib/sheet";

// Seluruh isi situs bergantung pada satu file di Google Sheets. Kalau Google sedang
// bermasalah atau format export-nya berubah, tunjukkan jalan keluar, bukan stack trace.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page">
      <h1>Datanya lagi tidak bisa diambil</h1>
      <p className="empty">
        Google Sheets tidak merespons seperti biasanya. Coba sebentar lagi, atau{" "}
        <a href={SHEET_URL} target="_blank" rel="noreferrer">buka sheet aslinya</a>.
      </p>
      <p><button className="close" style={{ width: "auto", padding: "8px 16px" }} onClick={reset}>Coba lagi</button></p>
    </main>
  );
}
