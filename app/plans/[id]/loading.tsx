import { SiteHeader } from "@/components/shared/site-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingPlanDetails() {
  return (
    <div className="page-wrapper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Card className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          </Card>
          <Card className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </main>
    </div>
  );
}
