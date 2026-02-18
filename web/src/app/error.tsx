"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LifeBuoy } from "lucide-react";
import { motion } from "framer-motion";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <LifeBuoy className="h-16 w-16 text-[var(--color-ocean)]" />
      </motion.div>
      <h2 className="text-xl font-bold text-foreground">
        Something went wrong
      </h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <Button
        onClick={reset}
        className="min-h-[44px] bg-[var(--color-ocean)] text-white hover:bg-[var(--color-ocean)]/90"
      >
        Try again
      </Button>
    </div>
  );
}
