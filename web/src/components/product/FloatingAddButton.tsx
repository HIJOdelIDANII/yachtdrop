"use client";

import { Plus, Check } from "lucide-react";

interface FloatingAddButtonProps {
  added: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  onClick: (e: React.MouseEvent) => void;
  label: string;
}

export function FloatingAddButton({
  added,
  disabled = false,
  size = "md",
  onClick,
  label,
}: FloatingAddButtonProps) {
  const dim = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const iconDim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const pos = size === "sm" ? "bottom-1.5 right-1.5" : "bottom-2 right-2";

  return (
    <button
      className={`absolute ${pos} flex ${dim} items-center justify-center rounded-full shadow-${size === "sm" ? "md" : "lg"} transition-all duration-150 ${
        added
          ? "bg-green-500 text-white scale-110"
          : "bg-white text-foreground hover:bg-gray-50 active:scale-90 dark:bg-card dark:text-foreground"
      } ${disabled ? "opacity-40 pointer-events-none" : ""}`}
      onClick={onClick}
      aria-label={label}
    >
      {added ? (
        <Check className={iconDim} strokeWidth={3} />
      ) : (
        <Plus className={iconDim} strokeWidth={2.5} />
      )}
    </button>
  );
}
