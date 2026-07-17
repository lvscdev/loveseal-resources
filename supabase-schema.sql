-- ─────────────────────────────────────────────────────────────────────────────
-- LOVE SEAL CHURCH — SUPABASE DATABASE SCHEMA
-- Safe to re-run on an existing database (all statements are idempotent).
-- Supabase Dashboard → SQL Editor → New query → paste → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- ── Enums ───────────────────────────────────────────────────────────────────
-- Postgres has no CREATE TYPE IF NOT EXISTS; DO blocks swallow duplicate errors.

do $$ begin
  create type content_type as enum ('manual', 'prophecy', 'article', 'blog');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type content_status as enum ('draft', 'published');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type supported_locale as enum ('en', 'es', 'fr', 'pt', 'ar');
exception when duplicate_object then null;
end $$;

-- ── Categories table ─────────────────────────────────────────────────────────

create table if not exists categories (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  slug         text not null unique,
  content_type content_type,
  created_at   timestamptz not null default now()
);

comment on table categories is 'Admin-defined categories for organising content.';

-- ── Content table ────────────────────────────────────────────────────────────

create table if not exists content (
  id                uuid primary key default uuid_generate_v4(),
  title             text not null,
  slug              text unique,
  content_type      content_type not null,
  category          text not null default '',
  tags              text[] not null default '{}',
  extracted_text    text,
  summary_points    text[],
  pdf_url           text not null,
  cover_image_url   text,
  status            content_status not null default 'draft',
  language          supported_locale not null default 'en',
  search_vector     tsvector,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table content is 'All published and draft content items uploaded by the admin.';
comment on column content.pdf_url is 'Supabase Storage path — not the full URL. Generate signed URL on the fly.';
comment on column content.search_vector is 'Trigger-maintained tsvector. Weighted: title (A) > text (B) > tags (C).';

-- ── Content Translations table ───────────────────────────────────────────────

create table if not exists content_translations (
  id                    uuid             primary key default uuid_generate_v4(),
  content_id            uuid             not null references content (id) on delete cascade,
  locale                supported_locale not null,
  title                 text             not null,
  theme                 text,
  series                text,
  speaker               text,
  body_html             text,
  extracted_text        text,
  summary_points        text[],
  scripture_refs        text[]           not null default '{}',
  is_machine_translated boolean          not null default true,
  translated_at         timestamptz      not null default now(),
  created_at            timestamptz      not null default now(),
  updated_at            timestamptz      not null default now(),
  search_vector         tsvector,

  constraint content_translations_content_locale_unique unique (content_id, locale)
);

comment on table content_translations is 'Machine-translated copies of content rows, one row per (content_id, locale) pair.';

-- ── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists idx_content_status     on content (status);
create index if not exists idx_content_type       on content (content_type);
create index if not exists idx_content_category   on content (category);
create index if not exists idx_content_language   on content (language);
create index if not exists idx_content_created_at on content (created_at desc);

create index if not exists idx_content_published  on content (status, content_type, created_at desc)
  where status = 'published';

create index if not exists idx_content_search     on content using gin (search_vector);
create index if not exists idx_content_tags       on content using gin (tags);

create index if not exists idx_ct_content_id on content_translations (content_id);
create index if not exists idx_ct_locale      on content_translations (locale);
create index if not exists idx_ct_search      on content_translations using gin (search_vector);

-- ── Functions ────────────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function update_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.extracted_text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.tags, ' '), '')), 'C');
  return new;
end;
$$ language plpgsql;

create or replace function update_ct_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.extracted_text, '')), 'B');
  return new;
end;
$$ language plpgsql;

-- ── Triggers ─────────────────────────────────────────────────────────────────
-- Postgres has no CREATE TRIGGER IF NOT EXISTS; drop first to stay idempotent.

drop trigger if exists content_updated_at           on content;
drop trigger if exists content_search_vector        on content;
drop trigger if exists content_translations_updated_at    on content_translations;
drop trigger if exists content_translations_search_vector on content_translations;

create trigger content_updated_at
  before update on content
  for each row execute function set_updated_at();

create trigger content_search_vector
  before insert or update of title, extracted_text, tags
  on content
  for each row execute function update_search_vector();

create trigger content_translations_updated_at
  before update on content_translations
  for each row execute function set_updated_at();

create trigger content_translations_search_vector
  before insert or update of title, extracted_text
  on content_translations
  for each row execute function update_ct_search_vector();

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table content              enable row level security;
alter table categories           enable row level security;
alter table content_translations enable row level security;

