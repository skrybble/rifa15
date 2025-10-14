# Guía de Integración de Stripe - RifaXWin

## 📋 ¿Qué hace falta para completar la integración de Stripe?

### Estado Actual
✅ **Completado:**
- Interfaz UI para gestionar métodos de pago
- Endpoints para guardar/eliminar métodos de pago (solo UI)
- Estructura de datos para métodos de pago

❌ **Pendiente:**
- Integración real con Stripe API
- Procesamiento de pagos de tickets
- Guardado seguro de métodos de pago con Stripe
- Webhooks para confirmar pagos
- Manejo de pagos a creadores (payouts)
- Comisiones del 1% para el admin

---

## 🔑 Paso 1: Obtener Credenciales de Stripe

### 1.1 Crear cuenta en Stripe
1. Ve a https://stripe.com
2. Crea una cuenta o inicia sesión
3. Activa tu cuenta (necesitarás información de tu negocio)

### 1.2 Obtener API Keys
1. Ve al Dashboard de Stripe
2. Click en "Developers" → "API keys"
3. Copia las siguientes claves:
   - **Publishable key** (pk_test_xxx para test, pk_live_xxx para producción)
   - **Secret key** (sk_test_xxx para test, sk_live_xxx para producción)

### 1.3 Configurar Webhook
1. En Dashboard → "Developers" → "Webhooks"
2. Click "Add endpoint"
3. URL: `https://api.tu-dominio.com/api/stripe/webhook`
4. Seleccionar eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.created`
   - `payment_method.attached`
5. Copiar el "Signing secret" (whsec_xxx)

---

## 💻 Paso 2: Instalación de Stripe en Backend

### 2.1 Instalar librería
```bash
cd /app/backend
pip install stripe
pip freeze > requirements.txt
```

### 2.2 Actualizar .env
```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx

# Comisión del sistema (1%)
PLATFORM_COMMISSION_PERCENTAGE=1
```

---

## 🔧 Paso 3: Implementar Backend con Stripe

### 3.1 Actualizar server.py

Agregar imports:
```python
import stripe
import hmac
import hashlib

# Configurar Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
PLATFORM_COMMISSION = float(os.environ.get('PLATFORM_COMMISSION_PERCENTAGE', 1))
```

### 3.2 Modelos actualizados

```python
class StripeCustomer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    stripe_customer_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentIntent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    raffle_id: str
    ticket_numbers: List[int]
    amount: float
    platform_fee: float
    creator_amount: float
    stripe_payment_intent_id: str
    status: str  # pending, succeeded, failed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

### 3.3 Endpoints de Stripe

