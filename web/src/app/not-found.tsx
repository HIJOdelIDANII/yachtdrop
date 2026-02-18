import { Button } from "@/components/ui/button";
import { Anchor } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Anchor className="h-12 w-12 text-gray-300" />
      <h2 className="text-lg font-semibold text-[var(--color-navy)]">
        Page not found
      </h2>
      <p className="text-sm text-gray-500">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/">
        <Button className="bg-[var(--color-ocean)] text-white hover:bg-[var(--color-ocean)]/90">
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
