-- Rechenweg: Konten für Lehrer, Schüler und Eltern.
-- Einmal im Supabase-Dashboard unter „SQL Editor“ ausführen.
-- Vorher in der letzten Zeile deine E-Mail-Adresse eintragen.

-- Wer ist wer. Ein Eintrag pro Konto, angelegt beim Erstellen des Kontos.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'schueler' check (role in ('lehrer', 'schueler', 'eltern')),
  name text not null default '',
  username text unique,
  -- Bei Schülern und Eltern: der Lehrer, der das Konto angelegt hat.
  teacher_id uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

-- Eltern sehen nur ihre eigenen Kinder.
create table if not exists public.parent_links (
  parent_id uuid references public.profiles on delete cascade,
  student_id uuid references public.profiles on delete cascade,
  primary key (parent_id, student_id)
);

-- Der ganze Lernstand eines Schülers (Stufen, Lerntagebuch, Klassenarbeiten …).
create table if not exists public.progress (
  user_id uuid primary key references public.profiles on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- E-Mail-Adressen, die beim Anlegen automatisch Lehrer werden.
create table if not exists public.lehrer_emails (email text primary key);

alter table public.profiles enable row level security;
alter table public.parent_links enable row level security;
alter table public.progress enable row level security;
alter table public.lehrer_emails enable row level security;

-- Hilfsfunktion: Darf der angemeldete Nutzer den Schüler sehen?
create or replace function public.can_see(student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select student = auth.uid()
    or exists (select 1 from profiles s where s.id = student and s.teacher_id = auth.uid())
    or exists (select 1 from parent_links l where l.student_id = student and l.parent_id = auth.uid());
$$;

drop policy if exists "profile lesen" on public.profiles;
create policy "profile lesen" on public.profiles for select using (public.can_see(id) or teacher_id = auth.uid());
drop policy if exists "links lesen" on public.parent_links;
create policy "links lesen" on public.parent_links for select using (parent_id = auth.uid() or public.can_see(student_id));
drop policy if exists "fortschritt lesen" on public.progress;
create policy "fortschritt lesen" on public.progress for select using (public.can_see(user_id));
drop policy if exists "fortschritt schreiben" on public.progress;
create policy "fortschritt schreiben" on public.progress for insert with check (user_id = auth.uid());
drop policy if exists "fortschritt ändern" on public.progress;
create policy "fortschritt ändern" on public.progress for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Neues Konto → Profil anlegen. Rolle, Name und Lehrer kommen vom Server (app_metadata), nie vom Nutzer selbst.
create or replace function public.new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role, name, username, teacher_id)
  values (
    new.id,
    case when exists (select 1 from lehrer_emails e where lower(e.email) = lower(new.email)) then 'lehrer'
         else coalesce(new.raw_app_meta_data->>'role', 'schueler') end,
    coalesce(new.raw_app_meta_data->>'name', ''),
    new.raw_app_meta_data->>'username',
    nullif(new.raw_app_meta_data->>'teacher_id', '')::uuid
  );
  if new.raw_app_meta_data ? 'child_id' then
    insert into parent_links (parent_id, student_id) values (new.id, (new.raw_app_meta_data->>'child_id')::uuid);
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.new_user();

-- HIER deine E-Mail eintragen. Danach legst du unter Authentication → Users → „Add user“ dein Konto mit dieser E-Mail an.
insert into public.lehrer_emails (email) values ('DEINE-EMAIL@example.com') on conflict do nothing;
