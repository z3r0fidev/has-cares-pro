import { Skeleton } from "@/components/ui/skeleton";

export function ProviderCardSkeleton() {
  return (
    <li className="bg-white border border-slate-200 rounded-xl p-5 flex gap-5">
      {/* Zone 1: Avatar */}
      <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />

      {/* Zone 2 + 3 */}
      <div className="flex-grow flex flex-col md:flex-row gap-4">
        {/* Zone 2: Info */}
        <div className="flex-grow space-y-2">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>

        {/* Zone 3: Slots */}
        <div className="flex-shrink-0 w-full md:w-52 space-y-2">
          <Skeleton className="h-5 w-32 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20 rounded" />
            <div className="flex gap-1.5">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-20 rounded" />
            <div className="flex gap-1.5">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export function ProviderListSkeleton() {
  return (
    <ul className="space-y-4" aria-label="Loading providers" aria-busy="true">
      <ProviderCardSkeleton />
      <ProviderCardSkeleton />
      <ProviderCardSkeleton />
    </ul>
  );
}
