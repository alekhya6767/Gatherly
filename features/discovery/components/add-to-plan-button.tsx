"use client";

import * as React from "react";
import { CalendarPlus, Check } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Plan = { id: string; title: string };

async function fetchPlans(): Promise<Plan[]> {
  const res = await fetch("/api/plans", { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { plans: Plan[] };
  return data.plans ?? [];
}

async function addEventToPlan(planId: string, eventSlug: string) {
  const res = await fetch(`/api/plans/${planId}/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventSlug }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Failed to add to plan");
  }
}

async function createPlan(input: { title: string; city: string; planDate: string }) {
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

export function AddToPlanButton({
  eventSlug,
  eventTitle,
  eventCity,
}: {
  eventSlug: string;
  eventTitle: string;
  eventCity: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string>("new");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let active = true;
    fetchPlans()
      .then((p) => {
        if (!active) return;
        setPlans(p);
        if (p.length > 0) setSelectedPlanId(p[0].id);
      })
      .catch(() => {
        if (!active) return;
        setPlans([]);
      });
    return () => {
      active = false;
    };
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary">
          <CalendarPlus className="h-4 w-4" />
          Add to plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to plan</DialogTitle>
          <DialogDescription>
            Add &quot;{eventTitle}&quot; to an existing plan, or create a new one.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);

            const fd = new FormData(e.currentTarget);
            const newTitle = String(fd.get("newTitle") ?? "").trim();
            const newDate = String(fd.get("newDate") ?? "").trim();

            startTransition(async () => {
              try {
                let planId = selectedPlanId;

                if (planId === "new") {
                  if (!newTitle) {
                    setError("Plan title is required");
                    return;
                  }
                  planId = await createPlan({
                    title: newTitle,
                    city: eventCity,
                    planDate: newDate || new Date().toISOString().slice(0, 10),
                  });
                }

                await addEventToPlan(planId, eventSlug);
                setSuccess(true);

                setTimeout(() => {
                  setOpen(false);
                  router.push(`/plans/${planId}`);
                  router.refresh();
                }, 600);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
              }
            });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="planTarget">Choose a plan</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger id="planTarget">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">+ New plan</SelectItem>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlanId === "new" ? (
            <div className="grid gap-3 rounded-xl border bg-muted/30 p-3">
              <div className="grid gap-2">
                <Label htmlFor="newTitle">New plan title</Label>
                <Input
                  id="newTitle"
                  name="newTitle"
                  placeholder={`Outing: ${eventTitle}`}
                  defaultValue={`Outing: ${eventTitle}`}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newDate">Date</Label>
                <Input id="newDate" name="newDate" type="date" />
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? (
            <p className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" /> Added — opening plan…
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add to plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
