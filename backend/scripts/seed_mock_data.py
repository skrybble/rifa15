#!/usr/bin/env python3
"""
Script para inyectar datos de prueba en RafflyWin
Ejecutar: python scripts/seed_mock_data.py
"""

import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from uuid import uuid4
import random

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / '.env')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# ============================================
# CONFIGURACIÓN DE DATOS
# ============================================

# Contraseña por defecto para todos los usuarios de prueba
DEFAULT_PASSWORD = "test123"

# Usuarios de prueba
MOCK_USERS = [
    # Super Admin
    {
        "role": "super_admin",
        "full_name": "Admin RafflyWin",
        "email": "admin@rafflywin.com",
        "description": "Administrador de la plataforma RafflyWin",
        "interests": ["Tecnología", "Gaming", "Deportes"],
    },
    # Creadores
    {
        "role": "creator",
        "full_name": "Carlos Tech",
        "email": "carlos@creator.com",
        "description": "Creador de contenido de tecnología. Reviews, unboxings y sorteos de gadgets.",
        "interests": ["Tecnología", "Gaming", "Fotografía"],
        "followers_count": 15000,
        "rating": 4.8,
    },
    {
        "role": "creator",
        "full_name": "María Gaming",
        "email": "maria@creator.com",
        "description": "Streamer y gamer profesional. ¡Participa en mis rifas y gana increíbles premios gaming!",
        "interests": ["Gaming", "Tecnología", "Entretenimiento"],
        "followers_count": 28000,
        "rating": 4.9,
    },
    {
        "role": "creator",
        "full_name": "Pedro Fitness",
        "email": "pedro@creator.com",
        "description": "Coach de fitness y nutrición. Sorteos de suplementos y equipamiento deportivo.",
        "interests": ["Fitness", "Deportes", "Lifestyle"],
        "followers_count": 8500,
        "rating": 4.6,
    },
    {
        "role": "creator",
        "full_name": "Ana Belleza",
        "email": "ana@creator.com",
        "description": "Influencer de belleza y moda. Rifas de productos de skincare y maquillaje.",
        "interests": ["Belleza", "Moda", "Lifestyle"],
        "followers_count": 45000,
        "rating": 4.7,
    },
    {
        "role": "creator",
        "full_name": "Luis Viajes",
        "email": "luis@creator.com",
        "description": "Travel blogger. ¡Sorteos de viajes y experiencias únicas!",
        "interests": ["Viajes", "Fotografía", "Gastronomía"],
        "followers_count": 32000,
        "rating": 4.5,
    },
    # Usuarios regulares
    {
        "role": "user",
        "full_name": "Juan Pérez",
        "email": "juan@user.com",
        "description": "Amante de la tecnología",
        "interests": ["Tecnología", "Gaming", "Música"],
    },
    {
        "role": "user",
        "full_name": "Laura García",
        "email": "laura@user.com",
        "description": "Fan de los sorteos",
        "interests": ["Belleza", "Moda", "Viajes"],
    },
    {
        "role": "user",
        "full_name": "Diego Martínez",
        "email": "diego@user.com",
        "description": "Gamer casual",
        "interests": ["Gaming", "Deportes", "Tecnología"],
    },
    {
        "role": "user",
        "full_name": "Sofía López",
        "email": "sofia@user.com",
        "description": "Fitness lover",
        "interests": ["Fitness", "Belleza", "Lifestyle"],
    },
    {
        "role": "user",
        "full_name": "Andrés Rodríguez",
        "email": "andres@user.com",
        "description": "Viajero frecuente",
        "interests": ["Viajes", "Gastronomía", "Fotografía"],
    },
]

