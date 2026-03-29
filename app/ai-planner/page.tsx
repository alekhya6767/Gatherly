import { SiteHeader } from "@/components/shared/site-header";
import { AIPlannerPanel } from "@/features/ai-planner/components/ai-planner-panel";

export default function AIPlannerPage() {
  return (
    <div className="page-wrapper">
      <SiteHeader />
      <main className="relative mx-auto w-full max-w-4xl px-4 py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,oklch(0.68_0.15_200/0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.68_0.15_200/0.2),transparent_70%)]" />
        <div className="space-y-6 animate-fade-in">
          <header className="space-y-2 animate-fade-up">
            <h1 className="font-heading text-2xl font-semibold tracking-tight gradient-text">
              AI Planner
            </h1>
            <p className="text-sm text-muted-foreground">
              Generate a suggested outing plan based on your preferences and the
              current event catalog.
            </p>
          </header>

          <div className="animate-fade-up animate-delay-100">
            <AIPlannerPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
