import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
// @ts-ignore
import MapView, { Marker } from 'react-native-maps';
// @ts-ignore
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';

export const CreateEventScreen = ({ navigation, route }: any) => {
    const { crewId } = route.params;
    const activeTheme = useAppTheme();
    const { createEventRequest } = useStore();

    const [title, setTitle] = useState('');
    const [locationName, setLocationName] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Default location (e.g., Madrid center or user loc)
    const [region, setRegion] = useState({
        latitude: 40.416775,
        longitude: -3.703790,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [marker, setMarker] = useState<{ latitude: number, longitude: number } | null>(null);
    const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const handleLocationChange = (text: string) => {
        setLocationName(text);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (text.length <= 2) {
            setSearchResults([]);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5`, {
                    headers: {
                        'User-Agent': 'CrewApp/1.0'
                    }
                });
                const data = await response.json();
                setSearchResults(data || []);
            } catch (error) {
                console.log('Geocoding error', error);
            }
        }, 500); // 0.5s debounce for better responsiveness
    };

    const handleSelectLocation = (item: any) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);

        setRegion({
            latitude: lat,
            longitude: lon,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
        setMarker({ latitude: lat, longitude: lon });
        setLocationName(item.display_name.split(',')[0]); // Use shorter name
        setSearchResults([]); // Hide list
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const currentDate = selectedDate;
            const currentTime = date;
            currentDate.setHours(currentTime.getHours());
            currentDate.setMinutes(currentTime.getMinutes());
            setDate(currentDate);
        }
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        setShowTimePicker(false);
        if (selectedDate) {
            const currentDate = date;
            currentDate.setHours(selectedDate.getHours());
            currentDate.setMinutes(selectedDate.getMinutes());
            setDate(currentDate);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleCreate = async () => {
        if (!title.trim() || !locationName.trim()) {
            Alert.alert('Incompleto', 'Por favor rellena título y nombre del lugar.');
            return;
        }

        if (!marker) {
            Alert.alert('Ubicación requerida', 'Por favor selecciona un punto en el mapa.');
            return;
        }

        setLoading(true);
        const success = await createEventRequest(crewId, {
            title,
            location: locationName,
            dateTime: date.toISOString(),
            description,
            latitude: marker.latitude,
            longitude: marker.longitude,
            image_url: image || undefined // In real app, upload this image first
        });
        setLoading(false);

        if (success) {
            Alert.alert('Quedada Creada', 'La quedada se ha registrado correctamente.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } else {
            Alert.alert('Error', 'No se pudo crear la quedada.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title="Nueva Quedada" showBack onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Photo Upload */}
                <TouchableOpacity onPress={pickImage} style={[styles.imageContainer, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.image} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={{ fontSize: 40 }}>📷</Text>
                            <Text style={{ color: activeTheme.colors.textMuted, marginTop: 8 }}>Subir Foto del Sitio</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={[styles.label, { color: activeTheme.colors.text }]}>Título</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                    placeholder="Ej. Ruta Nocturna"
                    placeholderTextColor={activeTheme.colors.textMuted}
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={[styles.label, { color: activeTheme.colors.text }]}>Fecha y Hora</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={{ color: activeTheme.colors.text }}>📅 {date.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={{ color: activeTheme.colors.text }}>⏰ {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                    />
                )}

                {showTimePicker && (
                    <DateTimePicker
                        value={date}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onTimeChange}
                    />
                )}

                <Text style={[styles.label, { color: activeTheme.colors.text }]}>Nombre del Lugar</Text>
                <View style={{ zIndex: 10 }}>
                    <TextInput
                        style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                        placeholder="Buscar sitio (ej. Bernabeu)"
                        placeholderTextColor={activeTheme.colors.textMuted}
                        value={locationName}
                        onChangeText={handleLocationChange}
                    />
                    {searchResults.length > 0 && (
                        <View style={[styles.resultsContainer, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
                            {searchResults.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.resultItem, { borderBottomColor: activeTheme.colors.border }]}
                                    onPress={() => handleSelectLocation(item)}
                                >
                                    <Text style={{ color: activeTheme.colors.text }}>{item.display_name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <Text style={[styles.label, { color: activeTheme.colors.text }]}>Seleccionar en Mapa</Text>
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={region}
                        onPress={(e: any) => setMarker(e.nativeEvent.coordinate)}
                    >
                        {marker && <Marker coordinate={marker} />}
                    </MapView>
                    {!marker && (
                        <View style={[styles.mapOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                            <Text style={{ color: '#FFF' }}>Toca para seleccionar ubicación</Text>
                        </View>
                    )}
                </View>

                <Text style={[styles.label, { color: activeTheme.colors.text }]}>Descripción</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border, minHeight: 100, textAlignVertical: 'top' }]}
                    placeholder="Detalles sobre la ruta o el plan..."
                    placeholderTextColor={activeTheme.colors.textMuted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

                <Button
                    title="Crear Quedada"
                    onPress={handleCreate}
                    loading={loading}
                    variant="primary"
                    style={{ marginTop: 24, marginBottom: 40 }}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: theme.spacing.m },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    input: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 16,
    },
    dateButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    imageContainer: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginBottom: 10,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapContainer: {
        height: 250,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: 8,
        alignItems: 'center',
    },
    resultsContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        maxHeight: 200,
        borderWidth: 1,
        borderRadius: 8,
        marginTop: 4,
        zIndex: 1000,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    resultItem: {
        padding: 12,
        borderBottomWidth: 1,
    }
});
