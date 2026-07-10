import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/** First-load placeholder shown before the first /api/state response lands. */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-4 p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex-row items-center gap-3 p-3">
            <Skeleton className="size-13 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="gap-3 p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-2.5 w-12" />
              </div>
            </div>
            <Skeleton className="h-4 w-14 rounded-md" />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="min-h-40 gap-3 p-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </Card>
          ))}
        </div>
        <Card className="gap-3 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="size-6 rounded-md" />
              <Skeleton className="h-3 flex-1" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
