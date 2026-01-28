import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

export const ProfileScreen = ({ navigation, route }: any) => {
    const params = route.params || {};
    const userId = params.userId;

    const { currentUser, setUser, crews, fetchCrews, fetchUserProfile, getOrCreateConversation } = useStore();
    const activeTheme = useAppTheme();

    const [viewUser, setViewUser] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        // Asegurar que tenemos las crews cargadas para saber si el usuario pertenece a una
        if (crews.length === 0) {
            fetchCrews();
        }

        if (userId && userId !== currentUser?.id) {
            loadUserProfile();
        } else {
            setViewUser(currentUser);
        }
    }, [userId, currentUser]);

    const loadUserProfile = async () => {
        setLoading(true);
        const user = await fetchUserProfile(userId);
        setViewUser(user);
        setLoading(false);
    };

    const handleMessage = async () => {
        if (!viewUser) return;
        const convId = await getOrCreateConversation(viewUser.id);
        if (convId) {
            navigation.navigate('ChatView', { conversationId: convId, otherUser: viewUser });
        } else {
            Alert.alert('Error', 'No se pudo iniciar la conversación');
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert('Error', 'No se pudo cerrar sesión');
        } else {
            setUser(null);
        }
    };

    if (!viewUser && loading) {
        return <ActivityIndicator size="large" color={activeTheme.colors.primary} style={{ marginTop: 50 }} />;
    }

    if (!viewUser) {
        return (
            <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
                <Header title="Perfil" />
                <View style={[styles.empty, { backgroundColor: activeTheme.colors.background }]}>
                    <Text style={[styles.emptyText, { color: activeTheme.colors.textMuted }]}>Debes iniciar sesión para ver tu perfil.</Text>
                </View>
            </View>
        );
    }

    const userToDisplay = viewUser;
    const isCurrentUser = userToDisplay.id === currentUser?.id;
    const isMemberOfAnyCrew = crews.some(c => c.members.includes(userToDisplay.id) || c.createdBy === userToDisplay.id);

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header
                title={isCurrentUser ? "Mi Perfil" : `Perfil de ${userToDisplay.username || userToDisplay.nick || 'Usuario'}`}
                showBack={!isCurrentUser}
                onBack={() => navigation.goBack()}
                rightAction={
                    isCurrentUser ? (
                        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                            <Text style={{ color: activeTheme.colors.primary, fontWeight: 'bold' }}>Editar</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleMessage}>
                            <Text style={{ color: activeTheme.colors.primary, fontWeight: 'bold' }}>Mensaje</Text>
                        </TouchableOpacity>
                    )
                }
            />
            <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: activeTheme.colors.background }]}>
                <View style={styles.profileHeader}>
                    <Image source={{ uri: userToDisplay.avatar_url || userToDisplay.avatar || 'https://i.pravatar.cc/150' }} style={[styles.avatar, { borderColor: activeTheme.colors.primary }]} />
                    <Text style={[styles.nick, { color: activeTheme.colors.text }]}>{userToDisplay.username || userToDisplay.nick || 'Usuario'}</Text>
                    <View style={[styles.roleBadge, userToDisplay.role === 'admin' ? styles.adminBadge : [styles.userBadge, { backgroundColor: activeTheme.colors.surfaceVariant }]]}>
                        <Text style={[styles.roleText, { color: activeTheme.colors.text }]}>{userToDisplay.role.toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.location, { color: activeTheme.colors.textMuted }]}>{userToDisplay.location || 'Sin ubicación'}</Text>

                    <View style={[styles.statsContainer, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border, borderWidth: 1 }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: activeTheme.colors.text }]}>{userToDisplay.pointsPersonal}</Text>
                            <Text style={[styles.statLabel, { color: activeTheme.colors.textMuted }]}>Puntos</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: activeTheme.colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: activeTheme.colors.text }]}>{userToDisplay.cars ? userToDisplay.cars.length : 0}</Text>
                            <Text style={[styles.statLabel, { color: activeTheme.colors.textMuted }]}>Coches</Text>
                        </View>
                    </View>

                    {isCurrentUser && !isMemberOfAnyCrew && (
                        <TouchableOpacity
                            style={[styles.inviteButton, { backgroundColor: activeTheme.colors.surfaceVariant, marginTop: 16 }]}
                            onPress={() => navigation.navigate('MyInvites')}
                        >
                            <Text style={{ color: activeTheme.colors.primary, fontWeight: 'bold' }}>📩 Ver Invitaciones</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: activeTheme.colors.textMuted }]}>{isCurrentUser ? 'Mis Coches' : 'Sus Coches'}</Text>
                        {isCurrentUser && (
                            <TouchableOpacity onPress={() => navigation.navigate('AddCar')}>
                                <Text style={{ color: activeTheme.colors.primary, fontWeight: 'bold' }}>+ Añadir</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {userToDisplay.cars && userToDisplay.cars.length > 0 ? (
                        userToDisplay.cars.map((car: any) => (
                            <TouchableOpacity key={car.id} style={[styles.carCard, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
                                {car.photos && car.photos.length > 0 ? (
                                    <Image source={{ uri: car.photos[0] }} style={styles.carImage} />
                                ) : (
                                    <View style={[styles.carPlaceholder, { backgroundColor: activeTheme.colors.surfaceVariant }]}>
                                        <Text style={{ fontSize: 20 }}>🚗</Text>
                                    </View>
                                )}
                                <View style={styles.carInfo}>
                                    <Text style={[styles.carBrand, { color: activeTheme.colors.text }]}>{car.nickname || `${car.brand} ${car.model}`}</Text>
                                    <Text style={[styles.carSpecs, { color: activeTheme.colors.textMuted }]}>{car.brand} {car.model} • {car.year}</Text>
                                    {car.description ? <Text style={[styles.carDesc, { color: activeTheme.colors.textMuted }]} numberOfLines={1}>{car.description}</Text> : null}
                                </View>
                                <View style={styles.carArrow}>
                                    <Text style={{ color: activeTheme.colors.textMuted }}>→</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={[styles.emptySection, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
                            <Text style={[styles.emptyText, { color: activeTheme.colors.textMuted }]}>{isCurrentUser ? 'Aún no has añadido ningún coche.' : 'Este usuario no tiene coches.'}</Text>
                        </View>
                    )}
                </View>

                {isCurrentUser && (
                    <>
                        {userToDisplay.role === 'admin' && (
                            <TouchableOpacity
                                style={[styles.settingsRow, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.accent, borderWidth: 1, marginTop: 24 }]}
                                onPress={() => navigation.navigate('AdminPanel')}
                            >
                                <Text style={[styles.settingsText, { color: activeTheme.colors.accent }]}>Panel Administrador</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.settingsRow, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border, borderWidth: 1, marginTop: 12 }]}
                            onPress={() => navigation.navigate('Settings')}
                        >
                            <Text style={[styles.settingsText, { color: activeTheme.colors.text }]}>Ajustes de la App</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.settingsRow, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border, borderWidth: 1, marginTop: 8 }]}
                            onPress={handleLogout}
                        >
                            <Text style={[styles.settingsText, { color: activeTheme.colors.error }]}>Cerrar Sesión</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scroll: {
        padding: theme.spacing.m,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: theme.colors.primary,
    },
    nick: {
        ...theme.typography.h2,
        color: theme.colors.text,
        marginTop: theme.spacing.m,
    },
    location: {
        ...theme.typography.body,
        color: theme.colors.textMuted,
    },
    statsContainer: {
        flexDirection: 'row',
        marginTop: theme.spacing.l,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        width: '100%',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        ...theme.typography.h3,
        color: theme.colors.text,
    },
    statLabel: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
    },
    statDivider: {
        width: 1,
        backgroundColor: theme.colors.border,
        marginHorizontal: theme.spacing.m,
    },
    section: {
        marginTop: theme.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.textMuted,
        fontSize: 14,
        textTransform: 'uppercase',
    },
    addText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    carCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    carImage: {
        width: 60,
        height: 40,
        borderRadius: 4,
        marginRight: 12,
    },
    carPlaceholder: {
        width: 60,
        height: 40,
        borderRadius: 4,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    carInfo: {
        flex: 1,
    },
    carBrand: {
        ...theme.typography.h3,
        fontSize: 16,
        color: theme.colors.text,
    },
    carSpecs: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    carDesc: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 4,
        fontStyle: 'italic',
    },
    carArrow: {
        paddingLeft: theme.spacing.m,
    },
    settingsRow: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        marginTop: theme.spacing.xl,
    },
    settingsText: {
        color: theme.colors.text,
        fontWeight: '600',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
        marginBottom: 8,
    },
    adminBadge: {
        backgroundColor: theme.colors.accent,
    },
    userBadge: {
        backgroundColor: theme.colors.surfaceVariant,
    },
    roleText: {
        color: theme.colors.black,
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptySection: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.xl,
        borderRadius: theme.roundness.m,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    emptyText: {
        color: theme.colors.textMuted,
        textAlign: 'center',
    },
    inviteButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    }
});
