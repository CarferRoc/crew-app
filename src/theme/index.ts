export const theme = {
    colors: {
        background: '#0F0F0F',
        surface: '#1A1A1A',
        surfaceVariant: '#242424',
        primary: '#E63946', // Sporty Red
        primaryDark: '#B32D38',
        secondary: '#3A86FF', // Electric Blue
        accent: '#FFD700', // Trophy Gold
        text: '#FFFFFF',
        textMuted: '#A0A0A0',
        border: '#333333',
        success: '#4ADE80',
        error: '#FF5252',
        black: '#000000',
        white: '#FFFFFF',
    },
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
        h1: { fontSize: 32, fontWeight: '700', fontFamily: 'System' },
        h2: { fontSize: 24, fontWeight: '700', fontFamily: 'System' },
        h3: { fontSize: 20, fontWeight: '600', fontFamily: 'System' },
        body: { fontSize: 16, fontWeight: '400', fontFamily: 'System' },
        caption: { fontSize: 14, fontWeight: '400', fontFamily: 'System' },
        button: { fontSize: 16, fontWeight: '600', fontFamily: 'System' },
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

export type Theme = typeof theme;
