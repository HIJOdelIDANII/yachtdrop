/**
 * ProductSheet — Bottom sheet showing full product details.
 *
 * DESIGN DECISIONS:
 * - Opens as a BottomSheet (not a new page) to keep context. User can see the
 *   grid behind the overlay, making it easy to dismiss and continue browsing.
 *   This is the Uber Eats item detail pattern.
 * - Horizontal snap-scrolling image gallery using CSS snap-x + snap-mandatory.
 *   Previously only product.thumbnail was shown and product.images[] (3-5 photos)
 *   was completely unused. Now all images are displayed in a swipeable carousel.
 * - Gallery cards are 85% viewport width when there are multiple images, showing
 *   a peek of the next image as an affordance to scroll. Single image = 100%.
 * - Dot indicators below the gallery (static, first highlighted). A scroll-aware
 *   active dot would require IntersectionObserver per image — not worth the
 *   complexity for a hackathon MVP.
 * - Stock status uses a small colored dot (2x2) instead of a Badge component.
 *   More subtle, Uber Eats-like, and doesn't compete with the price visually.
 * - Description renders as plain text (not dangerouslySetInnerHTML) to prevent
 *   XSS. The scraper's clean.py already strips HTML tags.
 * - shortDesc is preferred over full description when available (it's more
 *   concise and display-friendly).
 * - Quantity stepper uses CSS active:bg-muted for tap feedback instead of
 *   framer-motion whileTap. Simpler and lighter in a bottom sheet context.
 * - CTA shows dynamic total (price * quantity) so user sees exactly what
 *   they're adding. Disabled state for OUT_OF_STOCK prevents dead taps.
 */
"use client";

import Image from "next/image";
import { useProduct } from "@/lib/hooks/useData";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils/price";
import { Minus, Plus } from "lucide-react";
import { useState, useRef } from "react";

const STOCK_LABEL: Record<string, { text: string; color: string }> = {
  IN_STOCK: { text: "In Stock", color: "bg-green-500" },
  LOW_STOCK: { text: "Low Stock", color: "bg-amber-500" },
  OUT_OF_STOCK: { text: "Out of Stock", color: "bg-red-500" },
  ON_DEMAND: { text: "On Demand", color: "bg-blue-500" },
};

export function ProductSheet() {
  const activeSheet = useUIStore((s) => s.activeSheet);
  const selectedProductId = useUIStore((s) => s.selectedProductId);
  const closeSheet = useUIStore((s) => s.closeSheet);
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: product, isLoading } = useProduct(
    activeSheet === "product" ? selectedProductId : null
  );

  const open = activeSheet === "product";

  const handleAdd = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addItem(product);
    setQuantity(1);
    closeSheet();
  };

  const images = product?.images?.length ? product.images : product?.thumbnail ? [product.thumbnail] : [];
  const stock = product?.stockStatus ? STOCK_LABEL[product.stockStatus] : null;
  const hasDiscount = product?.originalPrice && product.originalPrice > (product?.price ?? 0);

  return (
    <BottomSheet open={open} onClose={closeSheet}>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : product ? (
        <div className="space-y-3">
          {/* Horizontal scrollable image gallery */}
          {images.length > 0 && (
            <div
              ref={scrollRef}
              className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4"
            >
              {images.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-[4/3] w-full shrink-0 snap-center overflow-hidden rounded-xl bg-muted"
                  style={{ minWidth: images.length > 1 ? "85%" : "100%" }}
                >
                  <Image
                    src={src}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    className="object-contain"
                    sizes="85vw"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Image dots indicator */}
          {images.length > 1 && (
            <div className="flex justify-center gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === 0 ? "w-4 bg-foreground" : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Name + stock */}
          <div>
            <h2 className="text-lg font-bold leading-tight text-foreground">
              {product.name}
            </h2>
            {stock && (
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${stock.color}`} />
                <span className="text-xs text-muted-foreground">{stock.text}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {hasDiscount && product.discountPercent && (
              <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-xs font-bold text-red-500">
                -{product.discountPercent}%
              </span>
            )}
          </div>

          {/* Description */}
          {(product.shortDesc || product.description) && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.shortDesc || product.description}
            </p>
          )}

          {/* Quantity + Add to Cart — sticky feel */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center rounded-full border border-border">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center text-foreground active:bg-muted rounded-l-full transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-foreground">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center text-foreground active:bg-muted rounded-r-full transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              className="min-h-[44px] flex-1 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-sm font-semibold active:scale-[0.98] transition-transform"
              onClick={handleAdd}
              disabled={product.stockStatus === "OUT_OF_STOCK"}
            >
              Add to Cart — {formatPrice(product.price * quantity)}
            </Button>
          </div>
        </div>
      ) : null}
    </BottomSheet>
  );
}
