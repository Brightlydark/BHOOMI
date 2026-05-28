export type ColorPalette = {
  background: string;
  card: string;
  text: string;
  textInverse: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  info: string;
  infoLight: string;
  surfaceActive: string;
  shadow: string;
};

export const lightColors: ColorPalette = {
  background: '#F9FAFB',     // gray-50
  card: '#FFFFFF',           // white
  text: '#111827',           // gray-900
  textInverse: '#FFFFFF',    // white
  textSecondary: '#4B5563',  // gray-600
  textMuted: '#9CA3AF',      // gray-400
  border: '#E5E7EB',         // gray-200
  primary: '#10B981',        // emerald-500
  primaryLight: '#D1FAE5',   // emerald-100
  success: '#059669',        // emerald-600
  successLight: '#ECFDF5',   // emerald-50
  warning: '#D97706',        // amber-600
  warningLight: '#FEF3C7',   // amber-100
  danger: '#DC2626',         // red-600
  dangerLight: '#FEE2E2',    // red-100
  info: '#3B82F6',           // blue-500
  infoLight: '#DBEAFE',      // blue-100
  surfaceActive: '#F3F4F6',  // gray-100
  shadow: '#8C92AC',
};

export const darkColors: ColorPalette = {
  background: '#111827',     // gray-900
  card: '#1F2937',           // gray-800
  text: '#F9FAFB',           // gray-50
  textInverse: '#111827',    // gray-900
  textSecondary: '#D1D5DB',  // gray-300
  textMuted: '#9CA3AF',      // gray-400
  border: '#374151',         // gray-700
  primary: '#10B981',        // emerald-500
  primaryLight: '#065F46',   // emerald-800
  success: '#34D399',        // emerald-400
  successLight: '#064E3B',   // emerald-900
  warning: '#FBBF24',        // amber-400
  warningLight: '#78350F',   // amber-900
  danger: '#F87171',         // red-400
  dangerLight: '#7F1D1D',    // red-900
  info: '#60A5FA',           // blue-400
  infoLight: '#1E3A8A',      // blue-900
  surfaceActive: '#374151',  // gray-700
  shadow: '#000000',
};
