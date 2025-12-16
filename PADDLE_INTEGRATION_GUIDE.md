# Guía de Integración de Paddle - RafflyWin
## Sistema de Pagos con Paddle (Reemplazo de Stripe)

---

## 🎯 ¿Por qué Paddle en lugar de Stripe?

### Ventajas de Paddle para RafflyWin

✅ **Merchant of Record (MoR)**
- Paddle asume toda la responsabilidad legal de las transacciones
- Maneja compliance fiscal en 200+ países automáticamente
- Reduce significativamente tu carga legal

✅ **Impuestos Automáticos**
- Calcula y cobra VAT, GST, sales tax automáticamente
- Sin necesidad de registrarse en cada jurisdicción
- Remite impuestos directamente a gobiernos

✅ **Facturación Global**
- Soporte nativo para 100+ monedas
- Precios localizados automáticamente
- Menos rechazos de tarjetas internacionales

✅ **Menor Complejidad**
- No necesitas gestionar suscripciones manualmente
- Paddle maneja chargebacks y disputas
- Recovery automático de pagos fallidos

✅ **Costos Transparentes**
- Fee único: 5% + $0.50 por transacción
- Incluye procesamiento + impuestos + compliance
- Sin fees ocultos ni sorpresas

### Comparación Paddle vs Stripe

| Aspecto | Paddle | Stripe |
|---------|--------|--------|
| **Fees** | 5% + $0.50 | 2.9% + $0.30 + impuestos |
| **Merchant of Record** | ✅ Sí | ❌ No (tú eres MoR) |
| **Impuestos Globales** | ✅ Automático | ⚠️ Manual (tax partner extra) |
| **Compliance** | ✅ Paddle | ⚠️ Tú |
| **Facturación** | ✅ Incluida | ⚠️ Adicional |
| **Chargebacks** | ✅ Paddle maneja | ⚠️ Tú manejas |
| **Mejor para** | SaaS, Digital Goods | Marketplaces, Physical |

**Para RafflyWin, Paddle es superior** porque:
- Rifas son productos digitales
- Ventas internacionales
- Menor riesgo legal
- Menos complejidad operativa

---

## 🔑 Paso 1: Obtener Credenciales de Paddle

### 1.1 Crear cuenta en Paddle
1. Ve a https://paddle.com
2. Crea una cuenta (Business Account)
3. Completa proceso de verificación:
   - Información de empresa
   - Documentos legales (si aplica)
   - Información bancaria para payouts

### 1.2 Obtener API Keys
1. Ve al Dashboard de Paddle
2. **Developer Tools** → **Authentication**
3. Copia las siguientes claves:
   - **Vendor ID**: Tu ID único de vendedor
   - **Auth Code**: Para API calls
   - **Public Key**: Para verificar webhooks

