import { useColorScheme } from 'react-native';
import { useUserStore } from '../store/userStore';
import { lightColors, darkColors, ColorPalette } from './colors';

export const useAppTheme = (): { colors: ColorPalette; isDark: boolean; theme: 'light' | 'dark' } => {
  const { preferences } = useUserStore();
  const systemColorScheme = useColorScheme();

  const isDark = 
    preferences.theme === 'dark' || 
    (preferences.theme === 'system' && systemColorScheme === 'dark');

  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
    theme: isDark ? 'dark' : 'light',
  };
};
