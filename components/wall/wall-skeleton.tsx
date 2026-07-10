import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/** First-load placeholder shown before the first /api/state response lands. */
export function WallSkeleton() {
  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-5 p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="flex-row items-center gap-4 p-4">
            <Skeleton className="size-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="gap-3 p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-2.5 w-12" />
              </div>
              <Skeleton className="size-11 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}
