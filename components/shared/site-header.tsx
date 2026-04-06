import { SiteHeaderClient } from "@/components/shared/site-header-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function SiteHeader() {
  const supabaseEnabled = Boolean(getSupabaseEnv());
  const supabase = await createSupabaseServerClient();
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const email = session?.user.email ?? null;

  return <SiteHeaderClient email={email} supabaseEnabled={supabaseEnabled} />;
}
