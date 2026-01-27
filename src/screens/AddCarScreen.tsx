import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../lib/storage';

export const AddCarScreen = ({ navigation }: any) => {
    const { currentUser, addCar } = useStore();
    const activeTheme = useAppTheme();
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [hp, setHp] = useState('');
    const [nickname, setNickname] = useState('');
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0].uri) {
            setUploading(true);
            try {
                const publicUrl = await uploadImage(result.assets[0].uri, 'car-photos', `cars/${currentUser?.id}`);
                setPhotos(prev => [...prev, publicUrl]);
            } catch (error: any) {
                console.error('Upload error:', error);
                Alert.alert('Error de subida', error.message || 'No se pudo subir la imagen.');
            } finally {
                setUploading(false);
            }
        }
    };

    const handleAddCar = async () => {
        if (!brand || !model) {
            Alert.alert('Error', 'Marca y Modelo son obligatorios');
            return;
        }

        if (!currentUser) return;
        setLoading(true);

        const newCarData = {
            owner_id: currentUser.id,
            brand,
            model,
            year: parseInt(year) || null,
            hp: parseInt(hp) || null,
            nickname,
            description,
            photos,
            mods: [],
        };

        const { data, error } = await supabase
            .from('cars')
            .insert(newCarData)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            Alert.alert('Error', error.message);
        } else {
            addCar({
                id: data.id,
                brand: data.brand,
                model: data.model,
                year: data.year,
                hp: data.hp,
                nickname: data.nickname,
                description: data.description,
                mods: data.mods || [],
                photos: data.photos || [],
            });
            Alert.alert('Éxito', 'Coche añadido correctamente');
            navigation.goBack();
        }
        setLoading(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title="Añadir Coche" showBack onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.form}>
                    <Text style={[styles.label, { color: activeTheme.colors.textMuted }]}>Fotos del Coche</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
                        {photos.map((uri, index) => (
                            <Image key={index} source={{ uri }} style={styles.photoPreview} />
                        ))}
                        <TouchableOpacity
                            style={[styles.addPhotoBtn, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
                            onPress={pickImage}
                            disabled={uploading}
                        >
                            {uploading ? <ActivityIndicator color={activeTheme.colors.primary} /> : <Text style={{ color: activeTheme.colors.text, fontSize: 24 }}>+</Text>}
                        </TouchableOpacity>
                    </ScrollView>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={[styles.label, { color: activeTheme.colors.textMuted }]}>Marca *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                                value={brand}
                                onChangeText={setBrand}
                                placeholder="BMW"
                                placeholderTextColor={activeTheme.colors.textMuted}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: activeTheme.colors.textMuted }]}>Modelo *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                                value={model}
                                onChangeText={setModel}
                                placeholder="M3 G80"
                                placeholderTextColor={activeTheme.colors.textMuted}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={[styles.label, { color: activeTheme.colors.textMuted }]}>Año</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                                value={year}
                                onChangeText={setYear}
                                keyboardType="numeric"
                                placeholder="2023"
                                placeholderTextColor={activeTheme.colors.textMuted}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: activeTheme.colors.textMuted }]}>HP</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                                value={hp}
                                onChangeText={setHp}
                                keyboardType="numeric"
                                placeholder="510"
                                placeholderTextColor={activeTheme.colors.textMuted}
                            />
                        </View>
                    </View>

                    <Text style={[styles.label, { color: activeTheme.colors.textMuted }]}>Apodo del coche</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                        value={nickname}
                        onChangeText={setNickname}
                        placeholder="La Bestia"
                        placeholderTextColor={activeTheme.colors.textMuted}
                    />

                    <Text style={[styles.label, { color: activeTheme.colors.textMuted }]}>Descripción</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border, height: 100 }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Cuéntanos algo sobre tu coche..."
                        placeholderTextColor={activeTheme.colors.textMuted}
                        multiline
                    />

                    <Button
                        title={loading ? "Añadiendo..." : "Añadir Coche"}
                        onPress={handleAddCar}
                        disabled={loading || uploading}
                        style={{ marginTop: 20 }}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: theme.spacing.m },
    form: { marginTop: 10 },
    label: { marginBottom: 8, fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' },
    input: {
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        marginBottom: 20,
        borderWidth: 1,
    },
    row: { flexDirection: 'row' },
    photoList: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    photoPreview: {
        width: 120,
        height: 80,
        borderRadius: 8,
        marginRight: 10,
    },
    addPhotoBtn: {
        width: 120,
        height: 80,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
    },
});
