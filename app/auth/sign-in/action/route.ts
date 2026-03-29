import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=Supabase+is+not+configured", req.url),
    );
  }

  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(error.message)}`, req.url),
    );
  }

  // Ensure profile row exists with email prefix as display_name
  if (data.user) {
    await supabase.from("profiles").upsert(
      { id: data.user.id, display_name: email.split("@")[0] },
      { onConflict: "id", ignoreDuplicates: true },
    );
  }

  return NextResponse.redirect(new URL("/plans", req.url));
}
