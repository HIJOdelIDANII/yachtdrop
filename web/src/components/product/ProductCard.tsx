"use client";

import Image from "next/image";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openSheet = useUIStore((s) => s.openSheet);

  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;

  return (
    <div
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-[var(--color-border-brand)] bg-white shadow-sm transition-shadow hover:shadow-md"
      data-testid="product-card"
      onClick={() => openSheet("product", product.id)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No image
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && product.discountPercent && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            -{product.discountPercent}%
          </Badge>
        )}

        {/* Stock badge */}
        {product.stockStatus && product.stockStatus !== "IN_STOCK" && (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 text-xs"
          >
            {product.stockStatus === "LOW_STOCK"
              ? "Low stock"
              : "Out of stock"}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight text-[var(--color-text-primary)]">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--color-navy)]">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>

      {/* Quick-add button */}
      <div className="mt-auto px-3 pb-3">
        <Button
          size="sm"
          className="w-full bg-[var(--color-ocean)] text-white hover:bg-[var(--color-ocean)]/90"
          onClick={(e) => {
            e.stopPropagation();
            addItem(product);
          }}
          disabled={product.stockStatus === "OUT_OF_STOCK"}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}
