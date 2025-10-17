from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from uuid import uuid4, UUID
from typing import List, Dict, Any
import csv, io, json
from sqlalchemy import text
from app.db import engine
from app.deps import get_db

# Placeholder for RBAC gate: require_system("integrations", "write.integrations")
def require_integrations_write():
    # TODO: replace with real RBAC dependency
    return type("Principal", (), {"tenant_id": "demo-tenant"})()

router = APIRouter(prefix="/integration", tags=["Integration"])

def _is_pg() -> bool:
        try:
                return engine.dialect.name == "postgresql"
        except Exception:
                return False

def _ensure_sqlite_tables(db):
        if _is_pg():
                return
        # Staging tables (SQLite)
        db.execute(text(
                """
                create table if not exists tregu_stg_inventory (
                    id integer primary key autoincrement,
                    tenant_id text not null,
                    batch_id text not null,
                    source text,
                    raw text not null,
                    normalized text,
                    errors text,
                    status text default 'new',
                    received_at text default (datetime('now'))
                )
                """
        ))
        db.execute(text(
                """
                create table if not exists tregu_stg_customers (
                    id integer primary key autoincrement,
                    tenant_id text not null,
                    batch_id text not null,
                    source text,
                    raw text not null,
                    normalized text,
                    errors text,
                    status text default 'new',
                    received_at text default (datetime('now'))
                )
                """
        ))
        db.execute(text(
                """
                create table if not exists tregu_stg_orders (
                    id integer primary key autoincrement,
                    tenant_id text not null,
                    batch_id text not null,
                    source text,
                    raw text not null,
                    normalized text,
                    errors text,
                    status text default 'new',
                    received_at text default (datetime('now'))
                )
                """
        ))
        # Canonical (SQLite) minimal shape
        db.execute(text(
                """
                create table if not exists tregu_customers (
                    tenant_id text not null,
                    customer_code text not null,
                    name text not null,
                    email text,
                    phone text,
                    billing_address text,
                    shipping_address text,
                    tags text,
                    attributes text,
                    created_at text,
                    updated_at text,
                    primary key (tenant_id, customer_code)
                )
                """
        ))
        db.execute(text(
                """
                create table if not exists tregu_orders (
                    tenant_id text not null,
                    order_no text not null,
                    customer_code text not null,
                    order_date text,
                    currency text,
                    attributes text,
                    created_at text,
                    updated_at text,
                    primary key (tenant_id, order_no)
                )
                """
        ))
        db.execute(text(
                """
                create table if not exists tregu_order_lines (
                    tenant_id text not null,
                    order_no text not null,
                    line_no integer not null,
                    sku text not null,
                    qty real,
                    unit_price real,
                    attributes text,
                    primary key (tenant_id, order_no, line_no)
                )
                """
        ))
        db.execute(text(
                """
                create table if not exists tregu_inventory (
                    tenant_id text not null,
                    sku text not null,
                    site_id text not null,
                    bin text,
                    on_hand real,
                    allocated real,
                    lot text,
                    serial text,
                    unit_cost real,
                    updated_at text,
                    primary key (tenant_id, sku, site_id, bin, lot, serial)
                )
                """
        ))

@router.get("/debug/counts")
async def debug_counts(
    principal = Depends(require_integrations_write),
    db = Depends(get_db),
):
    """Return counts for canonical tables for the current tenant.
    Works for both Postgres and SQLite.
    """
    if _is_pg():
        inv = db.execute(text("select count(*) from tregu.inventory where tenant_id=:t"), {"t": principal.tenant_id}).scalar() or 0
        cust = db.execute(text("select count(*) from tregu.customers where tenant_id=:t"), {"t": principal.tenant_id}).scalar() or 0
        ords = db.execute(text("select count(*) from tregu.orders where tenant_id=:t"), {"t": principal.tenant_id}).scalar() or 0
        lines = db.execute(text("select count(*) from tregu.order_lines where tenant_id=:t"), {"t": principal.tenant_id}).scalar() or 0
    else:
        _ensure_sqlite_tables(db)
        inv = db.execute(text("select count(*) from tregu_inventory where tenant_id=:t"), {"t": principal.tenant_id}).scalar() or 0
        cust = db.execute(text("select count(*) from tregu_customers where tenant_id=:t"), {"t": principal.tenant_id}).scalar() or 0
        ords = db.execute(text("select count(*) from tregu_orders where tenant_id=:t"), {"t": principal.tenant_id}).scalar() or 0
        lines = db.execute(text("select count(*) from tregu_order_lines where tenant_id=:t"), {"t": principal.tenant_id}).scalar() or 0
    return {"ok": True, "tenant_id": principal.tenant_id, "inventory": int(inv), "customers": int(cust), "orders": int(ords), "order_lines": int(lines)}

