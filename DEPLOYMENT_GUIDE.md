# Guía de Deployment - RafflyWin

## 📋 Requisitos del Servidor

### Especificaciones Mínimas
- **OS**: Ubuntu 20.04 LTS o superior / Debian 11+
- **CPU**: 2 cores
- **RAM**: 4GB mínimo (8GB recomendado)
- **Disco**: 20GB SSD mínimo
- **Puertos**: 80 (HTTP), 443 (HTTPS), 22 (SSH)

### Software Requerido
- Node.js 18.x o superior
- Python 3.9 o superior
- MongoDB 5.0 o superior
- Nginx
- Certbot (para SSL)
- Git

---

## 🔧 Paso 1: Preparar el Servidor

### 1.1 Actualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Instalar Node.js
```bash
# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version
npm --version

# Instalar Yarn globalmente
sudo npm install -g yarn
```

### 1.3 Instalar Python y pip
```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version
pip3 --version
```

### 1.4 Instalar MongoDB
```bash
# Importar clave pública
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Crear archivo de lista
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Actualizar e instalar
sudo apt update
sudo apt install -y mongodb-org

# Iniciar y habilitar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verificar estado
sudo systemctl status mongod
```

### 1.5 Instalar Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.6 Instalar PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

---

## 📦 Paso 2: Clonar y Configurar la Aplicación

### 2.1 Crear Usuario para la Aplicación
```bash
sudo adduser rafflywin
sudo usermod -aG sudo rafflywin
su - rafflywin
```

### 2.2 Clonar Repositorio
```bash
cd /home/rafflywin
git clone <URL_DE_TU_REPOSITORIO> rafflywin-app
cd rafflywin-app
```

### 2.3 Configurar MongoDB
```bash
# Conectar a MongoDB
mongosh

# Crear base de datos y usuario
use rafflywin_db

db.createUser({
  user: "rafflywin_user",
  pwd: "TU_PASSWORD_SEGURO",
  roles: [
    { role: "readWrite", db: "rafflywin_db" }
  ]
})

exit
```

---

## 🔐 Paso 3: Configurar Variables de Entorno

### 3.1 Backend (.env)
```bash
cd /home/rafflywin/rafflywin-app/backend
nano .env
```

**Contenido del archivo:**
```env
# MongoDB
MONGO_URL=mongodb://rafflywin_user:TU_PASSWORD_SEGURO@localhost:27017/rafflywin_db

# JWT Secret (generar uno aleatorio)
JWT_SECRET=tu_jwt_secret_muy_seguro_y_largo_aqui

# CORS Origins
CORS_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com

# Stripe (cuando lo configures)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Puerto
PORT=8001
```

### 3.2 Frontend (.env)
```bash
cd /home/rafflywin/rafflywin-app/frontend
nano .env
```

**Contenido del archivo:**
```env
REACT_APP_BACKEND_URL=https://api.tu-dominio.com
```

---

## 📦 Paso 4: Instalar Dependencias

### 4.1 Backend
```bash
cd /home/rafflywin/rafflywin-app/backend

# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Desactivar entorno virtual
deactivate
```

### 4.2 Frontend
```bash
cd /home/rafflywin/rafflywin-app/frontend

# Instalar dependencias
yarn install

# Construir para producción
yarn build
```

---

## 🚀 Paso 5: Configurar PM2 para Backend

### 5.1 Crear archivo de configuración PM2
```bash
cd /home/rafflywin/rafflywin-app
nano ecosystem.config.js
```

**Contenido:**
```javascript
module.exports = {
  apps: [
    {
      name: 'rafflywin-backend',
      script: 'venv/bin/uvicorn',
      args: 'server:app --host 0.0.0.0 --port 8001',
      cwd: '/home/rafflywin/rafflywin-app/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### 5.2 Iniciar Backend con PM2
```bash
cd /home/rafflywin/rafflywin-app
pm2 start ecosystem.config.js

# Configurar PM2 para iniciar al arranque
pm2 startup
pm2 save

# Verificar estado
pm2 status
pm2 logs rafflywin-backend
```

---

## 🌐 Paso 6: Configurar Nginx

### 6.1 Crear configuración de Nginx
```bash
sudo nano /etc/nginx/sites-available/rafflywin
```

**Contenido:**
```nginx
# Backend API
server {
    listen 80;
    server_name api.tu-dominio.com;

    # Tamaño máximo de archivo (para uploads)
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts para uploads grandes
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
}

