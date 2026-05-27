// types/user.ts

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: {
    city: string;
    state: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  preferences: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
  language: 'en' | 'hi' | 'kn';
  notifications: NotificationSettings;
  units: {
    temperature: 'celsius' | 'fahrenheit';
    distance: 'km' | 'miles';
    area: 'hectares' | 'acres';
  };
}

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  weather: boolean;
  irrigation: boolean;
  pest: boolean;
  harvest: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  offlineMode: boolean;
  dataSaver: boolean;
  mapType: 'standard' | 'satellite' | 'hybrid';
}