@router.get("/debug/batches")
async def debug_batches(
    principal = Depends(require_integrations_write),
    db = Depends(get_db),
):
    """Return recent batches and status per domain for current tenant."""
    if _is_pg():
        inv = db.execute(text("""
            select batch_id, status, count(*) as rows
            from tregu.stg_inventory where tenant_id=:t group by batch_id, status order by batch_id desc limit 10
        """), {"t": principal.tenant_id}).fetchall()
        cust = db.execute(text("""
            select batch_id, status, count(*) as rows
            from tregu.stg_customers where tenant_id=:t group by batch_id, status order by batch_id desc limit 10
        """), {"t": principal.tenant_id}).fetchall()
        ords = db.execute(text("""
            select batch_id, status, count(*) as rows
            from tregu.stg_orders where tenant_id=:t group by batch_id, status order by batch_id desc limit 10
        """), {"t": principal.tenant_id}).fetchall()
    else:
        _ensure_sqlite_tables(db)
        inv = db.execute(text("""
            select batch_id, status, count(*) as rows
            from tregu_stg_inventory where tenant_id=:t group by batch_id, status order by batch_id desc limit 10
        """), {"t": principal.tenant_id}).fetchall()
        cust = db.execute(text("""
            select batch_id, status, count(*) as rows
            from tregu_stg_customers where tenant_id=:t group by batch_id, status order by batch_id desc limit 10
        """), {"t": principal.tenant_id}).fetchall()
        ords = db.execute(text("""
            select batch_id, status, count(*) as rows
            from tregu_stg_orders where tenant_id=:t group by batch_id, status order by batch_id desc limit 10
        """), {"t": principal.tenant_id}).fetchall()

    def rows_to_list(rs):
        return [
            {"batch_id": r[0], "status": r[1], "rows": int(r[2]) if r[2] is not None else 0}
            for r in rs
        ]

    return {"ok": True, "tenant_id": principal.tenant_id, "inventory": rows_to_list(inv), "customers": rows_to_list(cust), "orders": rows_to_list(ords)}

@router.get("/debug/health")
async def integration_health():
    return {"ok": True, "service": "integration", "version": "v1"}

@router.get("/debug/version")
async def integration_version():
    import os
    return {
        "ok": True,
        "git_sha": os.getenv("GIT_SHA", "unknown"),
        "build_time": os.getenv("BUILD_TIME", "unknown"),
        "service": "integration"
    }

@router.post("/upload/inventory")
async def upload_inventory(
    files: List[UploadFile] = File(...),
    source: str = Form("csv:upload"),
    principal = Depends(require_integrations_write),
    db = Depends(get_db),
):
    if not _is_pg():
        _ensure_sqlite_tables(db)
    batch_id = uuid4()
    for f in files:
        buf = await f.read()
        csv_text = buf.decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(csv_text))
        for row in reader:
            if _is_pg():
                db.execute(
                    text(
                        """
                        insert into tregu.stg_inventory(tenant_id, batch_id, source, raw)
                        values (:tenant_id, :batch_id, :source, cast(:raw as jsonb))
                        """
                    ),
                    {
                        "tenant_id": principal.tenant_id,
                        "batch_id": str(batch_id),
                        "source": source,
                        "raw": json.dumps(row),
                    },
                )
            else:
                db.execute(
                    text(
                        """
                        insert into tregu_stg_inventory(tenant_id, batch_id, source, raw)
                        values (:tenant_id, :batch_id, :source, :raw)
                        """
                    ),
                    {
                        "tenant_id": principal.tenant_id,
                        "batch_id": str(batch_id),
                        "source": source,
                        "raw": json.dumps(row),
                    },
                )
    db.commit()
    return {"ok": True, "batch_id": str(batch_id), "rows": "queued"}

