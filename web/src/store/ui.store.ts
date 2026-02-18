import { create } from "zustand";

type SheetType = "product" | "cart" | "checkout" | null;

interface UIState {
  activeSheet: SheetType;
  selectedProductId: string | null;
  openSheet: (type: SheetType, productId?: string) => void;
  closeSheet: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeSheet: null,
  selectedProductId: null,
  openSheet: (type, productId) =>
    set({ activeSheet: type, selectedProductId: productId ?? null }),
  closeSheet: () => set({ activeSheet: null, selectedProductId: null }),
}));
