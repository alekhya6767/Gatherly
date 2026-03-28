import { SiteHeader } from "@/components/shared/site-header";
import { Card } from "@/components/ui/card";
import { JoinPlanForm } from "@/features/plans/components/join-plan-form";

export default function JoinPlanPage() {
  return (
    <div className="page-wrapper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <Card className="p-6">
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Join a plan
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter an invite code to open a shared plan. In local demo mode,
              invite codes only work for plans created in this browser.
            </p>
          </div>
          <div className="mt-6">
            <JoinPlanForm />
          </div>
        </Card>
      </main>
    </div>
  );
}
