"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JoinPlanForm() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);

        const fd = new FormData(e.currentTarget);
        const inviteCode = String(fd.get("invite") ?? "").trim();

        startTransition(async () => {
          try {
            const res = await fetch("/api/plans/join", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ inviteCode }),
            });

            const data = (await res.json().catch(() => null)) as
              | { ok: true; id: string }
              | { ok: false; error?: string }
              | null;

            if (!res.ok || !data || data.ok === false) {
              throw new Error((data as { error?: string } | null)?.error ?? "Join failed");
            }

            router.push(`/plans/${data.id}`);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
          }
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="invite">Invite code</Label>
        <Input
          id="invite"
          name="invite"
          placeholder="ABCDEFGH"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          required
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={pending}>
        Join
      </Button>
    </form>
  );
}
