import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { theme } from '../theme';
import { Header } from '../components/Header';
import { EventCard } from '../components/EventCard';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';

export const CrewDetailScreen = ({ route, navigation }: any) => {
    const { crewId } = route.params;
    const { crews, users, events, joinEvent, currentUser, createEvent } = useStore();
    const [activeTab, setActiveTab] = useState<'members' | 'events' | 'chat'>('members');
    const [chatText, setChatText] = useState('');

    const crew = crews.find(c => c.id === crewId);
    const crewMembers = users.filter(u => crew?.members.includes(u.id));
    const crewEvents = events.filter(e => e.crewId === crewId);

    if (!crew) return null;

    const renderMembers = () => (
        <View style={styles.tabContent}>
            {crewMembers.map(member => (
                <View key={member.id} style={styles.memberRow}>
                    <Text style={styles.memberAvatar}>{member.nick[0]}</Text>
                    <View style={{ flex: 1, ml: 12 }}>
                        <Text style={styles.memberName}>{member.nick}</Text>
                        <Text style={styles.memberCars}>{member.cars.length} Coches</Text>
                    </View>
                    {crew.createdBy === member.id && (
                        <View style={styles.ownerBadge}><Text style={styles.ownerText}>OWNER</Text></View>
                    )}
                </View>
            ))}
        </View>
    );

    const renderEvents = () => (
        <View style={styles.tabContent}>
            <Button
                title="Crear Evento (+10 pts crew)"
                onPress={() => createEvent(crew.id, { title: 'Quedada Improvisada' })}
                style={{ marginBottom: 16 }}
            />
            {crewEvents.map(event => (
                <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => joinEvent(event.id, currentUser.id)}
                />
            ))}
        </View>
    );

    const renderChat = () => (
        <View style={[styles.tabContent, { flex: 1 }]}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.chatMessage}>
                    <Text style={styles.chatNick}>RaceKing</Text>
                    <Text style={styles.chatText}>¿Alguien para una ruta hoy?</Text>
                </View>
                <View style={[styles.chatMessage, styles.myMessage]}>
                    <Text style={[styles.chatNick, { textAlign: 'right' }]}>Tú</Text>
                    <Text style={styles.chatText}>Yo me apunto si es después de las 20h.</Text>
                </View>
            </ScrollView>
            <View style={styles.chatInputContainer}>
                <TextInput
                    style={styles.chatInput}
                    placeholder="Escribe algo..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={chatText}
                    onChangeText={setChatText}
                />
                <TouchableOpacity style={styles.sendBtn}><Text>🚀</Text></TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Header title={crew.name} showBack onBack={() => navigation.goBack()} />
            <View style={styles.tabs}>
                {(['members', 'events', 'chat'] as const).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                {activeTab === 'members' && renderMembers()}
                {activeTab === 'events' && renderEvents()}
                {activeTab === 'chat' && renderChat()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.textMuted,
    },
    activeTabText: {
        color: theme.colors.primary,
    },
    tabContent: {
        padding: theme.spacing.m,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: theme.colors.surface,
        padding: 12,
        borderRadius: 12,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        color: 'white',
        textAlign: 'center',
        lineHeight: 40,
        fontWeight: 'bold',
        marginRight: 12,
    },
    memberName: {
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    memberCars: {
        color: theme.colors.textMuted,
        fontSize: 12,
    },
    ownerBadge: {
        backgroundColor: theme.colors.accent + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    ownerText: {
        color: theme.colors.accent,
        fontSize: 10,
        fontWeight: 'bold',
    },
    chatMessage: {
        backgroundColor: theme.colors.surface,
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        maxWidth: '80%',
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary + '20',
    },
    chatNick: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 4,
    },
    chatText: {
        color: theme.colors.text,
    },
    chatInputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
    },
    chatInput: {
        flex: 1,
        color: theme.colors.text,
        padding: 12,
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        marginRight: 12,
    },
    sendBtn: {
        padding: 8,
    }
});
