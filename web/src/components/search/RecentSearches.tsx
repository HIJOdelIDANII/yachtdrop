"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecentSearchesProps {
  searches: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClearAll: () => void;
}

export function RecentSearches({
  searches,
  onSelect,
  onRemove,
  onClearAll,
}: RecentSearchesProps) {
  if (searches.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recent searches
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
          onClick={onClearAll}
        >
          <Trash2 className="h-3 w-3" />
          Clear all
        </Button>
      </div>

      <AnimatePresence>
        <div className="flex flex-wrap gap-2">
          {searches.map((query) => (
            <motion.div
              key={query}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.12 }}
              className="group flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted/50"
            >
              <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
              <button
                className="truncate max-w-[120px] text-foreground"
                onClick={() => onSelect(query)}
              >
                {query}
              </button>
              <button
                className="ml-0.5 shrink-0 rounded-full p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(query);
                }}
                aria-label={`Remove "${query}" from recent searches`}
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </motion.div>
  );
}
