import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { CrewEvent } from '../models/types';

interface EventCardProps {
    event: CrewEvent;
    onPress: () => void;
    onDelete?: () => void;
    canDelete?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress, onDelete, canDelete }) => {
    const date = new Date(event.dateTime);
    const formattedDate = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    const formattedTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            {/* Context Menu / Delete Button */}
            {canDelete && (
                <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
                    <Ionicons name="trash-outline" size={20} color="#FF4444" />
                </TouchableOpacity>
            )}

            {/* Large Cover Image */}
            <View style={styles.imageContainer}>
                {event.image_url ? (
                    <Image source={{ uri: event.image_url }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Ionicons name="map" size={40} color={theme.colors.textMuted} />
                    </View>
                )}

                {/* Overlay Date Badge */}
                <View style={styles.overlayDate}>
                    <Text style={styles.overlayDay}>{date.getDate()}</Text>
                    <Text style={styles.overlayMonth}>{date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.info}>
                <View style={styles.headerRow}>
                    <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
                    <View style={[styles.statusBadge, event.status === 'upcoming' ? styles.statusUpcoming : styles.statusPast]}>
                        <Text style={styles.statusText}>{event.status === 'upcoming' ? 'PRÓXIMO' : 'PASADO'}</Text>
                    </View>
                </View>

                <View style={styles.detailsRow}>
                    <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
                    <Text style={styles.detailText}>{formattedDate} - {formattedTime}</Text>
                </View>

                <View style={styles.detailsRow}>
                    <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
                    <Text style={styles.detailText} numberOfLines={1}>{event.location || 'Ubicación pendiente'}</Text>
                </View>

                <View style={styles.footerRow}>
                    <Text style={styles.attendees}>{(event.attendees?.length || 0)} asistentes</Text>
                    {/* Could add 'Join' button here if needed */}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        elevation: 2,
    },
    imageContainer: {
        height: 150,
        backgroundColor: theme.colors.surfaceVariant,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayDate: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 8,
        padding: 6,
        alignItems: 'center',
        minWidth: 50,
    },
    overlayDay: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    overlayMonth: {
        color: '#FFF', // theme.colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    deleteBtn: {
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        borderRadius: 20,
    },
    info: {
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        flex: 1,
        marginRight: 8,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailText: {
        color: theme.colors.textMuted,
        fontSize: 14,
        marginLeft: 6,
    },
    footerRow: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    attendees: {
        fontSize: 12,
        color: theme.colors.secondary,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusUpcoming: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    statusPast: {
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
});
