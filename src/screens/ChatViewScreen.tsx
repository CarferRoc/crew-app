import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

export const ChatViewScreen = ({ route, navigation }: any) => {
    const { conversationId, otherUser } = route.params;
    const { currentUser } = useStore();
    const [messages, setMessages] = useState<any[]>([]);
    const [chatText, setChatText] = useState('');
    const [loading, setLoading] = useState(true);
    const activeTheme = useAppTheme();
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        fetchMessages();
        subscribeToMessages();
    }, [conversationId]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('direct_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToMessages = () => {
        const channel = supabase
            .channel(`dm_${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'direct_messages',
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    };

    const sendMessage = async () => {
        if (!chatText.trim()) return;

        const textToSend = chatText;
        setChatText('');

        try {
            const { error } = await supabase.from('direct_messages').insert({
                conversation_id: conversationId,
                sender_id: currentUser?.id,
                content: textToSend
            });

            if (error) throw error;

            // Update conversation last message
            await supabase
                .from('conversations')
                .update({
                    last_message: textToSend,
                    updated_at: new Date().toISOString()
                })
                .eq('id', conversationId);

        } catch (error) {
            console.error('Chat Send Error:', error);
            Alert.alert('Send Error', JSON.stringify(error));
        }
    };

    if (loading) return <ActivityIndicator size="large" color={activeTheme.colors.primary} style={{ marginTop: 50 }} />;

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title={otherUser.username} showBack onBack={() => navigation.goBack()} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    style={styles.chatScroll}
                >
                    {messages.map((msg, idx) => {
                        const isMe = msg.sender_id === currentUser?.id;
                        return (
                            <View key={msg.id || idx} style={[styles.chatMessage, isMe ? styles.myMessage : { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
                                <Text style={[styles.chatText, { color: isMe ? '#FFF' : activeTheme.colors.text }]}>{msg.content}</Text>
                            </View>
                        );
                    })}
                </ScrollView>

                <View style={[styles.chatInputContainer, { backgroundColor: activeTheme.colors.surface }]}>
                    <TextInput
                        style={[styles.chatInput, { color: activeTheme.colors.text, backgroundColor: activeTheme.colors.background, borderColor: activeTheme.colors.border }]}
                        placeholder="Escribe un mensaje..."
                        placeholderTextColor={activeTheme.colors.textMuted}
                        value={chatText}
                        onChangeText={setChatText}
                    />
                    <TouchableOpacity style={[styles.sendBtn, { backgroundColor: activeTheme.colors.primary }]} onPress={sendMessage}>
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>ENVIAR</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    chatScroll: { flex: 1, padding: 16 },
    chatMessage: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        maxWidth: '80%',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary,
    },
    chatText: { fontSize: 15 },
    chatInputContainer: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    chatInput: {
        flex: 1,
        padding: 12,
        borderRadius: 24,
        marginRight: 10,
        borderWidth: 1,
    },
    sendBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        justifyContent: 'center',
    },
});
