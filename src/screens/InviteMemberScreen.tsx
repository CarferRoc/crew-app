import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

export const InviteMemberScreen = ({ navigation, route }: any) => {
    const { crewId } = route.params;
    const activeTheme = useAppTheme();
    const { sendInvite } = useStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [inviting, setInviting] = useState<string | null>(null);

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length < 3) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        // Search users that match query
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', `%${text}%`)
            .limit(10);

        // Filter out users who are already in the crew (client-side filter for simplicity)
        // Ideally we do a "not in" query but Supabase join syntax could be complex here.
        // For now we just show all matches.

        setSearchResults(data || []);
        setLoading(false);
    };

    const handleInvite = async (userId: string) => {
        setInviting(userId);
        const success = await sendInvite(crewId, userId);
        setInviting(null);

        if (success) {
            Alert.alert('Enviado', 'Invitación enviada correctamente.');
        } else {
            Alert.alert('Error', 'No se pudo enviar la invitación (quizás ya está invitado o es miembro).');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title="Invitar Miembro" showBack onBack={() => navigation.goBack()} />

            <View style={styles.content}>
                <TextInput
                    style={[styles.input, {
                        backgroundColor: activeTheme.colors.surface,
                        color: activeTheme.colors.text,
                        borderColor: activeTheme.colors.border
                    }]}
                    placeholder="Buscar usuario por nick..."
                    placeholderTextColor={activeTheme.colors.textMuted}
                    value={searchQuery}
                    onChangeText={handleSearch}
                />

                {loading && <ActivityIndicator style={{ marginTop: 20 }} color={activeTheme.colors.primary} />}

                <FlatList
                    data={searchResults}
                    keyExtractor={item => item.id}
                    style={{ marginTop: 10 }}
                    renderItem={({ item }) => (
                        <View style={[styles.userRow, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <Image source={{ uri: item.avatar_url || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={[styles.username, { color: activeTheme.colors.text }]}>{item.username}</Text>
                                    <Text style={[styles.location, { color: activeTheme.colors.textMuted }]}>{item.location || 'Sin ubicación'}</Text>
                                </View>
                            </View>
                            <Button
                                title="Invitar"
                                onPress={() => handleInvite(item.id)}
                                loading={inviting === item.id}
                                disabled={!!inviting}
                                style={{ height: 36, paddingHorizontal: 12, minWidth: 80 }}
                                textStyle={{ fontSize: 12 }}
                            />
                        </View>
                    )}
                    ListEmptyComponent={
                        searchQuery.length > 2 && !loading ? (
                            <Text style={{ textAlign: 'center', color: activeTheme.colors.textMuted, marginTop: 20 }}>
                                No se encontraron usuarios.
                            </Text>
                        ) : null
                    }
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: theme.spacing.m },
    input: {
        width: '100%',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 16,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    username: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    location: {
        fontSize: 12,
    }
});
