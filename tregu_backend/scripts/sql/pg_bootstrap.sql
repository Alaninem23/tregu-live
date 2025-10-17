create schema if not exists tregu;

-- Staging tables
create table if not exists tregu.stg_inventory (
  id bigserial primary key,
  tenant_id text not null,
  batch_id text not null,
  source text,
  raw jsonb not null,
  normalized jsonb,
  errors jsonb,
  status text default 'new',
  received_at timestamptz default now()
);

create table if not exists tregu.stg_customers (
  id bigserial primary key,
  tenant_id text not null,
  batch_id text not null,
  source text,
  raw jsonb not null,
  normalized jsonb,
  errors jsonb,
  status text default 'new',
  received_at timestamptz default now()
);

create table if not exists tregu.stg_orders (
  id bigserial primary key,
  tenant_id text not null,
  batch_id text not null,
  source text,
  raw jsonb not null,
  normalized jsonb,
  errors jsonb,
  status text default 'new',
  received_at timestamptz default now()
);

-- Canonical tables
create table if not exists tregu.customers (
  tenant_id text not null,
  customer_code text not null,
  name text not null,
  email text,
  phone text,
  billing_address text,
  shipping_address text,
  tags jsonb,
  attributes jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (tenant_id, customer_code)
);

create table if not exists tregu.orders (
  tenant_id text not null,
  order_no text not null,
  customer_code text not null,
  order_date text,
  currency text,
  attributes jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (tenant_id, order_no)
);

create table if not exists tregu.order_lines (
  tenant_id text not null,
  order_no text not null,
  line_no int not null,
  sku text not null,
  qty double precision,
  unit_price double precision,
  attributes jsonb,
  primary key (tenant_id, order_no, line_no)
);

create table if not exists tregu.inventory (
  tenant_id text not null,
  sku text not null,
  site_id text not null,
  bin text,
  on_hand double precision,
  allocated double precision,
  lot text,
  serial text,
  unit_cost double precision,
  updated_at timestamptz default now(),
  primary key (tenant_id, sku, site_id, bin, lot, serial)
);

-- Procedures
create or replace procedure tregu.apply_inventory_batch(p_tenant text, p_batch text)
language plpgsql as $$
begin
  insert into tregu.inventory(tenant_id, sku, site_id, bin, on_hand, allocated, lot, serial, unit_cost, updated_at)
  select tenant_id,
         (normalized->>'sku')::text,
         (normalized->>'site_id')::text,
         nullif(normalized->>'bin',''),
         coalesce((normalized->>'on_hand')::double precision,0),
         coalesce((normalized->>'allocated')::double precision,0),
         nullif(normalized->>'lot',''),
         nullif(normalized->>'serial',''),
         coalesce((normalized->>'unit_cost')::double precision,0), now()
  from tregu.stg_inventory
  where tenant_id=p_tenant and batch_id=p_batch and status='validated'
  on conflict (tenant_id, sku, site_id, bin, lot, serial) do update
    set on_hand=excluded.on_hand,
        allocated=excluded.allocated,
        unit_cost=excluded.unit_cost,
        updated_at=now();

  update tregu.stg_inventory set status='applied' where tenant_id=p_tenant and batch_id=p_batch and status='validated';
end;$$;

create or replace procedure tregu.apply_customers_batch(p_tenant text, p_batch text)
language plpgsql as $$
begin
  insert into tregu.customers(tenant_id, customer_code, name, email, phone, billing_address, shipping_address, tags, attributes, created_at, updated_at)
  select tenant_id,
         (normalized->>'customer_code')::text,
         (normalized->>'name')::text,
         nullif(normalized->>'email',''),
         nullif(normalized->>'phone',''),
         normalized->>'billing_address',
         normalized->>'shipping_address',
         coalesce(normalized->'tags','[]'::jsonb),
         coalesce(normalized->'attributes','{}'::jsonb), now(), now()
  from tregu.stg_customers
  where tenant_id=p_tenant and batch_id=p_batch and status='validated'
  on conflict (tenant_id, customer_code) do update
    set name=excluded.name,
        email=excluded.email,
        phone=excluded.phone,
        billing_address=excluded.billing_address,
        shipping_address=excluded.shipping_address,
        tags=excluded.tags,
        attributes=excluded.attributes,
        updated_at=now();

  update tregu.stg_customers set status='applied' where tenant_id=p_tenant and batch_id=p_batch and status='validated';
end;$$;

create or replace procedure tregu.apply_orders_batch(p_tenant text, p_batch text)
language plpgsql as $$
begin
  -- Upsert orders
  insert into tregu.orders(tenant_id, order_no, customer_code, order_date, currency, attributes, created_at, updated_at)
  select tenant_id,
         (normalized->>'order_no')::text,
         (normalized->>'customer_code')::text,
         normalized->>'order_date',
         nullif(normalized->>'currency',''),
         coalesce(normalized->'attributes','{}'::jsonb), now(), now()
  from tregu.stg_orders
  where tenant_id=p_tenant and batch_id=p_batch and status='validated'
  on conflict (tenant_id, order_no) do update
    set customer_code=excluded.customer_code,
        order_date=excluded.order_date,
        currency=excluded.currency,
        attributes=excluded.attributes,
        updated_at=now();

  -- Replace lines per order
  delete from tregu.order_lines where (tenant_id, order_no) in (
    select tenant_id, (normalized->>'order_no')::text from tregu.stg_orders where tenant_id=p_tenant and batch_id=p_batch and status='validated'
  );

  insert into tregu.order_lines(tenant_id, order_no, line_no, sku, qty, unit_price, attributes)
  select tenant_id,
         (normalized->>'order_no')::text,
         coalesce((normalized->>'line_no')::int, 1),
         (normalized->>'sku')::text,
         coalesce((normalized->>'qty')::double precision,0),
         nullif((normalized->>'unit_price'),'')::double precision,
         coalesce(normalized->'attributes','{}'::jsonb)
  from tregu.stg_orders
  where tenant_id=p_tenant and batch_id=p_batch and status='validated'
  on conflict (tenant_id, order_no, line_no) do update
    set sku=excluded.sku,
        qty=excluded.qty,
        unit_price=excluded.unit_price,
        attributes=excluded.attributes;

  update tregu.stg_orders set status='applied' where tenant_id=p_tenant and batch_id=p_batch and status='validated';
end;$$;