@router.post("/map-validate/inventory")
async def map_validate_inventory(
    batch_id: UUID = Form(...),
    mapping_json: str = Form(...),
    principal = Depends(require_integrations_write),
    db = Depends(get_db),
):
    if not _is_pg():
        _ensure_sqlite_tables(db)
    mapping: Dict[str, str] = json.loads(mapping_json)
    if _is_pg():
        rows = db.execute(
            text(
                """
                select id, raw from tregu.stg_inventory
                where tenant_id=:tenant_id and batch_id=:batch_id and coalesce(status,'new')='new'
                """
            ),
            {"tenant_id": principal.tenant_id, "batch_id": str(batch_id)},
        ).fetchall()
    else:
        rows = db.execute(
            text(
                """
                select id, raw from tregu_stg_inventory
                where tenant_id=:tenant_id and batch_id=:batch_id and coalesce(status,'new')='new'
                """
            ),
            {"tenant_id": principal.tenant_id, "batch_id": str(batch_id)},
        ).fetchall()

    errors_total = 0
    for r in rows:
        raw = r[1]
        if not _is_pg() and isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except Exception:
                raw = {}
        norm: Dict[str, Any] = {}
        try:
            norm["sku"] = (raw.get(mapping.get("sku", "sku")) or "").strip()
            norm["site_id"] = (raw.get(mapping.get("site_id", "site_id")) or "").strip()
            norm["bin"] = raw.get(mapping.get("bin", "bin")) or None
            norm["on_hand"] = float(raw.get(mapping.get("on_hand", "on_hand"), 0) or 0)
            norm["allocated"] = float(raw.get(mapping.get("allocated", "allocated"), 0) or 0)
            norm["lot"] = raw.get(mapping.get("lot", "lot")) or None
            norm["serial"] = raw.get(mapping.get("serial", "serial")) or None
            norm["unit_cost"] = float(raw.get(mapping.get("unit_cost", "unit_cost"), 0) or 0)
        except Exception as e:
            db.execute(
                text(
                    """
                    update tregu.stg_inventory set errors=cast(:errors as jsonb), status='rejected'
                    where id=:id
                    """
                ),
                {"errors": json.dumps([str(e)]), "id": r[0]},
            )
            errors_total += 1
            continue

        errs = []
        if not norm["sku"]:
            errs.append("Missing sku")
        if not norm["site_id"]:
            errs.append("Missing site_id")
        if errs:
            if _is_pg():
                db.execute(
                    text(
                        """
                        update tregu.stg_inventory set normalized=cast(:norm as jsonb), errors=cast(:errors as jsonb), status='rejected'
                        where id=:id
                        """
                    ),
                    {"norm": json.dumps(norm), "errors": json.dumps(errs), "id": r[0]},
                )
            else:
                db.execute(
                    text(
                        """
                        update tregu_stg_inventory set normalized=:norm, errors=:errors, status='rejected'
                        where id=:id
                        """
                    ),
                    {"norm": json.dumps(norm), "errors": json.dumps(errs), "id": r[0]},
                )
            errors_total += 1
        else:
            if _is_pg():
                db.execute(
                    text(
                        """
                        update tregu.stg_inventory set normalized=cast(:norm as jsonb), errors='[]'::jsonb, status='validated'
                        where id=:id
                        """
                    ),
                    {"norm": json.dumps(norm), "id": r[0]},
                )
            else:
                db.execute(
                    text(
                        """
                        update tregu_stg_inventory set normalized=:norm, errors=:errors, status='validated'
                        where id=:id
                        """
                    ),
                    {"norm": json.dumps(norm), "errors": json.dumps([]), "id": r[0]},
                )

    db.commit()
    return {"ok": True, "batch_id": str(batch_id), "errors": errors_total}

