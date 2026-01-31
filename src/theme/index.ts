import { useStore } from '../store/useStore';

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
        m: 16, // Smoother corners
        l: 24,
        full: 9999,
    },
    typography: {
        h1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -1, fontFamily: 'System' },
        h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5, fontFamily: 'System' },
        h3: { fontSize: 18, fontWeight: '700' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const, fontFamily: 'System' },
        body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24, fontFamily: 'System' },
        caption: { fontSize: 13, fontWeight: '500' as const, color: '#888', fontFamily: 'System' },
        button: { fontSize: 16, fontWeight: '700' as const, letterSpacing: 1, textTransform: 'uppercase' as const, fontFamily: 'System' },
    },
    shadows: {
        soft: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
        },
    },
};

export const darkTheme = {
    ...commonTheme,
    colors: {
        background: '#050505', // Deep Black
        surface: '#121212', // Dark Gray
        surfaceVariant: '#1E1E1E', // Lighter Gray for cards
        primary: '#FF3B30', // Neon Red
        primaryDark: '#B32D38',
        secondary: '#2D7FF9', // Electric Blue
        accent: '#FFD700', // Gold
        text: '#FFFFFF',
        textMuted: '#888888',
        border: '#2A2A2A',
        success: '#32D74B',
        error: '#FF453A',
        black: '#000000',
        white: '#FFFFFF',
        overlay: 'rgba(0,0,0,0.7)',
    },
};

export const lightTheme = {
    ...commonTheme,
    colors: {
        background: '#F2F2F7',
        surface: '#FFFFFF',
        surfaceVariant: '#F9F9F9',
        primary: '#FF3B30',
        primaryDark: '#D32F2F',
        secondary: '#007AFF',
        accent: '#FFD700',
        text: '#000000',
        textMuted: '#666666',
        border: '#E5E5EA',
        success: '#34C759',
        error: '#FF3B30',
        black: '#000000',
        white: '#FFFFFF',
        overlay: 'rgba(0,0,0,0.3)',
    },
};

export const theme = darkTheme;


export const useAppTheme = () => {
    const isDarkMode = useStore((state) => state.isDarkMode);
    return isDarkMode ? darkTheme : lightTheme;
};

export type Theme = typeof theme;
