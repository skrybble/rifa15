from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import jwt
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import random
from enum import Enum
import base64
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Enums
class UserRole(str, Enum):
    USER = "user"
    CREATOR = "creator"
    ADMIN = "admin"

class RaffleStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TicketRange(int, Enum):
    RANGE_100 = 100
    RANGE_300 = 300
    RANGE_500 = 500
    RANGE_1000 = 1000

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.USER
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    description: Optional[str] = None
    interests: List[str] = Field(default_factory=list)
    followers: List[str] = Field(default_factory=list)
    following: List[str] = Field(default_factory=list)
    rating: float = 0.0
    rating_count: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.USER
    interests: List[str] = Field(default_factory=list)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Raffle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    creator_id: str
    title: str
    description: str
    images: List[str] = Field(default_factory=list)
    ticket_range: int
    ticket_price: float
    raffle_date: datetime
    categories: List[str] = Field(default_factory=list)
    status: RaffleStatus = RaffleStatus.ACTIVE
    tickets_sold: int = 0
    winning_number: Optional[int] = None
    winner_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RaffleCreate(BaseModel):
    title: str
    description: str
    ticket_range: int
    ticket_price: float
    raffle_date: str
    categories: List[str]

class Ticket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    raffle_id: str
    user_id: str
    creator_id: str
    ticket_number: int
    amount: float
    purchased_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TicketPurchase(BaseModel):
    raffle_id: str
    quantity: int
    payment_token: str

class Rating(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    creator_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_user_id: str
    to_user_id: str
    subject: str
    content: str
    parent_id: Optional[str] = None
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageCreate(BaseModel):
    to_user_id: str
    subject: str
    content: str
    parent_id: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token inválido")

def prepare_for_mongo(data: dict) -> dict:
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('raffle_date'), datetime):
        data['raffle_date'] = data['raffle_date'].isoformat()
    if isinstance(data.get('purchased_at'), datetime):
        data['purchased_at'] = data['purchased_at'].isoformat()
    return data

def parse_from_mongo(item: dict) -> dict:
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('raffle_date'), str):
        item['raffle_date'] = datetime.fromisoformat(item['raffle_date'])
    if isinstance(item.get('purchased_at'), str):
        item['purchased_at'] = datetime.fromisoformat(item['purchased_at'])
    return item

async def create_notification(user_id: str, title: str, message: str, type: str):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type
    )
    doc = prepare_for_mongo(notification.model_dump())
    await db.notifications.insert_one(doc)

# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    hashed_pw = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        interests=user_data.interests
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hashed_pw
    doc = prepare_for_mongo(user_dict)
    
    await db.users.insert_one(doc)
    
    token = create_token(user.id, user.email, user.role)
    return {"token": token, "user": user}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    user_doc = parse_from_mongo(user_doc)
    user = User(**user_doc)
    
    token = create_token(user.id, user.email, user.role)
    return {"token": token, "user": user}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Raffle endpoints
