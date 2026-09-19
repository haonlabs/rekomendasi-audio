import { redirect } from "next/navigation";
import { TABS } from "@/lib/sheet";

export default function Home() {
  redirect(`/${TABS[0].slug}`);
}