@router.post("/apply/inventory")
async def apply_inventory(
    batch_id: UUID = Form(...),
    principal = Depends(require_integrations_write),
    db = Depends(get_db),
):
    # Apply supports both Postgres (procedure) and SQLite fallback
    if _is_pg():
        db.execute(
            text("call tregu.apply_inventory_batch(:tenant_id, :batch_id)"),
            {"tenant_id": principal.tenant_id, "batch_id": str(batch_id)},
        )
        db.commit()
        return {"ok": True, "batch_id": str(batch_id), "applied": True}
    # SQLite fallback: upsert inventory rows
    _ensure_sqlite_tables(db)
    rows = db.execute(
        text(
            "select normalized from tregu_stg_inventory where tenant_id=:t and batch_id=:b and status='validated'"
        ),
        {"t": principal.tenant_id, "b": str(batch_id)},
    ).fetchall()
    for (norm_json,) in rows:
        n = json.loads(norm_json)
        db.execute(
            text(
                """
                insert into tregu_inventory(tenant_id, sku, site_id, bin, on_hand, allocated, lot, serial, unit_cost, updated_at)
                values (:t,:sku,:site,:bin,:on_hand,:alloc,:lot,:serial,:unit_cost, datetime('now'))
                on conflict(tenant_id, sku, site_id, bin, lot, serial) do update set
                  on_hand=excluded.on_hand,
                  allocated=excluded.allocated,
                  unit_cost=excluded.unit_cost,
                  updated_at=datetime('now')
                """
            ),
            {
                "t": principal.tenant_id,
                "sku": n.get("sku"),
                "site": n.get("site_id"),
                "bin": n.get("bin"),
                "on_hand": float(n.get("on_hand") or 0),
                "alloc": float(n.get("allocated") or 0),
                "lot": n.get("lot"),
                "serial": n.get("serial"),
                "unit_cost": float(n.get("unit_cost") or 0),
            },
        )
    db.execute(
        text(
            "update tregu_stg_inventory set status='applied' where tenant_id=:t and batch_id=:b and status='validated'"
        ),
        {"t": principal.tenant_id, "b": str(batch_id)},
    )
    db.commit()
    return {"ok": True, "batch_id": str(batch_id), "applied": True, "dialect": "sqlite"}

# Customers endpoints

@router.post("/upload/customers")
async def upload_customers(
    files: List[UploadFile] = File(...),
    source: str = Form("csv:upload"),
    principal = Depends(require_integrations_write),
    db = Depends(get_db),
):
    if not _is_pg():
        _ensure_sqlite_tables(db)
    batch_id = uuid4()
    for f in files:
        buf = await f.read()
        txt = buf.decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(txt))
        for row in reader:
            if _is_pg():
                db.execute(
                    text(
                        """
                        insert into tregu.stg_customers(tenant_id, batch_id, source, raw)
                        values (:tenant_id, :batch_id, :source, cast(:raw as jsonb))
                        """
                    ),
                    {
                        "tenant_id": principal.tenant_id,
                        "batch_id": str(batch_id),
                        "source": source,
                        "raw": json.dumps(row),
                    },
                )
            else:
                db.execute(
                    text(
                        """
                        insert into tregu_stg_customers(tenant_id, batch_id, source, raw)
                        values (:tenant_id, :batch_id, :source, :raw)
                        """
                    ),
                    {
                        "tenant_id": principal.tenant_id,
                        "batch_id": str(batch_id),
                        "source": source,
                        "raw": json.dumps(row),
                    },
                )
    db.commit()
    return {"ok": True, "batch_id": str(batch_id)}

