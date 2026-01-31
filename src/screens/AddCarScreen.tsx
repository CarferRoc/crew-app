import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../lib/storage';

export const AddCarScreen = ({ navigation }: any) => {
    const { currentUser, addCarToGarage } = useStore();
    const activeTheme = useAppTheme();

    // New Fields
    const [name, setName] = useState(''); // e.g. BMW M3 G80
    const [nickname, setNickname] = useState('');
    const [power, setPower] = useState(''); // e.g. 510 CV
    const [specs, setSpecs] = useState(''); // TextArea for modifications/specs
    const [photos, setPhotos] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0].uri) {
                setUploading(true);
                // Upload
                const publicUrl = await uploadImage(result.assets[0].uri, 'garage-photos', `garage/${currentUser?.id}`);
                setPhotos(prev => [...prev, publicUrl]);
                setUploading(false);
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'No se pudo subir la imagen');
            setUploading(false);
        }
    };

    const handleAddCar = async () => {
        if (!name) {
            Alert.alert('Error', 'El nombre del coche es obligatorio');
            return;
        }
        if (photos.length === 0) {
            Alert.alert('Aviso', '¡Sube al menos una foto de tu máquina!');
            return;
        }

        setLoading(true);
        const success = await addCarToGarage({
            userId: currentUser!.id,
            name,
            nickname,
            power,
            specs,
            photos
        });

        setLoading(false);

        if (success) {
            Alert.alert('Éxito', 'Tu coche está en el garaje');
            navigation.goBack();
        } else {
            Alert.alert('Error', 'No se pudo guardar el coche');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title="Añadir al Garaje" showBack onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.form}>

                    {/* Photos Section */}
                    <Text style={[styles.label, { color: activeTheme.colors.textMuted }]}>Fotos ({photos.length})</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
                        <TouchableOpacity
                            style={[styles.addPhotoBtn, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
                            onPress={pickImage}
                            disabled={uploading}
                        >
                            {uploading ? <ActivityIndicator color={activeTheme.colors.primary} /> : <Text style={{ color: activeTheme.colors.text, fontSize: 32 }}>+</Text>}
                        </TouchableOpacity>

                        {photos.map((uri, index) => (
                            <Image key={index} source={{ uri }} style={styles.photoPreview} />
                        ))}
                    </ScrollView>

                    {/* Fields */}
                    <Text style={[styles.label, { color: activeTheme.colors.textMuted }]}>Nombre del Coche *</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Ej: BMW M3 Competition"
                        placeholderTextColor={activeTheme.colors.textMuted}
                    />

                    <Text style={[styles.label, { color: activeTheme.colors.textMuted }]}>Apodo</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                        value={nickname}
                        onChangeText={setNickname}
                        placeholder="Ej: La Bestia"
                        placeholderTextColor={activeTheme.colors.textMuted}
                    />

                    <Text style={[styles.label, { color: activeTheme.colors.textMuted }]}>Potencia</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                        value={power}
                        onChangeText={setPower}
                        placeholder="Ej: 510 CV"
                        placeholderTextColor={activeTheme.colors.textMuted}
                    />

                    <Text style={[styles.label, { color: activeTheme.colors.textMuted }]}>Características / Mods</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border, height: 120, textAlignVertical: 'top' }]}
                        value={specs}
                        onChangeText={setSpecs}
                        placeholder="Lista las modificaciones, equipamiento, etc..."
                        placeholderTextColor={activeTheme.colors.textMuted}
                        multiline
                    />

                    <Button
                        title={loading ? "Guardando..." : "Guardar en Garaje"}
                        onPress={handleAddCar}
                        disabled={loading || uploading}
                        variant="primary"
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
    photoList: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    photoPreview: {
        width: 100,
        height: 100,
        borderRadius: 12,
        marginLeft: 10,
        backgroundColor: '#333'
    },
    addPhotoBtn: {
        width: 100,
        height: 100,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
    },
});
