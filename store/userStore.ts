// store/userStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserPreferences, NotificationSettings } from '../types/user';

interface UserState {
  user: User | null;
  preferences: UserPreferences;
  isOnboarded: boolean;
  
  // Actions
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  login: (phone: string) => void;
  completeSetup: (name: string) => void;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: 'en' | 'hi' | 'kn') => void;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  setOnboarded: (onboarded: boolean) => void;
  logout: () => void;
}

const defaultPreferences: UserPreferences = {
  language: 'en',
  theme: 'system',
  notifications: {
    push: true,
    email: true,
    weather: true,
    irrigation: true,
    pest: true,
    harvest: true,
  },
  units: {
    temperature: 'celsius',
    distance: 'km',
    area: 'hectares',
  },
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      preferences: defaultPreferences,
      isOnboarded: false,

      setUser: (user) => set({ user }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      login: (phone: string) => 
        set({
          user: {
            id: Math.random().toString(36).substring(7),
            name: '',
            email: '',
            phone,
            location: { city: '', state: '', country: '' },
            preferences: defaultPreferences,
            createdAt: new Date(),
          }
        }),

      completeSetup: (name: string) =>
        set((state) => ({
          user: state.user ? { ...state.user, name } : null,
        })),

      setPreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        })),

      setTheme: (theme) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            theme,
          },
        })),

      setLanguage: (language) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            language,
          },
        })),

      setNotificationSettings: (settings) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            notifications: {
              ...state.preferences.notifications,
              ...settings,
            },
          },
        })),

      setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),

      logout: () =>
        set({
          user: null,
          preferences: defaultPreferences,
        }),
    }),
    {
      name: 'bhoomi-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
