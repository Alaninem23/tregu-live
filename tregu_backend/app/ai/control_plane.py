# Tregu Decentralized Commerce Platform
# Core Architecture Components

import uuid
from enum import Enum, auto
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.security import OAuth2PasswordBearer

# Tenant Tier Definitions
class TenantTier(Enum):
    STARTER = auto()
    PRO = auto()
    ENTERPRISE = auto()

# Node Configuration Model
class NodeConfig(BaseModel):
    """Configuration for a Tregu commerce node"""
    node_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    tenant_tier: TenantTier
    is_dedicated: bool = False
    region: str
    sync_capabilities: Dict[str, bool] = {
        "catalog_share": False,
        "vendor_directory": False,
        "availability_routing": False,
        "direct_peering": False
    }

# Plugin Management
class PluginManifest(BaseModel):
    """Defines the structure for a Tregu platform plugin"""
    plugin_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    name: str
    version: str
    tier_compatibility: List[TenantTier]
    is_marketplace: bool = True
    requires_approval: bool = True
    runtime_type: str = "in_process"  # in_process, microservice, etc.

class InstallPluginRequest(BaseModel):
    node_id: uuid.UUID
    plugin: PluginManifest

# Tenant Node Representation
class TenantNode(BaseModel):
    """Represents a tenant's node in the Tregu network"""
    tenant_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    node_config: NodeConfig
    active_plugins: List[PluginManifest] = []
    
    def can_install_plugin(self, plugin: PluginManifest) -> bool:
        """Determine if a plugin can be installed based on tenant tier"""
        if self.node_config.tenant_tier == TenantTier.STARTER:
            return plugin.tier_compatibility == [TenantTier.STARTER] and plugin.is_marketplace
        
        if self.node_config.tenant_tier == TenantTier.PRO:
            return (TenantTier.PRO in plugin.tier_compatibility and 
                    plugin.is_marketplace and 
                    plugin.runtime_type == "microservice")
        
        # Enterprise has full flexibility
        return True

# Network Management Service
class NetworkRegistry:
    """Manages node registration, discovery, and network-level operations"""
    def __init__(self):
        self.registered_nodes: Dict[uuid.UUID, TenantNode] = {}
    
    def register_node(self, node: TenantNode):
        """Register a new node in the network"""
        # Validate node configuration
        if node.tenant_id in self.registered_nodes:
            raise HTTPException(status_code=400, detail="Node already registered")
        
        # Enforce policy: dedicated nodes are Enterprise-only
        if node.node_config.is_dedicated and node.node_config.tenant_tier != TenantTier.ENTERPRISE:
            raise HTTPException(status_code=403, detail="Dedicated nodes are Enterprise-only")
        
        self.registered_nodes[node.tenant_id] = node
        return node.node_id

    def get_node(self, node_id: uuid.UUID) -> Optional[TenantNode]:
        """Retrieve a node by its ID"""
        return self.registered_nodes.get(node_id)

# Global singleton registry
REGISTRY = NetworkRegistry()

# FastAPI Application Setup
app = FastAPI(
    title="Tregu Decentralized Commerce Platform",
    description="Democratizing enterprise-level commerce infrastructure",
    version="0.1.0"
)

# Include AI router
# from app.routers.ai import router as ai_router
# app.include_router(ai_router)

# Authentication and Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_network_registry():
    """Dependency injection for network registry (singleton)"""
    return REGISTRY

@app.post("/nodes/register")
async def register_node(
    node: TenantNode, 
    network_registry: NetworkRegistry = Depends(get_network_registry),
    token: str = Depends(oauth2_scheme)
):
    """Register a new tenant node in the Tregu network"""
    # TODO: Implement proper token validation
    node_id = network_registry.register_node(node)
    return {"status": "success", "node_id": node_id}

@app.post("/plugins/install")
async def install_plugin(
    payload: InstallPluginRequest = Body(...),
    network_registry: NetworkRegistry = Depends(get_network_registry),
    token: str = Depends(oauth2_scheme)
):
    node = network_registry.get_node(payload.node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    if not node.can_install_plugin(payload.plugin):
        raise HTTPException(status_code=403, detail="Plugin not compatible with tenant tier")

    node.active_plugins.append(payload.plugin)
    return {
        "status": "success",
        "message": f"Installed {payload.plugin.name}",
        "node_id": str(payload.node_id)
    }

# Core Mission Statement
TREGU_MISSION = """
Democratize access to enterprise-level commerce infrastructure, 
allowing any business to scale up without dependency on IT.
"""

# Example Usage
def main():
    # Example of creating a node configuration
    starter_node_config = NodeConfig(
        tenant_tier=TenantTier.STARTER,
        region="us-west-2",
        is_dedicated=False
    )
    
    starter_node = TenantNode(node_config=starter_node_config)
    
    # Example of a marketplace plugin
    marketplace_plugin = PluginManifest(
        name="Basic Inventory Sync",
        version="1.0.0",
        tier_compatibility=[TenantTier.STARTER, TenantTier.PRO],
        runtime_type="in_process"
    )

if __name__ == "__main__":
    main()