# Rifas de prueba (serán asignadas a los creadores)
MOCK_RAFFLES = [
    {
        "title": "iPhone 15 Pro Max 256GB",
        "description": "¡Participa y gana el último iPhone! Incluye cargador y funda original Apple. Envío gratis a todo el país.",
        "prize_value": 1299.99,
        "ticket_price": 5.00,
        "ticket_range": 500,
        "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800",
        "category": "Tecnología",
        "days_until_draw": 7,
    },
    {
        "title": "PlayStation 5 + 3 Juegos",
        "description": "PS5 edición estándar con disco. Incluye Spider-Man 2, God of War Ragnarok y FIFA 24.",
        "prize_value": 650.00,
        "ticket_price": 3.00,
        "ticket_range": 300,
        "image_url": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800",
        "category": "Gaming",
        "days_until_draw": 5,
    },
    {
        "title": "MacBook Air M3",
        "description": "MacBook Air con chip M3, 8GB RAM, 256GB SSD. Color Midnight. ¡Perfecto para trabajo y estudio!",
        "prize_value": 1099.00,
        "ticket_price": 10.00,
        "ticket_range": 300,
        "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
        "category": "Tecnología",
        "days_until_draw": 10,
    },
    {
        "title": "Set Completo de Gym",
        "description": "Mancuernas ajustables, banco de ejercicios, bandas de resistencia y colchoneta premium.",
        "prize_value": 450.00,
        "ticket_price": 2.00,
        "ticket_range": 300,
        "image_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
        "category": "Fitness",
        "days_until_draw": 3,
    },
    {
        "title": "Viaje a Cancún para 2",
        "description": "5 noches en hotel todo incluido + vuelos. Válido por 6 meses. ¡Vive la experiencia caribeña!",
        "prize_value": 2500.00,
        "ticket_price": 15.00,
        "ticket_range": 500,
        "image_url": "https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800",
        "category": "Viajes",
        "days_until_draw": 14,
    },
    {
        "title": "Kit de Maquillaje Profesional",
        "description": "Paletas de sombras, bases, labiales y brochas de marcas premium. Valorado en más de $500.",
        "prize_value": 500.00,
        "ticket_price": 2.50,
        "ticket_range": 300,
        "image_url": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800",
        "category": "Belleza",
        "days_until_draw": 4,
    },
    {
        "title": "Nintendo Switch OLED + 5 Juegos",
        "description": "Switch OLED blanco con Zelda TOTK, Mario Kart 8, Smash Bros, Animal Crossing y Pokemon.",
        "prize_value": 550.00,
        "ticket_price": 3.00,
        "ticket_range": 300,
        "image_url": "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800",
        "category": "Gaming",
        "days_until_draw": 6,
    },
    {
        "title": "Cámara Sony A7 IV",
        "description": "Cámara mirrorless full frame con lente kit 28-70mm. Para fotógrafos y videógrafos profesionales.",
        "prize_value": 2800.00,
        "ticket_price": 20.00,
        "ticket_range": 500,
        "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
        "category": "Fotografía",
        "days_until_draw": 12,
    },
    # Rifas completadas (para historial)
    {
        "title": "AirPods Pro 2",
        "description": "AirPods Pro 2da generación con estuche MagSafe.",
        "prize_value": 249.00,
        "ticket_price": 2.00,
        "ticket_range": 100,
        "image_url": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800",
        "category": "Tecnología",
        "days_until_draw": -5,  # Ya pasó - completada
        "status": "completed",
    },
    {
        "title": "Xbox Series X",
        "description": "Consola Xbox Series X 1TB.",
        "prize_value": 499.00,
        "ticket_price": 5.00,
        "ticket_range": 100,
        "image_url": "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800",
        "category": "Gaming",
        "days_until_draw": -10,  # Ya pasó - completada
        "status": "completed",
    },
]


async def clear_database():
    """Limpiar todas las colecciones"""
    print("🗑️  Limpiando base de datos...")
    await db.users.delete_many({})
    await db.raffles.delete_many({})
    await db.tickets.delete_many({})
    await db.messages.delete_many({})
    await db.notifications.delete_many({})
    print("✅ Base de datos limpia")


