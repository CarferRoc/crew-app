import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { uploadImage } from '../lib/storage';
import { spanishCities } from '../constants/spanishCities';
import { FlatList, Modal } from 'react-native';

export const CreateCrewScreen = ({ navigation }: any) => {
    const activeTheme = useAppTheme();
    const { currentUser } = useStore();
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);
    const [citySearch, setCitySearch] = useState('');

    const filteredCities = spanishCities.filter(city =>
        city.toLowerCase().includes(citySearch.toLowerCase())
    );

    if (currentUser?.role !== 'lider' && currentUser?.role !== 'admin') {
        return (
            <View style={[styles.container, { backgroundColor: activeTheme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Text style={{ color: activeTheme.colors.error, fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
                    Lo sentimos, solo usuarios con rango Líder o Admin pueden crear crews.
                </Text>
                <Button title="Volver" onPress={() => navigation.goBack()} />
            </View>
        );
    }

    // Restriction: Liders can only create 1 crew
    const [checkingLimit, setCheckingLimit] = useState(true);
    const [alreadyOwnsCrew, setAlreadyOwnsCrew] = useState(false);

    React.useEffect(() => {
        const checkCrewLimit = async () => {
            if (currentUser?.role === 'lider') {
                const { count, error } = await supabase
                    .from('crews')
                    .select('*', { count: 'exact', head: true })
                    .eq('created_by', currentUser.id);

                if (!error && count && count >= 1) {
                    setAlreadyOwnsCrew(true);
                }
            }
            setCheckingLimit(false);
        };
        checkCrewLimit();
    }, [currentUser]);

    if (checkingLimit) return <ActivityIndicator style={{ marginTop: 50 }} color={activeTheme.colors.primary} />;

    if (alreadyOwnsCrew && currentUser?.role === 'lider') {
        return (
            <View style={[styles.container, { backgroundColor: activeTheme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Text style={{ color: activeTheme.colors.error, fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
                    Como Líder, solo puedes crear y gestionar una sola Crew.
                </Text>
                <Button title="Volver" onPress={() => navigation.goBack()} />
            </View>
        );
    }

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleCreate = async () => {
        if (!name || !image || !location) {
            Alert.alert('Error', 'Por favor, introduce nombre, ubicación e imagen.');
            return;
        }

        setLoading(true);
        try {
            // 1. Subir imagen
            const logoUrl = await uploadImage(image, 'avatars', `crews/${Date.now()}`);

            // 2. Crear crew
            const { data: crewData, error: crewError } = await supabase
                .from('crews')
                .insert({
                    name,
                    description,
                    location,
                    image_url: logoUrl,
                    created_by: currentUser.id
                })
                .select()
                .single();

            if (crewError) throw crewError;

            // 3. Añadir creador como crew_lider
            const { error: memberError } = await supabase
                .from('crew_members')
                .insert({
                    crew_id: crewData.id,
                    profile_id: currentUser.id,
                    role: 'crew_lider'
                });

            if (memberError) throw memberError;

            Alert.alert('¡Éxito!', 'Crew creada correctamente.');

            // Refresh crews to show the new one immediately
            const { fetchCrews } = useStore.getState();
            await fetchCrews();

            navigation.navigate('CrewsList');
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.message || 'No se pudo crear la crew.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title="Nueva Crew" />
            <ScrollView contentContainerStyle={styles.content}>
                <TouchableOpacity style={[styles.imageContainer, { borderColor: activeTheme.colors.border }]} onPress={pickImage}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.image} />
                    ) : (
                        <View style={styles.placeholder}>
                            <Text style={{ color: activeTheme.colors.textMuted }}>Seleccionar Logo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.input, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border, justifyContent: 'center' }]}
                    onPress={() => setShowCityModal(true)}
                >
                    <Text style={{ color: location ? activeTheme.colors.text : activeTheme.colors.textMuted }}>
                        {location || "Seleccionar Ciudad (España)"}
                    </Text>
                </TouchableOpacity>

                <TextInput
                    style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                    placeholder="Nombre de la Crew"
                    placeholderTextColor={activeTheme.colors.textMuted}
                    value={name}
                    onChangeText={setName}
                />

                <TextInput
                    style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                    placeholder="Ubicación (Ciudad, España)"
                    placeholderTextColor={activeTheme.colors.textMuted}
                    value={location}
                    onChangeText={setLocation}
                />

                <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                    placeholder="Descripción (opcional)"
                    placeholderTextColor={activeTheme.colors.textMuted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                />

                <Button
                    title={loading ? "Creando..." : "Crear Crew"}
                    onPress={handleCreate}
                    disabled={loading}
                />
            </ScrollView>

            <Modal visible={showCityModal} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContainer, { backgroundColor: activeTheme.colors.background }]}>
                    <Header title="Seleccionar Ciudad" showBack onBack={() => setShowCityModal(false)} />
                    <View style={{ padding: 16 }}>
                        <TextInput
                            style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text }]}
                            placeholder="Buscar ciudad..."
                            placeholderTextColor={activeTheme.colors.textMuted}
                            value={citySearch}
                            onChangeText={setCitySearch}
                            autoFocus
                        />
                    </View>
                    <FlatList
                        data={filteredCities}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.cityItem, { borderBottomColor: activeTheme.colors.border }]}
                                onPress={() => {
                                    setLocation(item);
                                    setShowCityModal(false);
                                    setCitySearch('');
                                }}
                            >
                                <Text style={{ color: activeTheme.colors.text, fontSize: 16 }}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: theme.spacing.xl },
    imageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignSelf: 'center',
        marginBottom: 30,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: { width: '100%', height: '100%' },
    placeholder: { alignItems: 'center' },
    input: {
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        borderWidth: 1,
        marginBottom: 20,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalContainer: {
        flex: 1,
    },
    cityItem: {
        padding: 16,
        borderBottomWidth: 1,
    }
});
