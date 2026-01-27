import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';

export const MyInvitesScreen = ({ navigation }: any) => {
    const activeTheme = useAppTheme();
    const { fetchMyInvites, acceptInvite, rejectInvite } = useStore();

    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        loadInvites();
    }, []);

    const loadInvites = async () => {
        setLoading(true);
        const data = await fetchMyInvites();
        setInvites(data);
        setLoading(false);
    };

    const handleAccept = async (inviteId: string) => {
        setProcessing(inviteId);
        const success = await acceptInvite(inviteId);
        setProcessing(null);
        if (success) {
            Alert.alert('¡Bienvenido!', 'Te has unido a la crew.');
            loadInvites();
        } else {
            Alert.alert('Error', 'No se pudo aceptar la invitación.');
        }
    };

    const handleReject = async (inviteId: string) => {
        setProcessing(inviteId);
        const success = await rejectInvite(inviteId);
        setProcessing(null);
        if (success) {
            loadInvites();
        } else {
            Alert.alert('Error', 'No se pudo rechazar la invitación.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title="Mis Invitaciones" showBack onBack={() => navigation.goBack()} />

            {loading ? (
                <ActivityIndicator size="large" color={activeTheme.colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={invites}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: theme.spacing.m }}
                    renderItem={({ item }) => (
                        <View style={[styles.inviteCard, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                {item.crews?.image_url ? (
                                    <Image source={{ uri: item.crews.image_url }} style={styles.crewImage} />
                                ) : (
                                    <View style={[styles.crewImagePlaceholder, { backgroundColor: activeTheme.colors.surfaceVariant }]}>
                                        <Text style={{ fontSize: 20 }}>🛡️</Text>
                                    </View>
                                )}
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={[styles.crewName, { color: activeTheme.colors.text }]}>{item.crews?.name}</Text>
                                    <Text style={[styles.meta, { color: activeTheme.colors.textMuted }]}>
                                        {item.crews?.members_data?.[0]?.count || 0} Miembros
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.actions}>
                                <Button
                                    title="Rechazar"
                                    variant="outline"
                                    onPress={() => handleReject(item.id)}
                                    loading={processing === item.id}
                                    disabled={!!processing}
                                    style={{ flex: 1, marginRight: 8 }}
                                />
                                <Button
                                    title="Aceptar"
                                    variant="primary"
                                    onPress={() => handleAccept(item.id)}
                                    loading={processing === item.id}
                                    disabled={!!processing}
                                    style={{ flex: 1, marginLeft: 8 }}
                                />
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
                            <Text style={{ color: activeTheme.colors.textMuted }}>No tienes invitaciones pendientes.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    inviteCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
    },
    crewImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    crewImagePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    crewName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    meta: {
        fontSize: 12,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    empty: {
        alignItems: 'center',
        marginTop: 50,
    }
});