async def create_users():
    """Crear usuarios de prueba"""
    print("\n👥 Creando usuarios...")
    users = {}
    
    for user_data in MOCK_USERS:
        user_id = str(uuid4())
        hashed_password = pwd_context.hash(DEFAULT_PASSWORD)
        
        user = {
            "id": user_id,
            "email": user_data["email"],
            "password": hashed_password,
            "full_name": user_data["full_name"],
            "role": user_data["role"],
            "description": user_data.get("description", ""),
            "interests": user_data.get("interests", []),
            "followers": [],
            "following": [],
            "followers_count": user_data.get("followers_count", 0),
            "following_count": 0,
            "rating": user_data.get("rating", 0),
            "ratings_count": random.randint(10, 100) if user_data.get("rating") else 0,
            "is_active": True,
            "notifications_enabled": True,
            "messaging_enabled": True,
            "blocked_users": [],
            "payment_methods": [],
            "profile_image": None,
            "cover_image": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        await db.users.insert_one(user)
        users[user_data["email"]] = user
        print(f"   ✅ {user_data['role'].upper()}: {user_data['email']}")
    
    return users


async def create_raffles(users):
    """Crear rifas de prueba"""
    print("\n🎟️  Creando rifas...")
    
    # Obtener solo creadores
    creators = [u for u in users.values() if u["role"] == "creator"]
    raffles = []
    
    for i, raffle_data in enumerate(MOCK_RAFFLES):
        creator = creators[i % len(creators)]
        raffle_id = str(uuid4())
        
        now = datetime.now(timezone.utc)
        days = raffle_data["days_until_draw"]
        raffle_date = now + timedelta(days=days)
        
        status = raffle_data.get("status", "active")
        
        raffle = {
            "id": raffle_id,
            "creator_id": creator["id"],
            "creator_name": creator["full_name"],
            "title": raffle_data["title"],
            "description": raffle_data["description"],
            "prize_value": raffle_data["prize_value"],
            "ticket_price": raffle_data["ticket_price"],
            "ticket_range": raffle_data["ticket_range"],
            "tickets_sold": 0,
            "image_url": raffle_data["image_url"],
            "status": status,
            "raffle_date": raffle_date.isoformat(),
            "winner_id": None,
            "winning_number": None,
            "created_at": (now - timedelta(days=random.randint(1, 5))).isoformat(),
        }
        
        await db.raffles.insert_one(raffle)
        raffles.append(raffle)
        print(f"   ✅ {raffle_data['title'][:40]}... (por {creator['full_name']})")
    
    return raffles


async def create_tickets(users, raffles):
    """Crear tickets de prueba (participaciones)"""
    print("\n🎫 Creando tickets de participación...")
    
    regular_users = [u for u in users.values() if u["role"] == "user"]
    active_raffles = [r for r in raffles if r["status"] == "active"]
    
    tickets_created = 0
    
    for raffle in active_raffles:
        # Cada rifa tendrá entre 5 y 20 participantes
        num_participants = random.randint(5, min(20, len(regular_users)))
        participants = random.sample(regular_users, num_participants)
        
        for user in participants:
            # Cada usuario compra entre 1 y 5 tickets
            num_tickets = random.randint(1, 5)
            
            for _ in range(num_tickets):
                ticket_number = random.randint(1, raffle["ticket_range"])
                
                ticket = {
                    "id": str(uuid4()),
                    "raffle_id": raffle["id"],
                    "user_id": user["id"],
                    "user_name": user["full_name"],
                    "ticket_number": ticket_number,
                    "amount_paid": raffle["ticket_price"],
                    "purchased_at": datetime.now(timezone.utc).isoformat(),
                }
                
                await db.tickets.insert_one(ticket)
                tickets_created += 1
        
        # Actualizar tickets vendidos en la rifa
        total_tickets = await db.tickets.count_documents({"raffle_id": raffle["id"]})
        await db.raffles.update_one(
            {"id": raffle["id"]},
            {"$set": {"tickets_sold": total_tickets}}
        )
    
    print(f"   ✅ {tickets_created} tickets creados")


async def create_followers(users):
    """Crear relaciones de seguimiento"""
    print("\n👥 Creando relaciones de seguidores...")
    
    creators = [u for u in users.values() if u["role"] == "creator"]
    regular_users = [u for u in users.values() if u["role"] == "user"]
    
    for user in regular_users:
        # Cada usuario sigue entre 1 y 3 creadores
        num_to_follow = random.randint(1, min(3, len(creators)))
        creators_to_follow = random.sample(creators, num_to_follow)
        
        for creator in creators_to_follow:
            # Actualizar following del usuario
            await db.users.update_one(
                {"id": user["id"]},
                {
                    "$addToSet": {"following": creator["id"]},
                    "$inc": {"following_count": 1}
                }
            )
            
            # Actualizar followers del creador
            await db.users.update_one(
                {"id": creator["id"]},
                {
                    "$addToSet": {"followers": user["id"]},
                    "$inc": {"followers_count": 1}
                }
            )
    
    print("   ✅ Relaciones de seguidores creadas")


async def create_messages(users):
    """Crear mensajes de prueba"""
    print("\n💬 Creando mensajes de prueba...")
    
    creators = [u for u in users.values() if u["role"] == "creator"]
    regular_users = [u for u in users.values() if u["role"] == "user"]
    
    sample_messages = [
        "¡Hola! Me encantó tu última rifa 🎉",
        "¿Cuándo será el próximo sorteo?",
        "Gracias por responder tan rápido",
        "¡Ojalá gane esta vez! 🤞",
        "¿El envío está incluido?",
        "Excelente contenido, sigue así 👏",
        "¿Puedo participar desde otro país?",
        "¡Ya compré mis tickets!",
    ]
    
    messages_created = 0
    
    for user in regular_users[:3]:  # Solo 3 usuarios envían mensajes
        creator = random.choice(creators)
        
        # Crear conversación de 2-4 mensajes
        num_messages = random.randint(2, 4)
        
        for i in range(num_messages):
            sender = user if i % 2 == 0 else creator
            receiver = creator if i % 2 == 0 else user
            
            message = {
                "id": str(uuid4()),
                "sender_id": sender["id"],
                "receiver_id": receiver["id"],
                "content": random.choice(sample_messages),
                "read_by": [sender["id"]],
                "archived_by": [],
                "created_at": (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48))).isoformat(),
            }
            
            await db.messages.insert_one(message)
            messages_created += 1
    
    print(f"   ✅ {messages_created} mensajes creados")


