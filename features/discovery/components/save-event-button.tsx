"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

async function fetchSaved() {
  const res = await fetch("/api/saved-events", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load saved events");
  const data = (await res.json()) as { slugs: string[] };
  return data;
}

async function save(slug: string) {
  const res = await fetch("/api/saved-events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Failed to save");
  }
}

async function unsave(slug: string) {
  const res = await fetch("/api/saved-events", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Failed to remove");
  }
}

export function SaveEventButton({ slug }: { slug: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["saved-events"],
    queryFn: fetchSaved,
  });

  const saved = (data?.slugs ?? []).includes(slug);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={saved ? "secondary" : "outline"}
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              if (saved) await unsave(slug);
              else await save(slug);
              await qc.invalidateQueries({ queryKey: ["saved-events"] });
            } catch (e) {
              setError(e instanceof Error ? e.message : "Something went wrong");
            }
          });
        }}
        aria-pressed={saved}
      >
        {saved ? (
          <>
            <BookmarkCheck className="h-4 w-4" />
            Saved
          </>
        ) : (
          <>
            <Bookmark className="h-4 w-4" />
            Save
          </>
        )}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
