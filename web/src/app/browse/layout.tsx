import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Marine Supplies | YachtDrop",
  description:
    "Browse thousands of marine parts and chandlery supplies. Filter by category, price, and availability. Fast delivery to your marina.",
  openGraph: {
    title: "Browse Marine Supplies | YachtDrop",
    description:
      "Browse thousands of marine parts and chandlery supplies. Filter by category, price, and availability.",
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
