import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';

interface Participant {
    id: string;
    user_id: string;
    budget: number;
    created_at: string;
    profiles?: {
        id: string;
        username: string;
        avatar_url?: string;
        full_name?: string;
    };
}

interface ParticipantesLigaScreenProps {
    participants: Participant[];
    loading: boolean;
    currentUserId?: string;
}

export const ParticipantesLigaScreen = ({
    participants,
    loading,
    currentUserId
}: ParticipantesLigaScreenProps) => {
    const activeTheme = useAppTheme();

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={activeTheme.colors.primary} />
                <Text style={[styles.loadingText, { color: activeTheme.colors.textMuted }]}>
                    Cargando participantes...
                </Text>
            </View>
        );
    }

    if (participants.length === 0) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Ionicons name="people-outline" size={80} color={activeTheme.colors.textMuted} />
                <Text style={[styles.emptyText, { color: activeTheme.colors.textMuted }]}>
                    No hay participantes en esta liga
                </Text>
            </View>
        );
    }

    const renderParticipant = ({ item, index }: { item: Participant; index: number }) => {
        const isCurrentUser = item.user_id === currentUserId;
        const username = item.profiles?.username || item.profiles?.full_name || 'Usuario';
        const avatarUrl = item.profiles?.avatar_url;

        return (
            <View style={[
                styles.participantCard,
                {
                    backgroundColor: isCurrentUser
                        ? activeTheme.colors.primary + '20'
                        : activeTheme.colors.surface,
                    borderColor: isCurrentUser
                        ? activeTheme.colors.primary
                        : activeTheme.colors.border
                }
            ]}>
                {/* Ranking Number */}
                <View style={[styles.rankBadge, { backgroundColor: activeTheme.colors.primary }]}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                </View>

                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: activeTheme.colors.primary }]}>
                            <Ionicons name="person" size={28} color="#FFF" />
                        </View>
                    )}
                    {isCurrentUser && (
                        <View style={[styles.currentUserBadge, { backgroundColor: activeTheme.colors.success }]}>
                            <Ionicons name="checkmark" size={12} color="#FFF" />
                        </View>
                    )}
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                    <Text style={[styles.username, { color: activeTheme.colors.text }]}>
                        {username}
                        {isCurrentUser && <Text style={{ color: activeTheme.colors.primary }}> (Tú)</Text>}
                    </Text>
                    <View style={styles.statsRow}>
                        <Ionicons name="wallet-outline" size={14} color={activeTheme.colors.success} />
                        <Text style={[styles.budget, { color: activeTheme.colors.success }]}>
                            €{(item.budget / 1000).toFixed(0)}k
                        </Text>
                    </View>
                </View>

                {/* Join Date */}
                <View style={styles.dateContainer}>
                    <Text style={[styles.dateLabel, { color: activeTheme.colors.textMuted }]}>
                        Unido
                    </Text>
                    <Text style={[styles.dateText, { color: activeTheme.colors.text }]}>
                        {new Date(item.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short'
                        })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { backgroundColor: activeTheme.colors.surface }]}>
                <Ionicons name="people" size={24} color={activeTheme.colors.primary} />
                <Text style={[styles.headerTitle, { color: activeTheme.colors.text }]}>
                    Participantes ({participants.length})
                </Text>
            </View>

            <FlatList
                data={participants}
                renderItem={renderParticipant}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    participantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentUserBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    userInfo: {
        flex: 1,
        gap: 4,
    },
    username: {
        fontSize: 16,
        fontWeight: '700',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    budget: {
        fontSize: 14,
        fontWeight: '600',
    },
    dateContainer: {
        alignItems: 'flex-end',
    },
    dateLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
    },
    dateText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