```python
# ============================================
# STRIPE INTEGRATION
# ============================================

@api_router.post("/stripe/create-customer")
async def create_stripe_customer(current_user: User = Depends(get_current_user)):
    """Crear cliente en Stripe"""
    # Verificar si ya existe
    existing = await db.stripe_customers.find_one({"user_id": current_user.id})
    if existing:
        return {"customer_id": existing["stripe_customer_id"]}
    
    try:
        # Crear cliente en Stripe
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.full_name,
            metadata={"user_id": current_user.id}
        )
        
        # Guardar en DB
        stripe_customer = {
            "user_id": current_user.id,
            "stripe_customer_id": customer.id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.stripe_customers.insert_one(stripe_customer)
        
        return {"customer_id": customer.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/stripe/create-setup-intent")
async def create_setup_intent(current_user: User = Depends(get_current_user)):
    """Crear SetupIntent para guardar método de pago"""
    try:
        # Obtener o crear cliente
        stripe_customer = await db.stripe_customers.find_one({"user_id": current_user.id})
        if not stripe_customer:
            # Crear cliente primero
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.full_name
            )
            stripe_customer = {
                "user_id": current_user.id,
                "stripe_customer_id": customer.id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.stripe_customers.insert_one(stripe_customer)
            customer_id = customer.id
        else:
            customer_id = stripe_customer["stripe_customer_id"]
        
        # Crear SetupIntent
        setup_intent = stripe.SetupIntent.create(
            customer=customer_id,
            payment_method_types=['card']
        )
        
        return {
            "client_secret": setup_intent.client_secret,
            "customer_id": customer_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/stripe/payment-methods")
async def get_stripe_payment_methods(current_user: User = Depends(get_current_user)):
    """Obtener métodos de pago desde Stripe"""
    try:
        stripe_customer = await db.stripe_customers.find_one({"user_id": current_user.id})
        if not stripe_customer:
            return []
        
        payment_methods = stripe.PaymentMethod.list(
            customer=stripe_customer["stripe_customer_id"],
            type="card"
        )
        
        return [{
            "id": pm.id,
            "type": pm.type,
            "card": {
                "brand": pm.card.brand,
                "last4": pm.card.last4,
                "exp_month": pm.card.exp_month,
                "exp_year": pm.card.exp_year
            }
        } for pm in payment_methods.data]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/stripe/payment-methods/{payment_method_id}")
async def delete_stripe_payment_method(
    payment_method_id: str,
    current_user: User = Depends(get_current_user)
):
    """Eliminar método de pago"""
    try:
        stripe.PaymentMethod.detach(payment_method_id)
        return {"message": "Método de pago eliminado"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/stripe/create-payment-intent")
async def create_payment_intent(
    raffle_id: str,
    ticket_numbers: List[int],
    current_user: User = Depends(get_current_user)
):
    """Crear PaymentIntent para comprar tickets"""
    try:
        # Obtener rifa
        raffle = await db.raffles.find_one({"id": raffle_id})
        if not raffle:
            raise HTTPException(status_code=404, detail="Rifa no encontrada")
        
        # Calcular monto
        total_amount = raffle["ticket_price"] * len(ticket_numbers)
        platform_fee = total_amount * (PLATFORM_COMMISSION / 100)
        creator_amount = total_amount - platform_fee
        
        # Obtener cliente Stripe
        stripe_customer = await db.stripe_customers.find_one({"user_id": current_user.id})
        if not stripe_customer:
            raise HTTPException(status_code=400, detail="Cliente Stripe no encontrado")
        
        # Crear PaymentIntent
        payment_intent = stripe.PaymentIntent.create(
            amount=int(total_amount * 100),  # Stripe usa centavos
            currency="usd",
            customer=stripe_customer["stripe_customer_id"],
            metadata={
                "user_id": current_user.id,
                "raffle_id": raffle_id,
                "ticket_numbers": ",".join(map(str, ticket_numbers)),
                "platform_fee": platform_fee,
                "creator_amount": creator_amount
            },
            description=f"Tickets para rifa: {raffle['title']}"
        )
        
        # Guardar en DB
        payment_record = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "raffle_id": raffle_id,
            "ticket_numbers": ticket_numbers,
            "amount": total_amount,
            "platform_fee": platform_fee,
            "creator_amount": creator_amount,
            "stripe_payment_intent_id": payment_intent.id,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_intents.insert_one(payment_record)
        
        return {
            "client_secret": payment_intent.client_secret,
            "amount": total_amount
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    """Webhook de Stripe para confirmar pagos"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Manejar eventos
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        
        # Actualizar payment intent en DB
        await db.payment_intents.update_one(
            {"stripe_payment_intent_id": payment_intent.id},
            {"$set": {"status": "succeeded"}}
        )
        
        # Crear tickets
        payment_record = await db.payment_intents.find_one(
            {"stripe_payment_intent_id": payment_intent.id}
        )
        
        if payment_record:
            for ticket_number in payment_record["ticket_numbers"]:
                ticket = {
                    "id": str(uuid.uuid4()),
                    "raffle_id": payment_record["raffle_id"],
                    "user_id": payment_record["user_id"],
                    "ticket_number": ticket_number,
                    "purchase_date": datetime.now(timezone.utc).isoformat(),
                    "price_paid": payment_record["amount"] / len(payment_record["ticket_numbers"])
                }
                await db.tickets.insert_one(ticket)
            
            # Actualizar estadísticas de la rifa
            await db.raffles.update_one(
                {"id": payment_record["raffle_id"]},
                {
                    "$inc": {
                        "tickets_sold": len(payment_record["ticket_numbers"]),
                        "total_raised": payment_record["creator_amount"]
                    }
                }
            )
            
            # Crear notificación
            await create_notification(
                payment_record["user_id"],
                "Compra Exitosa",
                f"Has comprado {len(payment_record['ticket_numbers'])} tickets exitosamente",
                "ticket_purchase"
            )
    
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        await db.payment_intents.update_one(
            {"stripe_payment_intent_id": payment_intent.id},
            {"$set": {"status": "failed"}}
        )
    
    return {"status": "success"}
```

