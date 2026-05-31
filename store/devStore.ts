import { create } from 'zustand';

interface DevStoreState {
  overrideEnabled: boolean;
  mockTemp: number;
  mockMoisture: number;
  mockHumidity: number;
  mockRainfall: number;
  mockUv: number;
  mockCropType: string;
  mockSoilType: string;

  setOverrideEnabled: (enabled: boolean) => void;
  setMockData: (data: Partial<Omit<DevStoreState, 'setOverrideEnabled' | 'setMockData' | 'resetMockData'>>) => void;
  resetMockData: () => void;
}

const initialMockData = {
  mockTemp: 30,
  mockMoisture: 60,
  mockHumidity: 60,
  mockRainfall: 0,
  mockUv: 5,
  mockCropType: 'rice',
  mockSoilType: 'clay',
};

export const useDevStore = create<DevStoreState>((set) => ({
  overrideEnabled: false,
  ...initialMockData,

  setOverrideEnabled: (enabled) => set({ overrideEnabled: enabled }),
  setMockData: (data) => set((state) => ({ ...state, ...data })),
  resetMockData: () => set(initialMockData),
}));
