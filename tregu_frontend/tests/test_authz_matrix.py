def test_starter_cannot_access_inventory(client):
    r = client.get("/api/inventory/overview", headers={
        "X-Tier":"starter","X-Tenant-ID":"T1","X-User-ID":"U1","X-Roles":"read.inventory"
    })
    assert r.status_code == 403

def test_pro_can_read_finance_overview(client):
    r = client.get("/api/finance/overview", headers={
        "X-Tier":"pro","X-Tenant-ID":"T1","X-User-ID":"U1","X-Roles":""
    })
    assert r.status_code == 200

def test_pro_cannot_access_inventory_anything(client):
    r = client.get("/api/inventory/overview", headers={
        "X-Tier":"pro","X-Tenant-ID":"T1","X-User-ID":"U1","X-Roles":"read.inventory"
    })
    assert r.status_code == 403

def test_enterprise_can_read_inventory_by_tier_base(client):
    r = client.get("/api/inventory/overview", headers={
        "X-Tier":"enterprise","X-Tenant-ID":"T1","X-User-ID":"U1","X-Roles":""
    })
    assert r.status_code == 200

def test_enterprise_needs_write_perm_to_post_adjustments(client):
    r = client.post("/api/inventory/adjustments", headers={
        "X-Tier":"enterprise","X-Tenant-ID":"T1","X-User-ID":"U1","X-Roles":""
    })
    assert r.status_code == 403

def test_enterprise_ops_manager_can_post_adjustments(client):
    r = client.post("/api/inventory/adjustments", headers={
        "X-Tier":"enterprise","X-Tenant-ID":"T1","X-User-ID":"U1","X-Roles":"ops.manager"
    })
    assert r.status_code == 200

def test_rf_maintenance_enterprise_admin_has_full_access(client):
    r = client.get("/api/rf/devices", headers={
        "X-Tier":"enterprise","X-Tenant-ID":"T1","X-User-ID":"ADMIN","X-Roles":"admin.global"
    })
    assert r.status_code == 200

def test_rf_maintenance_pro_blocked_even_if_admin(client):
    r = client.get("/api/rf/devices", headers={
        "X-Tier":"pro","X-Tenant-ID":"T1","X-User-ID":"ADMIN","X-Roles":"admin.global"
    })
    assert r.status_code == 403