@router.post("/map-validate/customers")
async def map_validate_customers(
    batch_id: UUID = Form(...),
    mapping_json: str = Form(...),
    principal = Depends(require_integrations_write),
    db = Depends(get_db),
):
    if not _is_pg():
        _ensure_sqlite_tables(db)
    mapping: Dict[str, str] = json.loads(mapping_json)
    if _is_pg():
        rows = db.execute(
            text(
                """
                select id, raw from tregu.stg_customers
                where tenant_id=:tenant_id and batch_id=:batch_id and coalesce(status,'new')='new'
                """
            ),
            {"tenant_id": principal.tenant_id, "batch_id": str(batch_id)},
        ).fetchall()
    else:
        rows = db.execute(
            text(
                """
                select id, raw from tregu_stg_customers
                where tenant_id=:tenant_id and batch_id=:batch_id and coalesce(status,'new')='new'
                """
            ),
            {"tenant_id": principal.tenant_id, "batch_id": str(batch_id)},
        ).fetchall()

    errors_total = 0
    for r in rows:
        raw = r[1]
        if not _is_pg() and isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except Exception:
                raw = {}
        norm: Dict[str, Any] = {}
        try:
            norm["customer_code"] = (raw.get(mapping.get("customer_code", "customer_code")) or "").strip()
            norm["name"] = (raw.get(mapping.get("name", "name")) or "").strip()
            norm["email"] = (raw.get(mapping.get("email", "email")) or "").strip() or None
            norm["phone"] = (raw.get(mapping.get("phone", "phone")) or "").strip() or None
            norm["billing_address"] = raw.get(mapping.get("billing_address", "billing_address")) or None
            norm["shipping_address"] = raw.get(mapping.get("shipping_address", "shipping_address")) or None
            tags_raw = raw.get(mapping.get("tags", "tags"))
            if tags_raw:
                norm["tags"] = [t.strip() for t in str(tags_raw).split(",") if t.strip()]
        except Exception as e:
            db.execute(
                text("update tregu.stg_customers set errors=cast(:errors as jsonb), status='rejected' where id=:id"),
                {"errors": json.dumps([str(e)]), "id": r[0]},
            )
            errors_total += 1
            continue
        errs = []
        if not norm["customer_code"]:
            errs.append("Missing customer_code")
        if not norm["name"]:
            errs.append("Missing name")
        if errs:
            if _is_pg():
                db.execute(
                    text("update tregu.stg_customers set normalized=cast(:norm as jsonb), errors=cast(:errors as jsonb), status='rejected' where id=:id"),
                    {"norm": json.dumps(norm), "errors": json.dumps(errs), "id": r[0]},
                )
            else:
                db.execute(
                    text("update tregu_stg_customers set normalized=:norm, errors=:errors, status='rejected' where id=:id"),
                    {"norm": json.dumps(norm), "errors": json.dumps(errs), "id": r[0]},
                )
            errors_total += 1
        else:
            if _is_pg():
                db.execute(
                    text("update tregu.stg_customers set normalized=cast(:norm as jsonb), errors='[]'::jsonb, status='validated' where id=:id"),
                    {"norm": json.dumps(norm), "id": r[0]},
                )
            else:
                db.execute(
                    text("update tregu_stg_customers set normalized=:norm, errors=:errors, status='validated' where id=:id"),
                    {"norm": json.dumps(norm), "errors": json.dumps([]), "id": r[0]},
                )
    db.commit()
    return {"ok": True, "batch_id": str(batch_id), "errors": errors_total}

@router.post("/apply/customers")
async def apply_customers(
    batch_id: UUID = Form(...),
    principal = Depends(require_integrations_write),
    db = Depends(get_db),
):
    # Apply supports both Postgres (procedure) and SQLite fallback
    if _is_pg():
        db.execute(
            text("call tregu.apply_customers_batch(:tenant_id, :batch_id)"),
            {"tenant_id": principal.tenant_id, "batch_id": str(batch_id)},
        )
        db.commit()
        return {"ok": True, "batch_id": str(batch_id), "applied": True}
    # SQLite fallback: upsert customers
    _ensure_sqlite_tables(db)
    rows = db.execute(
        text("select normalized from tregu_stg_customers where tenant_id=:t and batch_id=:b and status='validated'"),
        {"t": principal.tenant_id, "b": str(batch_id)},
    ).fetchall()
    for (norm_json,) in rows:
        n = json.loads(norm_json)
        db.execute(
            text(
                """
                insert into tregu_customers(tenant_id, customer_code, name, email, phone, billing_address, shipping_address, tags, attributes, created_at, updated_at)
                values (:t,:code,:name,:email,:phone,:bill,:ship,:tags,:attrs, datetime('now'), datetime('now'))
                on conflict(tenant_id, customer_code) do update set
                  name=excluded.name,
                  email=excluded.email,
                  phone=excluded.phone,
                  billing_address=excluded.billing_address,
                  shipping_address=excluded.shipping_address,
                  tags=excluded.tags,
                  attributes=excluded.attributes,
                  updated_at=datetime('now')
                """
            ),
            {
                "t": principal.tenant_id,
                "code": n.get("customer_code"),
                "name": n.get("name"),
                "email": n.get("email"),
                "phone": n.get("phone"),
                "bill": n.get("billing_address"),
                "ship": n.get("shipping_address"),
                "tags": json.dumps(n.get("tags") or []),
                "attrs": json.dumps(n.get("attributes") or {}),
            },
        )
    db.execute(
        text("update tregu_stg_customers set status='applied' where tenant_id=:t and batch_id=:b and status='validated'"),
        {"t": principal.tenant_id, "b": str(batch_id)},
    )
    db.commit()
    return {"ok": True, "batch_id": str(batch_id), "applied": True, "dialect": "sqlite"}

