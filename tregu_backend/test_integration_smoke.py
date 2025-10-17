import io
import json
from fastapi.testclient import TestClient


def test_integration_smoke_inventory_customers_orders():
    # Import app here to ensure any environment variables are considered
    from app.main import app  # noqa

    client = TestClient(app)

    # Inventory CSV (2 rows)
    inv_csv = (
        "sku,site_id,bin,on_hand,allocated,lot,serial,unit_cost\n"
        "SKU-1,SITE-A,,10,2,, ,5.5\n"
        "SKU-2,SITE-A,BIN-1,3,0,, ,1.25\n"
    ).encode("utf-8")
    inv_files = [("files", ("inventory.csv", io.BytesIO(inv_csv), "text/csv"))]
    r = client.post("/api/integration/upload/inventory", files=inv_files)
    assert r.status_code == 200, r.text
    inv_batch = r.json()["batch_id"]

    inv_mapping = {
        "sku": "sku",
        "site_id": "site_id",
        "bin": "bin",
        "on_hand": "on_hand",
        "allocated": "allocated",
        "lot": "lot",
        "serial": "serial",
        "unit_cost": "unit_cost",
    }
    r = client.post(
        "/api/integration/map-validate/inventory",
        data={"batch_id": inv_batch, "mapping_json": json.dumps(inv_mapping)},
    )
    assert r.status_code == 200, r.text
    assert r.json()["errors"] == 0

    r = client.post(
        "/api/integration/apply/inventory",
        data={"batch_id": inv_batch},
    )
    assert r.status_code == 200, r.text
    assert r.json().get("applied") is True

    # Customers CSV (1 row)
    cust_csv = (
        "customer_code,name,email,phone,billing_address,shipping_address,tags\n"
        "CUST-1,Acme Inc,ops@acme.io,,123 Road,123 Road,wholesale,vip\n"
    ).encode("utf-8")
    cust_files = [("files", ("customers.csv", io.BytesIO(cust_csv), "text/csv"))]
    r = client.post("/api/integration/upload/customers", files=cust_files)
    assert r.status_code == 200, r.text
    cust_batch = r.json()["batch_id"]

    cust_mapping = {
        "customer_code": "customer_code",
        "name": "name",
        "email": "email",
        "phone": "phone",
        "billing_address": "billing_address",
        "shipping_address": "shipping_address",
        "tags": "tags",
    }
    r = client.post(
        "/api/integration/map-validate/customers",
        data={"batch_id": cust_batch, "mapping_json": json.dumps(cust_mapping)},
    )
    assert r.status_code == 200, r.text
    assert r.json()["errors"] == 0

    r = client.post(
        "/api/integration/apply/customers",
        data={"batch_id": cust_batch},
    )
    assert r.status_code == 200, r.text
    assert r.json().get("applied") is True

    # Orders CSV (1 order with 2 lines)
    orders_csv = (
        "order_no,customer_code,order_date,currency,line_no,sku,qty,unit_price\n"
        "ORD-1,CUST-1,2025-01-01,USD,1,SKU-1,1,9.99\n"
        "ORD-1,CUST-1,2025-01-01,USD,2,SKU-2,2,1.25\n"
    ).encode("utf-8")
    order_files = [("files", ("orders.csv", io.BytesIO(orders_csv), "text/csv"))]
    r = client.post("/api/integration/upload/orders", files=order_files)
    assert r.status_code == 200, r.text
    ord_batch = r.json()["batch_id"]

    ord_mapping = {
        "order_no": "order_no",
        "customer_code": "customer_code",
        "order_date": "order_date",
        "currency": "currency",
        "line_no": "line_no",
        "sku": "sku",
        "qty": "qty",
        "unit_price": "unit_price",
    }
    r = client.post(
        "/api/integration/map-validate/orders",
        data={"batch_id": ord_batch, "mapping_json": json.dumps(ord_mapping)},
    )
    assert r.status_code == 200, r.text
    assert r.json()["errors"] == 0

    r = client.post(
        "/api/integration/apply/orders",
        data={"batch_id": ord_batch},
    )
    assert r.status_code == 200, r.text
    assert r.json().get("applied") is True

    # Final counts should match 2 inventory, 1 customer, 1 order, 2 lines
    r = client.get("/api/integration/debug/counts")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["inventory"] >= 2  # allow >= in case of prior runs against sqlite file
    assert data["customers"] >= 1
    assert data["orders"] >= 1
    assert data["order_lines"] >= 2
