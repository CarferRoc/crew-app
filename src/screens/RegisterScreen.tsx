import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';

export const RegisterScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email || !password || !username) {
            Alert.alert('Error', 'Por favor, rellena todos los campos.');
            return;
        }

        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            Alert.alert('Error', error.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            // Create profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    username,
                    role: 'user', // Default role
                });

            if (profileError) {
                Alert.alert('Error', 'Cuenta creada pero el perfil falló: ' + profileError.message);
            } else {
                Alert.alert('Éxito', '¡Cuenta creada! Revisa tu email para confirmar (si está activado).');
                navigation.navigate('Login');
            }
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Header title="Registro" />
            <View style={styles.content}>
                <TextInput
                    style={styles.input}
                    placeholder="Nombre de Usuario"
                    placeholderTextColor={theme.colors.textMuted}
                    value={username}
                    onChangeText={setUsername}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={theme.colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    placeholderTextColor={theme.colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <Button
                    title={loading ? "Registrando..." : "Crear Cuenta"}
                    onPress={handleRegister}
                    disabled={loading}
                />

                <TouchableOpacity
                    style={styles.loginLink}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.loginText}>¿Ya tienes cuenta? <Text style={{ color: theme.colors.primary }}>Entra aquí</Text></Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.xl, flex: 1, justifyContent: 'center' },
    input: {
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    loginLink: { marginTop: theme.spacing.xl, alignItems: 'center' },
    loginText: { color: theme.colors.textMuted },
});
