// store/farmStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Farm } from '../types/farm';

interface FarmState {
  farms: Farm[];
  userFarms: Farm[];   // farms added by the user (persisted permanently)
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

export const useFarmStore = create<FarmState>()(
  persist(
    (set, get) => ({
      farms: [],
      userFarms: [],
      selectedFarm: null,
      lastUpdated: null,

      setFarms: (farms) => {
        const { userFarms } = get();
        // Merge: user-added farms always stay in list, de-duplicated by id
        const userFarmIds = new Set(userFarms.map((f) => f.id));
        const merged = [
          ...userFarms,
          ...farms.filter((f) => !userFarmIds.has(f.id)),
        ];
        set({ farms: merged, lastUpdated: new Date() });
      },

      addFarm: (farm) =>
        set((state) => {
          const userFarms = [...state.userFarms, farm];
          const farms = [farm, ...state.farms];
          return { farms, userFarms, lastUpdated: new Date() };
        }),

      updateFarm: (farmId, updates) =>
        set((state) => ({
          farms: state.farms.map((f) =>
            f.id === farmId ? { ...f, ...updates } : f
          ),
          userFarms: state.userFarms.map((f) =>
            f.id === farmId ? { ...f, ...updates } : f
          ),
          selectedFarm:
            state.selectedFarm?.id === farmId
              ? { ...state.selectedFarm, ...updates }
              : state.selectedFarm,
          lastUpdated: new Date(),
        })),

      removeFarm: (farmId) =>
        set((state) => ({
          farms: state.farms.filter((f) => f.id !== farmId),
          userFarms: state.userFarms.filter((f) => f.id !== farmId),
          selectedFarm:
            state.selectedFarm?.id === farmId ? null : state.selectedFarm,
          lastUpdated: new Date(),
        })),

      selectFarm: (farm) => set({ selectedFarm: farm }),

      clearFarms: () =>
        set({ farms: [], selectedFarm: null, lastUpdated: null }),
    }),
    {
      name: 'bhoomi-farm-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user-added farms; the broader farms list is re-fetched on open
      partialize: (state) => ({
        userFarms: state.userFarms,
      }),
    }
  )
);
