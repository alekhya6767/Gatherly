"use client";

import { SiteHeaderClient } from "@/components/shared/site-header-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PlansError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-wrapper">
      <SiteHeaderClient email={null} supabaseEnabled={false} />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <Card className="p-8">
          <div className="space-y-2">
            <p className="text-sm font-medium">Something went wrong</p>
            <p className="text-sm text-muted-foreground">
              {error.message || "Failed to load plans."}
            </p>
            <Button type="button" onClick={reset} className="mt-4">
              Try again
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
