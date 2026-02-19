"use client";

import { useState, useCallback } from "react";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import type { Product } from "@/types";

export function useProductCardActions(product: Product) {
  const addItem = useCartStore((s) => s.addItem);
  const openSheet = useUIStore((s) => s.openSheet);
  const [added, setAdded] = useState(false);

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      addItem(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 600);
    },
    [addItem, product]
  );

  const handleOpen = useCallback(() => {
    openSheet("product", product.id);
  }, [openSheet, product.id]);

  return { added, handleAdd, handleOpen };
}
