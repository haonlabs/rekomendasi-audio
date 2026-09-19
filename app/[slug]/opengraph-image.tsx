import { ImageResponse } from "next/og";
import { TABS } from "@/lib/sheet";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Tier list Kitab Audio";

// Preview link waktu dibagikan ke WA/IG/Twitter. Sengaja teks saja: tidak ada aset
// gambar di repo, dan yang perlu kebaca cuma kategorinya.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = TABS.find((t) => t.slug === slug)?.name ?? "Kitab Audio";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: 72, background: "#12141a", color: "#e9ecf2" }}>
        <div style={{ fontSize: 30, color: "#9aa3b2" }}>Kitab Audio · Fernanda Gunsan</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 40, color: "#9aa3b2" }}>Tier list</div>
          <div style={{ fontSize: 128, fontWeight: 700, lineHeight: 1.05 }}>{name}</div>
        </div>
        <div style={{ display: "flex", height: 18 }}>
          {["#ff3d6e", "#ff5a4e", "#ff9f40", "#ffe066", "#8fd694", "#6fb7e8", "#8e9cf0", "#b09cf0"].map((c) => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
