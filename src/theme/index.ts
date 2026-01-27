const commonTheme = {
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        xxl: 48,
    },
    roundness: {
        s: 8,
        m: 12,
        l: 20,
        full: 9999,
    },
    typography: {
        h1: { fontSize: 32, fontWeight: '700' as const, fontFamily: 'System' },
        h2: { fontSize: 24, fontWeight: '700' as const, fontFamily: 'System' },
        h3: { fontSize: 20, fontWeight: '600' as const, fontFamily: 'System' },
        body: { fontSize: 16, fontWeight: '400' as const, fontFamily: 'System' },
        caption: { fontSize: 14, fontWeight: '400' as const, fontFamily: 'System' },
        button: { fontSize: 16, fontWeight: '600' as const, fontFamily: 'System' },
    },
    shadows: {
        soft: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
        },
    },
};

export const darkTheme = {
    ...commonTheme,
    colors: {
        background: '#0F0F0F',
        surface: '#1A1A1A',
        surfaceVariant: '#242424',
        primary: '#E63946',
        primaryDark: '#B32D38',
        secondary: '#3A86FF',
        accent: '#FFD700',
        text: '#FFFFFF',
        textMuted: '#A0A0A0',
        border: '#333333',
        success: '#4ADE80',
        error: '#FF5252',
        black: '#000000',
        white: '#FFFFFF',
    },
};

export const lightTheme = {
    ...commonTheme,
    colors: {
        background: '#F5F5F7',
        surface: '#FFFFFF',
        surfaceVariant: '#F3F4F6',
        primary: '#E63946',
        primaryDark: '#B32D38',
        secondary: '#3A86FF',
        accent: '#F59E0B',
        text: '#1F2937',
        textMuted: '#6B7280',
        border: '#E5E7EB',
        success: '#10B981',
        error: '#EF4444',
        black: '#000000',
        white: '#FFFFFF',
    },
};

export const theme = darkTheme;

import { useStore } from '../store/useStore';

export const useAppTheme = () => {
    const isDarkMode = useStore((state) => state.isDarkMode);
    return isDarkMode ? darkTheme : lightTheme;
};

export type Theme = typeof theme;
