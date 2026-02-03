import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { Ionicons } from '@expo/vector-icons';
import { EventCard } from '../components/EventCard';

export const EventHistoryScreen = ({ navigation }: any) => {
    const { t } = useTranslation();
    const theme = useAppTheme();
    const { currentUser } = useStore();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEventHistory();
    }, []);

    const fetchEventHistory = async () => {
        if (!currentUser?.id) return;

        try {
            setLoading(true);
            // Assuming we have a way to link users to events, e.g., an 'event_participants' table
            // If not, we might need to adjust this query based on the actual schema.
            // checking 'event_participations' for the current user
            const { data: participations, error: partError } = await supabase
                .from('event_participations')
                .select('event_id')
                .eq('member_id', currentUser.id); // Assuming 'member_id' or checking schema below

            if (partError) {
                // If table doesn't exist or error, just show empty
                console.log('Error fetching participations or table may not exist:', partError);
                setEvents([]);
                return;
            }

            if (participations && participations.length > 0) {
                const eventIds = participations.map(p => p.event_id);

                const { data: eventsData, error: eventsError } = await supabase
                    .from('events')
                    .select('*')
                    .in('id', eventIds)
                    .order('date', { ascending: false });

                if (eventsError) throw eventsError;
                setEvents(eventsData || []);
            } else {
                setEvents([]);
            }

        } catch (error) {
            console.error('Error fetching event history:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                {t('activity.noEvents')}
            </Text>
            <TouchableOpacity
                style={[styles.exploreButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('CrewsTab', { screen: 'CrewsList' })} // Navigate to main crews/events list
            >
                <Text style={styles.exploreButtonText}>{t('activity.exploreEvents')}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Header title={t('activity.title')} showBack onBack={() => navigation.goBack()} />

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        // Reusing EventCard if possible, or a simplified version
                        <EventCard event={item} onPress={() => navigation.navigate('EventDetail', { event: item })} />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    exploreButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    exploreButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