# Orders endpoints

@router.post("/upload/orders")
async def upload_orders(
    files: List[UploadFile] = File(...),
    source: str = Form("csv:upload"),
    principal = Depends(require_integrations_write),
    db = Depends(get_db),
):
    if not _is_pg():
        _ensure_sqlite_tables(db)
    batch_id = uuid4()
    for f in files:
        buf = await f.read()
        txt = buf.decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(txt))
        for row in reader:
            if _is_pg():
                db.execute(
                    text(
                        """
                        insert into tregu.stg_orders(tenant_id, batch_id, source, raw)
                        values (:tenant_id, :batch_id, :source, cast(:raw as jsonb))
                        """
                    ),
                    {
                        "tenant_id": principal.tenant_id,
                        "batch_id": str(batch_id),
                        "source": source,
                        "raw": json.dumps(row),
                    },
                )
            else:
                db.execute(
                    text(
                        """
                        insert into tregu_stg_orders(tenant_id, batch_id, source, raw)
                        values (:tenant_id, :batch_id, :source, :raw)
                        """
                    ),
                    {
                        "tenant_id": principal.tenant_id,
                        "batch_id": str(batch_id),
                        "source": source,
                        "raw": json.dumps(row),
                    },
                )
    db.commit()
    return {"ok": True, "batch_id": str(batch_id)}

@router.post("/map-validate/orders")
async def map_validate_orders(
    batch_id: UUID = Form(...),
    mapping_json: str = Form(...),
    principal = Depends(require_integrations_write),
    db = Depends(get_db),
):
    if not _is_pg():
        _ensure_sqlite_tables(db)
    mapping: Dict[str, str] = json.loads(mapping_json)
    if _is_pg():
        rows = db.execute(
            text(
                """
                select id, raw from tregu.stg_orders
                where tenant_id=:tenant_id and batch_id=:batch_id and coalesce(status,'new')='new'
                """
            ),
            {"tenant_id": principal.tenant_id, "batch_id": str(batch_id)},
        ).fetchall()
    else:
        rows = db.execute(
            text(
                """
                select id, raw from tregu_stg_orders
                where tenant_id=:tenant_id and batch_id=:batch_id and coalesce(status,'new')='new'
                """
            ),
            {"tenant_id": principal.tenant_id, "batch_id": str(batch_id)},
        ).fetchall()

    errors_total = 0
    for r in rows:
        raw = r[1]
        if not _is_pg() and isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except Exception:
                raw = {}
        norm: Dict[str, Any] = {}
        errs: List[str] = []
        try:
            norm["order_no"] = (raw.get(mapping.get("order_no", "order_no")) or "").strip()
            norm["customer_code"] = (raw.get(mapping.get("customer_code", "customer_code")) or "").strip()
            norm["order_date"] = (raw.get(mapping.get("order_date", "order_date")) or "").strip()
            norm["currency"] = (raw.get(mapping.get("currency", "currency")) or "").strip() or None
            norm["sku"] = (raw.get(mapping.get("sku", "sku")) or "").strip()
            qty_raw = raw.get(mapping.get("qty", "qty"), 0)
            norm["qty"] = float(qty_raw or 0)
            unit_price_raw = raw.get(mapping.get("unit_price", "unit_price"))
            norm["unit_price"] = float(unit_price_raw) if unit_price_raw not in (None, "") else None
            line_no_raw = raw.get(mapping.get("line_no", "line_no"))
            norm["line_no"] = int(line_no_raw) if line_no_raw not in (None, "") else None
        except Exception as e:
            db.execute(
                text("update tregu.stg_orders set errors=cast(:errors as jsonb), status='rejected' where id=:id"),
                {"errors": json.dumps([str(e)]), "id": r[0]},
            )
            errors_total += 1
            continue
        if not norm["order_no"]:
            errs.append("Missing order_no")
        if not norm["customer_code"]:
            errs.append("Missing customer_code")
        if not norm["order_date"]:
            errs.append("Missing order_date")
        if not norm["sku"]:
            errs.append("Missing sku")
        if norm.get("qty") is None:
            errs.append("Missing qty")

        if errs:
            if _is_pg():
                db.execute(
                    text("update tregu.stg_orders set normalized=cast(:norm as jsonb), errors=cast(:errors as jsonb), status='rejected' where id=:id"),
                    {"norm": json.dumps(norm), "errors": json.dumps(errs), "id": r[0]},
                )
            else:
                db.execute(
                    text("update tregu_stg_orders set normalized=:norm, errors=:errors, status='rejected' where id=:id"),
                    {"norm": json.dumps(norm), "errors": json.dumps(errs), "id": r[0]},
                )
            errors_total += 1
        else:
            if _is_pg():
                db.execute(
                    text("update tregu.stg_orders set normalized=cast(:norm as jsonb), errors='[]'::jsonb, status='validated' where id=:id"),
                    {"norm": json.dumps(norm), "id": r[0]},
                )
            else:
                db.execute(
                    text("update tregu_stg_orders set normalized=:norm, errors=:errors, status='validated' where id=:id"),
                    {"norm": json.dumps(norm), "errors": json.dumps([]), "id": r[0]},
                )
    db.commit()
    return {"ok": True, "batch_id": str(batch_id), "errors": errors_total}

