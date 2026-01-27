import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../theme';
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

    return (
        <View style={styles.container}>
            <View style={styles.vsContainer}>
                <View style={styles.crewInfo}>
                    <Text style={styles.badge}>{crewA?.badge}</Text>
                    <Text style={styles.name}>{crewA?.name}</Text>
                </View>
                <Text style={styles.vs}>VS</Text>
                <View style={styles.crewInfo}>
                    <Text style={styles.badge}>{crewB?.badge}</Text>
                    <Text style={styles.name}>{crewB?.name}</Text>
                </View>
            </View>

            {isFinished ? (
                <View style={styles.winnerContainer}>
                    <Text style={styles.winnerTitle}>GANADOR</Text>
                    <Text style={styles.winnerName}>
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
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.l,
        borderRadius: theme.roundness.l,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
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
        color: theme.colors.text,
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
        borderTopColor: theme.colors.border,
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
        color: theme.colors.text,
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
