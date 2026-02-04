import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { BattleCard } from '../components/BattleCard';
import { useStore } from '../store/useStore';
import { Crew, ClanWarEvent } from '../models/types';
import { RankingService } from '../services/RankingService';

export const CarWarScreen = () => {
    const { t } = useTranslation();
    const { battles, crews, chooseBattleWinner, currentUser } = useStore();
    const activeTheme = useAppTheme();
    const [activeWar, setActiveWar] = useState<ClanWarEvent | null>(null);
    const [mvp, setMvp] = useState<any>(null);

    if (!currentUser) return null;

    useFocusEffect(
        useCallback(() => {
            fetchWarStatus();
        }, [])
    );

    const fetchWarStatus = async () => {
        try {
            const events = await RankingService.getActiveEvents();
            // Find current month's event or any active/pending
            // Sort by date desc to get latest
            events.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

            const current = events[0]; // Get the latest event regardless of status (so we see MVP of completed one)
            setActiveWar(current || null);

            if (current) {
                const mvpData = await RankingService.getEventMVP(current.id);
                setMvp(mvpData);
            }
        } catch (error) {
            console.error('Error fetching war status:', error);
        }
    };

    const sortedCrews = [...crews].sort((a, b) => b.scoreCrew - a.scoreCrew);

    const handleCreateWar = async () => {
        try {
            const exists = await RankingService.checkMonthlyEventExists();
            if (exists) {
                Alert.alert(t('war.alerts.notice'), t('war.alerts.warExists'));
                return;
            }

            Alert.alert(
                t('war.alerts.createTitle'),
                t('war.alerts.createMessage'),
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                        text: t('common.create'), // Assuming added to common, or hardcode for now if missing
                        onPress: async () => {
                            try {
                                const date = new Date();
                                const monthName = date.toLocaleString('es-ES', { month: 'long' });
                                await RankingService.createClanWarEvent(`Guerra de ${monthName}`, date);
                                Alert.alert(t('war.alerts.successTitle'), t('war.alerts.successMessage'));
                                fetchWarStatus();
                            } catch (error) {
                                Alert.alert(t('war.alerts.errorTitle'), t('war.alerts.errorMessage'));
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error(error);
        }
    };

    const handleStartWar = async () => {
        if (!activeWar) return;
        try {
            await RankingService.startWar(activeWar.id);
            Alert.alert('Guerra Iniciada', '¡Que comience la batalla! Los puntos de batallas contarán ahora.');
            fetchWarStatus();
        } catch (error) {
            Alert.alert('Error', 'No se pudo iniciar la guerra.');
        }
    };

    const handleEndWar = async () => {
        if (!activeWar) return;
        Alert.alert(
            'Finalizar Guerra',
            '¿Estás seguro? Se calcularán los resultados, se procesarán los ascensos/descensos y se cerrará el evento.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Finalizar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await RankingService.endWar(activeWar.id);
                            Alert.alert(
                                'Guerra Finalizada',
                                'Se han aplicado los Ascensos (Top 3) y Descensos (Bottom 3) en cada Liga.'
                            );
                            fetchWarStatus();
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo finalizar la guerra.');
                        }
                    }
                }
            ]
        );
    };

    const renderAdminControls = () => {
        if (currentUser.role !== 'admin') return null;

        if (!activeWar) {
            return (
                <TouchableOpacity
                    style={[styles.createBtn, { backgroundColor: activeTheme.colors.primary }]}
                    onPress={handleCreateWar}
                >
                    <Text style={styles.createBtnText}>{t('war.createMonthlyWar')}</Text>
                </TouchableOpacity>
            );
        }

        if (activeWar.status === 'pending') {
            return (
                <>
                    <View style={[styles.statusBanner, { backgroundColor: activeTheme.colors.surface }]}>
                        <Text style={[styles.statusText, { color: activeTheme.colors.text }]}>
                            Próxima Guerra: <Text style={{ fontWeight: 'bold' }}>{activeWar.name}</Text>
                        </Text>
                        <Text style={{ color: activeTheme.colors.textMuted }}>Estado: Pendiente</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.createBtn, { backgroundColor: activeTheme.colors.accent, marginTop: 10 }]}
                        onPress={handleStartWar}
                    >
                        <Text style={styles.createBtnText}>INICIAR GUERRA</Text>
                    </TouchableOpacity>
                </>
            );
        }

        if (activeWar.status === 'active') {
            return (
                <>
                    <View style={[styles.statusBanner, { backgroundColor: 'rgba(255, 0, 0, 0.1)', borderColor: activeTheme.colors.primary, borderWidth: 1 }]}>
                        <Text style={[styles.statusText, { color: activeTheme.colors.primary, fontWeight: 'bold' }]}>
                            🔥 {activeWar.name} EN CURSO 🔥
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.createBtn, { backgroundColor: theme.colors.error, marginTop: 10 }]}
                        onPress={handleEndWar}
                    >
                        <Text style={styles.createBtnText}>FINALIZAR GUERRA</Text>
                    </TouchableOpacity>
                </>
            );
        }

        return null; // Completed or other status
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
            <Header title={t('war.title')} />
            <FlatList
                data={battles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View style={styles.headerSection}>
                        {renderAdminControls()}

                        {mvp && (
                            <View style={[styles.mvpCard, { backgroundColor: activeTheme.colors.surfaceVariant, borderColor: '#FFD700', borderWidth: 1 }]}>
                                <Text style={[styles.mvpTitle, { color: '#FFD700' }]}>🏆 MVP DE LA GUERRA 🏆</Text>
                                <View style={styles.mvpContent}>
                                    <Image
                                        source={{ uri: mvp.car_image_url || 'https://via.placeholder.com/150' }}
                                        style={styles.mvpCarImage}
                                    />
                                    <View style={styles.mvpInfo}>
                                        <Text style={[styles.mvpUser, { color: activeTheme.colors.text }]}>
                                            {mvp.member?.username || 'Piloto Desconocido'}
                                        </Text>
                                        <Text style={[styles.mvpCar, { color: activeTheme.colors.textMuted }]}>
                                            {mvp.car_name}
                                        </Text>
                                        <Text style={[styles.mvpScore, { color: activeTheme.colors.primary }]}>
                                            {mvp.total_score} Puntos
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        <Text style={[styles.sectionTitle, { color: activeTheme.colors.textMuted }]}>{t('war.globalRanking')}</Text>
                        <View style={[styles.table, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
                            {sortedCrews.map((crew, index) => renderRankRow(crew, index))}
                        </View>
                        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.xl, color: activeTheme.colors.textMuted }]}>{t('war.recentBattles')}</Text>
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
    statusBanner: {
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        marginBottom: theme.spacing.s,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 16,
        marginBottom: 4,
    },
    mvpCard: {
        marginTop: theme.spacing.m,
        marginBottom: theme.spacing.l,
        padding: theme.spacing.m,
        borderRadius: theme.roundness.l,
        alignItems: 'center',
    },
    mvpTitle: {
        fontSize: 18,
        fontWeight: '900',
        marginBottom: theme.spacing.m,
        letterSpacing: 1.5,
    },
    mvpContent: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    mvpCarImage: {
        width: 80,
        height: 80,
        borderRadius: theme.roundness.m,
        marginRight: theme.spacing.m,
    },
    mvpInfo: {
        flex: 1,
    },
    mvpUser: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    mvpCar: {
        fontSize: 14,
        marginBottom: 4,
    },
    mvpScore: {
        fontSize: 16,
        fontWeight: '900',
    }
});


