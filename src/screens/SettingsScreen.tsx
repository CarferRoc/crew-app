import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

export const SettingsScreen = ({ navigation }: any) => {
    const { isDarkMode, setDarkMode } = useStore();
    const activeTheme = useAppTheme();

    const handleChangePassword = () => {
        Alert.alert('Próximamente', 'Esta funcionalidad estará disponible pronto.');
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title="Ajustes" showBack onBack={() => navigation.goBack()} />
            <View style={styles.content}>
                <View style={[styles.settingRow, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
                    <View>
                        <Text style={[styles.settingTitle, { color: activeTheme.colors.text }]}>Modo Oscuro</Text>
                        <Text style={[styles.settingDesc, { color: activeTheme.colors.textMuted }]}>Cambia la apariencia de la app</Text>
                    </View>
                    <Switch
                        value={isDarkMode}
                        onValueChange={setDarkMode}
                        trackColor={{ false: '#767577', true: activeTheme.colors.primary }}
                        thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.settingRow, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
                    onPress={handleChangePassword}
                >
                    <View>
                        <Text style={[styles.settingTitle, { color: activeTheme.colors.text }]}>Cambiar Contraseña</Text>
                        <Text style={[styles.settingDesc, { color: activeTheme.colors.textMuted }]}>Gestiona la seguridad de tu cuenta</Text>
                    </View>
                    <Text style={[styles.arrow, { color: activeTheme.colors.textMuted }]}>→</Text>
                </TouchableOpacity>

                <View style={styles.versionInfo}>
                    <Text style={[styles.versionText, { color: activeTheme.colors.textMuted }]}>Crew App v1.0.0</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.m },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    settingTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
    settingDesc: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
    arrow: { color: theme.colors.textMuted, fontSize: 18 },
    versionInfo: { alignItems: 'center', marginTop: 40 },
    versionText: { color: theme.colors.textMuted, fontSize: 12 },
});
