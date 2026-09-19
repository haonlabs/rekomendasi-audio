"use client";

import { useEffect, useRef, useState } from "react";
import { tierColor, type Board, type Item } from "@/lib/parse";

export default function TierBoard({ board }: { board: Board }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [open, setOpen] = useState<Item | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const q = query.trim().toLowerCase();
  const matches = (i: Item) =>
    (!tag || i.tags.includes(tag)) &&
    (!q || [i.name, i.subtitle, ...i.fields.map((f) => f.text)].join(" ").toLowerCase().includes(q));
  const tiers = board.tiers.map((t) => ({ ...t, items: t.items.filter(matches) })).filter((t) => t.items.length);

  // Dialog ikut URL (?item=<nomor baris sheet>) supaya satu barang bisa dibagikan
  // lewat link, dan tombol Back menutup dialog alih-alih keluar dari halaman.
  const pushed = useRef(false);
  useEffect(() => {
    const byId = new Map(board.tiers.flatMap((t) => t.items).map((i) => [i.id, i]));
    const sync = () => {
      const item = byId.get(new URLSearchParams(location.search).get("item") ?? "") ?? null;
      setOpen(item);
      if (item) dialog.current?.showModal();
      else { pushed.current = false; dialog.current?.close(); }
    };
    sync();
    addEventListener("popstate", sync);
    return () => removeEventListener("popstate", sync);
  }, [board]);

  const show = (item: Item) => {
    history.pushState(null, "", `?item=${item.id}`);
    pushed.current = true;
    setOpen(item);
    dialog.current?.showModal();
  };
  const hide = () => {
    if (pushed.current) return history.back(); // popstate yang menutup dialognya
    history.replaceState(null, "", location.pathname); // dibuka langsung dari link
    dialog.current?.close();
  };

  return (
    <>
      {board.notes.length > 0 && (
        <blockquote className="notes">
          {board.notes.map((n, i) => <p key={i}>{n}</p>)}
        </blockquote>
      )}

      <div className="toolbar">
        <input
          type="search"
          placeholder="Cari nama atau karakter suara"
          aria-label="Cari"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {board.tags.length > 1 && (
          <div className="filters" role="group" aria-label="Dipakai di">
            {["", ...board.tags].map((t) => (
              <button key={t || "all"} aria-pressed={tag === t} onClick={() => setTag(t)}>
                {t || "Semua"}
              </button>
            ))}
          </div>
        )}
      </div>

      {tiers.length === 0 ? (
        <p className="empty">Tidak ada yang cocok dengan pencarian ini. Coba kata lain atau pilih Semua.</p>
      ) : (
        <div className="board">
          {tiers.map((t) => (
            <section key={t.rank} className="tier" style={{ "--tier": tierColor(t.rank), "--len": t.rank.length } as React.CSSProperties}>
              {t.rank && <h2 className="tier-label" aria-label={`Tier ${t.rank}`}>{t.rank}</h2>}
              <ul className="tier-items">
                {t.items.map((item) => (
                  <li key={item.id}>
                    <button className="tile" onClick={() => show(item)}>
                      <span className="tile-name">{item.name}</span>
                      {item.price && <span className="tile-meta">{item.price}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <dialog
        ref={dialog}
        className="detail"
        aria-label="Detail barang"
        onClose={() => setOpen(null)}
        onCancel={(e) => { e.preventDefault(); hide(); }}
        onClick={(e) => e.target === dialog.current && hide()}
      >
        {open && (
          <article style={{ "--tier": tierColor(open.rank), "--len": open.rank.length } as React.CSSProperties}>
            <header>
              {open.rank && <span className="detail-rank">{open.rank}</span>}
              <div>
                <h3>{open.name}</h3>
                {open.subtitle && <p className="detail-sub">{open.subtitle}</p>}
              </div>
              <button className="close" onClick={hide} aria-label="Tutup">✕</button>
            </header>
            <dl>
              {open.fields.map((f, i) => (
                <div key={i}>
                  <dt>{f.label}</dt>
                  <dd>
                    {f.links.length === 1 ? (
                      <a href={f.links[0]} target="_blank" rel="noreferrer">{f.text || "Buka link"}</a>
                    ) : (
                      <>
                        {f.text}
                        {f.links.map((l, j) => (
                          <a key={l} className="extra-link" href={l} target="_blank" rel="noreferrer">Link {j + 1}</a>
                        ))}
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        )}
      </dialog>
    </>
  );
}
