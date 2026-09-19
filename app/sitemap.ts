import type { MetadataRoute } from "next";
import { SITE_URL, TABS } from "@/lib/sheet";

export default function sitemap(): MetadataRoute.Sitemap {
  return TABS.map((t, i) => ({
    url: `${SITE_URL}/${t.slug}`,
    changeFrequency: "daily" as const,
    priority: i === 0 ? 1 : 0.8,
  }));
}
