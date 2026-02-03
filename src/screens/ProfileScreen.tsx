import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, Dimensions, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    const theme = useAppTheme();

    // If no userId provided, assume current user
    const isCurrentUser = !userId || userId === currentUser?.id;
    const profileId = userId || currentUser?.id;

    const [profile, setProfile] = React.useState<any>(isCurrentUser ? currentUser : null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (profileId) {
            fetchProfile();
            fetchGarage(profileId);
        }
    }, [profileId]);

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
                title={isCurrentUser ? t('profile.myProfileTitle') : (profile?.nick || profile?.username || t('navigation.profile'))}
                showBack={!isCurrentUser}
                onBack={() => navigation.goBack()}
                rightAction={isCurrentUser ? (
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ marginRight: 5 }}>
                        <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                ) : null}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Avatar & Header */}
                <View style={[styles.headerSection, { backgroundColor: theme.colors.surface }]}>

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
                    <Text style={[styles.bio, { color: theme.colors.textMuted }]}>{profile.bio || t('profile.bioPlaceholder')}</Text>

                    <View style={styles.locationContainer}>
                        <Ionicons name="location-sharp" size={16} color={theme.colors.textMuted} />
                        <Text style={[styles.location, { color: theme.colors.textMuted }]}>{profile.location || t('profile.locationPlaceholder')}</Text>
                    </View>



                    {/* Redesigned Admin Button */}
                    {(isCurrentUser && profile.role === 'admin') && (
                        <TouchableOpacity
                            style={[styles.adminButton, { borderColor: theme.colors.primary }]}
                            onPress={() => navigation.navigate('AdminPanel')}
                        >
                            <Ionicons name="shield-checkmark" size={16} color={theme.colors.primary} />
                            <Text style={[styles.adminButtonText, { color: theme.colors.primary }]}>{t('profile.adminPanel')}</Text>
                        </TouchableOpacity>
                    )}

                    {!isCurrentUser && (
                        <Button
                            title={t('profile.sendMessage')}
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
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('profile.garage')}</Text>
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
                                {isCurrentUser ? t('profile.emptyGarage') : t('profile.emptyGarageOther')}
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
    },
    adminButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 12,
        gap: 6
    },
    adminButtonText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase'
    }
});
