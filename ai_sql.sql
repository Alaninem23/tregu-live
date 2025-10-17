-- ============================================================
--  TREGU AI SQL: unified schema for OMS, SCM, WMS, TMS, WCS/WES
--  - PostgreSQL 14+
--  - Multitenant via tenant_id
--  - Strong constraints, indexes, helpers, and flows
--  - Unique 9-digit account numbers (server-side)
-- ============================================================

-- 0) Extensions (safe to skip if not allowed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Logical schema
CREATE SCHEMA IF NOT EXISTS tregu AUTHORIZATION CURRENT_USER;
SET search_path = tregu, public;

-- 2) Tenancy & core
CREATE TABLE IF NOT EXISTS tenants (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         text UNIQUE NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email          citext NOT NULL,
  name           text NOT NULL DEFAULT '',
  phone          text NOT NULL DEFAULT '',
  role           text NOT NULL DEFAULT 'buyer',  -- buyer | seller | admin
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

-- 9-digit, unique, one-per-user, enforced on server
CREATE TABLE IF NOT EXISTS user_account_numbers (
  user_id        uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  account_number char(9) UNIQUE NOT NULL
);

-- Function to generate a unique 9-digit number and assign it once.
-- Returns the assigned number.
CREATE OR REPLACE FUNCTION assign_account_number_once(p_user_id uuid)
RETURNS char(9)
LANGUAGE plpgsql
AS $$
DECLARE
  v_num char(9);
  v_try int := 0;
BEGIN
  -- already has one?
  SELECT account_number INTO v_num
  FROM user_account_numbers WHERE user_id = p_user_id;
  IF FOUND THEN
    RETURN v_num;
  END IF;

  -- try up to 20 times for uniqueness (extremely unlikely to collide)
  LOOP
    v_try := v_try + 1;
    v_num := lpad((floor(100000000 + random()*900000000))::bigint::text, 9, '0');
    BEGIN
      INSERT INTO user_account_numbers(user_id, account_number)
      VALUES (p_user_id, v_num);
      RETURN v_num;
    EXCEPTION WHEN unique_violation THEN
      IF v_try >= 20 THEN
        RAISE EXCEPTION 'Could not generate unique account number after % tries', v_try;
      END IF;
    END;
  END LOOP;
END$$;

-- 3) Catalogs & simple master data
CREATE TABLE IF NOT EXISTS products (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  seller_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sku           text NOT NULL,
  name          text NOT NULL,
  description   text NOT NULL DEFAULT '',
  price_cents   int  NOT NULL CHECK (price_cents >= 0),
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sku)
);

-- 4) SCM: suppliers & purchase orders
CREATE TABLE IF NOT EXISTS suppliers (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code        text NOT NULL,
  name        text NOT NULL,
  email       citext NOT NULL,
  phone       text NOT NULL DEFAULT '',
  UNIQUE (tenant_id, code)
);

CREATE TYPE po_status AS ENUM ('open','confirmed','received','closed');
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_status') THEN
    CREATE TYPE po_status AS ENUM ('open','confirmed','received','closed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  po_number   text NOT NULL,
  status      po_status NOT NULL DEFAULT 'open',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, po_number)
);

CREATE TABLE IF NOT EXISTS po_items (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id        uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  sku          text NOT NULL,
  qty          int  NOT NULL CHECK (qty > 0),
  cost_cents   int  NOT NULL CHECK (cost_cents >= 0)
);

-- 5) WMS: inventory & stock movements
CREATE TYPE move_type AS ENUM ('receipt','reserve','release','ship','adjust');
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'move_type') THEN
    CREATE TYPE move_type AS ENUM ('receipt','reserve','release','ship','adjust');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS warehouses (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code       text NOT NULL,
  name       text NOT NULL,
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS stock (
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  sku          text NOT NULL,
  on_hand      int  NOT NULL DEFAULT 0,
  reserved     int  NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, warehouse_id, sku),
  CHECK (on_hand >= 0),
  CHECK (reserved >= 0)
);

CREATE TABLE IF NOT EXISTS stock_moves (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  sku          text NOT NULL,
  qty          int  NOT NULL,
  kind         move_type NOT NULL,
  ref_type     text NOT NULL,    -- 'PO','ORDER','SHIPMENT','ADJUST'
  ref_id       uuid,             -- points at the related object
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (qty <> 0)
);

