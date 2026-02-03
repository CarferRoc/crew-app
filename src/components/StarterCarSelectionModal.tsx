import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { getCarImage } from '../lib/gameplay';

const { width } = Dimensions.get('window');

interface StarterCarSelectionModalProps {
    visible: boolean;
    starterCars: any[];
    onSelectCar: (car: any) => void;
}

export const StarterCarSelectionModal = ({
    visible,
    starterCars,
    onSelectCar
}: StarterCarSelectionModalProps) => {
    const activeTheme = useAppTheme();

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={() => { }}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Ionicons name="car-sport" size={48} color={activeTheme.colors.primary} />
                        <Text style={[styles.title, { color: activeTheme.colors.text }]}>
                            Elige tu Coche Inicial
                        </Text>
                        <Text style={[styles.subtitle, { color: activeTheme.colors.textMuted }]}>
                            Selecciona uno de estos 3 coches para comenzar tu aventura
                        </Text>
                    </View>

                    {/* Cars Grid */}
                    <ScrollView
                        contentContainerStyle={styles.carsContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {starterCars.map((car, index) => (
                            <TouchableOpacity
                                key={car.id}
                                style={[styles.carCard, { backgroundColor: activeTheme.colors.surface }]}
                                onPress={() => onSelectCar(car)}
                                activeOpacity={0.8}
                            >
                                {/* Car Image */}
                                <View style={styles.imageContainer}>
                                    <Image
                                        source={{ uri: getCarImage(car) }}
                                        style={styles.carImage}
                                        resizeMode="cover"
                                    />

                                    {/* HP Badge */}
                                    <View style={[styles.hpBadge, { backgroundColor: activeTheme.colors.primary }]}>
                                        <Text style={styles.hpText}>{car.hp} CV</Text>
                                    </View>

                                    {/* Used Badge */}
                                    <View style={[styles.usedBadge, { backgroundColor: activeTheme.colors.accent }]}>
                                        <Text style={styles.usedText}>USADO</Text>
                                    </View>
                                </View>

                                {/* Car Info */}
                                <View style={styles.carInfo}>
                                    <Text style={[styles.carBrand, { color: activeTheme.colors.text }]} numberOfLines={1}>
                                        {car.brand}
                                    </Text>
                                    <Text style={[styles.carModel, { color: activeTheme.colors.textMuted }]} numberOfLines={1}>
                                        {car.model} ({car.year})
                                    </Text>

                                    {/* Stats Preview */}
                                    <View style={styles.statsRow}>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>AC</Text>
                                            <Text style={[styles.statValue, { color: '#FF3B30' }]}>{car.stats.ac}</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>MN</Text>
                                            <Text style={[styles.statValue, { color: '#007AFF' }]}>{car.stats.mn}</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statLabel}>FI</Text>
                                            <Text style={[styles.statValue, { color: '#34C759' }]}>{car.stats.fi}</Text>
                                        </View>
                                    </View>

                                    {/* Price */}
                                    <View style={[styles.priceContainer, { backgroundColor: activeTheme.colors.success + '20' }]}>
                                        <Text style={[styles.priceText, { color: activeTheme.colors.success }]}>
                                            €{(car.price / 1000).toFixed(0)}k
                                        </Text>
                                    </View>

                                    {/* Select Button */}
                                    <View style={[styles.selectButton, { backgroundColor: activeTheme.colors.primary }]}>
                                        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                        <Text style={styles.selectText}>SELECCIONAR</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 500,
        maxHeight: '90%',
        borderRadius: 20,
        overflow: 'hidden',
    },
    header: {
        alignItems: 'center',
        padding: 24,
        paddingBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    carsContainer: {
        padding: 16,
        gap: 16,
    },
    carCard: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    imageContainer: {
        height: 180,
        position: 'relative',
    },
    carImage: {
        width: '100%',
        height: '100%',
    },
    hpBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    hpText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    usedBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    usedText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    carInfo: {
        padding: 16,
    },
    carBrand: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    carModel: {
        fontSize: 14,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 12,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        color: '#888',
        fontWeight: '600',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 2,
    },
    priceContainer: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 12,
    },
    priceText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 16,
    },
    selectText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
