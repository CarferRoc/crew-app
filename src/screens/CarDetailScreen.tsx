import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useAppTheme, theme } from '../theme';
import { Header } from '../components/Header';
import { GarageCar } from '../models/types';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';

const { width } = Dimensions.get('window');

export const CarDetailScreen = ({ navigation, route }: any) => {
    const { car } = route.params as { car: GarageCar };
    const activeTheme = useAppTheme();
    const { currentUser, fetchGarage } = useStore();
    const [activeSlide, setActiveSlide] = useState(0);
    const [deleting, setDeleting] = useState(false);

    if (!car) return null;

    const isOwner = currentUser?.id === car.userId;

    const handleDelete = async () => {
        Alert.alert(
            "Eliminar Coche",
            "¿Estás seguro de que quieres eliminar este coche de tu garaje? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            const { error } = await supabase
                                .from('garaje')
                                .delete()
                                .eq('id', car.id);

                            if (error) throw error;

                            await fetchGarage(currentUser!.id);
                            navigation.goBack();
                        } catch (error: any) {
                            console.error(error);
                            Alert.alert("Error", "No se pudo eliminar el coche.");
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title={car.name || "Detalles"} showBack onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Image Carousel */}
                <View style={[styles.carouselContainer, { backgroundColor: activeTheme.colors.surface }]}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={({ nativeEvent }) => {
                            const slide = Math.ceil(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width);
                            if (slide !== activeSlide) setActiveSlide(slide);
                        }}
                        scrollEventThrottle={16}
                    >
                        {car.photos && car.photos.length > 0 ? (
                            car.photos.map((photo, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: photo }}
                                    style={{ width: width, height: 300, resizeMode: 'cover' }}
                                />
                            ))
                        ) : (
                            <Image
                                source={{ uri: 'https://via.placeholder.com/400x300' }}
                                style={{ width: width, height: 300, resizeMode: 'cover' }}
                            />
                        )}
                    </ScrollView>

                    {car.photos && car.photos.length > 1 && (
                        <View style={styles.pagination}>
                            {car.photos.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        { backgroundColor: index === activeSlide ? activeTheme.colors.primary : 'rgba(255,255,255,0.5)' }
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.name, { color: activeTheme.colors.text }]}>{car.name}</Text>
                            {car.nickname ? (
                                <Text style={[styles.nickname, { color: activeTheme.colors.primary }]}>"{car.nickname}"</Text>
                            ) : null}
                        </View>
                        {car.power && (
                            <View style={[styles.powerBadge, { borderColor: activeTheme.colors.primary }]}>
                                <Ionicons name="speedometer" size={16} color={activeTheme.colors.primary} />
                                <Text style={[styles.powerText, { color: activeTheme.colors.primary }]}>{car.power}</Text>
                            </View>
                        )}
                    </View>

                    {car.specs ? (
                        <View style={[styles.specsContainer, { backgroundColor: activeTheme.colors.surface }]}>
                            <Text style={[styles.label, { color: activeTheme.colors.textMuted }]}>SPECIFICATIONS / MODS</Text>
                            <Text style={[styles.specsText, { color: activeTheme.colors.text }]}>{car.specs}</Text>
                        </View>
                    ) : null}

                    {isOwner && (
                        <Button
                            title="Eliminar Coche"
                            variant="outline"
                            style={{ borderColor: activeTheme.colors.error, marginTop: 30 }}
                            textStyle={{ color: activeTheme.colors.error }}
                            onPress={handleDelete}
                            disabled={deleting}
                        />
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    carouselContainer: {
        height: 300,
        position: 'relative',
    },
    pagination: {
        position: 'absolute',
        bottom: 10,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    infoContainer: {
        padding: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    name: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    nickname: {
        fontSize: 18,
        fontStyle: 'italic',
        fontWeight: '500',
    },
    powerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    powerText: {
        marginLeft: 6,
        fontWeight: 'bold',
        marginTop: 2,
    },
    specsContainer: {
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 1,
    },
    specsText: {
        fontSize: 15,
        lineHeight: 24,
    },
});
