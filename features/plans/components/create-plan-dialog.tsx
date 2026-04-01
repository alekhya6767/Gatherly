"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreatePlanDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a plan</DialogTitle>
          <DialogDescription>
            Start with a title and a vibe. You can add events and vote together
            afterwards.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);

            const fd = new FormData(e.currentTarget);
            const payload = {
              title: String(fd.get("title") ?? "").trim(),
              description: String(fd.get("description") ?? "").trim(),
              city: String(fd.get("city") ?? "").trim(),
              planDate: String(fd.get("planDate") ?? "").trim(),
              budget: Number(fd.get("budget") ?? 75),
              vibe: String(fd.get("vibe") ?? "").trim(),
            };

            startTransition(async () => {
              try {
                const res = await fetch("/api/plans", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify(payload),
                });

                const data = (await res.json().catch(() => null)) as
                  | { ok: true; plan: { id: string } }
                  | { ok: false; error?: string }
                  | null;

                if (!res.ok || !data || data.ok === false) {
                  throw new Error((data as { error?: string } | null)?.error ?? "Failed to create plan");
                }

                setOpen(false);
                router.push(`/plans/${data.plan.id}`);
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Something went wrong");
              }
            });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Friday night: food + jazz" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="What kind of outing are you planning?" />
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" placeholder="San Jose" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="planDate">Date</Label>
              <Input id="planDate" name="planDate" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget">Budget</Label>
              <Input id="budget" name="budget" type="number" min={0} defaultValue={75} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="vibe">Vibe</Label>
            <Input id="vibe" name="vibe" placeholder="chill, artsy, foodie, nightlife" />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