-- Balance updater (WMS)
CREATE OR REPLACE FUNCTION apply_stock_move()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- ensure row exists
  INSERT INTO stock(tenant_id, warehouse_id, sku)
  VALUES (NEW.tenant_id, NEW.warehouse_id, NEW.sku)
  ON CONFLICT (tenant_id, warehouse_id, sku) DO NOTHING;

  IF NEW.kind = 'receipt' THEN
    UPDATE stock SET on_hand = on_hand + NEW.qty WHERE tenant_id=NEW.tenant_id AND warehouse_id=NEW.warehouse_id AND sku=NEW.sku;
  ELSIF NEW.kind = 'reserve' THEN
    UPDATE stock SET reserved = reserved + NEW.qty WHERE tenant_id=NEW.tenant_id AND warehouse_id=NEW.warehouse_id AND sku=NEW.sku;
  ELSIF NEW.kind = 'release' THEN
    UPDATE stock SET reserved = GREATEST(reserved - abs(NEW.qty), 0) WHERE tenant_id=NEW.tenant_id AND warehouse_id=NEW.warehouse_id AND sku=NEW.sku;
  ELSIF NEW.kind = 'ship' THEN
    UPDATE stock
      SET on_hand = GREATEST(on_hand - abs(NEW.qty), 0),
          reserved = GREATEST(reserved - abs(NEW.qty), 0)
    WHERE tenant_id=NEW.tenant_id AND warehouse_id=NEW.warehouse_id AND sku=NEW.sku;
  ELSIF NEW.kind = 'adjust' THEN
    UPDATE stock SET on_hand = GREATEST(on_hand + NEW.qty, 0) WHERE tenant_id=NEW.tenant_id AND warehouse_id=NEW.warehouse_id AND sku=NEW.sku;
  END IF;

  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_apply_stock_move ON stock_moves;
CREATE TRIGGER trg_apply_stock_move
AFTER INSERT ON stock_moves
FOR EACH ROW EXECUTE PROCEDURE apply_stock_move();

-- 6) OMS: orders
CREATE TYPE order_status AS ENUM ('new','paid','picking','packed','shipped','delivered','cancelled');
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('new','paid','picking','packed','shipped','delivered','cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS orders (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  buyer_id      uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status        order_status NOT NULL DEFAULT 'new',
  total_cents   int NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sku           text NOT NULL,
  qty           int  NOT NULL CHECK (qty > 0),
  price_cents   int  NOT NULL CHECK (price_cents >= 0)
);

