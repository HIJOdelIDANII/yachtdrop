import { useFilterStore } from "@/store/filter.store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/types";

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilterSheet({ open, onOpenChange }: FilterSheetProps) {
  const {
    minPrice,
    maxPrice,
    stockOnly,
    discountOnly,
    sortBy,
    selectedCategories,
    setMinPrice,
    setMaxPrice,
    setStockOnly,
    setDiscountOnly,
    setSortBy,
    toggleCategory,
    resetFilters,
  } = useFilterStore();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleReset = () => {
    resetFilters();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-t border-border bg-card px-4 pb-6"
        style={{
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">Filters</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Sort By */}
          <div className="space-y-2">
            <Label htmlFor="sort" className="text-sm font-semibold">
              Sort by
            </Label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger id="sort" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="availability">In Stock First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-border" />

          {/* Categories */}
          {categories.length > 0 && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Categories</Label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.slice(0, 8).map((category) => {
                    const isSelected = selectedCategories.includes(category.id);
                    return (
                      <div
                        key={category.id}
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => toggleCategory(category.id)}
                        onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleCategory(category.id); } }}
                        className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors min-h-[44px] ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <Checkbox checked={isSelected} tabIndex={-1} className="pointer-events-none" />
                        <span className="text-xs font-medium truncate">{category.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-border" />
            </>
          )}

          {/* Price Range */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Price Range</Label>
            <div className="space-y-3">
              <Slider
                min={0}
                max={10000}
                step={10}
                value={[minPrice]}
                onValueChange={([value]) => setMinPrice(value)}
                className="w-full"
              />
              <Slider
                min={0}
                max={10000}
                step={10}
                value={[maxPrice]}
                onValueChange={([value]) => setMaxPrice(value)}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>€ {minPrice}</span>
                <span>€ {maxPrice}</span>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Stock Status */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Availability</Label>
            <div
              role="checkbox"
              aria-checked={stockOnly}
              tabIndex={0}
              onClick={() => setStockOnly(!stockOnly)}
              onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setStockOnly(!stockOnly); } }}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors min-h-[44px] ${
                stockOnly ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
              }`}
            >
              <Checkbox checked={stockOnly} tabIndex={-1} className="pointer-events-none" />
              <span className="text-sm font-medium">In Stock Only</span>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Discount Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Offers</Label>
            <div
              role="checkbox"
              aria-checked={discountOnly}
              tabIndex={0}
              onClick={() => setDiscountOnly(!discountOnly)}
              onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setDiscountOnly(!discountOnly); } }}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors min-h-[44px] ${
                discountOnly ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
              }`}
            >
              <Checkbox checked={discountOnly} tabIndex={-1} className="pointer-events-none" />
              <span className="text-sm font-medium">Discounted Items</span>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <Button
          onClick={handleClose}
          className="mt-8 w-full h-11 rounded-lg bg-primary hover:bg-primary/90"
        >
          Apply Filters
        </Button>
      </SheetContent>
    </Sheet>
  );
}
