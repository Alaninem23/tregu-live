# app/routers/ai.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from sqlalchemy.sql import func
from typing import List
import os

# Instrument OpenAI for tracing (optional)
try:
    from opentelemetry.instrumentation.openai import OpenAIInstrumentor
    OpenAIInstrumentor().instrument()
except ImportError:
    pass  # OpenTelemetry not available, skip instrumentation

from app.db import SessionLocal
# Import AI messenger models
from app.models.ai_messenger import AICharacter, ChatConversation, ChatMessage
# Import AI messenger schemas
from app.schemas.ai_messenger import AICharacter as AICharacterSchema, AICharacterCreate, ChatRequest, ChatResponse, ChatConversation as ChatConversationSchema, ChatConversationCreate
from ..auth_deps import get_current_user, get_current_user_optional

router = APIRouter(tags=["ai"])

_client = None
_api_key = os.getenv("OPENAI_API_KEY")
if _api_key:
    try:
        from openai import OpenAI
        _client = OpenAI(api_key=_api_key)
    except ImportError:
        _client = None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize default AI characters if they don't exist
def init_default_characters(db: Session):
    if db.query(AICharacter).count() == 0:
        characters = [
            AICharacter(
                name="Tregu Assistant",
                avatar_url="/avatars/tregu-assistant.png",
                personality="A helpful and knowledgeable assistant for the Tregu platform, specializing in inventory management, business operations, and user support.",
                system_prompt="You are Tregu Assistant, a helpful AI companion for the Tregu inventory management platform. You help users with inventory management, business operations, and provide general assistance. Be friendly, professional, and knowledgeable about inventory systems, business management, and the Tregu platform features."
            ),
            AICharacter(
                name="Inventory Expert",
                avatar_url="/avatars/inventory-expert.png",
                personality="A specialized AI expert in inventory management, logistics, and supply chain optimization.",
                system_prompt="You are an Inventory Expert specializing in inventory management, logistics, and supply chain optimization. Provide detailed advice on inventory best practices, stock management, demand forecasting, and operational efficiency. Use your expertise to help users optimize their inventory operations."
            ),
            AICharacter(
                name="Business Advisor",
                avatar_url="/avatars/business-advisor.png",
                personality="A business strategy and operations consultant focused on helping businesses grow and optimize their operations.",
                system_prompt="You are a Business Advisor specializing in business strategy, operations optimization, and growth planning. Help users with business planning, operational improvements, market analysis, and strategic decision-making. Provide actionable insights and recommendations."
            )
        ]
        for char in characters:
            db.add(char)
        db.commit()

@router.get("/characters")
async def get_characters(db: Session = Depends(get_db)):
    """Get all available AI characters"""
    characters = db.query(AICharacter).filter(AICharacter.is_active == True).all()
    return characters

