#!/usr/bin/env python3
"""
Script para configurar PayPal para los creadores en RafflyWin
Ejecutar en el VPS: python3 setup_paypal_creators.py

Este script actualiza los creadores existentes con emails de PayPal
para que puedan recibir pagos por venta de tickets.
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Configuración - Ajusta según tu VPS
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")  # Cambia si tu DB tiene otro nombre

async def setup_paypal():
    print("🔧 Configurando PayPal para creadores de RafflyWin")
    print(f"📦 Base de datos: {DB_NAME}")
    print(f"🔗 MongoDB URL: {MONGO_URL[:30]}...")
    print("-" * 50)
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Listar todos los creadores
    creators = await db.users.find(
        {"role": "creator"}, 
        {"_id": 0, "id": 1, "email": 1, "full_name": 1, "paypal_email": 1}
    ).to_list(None)
    
    print(f"\n📋 Encontrados {len(creators)} creadores:\n")
    
    for i, creator in enumerate(creators, 1):
        has_paypal = "✅" if creator.get("paypal_email") else "❌"
        print(f"  {i}. {has_paypal} {creator.get('full_name', 'Sin nombre')} ({creator['email']})")
        if creator.get("paypal_email"):
            print(f"      PayPal: {creator['paypal_email']}")
    
    # Preguntar si quiere actualizar
    print("\n" + "=" * 50)
    print("OPCIONES:")
    print("  1. Actualizar automáticamente con emails de prueba")
    print("  2. Actualizar manualmente (ingresar emails)")
    print("  3. Salir")
    
    choice = input("\n¿Qué deseas hacer? [1/2/3]: ").strip()
    
    if choice == "1":
        # Actualización automática con emails de sandbox
        print("\n🔄 Actualizando con emails de prueba...")
        for creator in creators:
            if not creator.get("paypal_email"):
                # Generar email de prueba basado en el nombre
                email_base = creator["email"].split("@")[0]
                paypal_email = f"{email_base}@paypal-sandbox.com"
                
                result = await db.users.update_one(
                    {"email": creator["email"]},
                    {"$set": {"paypal_email": paypal_email}}
                )
                if result.modified_count > 0:
                    print(f"  ✅ {creator['email']} -> {paypal_email}")
                    
    elif choice == "2":
        # Actualización manual
        print("\n📝 Ingresa el email de PayPal para cada creador (Enter para saltar):\n")
        for creator in creators:
            if not creator.get("paypal_email"):
                paypal_email = input(f"  PayPal para {creator['email']}: ").strip()
                if paypal_email:
                    result = await db.users.update_one(
                        {"email": creator["email"]},
                        {"$set": {"paypal_email": paypal_email}}
                    )
                    if result.modified_count > 0:
                        print(f"    ✅ Actualizado")
    else:
        print("\n👋 Saliendo...")
        return
    
    # Mostrar resultado final
    print("\n" + "=" * 50)
    print("RESULTADO FINAL:\n")
    
    creators = await db.users.find(
        {"role": "creator"}, 
        {"_id": 0, "email": 1, "full_name": 1, "paypal_email": 1}
    ).to_list(None)
    
    for creator in creators:
        has_paypal = "✅" if creator.get("paypal_email") else "❌"
        print(f"  {has_paypal} {creator.get('full_name', 'Sin nombre')} ({creator['email']})")
        if creator.get("paypal_email"):
            print(f"      PayPal: {creator['paypal_email']}")
    
    configured = sum(1 for c in creators if c.get("paypal_email"))
    print(f"\n📊 {configured}/{len(creators)} creadores con PayPal configurado")
    
    if configured < len(creators):
        print("\n⚠️  Los creadores sin PayPal solo podrán crear rifas GRATUITAS")

if __name__ == "__main__":
    asyncio.run(setup_paypal())
