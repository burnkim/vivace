-- Vivace menu — Supabase tables.
-- Run this ONCE in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
-- After it runs, the studio writes your menu into these tables on every save
-- (in addition to the existing sync), so the data lives as organized, queryable
-- rows you can view in Table Editor — and as a robust recoverable copy.

-- Full document (layout + content) as one robust row.
create table if not exists menu_documents (
  id         text primary key,
  doc        jsonb not null,
  updated_at timestamptz default now()
);

-- Every menu item (espresso/tea/beverage/dessert) as a row.
create table if not exists menu_items (
  id      text primary key,
  page    text,
  section text,
  name_en text,
  name_kr text,
  price   text,
  badge   text,
  descr   text,
  sort    int
);

-- The hand-drip bean roster as rows (order + hidden + copy).
create table if not exists beans (
  id        text primary key,
  name_en   text,
  grade     text,
  price     text,
  head_copy text,
  descr     text,
  hidden    boolean default false,
  sort      int
);

-- Let the menu app (anon key) read/write. Same access level as the current
-- setup; tighten later if you publish a public read-only menu.
alter table menu_documents enable row level security;
alter table menu_items     enable row level security;
alter table beans          enable row level security;

drop policy if exists anon_all on menu_documents;
create policy anon_all on menu_documents for all to anon using (true) with check (true);
drop policy if exists anon_all on menu_items;
create policy anon_all on menu_items for all to anon using (true) with check (true);
drop policy if exists anon_all on beans;
create policy anon_all on beans for all to anon using (true) with check (true);