@router.post("/characters", response_model=AICharacterSchema)
async def create_character(
    req: AICharacterCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new AI character (sellers only)"""
    if current_user.role not in ["seller", "admin"]:
        raise HTTPException(403, "Only sellers can create AI characters")

    character = AICharacter(
        name=req.name,
        avatar_url=req.avatar_url,
        personality=req.personality,
        system_prompt=req.system_prompt,
        is_active=req.is_active
    )
    db.add(character)
    db.commit()
    db.refresh(character)
    return character

@router.put("/characters/{character_id}", response_model=AICharacterSchema)
async def update_character(
    character_id: int,
    req: AICharacterCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an AI character (owner or admin only)"""
    character = db.query(AICharacter).filter(AICharacter.id == character_id).first()
    if not character:
        raise HTTPException(404, "Character not found")

    # Allow update if user is admin or if they created the character (for now, allow sellers to update any)
    if current_user.role not in ["seller", "admin"]:
        raise HTTPException(403, "Only sellers can modify AI characters")

    character.name = req.name
    character.avatar_url = req.avatar_url
    character.personality = req.personality
    character.system_prompt = req.system_prompt
    character.is_active = req.is_active

    db.commit()
    db.refresh(character)
    return character

@router.delete("/characters/{character_id}")
async def delete_character(
    character_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an AI character (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(403, "Only admins can delete AI characters")

    character = db.query(AICharacter).filter(AICharacter.id == character_id).first()
    if not character:
        raise HTTPException(404, "Character not found")

    # Don't allow deletion of default characters
    default_names = ["Tregu Assistant", "Inventory Expert", "Business Advisor"]
    if character.name in default_names:
        raise HTTPException(403, "Cannot delete default characters")

    character.is_active = False  # Soft delete
    db.commit()

    return {"message": "Character deactivated"}

@router.get("/conversations", response_model=List[ChatConversationSchema])
async def get_conversations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """Get user's chat conversations - returns empty list if not authenticated"""
    if not current_user:
        return []

    conversations = (
        db.query(ChatConversation)
        .filter(ChatConversation.user_id == current_user.id)
        .order_by(desc(ChatConversation.updated_at))
        .all()
    )

    result = []
    for conv in conversations:
        character = db.query(AICharacter).filter(AICharacter.id == conv.character_id).first()
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.conversation_id == conv.id)
            .order_by(ChatMessage.created_at)
            .all()
        )
        result.append(ChatConversationSchema(
            id=conv.id,
            user_id=conv.user_id,
            character_id=conv.character_id,
            title=conv.title,
            messages=messages,
            character=character,
            created_at=conv.created_at,
            updated_at=conv.updated_at
        ))
    return result

@router.post("/conversations", response_model=ChatConversationSchema)
async def create_conversation(
    req: ChatConversationCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat conversation"""
    conversation = ChatConversation(
        user_id=current_user.id,
        character_id=req.character_id,
        title=req.title
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    character = db.query(AICharacter).filter(AICharacter.id == req.character_id).first()
    return ChatConversationSchema(
        id=conversation.id,
        user_id=conversation.user_id,
        character_id=conversation.character_id,
        title=conversation.title,
        messages=[],
        character=character,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at
    )

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chat conversation"""
    conversation = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(404, "Conversation not found")

    # Delete all messages in the conversation
    db.query(ChatMessage).filter(ChatMessage.conversation_id == conversation_id).delete()

    # Delete the conversation
    db.delete(conversation)
    db.commit()

    return {"message": "Conversation deleted"}

@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    current_user = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Send a chat message and get AI response"""
    if _client is None:
        raise HTTPException(500, "OPENAI_API_KEY not set on server")

    # Get character
    character = db.query(AICharacter).filter(AICharacter.id == req.character_id).first()
    if not character:
        raise HTTPException(404, "Character not found")

    # Handle conversation logic only for authenticated users
    conversation = None
    if current_user:
        # Get or create conversation for authenticated user
        if req.conversation_id:
            conversation = db.query(ChatConversation).filter(
                ChatConversation.id == req.conversation_id,
                ChatConversation.user_id == current_user.id
            ).first()
            if not conversation:
                raise HTTPException(404, "Conversation not found")
        else:
            conversation = ChatConversation(
                user_id=current_user.id,
                character_id=req.character_id,
                title=f"Chat with {req.message[:50]}..." if len(req.message) > 50 else req.message
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

    # Prepare messages for OpenAI
    openai_messages = [
        {"role": "system", "content": character.system_prompt}
    ]

    # Add conversation history only for authenticated users
    if current_user and conversation:
        # Save user message
        user_message = ChatMessage(
            conversation_id=conversation.id,
            role="user",
            content=req.message
        )
        db.add(user_message)

        # Get conversation history for context
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.conversation_id == conversation.id)
            .order_by(ChatMessage.created_at)
            .all()
        )

        # Add recent conversation history (last 10 messages to avoid token limits)
        for msg in messages[-10:]:
            openai_messages.append({
                "role": msg.role,
                "content": msg.content
            })
    else:
        # For unauthenticated users, just add the current message
        openai_messages.append({
            "role": "user",
            "content": req.message
        })

    try:
        result = _client.chat.completions.create(
            model="gpt-4o-mini",
            messages=openai_messages,
            max_tokens=1000,
            temperature=0.7
        )

        reply = result.choices[0].message.content or ""

        # Save AI response only for authenticated users
        if current_user and conversation:
            ai_message = ChatMessage(
                conversation_id=conversation.id,
                role="assistant",
                content=reply
            )
            db.add(ai_message)

            # Update conversation timestamp
            conversation.updated_at = func.now()
            db.commit()

        return ChatResponse(
            reply=reply,
            conversation_id=conversation.id if conversation else None,
            character_name=character.name,
            avatar_url=character.avatar_url
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"AI error: {e}")

# Legacy endpoint for backward compatibility
@router.post("/chat/simple")
async def simple_chat(req: ChatRequest):
    """Simple chat endpoint for backward compatibility"""
    if _client is None:
        raise HTTPException(500, "OPENAI_API_KEY not set on server")
    try:
        result = _client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are the helpful Tregu assistant."},
                {"role": "user", "content": req.message},
            ],
        )
        reply = result.choices[0].message.content or ""
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(500, f"AI error: {e}")

# Seller Strategy Algorithm
@router.post("/seller-strategy")
async def generate_seller_strategy(business_data: dict, current_user: dict = Depends(get_current_user)):
    """
    Generate personalized seller strategy based on business data
    """
    try:
        category = business_data.get("category", "General")
        location = business_data.get("location", "")
        target_market = business_data.get("target_market", "")
        current_pricing = business_data.get("current_pricing", "")

        # Strategy generation algorithm
        strategies = {
            "Technology": {
                "target_audience": ["Startups", "Mid-size companies", "Enterprise clients", "Tech incubators"],
                "pricing_strategy": "Premium tier with usage-based scaling ($500-$5000/month)",
                "market_position": "Innovation leader in cloud and digital transformation",
                "growth_tactics": [
                    "Partner with local tech accelerators",
                    "Offer free technical consultations",
                    "Build portfolio of successful case studies",
                    "Attend industry conferences and networking events",
                    "Create educational content about emerging technologies"
                ],
                "competitive_advantages": [
                    "Technical expertise and certifications",
                    "Proven track record of successful implementations",
                    "24/7 technical support availability",
                    "Custom solution development capability"
                ]
            },
            "Consulting": {
                "target_audience": ["Small businesses", "Growing companies", "Non-profits", "Government agencies"],
                "pricing_strategy": "Value-based pricing with retainers ($200-$1000/hour)",
                "market_position": "Trusted advisor for business growth and optimization",
                "growth_tactics": [
                    "Specialize in specific industry niches",
                    "Build strong local business network",
                    "Offer free initial strategy sessions",
                    "Create thought leadership content",
                    "Develop referral partner program"
                ],
                "competitive_advantages": [
                    "Deep industry knowledge and experience",
                    "Proven methodologies and frameworks",
                    "Strong network of business contacts",
                    "Ability to deliver measurable results"
                ]
            },
            "Finance": {
                "target_audience": ["High-net-worth individuals", "Small business owners", "Corporate executives", "Family offices"],
                "pricing_strategy": "Commission-based with management fees ($1000-$10000/month)",
                "market_position": "Comprehensive wealth management and financial planning expert",
                "growth_tactics": [
                    "Obtain advanced financial planning certifications",
                    "Build referral network with accountants and attorneys",
                    "Host free financial education seminars",
                    "Specialize in retirement and tax planning",
                    "Create financial planning content and blog"
                ],
                "competitive_advantages": [
                    "Professional certifications and licenses",
                    "Comprehensive service offering",
                    "Strong track record of client success",
                    "Regulatory compliance and risk management"
                ]
            },
            "Healthcare": {
                "target_audience": ["Medical practices", "Healthcare facilities", "Health tech companies", "Healthcare administrators"],
                "pricing_strategy": "Enterprise solutions with custom pricing ($5000-$50000/month)",
                "market_position": "Healthcare innovation and compliance partner",
                "growth_tactics": [
                    "Maintain strict HIPAA compliance",
                    "Partner with medical associations and networks",
                    "Focus on telemedicine and digital health solutions",
                    "Build healthcare-specific case studies",
                    "Attend healthcare industry conferences"
                ],
                "competitive_advantages": [
                    "Healthcare industry expertise",
                    "Regulatory compliance knowledge",
                    "Integration with medical systems",
                    "Patient privacy and security focus"
                ]
            },
            "Manufacturing": {
                "target_audience": ["Industrial companies", "Construction firms", "Retail manufacturers", "Supply chain managers"],
                "pricing_strategy": "Project-based with volume discounts ($10000-$200000)",
                "market_position": "Quality manufacturing and supply chain solutions provider",
                "growth_tactics": [
                    "Invest in sustainable and green manufacturing",
                    "Obtain industry certifications and standards",
                    "Offer prototyping and custom manufacturing services",
                    "Build strategic supplier partnerships",
                    "Implement lean manufacturing practices"
                ],
                "competitive_advantages": [
                    "Advanced manufacturing capabilities",
                    "Quality control and certification",
                    "Supply chain optimization expertise",
                    "Sustainable manufacturing practices"
                ]
            },
            "Education": {
                "target_audience": ["Corporate training departments", "Educational institutions", "Professional development", "Skill development programs"],
                "pricing_strategy": "Subscription-based with enterprise discounts ($50-$1000/user/month)",
                "market_position": "Learning and development solutions expert",
                "growth_tactics": [
                    "Create micro-learning and mobile-friendly content",
                    "Partner with universities and educational institutions",
                    "Offer certification and accreditation programs",
                    "Focus on emerging skills and technologies",
                    "Develop customized corporate training programs"
                ],
                "competitive_advantages": [
                    "Educational content development expertise",
                    "Industry-recognized certifications",
                    "Customizable learning solutions",
                    "Track record of learner success"
                ]
            }
        }

        # Get strategy for category or use general strategy
        strategy = strategies.get(category, {
            "target_audience": ["Local businesses", "Startups", "Growing companies", "Industry professionals"],
            "pricing_strategy": "Competitive market rates with value-based adjustments",
            "market_position": "Reliable and professional service provider",
            "growth_tactics": [
                "Build strong local reputation and network",
                "Offer referral discounts and incentives",
                "Create loyalty programs for repeat business",
                "Focus on delivering exceptional customer service",
                "Invest in professional development and certifications"
            ],
            "competitive_advantages": [
                "Personalized service and attention",
                "Strong work ethic and reliability",
                "Local market knowledge and connections",
                "Flexibility and adaptability to client needs"
            ]
        })

        # Enhance strategy based on location data
        if location:
            location_insights = []
            if "san francisco" in location.lower() or "silicon valley" in location.lower():
                location_insights.append("Leverage proximity to tech innovation hub")
                location_insights.append("Network with venture capital and startup communities")
            elif "new york" in location.lower():
                location_insights.append("Capitalize on financial services industry presence")
                location_insights.append("Connect with media and advertising networks")
            elif "los angeles" in location.lower():
                location_insights.append("Tap into entertainment and creative industries")
                location_insights.append("Build relationships with production companies")

            if location_insights:
                strategy["location_insights"] = location_insights

        # Generate AI-powered recommendations using OpenAI if available
        ai_recommendations = []
        if _client and target_market:
            try:
                prompt = f"Based on being a {category} business targeting {target_market}, provide 3 specific marketing recommendations:"
                result = _client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a marketing strategist. Provide concise, actionable recommendations."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=200
                )
                ai_response = result.choices[0].message.content or ""
                ai_recommendations = [rec.strip() for rec in ai_response.split('\n') if rec.strip()][:3]
            except Exception as e:
                print(f"AI recommendation error: {e}")

        if ai_recommendations:
            strategy["ai_recommendations"] = ai_recommendations

        return {
            "category": category,
            "strategy": strategy,
            "generated_at": "2025-01-13T12:00:00Z",
            "confidence_score": 0.85
        }

    except Exception as e:
        raise HTTPException(500, f"Strategy generation error: {e}")

# Control Plane Routes
import uuid
from enum import Enum, auto
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from fastapi import Body
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
        
        self.registered_nodes[node.node_id] = node
        return node.node_id

    def get_node(self, node_id: uuid.UUID) -> Optional[TenantNode]:
        """Retrieve a node by its ID"""
        return self.registered_nodes.get(node_id)

# Global singleton registry
REGISTRY = NetworkRegistry()

# Authentication and Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_network_registry():
    """Dependency injection for network registry (singleton)"""
    return REGISTRY

@router.post("/nodes/register")
async def register_node(
    node: TenantNode, 
    network_registry: NetworkRegistry = Depends(get_network_registry),
    token: str = Depends(oauth2_scheme)
):
    """Register a new tenant node in the Tregu network"""
    # TODO: Implement proper token validation
    node_id = network_registry.register_node(node)
    return {"status": "success", "node_id": node_id}

@router.post("/plugins/install")
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

