/**
 * Client-side product detail — mirrors ProductSheet layout but as a full page.
 * Includes back button, image gallery, pricing, and add-to-cart.
 */
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart.store";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils/price";
import { ArrowLeft, Minus, Plus, Share2, Package } from "lucide-react";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import type { Product } from "@/types";

const STOCK_LABEL: Record<string, { text: string; color: string }> = {
  IN_STOCK: { text: "In Stock", color: "bg-green-500" },
  LOW_STOCK: { text: "Low Stock", color: "bg-amber-500" },
  OUT_OF_STOCK: { text: "Out of Stock", color: "bg-red-500" },
  ON_DEMAND: { text: "On Demand", color: "bg-blue-500" },
};

interface ProductDetailProps {
  product: Product & { categoryName?: string };
}

export function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const images = product.images?.length
    ? product.images
    : product.thumbnail
      ? [product.thumbnail]
      : [];
  const stock = STOCK_LABEL[product.stockStatus];
  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;

  const handleGalleryScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveImageIndex(index);
  };

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) addItem(product);
    setQuantity(1);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.name, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-32"
    >
      {/* Floating top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 safe-top bg-background/80 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm border border-border"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={handleShare}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm border border-border"
          aria-label="Share product"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      {/* Image gallery */}
      {images.length > 0 ? (
        <div
          ref={scrollRef}
          onScroll={handleGalleryScroll}
          className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-4"
        >
          {images.map((src, i) => (
            <div
              key={i}
              className="relative aspect-[4/3] w-full shrink-0 snap-center overflow-hidden rounded-2xl bg-muted"
              style={{ minWidth: images.length > 1 ? "85%" : "100%" }}
            >
              <Image
                src={src}
                alt={`${product.name} ${i + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-4 flex aspect-[4/3] items-center justify-center rounded-2xl bg-muted">
          <Package className="h-16 w-16 text-muted-foreground/40" />
        </div>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1 pt-3">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === activeImageIndex
                  ? "w-4 bg-foreground"
                  : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      )}

      {/* Product info */}
      <div className="space-y-4 px-4 pt-4">
        {/* Category breadcrumb */}
        {product.categoryName && (
          <span className="text-xs font-medium text-ocean">
            {product.categoryName}
          </span>
        )}

        {/* Name + stock */}
        <div>
          <h1 className="text-xl font-bold leading-tight text-foreground">
            {product.name}
          </h1>
          {stock && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${stock.color}`} />
              <span className="text-xs text-muted-foreground">
                {stock.text}
              </span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">
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

        {/* SKU */}
        {product.externalId && (
          <p className="text-xs text-muted-foreground">
            SKU: {product.externalId}
          </p>
        )}

        {/* Description */}
        {(product.shortDesc || product.description) && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">
              Description
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.shortDesc || product.description}
            </p>
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 safe-bottom">
        <div className="flex items-center gap-3">
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
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
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
    </motion.div>
  );
}
