import os, json, io
import requests

API_URL = os.environ.get("API_URL", "http://127.0.0.1:8003")

def post_upload_bytes(name: str, content: bytes, endpoint: str) -> str:
    files = {"files": (name, io.BytesIO(content), "text/csv")}
    data = {"source": "csv:ci"}
    r = requests.post(f"{API_URL}/api/integration/upload/{endpoint}", files=files, data=data, timeout=30)
    r.raise_for_status()
    return r.json()["batch_id"]

def post_map_validate(batch_id: str, endpoint: str, mapping: dict):
    data = {"batch_id": batch_id, "mapping_json": json.dumps(mapping)}
    r = requests.post(f"{API_URL}/api/integration/map-validate/{endpoint}", data=data, timeout=60)
    r.raise_for_status()
    return r.json()

def post_apply(batch_id: str, endpoint: str):
    data = {"batch_id": batch_id}
    r = requests.post(f"{API_URL}/api/integration/apply/{endpoint}", data=data, timeout=60)
    r.raise_for_status()
    return r.json()

def get_counts():
    r = requests.get(f"{API_URL}/api/integration/debug/counts", timeout=15)
    r.raise_for_status()
    return r.json()

def main():
    # Minimal CSVs for smoke
    inv_csv = b"sku,site_id,bin,on_hand,allocated,lot,serial,unit_cost\nSKU1,SITE1,,5,0,,,1.99\nSKU2,SITE1,A1,1,0,,,3.50\n"
    cus_csv = b"customer_code,name,email,phone,billing_address,shipping_address,tags\nCUST1,Acme,ops@acme.com,,1 Main St,2 State St,wholesale\n"
    ord_csv = (
        b"order_no,customer_code,order_date,currency,sku,qty,unit_price\n"
        b"ORD1,CUST1,2025-01-01,USD,SKU1,1,2.00\n"
        b"ORD1,CUST1,2025-01-01,USD,SKU2,1,3.50\n"
    )

    print(f"API_URL={API_URL}")

    # Inventory
    inv_batch = post_upload_bytes("inventory.csv", inv_csv, "inventory")
    post_map_validate(inv_batch, "inventory", {
        "sku": "sku", "site_id": "site_id", "bin": "bin",
        "on_hand": "on_hand", "allocated": "allocated",
        "lot": "lot", "serial": "serial", "unit_cost": "unit_cost"
    })
    post_apply(inv_batch, "inventory")

    # Customers
    cus_batch = post_upload_bytes("customers.csv", cus_csv, "customers")
    post_map_validate(cus_batch, "customers", {
        "customer_code": "customer_code", "name": "name", "email": "email",
        "phone": "phone", "billing_address": "billing_address",
        "shipping_address": "shipping_address", "tags": "tags"
    })
    post_apply(cus_batch, "customers")

    # Orders
    ord_batch = post_upload_bytes("orders.csv", ord_csv, "orders")
    post_map_validate(ord_batch, "orders", {
        "order_no": "order_no", "customer_code": "customer_code",
        "order_date": "order_date", "currency": "currency",
        "sku": "sku", "qty": "qty", "unit_price": "unit_price"
    })
    post_apply(ord_batch, "orders")

    # Counts
    counts = get_counts()
    print(json.dumps(counts, indent=2))

    # Basic assertions for CI
    assert counts.get("ok") is True
    assert counts.get("inventory", 0) >= 2
    assert counts.get("customers", 0) >= 1
    assert counts.get("orders", 0) >= 1
    assert counts.get("order_lines", 0) >= 2
    print("SMOKE_OK")

if __name__ == "__main__":
    main()
