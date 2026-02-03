import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';

export const JoinCrewScreen = ({ navigation }: any) => {
    const activeTheme = useAppTheme();
    const { joinCrewByInvite } = useStore();
    const [code, setCode] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleJoin = async () => {
        if (code.length < 6) {
            Alert.alert('Error', 'El código debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        const success = await joinCrewByInvite(code);
        setLoading(false);

        if (success) {
            Alert.alert('¡Éxito!', 'Te has unido a la crew correctamente.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } else {
            Alert.alert('Error', 'Código inválido o ya eres miembro de esta crew.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title="Unirse a Crew" showBack onBack={() => navigation.goBack()} />
            <View style={styles.content}>
                <Text style={[styles.text, { color: activeTheme.colors.text }]}>Introduce el código de invitación</Text>

                <TextInput
                    style={[styles.input, {
                        backgroundColor: activeTheme.colors.surface,
                        color: activeTheme.colors.text,
                        borderColor: activeTheme.colors.border
                    }]}
                    placeholder="Ej: A3F7K2"
                    placeholderTextColor={activeTheme.colors.textMuted}
                    value={code}
                    onChangeText={(text) => setCode(text.toUpperCase())}
                    autoCapitalize="characters"
                />

                <Button
                    title="Unirse"
                    onPress={handleJoin}
                    loading={loading}
                    style={{ marginTop: 20, width: '100%' }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.m, alignItems: 'center' },
    text: { fontSize: 16, marginBottom: 20 },
    input: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 18,
        textAlign: 'center',
        letterSpacing: 2
    }
});
