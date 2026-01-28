import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { Ionicons } from '@expo/vector-icons';

export const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { setUser } = useStore();
    const theme = useAppTheme();

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
        // Logic identical to before, omitted for brevity in design update but keeping it wired if needed? 
        // For now, focusing on UI. Keeping the placeholder alert if used.
        Alert.alert('Info', 'Google Login en desarrollo');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.logoContainer}>
                        <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.primary }]}>
                            <Ionicons name="car-sport" size={60} color="#FFF" />
                        </View>
                        <Text style={[styles.appName, { color: theme.colors.text }]}>CREW APP</Text>
                        <Text style={[styles.tagline, { color: theme.colors.textMuted }]}>Tu comunidad de coches</Text>
                    </View>

                    <View style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Bienvenido de nuevo</Text>

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
                            title="INICIAR SESIÓN"
                            onPress={handleLogin}
                            loading={loading}
                            style={{ marginTop: 10 }}
                        />

                        <View style={styles.divider}>
                            <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
                            <Text style={[styles.orText, { color: theme.colors.textMuted }]}>O</Text>
                            <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
                        </View>

                        <Button
                            title="Google"
                            onPress={handleGoogleLogin}
                            variant="outline"
                            icon={<Ionicons name="logo-google" size={18} color={theme.colors.text} />}
                        />

                        <TouchableOpacity
                            style={styles.registerLink}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={{ color: theme.colors.textMuted }}>
                                ¿No tienes cuenta? <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Regístrate</Text>
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
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 10,
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    appName: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 16,
        marginTop: 4,
    },
    formContainer: {
        borderRadius: 24,
        padding: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    line: {
        flex: 1,
        height: 1,
    },
    orText: {
        marginHorizontal: 10,
        fontSize: 12,
        fontWeight: 'bold',
    },
    registerLink: {
        marginTop: 20,
        alignItems: 'center',
        padding: 10,
    }
});
