import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { EventCard } from '../components/EventCard';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const CrewDetailScreen = ({ route, navigation }: any) => {
    const { crewId } = route.params;
    const { currentUser: globalUser } = useStore();
    const theme = useAppTheme();

    const [crew, setCrew] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [joinMessage, setJoinMessage] = useState('');
    const [requestSent, setRequestSent] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'chat' | 'events'>('info');
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [pendingEvents, setPendingEvents] = useState<any[]>([]);
    const [currentMember, setCurrentMember] = useState<any>(null);

    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        fetchCrewData();

        const subscription = supabase
            .channel(`crew_detail:${crewId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_members', filter: `crew_id=eq.${crewId}` }, () => {
                fetchCrewData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `crew_id=eq.${crewId}` }, () => {
                fetchCrewData();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [crewId]);

    const fetchCrewData = async () => {
        try {
            setLoading(true);

            // Fetch Crew Details
            const { data: crewData, error: crewError } = await supabase
                .from('crews')
                .select('*')
                .eq('id', crewId)
                .single();

            if (crewError) throw crewError;
            setCrew(crewData);

            // Fetch Members (Two-step for robustness)
            const { data: relations, error: relError } = await supabase
                .from('crew_members')
                .select('*')
                .eq('crew_id', crewId);

            if (relError) throw relError;

            const profileIds = relations.map((m: any) => m.profile_id);

            // Fetch Profiles manually
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .in('id', profileIds);

            if (profilesError) throw profilesError;

            // Merge data and map to UI model (nick <- username, avatar <- avatar_url)
            const membersData = relations.map((m: any) => {
                const profile = profilesData?.find((p: any) => p.id === m.profile_id);
                return {
                    ...m,
                    user: profile ? {
                        ...profile,
                        username: profile.username,
                        avatar_url: profile.avatar_url
                    } : null
                };
            });

            setMembers(membersData);

            // Fetch Events
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('*')
                .eq('crew_id', crewId)
                .order('date_time', { ascending: true });

            if (eventsError) throw eventsError;

            // Process events
            const mappedEvents = (eventsData || []).map((e: any) => ({
                ...e,
                dateTime: new Date(e.date_time)
            }));

            const now = new Date();
            const validEvents = mappedEvents.filter((e: any) => e.status !== 'pending' && e.status !== 'cancelled');
            const pEvents = mappedEvents.filter((e: any) => e.status === 'pending');

            setEvents(validEvents);
            setPendingEvents(pEvents);

            // Current Member Status
            const memberRecord = membersData.find((m: any) => m.profile_id === globalUser?.id);
            setCurrentMember(memberRecord);

            // Check if request already sent
            if (!memberRecord && globalUser) {
                const { data: reqData } = await supabase
                    .from('crew_join_requests')
                    .select('*')
                    .eq('crew_id', crewId)
                    .eq('user_id', globalUser.id)
                    .eq('status', 'pending')
                    .single();

                if (reqData) setRequestSent(true);
            }

            // If leader, fetch pending requests
            if (memberRecord && memberRecord.role === 'crew_lider') {
                fetchCrewRequests();
            }

        } catch (error) {
            console.error('Error fetching crew data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCrewRequests = async () => {
        // Fetch requests first
        const { data: requests, error } = await supabase
            .from('crew_join_requests')
            .select('*')
            .eq('crew_id', crewId)
            .eq('status', 'pending');

        if (!error && requests && requests.length > 0) {
            const userIds = requests.map(r => r.user_id);

            // Fetch users
            const { data: users } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .in('id', userIds);

            // Merge and map
            const mergedRequests = requests.map(r => {
                const profile = users?.find(u => u.id === r.user_id);
                return {
                    ...r,
                    user: profile ? {
                        ...profile,
                        username: profile.username,
                        avatar_url: profile.avatar_url
                    } : null
                };
            });

            setPendingRequests(mergedRequests);
        } else {
            setPendingRequests([]);
        }
    };

    const handleJoinRequest = async () => {
        if (!joinMessage.trim()) {
            Alert.alert('Error', 'Please enter a message');
            return;
        }

        try {
            const { error } = await supabase
                .from('crew_join_requests')
                .insert({
                    crew_id: crewId,
                    user_id: globalUser?.id,
                    message: joinMessage,
                    status: 'pending'
                });

            if (error) throw error;

            setRequestSent(true);
            Alert.alert('Success', 'Request sent!');

        } catch (error) {
            Alert.alert('Error', 'Failed to send request');
        }
    };

    const approveRequest = async (requestId: string, userId: string) => {
        try {
            const { error: updateError } = await supabase
                .from('crew_join_requests')
                .update({ status: 'approved' })
                .eq('id', requestId);

            if (updateError) throw updateError;

            const { error: insertError } = await supabase
                .from('crew_members')
                .insert({
                    crew_id: crewId,
                    profile_id: userId,
                    role: 'member'
                });

            if (insertError) throw insertError;

            fetchCrewData();

        } catch (error) {
            Alert.alert('Error', 'Failed to approve member');
        }
    };

    const rejectRequest = async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('crew_join_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId);

            if (error) throw error;
            fetchCrewData();

        } catch (error) {
            Alert.alert('Error', 'Failed to reject request');
        }
    };

    const approveEvent = async (eventId: string) => {
        try {
            const { error } = await supabase
                .from('events')
                .update({ status: 'upcoming' })
                .eq('id', eventId);
            if (error) throw error;
            fetchCrewData();
        } catch (err) {
            Alert.alert('Error', 'Could not approve event');
        }
    };

    const rejectEvent = async (eventId: string) => {
        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);
            if (error) throw error;
            fetchCrewData();
        } catch (err) {
            Alert.alert('Error', 'Could not reject event');
        }
    };

    const deleteEvent = async (eventId: string) => {
        Alert.alert('Confirm Delete', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const { error } = await supabase.from('events').delete().eq('id', eventId);
                        if (error) throw error;
                        fetchCrewData();
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete event');
                    }
                }
            }
        ]);
    };

    const generateInviteCode = async () => {
        const code = Math.random().toString(36).substring(7).toUpperCase();
        try {
            await supabase.from('crews').update({ invite_code: code }).eq('id', crewId);
            setCrew({ ...crew, invite_code: code });
            Clipboard.setStringAsync(code);
            Alert.alert('Copied', `Invite Code: ${code} copied to clipboard!`);
        } catch (e) {
            Alert.alert('Error', 'Failed to generate code');
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!crew) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Header title="Error" showBack />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.text }}>Crew not found</Text>
                </View>
            </View>
        );
    }

    const userCrewRole = currentMember?.role;

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'info' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab('info')}
            >
                <Text style={[styles.tabText, { color: activeTab === 'info' ? theme.colors.primary : theme.colors.textMuted }]}>Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'events' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab('events')}
            >
                <Text style={[styles.tabText, { color: activeTab === 'events' ? theme.colors.primary : theme.colors.textMuted }]}>Events</Text>
            </TouchableOpacity>
            {currentMember && (
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'chat' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => {
                        navigation.navigate('ChatViewScreen', {
                            conversationId: `crew_${crewId}`,
                            title: crew.name,
                            crewId: crewId
                        });
                    }}
                >
                    <Text style={[styles.tabText, { color: theme.colors.textMuted }]}>Chat</Text>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.colors.textMuted} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
            )}
        </View>
    );

    const renderInfo = () => (
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>ABOUT</Text>
                <Text style={[styles.description, { color: theme.colors.textMuted }]}>{crew.description || 'No description provided.'}</Text>
            </View>

            {userCrewRole === 'crew_lider' && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>ADMIN CONTROLS</Text>
                    <Button
                        title={crew.invite_code ? `Invite Code: ${crew.invite_code}` : "Generate Invite Code"}
                        onPress={generateInviteCode}
                        variant="secondary"
                        style={{ marginBottom: 10 }}
                        icon={<Ionicons name="copy-outline" size={20} color="#FFFFFF" />}
                    />
                </View>
            )}

            {userCrewRole === 'crew_lider' && pendingRequests.length > 0 && (
                <View style={[styles.requestsCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text style={[styles.requestsTitle, { color: theme.colors.accent }]}>
                        {pendingRequests.length} Solicitudes Pendientes
                    </Text>
                    {pendingRequests.map((req, index) => (
                        <View key={`${req.id}-${index}`} style={[styles.requestItem, { borderBottomColor: theme.colors.border }]}>
                            <View style={styles.requestUser}>
                                <Image
                                    source={{ uri: req.user?.avatar_url || 'https://via.placeholder.com/40' }}
                                    style={styles.avatarSmall}
                                />
                                <View style={{ marginLeft: 10, flex: 1 }}>
                                    <Text style={[styles.userName, { color: theme.colors.text }]}>{req.user?.username}</Text>
                                    <Text style={[styles.requestMessage, { color: theme.colors.textMuted }]}>{req.message}</Text>
                                </View>
                            </View>
                            <View style={styles.requestActions}>
                                <TouchableOpacity onPress={() => rejectRequest(req.id)} style={[styles.actionBtn, { backgroundColor: theme.colors.surface }]}>
                                    <Ionicons name="close" size={20} color={theme.colors.error} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => approveRequest(req.id, req.user_id)} style={[styles.actionBtn, { backgroundColor: theme.colors.primary, marginLeft: 10 }]}>
                                    <Ionicons name="checkmark" size={20} color={theme.colors.white} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>MEMBERS ({members.length})</Text>
                </View>
                {members.map((member, index) => (
                    <TouchableOpacity
                        key={`${member.id}-${index}`}
                        style={[styles.memberCard, { backgroundColor: theme.colors.surface }]}
                        onPress={() => navigation.navigate('Profile', { userId: member.profile_id })}
                    >
                        <Image source={{ uri: member.user?.avatar_url || 'https://via.placeholder.com/50' }} style={styles.avatar} />
                        <View style={styles.memberInfo}>
                            <Text style={[styles.memberName, { color: theme.colors.text }]}>{member.user?.username}</Text>
                            <Text style={[styles.memberRole, { color: theme.colors.textMuted }]}>{member.role === 'crew_lider' ? 'Leader' : 'Member'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                ))}
            </View>

            {!currentMember && !requestSent && globalUser && (
                <View style={styles.joinSection}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>JOIN CREW</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
                        placeholder="Why do you want to join?"
                        placeholderTextColor={theme.colors.textMuted}
                        value={joinMessage}
                        onChangeText={setJoinMessage}
                        multiline
                    />
                    <Button title="Send Request" onPress={handleJoinRequest} style={{ marginTop: 10 }} />
                </View>
            )}

            {!currentMember && requestSent && (
                <View style={[styles.joinSection, { alignItems: 'center', padding: 20 }]}>
                    <Ionicons name="time-outline" size={40} color={theme.colors.accent} />
                    <Text style={{ color: theme.colors.text, marginTop: 10, textAlign: 'center' }}>Request Sent. Waiting for approval.</Text>
                </View>
            )}

            <View style={{ height: 100 }} />
        </ScrollView>
    );

    const renderEvents = () => (
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {userCrewRole === 'crew_lider' && (
                <Button
                    title="Create Event"
                    onPress={() => navigation.navigate('CreateEvent', { crewId })}
                    icon={<Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />}
                    style={{ marginBottom: 20 }}
                />
            )}

            {userCrewRole === 'crew_lider' && pendingEvents.length > 0 && (
                <View style={[styles.pendingEventsContainer, { borderColor: theme.colors.accent }]}>
                    <Text style={{ color: theme.colors.accent, fontWeight: 'bold', marginBottom: 10 }}>QUEDADAS PENDIENTES</Text>
                    {pendingEvents.map((evt, index) => (
                        <View key={`${evt.id}-${index}`} style={[styles.pendingEventItem, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>{evt.title}</Text>
                            <Text style={{ color: theme.colors.textMuted }}>{new Date(evt.date_time).toLocaleDateString()}</Text>
                            <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'flex-end' }}>
                                <TouchableOpacity onPress={() => rejectEvent(evt.id)} style={{ padding: 8, marginRight: 10 }}>
                                    <Ionicons name="close-circle" size={28} color={theme.colors.error} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => approveEvent(evt.id)} style={{ padding: 8 }}>
                                    <Ionicons name="checkmark-circle" size={28} color={theme.colors.success} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 10 }]}>UPCOMING EVENTS</Text>
            {events.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <Ionicons name="calendar-outline" size={48} color={theme.colors.textMuted} />
                    <Text style={{ color: theme.colors.textMuted, marginTop: 10 }}>No upcoming events</Text>
                </View>
            ) : (
                events.map((event, index) => (
                    <EventCard
                        key={`${event.id}-${index}`}
                        event={event}
                        onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                        canDelete={userCrewRole === 'crew_lider'}
                        onDelete={() => deleteEvent(event.id)}
                    />
                ))
            )}
            <View style={{ height: 100 }} />
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Header
                title={crew.name}
                showBack
                onBack={() => navigation.goBack()}
                rightAction={
                    <View style={styles.headerRight}>
                        {crew.isVerified ? <Ionicons name="checkmark-circle" size={20} color={theme.colors.secondary} style={{ marginRight: 8 }} /> : null}
                    </View>
                }
            />

            <View style={styles.bannerContainer}>
                <Image source={{ uri: crew.banner || crew.image_url || 'https://via.placeholder.com/400x150' }} style={styles.banner} />
                <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
                <View style={styles.headerContent}>
                    <View style={styles.locationTag}>
                        <Ionicons name="location" size={12} color="white" />
                        <Text style={styles.locationText}>{crew.location}</Text>
                    </View>
                </View>
            </View>

            {renderTabs()}

            {activeTab === 'info' ? renderInfo() : renderEvents()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bannerContainer: {
        height: 180,
        position: 'relative',
    },
    banner: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    headerContent: {
        position: 'absolute',
        bottom: 16,
        left: 16,
    },
    locationTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    locationText: {
        color: 'white',
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '600',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(150, 150, 150, 0.1)',
    },
    tab: {
        paddingVertical: 12,
        marginRight: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        opacity: 0.7,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    memberInfo: {
        flex: 1,
        marginLeft: 12,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
    },
    memberRole: {
        fontSize: 13,
        marginTop: 2,
    },
    joinSection: {
        marginTop: 20,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 16,
    },
    requestsCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    requestsTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    requestItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    requestUser: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    userName: {
        fontWeight: '700',
        fontSize: 14,
    },
    requestMessage: {
        fontSize: 14,
        marginTop: 2,
    },
    requestActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pendingEventsContainer: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
    },
    pendingEventItem: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    }
});
