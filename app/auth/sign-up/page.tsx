import Link from "next/link";

import { SiteHeader } from "@/components/shared/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseEnv } from "@/lib/supabase/env";

export default async function SignUpPage({
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
              Create account
            </h1>
            <p className="text-sm text-muted-foreground">
              {enabled
                ? "Create an account to use the Supabase-backed collaboration mode."
                : "Supabase is not configured. Sign-up is disabled in local demo mode."}
            </p>
          </div>

          {errorMsg ? (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errorMsg}</p>
            </div>
          ) : null}

          <form
            className="mt-6 grid gap-4"
            action="/auth/sign-up/action"
            method="post"
          >
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="Your name"
                disabled={!enabled}
              />
            </div>
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
              <p className="text-xs text-muted-foreground">
                Use a strong password. (In Supabase settings you can adjust auth
                requirements.)
              </p>
            </div>
            <Button type="submit" disabled={!enabled}>
              Create account
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/auth/sign-in" className="text-muted-foreground underline">
              Sign in
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
