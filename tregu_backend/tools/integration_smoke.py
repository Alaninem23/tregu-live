import os, json, time
import requests


API_URL = os.environ.get("API_URL", "http://127.0.0.1:8003")
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, os.pardir))

TPL_DIR = os.path.join(ROOT, "tregu_frontend", "public", "templates")
INV_CSV = os.path.join(TPL_DIR, "inventory.csv")
CUS_CSV = os.path.join(TPL_DIR, "customers.csv")
ORD_CSV = os.path.join(TPL_DIR, "orders.csv")


def require_file(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(path)


def post_upload(path: str, endpoint: str) -> str:
    with open(path, "rb") as f:
        files = {"files": (os.path.basename(path), f, "text/csv")}
        data = {"source": "csv:upload"}
        r = requests.post(f"{API_URL}/api/integration/upload/{endpoint}", files=files, data=data, timeout=30)
        r.raise_for_status()
        j = r.json()
        return j["batch_id"]


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
    require_file(INV_CSV)
    require_file(CUS_CSV)
    require_file(ORD_CSV)

    print(f"API_URL={API_URL}")

    # Inventory
    print("[1/3] Inventory: upload")
    inv_batch = post_upload(INV_CSV, "inventory")
    print("  batch:", inv_batch)
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
    print("[1/3] Inventory: map-validate")
    mv = post_map_validate(inv_batch, "inventory", inv_mapping)
    print("  map-validate:", mv)
    print("[1/3] Inventory: apply")
    ap = post_apply(inv_batch, "inventory")
    print("  apply:", ap)

    # Customers
    print("[2/3] Customers: upload")
    cus_batch = post_upload(CUS_CSV, "customers")
    print("  batch:", cus_batch)
    cus_mapping = {
        "customer_code": "customer_code",
        "name": "name",
        "email": "email",
        "phone": "phone",
        "billing_address": "billing_address",
        "shipping_address": "shipping_address",
        "tags": "tags",
    }
    print("[2/3] Customers: map-validate")
    mv = post_map_validate(cus_batch, "customers", cus_mapping)
    print("  map-validate:", mv)
    print("[2/3] Customers: apply")
    ap = post_apply(cus_batch, "customers")
    print("  apply:", ap)

    # Orders
    print("[3/3] Orders: upload")
    ord_batch = post_upload(ORD_CSV, "orders")
    print("  batch:", ord_batch)
    ord_mapping = {
        "order_no": "order_no",
        "customer_code": "customer_code",
        "order_date": "order_date",
        "currency": "currency",
        "sku": "sku",
        "qty": "qty",
        "unit_price": "unit_price",
        # optional: line_no if present
    }
    print("[3/3] Orders: map-validate")
    mv = post_map_validate(ord_batch, "orders", ord_mapping)
    print("  map-validate:", mv)
    print("[3/3] Orders: apply")
    ap = post_apply(ord_batch, "orders")
    print("  apply:", ap)

    # Counts
    print("[Final] Canonical counts:")
    cnt = get_counts()
    print(json.dumps(cnt, indent=2))


if __name__ == "__main__":
    main()
