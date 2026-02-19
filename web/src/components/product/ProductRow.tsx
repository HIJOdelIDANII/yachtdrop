/**
 * ProductRow — Uber Eats-style horizontal scrollable product carousel.
 *
 * DESIGN DECISIONS:
 * - Used on the home page for curated sections (Trending, Best Offers).
 *   Horizontal scroll signals "there’s more" and encourages exploration
 *   without consuming full viewport height like a grid would.
 * - Each card is 140px wide. On a 375px iPhone screen this shows ~2.5 cards,
 *   which visually hints that scrolling is possible (partial card = affordance).
 * - no-scrollbar CSS hides the scrollbar for cleaner mobile UX while
 *   preserving swipe/scroll functionality.
 * - RowCard uses motion.div with x-axis entrance (slides from right) to match
 *   the horizontal scroll direction — feels natural and directional.
 * - Stagger delay is capped at 0.4s so off-screen cards don’t wait forever.
 * - The `badge` render prop allows parent to customize overlay text per card
 *   (e.g. "-30%" for offers, or "New" for recently added).
 * - Section auto-hides if products array is empty/undefined, preventing
 *   an awkward empty section on the page.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils/price";
import { ArrowRight } from "lucide-react";
import { useProductCardActions } from "@/lib/hooks/useProductCardActions";
import { FloatingAddButton } from "./FloatingAddButton";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { memo, type ReactNode } from "react";

interface ProductRowProps {
  title: string;
  icon?: ReactNode;
  products: Product[] | undefined;
  isLoading: boolean;
  badge?: (product: Product) => string | null;
  seeAllHref?: string;
}

export function ProductRow({
  title,
  icon,
  products,
  isLoading,
  badge,
  seeAllHref,
}: ProductRowProps) {
  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between px-3">
        <h2 className="flex items-center gap-1.5 text-base font-bold text-foreground">
          {icon}
          {title}
        </h2>
        {seeAllHref && products && products.length > 0 && (
          <Link
            href={seeAllHref}
            className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground active:text-foreground transition-colors"
          >
            See all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-3 pb-1">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[140px] shrink-0">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <div className="space-y-1 pt-2">
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))
          : products?.map((product, i) => (
              <RowCard key={product.id} product={product} badge={badge} index={i} />
            ))}
      </div>
    </section>
  );
}

/**
 * RowCard — individual card inside the horizontal scroll.
 * Smaller than ProductCard (140px vs grid column) to fit the carousel.
 * memo() prevents re-renders when sibling cards change state.
 * Floating + button matches ProductCard pattern for consistency.
 */

interface RowCardProps {
  product: Product;
  badge?: (product: Product) => string | null;
  index: number;
}

const RowCard = memo(function RowCard({ product, badge, index }: RowCardProps) {
  const { added, handleAdd, handleOpen } = useProductCardActions(product);
  const badgeText = badge?.(product);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.4), ease: "easeOut" }}
      className="w-[140px] shrink-0 cursor-pointer active:scale-[0.97] transition-transform duration-100"
      onClick={handleOpen}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            loading={index < 3 ? "eager" : "lazy"}
            className="object-cover"
            sizes="140px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
            No image
          </div>
        )}

        {/* Badge — e.g. "-30%" for offers */}
        {badgeText && (
          <span className="absolute top-1.5 left-1.5 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {badgeText}
          </span>
        )}

        <FloatingAddButton
          added={added}
          size="sm"
          onClick={handleAdd}
          label={`Add ${product.name} to cart`}
        />
      </div>

      <div className="px-0.5 pt-1.5">
        <h3 className="line-clamp-2 text-[12px] font-medium leading-snug text-foreground">
          {product.name}
        </h3>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className="text-[12px] font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[10px] text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});