---

## 🎨 Paso 4: Actualizar Frontend

### 4.1 Instalar Stripe.js
```bash
cd /app/frontend
yarn add @stripe/stripe-js @stripe/react-stripe-js
```

### 4.2 Actualizar .env del frontend
```env
REACT_APP_BACKEND_URL=https://api.tu-dominio.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxx
```

### 4.3 Crear componente de pago

Crear `/app/frontend/src/components/CheckoutForm.js`:

```javascript
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { API } from '../App';

const CheckoutForm = ({ raffleId, ticketNumbers, amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Crear PaymentIntent
      const { data } = await axios.post(`${API}/stripe/create-payment-intent`, {
        raffle_id: raffleId,
        ticket_numbers: ticketNumbers
      });
      
      // Confirmar pago
      const result = await stripe.confirmCardPayment(data.client_secret, {
        payment_method: {
          card: elements.getElement(CardElement)
        }
      });
      
      if (result.error) {
        setError(result.error.message);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          onSuccess();
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-slate-300 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-all disabled:opacity-50"
      >
        {loading ? 'Procesando...' : `Pagar $${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

export default CheckoutForm;
```

### 4.4 Crear página de checkout

Crear `/app/frontend/src/pages/CheckoutPage.js`:

```javascript
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import { ArrowLeft } from 'lucide-react';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

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
          
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">Tickets seleccionados:</p>
            <p className="font-bold text-lg">{ticketNumbers.join(', ')}</p>
            <p className="text-sm text-slate-600 mt-2">Total a pagar:</p>
            <p className="font-bold text-2xl text-sky-600">${amount.toFixed(2)}</p>
          </div>

          <Elements stripe={stripePromise}>
            <CheckoutForm
              raffleId={raffleId}
              ticketNumbers={ticketNumbers}
              amount={amount}
              onSuccess={handleSuccess}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
```

### 4.5 Actualizar App.js

```javascript
import CheckoutPage from './pages/CheckoutPage';

// Agregar ruta
<Route
  path="/checkout"
  element={user ? <CheckoutPage /> : <Navigate to="/login" />}
/>
```

### 4.6 Actualizar RaffleDetailPage

Modificar el botón de compra para redirigir al checkout:

```javascript
const handleBuyTickets = () => {
  navigate('/checkout', {
    state: {
      raffleId: raffle.id,
      ticketNumbers: selectedTickets,
      amount: raffle.ticket_price * selectedTickets.length
    }
  });
};
```

---

## 🔄 Paso 5: Testing

### 5.1 Tarjetas de prueba de Stripe

Para probar en modo test, usa estas tarjetas:

**Tarjeta exitosa:**
- Número: `4242 4242 4242 4242`
- Fecha: Cualquier fecha futura
- CVC: Cualquier 3 dígitos
- ZIP: Cualquier 5 dígitos

**Tarjeta rechazada:**
- Número: `4000 0000 0000 0002`

**Requiere autenticación:**
- Número: `4000 0025 0000 3155`

### 5.2 Flujo de prueba

1. Registrarse/Iniciar sesión
2. Ir a una rifa
3. Seleccionar tickets
4. Click en "Comprar Tickets"
5. Ingresar datos de tarjeta de prueba
6. Confirmar pago
7. Verificar que aparecen los tickets en "Mis Tickets"

---

## 💰 Paso 6: Payouts a Creadores (Opcional)

Para transferir dinero a creadores:

### 6.1 Stripe Connect

```python
# Crear cuenta conectada para creador
@api_router.post("/stripe/create-connected-account")
async def create_connected_account(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.CREATOR:
        raise HTTPException(status_code=403, detail="Solo creadores")
    
    account = stripe.Account.create(
        type="express",
        country="US",
        email=current_user.email,
        capabilities={
            "card_payments": {"requested": True},
            "transfers": {"requested": True},
        },
    )
    
    # Guardar account ID
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"stripe_account_id": account.id}}
    )
    
    # Crear link de onboarding
    account_link = stripe.AccountLink.create(
        account=account.id,
        refresh_url="https://tu-dominio.com/dashboard",
        return_url="https://tu-dominio.com/dashboard",
        type="account_onboarding",
    )
    
    return {"url": account_link.url}

