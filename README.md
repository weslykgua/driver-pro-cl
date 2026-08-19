# Conductor Pro Chile 🇨🇱 - Universal App for Transport Drivers

Enterprise financial application for transport drivers (Uber/DiDi/Cabify) in Chile to record daily metrics, tax retentions (SII 15.25%), fuel costs, and pocket net income.

---

## 📊 Supabase SQL Schema (Execute in Supabase SQL Editor)

```sql
-- Perfil de configuración de usuario
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  sii_tax_rate numeric default 0.1525, -- Retención SII (15.25%)
  default_gas_price numeric default 1450, -- CLP por litro
  monthly_pocket_target numeric default 1300000, -- Meta mensual líquido libre
  default_consumption numeric default 7.4, -- L/100km promedio
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Registro diario de turnos con Papelera (is_deleted)
create table if not exists public.daily_shifts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  shift_date date default current_date not null,
  
  gross_earnings numeric not null default 0,
  cash_collected numeric not null default 0,
  hours numeric not null default 0,
  distance_km numeric not null default 0,
  fuel_consumption numeric not null default 7.4,
  gas_price_per_liter numeric not null default 1450,
  sii_tax_rate numeric not null default 0.1525,
  notes text,
  is_deleted boolean default false, -- Papelera de reciclaje
  
  sii_tax_amount numeric not null default 0,
  app_balance numeric not null default 0,
  app_liquid numeric not null default 0,
  fuel_liters numeric not null default 0,
  fuel_cost numeric not null default 0,
  pocket_net numeric not null default 0,
  pocket_net_per_hour numeric not null default 0,
  pocket_net_per_km numeric not null default 0,
  avg_speed_kmh numeric not null default 0,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.daily_shifts enable row level security;

create policy "Users can manage their profile" on public.profiles
  for all using (auth.uid() = id);

create policy "Users can manage their daily shifts" on public.daily_shifts
  for all using (auth.uid() = user_id);
```

---

## 🛠️ Step-by-Step Deployment Instructions

### 1. Despliegue en Supabase
1. Ingresa a [supabase.com](https://supabase.com) y crea un nuevo proyecto (ej. "Conductor Pro Chile").
2. Ve a la pestaña **SQL Editor** en el panel izquierdo.
3. Pega el script SQL de arriba y presiona **Run**.
4. Ve a **Project Settings > API** y copia:
   - `URL` (Project URL)
   - `anon public` key
5. Crea un archivo `.env` en la raíz de tu proyecto con esas llaves:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-llave-anon-publica
   ```

### 2. Despliegue en Vercel
1. Ejecuta la compilación de producción web:
   ```bash
   npm run build:web
   ```
2. Instala la herramienta de Vercel si no la tienes o usa el sitio web de Vercel ([vercel.com](https://vercel.com)):
   - **Opción A (CLI):** Ejecuta `npx vercel` en la terminal. Selecciona el directorio actual `./`.
   - **Opción B (GitHub/Vercel Dashboard):** Sube tu código a GitHub, conéctalo en Vercel e ingresa las Variables de Entorno (`EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
3. Vercel desplegará automáticamente la aplicación estática lista desde la carpeta `dist`.
