import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Battle, Crew } from '../models/types';
import { Button } from './Button';

interface BattleCardProps {
    battle: Battle;
    crewA: Crew;
    crewB: Crew;
    onChooseWinner?: (winnerId: string) => void;
    isAdmin?: boolean;
}

export const BattleCard: React.FC<BattleCardProps> = ({ battle, crewA, crewB, onChooseWinner, isAdmin }) => {
    const isFinished = !!battle.winnerCrewId;
    const activeTheme = useAppTheme();

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
            <View style={styles.vsContainer}>
                <View style={styles.crewInfo}>
                    <Text style={styles.badge}>{crewA?.badge}</Text>
                    <Text style={[styles.name, { color: activeTheme.colors.text }]}>{crewA?.name}</Text>
                </View>
                <Text style={styles.vs}>VS</Text>
                <View style={styles.crewInfo}>
                    <Text style={styles.badge}>{crewB?.badge}</Text>
                    <Text style={[styles.name, { color: activeTheme.colors.text }]}>{crewB?.name}</Text>
                </View>
            </View>

            {isFinished ? (
                <View style={[styles.winnerContainer, { borderTopColor: activeTheme.colors.border }]}>
                    <Text style={styles.winnerTitle}>GANADOR</Text>
                    <Text style={[styles.winnerName, { color: activeTheme.colors.text }]}>
                        {battle.winnerCrewId === crewA?.id ? crewA?.name : crewB?.name}
                    </Text>
                    <Text style={styles.pointsEarned}>+50 pts para la crew</Text>
                </View>
            ) : (
                isAdmin && (
                    <View style={styles.adminActions}>
                        <Button
                            title={`Ganador: ${crewA?.name}`}
                            onPress={() => onChooseWinner?.(crewA.id)}
                            variant="outline"
                            style={styles.actionBtn}
                            textStyle={{ fontSize: 12 }}
                        />
                        <Button
                            title={`Ganador: ${crewB?.name}`}
                            onPress={() => onChooseWinner?.(crewB.id)}
                            variant="outline"
                            style={styles.actionBtn}
                            textStyle={{ fontSize: 12 }}
                        />
                    </View>
                )
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.l,
        borderRadius: theme.roundness.l,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        ...theme.shadows.soft,
    },
    vsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    crewInfo: {
        alignItems: 'center',
        flex: 1,
    },
    badge: {
        fontSize: 40,
        marginBottom: 8,
    },
    name: {
        ...theme.typography.caption,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    vs: {
        ...theme.typography.h2,
        color: theme.colors.primary,
        marginHorizontal: theme.spacing.m,
    },
    winnerContainer: {
        marginTop: theme.spacing.l,
        paddingTop: theme.spacing.m,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    winnerTitle: {
        fontSize: 10,
        color: theme.colors.accent,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    winnerName: {
        ...theme.typography.h3,
        marginTop: 4,
    },
    pointsEarned: {
        fontSize: 12,
        color: theme.colors.success,
        marginTop: 4,
    },
    adminActions: {
        flexDirection: 'row',
        marginTop: theme.spacing.m,
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        height: 35,
    },
});
