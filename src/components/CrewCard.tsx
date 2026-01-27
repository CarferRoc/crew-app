import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { Crew } from '../models/types';

interface CrewCardProps {
    crew: Crew;
    onPress: () => void;
}

export const CrewCard: React.FC<CrewCardProps> = ({ crew, onPress }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.badgeContainer}>
                <Text style={styles.badge}>{crew.badge}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{crew.name}</Text>
                <Text style={styles.members}>{crew.members.length} Miembros • {crew.scoreCrew} Puntos</Text>
            </View>
            <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>Rank #{Math.floor(Math.random() * 10) + 1}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: theme.roundness.l,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    badgeContainer: {
        width: 60,
        height: 60,
        borderRadius: theme.roundness.m,
        backgroundColor: theme.colors.surfaceVariant,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.m,
    },
    badge: {
        fontSize: 32,
    },
    info: {
        flex: 1,
    },
    name: {
        ...theme.typography.h3,
        color: theme.colors.text,
    },
    members: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginTop: 4,
    },
    scoreBadge: {
        backgroundColor: theme.colors.primary + '20', // Opacity
        paddingHorizontal: theme.spacing.s,
        paddingVertical: 4,
        borderRadius: theme.roundness.s,
    },
    scoreText: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
});
