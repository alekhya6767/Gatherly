import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(
      new URL("/auth/sign-up?error=Supabase+is+not+configured", req.url),
    );
  }

  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const displayName = String(form.get("displayName") ?? "").trim() || email.split("@")[0];

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/sign-up?error=${encodeURIComponent(error.message)}`, req.url),
    );
  }

  // Auto-create profile row for new user.
  if (data.user) {
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        display_name: displayName,
      },
      { onConflict: "id" },
    );
  }

  return NextResponse.redirect(new URL("/plans", req.url));
}