# Frontend
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    root /home/rafflywin/rafflywin-app/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Servir archivos estáticos
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Servir uploads del backend
    location /uploads/ {
        proxy_pass http://localhost:8001/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # React Router - todas las rutas al index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 6.2 Habilitar sitio
```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/rafflywin /etc/nginx/sites-enabled/

# Eliminar configuración por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔒 Paso 7: Configurar SSL con Let's Encrypt

### 7.1 Instalar Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Obtener certificados SSL
```bash
# Para el dominio principal
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Para el subdominio API
sudo certbot --nginx -d api.tu-dominio.com
```

### 7.3 Configurar renovación automática
```bash
# Verificar renovación automática
sudo certbot renew --dry-run

# El cron job se crea automáticamente
```

---

## 🔥 Paso 8: Configurar Firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow 22

# Permitir HTTP y HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Verificar estado
sudo ufw status
```

---

## 📊 Paso 9: Monitoreo y Logs

### 9.1 Ver logs del backend
```bash
pm2 logs rafflywin-backend
pm2 logs rafflywin-backend --lines 100
```

### 9.2 Ver logs de Nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 9.3 Ver logs de MongoDB
```bash
sudo tail -f /var/log/mongodb/mongod.log
```

### 9.4 Monitoreo con PM2
```bash
pm2 monit
```

---

## 🔄 Paso 10: Proceso de Actualización

### 10.1 Script de actualización
Crear archivo `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Iniciando deployment..."

# Navegar al directorio
cd /home/rafflywin/rafflywin-app

# Obtener últimos cambios
echo "📥 Obteniendo últimos cambios..."
git pull origin main

# Backend
echo "🔧 Actualizando backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Frontend
echo "🎨 Construyendo frontend..."
cd ../frontend
yarn install
yarn build

# Reiniciar backend
echo "🔄 Reiniciando backend..."
pm2 restart rafflywin-backend

# Limpiar caché de Nginx
echo "🧹 Limpiando caché..."
sudo systemctl reload nginx

echo "✅ Deployment completado!"
```

Hacer ejecutable:
```bash
chmod +x deploy.sh
```

### 10.2 Ejecutar actualización
```bash
./deploy.sh
```

---

## 🛡️ Paso 11: Seguridad Adicional

### 11.1 Configurar MongoDB con autenticación
```bash
sudo nano /etc/mongod.conf
```

Agregar:
```yaml
security:
  authorization: enabled
```

Reiniciar:
```bash
sudo systemctl restart mongod
```

### 11.2 Fail2Ban para proteger SSH
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 11.3 Actualizar sistema regularmente
```bash
# Configurar actualizaciones automáticas
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 🔍 Troubleshooting

### Backend no inicia
```bash
# Ver logs detallados
pm2 logs rafflywin-backend --lines 200

# Reiniciar
pm2 restart rafflywin-backend

# Si persiste, iniciar manualmente para ver error
cd /home/rafflywin/rafflywin-app/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Error 502 Bad Gateway
```bash
# Verificar que backend esté corriendo
pm2 status

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar configuración de Nginx
sudo nginx -t
```

### MongoDB no conecta
```bash
# Verificar estado
sudo systemctl status mongod

# Ver logs
sudo tail -f /var/log/mongodb/mongod.log

# Reiniciar
sudo systemctl restart mongod
```

### Frontend no carga
```bash
# Verificar que el build exista
ls -la /home/rafflywin/rafflywin-app/frontend/build

# Reconstruir
cd /home/rafflywin/rafflywin-app/frontend
yarn build

# Verificar permisos
sudo chown -R rafflywin:rafflywin /home/rafflywin/rafflywin-app/frontend/build
```

---

## 📝 Checklist de Deployment

- [ ] Servidor configurado con requisitos mínimos
- [ ] Node.js, Python, MongoDB, Nginx instalados
- [ ] Repositorio clonado
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas (backend y frontend)
- [ ] Frontend construido para producción
- [ ] Backend corriendo con PM2
- [ ] Nginx configurado y funcionando
- [ ] SSL configurado con Let's Encrypt
- [ ] Firewall configurado
- [ ] DNS apuntando al servidor
- [ ] MongoDB con autenticación habilitada
- [ ] Backups configurados
- [ ] Monitoreo configurado

---

## 🔄 Mantenimiento Regular

### Diario
- Verificar logs para errores: `pm2 logs`
- Revisar uso de recursos: `pm2 monit`

### Semanal
- Revisar logs de Nginx: `sudo tail -n 100 /var/log/nginx/error.log`
- Verificar espacio en disco: `df -h`
- Revisar actualizaciones: `sudo apt update`

### Mensual
- Actualizar sistema: `sudo apt upgrade`
- Revisar y limpiar logs antiguos
- Verificar backups de MongoDB
- Revisar certificados SSL (renovación automática)

---

## 📞 Soporte

Para problemas específicos, revisa:
1. Logs de PM2: `pm2 logs`
2. Logs de Nginx: `/var/log/nginx/`
3. Logs de MongoDB: `/var/log/mongodb/`
4. Estado de servicios: `sudo systemctl status <servicio>`

---

**Última actualización**: Octubre 2024
