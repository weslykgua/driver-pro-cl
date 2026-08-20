export interface Profile {
  id: string;
  email: string | null;
  sii_tax_rate: number;
  default_gas_price: number;
  monthly_pocket_target: number;
  default_consumption: number;
  created_at?: string;
}

export interface DailyShift {
  id: string;
  user_id: string;
  shift_date: string;
  gross_earnings: number;
  cash_collected: number;
  highway_cost?: number;
  hours: number;
  distance_km: number;
  fuel_consumption: number;
  gas_price_per_liter: number;
  sii_tax_rate: number;
  notes?: string | null;
  sii_tax_amount: number;
  app_balance: number;
  app_liquid: number;
  fuel_liters: number;
  fuel_cost: number;
  pocket_net: number;
  pocket_net_per_hour: number;
  pocket_net_per_km: number;
  avg_speed_kmh: number;
  is_deleted?: boolean;
  created_at?: string;
}

export interface ShiftInput {
  grossEarnings: number;
  cashCollected: number;
  highwayCost?: number;
  hours: number;
  minutes: number;
  distanceKm: number;
  fuelConsumption: number;
  gasPricePerLiter: number;
  siiTaxRate: number;
}

export interface CalculatedMetrics {
  totalHours: number;
  siiTaxAmount: number;
  appLiquid: number;
  appBalance: number;
  fuelLiters: number;
  fuelCost: number;
  highwayCost: number;
  pocketNet: number;
  pocketNetPerHour: number;
  pocketNetPerKm: number;
  avgSpeedKmh: number;
}
