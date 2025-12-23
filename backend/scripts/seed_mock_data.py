#!/usr/bin/env python3
"""
Script para cargar datos de prueba en RafflyWin
Ejecutar: python3 /app/backend/scripts/seed_mock_data.py
"""

import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta
from uuid import uuid4
import random

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "rafflywin")

# Sample data
CREATORS = [
    {
        "full_name": "María García Tech",
        "email": "maria@creator.com",
        "description": "Creadora de contenido tech. Sorteos de gadgets, accesorios y cursos de programación.",
        "is_featured": True,
        "paypal_email": "maria.tech@paypal-sandbox.com"
    },
    {
        "full_name": "Carlos Gamer Pro",
        "email": "carlos.gamer@creator.com",
        "description": "Streamer y gamer profesional. Rifas de consolas, juegos y equipamiento gaming.",
        "is_featured": True,
        "paypal_email": "carlos.gamer@paypal-sandbox.com"
    },
    {
        "full_name": "Laura Fitness",
        "email": "laura@creator.com",
        "description": "Entrenadora personal certificada. Sorteos de suplementos, equipamiento deportivo y planes de entrenamiento.",
        "is_featured": True,
        "paypal_email": "laura.fitness@paypal-sandbox.com"
    },
    {
        "full_name": "Diego Chef",
        "email": "diego.chef@creator.com",
        "description": "Chef profesional y creador culinario. Rifas de utensilios de cocina, cursos y experiencias gastronómicas.",
        "is_featured": False,
        "paypal_email": "diego.chef@paypal-sandbox.com"
    },
    {
        "full_name": "Sofia Travel",
        "email": "sofia@creator.com",
        "description": "Travel blogger y fotógrafa. Sorteos de equipos de fotografía, maletas y experiencias de viaje.",
        "is_featured": False,
        "paypal_email": "sofia.travel@paypal-sandbox.com"
    }
]

USERS = [
    {"full_name": "Juan Pérez", "email": "juan@test.com"},
    {"full_name": "Ana López", "email": "ana@test.com"},
    {"full_name": "Roberto Martínez", "email": "roberto@test.com"},
    {"full_name": "Carmen Silva", "email": "carmen@test.com"},
    {"full_name": "Luis Torres", "email": "luis@test.com"},
    {"full_name": "Patricia Ruiz", "email": "patricia@test.com"},
    {"full_name": "Miguel Sánchez", "email": "miguel@test.com"},
    {"full_name": "Isabel García", "email": "isabel@test.com"},
]

RAFFLE_TEMPLATES = [
    {"title": "iPhone 15 Pro Max", "description": "El último iPhone con chip A17 Pro, cámara de 48MP y titanio.", "price": 15, "range": 500},
    {"title": "PlayStation 5 + 3 Juegos", "description": "Consola PS5 con 3 juegos exclusivos a elección.", "price": 10, "range": 400},
    {"title": "MacBook Air M3", "description": "Laptop ultraligera con el nuevo chip M3 de Apple.", "price": 20, "range": 300},
    {"title": "Samsung Galaxy S24 Ultra", "description": "Smartphone premium con S Pen y cámara de 200MP.", "price": 12, "range": 450},
    {"title": "Nintendo Switch OLED", "description": "Consola híbrida con pantalla OLED de 7 pulgadas.", "price": 8, "range": 350},
    {"title": "iPad Pro 12.9", "description": "Tablet profesional con chip M2 y pantalla Liquid Retina XDR.", "price": 18, "range": 250},
    {"title": "AirPods Pro 2", "description": "Auriculares con cancelación de ruido activa y audio espacial.", "price": 5, "range": 600},
    {"title": "DJI Mini 3 Pro", "description": "Dron compacto con cámara 4K y sensores de obstáculos.", "price": 15, "range": 200},
    {"title": "GoPro Hero 12", "description": "Cámara de acción 5.3K con estabilización HyperSmooth.", "price": 8, "range": 300},
    {"title": "Xbox Series X", "description": "Consola de última generación con 1TB y Game Pass Ultimate.", "price": 10, "range": 400},
]

