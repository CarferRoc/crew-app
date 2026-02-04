import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAppTheme } from '../theme';
import { Crew } from '../models/types';
import { Ionicons } from '@expo/vector-icons';

interface CrewCardProps {
    crew: Crew;
    onPress: () => void;
}

export const CrewCard: React.FC<CrewCardProps> = ({ crew, onPress }) => {
    const theme = useAppTheme();
    const badge = crew.badge || '';
    const isImageUrl = badge.startsWith('http');
    const memberCount = crew.members ? crew.members.length : 0;

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: theme.colors.surface }]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                {isImageUrl ? (
                    <Image source={{ uri: badge }} style={styles.badgeImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.placeholderBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <Text style={{ fontSize: 32 }}>{badge.charAt(0)}</Text>
                    </View>
                )}
                <View style={[styles.rankBadge, { backgroundColor: theme.colors.overlay }]}>
                    <Text style={[styles.rankText, { color: '#FFF' }]}>#{Math.floor(Math.random() * 10) + 1}</Text>
                </View>
            </View>

            <View style={styles.info}>
                <View style={styles.headerRow}>
                    <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>{crew.name}</Text>
                    {crew.isVerified && <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} style={{ marginLeft: 4 }} />}
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Ionicons name="people-outline" size={14} color={theme.colors.textMuted} />
                        <Text style={[styles.statText, { color: theme.colors.textMuted }]}>{memberCount}</Text>
                    </View>
                    <View style={[styles.stat, { marginLeft: 12 }]}>
                        <Ionicons name="trophy-outline" size={14} color={theme.colors.textMuted} />
                        <Text style={[styles.statText, { color: theme.colors.textMuted }]}>{crew.scoreCrew} pts</Text>
                    </View>
                    {crew.location && (
                        <View style={[styles.stat, { marginLeft: 12 }]}>
                            <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
                            <Text style={[styles.statText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                                {crew.location}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.arrow}>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        padding: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    imageContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 16,
    },
    badgeImage: {
        width: '100%',
        height: '100%',
    },
    placeholderBadge: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderTopLeftRadius: 8,
    },
    rankText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        maxWidth: '90%',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    arrow: {
        padding: 4,
    }
});