# Hacer payout
@api_router.post("/stripe/payout/{raffle_id}")
async def payout_to_creator(raffle_id: str, current_user: User = Depends(get_current_user)):
    # Solo admin puede hacer payouts
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo admin")
    
    raffle = await db.raffles.find_one({"id": raffle_id})
    creator = await db.users.find_one({"id": raffle["creator_id"]})
    
    if not creator.get("stripe_account_id"):
        raise HTTPException(status_code=400, detail="Creador sin cuenta Stripe")
    
    # Hacer transferencia
    transfer = stripe.Transfer.create(
        amount=int(raffle["total_raised"] * 100),
        currency="usd",
        destination=creator["stripe_account_id"],
        description=f"Payout for raffle: {raffle['title']}"
    )
    
    return {"transfer_id": transfer.id}
```

---

## 📝 Checklist de Integración Stripe

### Configuración Inicial
- [ ] Cuenta de Stripe creada
- [ ] API keys obtenidas (test y live)
- [ ] Webhook configurado
- [ ] Librería Stripe instalada en backend

### Backend
- [ ] Variables de entorno configuradas
- [ ] Modelos creados (StripeCustomer, PaymentIntent)
- [ ] Endpoint crear cliente
- [ ] Endpoint crear PaymentIntent
- [ ] Endpoint webhook implementado
- [ ] Lógica de comisiones implementada
- [ ] Creación automática de tickets al pagar

### Frontend
- [ ] @stripe/stripe-js instalado
- [ ] Publishable key configurada
- [ ] CheckoutForm creado
- [ ] CheckoutPage creada
- [ ] Ruta de checkout agregada
- [ ] Botones actualizados para ir al checkout

### Testing
- [ ] Probado con tarjeta de prueba exitosa
- [ ] Probado con tarjeta rechazada
- [ ] Verificado webhook recibe eventos
- [ ] Verificado creación de tickets
- [ ] Verificado notificaciones

### Producción
- [ ] Cambiado a keys de producción
- [ ] Webhook actualizado con URL de producción
- [ ] Probado en producción con pagos reales pequeños
- [ ] Documentación para usuarios

---

## 🚨 Consideraciones Importantes

### Seguridad
- ❗ **NUNCA** expongas tu Secret Key en el frontend
- ❗ Siempre valida webhooks con el signing secret
- ❗ Usa HTTPS en producción
- ❗ Valida montos en el backend, no confíes en el frontend

### Cumplimiento
- 📋 Lee los términos de servicio de Stripe
- 📋 Implementa política de reembolsos
- 📋 Términos y condiciones claros para usuarios
- 📋 Política de privacidad que mencione Stripe

### Costos de Stripe
- 💵 2.9% + $0.30 por transacción exitosa (USA)
- 💵 Varía según país
- 💵 Sin costos de setup o mensualidad
- 💵 Tu comisión del 1% es adicional a los fees de Stripe

---

## 📞 Soporte

**Documentación oficial:**
- https://stripe.com/docs
- https://stripe.com/docs/payments/payment-intents
- https://stripe.com/docs/webhooks

**Dashboard de Stripe:**
- https://dashboard.stripe.com

---

**Última actualización**: Octubre 2024