@router.post("/apply/orders")
async def apply_orders(
    batch_id: UUID = Form(...),
    principal = Depends(require_integrations_write),
    db = Depends(get_db),
):
    if _is_pg():
        db.execute(
            text("call tregu.apply_orders_batch(:tenant_id, :batch_id)"),
            {"tenant_id": principal.tenant_id, "batch_id": str(batch_id)},
        )
        db.commit()
        return {"ok": True, "batch_id": str(batch_id), "applied": True}
    # SQLite fallback: upsert orders and lines
    _ensure_sqlite_tables(db)
    rows = db.execute(
        text("select normalized from tregu_stg_orders where tenant_id=:t and batch_id=:b and status='validated'"),
        {"t": principal.tenant_id, "b": str(batch_id)},
    ).fetchall()
    seen = set()
    for (norm_json,) in rows:
        n = json.loads(norm_json)
        ord_no = n.get("order_no")
        if ord_no in seen:
            continue
        seen.add(ord_no)
        db.execute(
            text(
                """
                insert into tregu_orders(tenant_id, order_no, customer_code, order_date, currency, attributes, created_at, updated_at)
                values (:t,:o,:c,:d,:u,:a, datetime('now'), datetime('now'))
                on conflict(tenant_id, order_no) do update set
                  customer_code=excluded.customer_code,
                  order_date=excluded.order_date,
                  currency=excluded.currency,
                  attributes=excluded.attributes,
                  updated_at=datetime('now')
                """
            ),
            {
                "t": principal.tenant_id,
                "o": ord_no,
                "c": n.get("customer_code"),
                "d": n.get("order_date"),
                "u": n.get("currency"),
                "a": json.dumps(n.get("attributes") or {}),
            },
        )
        db.execute(text("delete from tregu_order_lines where tenant_id=:t and order_no=:o"), {"t": principal.tenant_id, "o": ord_no})
    for (norm_json,) in rows:
        n = json.loads(norm_json)
        ln = n.get("line_no")
        ln = int(ln) if ln not in (None, "") else None
        if ln is None:
            cur = db.execute(text("select coalesce(max(line_no),0)+1 from tregu_order_lines where tenant_id=:t and order_no=:o"), {"t": principal.tenant_id, "o": n.get("order_no")})
            ln = list(cur.fetchone() or [1])[0]
        db.execute(
            text(
                """
                insert into tregu_order_lines(tenant_id, order_no, line_no, sku, qty, unit_price, attributes)
                values (:t,:o,:ln,:sku,:qty,:price,:attrs)
                on conflict(tenant_id, order_no, line_no) do update set
                  sku=excluded.sku,
                  qty=excluded.qty,
                  unit_price=excluded.unit_price,
                  attributes=excluded.attributes
                """
            ),
            {
                "t": principal.tenant_id,
                "o": n.get("order_no"),
                "ln": ln,
                "sku": n.get("sku"),
                "qty": float(n.get("qty") or 0),
                "price": float(n.get("unit_price")) if n.get("unit_price") not in (None, "") else None,
                "attrs": json.dumps(n.get("attributes") or {}),
            },
        )
    db.execute(text("update tregu_stg_orders set status='applied' where tenant_id=:t and batch_id=:b and status='validated'"), {"t": principal.tenant_id, "b": str(batch_id)})
    db.commit()
    return {"ok": True, "batch_id": str(batch_id), "applied": True, "dialect": "sqlite"}
