import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export const RegisterScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const theme = useAppTheme();

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
                .upsert({
                    id: data.user.id,
                    username: username,
                    role: 'user'
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
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Header title="Registro" showBack onBack={() => navigation.goBack()} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>Únete a la Crew</Text>
                        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Crea tu cuenta gratis</Text>

                        <Input
                            label="Usuario"
                            placeholder="TuNick"
                            value={username}
                            onChangeText={setUsername}
                            icon={<Ionicons name="person-outline" size={20} color={theme.colors.textMuted} />}
                        />

                        <Input
                            label="Email"
                            placeholder="nombre@ejemplo.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            icon={<Ionicons name="mail-outline" size={20} color={theme.colors.textMuted} />}
                        />

                        <Input
                            label="Contraseña"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            icon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.textMuted} />}
                        />

                        <Button
                            title="CREAR CUENTA"
                            onPress={handleRegister}
                            loading={loading}
                            style={{ marginTop: 10 }}
                        />

                        <TouchableOpacity
                            style={styles.loginLink}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={{ color: theme.colors.textMuted }}>
                                ¿Ya tienes cuenta? <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Entra aquí</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    formContainer: {
        padding: 24,
        borderRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
    },
    loginLink: {
        marginTop: 20,
        alignItems: 'center',
        padding: 10,
    },
});
