import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';

export const ChatViewScreen = ({ route, navigation }: any) => {
    const params = route.params || {};
    const { conversationId, otherUser, crewId, title } = params;
    const { currentUser } = useStore();
    const [messages, setMessages] = useState<any[]>([]);
    const [chatText, setChatText] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationId);
    const activeTheme = useAppTheme();
    const scrollViewRef = useRef<ScrollView>(null);

    const isCrewChat = !!crewId;
    const headerTitle = title || otherUser?.username || 'Chat';

    useEffect(() => {
        let subscription: any;

        const initChat = async () => {
            setLoading(true);
            try {
                let targetId = conversationId;

                // If DM and no ID, resolve implementation
                if (!isCrewChat && !targetId && otherUser) {
                    try {
                        targetId = await useStore.getState().getOrCreateConversation(otherUser.id);
                    } catch (err) {
                        console.error("Error getting conversation:", err);
                    }
                }

                if (targetId) setActiveConversationId(targetId);

                await fetchMessages(targetId);
                subscription = subscribeToMessages(targetId);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        initChat();

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [conversationId, crewId]);

    const fetchMessages = async (targetId: string | null) => {
        try {
            let query;
            if (isCrewChat) {
                query = supabase
                    .from('crew_messages')
                    .select('*, user:profiles(username, avatar_url)')
                    .eq('crew_id', crewId)
                    .order('created_at', { ascending: true });
            } else if (targetId) {
                query = supabase
                    .from('direct_messages')
                    .select('*')
                    .eq('conversation_id', targetId)
                    .order('created_at', { ascending: true });
            } else {
                setMessages([]);
                return;
            }

            const { data, error } = await query;

            if (error) {
                console.error('Fetch error:', error);
                setMessages([]);
            } else {
                setMessages(data || []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const subscribeToMessages = (targetId: string | null) => {
        const channelName = isCrewChat ? `crew_chat:${crewId}` : `dm:${targetId}`;
        const tableName = isCrewChat ? 'crew_messages' : 'direct_messages';
        const filter = isCrewChat ? `crew_id=eq.${crewId}` : `conversation_id=eq.${targetId}`;

        if (!isCrewChat && !targetId) return null;

        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: tableName,
                filter: filter
            }, async (payload) => {
                const newMessage = payload.new;
                if (isCrewChat) {
                    const { data: userData } = await supabase.from('profiles').select('username, avatar_url').eq('id', newMessage.profile_id).single();
                    newMessage.user = userData;
                }
                setMessages(prev => [...prev, newMessage]);
            })
            .subscribe();

        return channel;
    };

    const sendMessage = async (content: string, type: 'text' | 'image' | 'file' = 'text', mediaUrl?: string) => {
        if (!content && !mediaUrl) return;

        try {
            if (isCrewChat) {
                const { error } = await supabase.from('crew_messages').insert({
                    crew_id: crewId,
                    profile_id: currentUser?.id,
                    content: content || (type === 'image' ? 'Image' : 'File'),
                    type,
                    media_url: mediaUrl
                });
                if (error) throw error;
            } else {
                if (!activeConversationId) {
                    Alert.alert('Error', 'Conversation not ready');
                    return;
                }
                const { error } = await supabase.from('direct_messages').insert({
                    conversation_id: activeConversationId,
                    sender_id: currentUser?.id,
                    content: content || (type === 'image' ? 'Image' : 'File'),
                    type,
                    media_url: mediaUrl
                });
                if (error) throw error;

                await supabase.from('conversations').update({
                    last_message: content || (type === 'image' ? 'Image' : 'File'),
                    updated_at: new Date().toISOString()
                }).eq('id', activeConversationId);
            }
            setChatText('');
        } catch (error) {
            console.error('Chat Send Error:', error);
            Alert.alert('Error', 'Failed to send message');
        }
    };

    const pickImage = async () => {
        setShowAttachMenu(false);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled) {
            uploadFile(result.assets[0], 'image');
        }
    };

    const pickDocument = async () => {
        setShowAttachMenu(false);
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets) {
            uploadFile(result.assets[0], 'file');
        }
    };

    const uploadFile = async (file: any, type: 'image' | 'file') => {
        if (!currentUser) return;
        setUploading(true);

        try {
            const ext = file.uri.split('.').pop();
            const fileName = `${Date.now()}.${ext}`;
            const filePath = `${currentUser.id}/${fileName}`;

            let fileBody;

            if (Platform.OS === 'web') {
                // Web implementation (omitted for brevity, assuming Native for now or handled by URI)
                // For React Native Expo with Supabase, we typically need ArrayBuffer.
                // ImagePicker gives base64. DocumentPicker gives URI.
            }

            if (type === 'image' && file.base64) {
                fileBody = decode(file.base64);
            } else {
                // For DocumentPicker or non-base64, read as string/buffer. 
                // Simple hack for now: Use fetch to get blob/buffer
                const response = await fetch(file.uri);
                const blob = await response.blob();
                fileBody = blob;
            }

            const { data, error } = await supabase
                .storage
                .from('chat-attachments')
                .upload(filePath, fileBody!, {
                    contentType: file.mimeType || 'application/octet-stream',
                    upsert: false
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);

            await sendMessage('', type, publicUrl);

        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const renderMessageContent = (msg: any) => {
        if (msg.type === 'image' && msg.media_url) {
            return (
                <TouchableOpacity onPress={() => setSelectedImage(msg.media_url)}>
                    <Image source={{ uri: msg.media_url }} style={{ width: 200, height: 200, borderRadius: 8 }} resizeMode="cover" />
                </TouchableOpacity>
            );
        } else if (msg.type === 'file' && msg.media_url) {
            return (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="document-attach" size={24} color="#FFF" />
                    <Text style={{ marginLeft: 8, color: '#FFF', textDecorationLine: 'underline' }}>
                        Archivo Adjunto
                    </Text>
                </View>
            );
        }
        return <Text style={[styles.chatText, { color: (isCrewChat ? msg.profile_id : msg.sender_id) === currentUser?.id ? '#FFF' : activeTheme.colors.text }]}>{msg.content}</Text>;
    };

    if (loading) return (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={activeTheme.colors.primary} />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title={headerTitle} showBack onBack={() => navigation.goBack()} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    style={styles.chatScroll}
                >
                    {messages.map((msg, idx) => {
                        const isMe = (isCrewChat ? msg.profile_id : msg.sender_id) === currentUser?.id;
                        return (
                            <View key={msg.id || idx} style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '80%',
                                marginBottom: 10,
                            }}>
                                {!isMe && isCrewChat && <Text style={{ fontSize: 10, color: activeTheme.colors.textMuted, marginBottom: 2, marginLeft: 12 }}>{msg.user?.username || 'User'}</Text>}
                                <View style={[styles.chatMessage, isMe ? styles.myMessage : { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
                                    {renderMessageContent(msg)}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Attachments Menu (Modal/Overlay) */}
                {showAttachMenu && (
                    <View style={[styles.attachMenu, { backgroundColor: activeTheme.colors.surface }]}>
                        <TouchableOpacity style={styles.attachItem} onPress={pickImage}>
                            <Ionicons name="image" size={24} color={activeTheme.colors.primary} />
                            <Text style={{ color: activeTheme.colors.text, marginLeft: 8 }}>Galería</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.attachItem} onPress={pickDocument}>
                            <Ionicons name="document" size={24} color={activeTheme.colors.primary} />
                            <Text style={{ color: activeTheme.colors.text, marginLeft: 8 }}>Documento</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Full Screen Image Modal */}
                <Modal visible={!!selectedImage} transparent={true} onRequestClose={() => setSelectedImage(null)}>
                    <View style={styles.fullScreenModal}>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
                            <Ionicons name="close-circle" size={40} color="#FFF" />
                        </TouchableOpacity>
                        {selectedImage && (
                            <Image
                                source={{ uri: selectedImage }}
                                style={styles.fullScreenImage}
                                resizeMode="contain"
                            />
                        )}
                    </View>
                </Modal>

                <View style={[styles.chatInputContainer, { backgroundColor: activeTheme.colors.surface }]}>
                    <TouchableOpacity onPress={() => setShowAttachMenu(!showAttachMenu)} style={{ marginRight: 10 }}>
                        <Ionicons name="add-circle" size={32} color={activeTheme.colors.primary} />
                    </TouchableOpacity>

                    <TextInput
                        style={[styles.chatInput, { color: activeTheme.colors.text, backgroundColor: activeTheme.colors.background, borderColor: activeTheme.colors.border }]}
                        placeholder="Escribe un mensaje..."
                        placeholderTextColor={activeTheme.colors.textMuted}
                        value={chatText}
                        onChangeText={setChatText}
                    />
                    <TouchableOpacity style={[styles.sendBtn, { backgroundColor: activeTheme.colors.primary }]} onPress={() => sendMessage(chatText)}>
                        {uploading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={20} color="#FFF" />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chatScroll: { flex: 1, padding: 16 },
    chatMessage: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 2,
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
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachMenu: {
        position: 'absolute',
        bottom: 80,
        left: 20,
        width: 200,
        borderRadius: 12,
        padding: 10,
        elevation: 5,
        zIndex: 10,
    },
    attachItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    fullScreenModal: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    fullScreenImage: {
        width: '100%',
        height: '100%',
    }
});
