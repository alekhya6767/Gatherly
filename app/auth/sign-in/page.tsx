import Link from "next/link";

import { SiteHeader } from "@/components/shared/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseEnv } from "@/lib/supabase/env";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const enabled = Boolean(getSupabaseEnv());
  const resolvedParams = await searchParams;
  const errorMsg = typeof resolvedParams.error === "string" ? resolvedParams.error : null;

  return (
    <div className="page-wrapper">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <Card className="p-6">
          <div className="space-y-2">
            <h1 className="font-heading text-xl font-semibold tracking-tight">
              Sign in
            </h1>
            <p className="text-sm text-muted-foreground">
              {enabled
                ? "Use your email and password to sign in."
                : "Supabase is not configured. Sign-in is disabled in local demo mode."}
            </p>
          </div>

          {errorMsg ? (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errorMsg}</p>
            </div>
          ) : null}

          <form
            className="mt-6 grid gap-4"
            action="/auth/sign-in/action"
            method="post"
          >
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@school.edu"
                required
                disabled={!enabled}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={!enabled}
              />
            </div>
            <Button type="submit" disabled={!enabled}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/auth/sign-up" className="text-muted-foreground underline">
              Create account
            </Link>
            <Link href="/" className="text-muted-foreground underline">
              Back
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
