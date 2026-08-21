# 📊 Drivera — Plataforma de Gestión Financiera para Conductores

**Drivera** es una plataforma financiera profesional diseñada específicamente para conductores de aplicaciones de transporte (Uber, DiDi, Cabify) en Chile. 

Permite calcular de forma automática e instantánea el **ingreso neto real en bolsillo**, descontando con precisión la **retención legal del SII (15.25%)**, el gasto estimado de **combustible por kilómetro** y las métricas de rendimiento por hora trabajada.

---

## 🎯 ¿Qué problema resuelve Drivera? (Explicación para no programadores)

Cuando trabajas en aplicaciones de transporte, el monto que ves en la pantalla de la app (Ganancia Bruta) **no es el dinero real que entra a tu bolsillo**.

Para saber cuánto ganaste verdaderamente, debes restar:
1. **La retención legal del SII (15.25%):** El impuesto retenido legalmente sobre tus ingresos brutos.
2. **El consumo real de bencina:** Calculado según el kilometraje recorrido por jornada y el rendimiento de tu vehículo (`L/100km`).

**Drivera hace todos estos cálculos matemáticos de forma automática por ti en segundos**, entregándote cifras exactas de:
- **Dinero líquido libre en tu bolsillo.**
- **Tu ganancia real por hora trabajada (`$/hora`).**
- **Tu ganancia por kilómetro recorrido (`$/km`).**
- **Proyección de cuántas horas y jornadas te faltan para alcanzar tu meta mensual.**

---

## 🚀 ¿Cómo funciona la aplicación?

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│  1. REGISTRO    │ ──> │  2. INGRESO DIARIO  │ ──> │  3. CÁLCULO Y METRIC │
│ Acceso seguro   │     │ Ganancia bruta, km  │     │ Líquido en bolsillo, │
│ con Google/Email│     │ y horas conectadas  │     │ retención SII, $/h   │
└─────────────────┘     └─────────────────────┘     └──────────────────────┘
```

### 1. Inicio de Sesión Seguro por Cuenta
- Accede rápidamente con tu cuenta de **Google** o mediante **correo y contraseña**.
- Todos tus registros se guardan de forma privada e individual en tu cuenta cifrada.

### 2. Registro Rápido de Jornada (`Registrar Turno`)
Al finalizar tu turno de trabajo, ingresas únicamente 4 datos simples:
- 📅 **Fecha del Turno** (con selector de calendario).
- 💰 **Ganancia Bruta en Plataforma ($ CLP).**
- ⏱️ **Tiempo Conectado** (Horas y Minutos).
- 🚗 **Kilometraje Recorrido** (según el odómetro de tu auto).

### 3. Resumen Financiero en Tiempo Real
La aplicación calcula automáticamente:
- **Líquido Neto en Bolsillo:** El dinero disponible real que te queda.
- **Saldo App Transferible:** El monto acumulado que te transferirá la plataforma a tu cuenta bancaria.
- **Gasto de Combustible:** Basado en el precio por litro (`$/L`) y rendimiento de tu vehículo (`L/100km`).
- **Retención Legal SII (15.25%):** Descuento tributario legal calculado.
- **Rendimiento por Hora (`$/h`) y por Kilómetro (`$/km`).**

### 4. Control de Meta Mensual y Proyección
- Define tu meta líquida mensual (por ejemplo, `$1.300.000 CLP`).
- La app te muestra una barra de progreso elegante y te calcula exactamente **cuántas horas y días de trabajo necesitas** para completar tu objetivo.

### 5. Historial, Modificación y Exportación
- **Modificación:** Puedes editar o corregir cualquier día pasado en cualquier momento.
- **Papelera de Reciclaje:** Los turnos eliminados van a una papelera de reciclaje y pueden ser restaurados o eliminados definitivamente.
- **Exportar a CSV / Excel:** Descarga todo tu historial financiero a una planilla de cálculo con un solo clic.
- **Modo Día / Noche:** Cambia entre tema claro y oscuro o deja que la app se adapte automáticamente al modo de tu teléfono o computador.

---

## 🛠️ Tecnologías Utilizadas

La arquitectura de Drivera está construida con tecnología de estándar empresarial para garantizar rapidez, seguridad y funcionamiento fluido tanto en computadores como en teléfonos móviles:

### Frontend / Aplicación
- **[React Native](https://reactnative.dev/) & [Expo Router v3](https://docs.expo.dev/router/introduction/):** Framework universal para desarrollo multiplataforma (Web, Android, iOS).
- **[React Native Web](https://necolas.github.io/react-native-web/):** Renderizado optimizado para computadores de escritorio, monitores 4K y dispositivos móviles.
- **[TypeScript](https://www.typescriptlang.org/):** Código fuertemente tipado para cero errores de ejecución.
- **Dark Fintech Design System:** Sistema de diseño corporativo bancario con tokens dinámicos (`constants/theme.ts`).

### Backend & Base de Datos
- **[Supabase](https://supabase.com/):** Infraestructura en la nube basada en **PostgreSQL**.
- **Supabase Auth & OAuth:** Autenticación por tokens **JWT**, soporte completo para **Google OAuth 2.0** y aislamiento de datos por usuario mediante políticas **RLS (Row Level Security)**.
- **Expo SecureStore & LocalStorage Adapter:** Almacenamiento seguro cifrado de tokens en dispositivos móviles y web.

### Despliegue & Hosting
- **[Vercel](https://vercel.com/):** Despliegue continuo (CI/CD) exportado como Single Page Application (SPA).

---

## ⚙️ Guía para Desarrolladores / Despliegue

### 1. Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto con tus credenciales públicas de Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://yryytrrrbftppigixtkc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo Web
npm run web

# Verificar código TypeScript
npm run typecheck

# Compilar paquete estático para producción / Vercel
npm run build:web
```

---

## 📜 Licencia y Derechos

© 2026 **Drivera** — Todos los derechos reservados. Plataforma de control financiero y gestión operativa para conductores.