**Modos:**
- **Sandbox**: Para testing (https://sandbox-vendors.paddle.com)
- **Production**: Para ventas reales (https://vendors.paddle.com)

### 1.3 Configurar Webhook
1. En Dashboard → **Developer Tools** → **Webhooks**
2. Agregar endpoint: `https://api.tu-dominio.com/api/paddle/webhook`
3. Seleccionar eventos:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `payment_succeeded`
   - `payment_failed`
   - `payment_refunded`
4. Copiar **Public Key** para verificar firmas

### 1.4 Configurar Productos
1. **Catalog** → **Products**
2. Crear producto: "RafflyWin Tickets"
   - Tipo: One-time purchase
   - Pricing: Variable (se pasa dinámicamente)
3. Crear planes premium (opcional):
   - Plan Starter (Gratis)
   - Plan Growth ($49/mes)
   - Plan Pro ($199/mes)

---

## 💻 Paso 2: Instalación de Paddle en Backend

### 2.1 Instalar librería
```bash
cd /app/backend
pip install paddle-billing
pip freeze > requirements.txt
```

### 2.2 Actualizar .env
```env
# Paddle Configuration
PADDLE_VENDOR_ID=12345
PADDLE_AUTH_CODE=xxxxxxxxxxxxx
PADDLE_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA...
-----END PUBLIC KEY-----
PADDLE_ENVIRONMENT=sandbox  # o "production"

# Comisión del sistema (1%)
PLATFORM_COMMISSION_PERCENTAGE=1
```

---

## 🔧 Paso 3: Implementar Backend con Paddle

### 3.1 Actualizar server.py

Agregar imports:
```python
from paddle_billing import Client, Environment, Options
from paddle_billing.Entities import Transaction, TransactionStatus
from paddle_billing.Resources import Transactions
import os
import hashlib
import json
from typing import Optional

# Configurar Paddle Client
paddle_env = Environment.SANDBOX if os.environ.get('PADDLE_ENVIRONMENT') == 'sandbox' else Environment.PRODUCTION

paddle_client = Client(
    os.environ.get('PADDLE_AUTH_CODE'),
    environment=paddle_env
)

PADDLE_PUBLIC_KEY = os.environ.get('PADDLE_PUBLIC_KEY')
PLATFORM_COMMISSION = float(os.environ.get('PLATFORM_COMMISSION_PERCENTAGE', 1))
```

### 3.2 Modelos actualizados

```python
class PaddleCustomer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    paddle_customer_id: str
    email: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaddleTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    raffle_id: str
    ticket_numbers: List[int]
    amount: float
    platform_fee: float
    creator_amount: float
    paddle_transaction_id: str
    paddle_status: str  # pending, completed, failed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaddleCheckoutRequest(BaseModel):
    raffle_id: str
    ticket_numbers: List[int]

class PaddleSubscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    paddle_subscription_id: str
    plan_name: str  # growth, pro
    status: str  # active, canceled, past_due
    current_period_start: datetime
    current_period_end: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

### 3.3 Helper Functions

```python
def verify_paddle_webhook(request_body: bytes, signature: str) -> bool:
    """Verificar firma del webhook de Paddle"""
    try:
        # Paddle envía firma en header 'Paddle-Signature'
        # Formato: ts=timestamp;h1=signature
        parts = {}
        for part in signature.split(';'):
            key, value = part.split('=')
            parts[key] = value
        
        timestamp = parts.get('ts')
        paddle_signature = parts.get('h1')
        
        # Construir mensaje para verificar
        message = f"{timestamp}:{request_body.decode('utf-8')}"
        
        # Verificar con clave pública
        # Nota: Paddle usa RSA-SHA256
        # Implementación simplificada - usar librería crypto en producción
        return True  # Placeholder - implementar verificación real
    except Exception as e:
        print(f"Error verifying webhook: {e}")
        return False
```

### 3.4 Endpoints de Paddle

```python
# ============================================
# PADDLE INTEGRATION
# ============================================

@api_router.post("/paddle/create-customer")
async def create_paddle_customer(current_user: User = Depends(get_current_user)):
    """Crear o obtener cliente en Paddle"""
    # Verificar si ya existe
    existing = await db.paddle_customers.find_one({"user_id": current_user.id})
    if existing:
        return {"customer_id": existing["paddle_customer_id"]}
    
    try:
        # Paddle crea clientes automáticamente en el checkout
        # Solo guardamos referencia cuando se complete primera transacción
        return {"message": "Customer will be created on first transaction"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/paddle/create-checkout")
async def create_paddle_checkout(
    checkout_data: PaddleCheckoutRequest,
    current_user: User = Depends(get_current_user)
):
    """Crear sesión de checkout de Paddle para comprar tickets"""
    try:
        # Obtener rifa
        raffle = await db.raffles.find_one({"id": checkout_data.raffle_id})
        if not raffle:
            raise HTTPException(status_code=404, detail="Rifa no encontrada")
        
        # Calcular monto
        total_amount = raffle["ticket_price"] * len(checkout_data.ticket_numbers)
        platform_fee = total_amount * (PLATFORM_COMMISSION / 100)
        creator_amount = total_amount - platform_fee
        
        # Crear items para Paddle
        items = [{
            "price_id": "pri_rafflywin_ticket",  # ID del producto en Paddle
            "quantity": len(checkout_data.ticket_numbers)
        }]
        
        # Custom data para tracking
        custom_data = {
            "user_id": current_user.id,
            "raffle_id": checkout_data.raffle_id,
            "ticket_numbers": checkout_data.ticket_numbers,
            "platform_fee": platform_fee,
            "creator_amount": creator_amount
        }
        
        # Crear transacción usando Paddle SDK
        transaction = paddle_client.transactions.create(
            items=items,
            customer_email=current_user.email,
            custom_data=custom_data,
            currency_code="USD"
        )
        
        # Guardar referencia en DB
        paddle_transaction = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "raffle_id": checkout_data.raffle_id,
            "ticket_numbers": checkout_data.ticket_numbers,
            "amount": total_amount,
            "platform_fee": platform_fee,
            "creator_amount": creator_amount,
            "paddle_transaction_id": transaction.id,
            "paddle_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.paddle_transactions.insert_one(paddle_transaction)
        
        # Retornar checkout URL
        return {
            "checkout_url": transaction.checkout_url,
            "transaction_id": transaction.id
        }
    except Exception as e:
        print(f"Error creating Paddle checkout: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/paddle/webhook")
async def paddle_webhook(request: Request):
    """Webhook de Paddle para confirmar pagos y eventos"""
    body = await request.body()
    signature = request.headers.get('Paddle-Signature', '')
    
    # Verificar firma
    if not verify_paddle_webhook(body, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    try:
        payload = json.loads(body)
        event_type = payload.get('event_type')
        data = payload.get('data', {})
        
        # Manejar diferentes eventos
        if event_type == 'transaction.completed':
            await handle_transaction_completed(data)
        
        elif event_type == 'transaction.updated':
            await handle_transaction_updated(data)
        
        elif event_type == 'transaction.payment_failed':
            await handle_transaction_failed(data)
        
        elif event_type == 'subscription.created':
            await handle_subscription_created(data)
        
        elif event_type == 'subscription.updated':
            await handle_subscription_updated(data)
        
        elif event_type == 'subscription.canceled':
            await handle_subscription_canceled(data)
        
        return {"status": "success"}
    
    except Exception as e:
        print(f"Error processing webhook: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# Handlers de eventos del webhook

async def handle_transaction_completed(data: dict):
    """Manejar transacción completada"""
    transaction_id = data.get('id')
    custom_data = data.get('custom_data', {})
    
    # Actualizar transacción en DB
    await db.paddle_transactions.update_one(
        {"paddle_transaction_id": transaction_id},
        {"$set": {"paddle_status": "completed"}}
    )
    
    # Obtener datos de la transacción
    paddle_tx = await db.paddle_transactions.find_one(
        {"paddle_transaction_id": transaction_id}
    )
    
    if not paddle_tx:
        print(f"Transaction {transaction_id} not found in DB")
        return
    
    # Crear tickets
    for ticket_number in paddle_tx["ticket_numbers"]:
        ticket = {
            "id": str(uuid.uuid4()),
            "raffle_id": paddle_tx["raffle_id"],
            "user_id": paddle_tx["user_id"],
            "ticket_number": ticket_number,
            "purchase_date": datetime.now(timezone.utc).isoformat(),
            "price_paid": paddle_tx["amount"] / len(paddle_tx["ticket_numbers"])
        }
        await db.tickets.insert_one(ticket)
    
    # Actualizar estadísticas de la rifa
    await db.raffles.update_one(
        {"id": paddle_tx["raffle_id"]},
        {
            "$inc": {
                "tickets_sold": len(paddle_tx["ticket_numbers"]),
                "total_raised": paddle_tx["creator_amount"]
            }
        }
    )
    
    # Crear notificación
    await create_notification(
        paddle_tx["user_id"],
        "Compra Exitosa",
        f"Has comprado {len(paddle_tx['ticket_numbers'])} tickets exitosamente",
        "ticket_purchase"
    )
    
    # Guardar cliente Paddle si es primera compra
    customer_id = data.get('customer_id')
    if customer_id:
        existing_customer = await db.paddle_customers.find_one(
            {"user_id": paddle_tx["user_id"]}
        )
        if not existing_customer:
            paddle_customer = {
                "user_id": paddle_tx["user_id"],
                "paddle_customer_id": customer_id,
                "email": data.get('customer_email'),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.paddle_customers.insert_one(paddle_customer)

async def handle_transaction_updated(data: dict):
    """Manejar actualización de transacción"""
    transaction_id = data.get('id')
    status = data.get('status')
    
    await db.paddle_transactions.update_one(
        {"paddle_transaction_id": transaction_id},
        {"$set": {"paddle_status": status}}
    )

async def handle_transaction_failed(data: dict):
    """Manejar transacción fallida"""
    transaction_id = data.get('id')
    
    await db.paddle_transactions.update_one(
        {"paddle_transaction_id": transaction_id},
        {"$set": {"paddle_status": "failed"}}
    )
    
    # Notificar al usuario
    paddle_tx = await db.paddle_transactions.find_one(
        {"paddle_transaction_id": transaction_id}
    )
    
    if paddle_tx:
        await create_notification(
            paddle_tx["user_id"],
            "Pago Fallido",
            "Tu compra de tickets no pudo ser procesada. Por favor, intenta nuevamente.",
            "payment_failed"
        )

async def handle_subscription_created(data: dict):
    """Manejar creación de suscripción (para planes premium)"""
    subscription_id = data.get('id')
    customer_id = data.get('customer_id')
    items = data.get('items', [])
    
    # Obtener usuario por customer_id
    paddle_customer = await db.paddle_customers.find_one(
        {"paddle_customer_id": customer_id}
    )
    
    if not paddle_customer:
        print(f"Customer {customer_id} not found")
        return
    
    # Determinar plan
    plan_name = "growth"  # Default
    if items:
        price_id = items[0].get('price', {}).get('id')
        if 'pro' in price_id.lower():
            plan_name = "pro"
    
    # Guardar suscripción
    subscription = {
        "id": str(uuid.uuid4()),
        "user_id": paddle_customer["user_id"],
        "paddle_subscription_id": subscription_id,
        "plan_name": plan_name,
        "status": data.get('status'),
        "current_period_start": data.get('current_billing_period', {}).get('starts_at'),
        "current_period_end": data.get('current_billing_period', {}).get('ends_at'),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.paddle_subscriptions.insert_one(subscription)
    
    # Actualizar rol de usuario si es necesario
    await db.users.update_one(
        {"id": paddle_customer["user_id"]},
        {"$set": {"premium_plan": plan_name}}
    )

async def handle_subscription_updated(data: dict):
    """Manejar actualización de suscripción"""
    subscription_id = data.get('id')
    status = data.get('status')
    
    await db.paddle_subscriptions.update_one(
        {"paddle_subscription_id": subscription_id},
        {"$set": {
            "status": status,
            "current_period_start": data.get('current_billing_period', {}).get('starts_at'),
            "current_period_end": data.get('current_billing_period', {}).get('ends_at')
        }}
    )

async def handle_subscription_canceled(data: dict):
    """Manejar cancelación de suscripción"""
    subscription_id = data.get('id')
    
    # Actualizar suscripción
    await db.paddle_subscriptions.update_one(
        {"paddle_subscription_id": subscription_id},
        {"$set": {"status": "canceled"}}
    )
    
    # Obtener usuario y downgrade
    subscription = await db.paddle_subscriptions.find_one(
        {"paddle_subscription_id": subscription_id}
    )
    
    if subscription:
        await db.users.update_one(
            {"id": subscription["user_id"]},
            {"$set": {"premium_plan": "free"}}
        )

# Endpoints adicionales para gestión

@api_router.get("/paddle/transactions")
async def get_user_transactions(current_user: User = Depends(get_current_user)):
    """Obtener historial de transacciones del usuario"""
    transactions = await db.paddle_transactions.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(None)
    
    return [parse_from_mongo(tx) for tx in transactions]

@api_router.get("/paddle/subscription")
async def get_user_subscription(current_user: User = Depends(get_current_user)):
    """Obtener suscripción activa del usuario"""
    subscription = await db.paddle_subscriptions.find_one(
        {"user_id": current_user.id, "status": {"$in": ["active", "past_due"]}},
        {"_id": 0}
    )
    
    if not subscription:
        return None
    
    return parse_from_mongo(subscription)

@api_router.post("/paddle/cancel-subscription")
async def cancel_subscription(current_user: User = Depends(get_current_user)):
    """Cancelar suscripción del usuario"""
    subscription = await db.paddle_subscriptions.find_one(
        {"user_id": current_user.id, "status": "active"}
    )
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    try:
        # Cancelar en Paddle
        paddle_client.subscriptions.cancel(
            subscription["paddle_subscription_id"]
        )
        
        return {"message": "Subscription canceled successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---

## 🎨 Paso 4: Actualizar Frontend

### 4.1 Instalar Paddle.js
```bash
cd /app/frontend
yarn add @paddle/paddle-js
```

### 4.2 Actualizar .env del frontend
```env
REACT_APP_BACKEND_URL=https://api.tu-dominio.com
REACT_APP_PADDLE_VENDOR_ID=12345
REACT_APP_PADDLE_ENVIRONMENT=sandbox  # o "production"
```

### 4.3 Crear componente de checkout

Crear `/app/frontend/src/components/PaddleCheckout.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { initializePaddle } from '@paddle/paddle-js';
import axios from 'axios';
import { API } from '../App';

const PaddleCheckout = ({ raffleId, ticketNumbers, amount, onSuccess }) => {
  const [paddle, setPaddle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initPaddle = async () => {
      try {
        const paddleInstance = await initializePaddle({
          vendor: parseInt(process.env.REACT_APP_PADDLE_VENDOR_ID),
          environment: process.env.REACT_APP_PADDLE_ENVIRONMENT || 'sandbox',
        });
        setPaddle(paddleInstance);
      } catch (err) {
        console.error('Error initializing Paddle:', err);
        setError('Error al cargar sistema de pagos');
      }
    };

    initPaddle();
  }, []);

  const handleCheckout = async () => {
    if (!paddle) {
      setError('Sistema de pagos no disponible');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Crear checkout en backend
      const { data } = await axios.post(`${API}/paddle/create-checkout`, {
        raffle_id: raffleId,
        ticket_numbers: ticketNumbers,
      });

      // Abrir Paddle Checkout
      paddle.Checkout.open({
        override: data.checkout_url,
        successCallback: (data) => {
          console.log('Payment successful:', data);
          onSuccess();
        },
        closeCallback: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al procesar el pago');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-600">Tickets seleccionados:</p>
        <p className="font-bold text-lg">{ticketNumbers.join(', ')}</p>
        <p className="text-sm text-slate-600 mt-2">Total a pagar:</p>
        <p className="font-bold text-2xl text-sky-600">${amount.toFixed(2)}</p>
        <p className="text-xs text-slate-500 mt-2">
          * Procesado por Paddle. Impuestos incluidos automáticamente.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={!paddle || loading}
        className="w-full bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        {loading ? (
          <span>Procesando...</span>
        ) : (
          <span>Pagar con Paddle</span>
        )}
      </button>

      <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
        <span>🔒 Pago seguro</span>
        <span>💳 Todas las tarjetas</span>
        <span>🌍 Pagos globales</span>
      </div>
    </div>
  );
};

export default PaddleCheckout;
```

### 4.4 Actualizar CheckoutPage

Modificar `/app/frontend/src/pages/CheckoutPage.js`:

```javascript
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PaddleCheckout from '../components/PaddleCheckout';
import { ArrowLeft } from 'lucide-react';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { raffleId, ticketNumbers, amount } = location.state || {};

  if (!raffleId || !ticketNumbers) {
    navigate('/explore');
    return null;
  }

  const handleSuccess = () => {
    navigate('/my-tickets', {
      state: { message: '¡Compra exitosa! Tus tickets han sido añadidos.' }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-slate-700 hover:text-sky-700"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            Completar Compra
          </h1>

          <PaddleCheckout
            raffleId={raffleId}
            ticketNumbers={ticketNumbers}
            amount={amount}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
```

---

## 🔄 Paso 5: Testing

### 5.1 Tarjetas de prueba de Paddle

En modo sandbox, usa estas tarjetas:

**Tarjeta exitosa:**
- Número: `4242 4242 4242 4242`
- Fecha: Cualquier fecha futura
- CVV: Cualquier 3 dígitos

**Tarjeta rechazada:**
- Número: `4000 0000 0000 0002`

**Tarjeta con autenticación 3DS:**
- Número: `4000 0027 6000 3184`

### 5.2 Flujo de prueba

1. Iniciar sesión
2. Seleccionar rifa
3. Elegir tickets
4. Click en "Comprar Tickets"
5. Se abre modal de Paddle
6. Ingresar datos de tarjeta de prueba
7. Confirmar pago
8. Webhook recibido → Tickets creados
9. Verificar en "Mis Tickets"

---

## 💰 Paso 6: Planes Premium con Paddle

### 6.1 Configurar productos en Paddle Dashboard

**Plan Growth - $49/mes:**
```
Product: RafflyWin Growth
Price: $49.00 USD
Billing: Monthly (recurring)
Trial: 14 days (opcional)
```

**Plan Pro - $199/mes:**
```
Product: RafflyWin Pro
Price: $199.00 USD
Billing: Monthly (recurring)
Trial: 14 days (opcional)
```

### 6.2 Componente de Pricing

Crear `/app/frontend/src/components/PricingPlans.js`:

```javascript
import React from 'react';
import { Check } from 'lucide-react';
import { initializePaddle } from '@paddle/paddle-js';

const PricingPlans = ({ currentPlan = 'free' }) => {
  const openPaddleCheckout = async (priceId) => {
    const paddle = await initializePaddle({
      vendor: parseInt(process.env.REACT_APP_PADDLE_VENDOR_ID),
      environment: process.env.REACT_APP_PADDLE_ENVIRONMENT,
    });

    paddle.Checkout.open({
      items: [{ priceId }],
    });
  };

  const plans = [
    {
      name: 'Starter',
      price: 'Gratis',
      priceId: null,
      features: [
        'Comisión: 1%',
        'Hasta 3 rifas activas',
        'Analytics básicos',
        'Soporte por email',
      ],
      cta: currentPlan === 'free' ? 'Plan Actual' : 'Downgrade',
      disabled: currentPlan === 'free',
    },
    {
      name: 'Growth',
      price: '$49',
      period: '/mes',
      priceId: 'pri_growth_12345',
      popular: true,
      features: [
        'Comisión: 0.5%',
        'Rifas ilimitadas',
        'Analytics avanzados',
        'Badge verificado',
        'Soporte prioritario',
      ],
      cta: currentPlan === 'growth' ? 'Plan Actual' : 'Upgrade',
      disabled: currentPlan === 'growth',
    },
    {
      name: 'Pro',
      price: '$199',
      period: '/mes',
      priceId: 'pri_pro_67890',
      features: [
        'Comisión: 0%',
        'Todo lo de Growth +',
        'Custom branding',
        'API access',
        'White-label',
        'Account manager',
      ],
      cta: currentPlan === 'pro' ? 'Plan Actual' : 'Upgrade',
      disabled: currentPlan === 'pro',
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={`relative bg-white rounded-xl p-8 shadow-lg ${
            plan.popular ? 'ring-2 ring-sky-600' : ''
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-sky-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Más Popular
              </span>
            </div>
          )}

          <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
          <div className="mb-6">
            <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
            {plan.period && <span className="text-slate-600">{plan.period}</span>}
          </div>

          <ul className="space-y-3 mb-8">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => plan.priceId && openPaddleCheckout(plan.priceId)}
            disabled={plan.disabled}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              plan.popular
                ? 'bg-sky-600 text-white hover:bg-sky-700'
                : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {plan.cta}
          </button>
        </div>
      ))}
    </div>
  );
};

export default PricingPlans;
```

---

## 📊 Paso 7: Dashboard de Analytics

### 7.1 Endpoint de estadísticas

```python
@api_router.get("/paddle/analytics")
async def get_paddle_analytics(current_user: User = Depends(get_current_user)):
    """Obtener analytics de transacciones"""
    if current_user.role != UserRole.CREATOR:
        raise HTTPException(status_code=403, detail="Only creators")
    
    # Obtener rifas del creador
    raffles = await db.raffles.find(
        {"creator_id": current_user.id},
        {"_id": 0, "id": 1}
    ).to_list(None)
    
    raffle_ids = [r["id"] for r in raffles]
    
    # Estadísticas de transacciones
    transactions = await db.paddle_transactions.find(
        {"raffle_id": {"$in": raffle_ids}, "paddle_status": "completed"},
        {"_id": 0}
    ).to_list(None)
    
    # Calcular métricas
    total_revenue = sum(tx["creator_amount"] for tx in transactions)
    total_tickets = sum(len(tx["ticket_numbers"]) for tx in transactions)
    total_transactions = len(transactions)
    
    # Agrupar por fecha
    from collections import defaultdict
    revenue_by_date = defaultdict(float)
    
    for tx in transactions:
        date = tx["created_at"][:10]  # YYYY-MM-DD
        revenue_by_date[date] += tx["creator_amount"]
    
    return {
        "total_revenue": total_revenue,
        "total_tickets": total_tickets,
        "total_transactions": total_transactions,
        "average_transaction": total_revenue / total_transactions if total_transactions > 0 else 0,
        "revenue_by_date": dict(revenue_by_date)
    }
```

---

## 📝 Checklist de Integración Paddle

### Configuración Inicial
- [ ] Cuenta de Paddle creada y verificada
- [ ] API keys obtenidas (sandbox y production)
- [ ] Webhook configurado con URL correcta
- [ ] Productos creados en Paddle Dashboard
- [ ] Librería paddle-billing instalada en backend

### Backend
- [ ] Variables de entorno configuradas
- [ ] Modelos creados (PaddleCustomer, PaddleTransaction, PaddleSubscription)
- [ ] Endpoint crear checkout implementado
- [ ] Webhook implementado con verificación de firma
- [ ] Handlers de eventos completados
- [ ] Lógica de comisiones implementada
- [ ] Creación automática de tickets al pagar
- [ ] Analytics endpoint implementado

### Frontend
- [ ] @paddle/paddle-js instalado
- [ ] Vendor ID configurado en .env
- [ ] PaddleCheckout componente creado
- [ ] CheckoutPage actualizada
- [ ] Ruta de checkout agregada en App.js
- [ ] PricingPlans componente creado (opcional)

### Testing
- [ ] Probado con tarjeta de prueba exitosa
- [ ] Probado con tarjeta rechazada
- [ ] Verificado webhook recibe eventos
- [ ] Verificado creación de tickets
- [ ] Verificado notificaciones
- [ ] Probado flujo de suscripciones (si aplica)

### Producción
- [ ] Cambiado a keys de producción
- [ ] Webhook actualizado con URL de producción
- [ ] Productos de producción configurados
- [ ] Probado en producción con pagos reales pequeños
- [ ] Documentación para usuarios
- [ ] Monitoreo de transacciones activo

---

## 🚨 Diferencias Clave vs Stripe

### Lo que NO necesitas con Paddle

❌ **No necesitas**:
- Implementar cálculo de impuestos
- Registrarte en jurisdicciones fiscales
- Manejar chargebacks manualmente
- Implementar sistema de facturación
- Preocuparte por compliance PCI-DSS
- Gestionar datos de tarjetas

✅ **Paddle maneja**:
- Impuestos globales automáticos
- Compliance fiscal
- Chargebacks y disputas
- Facturación y recibos
- Seguridad PCI-DSS
- Merchant of Record

### Lo que SÍ necesitas hacer

1. **Integrar Paddle.js** en frontend
2. **Crear checkout** desde backend
3. **Procesar webhooks** correctamente
4. **Verificar firmas** de webhooks
5. **Guardar referencias** de transacciones

---

## 💡 Tips y Best Practices

### Seguridad
- ✅ Siempre verifica firma de webhooks
- ✅ No confíes en datos del frontend
- ✅ Valida montos en backend
- ✅ Usa HTTPS en producción

### Performance
- ✅ Procesa webhooks de forma asíncrona
- ✅ Implementa retry logic
- ✅ Cachea datos de productos
- ✅ Usa índices en queries de transacciones

### UX
- ✅ Muestra loader durante checkout
- ✅ Maneja errores gracefully
- ✅ Confirma compra visualmente
- ✅ Envía email de confirmación

### Monitoreo
- ✅ Alerta si webhooks fallan
- ✅ Track tasas de conversión
- ✅ Monitor chargebacks
- ✅ Analiza abandono de checkout

---

## 📞 Soporte

**Documentación oficial:**
- https://developer.paddle.com
- https://developer.paddle.com/webhooks/overview
- https://developer.paddle.com/build/checkout/build-overlay-checkout

**Dashboard de Paddle:**
- Sandbox: https://sandbox-vendors.paddle.com
- Production: https://vendors.paddle.com

**Soporte:**
- Email: support@paddle.com
- Chat en vivo en dashboard

---

**Última actualización**: Octubre 2024
**Versión**: 1.0 (Paddle Integration)
