import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
      <div className="space-y-1.5 px-1 pt-2">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
    </div>
  );
}
