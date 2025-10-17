-- Customers apply
create or replace procedure tregu.apply_customers_batch(p_tenant text, p_batch uuid)
language plpgsql
as $$
declare
  r record;
begin
  for r in
    select normalized
    from tregu.stg_customers
    where tenant_id = p_tenant and batch_id = p_batch and status = 'validated'
  loop
    insert into tregu.customers(
      tenant_id, customer_code, name, email, phone, billing_address, shipping_address, tags, attributes, created_at, updated_at
    )
    values (
      p_tenant,
      (r.normalized->>'customer_code'),
      (r.normalized->>'name'),
      nullif(r.normalized->>'email',''),
      nullif(r.normalized->>'phone',''),
      nullif(r.normalized->>'billing_address',''),
      nullif(r.normalized->>'shipping_address',''),
      case when jsonb_typeof(r.normalized->'tags')='array'
           then array(select jsonb_array_elements_text(r.normalized->'tags'))
           else null end,
      coalesce(r.normalized->'attributes','{}'::jsonb),
      now(), now()
    )
    on conflict (tenant_id, customer_code) do update set
      name             = excluded.name,
      email            = excluded.email,
      phone            = excluded.phone,
      billing_address  = excluded.billing_address,
      shipping_address = excluded.shipping_address,
      tags             = excluded.tags,
      attributes       = excluded.attributes,
      updated_at       = now();
  end loop;

  update tregu.stg_customers
     set status = 'applied'
   where tenant_id = p_tenant and batch_id = p_batch and status = 'validated';
end;
$$;

-- Orders apply
create or replace procedure tregu.apply_orders_batch(p_tenant text, p_batch uuid)
language plpgsql
as $$
declare
  r record;
  ln int;
begin
  insert into tregu.orders(tenant_id, order_no, customer_code, order_date, currency, attributes, created_at, updated_at)
  select distinct
    p_tenant,
    (normalized->>'order_no') as order_no,
    (normalized->>'customer_code') as customer_code,
    (normalized->>'order_date')::date as order_date,
    nullif(normalized->>'currency','') as currency,
    coalesce(normalized->'attributes','{}'::jsonb) as attributes,
    now(), now()
  from tregu.stg_orders
  where tenant_id = p_tenant and batch_id = p_batch and status = 'validated'
  on conflict (tenant_id, order_no) do update set
    customer_code = excluded.customer_code,
    order_date    = excluded.order_date,
    currency      = excluded.currency,
    attributes    = excluded.attributes,
    updated_at    = now();

  delete from tregu.order_lines
   where tenant_id = p_tenant
     and (tenant_id, order_no) in (
       select p_tenant, (normalized->>'order_no')
       from tregu.stg_orders
       where tenant_id = p_tenant and batch_id = p_batch and status = 'validated'
       group by (normalized->>'order_no')
     );

  for r in
    select normalized from tregu.stg_orders
    where tenant_id = p_tenant and batch_id = p_batch and status = 'validated'
    order by (normalized->>'order_no'), coalesce((normalized->>'line_no')::int, 0)
  loop
    ln := coalesce((r.normalized->>'line_no')::int, null);
    if ln is null then
      select coalesce(max(line_no), 0) + 1 into ln
      from tregu.order_lines
      where tenant_id = p_tenant and order_no = (r.normalized->>'order_no');
    end if;

    insert into tregu.order_lines(
      tenant_id, order_no, line_no, sku, qty, unit_price, attributes
    )
    values (
      p_tenant,
      (r.normalized->>'order_no'),
      ln,
      (r.normalized->>'sku'),
      (r.normalized->>'qty')::numeric,
      case when (r.normalized ? 'unit_price') then (r.normalized->>'unit_price')::numeric else null end,
      coalesce(r.normalized->'attributes','{}'::jsonb)
    );
  end loop;

  update tregu.stg_orders
     set status = 'applied'
   where tenant_id = p_tenant and batch_id = p_batch and status = 'validated';
end;
$$;
