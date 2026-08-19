# 📊 TripRate — Plataforma de Gestión Financiera para Conductores

**TripRate** es una plataforma financiera profesional diseñada específicamente para conductores de aplicaciones de transporte (Uber, DiDi, Cabify) en Chile. 

Permite calcular de forma automática e instantánea el **ingreso neto real en bolsillo**, descontando con precisión la **retención legal del SII (15.25%)**, el gasto estimado de **combustible por kilómetro** y las métricas de rendimiento por hora trabajada.

---

## 🎯 ¿Qué problema resuelve TripRate? (Explicación para no programadores)

Cuando trabajas en aplicaciones de transporte, el monto que ves en la pantalla de la app (Ganancia Bruta) **no es el dinero real que entra a tu bolsillo**.

Para saber cuánto ganaste verdaderamente, debes restar:
1. **La retención legal del SII (15.25%):** El impuesto retenido legalmente sobre tus ingresos brutos.
2. **El consumo real de bencina:** Calculado según el kilometraje recorrido por jornada y el rendimiento de tu vehículo (`L/100km`).

**TripRate hace todos estos cálculos matemáticos de forma automática por ti en segundos**, entregándote cifras exactas de:
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

La arquitectura de TripRate está construida con tecnología de estándar empresarial para garantizar rapidez, seguridad y funcionamiento fluido tanto en computadores como en teléfonos móviles:

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

### 2. Esquema SQL para Supabase

Ejecuta el siguiente script en el **SQL Editor** de Supabase para crear las tablas con reglas de seguridad **RLS**:

```sql
-- 1. Tabla de Perfiles de Usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  sii_tax_rate NUMERIC DEFAULT 0.1525,
  default_gas_price NUMERIC DEFAULT 1450,
  monthly_pocket_target NUMERIC DEFAULT 1300000,
  default_consumption NUMERIC DEFAULT 7.4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Turnos Diarios
CREATE TABLE IF NOT EXISTS public.daily_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  gross_earnings NUMERIC NOT NULL DEFAULT 0,
  cash_collected NUMERIC NOT NULL DEFAULT 0,
  hours NUMERIC NOT NULL DEFAULT 0,
  distance_km NUMERIC NOT NULL DEFAULT 0,
  fuel_consumption NUMERIC NOT NULL DEFAULT 7.4,
  gas_price_per_liter NUMERIC NOT NULL DEFAULT 1450,
  sii_tax_rate NUMERIC NOT NULL DEFAULT 0.1525,
  sii_tax_amount NUMERIC NOT NULL DEFAULT 0,
  app_balance NUMERIC NOT NULL DEFAULT 0,
  app_liquid NUMERIC NOT NULL DEFAULT 0,
  fuel_liters NUMERIC NOT NULL DEFAULT 0,
  fuel_cost NUMERIC NOT NULL DEFAULT 0,
  pocket_net NUMERIC NOT NULL DEFAULT 0,
  pocket_net_per_hour NUMERIC NOT NULL DEFAULT 0,
  pocket_net_per_km NUMERIC NOT NULL DEFAULT 0,
  avg_speed_kmh NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_shifts ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad para Profiles
CREATE POLICY "Usuarios administran su propio perfil" 
  ON public.profiles FOR ALL 
  USING (auth.uid() = id);

-- Políticas de Seguridad para Daily Shifts
CREATE POLICY "Usuarios administran sus propios turnos" 
  ON public.daily_shifts FOR ALL 
  USING (auth.uid() = user_id);
```

### 3. Comandos de Desarrollo

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

© 2026 **TripRate** — Todos los derechos reservados. Plataforma de control financiero y gestión operativa para conductores.
