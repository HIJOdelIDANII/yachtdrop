import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Navigation className="h-16 w-16 text-[var(--color-ocean)]" />
      <h2 className="text-xl font-bold text-foreground">
        Page not found
      </h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/">
        <Button className="min-h-[44px] bg-[var(--color-ocean)] text-white hover:bg-[var(--color-ocean)]/90">
          Go Home
        </Button>
      </Link>
    </div>
  );
}
