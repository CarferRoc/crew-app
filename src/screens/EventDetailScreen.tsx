import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { CrewEvent } from '../models/types';

export const EventDetailScreen = ({ route, navigation }: any) => {
    const { eventId } = route.params;
    const { currentUser, joinEvent, deleteEvent } = useStore();
    const theme = useAppTheme();

    const [event, setEvent] = useState<CrewEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [attendeeProfiles, setAttendeeProfiles] = useState<any[]>([]);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        fetchEventDetails();
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (error) throw error;

            const mappedEvent: CrewEvent = {
                ...data,
                dateTime: data.date_time, // Map snake_case to camelCase
                attendees: data.attendees || []
            };

            setEvent(mappedEvent);

            if (mappedEvent.attendees && mappedEvent.attendees.length > 0) {
                const { data: profiles, error: profError } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .in('id', mappedEvent.attendees);

                if (!profError) {
                    setAttendeeProfiles(profiles || []);
                }
            } else {
                setAttendeeProfiles([]);
            }

        } catch (error) {
            console.error('Error fetching event:', error);
            Alert.alert('Error', 'Could not load event details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!currentUser || !event) return;
        setJoining(true);
        const success = await joinEvent(event.id, currentUser.id);
        if (success) {
            Alert.alert('Success', 'Has confirmado tu asistencia!');
            fetchEventDetails();
        } else {
            Alert.alert('Error', 'No se pudo unir al evento');
        }
        setJoining(false);
    };

    const handleLeave = async () => {
        if (!currentUser || !event) return;
        setJoining(true); // Reuse state variable
        Alert.alert('Desapuntarse', '¿Seguro que quieres borrarte de la quedada?', [
            { text: 'Cancelar', style: 'cancel', onPress: () => setJoining(false) },
            {
                text: 'Sí, borrarme',
                onPress: async () => {
                    const success = await useStore.getState().leaveEvent(event.id, currentUser.id);
                    if (success) {
                        Alert.alert('Éxito', 'Te has desapuntado.');
                        fetchEventDetails();
                    } else {
                        Alert.alert('Error', 'No se pudo desapuntar');
                    }
                    setJoining(false);
                }
            }
        ]);
    };

    const isAttending = event?.attendees?.includes(currentUser?.id || '');

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!event) return null;

    const date = new Date(event.dateTime);
    const formattedDate = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Header title="Detalles del Evento" showBack onBack={() => navigation.goBack()} />

            <ScrollView style={styles.content}>
                {/* Hero Image */}
                <View style={styles.imageContainer}>
                    {event.image_url ? (
                        <Image source={{ uri: event.image_url }} style={styles.image} />
                    ) : (
                        <View style={[styles.placeholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <Ionicons name="map" size={64} color={theme.colors.textMuted} />
                        </View>
                    )}
                </View>

                <View style={styles.detailsContainer}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>{event.title}</Text>

                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                        <Text style={[styles.infoText, { color: theme.colors.text }]}>{formattedDate} a las {formattedTime}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="location" size={20} color={theme.colors.primary} />
                        <Text style={[styles.infoText, { color: theme.colors.text }]}>{event.location}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>DESCRIPCIÓN</Text>
                        <Text style={[styles.description, { color: theme.colors.text }]}>{event.description || 'Sin descripción.'}</Text>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.attendeesHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>ASISTENTES ({attendeeProfiles.length})</Text>
                        </View>

                        <View style={styles.attendeesList}>
                            {attendeeProfiles.map((profile) => (
                                <View key={profile.id} style={styles.attendeeItem}>
                                    <Image
                                        source={{ uri: profile.avatar_url || 'https://via.placeholder.com/40' }}
                                        style={styles.avatar}
                                    />
                                    <Text style={[styles.attendeeName, { color: theme.colors.text }]} numberOfLines={1}>
                                        {profile.username}
                                    </Text>
                                </View>
                            ))}
                            {attendeeProfiles.length === 0 && (
                                <Text style={{ color: theme.colors.textMuted, fontStyle: 'italic' }}>Sé el primero en apuntarte.</Text>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
                {isAttending ? (
                    <Button
                        title="Desapuntarme"
                        onPress={handleLeave}
                        loading={joining}
                        variant="secondary"
                        style={{ borderColor: theme.colors.error, borderWidth: 1 }}
                        textStyle={{ color: theme.colors.error }}
                        icon={<Ionicons name="close-circle" size={20} color={theme.colors.error} />}
                    />
                ) : (
                    <Button
                        title="Apuntarme"
                        onPress={handleJoin}
                        loading={joining}
                        icon={<Ionicons name="add-circle" size={20} color="#FFF" />}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    imageContainer: {
        height: 250,
        width: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsContainer: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoText: {
        marginLeft: 10,
        fontSize: 16,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 1,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    attendeesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    attendeesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    attendeeItem: {
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 16,
        width: 60,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginBottom: 4,
    },
    attendeeName: {
        fontSize: 12,
        textAlign: 'center',
    },
    footer: {
        padding: 16,
        paddingBottom: 30,
        borderTopWidth: 1,
    }
});