-- Drop before recreate — policies also lack IF NOT EXISTS
drop policy if exists "Public can read published content"       on content;
drop policy if exists "Public can read categories"              on categories;
drop policy if exists "Admin full access to content"            on content;
drop policy if exists "Admin full access to categories"         on categories;
drop policy if exists "Public can read content translations"    on content_translations;

create policy "Public can read published content"
  on content for select
  using (status = 'published');

create policy "Public can read categories"
  on categories for select
  using (true);

create policy "Admin full access to content"
  on content for all
  using (auth.jwt() ->> 'email' = current_setting('app.admin_email', true))
  with check (auth.jwt() ->> 'email' = current_setting('app.admin_email', true));

create policy "Admin full access to categories"
  on categories for all
  using (auth.jwt() ->> 'email' = current_setting('app.admin_email', true))
  with check (auth.jwt() ->> 'email' = current_setting('app.admin_email', true));

-- service_role key (used by the admin client) bypasses RLS automatically;
-- this policy covers unauthenticated public reads of translated content.
create policy "Public can read content translations"
  on content_translations for select
  using (true);

-- ── Content Co-Authors junction table ────────────────────────────────────────
-- Tracks secondary (co-) authors on a piece of content.
-- The primary author lives on content.author_id; everyone else lives here.

create table if not exists content_co_authors (
  content_id    uuid     not null references content(id) on delete cascade,
  author_id     uuid     not null references authors(id) on delete cascade,
  display_order smallint not null default 0,
  primary key (content_id, author_id)
);

create index if not exists idx_content_co_authors_content on content_co_authors (content_id);

alter table content_co_authors enable row level security;

drop policy if exists "Public can read content co-authors"  on content_co_authors;
drop policy if exists "Admin full access to content co-authors" on content_co_authors;

create policy "Public can read content co-authors"
  on content_co_authors for select
  using (
    exists (
      select 1 from content where id = content_id and status = 'published'
    )
  );

create policy "Admin full access to content co-authors"
  on content_co_authors for all
  using (
    exists (select 1 from admin_users where id = auth.uid())
  )
  with check (
    exists (select 1 from admin_users where id = auth.uid())
  );

-- ── Storage buckets ──────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-pdfs', 'content-pdfs', false, 52428800, array['application/pdf']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cover-images', 'cover-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "Admin can upload PDFs"        on storage.objects;
drop policy if exists "Admin can upload cover images" on storage.objects;
drop policy if exists "Admin can delete PDFs"        on storage.objects;
drop policy if exists "Admin can delete cover images" on storage.objects;
drop policy if exists "Public can read cover images"  on storage.objects;
drop policy if exists "Public can read PDFs"          on storage.objects;

create policy "Admin can upload PDFs"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'content-pdfs');

create policy "Admin can upload cover images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'cover-images');

create policy "Admin can delete PDFs"
  on storage.objects for delete to authenticated
  using (bucket_id = 'content-pdfs');

create policy "Admin can delete cover images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'cover-images');

create policy "Public can read cover images"
  on storage.objects for select
  using (bucket_id = 'cover-images');

-- The content-pdfs bucket is private (no public URL access) so that files
-- can't be listed or guessed at random paths — readers only ever reach a
-- file through a time-limited signed URL minted server-side. But minting
-- that signed URL still requires a SELECT grant on storage.objects for the
-- caller (anon/authenticated visitors on the public reader pages), which
-- was missing entirely. Without it, createSignedUrl() silently returns
-- null and every PDF-mode manual/prophecy shows "PDF is currently
-- unavailable" for everyone, including admins.
create policy "Public can read PDFs"
  on storage.objects for select
  using (bucket_id = 'content-pdfs');

-- ── Seed: default categories ─────────────────────────────────────────────────

insert into categories (name, slug, content_type) values
  ('Faith & Doctrine', 'faith-doctrine', null),
  ('Prayer',           'prayer',         null),
  ('Prophecy',         'prophecy',       'prophecy'),
  ('Teaching',         'teaching',       'manual'),
  ('Devotional',       'devotional',     'article'),
  ('Announcements',    'announcements',  'blog'),
  ('Youth',            'youth',          null),
  ('Family',           'family',         null)
on conflict (slug) do nothing;

-- ── Verify ───────────────────────────────────────────────────────────────────

select 'content'              as table_name, count(*) as rows from content              union all
select 'categories'           as table_name, count(*) as rows from categories           union all
select 'content_translations' as table_name, count(*) as rows from content_translations;
