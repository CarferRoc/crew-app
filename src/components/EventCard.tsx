import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { CrewEvent } from '../models/types';

interface EventCardProps {
    event: CrewEvent;
    onPress: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
    const date = new Date(event.dateTime);
    const formattedDate = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const formattedTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{formattedDate}</Text>
                <Text style={styles.timeText}>{formattedTime}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.location}>📍 {event.location}</Text>
                <Text style={styles.attendees}>{event.attendees.length} / {event.capacity} asistentes</Text>
            </View>
            <View style={[styles.statusBadge, event.status === 'upcoming' ? styles.statusUpcoming : styles.statusPast]}>
                <Text style={styles.statusText}>{event.status === 'upcoming' ? 'PRÓXIMO' : 'PASADO'}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    dateBadge: {
        backgroundColor: theme.colors.surfaceVariant,
        padding: theme.spacing.s,
        borderRadius: theme.roundness.s,
        alignItems: 'center',
        width: 60,
        marginRight: theme.spacing.m,
    },
    dateText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    timeText: {
        color: theme.colors.textMuted,
        fontSize: 10,
    },
    info: {
        flex: 1,
    },
    title: {
        ...theme.typography.h3,
        fontSize: 18,
        color: theme.colors.text,
    },
    location: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    attendees: {
        ...theme.typography.caption,
        color: theme.colors.secondary,
        marginTop: 4,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusUpcoming: {
        backgroundColor: theme.colors.success + '20',
    },
    statusPast: {
        backgroundColor: theme.colors.textMuted + '20',
    },
    statusText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
});
