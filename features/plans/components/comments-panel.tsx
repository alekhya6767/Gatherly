"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

async function fetchComments(planId: string) {
  const res = await fetch(`/api/plans/${planId}/comments`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load comments");
  const data = (await res.json()) as {
    ok: true;
    comments: { id: string; body: string; createdAt: string; authorName?: string }[];
  };
  return data.comments;
}

async function postComment(planId: string, body: string) {
  const res = await fetch(`/api/plans/${planId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Failed to post");
  }
}

export function CommentsPanel({ planId }: { planId: string }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["comments", planId],
    queryFn: () => fetchComments(planId),
  });

  const [pending, startTransition] = React.useTransition();
  const [value, setValue] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Discussion</p>
        <p className="text-xs text-muted-foreground">
          {(data?.length ?? 0) === 1 ? "1 comment" : `${data?.length ?? 0} comments`}
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitError(null);

            const body = value.trim();
            if (!body) {
              setSubmitError("Write a comment first.");
              return;
            }

            startTransition(async () => {
              try {
                await postComment(planId, body);
                setValue("");
                await qc.invalidateQueries({ queryKey: ["comments", planId] });
              } catch (err) {
                setSubmitError(err instanceof Error ? err.message : "Failed");
              }
            });
          }}
        >
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add a note for your group…"
            rows={3}
          />
          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              Post
            </Button>
          </div>
        </form>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading comments…</p>
        ) : isError ? (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load comments"}
          </p>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">
            No comments yet. Start the discussion.
          </p>
        ) : (
          <div className="grid gap-2">
            {data?.map((c) => {
              const name = c.authorName ?? "Anonymous";
              const initial = name.charAt(0).toUpperCase();
              return (
                <div key={c.id} className="rounded-xl border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {initial}
                    </div>
                    <span className="text-xs font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{c.body}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
