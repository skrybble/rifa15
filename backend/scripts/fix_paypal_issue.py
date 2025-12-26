#!/usr/bin/env python3
"""
Script MEJORADO para diagnosticar y configurar PayPal en RafflyWin
Ejecutar en el VPS: python3 fix_paypal_issue.py

Este script:
1. Verifica la conexión a la base de datos
2. Lista TODAS las rifas activas y muestra si su creador tiene PayPal
3. Actualiza los creadores que necesitan PayPal
"""

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient

# Configuración - El script detectará automáticamente
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

async def diagnose_and_fix():
    print("=" * 60)
    print("🔍 DIAGNÓSTICO DE PAGOS RAFFLYWIN")
    print("=" * 60)
    print(f"\n📦 Base de datos: {DB_NAME}")
    print(f"🔗 MongoDB URL: {MONGO_URL}")
    
    try:
        client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        # Verificar conexión
        await client.server_info()
        print("✅ Conexión a MongoDB exitosa")
    except Exception as e:
        print(f"❌ Error de conexión a MongoDB: {e}")
        return
    
    db = client[DB_NAME]
    
    # Listar todas las bases de datos disponibles
    print("\n📚 Bases de datos disponibles:")
    db_names = await client.list_database_names()
    for name in db_names:
        marker = " <-- ACTUAL" if name == DB_NAME else ""
        print(f"   - {name}{marker}")
    
    # Verificar colecciones
    print(f"\n📁 Colecciones en '{DB_NAME}':")
    collections = await db.list_collection_names()
    for col in collections:
        count = await db[col].count_documents({})
        print(f"   - {col}: {count} documentos")
    
    # ============================================
    # PASO 1: Listar todas las rifas activas/pendientes
    # ============================================
    print("\n" + "=" * 60)
    print("🎫 RIFAS ACTIVAS Y SUS CREADORES")
    print("=" * 60)
    
    raffles = await db.raffles.find(
        {"status": {"$in": ["active", "pending", "pending_payment"]}},
        {"_id": 0, "id": 1, "title": 1, "creator_id": 1, "ticket_price": 1, "status": 1}
    ).to_list(None)
    
    print(f"\n📋 Encontradas {len(raffles)} rifas activas/pendientes:\n")
    
    creators_to_fix = []
    
    for raffle in raffles:
        creator = await db.users.find_one(
            {"id": raffle["creator_id"]},
            {"_id": 0, "id": 1, "email": 1, "full_name": 1, "role": 1, "paypal_email": 1}
        )
        
        if creator:
            has_paypal = creator.get("paypal_email")
            paypal_status = "✅" if has_paypal else "❌ SIN PAYPAL"
            price_status = f"${raffle['ticket_price']}" if raffle['ticket_price'] > 0 else "GRATIS"
            
            print(f"  🎟️  {raffle['title']}")
            print(f"      Precio: {price_status} | Estado: {raffle['status']}")
            print(f"      Creador: {creator.get('full_name', 'Sin nombre')} ({creator['email']})")
            print(f"      Role: {creator.get('role')} | PayPal: {paypal_status}")
            
            if raffle['ticket_price'] > 0 and not has_paypal:
                print(f"      ⚠️  PROBLEMA: Esta rifa tiene precio pero el creador NO tiene PayPal!")
                creators_to_fix.append(creator)
            print()
        else:
            print(f"  ⚠️  Rifa '{raffle['title']}' - Creador NO encontrado (ID: {raffle['creator_id']})")
    
    # ============================================
    # PASO 2: Listar TODOS los usuarios que pueden crear rifas
    # ============================================
    print("\n" + "=" * 60)
    print("👥 TODOS LOS USUARIOS CON CAPACIDAD DE CREAR RIFAS")
    print("=" * 60)
    
    all_creators = await db.users.find(
        {"role": {"$in": ["creator", "admin", "super_admin"]}},
        {"_id": 0, "id": 1, "email": 1, "full_name": 1, "role": 1, "paypal_email": 1}
    ).to_list(None)
    
    print(f"\n📋 Encontrados {len(all_creators)} usuarios:\n")
    
    users_without_paypal = []
    
    for user in all_creators:
        has_paypal = user.get("paypal_email")
        status = "✅" if has_paypal else "❌"
        print(f"  {status} {user.get('full_name', 'Sin nombre')} ({user['email']})")
        print(f"      Role: {user['role']} | PayPal: {user.get('paypal_email', 'NO CONFIGURADO')}")
        
        if not has_paypal:
            users_without_paypal.append(user)
    
    # ============================================
    # PASO 3: Ofrecer solución
    # ============================================
    if users_without_paypal:
        print("\n" + "=" * 60)
        print("🔧 SOLUCIÓN DISPONIBLE")
        print("=" * 60)
        print(f"\n⚠️  {len(users_without_paypal)} usuarios NO tienen PayPal configurado")
        print("\nOPCIONES:")
        print("  1. Configurar PayPal automáticamente (emails de prueba)")
        print("  2. Ingresar emails de PayPal manualmente")
        print("  3. Solo mostrar diagnóstico (no hacer cambios)")
        
        choice = input("\n¿Qué deseas hacer? [1/2/3]: ").strip()
        
        if choice == "1":
            print("\n🔄 Actualizando con emails de prueba...")
            for user in users_without_paypal:
                email_base = user["email"].split("@")[0]
                paypal_email = f"{email_base}@paypal-sandbox.com"
                
                result = await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {"paypal_email": paypal_email}}
                )
                if result.modified_count > 0:
                    print(f"  ✅ {user['email']} -> PayPal: {paypal_email}")
                else:
                    print(f"  ⚠️  No se pudo actualizar {user['email']}")
                    
        elif choice == "2":
            print("\n📝 Ingresa el email de PayPal para cada usuario:\n")
            for user in users_without_paypal:
                paypal_email = input(f"  PayPal para {user['email']} (Enter para saltar): ").strip()
                if paypal_email and "@" in paypal_email:
                    result = await db.users.update_one(
                        {"id": user["id"]},
                        {"$set": {"paypal_email": paypal_email}}
                    )
                    if result.modified_count > 0:
                        print(f"    ✅ Actualizado correctamente")
                    else:
                        print(f"    ⚠️  No se pudo actualizar")
        else:
            print("\n👋 Solo diagnóstico, sin cambios.")
            
    else:
        print("\n✅ Todos los usuarios tienen PayPal configurado!")
    
    # ============================================
    # RESULTADO FINAL
    # ============================================
    print("\n" + "=" * 60)
    print("📊 ESTADO FINAL")
    print("=" * 60)
    
    final_creators = await db.users.find(
        {"role": {"$in": ["creator", "admin", "super_admin"]}},
        {"_id": 0, "email": 1, "full_name": 1, "role": 1, "paypal_email": 1}
    ).to_list(None)
    
    configured = sum(1 for c in final_creators if c.get("paypal_email"))
    print(f"\n📈 {configured}/{len(final_creators)} usuarios con PayPal configurado")
    
    if configured < len(final_creators):
        print("\n⚠️  Los usuarios sin PayPal solo podrán crear rifas GRATUITAS")
        print("   Los compradores verán 'Pagos no disponibles' en rifas de pago")
    else:
        print("\n✅ ¡Todos los usuarios pueden recibir pagos!")
    
    # Verificar rifas problemáticas
    problem_raffles = []
    for raffle in raffles:
        if raffle['ticket_price'] > 0:
            creator = await db.users.find_one(
                {"id": raffle["creator_id"]},
                {"_id": 0, "paypal_email": 1}
            )
            if not creator or not creator.get("paypal_email"):
                problem_raffles.append(raffle)
    
    if problem_raffles:
        print(f"\n⚠️  {len(problem_raffles)} rifas de PAGO tienen creadores sin PayPal:")
        for r in problem_raffles:
            print(f"   - {r['title']} (${r['ticket_price']})")
        print("\n   Los compradores verán 'Pagos no disponibles' en estas rifas")
    else:
        print("\n✅ Todas las rifas de pago tienen creadores con PayPal configurado!")

if __name__ == "__main__":
    print("\n" + "🔧" * 30)
    print("  HERRAMIENTA DE DIAGNÓSTICO Y REPARACIÓN PAYPAL")
    print("🔧" * 30 + "\n")
    asyncio.run(diagnose_and_fix())
