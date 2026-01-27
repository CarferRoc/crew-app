import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

export const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { setUser } = useStore();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor, rellena todos los campos.');
            return;
        }

        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert('Error', error.message);
            setLoading(false);
            return;
        }

        // Fetch profile and cars
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        const { data: cars } = await supabase
            .from('cars')
            .select('*')
            .eq('owner_id', data.user.id);

        if (profileError) {
            Alert.alert('Error', 'No se pudo cargar el perfil.');
        } else {
            setUser({
                id: profile.id,
                nick: profile.username || 'Sin nombre',
                avatar: profile.avatar_url || 'https://i.pravatar.cc/150',
                bio: '',
                location: '',
                role: profile.role,
                pointsPersonal: 0,
                cars: (cars || []).map(c => ({
                    id: c.id,
                    brand: c.brand,
                    model: c.model,
                    year: c.year,
                    hp: c.hp,
                    nickname: c.nickname,
                    description: c.description,
                    mods: c.mods || [],
                    photos: c.photos || []
                })),
            });
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);

            // Carga dinámica para evitar errores en Expo Go
            const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');

            GoogleSignin.configure({
                webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            });

            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            if (userInfo.data?.idToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                });

                if (error) throw error;

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user?.id)
                    .single();

                if (profile) {
                    setUser({
                        id: profile.id,
                        nick: profile.username || 'Google User',
                        avatar: profile.avatar_url || 'https://i.pravatar.cc/150',
                        bio: '',
                        location: '',
                        role: profile.role,
                        pointsPersonal: 0,
                        cars: [],
                    });
                }
            }
        } catch (error: any) {
            // Manejo de errores dinámico
            const { statusCodes } = require('@react-native-google-signin/google-signin');
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // cancelado
            } else if (error.code === 'RNGoogleSignin' || error.message?.includes('RNGoogleSignin')) {
                Alert.alert('Expo Go', 'El inicio de sesión con Google requiere una compilación nativa (Development Build).');
            } else {
                console.error('Google Sign-In Error:', error);
                Alert.alert('Error', 'No se pudo iniciar sesión con Google. ' + (error.message || ''));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Header title="Iniciar Sesión" />
            <View style={styles.content}>
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
                    title={loading ? "Cargando..." : "Entrar"}
                    onPress={handleLogin}
                    disabled={loading}
                />

                <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
                    <Text style={styles.googleBtnText}>Continuar con Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.registerLink}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.registerText}>¿No tienes cuenta? <Text style={{ color: theme.colors.primary }}>Regístrate</Text></Text>
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
    googleBtn: {
        backgroundColor: '#FFFFFF',
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        alignItems: 'center',
        marginTop: theme.spacing.m,
    },
    googleBtnText: { color: '#000000', fontWeight: 'bold' },
    registerLink: { marginTop: theme.spacing.xl, alignItems: 'center' },
    registerText: { color: theme.colors.textMuted },
});