-- Reserve stock for an order (WMS + OMS)
CREATE OR REPLACE FUNCTION reserve_stock_for_order(
  p_order_id uuid,
  p_warehouse_id uuid
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_tenant uuid;
  rec record;
BEGIN
  SELECT tenant_id INTO v_tenant FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found %', p_order_id; END IF;

  FOR rec IN
    SELECT sku, qty FROM order_items WHERE order_id = p_order_id
  LOOP
    INSERT INTO stock_moves(tenant_id, warehouse_id, sku, qty, kind, ref_type, ref_id)
    VALUES (v_tenant, p_warehouse_id, rec.sku, rec.qty, 'reserve', 'ORDER', p_order_id);
  END LOOP;

  UPDATE orders SET status = 'picking' WHERE id = p_order_id AND status IN ('new','paid');
END$$;

-- Ship an order (deducts stock, creates shipment shell)
CREATE OR REPLACE FUNCTION ship_order(
  p_order_id uuid,
  p_warehouse_id uuid,
  p_shipment_id uuid,
  p_carrier_id uuid,
  p_tracking text
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_tenant uuid;
  rec record;
BEGIN
  SELECT tenant_id INTO v_tenant FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found %', p_order_id; END IF;

  FOR rec IN SELECT sku, qty FROM order_items WHERE order_id = p_order_id LOOP
    INSERT INTO stock_moves(tenant_id, warehouse_id, sku, qty, kind, ref_type, ref_id)
    VALUES (v_tenant, p_warehouse_id, rec.sku, rec.qty, 'ship', 'ORDER', p_order_id);
  END LOOP;

  -- TMS shell insert (assumes shipment exists in TMS tables)
  INSERT INTO shipments(id, tenant_id, order_id, carrier_id, tracking_number, status)
  VALUES (p_shipment_id, v_tenant, p_order_id, p_carrier_id, p_tracking, 'created')
  ON CONFLICT (id) DO NOTHING;

  UPDATE orders SET status = 'shipped' WHERE id = p_order_id;
END$$;

-- 7) TMS: carriers, shipments, tracking
CREATE TYPE ship_status AS ENUM ('created','picked','in_transit','delivered','exception');
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ship_status') THEN
    CREATE TYPE ship_status AS ENUM ('created','picked','in_transit','delivered','exception');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS carriers (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code          text NOT NULL,
  name          text NOT NULL,
  service_levels text[] NOT NULL DEFAULT ARRAY['ground','2-day','overnight'],
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS shipments (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier_id      uuid NOT NULL REFERENCES carriers(id) ON DELETE RESTRICT,
  tracking_number text,
  status          ship_status NOT NULL DEFAULT 'created',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tracking_events (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shipment_id   uuid NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  message       text NOT NULL,
  location      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 8) WCS / WES: tasks, waves
CREATE TYPE task_status AS ENUM ('queued','in_progress','done','failed');
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('queued','in_progress','done','failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tasks (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind        text NOT NULL,  -- pick/pack/putaway/move
  order_id    uuid,
  status      task_status NOT NULL DEFAULT 'queued',
  assignee    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE wave_status AS ENUM ('planned','released','completed');
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wave_status') THEN
    CREATE TYPE wave_status AS ENUM ('planned','released','completed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS waves (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status      wave_status NOT NULL DEFAULT 'planned',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wave_tasks (
  wave_id   uuid NOT NULL REFERENCES waves(id) ON DELETE CASCADE,
  task_id   uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (wave_id, task_id)
);

-- Helper: create a picking wave for an order (creates tasks and bundles them)
CREATE OR REPLACE FUNCTION create_wave_for_order(
  p_tenant uuid, p_order_id uuid
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_wave_id uuid := uuid_generate_v4();
  v_task_id uuid;
  rec record;
BEGIN
  -- make a wave
  INSERT INTO waves(id, tenant_id, status) VALUES (v_wave_id, p_tenant, 'planned');

  -- one pick task per order item
  FOR rec IN SELECT sku, qty FROM order_items WHERE order_id = p_order_id LOOP
    v_task_id := uuid_generate_v4();
    INSERT INTO tasks(id, tenant_id, kind, order_id, status)
    VALUES (v_task_id, p_tenant, 'pick', p_order_id, 'queued');

    INSERT INTO wave_tasks(wave_id, task_id) VALUES (v_wave_id, v_task_id);
  END LOOP;

  RETURN v_wave_id;
END$$;

-- 9) Security-ish (basic RLS examples – optional)
-- Enable per-tenant isolation with RLS (requires setting app.tenant_id per session).
-- Commented out by default; enable when you wire session GUCs/middleware.

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY users_tenant ON users
--   USING (tenant_id::text = current_setting('app.tenant_id', true));

-- Repeat similarly for other tables...

-- 10) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_tenant_sku ON products(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_stock_tenant_wh_sku ON stock(tenant_id, warehouse_id, sku);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_buyer ON orders(tenant_id, buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_shipments_tenant_order ON shipments(tenant_id, order_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_status ON tasks(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_waves_tenant_status ON waves(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_po_tenant_number ON purchase_orders(tenant_id, po_number);

-- 11) Convenience views / analytics
CREATE OR REPLACE VIEW v_stock_position AS
SELECT
  s.tenant_id,
  s.warehouse_id,
  s.sku,
  s.on_hand,
  s.reserved,
  (s.on_hand - s.reserved) AS available
FROM stock s;

CREATE OR REPLACE VIEW v_order_value AS
SELECT
  o.id as order_id,
  o.tenant_id,
  o.status,
  SUM(oi.qty * oi.price_cents) AS total_cents
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.tenant_id, o.status;

-- 12) Sample data helper (optional)
-- Call this in dev to quickly set up a tenant, users, and warehouse
CREATE OR REPLACE FUNCTION seed_minimal_demo()
RETURNS TABLE (tenant_id uuid, admin_id uuid, warehouse_id uuid) LANGUAGE plpgsql AS $$
DECLARE
  t uuid := uuid_generate_v4();
  u uuid := uuid_generate_v4();
  w uuid := uuid_generate_v4();
BEGIN
  INSERT INTO tenants(id, name) VALUES (t, 'tregu-demo') ON CONFLICT DO NOTHING;
  INSERT INTO users(id, tenant_id, email, name, role) VALUES (u, t, 'admin@tregu.local', 'Admin', 'admin')
  ON CONFLICT DO NOTHING;
  PERFORM assign_account_number_once(u);
  INSERT INTO warehouses(id, tenant_id, code, name) VALUES (w, t, 'MAIN', 'Main WH')
  ON CONFLICT DO NOTHING;

  RETURN QUERY SELECT t, u, w;
END$$;

-- Done.