POST_TEMPLATES = [
    "¡Nuevo sorteo disponible! 🎉 No te lo pierdas.",
    "Gracias a todos por el apoyo. ¡Pronto habrá más premios! 💪",
    "Preparando algo especial para ustedes... 👀",
    "¡Felicidades al ganador del último sorteo! 🏆",
    "Nueva semana, nuevas oportunidades de ganar 🎁",
    "¿Listos para el próximo sorteo? 🚀",
    "Increíble la respuesta que hemos tenido. ¡Gracias! ❤️",
    "Recuerden participar antes de que se agoten los tickets ⏰",
]

SAMPLE_IMAGES = [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800",
    "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800",
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800",
    "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800",
    "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800",
]


async def seed_database():
    print("🚀 Conectando a MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    password_hash = pwd_context.hash("test123")
    created_users = []
    created_creators = []
    
    # Create Super Admin
    print("\n👑 Creando Super Admin...")
    admin = {
        "id": str(uuid4()),
        "email": "admin@rafflywin.com",
        "password": password_hash,
        "full_name": "Super Admin",
        "role": "super_admin",
        "is_active": True,
        "is_featured": False,
        "followers": [],
        "following": [],
        "created_at": datetime.now(timezone.utc)
    }
    await db.users.update_one({"email": admin["email"]}, {"$set": admin}, upsert=True)
    print(f"   ✅ {admin['full_name']} ({admin['email']})")
    
    # Create Creators
    print("\n🎨 Creando Creadores...")
    for creator_data in CREATORS:
        creator = {
            "id": str(uuid4()),
            "email": creator_data["email"],
            "password": password_hash,
            "full_name": creator_data["full_name"],
            "description": creator_data["description"],
            "role": "creator",
            "is_active": True,
            "is_featured": creator_data["is_featured"],
            "rating": round(random.uniform(4.0, 5.0), 1),
            "rating_count": random.randint(10, 100),
            "followers": [],
            "following": [],
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(30, 180))
        }
        await db.users.update_one({"email": creator["email"]}, {"$set": creator}, upsert=True)
        created_creators.append(creator)
        status = "⭐" if creator["is_featured"] else "  "
        print(f"   {status} ✅ {creator['full_name']} ({creator['email']})")
    
    # Create Users
    print("\n👥 Creando Usuarios...")
    for user_data in USERS:
        user = {
            "id": str(uuid4()),
            "email": user_data["email"],
            "password": password_hash,
            "full_name": user_data["full_name"],
            "role": "user",
            "is_active": True,
            "followers": [],
            "following": [],
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 90))
        }
        await db.users.update_one({"email": user["email"]}, {"$set": user}, upsert=True)
        created_users.append(user)
        print(f"   ✅ {user['full_name']} ({user['email']})")
    
    # Add followers to creators
    print("\n🔗 Agregando seguidores...")
    for creator in created_creators:
        num_followers = random.randint(3, len(created_users))
        followers = random.sample([u["id"] for u in created_users], num_followers)
        await db.users.update_one({"id": creator["id"]}, {"$set": {"followers": followers}})
        print(f"   ✅ {creator['full_name']}: {num_followers} seguidores")
    
    # Create Raffles
    print("\n🎟️ Creando Rifas...")
    raffle_count = 0
    for creator in created_creators:
        num_raffles = random.randint(2, 4)
        selected_raffles = random.sample(RAFFLE_TEMPLATES, num_raffles)
        
        for i, raffle_template in enumerate(selected_raffles):
            raffle_date = datetime.now(timezone.utc) + timedelta(days=random.randint(3, 30))
            tickets_sold = random.randint(10, raffle_template["range"] // 2)
            
            raffle = {
                "id": str(uuid4()),
                "creator_id": creator["id"],
                "creator_name": creator["full_name"],
                "title": raffle_template["title"],
                "description": raffle_template["description"],
                "images": [SAMPLE_IMAGES[i % len(SAMPLE_IMAGES)]],
                "ticket_price": raffle_template["price"],
                "ticket_range": raffle_template["range"],
                "tickets_sold": tickets_sold,
                "status": "active",
                "raffle_date": raffle_date,
                "likes_count": random.randint(5, 50),
                "comments_count": random.randint(0, 20),
                "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 20))
            }
            await db.raffles.insert_one(raffle)
            raffle_count += 1
            print(f"   🎫 {raffle['title']} por {creator['full_name']}")
    
    # Create Posts
    print("\n📝 Creando Posts...")
    post_count = 0
    for creator in created_creators:
        num_posts = random.randint(2, 5)
        for _ in range(num_posts):
            post = {
                "id": str(uuid4()),
                "creator_id": creator["id"],
                "content": random.choice(POST_TEMPLATES),
                "images": [random.choice(SAMPLE_IMAGES)] if random.random() > 0.3 else [],
                "likes_count": random.randint(5, 100),
                "comments_count": random.randint(0, 30),
                "shares_count": random.randint(0, 20),
                "is_story": False,
                "expires_at": None,
                "created_at": datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 72))
            }
            await db.posts.insert_one(post)
            post_count += 1
        print(f"   ✅ {creator['full_name']}: {num_posts} posts")
    
    # Create tickets
    print("\n🎫 Creando Tickets...")
    raffles = await db.raffles.find({}, {"_id": 0}).to_list(None)
    ticket_count = 0
    for user in created_users[:4]:
        num_purchases = random.randint(1, 3)
        selected_raffles = random.sample(raffles, min(num_purchases, len(raffles)))
        
        for raffle in selected_raffles:
            num_tickets = random.randint(1, 5)
            for i in range(num_tickets):
                ticket = {
                    "id": str(uuid4()),
                    "raffle_id": raffle["id"],
                    "user_id": user["id"],
                    "creator_id": raffle["creator_id"],
                    "ticket_number": random.randint(1, raffle["ticket_range"]),
                    "price": raffle["ticket_price"],
                    "status": "active",
                    "created_at": datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48))
                }
                await db.tickets.insert_one(ticket)
                ticket_count += 1
        print(f"   ✅ {user['full_name']}: compras realizadas")
    
    # Create comments
    print("\n💬 Creando Comentarios...")
    comment_count = 0
    for raffle in raffles[:5]:
        num_comments = random.randint(2, 5)
        for _ in range(num_comments):
            commenter = random.choice(created_users)
            comment = {
                "id": str(uuid4()),
                "user_id": commenter["id"],
                "target_id": raffle["id"],
                "target_type": "raffle",
                "content": random.choice([
                    "¡Increíble sorteo! 🔥",
                    "Ojalá gane esta vez 🤞",
                    "Qué buen premio!",
                    "Ya compré mis tickets 🎟️",
                    "Suerte a todos!",
                ]),
                "parent_id": None,
                "likes_count": random.randint(0, 10),
                "created_at": datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 24))
            }
            await db.comments.insert_one(comment)
            comment_count += 1
    print(f"   ✅ {comment_count} comentarios creados")
    
    # Summary
    print("\n" + "="*50)
    print("📊 RESUMEN DE DATOS CREADOS")
    print("="*50)
    print(f"   👑 Super Admin: 1")
    print(f"   🎨 Creadores: {len(CREATORS)}")
    print(f"   👥 Usuarios: {len(USERS)}")
    print(f"   🎟️ Rifas: {raffle_count}")
    print(f"   📝 Posts: {post_count}")
    print(f"   🎫 Tickets: {ticket_count}")
    print(f"   💬 Comentarios: {comment_count}")
    print("="*50)
    print("\n🔐 CREDENCIALES (password: test123)")
    print("="*50)
    print("   Admin:   admin@rafflywin.com")
    print("   Creator: maria@creator.com")
    print("   User:    juan@test.com")
    print("="*50)
    print("\n✅ ¡Mock data cargado!")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
