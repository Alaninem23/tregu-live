SYSTEMS = [
  "finance","p2p","otc","inventory","wms","manufacturing","tms","planning",
  "crm","projects","analytics","integrations","admin","rf"
]

TIER_SYSTEMS = {
  "starter": [],
  "pro": ["finance","p2p","otc","crm","analytics","integrations"],
  "enterprise": SYSTEMS,
}

TIER_BASE_PERMS = {
  "starter": set(),
  "pro": {"read.finance","read.p2p","read.otc","read.crm","read.analytics","read.integrations"},
  "enterprise": {f"read.{s}" for s in SYSTEMS} | {"rf.*"},
}

ROLE_PERMS = {
  "admin.global": {"*"},
  "ops.manager":  {"read.*","write.p2p","write.otc","write.inventory","write.wms"},
  "ops.user":     {"read.*"},
  "finance.controller": {"read.finance","write.finance","read.analytics"},
}
