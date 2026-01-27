import React from 'react';
import { View, Text, StyleSheet, FlatList, SectionList } from 'react-native';
import { theme } from '../theme';
import { Header } from '../components/Header';
import { BattleCard } from '../components/BattleCard';
import { useStore } from '../store/useStore';

export const CarWarScreen = () => {
    const { battles, crews, chooseBattleWinner } = useStore();
    const sortedCrews = [...crews].sort((a, b) => b.scoreCrew - a.scoreCrew);

    const renderRankRow = ({ item, index }: { item: typeof sortedCrews[0], index: number }) => (
        <View style={styles.rankRow}>
            <Text style={[styles.rankNumber, index < 3 && styles.topRank]}>#{index + 1}</Text>
            <Text style={styles.rankBadge}>{item.badge}</Text>
            <Text style={styles.rankName}>{item.name}</Text>
            <Text style={styles.rankPoints}>{item.scoreCrew} PTS</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Header title="Car War Global" />
            <FlatList
                data={battles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={() => (
                    <View style={styles.headerSection}>
                        <Text style={styles.sectionTitle}>Ranking Global</Text>
                        <View style={styles.table}>
                            {sortedCrews.map((crew, index) => renderRankRow({ item: crew, index }))}
                        </View>
                        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.xl }]}>Batallas Recientes</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <BattleCard
                        battle={item}
                        crewA={crews.find(c => c.id === item.crewA)!}
                        crewB={crews.find(c => c.id === item.crewB)!}
                        isAdmin={true} // Mocked as admin for the demo
                        onChooseWinner={(winnerId) => chooseBattleWinner(item.id, winnerId)}
                    />
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    list: {
        padding: theme.spacing.m,
    },
    headerSection: {
        marginBottom: theme.spacing.m,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.m,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    table: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.l,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    rankNumber: {
        width: 30,
        color: theme.colors.textMuted,
        fontWeight: 'bold',
    },
    topRank: {
        color: theme.colors.accent,
    },
    rankBadge: {
        fontSize: 20,
        marginRight: 12,
    },
    rankName: {
        flex: 1,
        color: theme.colors.text,
        fontWeight: '600',
    },
    rankPoints: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
});
