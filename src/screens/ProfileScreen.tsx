import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { Header } from '../components/Header';
import { useStore } from '../store/useStore';

export const ProfileScreen = () => {
    const { currentUser } = useStore();

    return (
        <View style={styles.container}>
            <Header title="Mi Perfil" />
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.profileHeader}>
                    <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
                    <Text style={styles.nick}>{currentUser.nick}</Text>
                    <Text style={styles.location}>{currentUser.location}</Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{currentUser.pointsPersonal}</Text>
                            <Text style={styles.statLabel}>Puntos</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{currentUser.cars.length}</Text>
                            <Text style={styles.statLabel}>Coches</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mis Coches</Text>
                    {currentUser.cars.map(car => (
                        <TouchableOpacity key={car.id} style={styles.carCard}>
                            <View style={styles.carInfo}>
                                <Text style={styles.carBrand}>{car.brand} {car.model}</Text>
                                <Text style={styles.carSpecs}>{car.year} • {car.hp} HP</Text>
                                <View style={styles.modsContainer}>
                                    {car.mods.map((mod, i) => (
                                        <View key={i} style={styles.modBadge}>
                                            <Text style={styles.modText}>{mod}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            <View style={styles.carArrow}>
                                <Text style={{ color: theme.colors.textMuted }}>→</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.settingsRow}>
                    <Text style={styles.settingsText}>Ajustes de la App</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.settingsRow, { marginTop: 8 }]}>
                    <Text style={[styles.settingsText, { color: theme.colors.error }]}>Cerrar Sesión</Text>
                </TouchableOpacity>
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
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.textMuted,
        fontSize: 14,
        marginBottom: theme.spacing.m,
        textTransform: 'uppercase',
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
    modsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 4,
    },
    modBadge: {
        backgroundColor: theme.colors.surfaceVariant,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    modText: {
        fontSize: 10,
        color: theme.colors.primary,
        fontWeight: 'bold',
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
});
