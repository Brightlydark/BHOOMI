// store/farmStore.ts
import { create } from 'zustand';
import { Farm } from '../types/farm';

interface FarmState {
  farms: Farm[];
  selectedFarm: Farm | null;
  lastUpdated: Date | null;
  
  // Actions
  setFarms: (farms: Farm[]) => void;
  addFarm: (farm: Farm) => void;
  updateFarm: (farmId: string, updates: Partial<Farm>) => void;
  removeFarm: (farmId: string) => void;
  selectFarm: (farm: Farm | null) => void;
  clearFarms: () => void;
}

export const useFarmStore = create<FarmState>((set) => ({
  farms: [],
  selectedFarm: null,
  lastUpdated: null,

  setFarms: (farms) =>
    set({
      farms,
      lastUpdated: new Date(),
    }),

  addFarm: (farm) =>
    set((state) => ({
      farms: [...state.farms, farm],
      lastUpdated: new Date(),
    })),

  updateFarm: (farmId, updates) =>
    set((state) => ({
      farms: state.farms.map((farm) =>
        farm.id === farmId ? { ...farm, ...updates } : farm
      ),
      selectedFarm:
        state.selectedFarm?.id === farmId
          ? { ...state.selectedFarm, ...updates }
          : state.selectedFarm,
      lastUpdated: new Date(),
    })),

  removeFarm: (farmId) =>
    set((state) => ({
      farms: state.farms.filter((farm) => farm.id !== farmId),
      selectedFarm:
        state.selectedFarm?.id === farmId ? null : state.selectedFarm,
      lastUpdated: new Date(),
    })),

  selectFarm: (farm) => set({ selectedFarm: farm }),

  clearFarms: () =>
    set({
      farms: [],
      selectedFarm: null,
      lastUpdated: null,
    }),
}));
