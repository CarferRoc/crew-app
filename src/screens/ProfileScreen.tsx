import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import * as ImagePicker from 'expo-image-picker';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const ProfileScreen = ({ navigation, route }: any) => {
    const params = route.params || {};
    const userId = params.userId;
    const { currentUser, setUser, fetchGarage, garage } = useStore();
    const theme = useAppTheme();

    // If no userId provided, assume current user
    const isCurrentUser = !userId || userId === currentUser?.id;
    const profileId = userId || currentUser?.id;

    const [profile, setProfile] = React.useState<any>(isCurrentUser ? currentUser : null);
    const [loading, setLoading] = React.useState(true);
    const [uploading, setUploading] = React.useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = React.useState(false);
    const [editForm, setEditForm] = React.useState({
        username: '',
        bio: '',
        location: '',
        avatar_url: ''
    });

    React.useEffect(() => {
        if (profileId) {
            fetchProfile();
            fetchGarage(profileId);
        }
    }, [profileId]);

    React.useEffect(() => {
        if (profile) {
            setEditForm({
                username: profile.username || '',
                bio: profile.bio || '',
                location: profile.location || '',
                avatar_url: profile.avatar_url || ''
            });
        }
    }, [profile]);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                uploadImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Error picking image');
        }
    };

    const uploadImage = async (uri: string) => {
        try {
            setUploading(true);
            const response = await fetch(uri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const filePath = `${profileId}/${new Date().getTime()}.jpg`;
            const contentType = 'image/jpeg';

            const { error } = await supabase.storage
                .from('avatars')
                .upload(filePath, arrayBuffer, {
                    contentType,
                    upsert: true
                });

            if (error) throw error;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setEditForm(prev => ({ ...prev, avatar_url: data.publicUrl }));
        } catch (error: any) {
            console.error('Upload failed:', error);
            Alert.alert('Upload Error', JSON.stringify(error, null, 2));
        } finally {
            setUploading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileId)
                .single();

            if (userError) throw userError;
            setProfile(userData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setLoading(true);
            const updates = {
                username: editForm.username,
                bio: editForm.bio,
                location: editForm.location,
                avatar_url: editForm.avatar_url,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', profileId);

            if (error) throw error;

            const updatedProfile = {
                ...profile,
                ...updates,
                username: editForm.username,
                avatar_url: editForm.avatar_url
            };

            setProfile(updatedProfile);
            setIsEditing(false);

            if (isCurrentUser) {
                // @ts-ignore
                setUser({ ...currentUser, ...updatedProfile });
            }

            Alert.alert('Success', 'Profile updated!');
        } catch (error: any) {
            console.error('Save failed:', error);
            Alert.alert('Save Error', JSON.stringify(error, null, 2));
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUser(null);
        } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    const renderHeaderContent = () => {
        if (isEditing) {
            return (
                <View style={{ alignItems: 'center', width: '100%' }}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: editForm.avatar_url || 'https://via.placeholder.com/150' }}
                            style={[styles.avatar, { borderColor: theme.colors.background }]}
                        />
                        <TouchableOpacity
                            style={[styles.roleBadge, { backgroundColor: theme.colors.surfaceVariant, bottom: 0, right: 0, borderWidth: 0 }]}
                            onPress={pickImage}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color={theme.colors.text} />
                            ) : (
                                <Ionicons name="camera" size={16} color={theme.colors.text} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={[styles.editInput, { color: theme.colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center' }]}
                        value={editForm.username}
                        onChangeText={text => setEditForm({ ...editForm, username: text })}
                        placeholder="Username"
                        placeholderTextColor={theme.colors.textMuted}
                    />

                    <TextInput
                        style={[styles.editInput, { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', marginVertical: 8 }]}
                        value={editForm.bio}
                        onChangeText={text => setEditForm({ ...editForm, bio: text })}
                        placeholder="Bio"
                        placeholderTextColor={theme.colors.textMuted}
                        multiline
                    />

                    <View style={styles.locationContainer}>
                        <Ionicons name="location-sharp" size={16} color={theme.colors.textMuted} />
                        <TextInput
                            style={[styles.editInput, { color: theme.colors.textMuted, fontSize: 14, marginLeft: 4 }]}
                            value={editForm.location}
                            onChangeText={text => setEditForm({ ...editForm, location: text })}
                            placeholder="Location"
                            placeholderTextColor={theme.colors.textMuted}
                        />
                    </View>
                </View>
            );
        }

        return (
            <>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: profile.avatar_url || 'https://via.placeholder.com/150' }}
                        style={[styles.avatar, { borderColor: theme.colors.background }]}
                    />
                    <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary }]}>
                        <Ionicons name="star" size={12} color="white" />
                        <Text style={styles.roleText}>{profile.role || 'Member'}</Text>
                    </View>
                </View>

                <Text style={[styles.nick, { color: theme.colors.text }]}>{profile.username}</Text>
                <Text style={[styles.bio, { color: theme.colors.textMuted }]}>{profile.bio || 'Car enthusiast & nocturnal cruiser'}</Text>

                <View style={styles.locationContainer}>
                    <Ionicons name="location-sharp" size={16} color={theme.colors.textMuted} />
                    <Text style={[styles.location, { color: theme.colors.textMuted }]}>{profile.location || 'Unknown Location'}</Text>
                </View>
            </>
        );
    };

    if (loading && !profile) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!profile) return null;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Header
                title={isCurrentUser ? "My Profile" : (profile?.nick || profile?.username || 'Profile')}
                showBack={!isCurrentUser}
                onBack={() => navigation.goBack()}
                rightAction={isCurrentUser ? (
                    <TouchableOpacity onPress={handleSignOut}>
                        <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
                    </TouchableOpacity>
                ) : null}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Avatar & Header */}
                <View style={[styles.headerSection, { backgroundColor: theme.colors.surface }]}>

                    {renderHeaderContent()}

                    {/* Stats */}
                    <View style={[styles.statsContainer, { borderColor: theme.colors.border }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.colors.text }]}>{profile.pointsPersonal || 0}</Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>REP</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.colors.text }]}>{garage.length}</Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>CARS</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.colors.text }]}>0</Text>
                            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>EVENTS</Text>
                        </View>
                    </View>

                    {isCurrentUser && (
                        <>
                            <Button
                                title={isEditing ? "Save Changes" : "Edit Profile"}
                                variant={isEditing ? "primary" : "secondary"}
                                style={{ marginTop: 20, width: '100%' }}
                                onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                            />
                            {isEditing && (
                                <Button
                                    title="Cancel"
                                    variant="outline"
                                    style={{ marginTop: 10, width: '100%' }}
                                    onPress={() => setIsEditing(false)}
                                />
                            )}
                            {(profile.role === 'admin' && !isEditing) && (
                                <Button
                                    title="Admin Panel"
                                    variant="primary"
                                    style={{ marginTop: 10, width: '100%' }}
                                    onPress={() => navigation.navigate('AdminPanel')}
                                />
                            )}
                        </>
                    )}

                    {!isCurrentUser && (
                        <Button
                            title="Send Message"
                            variant="primary"
                            icon={<Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />}
                            style={{ marginTop: 20, width: '100%' }}
                            onPress={() => {
                                navigation.navigate('ChatViewScreen', {
                                    otherUser: {
                                        id: profile.id,
                                        username: profile.username,
                                        avatar: profile.avatar_url
                                    },
                                    conversationId: null
                                });
                            }}
                        />
                    )}
                </View>

                {/* Garage Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>GARAGE</Text>
                        {isCurrentUser && (
                            <TouchableOpacity onPress={() => navigation.navigate('AddCar')}>
                                <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {garage.length > 0 ? (
                        garage.map((car, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.carCard, { backgroundColor: theme.colors.surface }]}
                                onPress={() => navigation.navigate('CarDetail', { car })}
                            >
                                <Image
                                    source={{ uri: car.photos?.[0] || 'https://via.placeholder.com/300x160' }}
                                    style={styles.carImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.carInfo}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={[styles.carName, { color: theme.colors.text }]}>{car.name}</Text>
                                        {car.power && <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{car.power}</Text>}
                                    </View>

                                    {car.nickname && <Text style={[styles.carSpecs, { color: theme.colors.textMuted, fontStyle: 'italic' }]}>"{car.nickname}"</Text>}

                                    {car.specs && (
                                        <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                                            {car.specs}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={[styles.emptyState, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <Ionicons name="car-sport-outline" size={40} color={theme.colors.textMuted} />
                            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                                {isCurrentUser ? 'Tu garaje está vacío. ¡Añade tu máquina!' : 'Garaje vacío.'}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSection: {
        alignItems: 'center',
        padding: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
    },
    roleBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'white',
    },
    roleText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    nick: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    bio: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    location: {
        fontSize: 14,
        marginLeft: 4,
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        width: '100%',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        justifyContent: 'space-evenly',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 1,
    },
    divider: {
        width: 1,
        height: '80%',
        alignSelf: 'center',
    },
    section: {
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    carCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    carImage: {
        width: '100%',
        height: 160,
    },
    carInfo: {
        padding: 16,
    },
    carName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    carSpecs: {
        fontSize: 14,
        fontWeight: '500',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 14,
    },
    editInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 4,
        width: '80%',
        textAlign: 'center'
    }
});
