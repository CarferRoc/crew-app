import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { BattleCard } from '../components/BattleCard';
import { useStore } from '../store/useStore';
import { Crew } from '../models/types';
import { RankingService } from '../services/RankingService';

export const CarWarScreen = () => {
    const { battles, crews, chooseBattleWinner, currentUser } = useStore();
    const activeTheme = useAppTheme();

    if (!currentUser) return null;

    const sortedCrews = [...crews].sort((a, b) => b.scoreCrew - a.scoreCrew);

    const handleCreateWar = async () => {
        try {
            const exists = await RankingService.checkMonthlyEventExists();
            if (exists) {
                Alert.alert('Aviso', 'Ya existe una Guerra programada para este mes.');
                return;
            }

            Alert.alert(
                'Crear Guerra Mensual',
                '¿Quieres iniciar la Guerra de Clanes de este mes? Esto notificará a todos los usuarios.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Crear',
                        onPress: async () => {
                            try {
                                const date = new Date();
                                const monthName = date.toLocaleString('es-ES', { month: 'long' });
                                await RankingService.createClanWarEvent(`Guerra de ${monthName}`, date);
                                Alert.alert('Éxito', 'La Guerra Mensual ha sido crada.');
                            } catch (error) {
                                Alert.alert('Error', 'No se pudo crear el evento.');
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error(error);
        }
    };

    const renderRankRow = (item: Crew, index: number) => {
        const isTop3 = index < 3;
        return (
            <View key={item.id} style={[styles.rankRow, { borderBottomColor: activeTheme.colors.border }]}>
                <Text style={[
                    styles.rankNumber,
                    { color: activeTheme.colors.textMuted },
                    isTop3 ? { color: activeTheme.colors.accent } : undefined
                ]}>
                    #{index + 1}
                </Text>
                <Image
                    source={{ uri: item.badge || 'https://via.placeholder.com/50' }}
                    style={styles.rankBadge}
                />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.rankName, { color: activeTheme.colors.text }]}>{item.name}</Text>
                    <Text style={[styles.leagueName, { color: activeTheme.colors.textMuted }]}>{item.leagueName || 'Unranked'}</Text>
                </View>
                <Text style={[styles.rankPoints, { color: activeTheme.colors.primary }]}>{item.scoreCrew} PTS</Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title="Car War Global" />
            <FlatList
                data={battles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View style={styles.headerSection}>
                        {currentUser.role === 'admin' && (
                            <TouchableOpacity
                                style={[styles.createBtn, { backgroundColor: activeTheme.colors.primary }]}
                                onPress={handleCreateWar}
                            >
                                <Text style={styles.createBtnText}>CREAR GUERRA MENSUAL</Text>
                            </TouchableOpacity>
                        )}
                        <Text style={[styles.sectionTitle, { color: activeTheme.colors.textMuted }]}>Ranking Global</Text>
                        <View style={[styles.table, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
                            {sortedCrews.map((crew, index) => renderRankRow(crew, index))}
                        </View>
                        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.xl, color: activeTheme.colors.textMuted }]}>Batallas Recientes</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const crewA = crews.find(c => c.id === item.crewA);
                    const crewB = crews.find(c => c.id === item.crewB);

                    if (!crewA || !crewB) return null;

                    return (
                        <BattleCard
                            battle={item}
                            crewA={crewA}
                            crewB={crewB}
                            isAdmin={currentUser.role === 'admin'}
                            onChooseWinner={(winnerId: string) => chooseBattleWinner(item.id, winnerId)}
                        />
                    );
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        padding: theme.spacing.m,
    },
    headerSection: {
        marginBottom: theme.spacing.m,
    },
    sectionTitle: {
        ...theme.typography.h3,
        marginBottom: theme.spacing.m,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    table: {
        borderRadius: theme.roundness.l,
        overflow: 'hidden',
        borderWidth: 1,
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.m,
        borderBottomWidth: 1,
    },
    rankNumber: {
        width: 30,
        fontWeight: 'bold',
    },
    rankBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#333', // Fallback color
    },
    rankName: {
        fontWeight: '600',
        fontSize: 16,
    },
    leagueName: {
        fontSize: 12,
        marginTop: 2,
    },
    rankPoints: {
        fontWeight: 'bold',
    },
    createBtn: {
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        alignItems: 'center',
        marginBottom: theme.spacing.l,
    },
    createBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
