create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  category text not null,
  venue text not null,
  city text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  price_min integer not null default 0,
  price_max integer not null default 0,
  image_url text,
  tags text[] not null default array[]::text[],
  latitude double precision,
  longitude double precision,
  source text not null default 'seed',
  external_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  city text,
  plan_date date,
  budget integer,
  vibe text,
  visibility text not null default 'private',
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_members (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.plan_events (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  note text,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(plan_id, event_id)
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value integer not null,
  created_at timestamptz not null default now(),
  unique(plan_id, event_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  prompt_summary text not null,
  response_json jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.saved_events enable row level security;
alter table public.plans enable row level security;
alter table public.plan_members enable row level security;
alter table public.plan_events enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.ai_generations enable row level security;

create policy "profiles_read_own" on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "events_read_all" on public.events
for select
to public
using (true);

create policy "saved_events_read_own" on public.saved_events
for select
to authenticated
using (user_id = auth.uid());

create policy "saved_events_insert_own" on public.saved_events
for insert
to authenticated
with check (user_id = auth.uid());

create policy "saved_events_delete_own" on public.saved_events
for delete
to authenticated
using (user_id = auth.uid());

create policy "plans_read_member_or_owner" on public.plans
for select
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.plan_members pm
    where pm.plan_id = plans.id and pm.user_id = auth.uid()
  )
);

create policy "plans_insert_owner" on public.plans
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "plans_update_owner" on public.plans
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "plans_delete_owner" on public.plans
for delete
to authenticated
using (owner_id = auth.uid());

create policy "plan_members_read_plan" on public.plan_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.plans p
    where p.id = plan_members.plan_id and p.owner_id = auth.uid()
  )
);

create policy "plan_members_insert_owner" on public.plan_members
for insert
to authenticated
with check (
  exists (
    select 1 from public.plans p
    where p.id = plan_members.plan_id and p.owner_id = auth.uid()
  )
);

create policy "plan_members_insert_self_for_link_plans" on public.plan_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.plans p
    where p.id = plan_members.plan_id and p.visibility = 'link'
  )
);

create policy "plan_events_read_plan" on public.plan_events
for select
to authenticated
using (
  exists (
    select 1 from public.plans p
    where p.id = plan_events.plan_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.plan_members pm
          where pm.plan_id = p.id and pm.user_id = auth.uid()
        )
      )
  )
);

create policy "plan_events_insert_owner_or_member" on public.plan_events
for insert
to authenticated
with check (
  exists (
    select 1 from public.plans p
    where p.id = plan_events.plan_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.plan_members pm
          where pm.plan_id = p.id and pm.user_id = auth.uid()
        )
      )
  )
);

create policy "plan_events_update_owner_or_member" on public.plan_events
for update
to authenticated
using (
  exists (
    select 1 from public.plans p
    where p.id = plan_events.plan_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.plan_members pm
          where pm.plan_id = p.id and pm.user_id = auth.uid()
        )
      )
  )
)
with check (
  exists (
    select 1 from public.plans p
    where p.id = plan_events.plan_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.plan_members pm
          where pm.plan_id = p.id and pm.user_id = auth.uid()
        )
      )
  )
);

create policy "votes_read_plan" on public.votes
for select
to authenticated
using (
  exists (
    select 1 from public.plans p
    where p.id = votes.plan_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.plan_members pm
          where pm.plan_id = p.id and pm.user_id = auth.uid()
        )
      )
  )
);

create policy "votes_upsert_plan" on public.votes
for insert
to authenticated
with check (user_id = auth.uid());

create policy "votes_update_own" on public.votes
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "comments_read_plan" on public.comments
for select
to authenticated
using (
  exists (
    select 1 from public.plans p
    where p.id = comments.plan_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.plan_members pm
          where pm.plan_id = p.id and pm.user_id = auth.uid()
        )
      )
  )
);

create policy "comments_insert_plan" on public.comments
for insert
to authenticated
with check (user_id = auth.uid());

create policy "ai_generations_read_own" on public.ai_generations
for select
to authenticated
using (user_id = auth.uid());

create policy "ai_generations_insert_own" on public.ai_generations
for insert
to authenticated
with check (user_id = auth.uid());
