-- Schema
create schema if not exists tregu;

-- 1) Production tables
create table if not exists tregu.items (
  tenant_id     text not null,
  sku           text not null,
  name          text not null,
  uom           text not null,
  barcode       text,
  cost_method   text,
  status        text default 'active',
  attributes    jsonb default '{}'::jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  primary key (tenant_id, sku)
);

create table if not exists tregu.inventory (
  tenant_id     text not null,
  sku           text not null,
  site_id       text not null,
  bin           text,
  on_hand       numeric not null,
  allocated     numeric default 0,
  available     numeric generated always as (on_hand - coalesce(allocated,0)) stored,
  lot           text,
  serial        text,
  unit_cost     numeric,
  updated_at    timestamptz default now(),
  primary key (tenant_id, sku, site_id, coalesce(bin,''), coalesce(lot,''), coalesce(serial,''))
);

create table if not exists tregu.customers (
  tenant_id       text not null,
  customer_code   text not null,
  name            text not null,
  email           text,
  phone           text,
  billing_address text,
  shipping_address text,
  tags            text[],
  attributes      jsonb default '{}'::jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  primary key (tenant_id, customer_code)
);

create table if not exists tregu.orders (
  tenant_id     text not null,
  order_no      text not null,
  customer_code text not null,
  order_date    date not null,
  currency      text,
  attributes    jsonb default '{}'::jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  primary key (tenant_id, order_no)
);

create table if not exists tregu.order_lines (
  tenant_id  text not null,
  order_no   text not null,
  line_no    int  not null,
  sku        text not null,
  qty        numeric not null,
  unit_price numeric,
  attributes jsonb default '{}'::jsonb,
  primary key (tenant_id, order_no, line_no)
);

-- 2) Staging tables
create table if not exists tregu.stg_inventory (
  id            bigserial primary key,
  tenant_id     text not null,
  batch_id      uuid not null,
  source        text,
  raw           jsonb not null,
  normalized    jsonb,
  errors        jsonb,
  status        text default 'new',
  received_at   timestamptz default now()
);

create table if not exists tregu.stg_orders (
  id            bigserial primary key,
  tenant_id     text not null,
  batch_id      uuid not null,
  source        text,
  raw           jsonb not null,
  normalized    jsonb,
  errors        jsonb,
  status        text default 'new',
  received_at   timestamptz default now()
);

create table if not exists tregu.stg_customers (
  id            bigserial primary key,
  tenant_id     text not null,
  batch_id      uuid not null,
  source        text,
  raw           jsonb not null,
  normalized    jsonb,
  errors        jsonb,
  status        text default 'new',
  received_at   timestamptz default now()
);

-- 3) Helper function
create or replace function tregu.safe_num(v text) returns numeric as $$
begin
  return nullif(v,'')::numeric;
exception when others then
  return null;
end;
$$ language plpgsql immutable;

-- 4) Upsert procedure for inventory
create or replace procedure tregu.apply_inventory_batch(p_tenant text, p_batch uuid)
language plpgsql
as $$
declare
  r record;
begin
  for r in
    select (normalized->>'sku') as sku,
           (normalized->>'site_id') as site_id,
           coalesce(normalized->>'bin','') as bin,
           (normalized->>'on_hand')::numeric as on_hand,
           (normalized->>'allocated')::numeric as allocated,
           (normalized->>'lot') as lot,
           (normalized->>'serial') as serial,
           (normalized->>'unit_cost')::numeric as unit_cost
    from tregu.stg_inventory
    where tenant_id = p_tenant and batch_id = p_batch and status = 'validated'
  loop
    insert into tregu.inventory(tenant_id, sku, site_id, bin, on_hand, allocated, lot, serial, unit_cost, updated_at)
    values (p_tenant, r.sku, r.site_id, nullif(r.bin,''), r.on_hand, r.allocated, r.lot, r.serial, r.unit_cost, now())
    on conflict (tenant_id, sku, site_id, coalesce(bin,''), coalesce(lot,''), coalesce(serial,''))
    do update set on_hand = excluded.on_hand,
                  allocated = coalesce(excluded.allocated, 0),
                  unit_cost = excluded.unit_cost,
                  updated_at = now();
  end loop;

  update tregu.stg_inventory
    set status = 'applied'
  where tenant_id = p_tenant and batch_id = p_batch and status = 'validated';
end;
$$;
