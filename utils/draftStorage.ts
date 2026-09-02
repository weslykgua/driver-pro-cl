import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SHIFT_DRAFT_KEY = 'drivera_shift_draft_v1';

export interface ShiftDraftData {
  shiftDate?: string;
  grossEarningsStr?: string;
  cashCollectedStr?: string;
  highwayCostStr?: string;
  privateEarningsStr?: string;
  showPrivateSection?: boolean;
  hoursStr?: string;
  minutesStr?: string;
  distanceKmStr?: string;
  fuelConsumptionStr?: string;
  gasPriceStr?: string;
  notes?: string;
  selectedBrand?: string;
  hasUserEditedConsumption?: boolean;
  hasUserEditedGasPrice?: boolean;
}

export const saveShiftDraft = async (data: ShiftDraftData): Promise<void> => {
  try {
    const serialized = JSON.stringify(data);
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SHIFT_DRAFT_KEY, serialized);
      }
      return;
    }
    await SecureStore.setItemAsync(SHIFT_DRAFT_KEY, serialized);
  } catch (e) {
    console.warn('Error saving shift draft:', e);
  }
};

export const loadShiftDraft = async (): Promise<ShiftDraftData | null> => {
  try {
    let serialized: string | null = null;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        serialized = window.localStorage.getItem(SHIFT_DRAFT_KEY);
      }
    } else {
      serialized = await SecureStore.getItemAsync(SHIFT_DRAFT_KEY);
    }

    if (!serialized) return null;
    return JSON.parse(serialized) as ShiftDraftData;
  } catch (e) {
    console.warn('Error loading shift draft:', e);
    return null;
  }
};

export const clearShiftDraft = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(SHIFT_DRAFT_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(SHIFT_DRAFT_KEY);
  } catch (e) {
    console.warn('Error clearing shift draft:', e);
  }
};

