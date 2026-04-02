"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AIPlanResponse } from "@/lib/ai/schemas";

type ApiSuccess = { ok: true; provider: string; plan: AIPlanResponse };

type ApiFailure = { ok: false; error: string; provider?: string };

async function generate(payload: {
  city: string;
  date: string;
  budget: number;
  interests: string[];
  groupSize: number;
  vibe: string;
}) {
  const res = await fetch("/api/ai/plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => null)) as ApiSuccess | ApiFailure | null;
  if (!res.ok || !data || data.ok === false) {
    throw new Error((data as ApiFailure | null)?.error ?? "Generation failed");
  }

  return data;
}

async function fetchPlans() {
  const res = await fetch("/api/plans", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load plans");
  return (await res.json()) as { plans: { id: string; title: string }[] };
}

async function createPlanFromAI(input: {
  title: string;
  description: string;
  city: string;
  planDate: string;
  budget: number;
  vibe: string;
}) {
  const res = await fetch("/api/plans", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await res.json().catch(() => null)) as
    | { ok: true; plan: { id: string } }
    | { ok: false; error?: string }
    | null;

  if (!res.ok || !data || data.ok === false) {
    throw new Error((data as { error?: string } | null)?.error ?? "Failed to create plan");
  }

  return data.plan.id;
}

async function addPlanEvent(planId: string, eventSlug: string) {
  const res = await fetch(`/api/plans/${planId}/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventSlug }),
  });

  if (!res.ok) throw new Error("Failed to add event");
}

export function AIPlannerPanel() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ApiSuccess | null>(null);

  const [plans, setPlans] = React.useState<{ id: string; title: string }[]>([]);
  const [plansError, setPlansError] = React.useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string>("new");

  // Track city value via ref so Save to plan can read it without DOM hacks
  const cityRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    let active = true;
    fetchPlans()
      .then((d) => {
        if (!active) return;
        setPlans(d.plans);
      })
      .catch((e) => {
        if (!active) return;
        setPlansError(e instanceof Error ? e.message : "Failed");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid gap-4">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">AI Planner</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Generates a structured outing plan grounded in the current event
              catalog. If no API key is configured, it uses a deterministic mock.
            </p>
          </div>
          <Badge variant="secondary">Progressive</Badge>
        </div>

        <form
          className="mt-6 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setResult(null);

            const fd = new FormData(e.currentTarget);
            const interestsRaw = String(fd.get("interests") ?? "");

            const payload = {
              city: String(fd.get("city") ?? "").trim(),
              date: String(fd.get("date") ?? "").trim(),
              budget: Number(fd.get("budget") ?? 75),
              interests: interestsRaw
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 8),
              groupSize: Number(fd.get("groupSize") ?? 2),
              vibe: String(fd.get("vibe") ?? "mixed"),
            };

            startTransition(async () => {
              try {
                setStatus("Scanning the catalog…");
                await new Promise((r) => setTimeout(r, 250));
                setStatus("Selecting options…");
                await new Promise((r) => setTimeout(r, 250));
                setStatus("Building itinerary…");

                const data = await generate(payload);
                setResult(data);
                setStatus(null);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
                setStatus(null);
              }
            });
          }}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" placeholder="San Jose" required defaultValue="San Jose" ref={cityRef} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date / window</Label>
              <Input id="date" name="date" placeholder="This weekend" required defaultValue="This weekend" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget">Budget (total)</Label>
              <Input id="budget" name="budget" type="number" min={0} defaultValue={150} required />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="groupSize">Group size</Label>
              <Input id="groupSize" name="groupSize" type="number" min={1} max={20} defaultValue={2} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vibe">Vibe</Label>
              <Select name="vibe" defaultValue="mixed">
                <SelectTrigger id="vibe">
                  <SelectValue placeholder="Vibe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="chill">Chill</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="artsy">Artsy</SelectItem>
                  <SelectItem value="foodie">Foodie</SelectItem>
                  <SelectItem value="nightlife">Nightlife</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target">Save to</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger id="target">
                  <SelectValue placeholder="Save target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New plan</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="interests">Interests (comma-separated)</Label>
            <Textarea id="interests" name="interests" placeholder="jazz, ramen, museum" rows={2} />
          </div>

          {plansError ? (
            <p className="text-xs text-muted-foreground">{plansError}</p>
          ) : null}

          <div aria-live="polite">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" disabled={pending}>
              <Sparkles className="h-4 w-4" />
              Generate plan
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!result || pending}
              onClick={() => {
                if (!result) return;

                startTransition(async () => {
                  try {
                    setError(null);
                    setStatus("Saving…");

                    const planTitle = `AI: ${result.plan.summary.slice(0, 36)}${result.plan.summary.length > 36 ? "…" : ""}`;

                    const planId =
                      selectedPlanId === "new"
                        ? await createPlanFromAI({
                            title: planTitle,
                            description: result.plan.rationale,
                            city: cityRef.current?.value ?? "",
                            planDate: new Date().toISOString().slice(0, 10),
                            budget: result.plan.estimatedTotalCost,
                            vibe: "mixed",
                          })
                        : selectedPlanId;

                    for (const slug of result.plan.selectedEventSlugs) {
                      await addPlanEvent(planId, slug);
                    }

                    setStatus(null);
                    router.push(`/plans/${planId}`);
                    router.refresh();
                  } catch (err) {
                    setStatus(null);
                    setError(err instanceof Error ? err.message : "Failed to save");
                  }
                });
              }}
            >
              Save to plan
            </Button>
          </div>
        </form>
      </Card>

      {result ? (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Suggested outing</p>
              <p className="text-sm text-muted-foreground">
                Provider: {result.provider}
              </p>
            </div>
            <Badge variant="outline">Est. ${result.plan.estimatedTotalCost}</Badge>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">{result.plan.summary}</p>

          <div className="mt-4 grid gap-3">
            {result.plan.itinerary.map((b, idx) => (
              <div key={idx} className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {b.startTime}–{b.endTime}
                  </p>
                  {b.eventSlug ? (
                    <Badge variant="secondary">{b.eventSlug}</Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-sm">{b.title}</p>
                {b.notes ? (
                  <p className="mt-1 text-xs text-muted-foreground">{b.notes}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border bg-muted/30 p-4">
            <p className="text-sm font-medium">Rationale</p>
            <p className="mt-1 text-sm text-muted-foreground">{result.plan.rationale}</p>
          </div>

          {result.plan.backupOptions.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium">Backup options</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.plan.backupOptions.slice(0, 6).map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