@api_router.post("/raffles")
async def create_raffle(
    title: str = Form(...),
    description: str = Form(...),
    ticket_range: int = Form(...),
    ticket_price: float = Form(...),
    raffle_date: str = Form(...),
    categories: str = Form(...),
    images: List[UploadFile] = File([]),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.CREATOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Solo los creadores pueden crear rifas")
    
    # Parse date
    raffle_datetime = datetime.fromisoformat(raffle_date.replace('Z', '+00:00'))
    
    # Check if there are already 3 raffles ending on this date for this creator
    raffle_date_only = raffle_datetime.date()
    start_of_day = datetime.combine(raffle_date_only, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_of_day = datetime.combine(raffle_date_only, datetime.max.time()).replace(tzinfo=timezone.utc)
    
    raffles_on_same_day = await db.raffles.count_documents({
        "creator_id": current_user.id,
        "raffle_date": {
            "$gte": start_of_day.isoformat(),
            "$lte": end_of_day.isoformat()
        }
    })
    
    if raffles_on_same_day >= 3:
        raise HTTPException(
            status_code=400, 
            detail=f"Ya tienes 3 rifas programadas para finalizar el {raffle_date_only.strftime('%d/%m/%Y')}. Por favor selecciona otra fecha de finalización."
        )
    
    # Check time restriction (3 hours before daily draw)
    draw_time = raffle_datetime.replace(hour=18, minute=0, second=0, microsecond=0)
    time_limit = draw_time - timedelta(hours=3)
    if datetime.now(timezone.utc) > time_limit and raffle_datetime.date() == datetime.now(timezone.utc).date():
        raise HTTPException(status_code=400, detail="No se pueden crear rifas con menos de 3 horas antes del sorteo")
    
    # Save images
    image_paths = []
    for image in images:
        if image.filename:
            file_ext = image.filename.split('.')[-1]
            filename = f"{uuid.uuid4()}.{file_ext}"
            filepath = UPLOADS_DIR / filename
            content = await image.read()
            with open(filepath, 'wb') as f:
                f.write(content)
            image_paths.append(f"/uploads/{filename}")
    
    # Parse categories
    categories_list = [cat.strip() for cat in categories.split(',') if cat.strip()]
    
    raffle = Raffle(
        creator_id=current_user.id,
        title=title,
        description=description,
        images=image_paths,
        ticket_range=ticket_range,
        ticket_price=ticket_price,
        raffle_date=raffle_datetime,
        categories=categories_list
    )
    
    doc = prepare_for_mongo(raffle.model_dump())
    await db.raffles.insert_one(doc)
    
    # Notify followers
    followers = await db.users.find({"following": current_user.id}, {"_id": 0, "id": 1}).to_list(None)
    for follower in followers:
        await create_notification(
            follower['id'],
            "Nueva Rifa Disponible",
            f"{current_user.full_name} ha creado una nueva rifa: {title}",
            "new_raffle"
        )
    
    return raffle

@api_router.get("/raffles", response_model=List[Raffle])
async def get_raffles(status: Optional[str] = None, creator_id: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if creator_id:
        query["creator_id"] = creator_id
    
    raffles = await db.raffles.find(query, {"_id": 0}).to_list(None)
    return [parse_from_mongo(r) for r in raffles]

@api_router.get("/raffles/{raffle_id}", response_model=Raffle)
async def get_raffle(raffle_id: str):
    raffle = await db.raffles.find_one({"id": raffle_id}, {"_id": 0})
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa no encontrada")
    return parse_from_mongo(raffle)

# Ticket endpoints
@api_router.post("/tickets/purchase")
async def purchase_tickets(
    purchase: TicketPurchase,
    current_user: User = Depends(get_current_user)
):
    raffle = await db.raffles.find_one({"id": purchase.raffle_id}, {"_id": 0})
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa no encontrada")
    
    raffle = parse_from_mongo(raffle)
    raffle_obj = Raffle(**raffle)
    
    if raffle_obj.status != RaffleStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="La rifa no está activa")
    
    # Check if tickets available
    sold_tickets = await db.tickets.count_documents({"raffle_id": purchase.raffle_id})
    if sold_tickets + purchase.quantity > raffle_obj.ticket_range:
        raise HTTPException(status_code=400, detail="No hay suficientes tickets disponibles")
    
    # Get existing ticket numbers
    existing = await db.tickets.find({"raffle_id": purchase.raffle_id}, {"_id": 0, "ticket_number": 1}).to_list(None)
    used_numbers = set([t['ticket_number'] for t in existing])
    
    # Generate random ticket numbers
    available = [n for n in range(1, raffle_obj.ticket_range + 1) if n not in used_numbers]
    if len(available) < purchase.quantity:
        raise HTTPException(status_code=400, detail="No hay suficientes tickets disponibles")
    
    selected_numbers = random.sample(available, purchase.quantity)
    
    # Create tickets
    tickets = []
    total_amount = purchase.quantity * raffle_obj.ticket_price
    
    for number in selected_numbers:
        ticket = Ticket(
            raffle_id=purchase.raffle_id,
            user_id=current_user.id,
            creator_id=raffle_obj.creator_id,
            ticket_number=number,
            amount=raffle_obj.ticket_price
        )
        doc = prepare_for_mongo(ticket.model_dump())
        await db.tickets.insert_one(doc)
        tickets.append(ticket)
    
    # Update raffle tickets sold
    await db.raffles.update_one(
        {"id": purchase.raffle_id},
        {"$set": {"tickets_sold": sold_tickets + purchase.quantity}}
    )
    
    # Notify user
    await create_notification(
        current_user.id,
        "Compra Exitosa",
        f"Has comprado {purchase.quantity} ticket(s) para {raffle_obj.title}",
        "purchase"
    )
    
    return {"tickets": tickets, "total": total_amount}

@api_router.get("/tickets/my-tickets", response_model=List[Ticket])
async def get_my_tickets(current_user: User = Depends(get_current_user)):
    tickets = await db.tickets.find({"user_id": current_user.id}, {"_id": 0}).to_list(None)
    return [parse_from_mongo(t) for t in tickets]

@api_router.get("/tickets/raffle/{raffle_id}")
async def get_raffle_tickets(raffle_id: str, current_user: User = Depends(get_current_user)):
    tickets = await db.tickets.find({"raffle_id": raffle_id, "user_id": current_user.id}, {"_id": 0}).to_list(None)
    return [parse_from_mongo(t) for t in tickets]

@api_router.get("/raffles/{raffle_id}/participants")
async def get_raffle_participants(raffle_id: str, current_user: User = Depends(get_current_user)):
    # Check if user is creator of this raffle or admin
    raffle = await db.raffles.find_one({"id": raffle_id}, {"_id": 0})
    if not raffle:
        raise HTTPException(status_code=404, detail="Rifa no encontrada")
    
    if current_user.role != UserRole.ADMIN and raffle["creator_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver esta información")
    
    # Get all tickets for this raffle
    tickets = await db.tickets.find({"raffle_id": raffle_id}, {"_id": 0}).to_list(None)
    
    # Group by user
    participants = {}
    for ticket in tickets:
        ticket = parse_from_mongo(ticket)
        user_id = ticket['user_id']
        
        if user_id not in participants:
            # Get user info
            user = await db.users.find_one({"id": user_id}, {"_id": 0, "full_name": 1, "email": 1})
            participants[user_id] = {
                "user_id": user_id,
                "user_name": user.get("full_name", "Usuario desconocido") if user else "Usuario desconocido",
                "user_email": user.get("email", "") if user else "",
                "tickets": [],
                "total_amount": 0,
                "tickets_count": 0,
                "first_purchase": ticket['purchased_at']
            }
        
        participants[user_id]["tickets"].append({
            "ticket_id": ticket['id'],
            "ticket_number": ticket['ticket_number'],
            "amount": ticket['amount'],
            "purchased_at": ticket['purchased_at']
        })
        participants[user_id]["total_amount"] += ticket['amount']
        participants[user_id]["tickets_count"] += 1
    
    return list(participants.values())

# User/Creator endpoints
@api_router.get("/creators", response_model=List[User])
async def get_creators():
    creators = await db.users.find({"role": UserRole.CREATOR, "is_active": True}, {"_id": 0, "password": 0}).to_list(None)
    return [parse_from_mongo(u) for u in creators]

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return parse_from_mongo(user)

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, current_user: User = Depends(get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes seguirte a ti mismo")
    
    # Add to following
    await db.users.update_one(
        {"id": current_user.id},
        {"$addToSet": {"following": user_id}}
    )
    
    # Add to followers
    await db.users.update_one(
        {"id": user_id},
        {"$addToSet": {"followers": current_user.id}}
    )
    
    return {"message": "Siguiendo exitosamente"}

@api_router.post("/users/{user_id}/unfollow")
async def unfollow_user(user_id: str, current_user: User = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user.id},
        {"$pull": {"following": user_id}}
    )
    
    await db.users.update_one(
        {"id": user_id},
        {"$pull": {"followers": current_user.id}}
    )
    
    return {"message": "Dejaste de seguir"}

@api_router.post("/users/{creator_id}/rate")
async def rate_creator(
    creator_id: str,
    rating: int = Form(...),
    comment: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="La calificación debe estar entre 1 y 5")
    
    # Check if user has purchased tickets from this creator
    has_purchased = await db.tickets.find_one({"user_id": current_user.id, "creator_id": creator_id})
    if not has_purchased:
        raise HTTPException(status_code=400, detail="Solo puedes calificar creadores de quienes compraste tickets")
    
    # Check if already rated - update if exists
    existing = await db.ratings.find_one({"user_id": current_user.id, "creator_id": creator_id})
    
    if existing:
        # Update existing rating
        await db.ratings.update_one(
            {"user_id": current_user.id, "creator_id": creator_id},
            {"$set": {"rating": rating, "comment": comment}}
        )
    else:
        # Create new rating
        rating_obj = Rating(
            user_id=current_user.id,
            creator_id=creator_id,
            rating=rating,
            comment=comment
        )
        doc = prepare_for_mongo(rating_obj.model_dump())
        await db.ratings.insert_one(doc)
    
    # Update creator rating
    ratings = await db.ratings.find({"creator_id": creator_id}, {"_id": 0, "rating": 1}).to_list(None)
    avg_rating = sum([r['rating'] for r in ratings]) / len(ratings)
    
    await db.users.update_one(
        {"id": creator_id},
        {"$set": {"rating": avg_rating, "rating_count": len(ratings)}}
    )
    
    return {"message": "Calificación enviada exitosamente"}

@api_router.get("/users/{creator_id}/ratings")
async def get_creator_ratings(creator_id: str):
    ratings = await db.ratings.find({"creator_id": creator_id}, {"_id": 0}).to_list(None)
    
    # Get user names for each rating
    for rating in ratings:
        user = await db.users.find_one({"id": rating["user_id"]}, {"_id": 0, "full_name": 1})
        if user:
            rating["user_name"] = user["full_name"]
    
    return [parse_from_mongo(r) for r in ratings]

# Notifications
@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return [parse_from_mongo(n) for n in notifications]

@api_router.post("/notifications/{notification_id}/read")
async def mark_read(notification_id: str, current_user: User = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user.id},
        {"$set": {"read": True}}
    )
    return {"message": "Notificación marcada como leída"}

# Admin endpoints
@api_router.post("/admin/draw")
async def manual_draw(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores")
    
    await run_daily_draw()
    return {"message": "Sorteo ejecutado"}

# Draw function
async def run_daily_draw():
    now = datetime.now(timezone.utc)
    
    # Get active raffles for today
    raffles = await db.raffles.find({
        "status": RaffleStatus.ACTIVE,
        "raffle_date": {"$lte": now.isoformat()}
    }, {"_id": 0}).to_list(None)
    
    # Group by ticket range
    winning_numbers = {
        100: random.randint(1, 100),
        300: random.randint(1, 300),
        500: random.randint(1, 500),
        1000: random.randint(1, 1000)
    }
    
    for raffle in raffles:
        raffle = parse_from_mongo(raffle)
        raffle_obj = Raffle(**raffle)
        
        winning_num = winning_numbers[raffle_obj.ticket_range]
        
        # Find winner
        winner_ticket = await db.tickets.find_one({
            "raffle_id": raffle_obj.id,
            "ticket_number": winning_num
        }, {"_id": 0})
        
        winner_id = winner_ticket['user_id'] if winner_ticket else None
        
        # Update raffle
        await db.raffles.update_one(
            {"id": raffle_obj.id},
            {"$set": {
                "status": RaffleStatus.COMPLETED,
                "winning_number": winning_num,
                "winner_id": winner_id
            }}
        )
        
        # Notify participants
        participants = await db.tickets.find({"raffle_id": raffle_obj.id}, {"_id": 0, "user_id": 1}).to_list(None)
        unique_users = list(set([p['user_id'] for p in participants]))
        
        for user_id in unique_users:
            if winner_id and user_id == winner_id:
                await create_notification(
                    user_id,
                    "¡Ganaste!",
                    f"¡Felicidades! Ganaste la rifa '{raffle_obj.title}' con el número {winning_num}",
                    "winner"
                )
            else:
                await create_notification(
                    user_id,
                    "Resultados del Sorteo",
                    f"El número ganador de '{raffle_obj.title}' fue {winning_num}",
                    "draw_result"
                )
        
        # Notify creator
        await create_notification(
            raffle_obj.creator_id,
            "Rifa Completada",
            f"Tu rifa '{raffle_obj.title}' ha finalizado. Número ganador: {winning_num}",
            "raffle_completed"
        )

# Dashboard stats
@api_router.get("/dashboard/creator-stats")
async def get_creator_stats(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.CREATOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Solo creadores")
    
    raffles = await db.raffles.find({"creator_id": current_user.id}, {"_id": 0}).to_list(None)
    tickets = await db.tickets.find({"creator_id": current_user.id}, {"_id": 0}).to_list(None)
    
    total_earnings = sum([t['amount'] for t in tickets])
    commission = total_earnings * 0.01
    net_earnings = total_earnings - commission
    
    active_raffles = len([r for r in raffles if r['status'] == RaffleStatus.ACTIVE])
    completed_raffles = len([r for r in raffles if r['status'] == RaffleStatus.COMPLETED])
    
    return {
        "total_raffles": len(raffles),
        "active_raffles": active_raffles,
        "completed_raffles": completed_raffles,
        "total_tickets_sold": len(tickets),
        "total_earnings": total_earnings,
        "commission": commission,
        "net_earnings": net_earnings
    }

@api_router.get("/dashboard/admin-stats")
async def get_admin_stats(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores")
    
    total_users = await db.users.count_documents({"role": UserRole.USER})
    total_creators = await db.users.count_documents({"role": UserRole.CREATOR})
    total_raffles = await db.raffles.count_documents({})
    active_raffles = await db.raffles.count_documents({"status": RaffleStatus.ACTIVE})
    
    tickets = await db.tickets.find({}, {"_id": 0, "amount": 1}).to_list(None)
    total_revenue = sum([t['amount'] for t in tickets])
    commission_revenue = total_revenue * 0.01
    
    return {
        "total_users": total_users,
        "total_creators": total_creators,
        "total_raffles": total_raffles,
        "active_raffles": active_raffles,
        "total_revenue": total_revenue,
        "commission_revenue": commission_revenue
    }

# New Admin Endpoints
@api_router.get("/admin/commissions")
async def get_commissions(
    creator_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores")
    
    query = {}
    if creator_id:
        query["creator_id"] = creator_id
    
    tickets = await db.tickets.find(query, {"_id": 0}).to_list(None)
    
    # Filter by date if provided
    if start_date or end_date:
        filtered_tickets = []
        for ticket in tickets:
            ticket = parse_from_mongo(ticket)
            ticket_date = ticket['purchased_at']
            
            if start_date:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                if ticket_date < start:
                    continue
            
            if end_date:
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                if ticket_date > end:
                    continue
            
            filtered_tickets.append(ticket)
        tickets = filtered_tickets
    
    # Group by creator
    commissions_by_creator = {}
    for ticket in tickets:
        creator_id = ticket['creator_id']
        if creator_id not in commissions_by_creator:
            commissions_by_creator[creator_id] = {
                "creator_id": creator_id,
                "total_sales": 0,
                "commission": 0,
                "tickets_count": 0
            }
        
        commissions_by_creator[creator_id]["total_sales"] += ticket['amount']
        commissions_by_creator[creator_id]["commission"] += ticket['amount'] * 0.01
        commissions_by_creator[creator_id]["tickets_count"] += 1
    
    # Get creator names
    for commission in commissions_by_creator.values():
        creator = await db.users.find_one({"id": commission["creator_id"]}, {"_id": 0, "full_name": 1})
        if creator:
            commission["creator_name"] = creator["full_name"]
    
    return list(commissions_by_creator.values())

@api_router.post("/admin/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    new_status = not user.get("is_active", True)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": new_status}}
    )
    
    return {"message": f"Usuario {'activado' if new_status else 'desactivado'}", "is_active": new_status}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores")
    
    # Delete user's raffles, tickets, ratings, notifications, messages
    await db.raffles.delete_many({"creator_id": user_id})
    await db.tickets.delete_many({"user_id": user_id})
    await db.ratings.delete_many({"user_id": user_id})
    await db.notifications.delete_many({"user_id": user_id})
    await db.messages.delete_many({"$or": [{"from_user_id": user_id}, {"to_user_id": user_id}]})
    
    # Delete user
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {"message": "Usuario eliminado exitosamente"}

@api_router.get("/admin/creator/{creator_id}/raffles-count")
async def get_creator_raffles_count(creator_id: str):
    count = await db.raffles.count_documents({"creator_id": creator_id})
    return {"count": count}

# Messaging System
@api_router.post("/messages")
async def send_message(message_data: MessageCreate, current_user: User = Depends(get_current_user)):
    message = Message(
        from_user_id=current_user.id,
        to_user_id=message_data.to_user_id,
        subject=message_data.subject,
        content=message_data.content,
        parent_id=message_data.parent_id
    )
    
    doc = prepare_for_mongo(message.model_dump())
    await db.messages.insert_one(doc)
    
    # Create notification for recipient
    await create_notification(
        message_data.to_user_id,
        "Nuevo Mensaje",
        f"{current_user.full_name} te ha enviado un mensaje: {message_data.subject}",
        "message"
    )
    
    return message

@api_router.get("/messages")
async def get_messages(current_user: User = Depends(get_current_user)):
    messages = await db.messages.find(
        {"$or": [{"from_user_id": current_user.id}, {"to_user_id": current_user.id}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(None)
    
    # Get sender/receiver names
    for msg in messages:
        from_user = await db.users.find_one({"id": msg["from_user_id"]}, {"_id": 0, "full_name": 1})
        to_user = await db.users.find_one({"id": msg["to_user_id"]}, {"_id": 0, "full_name": 1})
        
        if from_user:
            msg["from_user_name"] = from_user["full_name"]
        if to_user:
            msg["to_user_name"] = to_user["full_name"]
    
    return [parse_from_mongo(m) for m in messages]

@api_router.post("/messages/{message_id}/read")
async def mark_message_read(message_id: str, current_user: User = Depends(get_current_user)):
    await db.messages.update_one(
        {"id": message_id, "to_user_id": current_user.id},
        {"$set": {"read": True}}
    )
    return {"message": "Mensaje marcado como leído"}

@api_router.get("/messages/unread-count")
async def get_unread_messages_count(current_user: User = Depends(get_current_user)):
    count = await db.messages.count_documents({"to_user_id": current_user.id, "read": False})
    return {"count": count}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize scheduler
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    # Schedule daily draw at 6:00 PM (18:00)
    scheduler.add_job(
        run_daily_draw,
        CronTrigger(hour=18, minute=0, timezone='UTC'),
        id='daily_raffle_draw',
        name='Daily Raffle Draw at 6 PM',
        replace_existing=True
    )
    scheduler.start()
    logger.info("Scheduler started - Daily draw scheduled at 18:00 UTC")

@app.on_event("shutdown")
async def shutdown_db_client():
    scheduler.shutdown()
    client.close()