async def create_notifications(users, raffles):
    """Crear notificaciones de prueba"""
    print("\n🔔 Creando notificaciones...")
    
    regular_users = [u for u in users.values() if u["role"] == "user"]
    
    notification_types = [
        ("new_raffle", "Nueva rifa disponible", "¡{creator} ha creado una nueva rifa: {title}!"),
        ("ticket_purchased", "Compra exitosa", "Has comprado {num} tickets para {title}"),
        ("raffle_reminder", "Recordatorio", "La rifa {title} termina mañana. ¡No te la pierdas!"),
    ]
    
    notifications_created = 0
    
    for user in regular_users:
        # 2-3 notificaciones por usuario
        for _ in range(random.randint(2, 3)):
            notif_type, title, message_template = random.choice(notification_types)
            raffle = random.choice(raffles)
            
            message = message_template.format(
                creator=raffle["creator_name"],
                title=raffle["title"][:30],
                num=random.randint(1, 3)
            )
            
            notification = {
                "id": str(uuid4()),
                "user_id": user["id"],
                "type": notif_type,
                "title": title,
                "message": message,
                "read": random.choice([True, False]),
                "created_at": (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 72))).isoformat(),
            }
            
            await db.notifications.insert_one(notification)
            notifications_created += 1
    
    print(f"   ✅ {notifications_created} notificaciones creadas")


async def print_summary():
    """Imprimir resumen de datos creados"""
    print("\n" + "="*50)
    print("📊 RESUMEN DE DATOS CREADOS")
    print("="*50)
    
    users_count = await db.users.count_documents({})
    raffles_count = await db.raffles.count_documents({})
    tickets_count = await db.tickets.count_documents({})
    messages_count = await db.messages.count_documents({})
    notifications_count = await db.notifications.count_documents({})
    
    print(f"   👥 Usuarios: {users_count}")
    print(f"   🎟️  Rifas: {raffles_count}")
    print(f"   🎫 Tickets: {tickets_count}")
    print(f"   💬 Mensajes: {messages_count}")
    print(f"   🔔 Notificaciones: {notifications_count}")
    
    print("\n" + "="*50)
    print("🔐 CREDENCIALES DE PRUEBA")
    print("="*50)
    print(f"   Contraseña para todos: {DEFAULT_PASSWORD}")
    print("\n   SUPER ADMIN:")
    print("   📧 admin@rafflywin.com")
    print("\n   CREADORES:")
    print("   📧 carlos@creator.com")
    print("   📧 maria@creator.com")
    print("   📧 pedro@creator.com")
    print("   📧 ana@creator.com")
    print("   📧 luis@creator.com")
    print("\n   USUARIOS:")
    print("   📧 juan@user.com")
    print("   📧 laura@user.com")
    print("   📧 diego@user.com")
    print("   📧 sofia@user.com")
    print("   📧 andres@user.com")
    print("="*50)


async def main():
    print("🚀 INICIANDO SEED DE DATOS DE PRUEBA - RafflyWin")
    print("="*50)
    
    # Preguntar confirmación
    response = input("\n⚠️  Esto BORRARÁ todos los datos existentes. ¿Continuar? (s/n): ")
    if response.lower() != 's':
        print("❌ Operación cancelada")
        return
    
    try:
        await clear_database()
        users = await create_users()
        raffles = await create_raffles(users)
        await create_tickets(users, raffles)
        await create_followers(users)
        await create_messages(users)
        await create_notifications(users, raffles)
        await print_summary()
        
        print("\n✅ ¡Seed completado exitosamente!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
