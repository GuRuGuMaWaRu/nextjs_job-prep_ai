import { Skeleton } from "@/core/components/Skeleton";
import { Card, CardFooter, CardHeader } from "@/core/components/ui/card";

export function PlanCardSkeleton() {
  return (
    <Card className="relative">
      <CardHeader className="space-y-4 p-5">
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-full max-w-[200px]" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <Skeleton className="h-4 w-4 shrink-0 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </CardHeader>
      <CardFooter className="pt-0 px-5">
        <Skeleton className="h-11 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
}

export function PlanCardsSkeleton() {
  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <PlanCardSkeleton />
        <PlanCardSkeleton />
      </div>
      <Card className="max-w-4xl mx-auto bg-muted/30">
        <CardHeader className="space-y-4 p-5">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-full max-w-[240px]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 shrink-0 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </CardHeader>
        <CardFooter className="pt-0 px-5">
          <Skeleton className="h-11 w-full rounded-md" />
        </CardFooter>
      </Card>
    </section>
  );
}
