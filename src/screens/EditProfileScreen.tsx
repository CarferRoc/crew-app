import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../lib/storage';

export const EditProfileScreen = ({ navigation }: any) => {
    const { currentUser, updateProfile } = useStore();
    const activeTheme = useAppTheme();
    const [username, setUsername] = useState(currentUser?.username || '');
    const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0].uri) {
            setUploading(true);
            try {
                const publicUrl = await uploadImage(result.assets[0].uri, 'avatars', `profiles/${currentUser?.id}`);
                setAvatarUrl(publicUrl);
                Alert.alert('Éxito', 'Foto subida correctamente');
            } catch (error: any) {
                console.error('Upload error:', error);
                Alert.alert('Error de subida', error.message || 'No se pudo subir la imagen.');
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSave = async () => {
        if (!currentUser) return;
        setLoading(true);

        const { error } = await supabase
            .from('profiles')
            .update({
                username: username,
                avatar_url: avatarUrl,
            })
            .eq('id', currentUser.id);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            updateProfile({ username: username, avatar_url: avatarUrl });
            Alert.alert('Éxito', 'Perfil actualizado correctamente');
            navigation.goBack();
        }
        setLoading(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title="Editar Perfil" showBack onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={[styles.compactHeader, { borderBottomColor: activeTheme.colors.border }]}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                        <Image source={{ uri: avatarUrl || 'https://i.pravatar.cc/150' }} style={[styles.avatar, { borderColor: activeTheme.colors.primary }]} />
                        <View style={[styles.editIconBadge, { backgroundColor: activeTheme.colors.primary }]}>
                            {uploading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.editIconText}>✎</Text>}
                        </View>
                    </TouchableOpacity>

                    <View style={styles.nickContainer}>
                        <Text style={[styles.label, { color: activeTheme.colors.textMuted }]}>Tu Apodo</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Tu apodo"
                            placeholderTextColor={activeTheme.colors.textMuted}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        style={[styles.miniSaveBtn, { backgroundColor: activeTheme.colors.primary }]}
                        disabled={loading || uploading}
                    >
                        {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveText}>✓</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: theme.spacing.m },
    compactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
        borderBottomWidth: 1,
        marginBottom: 10,
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: 20,
    },
    avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3 },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    editIconText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    nickContainer: {
        flex: 1,
    },
    form: { marginTop: 10 },
    label: { marginBottom: 8, fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' },
    input: {
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        borderWidth: 1,
    },
    miniSaveBtn: {
        marginLeft: 15,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
