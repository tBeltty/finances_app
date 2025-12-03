# Finances App v1.0

Una aplicación web moderna y completa para la gestión de finanzas personales y compartidas, construida con React, Node.js y PostgreSQL.

## Características Principales

### 💰 Gestión Financiera
- **Gastos:** Registro detallado de gastos fijos y variables.
- **Categorías:** Sistema flexible de categorías con colores y plantillas predefinidas.
- **Ahorros:** Widget dedicado para metas de ahorro y uso de ahorros para pagar gastos.
- **Multi-moneda:** Soporte nativo para USD, EUR, COP, MXN y HNL.

### 📊 Dashboard & Analytics
- **KPIs en Tiempo Real:** Balance, Gastos Totales, Cuentas por Pagar y Proyección.
- **Visualización:** Gráficos intuitivos de gastos por categoría.
- **Filtros:** Navegación histórica por meses y años.
- **Ordenamiento:** Herramientas para analizar tus gastos por fecha o monto.

### 🏠 Hogares Colaborativos
- **Espacios Compartidos:** Crea múltiples "Hogares" (Personal, Casa, Negocio).
- **Colaboración:** Invita a miembros de tu familia o socios.
- **Roles:** Gestión de permisos (Propietario, Miembro).

### 🔒 Seguridad y Tecnología
- **Autenticación Robusta:** JWT y sesiones seguras.
- **2FA (Doble Factor):** Capa extra de seguridad opcional con TOTP (Google Authenticator).
- **PWA:** Instalable en dispositivos móviles como una app nativa.
- **Diseño Responsivo:** Interfaz optimizada para móviles y escritorio.

## Requisitos Previos

- Node.js (v18 o superior)
- PostgreSQL
- Cuenta de Resend (para correos transaccionales)

## Instalación Rápida

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/finances-app.git
   cd finances-app
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Configuración Automática:**
   Ejecuta el asistente de configuración para establecer tu base de datos y variables de entorno:
   ```bash
   node setup_wizard.cjs
   ```

4. **Iniciar la aplicación:**
   ```bash
   npm run dev
   ```

## Configuración Manual (.env)

Si prefieres configurar manualmente, crea un archivo `server/.env`:

```env
PORT=3001
DB_NAME=finances_db
DB_USER=postgres
DB_PASS=tu_password
DB_HOST=localhost
JWT_SECRET=tu_secreto_super_seguro
RESEND_API_KEY=re_123456789
FROM_EMAIL=noreply@tu-dominio.com
FRONTEND_URL=http://localhost:5173
```

## Stack Tecnológico

- **Frontend:** React, Vite, TailwindCSS, Lucide Icons, Recharts.
- **Backend:** Node.js, Express, Sequelize (ORM).
- **Base de Datos:** PostgreSQL.
- **Infraestructura:** Soporte para despliegue en VPS (Nginx + PM2).

---
© 2025 Finances App. Todos los derechos reservados.
