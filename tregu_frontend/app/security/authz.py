from fastapi import Depends, HTTPException, status, Request
from typing import Set
from app.security.policy import TIER_SYSTEMS, TIER_BASE_PERMS, ROLE_PERMS

class Principal:
    def __init__(self, tenant_id:str, account_tier:str, user_id:str, roles:set[str], is_rf:bool=False):
        self.tenant_id = tenant_id
        self.account_tier = account_tier
        self.user_id = user_id
        self.roles = roles
        self.is_rf = is_rf

def get_principal(req: Request) -> Principal:
    tier = (req.headers.get("X-Tier") or "starter").lower()
    tenant = req.headers.get("X-Tenant-ID") or "TENANT"
    uid = req.headers.get("X-User-ID") or "USER"
    roles = set((req.headers.get("X-Roles") or "").split(",")) - {""}
    is_rf = req.headers.get("X-Auth-Mode") == "rf"
    return Principal(tenant, tier, uid, roles, is_rf)

def _expand_role_perms(roles:set[str]) -> Set[str]:
    perms: Set[str] = set()
    for r in roles:
        p = ROLE_PERMS.get(r, set())
        if "*" in p: return {"*"}
        perms |= p
    return perms

def _allows(perms:Set[str], needed:str) -> bool:
    if "*" in perms: return True
    if needed in perms: return True
    ns = needed.split(".")[0] + ".*"
    return ns in perms or ("read.*" in perms and needed.startswith("read."))

def require_system(system_id:str, needed_perm:str):
    def dep(principal: Principal = Depends(get_principal)):
        allowed_systems = set(TIER_SYSTEMS.get(principal.account_tier, []))
        if system_id not in allowed_systems:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"{system_id} not available for {principal.account_tier} tier")
        base = set(TIER_BASE_PERMS.get(principal.account_tier, set()))
        role_perms = _expand_role_perms(principal.roles)
        effective = {"*"} if "*" in role_perms else (base | role_perms)
        if not _allows(effective, needed_perm):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return principal
    return dep
