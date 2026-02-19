import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders | YachtDrop",
  description: "Track your marine supply orders and delivery status in real time.",
  openGraph: {
    title: "My Orders | YachtDrop",
    description: "Track your marine supply orders and delivery status.",
  },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
