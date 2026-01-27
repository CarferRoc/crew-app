import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Crew } from '../models/types';

interface CrewCardProps {
    crew: Crew;
    onPress: () => void;
}

export const CrewCard: React.FC<CrewCardProps> = ({ crew, onPress }) => {
    const activeTheme = useAppTheme();
    const isImageUrl = crew.badge.startsWith('http');

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
            onPress={onPress}
        >
            <View style={[styles.badgeContainer, { backgroundColor: activeTheme.colors.surfaceVariant }]}>
                {isImageUrl ? (
                    <Image source={{ uri: crew.badge }} style={styles.badgeImage} />
                ) : (
                    <Text style={styles.badge}>{crew.badge}</Text>
                )}
            </View>
            <View style={styles.info}>
                <Text style={[styles.name, { color: activeTheme.colors.text }]}>{crew.name}</Text>
                <Text style={[styles.members, { color: activeTheme.colors.textMuted }]}>{crew.members.length} Miembros • {crew.scoreCrew} Puntos</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: activeTheme.colors.primary + '20' }]}>
                <Text style={[styles.scoreText, { color: activeTheme.colors.primary }]}>Rank #{Math.floor(Math.random() * 10) + 1}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.m,
        borderRadius: theme.roundness.l,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
        borderWidth: 1,
    },
    badgeContainer: {
        width: 60,
        height: 60,
        borderRadius: theme.roundness.m,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.m,
    },
    badge: {
        fontSize: 32,
    },
    badgeImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    info: {
        flex: 1,
    },
    name: {
        ...theme.typography.h3,
    },
    members: {
        ...theme.typography.caption,
        marginTop: 4,
    },
    scoreBadge: {
        paddingHorizontal: theme.spacing.s,
        paddingVertical: 4,
        borderRadius: theme.roundness.s,
    },
    scoreText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
