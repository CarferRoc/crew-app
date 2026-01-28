import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { EventCard } from '../components/EventCard';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

export const CrewDetailScreen = ({ route, navigation }: any) => {
    const { crewId } = route.params;
    const { currentUser, generateInviteCode, requestJoinCrew, fetchCrewRequests, approveRequest, rejectRequest, approveEvent, rejectEvent, getOrCreateConversation, deleteEvent } = useStore();
    const [activeTab, setActiveTab] = useState<'usuarios' | 'quedadas' | 'chat' | 'ranking'>('usuarios');
    const [crew, setCrew] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [pendingEvents, setPendingEvents] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [chatText, setChatText] = useState('');
    const [loading, setLoading] = useState(true);
    const [userCrewRole, setUserCrewRole] = useState<'member' | 'crew_lider' | null>(null);
    const [joinMessage, setJoinMessage] = useState('');
    const [requestSent, setRequestSent] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const activeTheme = useAppTheme();
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        fetchCrewData();
        subscribeToChat();
    }, [crewId]);

    const fetchCrewData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Crew Info
            const { data: crewData } = await supabase.from('crews').select('*').eq('id', crewId).single();
            setCrew(crewData);

            // 2. Fetch Members
            const { data: membersData } = await supabase
                .from('crew_members')
                .select('*, profile:profiles(*)')
                .eq('crew_id', crewId);
            setMembers(membersData || []);

            // 3. Set Current User's Role in Crew
            const myMembership = membersData?.find(m => m.profile_id === currentUser?.id);
            setUserCrewRole(myMembership?.role || null);

            // 4. Fetch Events
            const { data: eventsData } = await supabase
                .from('events')
                .select('*')
                .eq('crew_id', crewId)
                .order('date_time', { ascending: true });

            const mappedEvents = (eventsData || []).map(e => ({
                ...e,
                dateTime: e.date_time,
                crewId: e.crew_id,
                // Ensure other potential mismatches are handled if strictly typed, 
                // but dateTime is the critical one for the reported error.
            }));

            setEvents(mappedEvents.filter((e: any) => e.status !== 'pending') || []);

            if (myMembership?.role === 'crew_lider') {
                setPendingEvents(mappedEvents.filter((e: any) => e.status === 'pending') || []);
            }

            // 5. Fetch Messages
            const { data: messagesData } = await supabase
                .from('crew_messages')
                .select('*, profile:profiles(username)')
                .eq('crew_id', crewId)
                .order('created_at', { ascending: true });
            setMessages(messagesData || []);

            // 6. Fetch Join Requests if Leader
            if (myMembership?.role === 'crew_lider') {
                const requests = await fetchCrewRequests(crewId);
                setPendingRequests(requests);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToChat = () => {
        const channel = supabase
            .channel(`crew_chat_${crewId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'crew_messages',
                    filter: `crew_id=eq.${crewId}`
                },
                async (payload) => {
                    const { data: profile } = await supabase.from('profiles').select('username').eq('id', payload.new.profile_id).single();
                    const newMessage = { ...payload.new, profile };
                    setMessages(prev => [...prev, newMessage]);
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    };

    const sendMessage = async () => {
        if (!chatText.trim()) return;

        try {
            const { error } = await supabase.from('crew_messages').insert({
                crew_id: crewId,
                profile_id: currentUser?.id,
                content: chatText
            });

            if (error) throw error;
            setChatText('');
        } catch (error) {
            Alert.alert('Error', 'No se pudo enviar el mensaje');
        }
    };

    const createNewEvent = () => {
        navigation.navigate('CreateEvent', { crewId });
    };

    const handleJoinRequest = async () => {
        if (!joinMessage.trim()) {
            Alert.alert('Mensaje requerido', 'Por favor explica por qué quieres unirte.');
            return;
        }

        const success = await requestJoinCrew(crewId, joinMessage);
        if (success) {
            Alert.alert('Solicitud enviada', 'El líder de la crew revisará tu solicitud.');
            setRequestSent(true);
        } else {
            Alert.alert('Error', 'No se pudo enviar la solicitud (quizás ya enviaste una).');
        }
    };

    if (loading) return <ActivityIndicator size="large" color={activeTheme.colors.primary} style={{ marginTop: 50 }} />;
    if (!crew) return null;

    // View for Non-Members
    if (!userCrewRole) {
        return (
            <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
                <Header title={crew.name} showBack onBack={() => navigation.goBack()} />
                <ScrollView contentContainerStyle={{ padding: theme.spacing.m, alignItems: 'center' }}>
                    {crew.image_url ? (
                        <Image source={{ uri: crew.image_url }} style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 16 }} />
                    ) : (
                        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: activeTheme.colors.surfaceVariant, marginBottom: 16, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 40 }}>{crew.badge}</Text>
                        </View>
                    )}

                    <Text style={[styles.crewTitle, { color: activeTheme.colors.text }]}>{crew.name}</Text>
                    <Text style={{ color: activeTheme.colors.textMuted, marginTop: 8 }}>{members.length} Miembros</Text>

                    <View style={{ width: '100%', padding: 20, marginTop: 40, backgroundColor: activeTheme.colors.surface, borderRadius: 12 }}>
                        <Text style={{ color: activeTheme.colors.text, marginBottom: 12, fontWeight: 'bold' }}>Solicitar Acceso</Text>
                        <Text style={{ color: activeTheme.colors.textMuted, marginBottom: 16 }}>Esta crew es privada. Envía un mensaje al líder para solicitar unirte.</Text>

                        {!requestSent ? (
                            <>
                                <TextInput
                                    style={{
                                        backgroundColor: activeTheme.colors.background,
                                        color: activeTheme.colors.text,
                                        padding: 12,
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: activeTheme.colors.border,
                                        marginBottom: 16,
                                        minHeight: 80,
                                        textAlignVertical: 'top'
                                    }}
                                    placeholder="Hola, me gustaría unirme porque..."
                                    placeholderTextColor={activeTheme.colors.textMuted}
                                    multiline
                                    value={joinMessage}
                                    onChangeText={setJoinMessage}
                                />
                                <Button title="Enviar Solicitud" onPress={handleJoinRequest} variant="primary" />
                            </>
                        ) : (
                            <View style={{ alignItems: 'center', padding: 20 }}>
                                <Text style={{ fontSize: 40, marginBottom: 10 }}>⏳</Text>
                                <Text style={{ color: activeTheme.colors.primary, fontWeight: 'bold' }}>Solicitud Pendiente</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        );
    }

    const renderMembers = () => {
        const handleGenerateCode = async () => {
            const code = await generateInviteCode(crewId);
            if (code) {
                Alert.alert('Código de Invitación', `Comparte este código con otros usuarios:\n\n${code}`, [
                    {
                        text: 'Copiar',
                        onPress: async () => {
                            await Clipboard.setStringAsync(code);
                            Alert.alert('Copiado', 'Código copiado al portapapeles');
                        }
                    },
                    { text: 'Cerrar' }
                ]);
            } else {
                Alert.alert('Error', 'No se pudo generar el código');
            }
        };

        return (
            <ScrollView style={styles.tabContent}>
                {userCrewRole === 'crew_lider' && (
                    <View style={{ marginBottom: 16 }}>
                        <Button
                            title={crew.inviteCode ? `Código: ${crew.inviteCode}` : "Generar Código de Invitación"}
                            onPress={handleGenerateCode}
                            variant="outline"
                        />
                        <View style={{ height: 12 }} />
                        <Button
                            title="Invitar Miembro"
                            onPress={() => navigation.navigate('InviteMember', { crewId })}
                            variant="primary"
                        />
                    </View>
                )}

                {userCrewRole === 'crew_lider' && pendingRequests.length > 0 && (
                    <View style={{ marginBottom: 24, padding: 16, backgroundColor: activeTheme.colors.surfaceVariant, borderRadius: 12 }}>
                        <Text style={{ fontWeight: 'bold', color: activeTheme.colors.primary, marginBottom: 12 }}>Solicitudes Pendientes ({pendingRequests.length})</Text>
                        {pendingRequests.map(req => (
                            <View key={req.id} style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: activeTheme.colors.border, paddingBottom: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <Image source={{ uri: req.user?.avatar_url || 'https://i.pravatar.cc/150' }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} />
                                    <View>
                                        <Text style={{ fontWeight: 'bold', color: activeTheme.colors.text }}>{req.user?.username}</Text>
                                        <Text style={{ fontSize: 12, color: activeTheme.colors.textMuted }}>{new Date(req.created_at).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                                <Text style={{ fontStyle: 'italic', color: activeTheme.colors.text, marginBottom: 16 }}>"{req.message}"</Text>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <Button
                                        title="Rechazar"
                                        variant="outline"
                                        style={{ flex: 1, height: 36 }}
                                        textStyle={{ fontSize: 12 }}
                                        onPress={async () => {
                                            const success = await rejectRequest(req.id);
                                            if (success) {
                                                setPendingRequests(prev => prev.filter(p => p.id !== req.id));
                                                Alert.alert('Rechazada', 'Solicitud rechazada correctamente.');
                                            }
                                        }}
                                    />
                                    <Button
                                        title="Aprobar"
                                        variant="primary"
                                        style={{ flex: 1, height: 36 }}
                                        textStyle={{ fontSize: 12 }}
                                        onPress={async () => {
                                            const success = await approveRequest(req.id);
                                            if (success) {
                                                setPendingRequests(prev => prev.filter(p => p.id !== req.id));
                                                fetchCrewData(); // Refresh members
                                                Alert.alert('Aprobada', `${req.user?.username} ha sido añadido a la crew.`);
                                            }
                                        }}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {members.map(item => (
                    <TouchableOpacity
                        key={item.profile_id}
                        style={[styles.memberRow, { backgroundColor: activeTheme.colors.surface }]}
                        onPress={() => navigation.navigate('Profile', { userId: item.profile_id })}
                    >
                        <Image source={{ uri: item.profile?.avatar_url || 'https://i.pravatar.cc/150' }} style={styles.memberAvatar} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.memberName, { color: activeTheme.colors.text }]}>{item.profile?.username || 'Sin nick'}</Text>
                            <Text style={[styles.memberRoleLabel, { color: item.role === 'crew_lider' ? activeTheme.colors.primary : activeTheme.colors.textMuted }]}>
                                {item.role === 'crew_lider' ? 'LÍDER DE CREW' : 'MIEMBRO'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={{ marginRight: 12, padding: 8 }}
                            onPress={async () => {
                                const convId = await getOrCreateConversation(item.profile_id);
                                if (convId) {
                                    navigation.navigate('ChatView', { conversationId: convId, otherUser: item.profile });
                                } else {
                                    Alert.alert('Error', 'No se pudo iniciar el chat');
                                }
                            }}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={24} color={activeTheme.colors.primary} />
                        </TouchableOpacity>
                        <Text style={{ color: activeTheme.colors.textMuted, fontSize: 20 }}>→</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    const renderEvents = () => (
        <ScrollView style={styles.tabContent}>
            <Button
                title={userCrewRole === 'crew_lider' ? "Crear Evento Oficial" : "Solicitar Quedada"}
                onPress={createNewEvent}
                style={{ marginBottom: 16 }}
                variant={userCrewRole === 'crew_lider' ? 'primary' : 'outline'}
            />

            {userCrewRole === 'crew_lider' && pendingEvents.length > 0 && (
                <View style={{ marginBottom: 24, padding: 16, backgroundColor: activeTheme.colors.surfaceVariant, borderRadius: 12 }}>
                    <Text style={{ fontWeight: 'bold', color: activeTheme.colors.primary, marginBottom: 12 }}>Quedadas Pendientes de Aprobación</Text>
                    {pendingEvents.map(evt => (
                        <View key={evt.id} style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: activeTheme.colors.border, paddingBottom: 12 }}>
                            <Text style={{ fontWeight: 'bold', color: activeTheme.colors.text }}>{evt.title}</Text>
                            <Text style={{ color: activeTheme.colors.textMuted }}>{new Date(evt.date_time).toLocaleString()}</Text>
                            <Text style={{ color: activeTheme.colors.text, marginVertical: 4 }}>{evt.location}</Text>

                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                                <Button
                                    title="Rechazar"
                                    variant="outline"
                                    style={{ flex: 1, height: 36 }}
                                    textStyle={{ fontSize: 12 }}
                                    onPress={async () => {
                                        const success = await rejectEvent(evt.id);
                                        if (success) {
                                            setPendingEvents(prev => prev.filter(e => e.id !== evt.id));
                                            Alert.alert('Rechazada', 'Evento eliminado.');
                                        }
                                    }}
                                />
                                <Button
                                    title="Aprobar"
                                    variant="primary"
                                    style={{ flex: 1, height: 36 }}
                                    textStyle={{ fontSize: 12 }}
                                    onPress={async () => {
                                        const success = await approveEvent(evt.id);
                                        if (success) {
                                            setPendingEvents(prev => prev.filter(e => e.id !== evt.id));
                                            fetchCrewData(); // Refresh events list
                                            Alert.alert('Aprobada', 'El evento es ahora público.');
                                        }
                                    }}
                                />
                            </View>
                        </View>
                    ))}
                </View>
            )}
            {events.length > 0 ? (
                events.map(event => (
                    <EventCard
                        key={event.id}
                        event={event}
                        onPress={() => Alert.alert('Evento', 'Inscripción en desarrollo')}
                        canDelete={userCrewRole === 'crew_lider' || event.created_by === currentUser?.id}
                        onDelete={() => {
                            Alert.alert('Eliminar Quedada', '¿Estás seguro de que quieres eliminar esta quedada?', [
                                { text: 'Cancelar', style: 'cancel' },
                                {
                                    text: 'Eliminar',
                                    style: 'destructive',
                                    onPress: async () => {
                                        const success = await deleteEvent(event.id);
                                        if (success) {
                                            setEvents(prev => prev.filter(e => e.id !== event.id));
                                            Alert.alert('Eliminado', 'La quedada ha sido eliminada.');
                                        } else {
                                            Alert.alert('Error', 'No se pudo eliminar.');
                                        }
                                    }
                                }
                            ]);
                        }}
                    />
                ))
            ) : (
                <Text style={{ color: activeTheme.colors.textMuted, textAlign: 'center', marginTop: 20 }}>No hay eventos programados.</Text>
            )}
        </ScrollView>
    );

    const renderChat = () => (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={100}
        >
            <ScrollView
                ref={scrollViewRef}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                style={styles.chatScroll}
            >
                {messages.map((msg, idx) => {
                    const isMe = msg.profile_id === currentUser?.id;
                    return (
                        <View key={msg.id || idx} style={[styles.chatMessage, isMe ? styles.myMessage : { backgroundColor: activeTheme.colors.surface }]}>
                            {!isMe && <Text style={[styles.chatNick, { color: activeTheme.colors.primary }]}>{msg.profile?.username}</Text>}
                            <Text style={[styles.chatText, { color: isMe ? '#FFF' : activeTheme.colors.text }]}>{msg.content}</Text>
                        </View>
                    );
                })}
            </ScrollView>
            <View style={[styles.chatInputContainer, { backgroundColor: activeTheme.colors.surface }]}>
                <TextInput
                    style={[styles.chatInput, { color: activeTheme.colors.text, backgroundColor: activeTheme.colors.background, borderColor: activeTheme.colors.border }]}
                    placeholder="Escribe en el chat..."
                    placeholderTextColor={activeTheme.colors.textMuted}
                    value={chatText}
                    onChangeText={setChatText}
                />
                <TouchableOpacity style={[styles.sendBtn, { backgroundColor: activeTheme.colors.primary }]} onPress={sendMessage}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>ENVIAR</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title={crew.name} showBack onBack={() => navigation.goBack()} />

            <View style={[styles.tabs, { borderBottomColor: activeTheme.colors.border }]}>
                {(['usuarios', 'quedadas', 'chat', 'ranking'] as const).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={[styles.tab, activeTab === tab && [styles.activeTab, { borderBottomColor: activeTheme.colors.primary }]]}
                    >
                        <Text style={[styles.tabText, { color: activeTheme.colors.textMuted }, activeTab === tab && { color: activeTheme.colors.primary }]}>
                            {tab.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{ flex: 1 }}>
                {activeTab === 'usuarios' && renderMembers()}
                {activeTab === 'quedadas' && renderEvents()}
                {activeTab === 'chat' && renderChat()}
                {activeTab === 'ranking' && (
                    <View style={styles.placeholderContainer}>
                        <Text style={{ color: activeTheme.colors.textMuted }}>Ranking próximamente...</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabs: { flexDirection: 'row', borderBottomWidth: 1 },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    activeTab: { borderBottomWidth: 2 },
    tabText: { fontSize: 11, fontWeight: 'bold' },
    tabContent: { padding: theme.spacing.m, flex: 1 },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
    },
    memberAvatar: { width: 44, height: 44, borderRadius: 22 },
    memberName: { fontWeight: 'bold', fontSize: 15 },
    memberRoleLabel: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
    chatScroll: { flex: 1, padding: 16 },
    chatMessage: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        maxWidth: '85%',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary,
    },
    chatNick: { fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
    chatText: { fontSize: 14 },
    chatInputContainer: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    chatInput: {
        flex: 1,
        padding: 10,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
    },
    sendBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    crewTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 8,
    }
});
