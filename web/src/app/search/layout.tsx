
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Parts & Marinas | YachtDrop",
  description:
    "Search for boat parts, marine supplies, and nearby marinas. Instant results with real-time suggestions.",
  openGraph: {
    title: "Search Parts & Marinas | YachtDrop",
    description:
      "Search for boat parts, marine supplies, and nearby marinas. Instant results.",
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
