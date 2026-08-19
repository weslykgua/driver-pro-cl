import { ShiftInput, CalculatedMetrics } from '../types/database';

export function calculateDailyMetrics(input: ShiftInput): CalculatedMetrics {
  const totalHours = input.hours + input.minutes / 60;
  const siiTaxAmount = Math.round(input.grossEarnings * input.siiTaxRate);
  const appLiquid = input.grossEarnings - siiTaxAmount;
  const appBalance = appLiquid - input.cashCollected; // Saldo que queda por cobrar a la app

  const fuelLiters = (input.fuelConsumption / 100) * input.distanceKm;
  const fuelCost = Math.round(fuelLiters * input.gasPricePerLiter);

  const pocketNet = appLiquid - fuelCost; // Dinero real libre
  const pocketNetPerHour = totalHours > 0 ? Math.round(pocketNet / totalHours) : 0;
  const pocketNetPerKm = input.distanceKm > 0 ? Math.round(pocketNet / input.distanceKm) : 0;
  const avgSpeedKmh = totalHours > 0 ? Number((input.distanceKm / totalHours).toFixed(1)) : 0;

  return {
    totalHours: Number(totalHours.toFixed(2)),
    siiTaxAmount,
    appLiquid,
    appBalance,
    fuelLiters: Number(fuelLiters.toFixed(2)),
    fuelCost,
    pocketNet,
    pocketNetPerHour,
    pocketNetPerKm,
    avgSpeedKmh,
  };
}

/**
 * Formats a Chilean Peso amount (e.g. 1300000 -> "$1.300.000")
 */
export function formatCLP(amount: number): string {
  const isNegative = amount < 0;
  const absoluteVal = Math.abs(Math.round(amount));
  const formatted = absoluteVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-' : ''}$${formatted}`;
}

/**
 * Formats decimal hours into HH:MM format (e.g. 3.8 -> "3h 48m")
 */
export function formatHoursDecimal(decimalHours: number): string {
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/**
 * Formats YYYY-MM-DD string to Spanish date representation (e.g. "Lun, 18 Ago")
 */
export function formatDateSpanish(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[date.getDay()]}, ${day} ${months[date.getMonth()]}`;
}
