import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Conversation } from '../models/types';

export const DirectMessagesScreen = ({ navigation }: any) => {
    const activeTheme = useAppTheme();
    const { currentUser } = useStore();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    participant1:profiles!participant1_id(*),
                    participant2:profiles!participant2_id(*)
                `)
                .or(`participant1_id.eq.${currentUser?.id},participant2_id.eq.${currentUser?.id}`)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setConversations(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length > 2) {
            // Fetch users that belong to at least one crew that I also belong to
            // First, get my crew IDs
            const { data: myCrews } = await supabase
                .from('crew_members')
                .select('crew_id')
                .eq('profile_id', currentUser?.id);

            const crewIds = myCrews?.map(c => c.crew_id) || [];

            if (crewIds.length === 0) {
                setSearchResults([]);
                return;
            }

            const { data } = await supabase
                .from('profiles')
                .select('*, crew_members!inner(crew_id)')
                .ilike('username', `%${text}%`)
                .neq('id', currentUser?.id)
                .in('crew_members.crew_id', crewIds)
                .limit(5);

            setSearchResults(data || []);
        } else {
            setSearchResults([]);
        }
    };

    const startConversation = async (otherUser: any) => {
        setLoading(true);
        try {
            // Check if conversation exists
            const participantIds = [currentUser?.id, otherUser.id].sort();
            const { data: existing } = await supabase
                .from('conversations')
                .select('*')
                .eq('participant1_id', participantIds[0])
                .eq('participant2_id', participantIds[1])
                .single();

            if (existing) {
                navigation.navigate('ChatView', { conversationId: existing.id, otherUser });
            } else {
                const { data: newConv, error } = await supabase
                    .from('conversations')
                    .insert({
                        participant1_id: participantIds[0],
                        participant2_id: participantIds[1],
                        last_message: 'Nueva conversación'
                    })
                    .select()
                    .single();

                if (error) throw error;
                navigation.navigate('ChatView', { conversationId: newConv.id, otherUser });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const renderConversation = ({ item }: { item: any }) => {
        const otherUser = item.participant1_id === currentUser?.id ? item.participant2 : item.participant1;

        return (
            <TouchableOpacity
                style={[styles.convCard, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
                onPress={() => navigation.navigate('ChatView', { conversationId: item.id, otherUser })}
            >
                <Image source={{ uri: otherUser.avatar_url || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
                <View style={styles.convInfo}>
                    <Text style={[styles.userName, { color: activeTheme.colors.text }]}>{otherUser.username}</Text>
                    <Text style={[styles.lastMsg, { color: activeTheme.colors.textMuted }]} numberOfLines={1}>{item.last_message}</Text>
                </View>
                <Text style={[styles.date, { color: activeTheme.colors.textMuted }]}>
                    {new Date(item.updated_at).toLocaleDateString()}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title="Mensajes" />
            <View style={styles.searchBox}>
                <TextInput
                    style={[styles.searchInput, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                    placeholder="Buscar usuario para chatear..."
                    placeholderTextColor={activeTheme.colors.textMuted}
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                {searchResults.length > 0 && (
                    <View style={[styles.resultsContainer, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
                        {searchResults.map(user => (
                            <TouchableOpacity key={user.id} style={styles.resultItem} onPress={() => startConversation(user)}>
                                <Text style={{ color: activeTheme.colors.text }}>{user.username}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={activeTheme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversation}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: activeTheme.colors.textMuted }]}>No tienes conversaciones activas.</Text>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchBox: { padding: 16, zIndex: 10 },
    searchInput: { padding: 12, borderRadius: 12, borderWidth: 1 },
    resultsContainer: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        borderRadius: 12,
        borderWidth: 1,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    resultItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    list: { padding: 16 },
    convCard: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    convInfo: { flex: 1, marginLeft: 12 },
    userName: { fontWeight: 'bold', fontSize: 16 },
    lastMsg: { fontSize: 13, marginTop: 2 },
    date: { fontSize: 10 },
    emptyText: { textAlign: 'center', marginTop: 40 },
});
