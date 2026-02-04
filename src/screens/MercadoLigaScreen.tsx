import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { Car, MarketBid } from '../models/types';
import { MyBidsSection } from '../components/MyBidsSection';
import { getCarImage } from '../lib/gameplay';

interface MercadoLigaScreenProps {
    marketTab: 'new' | 'used';
    setMarketTab: (tab: 'new' | 'used') => void;
    loadingMarket: boolean;
    marketCars: Car[];
    fetchMarketCars: (type: 'new' | 'used') => void;
    myBids: MarketBid[];
    myCars: Car[];
    isSelectingStarter?: boolean;
    starterCars?: any[];
    onSelectCar: (car: Car) => void;
    onEditBid: (bid: MarketBid) => void;
}

export const MercadoLigaScreen = ({
    marketTab,
    setMarketTab,
    loadingMarket,
    marketCars,
    fetchMarketCars,
    myBids,
    myCars,
    isSelectingStarter,
    starterCars,
    onSelectCar,
    onEditBid
}: MercadoLigaScreenProps) => {
    const activeTheme = useAppTheme();

    // Use starter cars if in selection mode
    const displayCars = isSelectingStarter ? (starterCars || []) : marketCars;

    return (
        <View style={styles.container}>
            {/* Starter Selection Header */}
            {isSelectingStarter && (
                <View style={{ backgroundColor: activeTheme.colors.primary + '20', padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center' }}>
                    <Ionicons name="car-sport" size={32} color={activeTheme.colors.primary} />
                    <Text style={{ color: activeTheme.colors.primary, fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>
                        Elige tu Coche Inicial
                    </Text>
                    <Text style={{ color: activeTheme.colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                        Selecciona uno de estos 3 coches para comenzar tu aventura
                    </Text>
                </View>
            )}

            {/* Dealership Tabs */}
            {!isSelectingStarter && (
                <View style={[styles.tabRow, { marginBottom: 16 }]}>
                    <TouchableOpacity
                        style={[
                            styles.tabBtn,
                            marketTab === 'new' && { backgroundColor: activeTheme.colors.primary }
                        ]}
                        onPress={() => {
                            setMarketTab('new');
                            fetchMarketCars('new');
                        }}
                    >
                        <Ionicons name="sparkles" size={18} color={marketTab === 'new' ? '#FFF' : activeTheme.colors.textMuted} />
                        <Text style={[styles.tabText, { color: marketTab === 'new' ? '#FFF' : activeTheme.colors.textMuted }]}>
                            COCHES NUEVOS
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabBtn,
                            marketTab === 'used' && { backgroundColor: activeTheme.colors.accent }
                        ]}
                        onPress={() => {
                            setMarketTab('used');
                            fetchMarketCars('used');
                        }}
                    >
                        <Ionicons name="time" size={18} color={marketTab === 'used' ? '#FFF' : activeTheme.colors.textMuted} />
                        <Text style={[styles.tabText, { color: marketTab === 'used' ? '#FFF' : activeTheme.colors.textMuted }]}>
                            COCHES USADOS
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {!isSelectingStarter && <MyBidsSection myBids={myBids} onEditBid={onEditBid} />}

            {/* Info Banner */}
            {!isSelectingStarter && myCars.length > 0 && (
                <View style={{ backgroundColor: activeTheme.colors.accent + '20', padding: 12, borderRadius: 8, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="warning" size={20} color={activeTheme.colors.accent} />
                    <Text style={{ color: activeTheme.colors.accent, flex: 1, fontSize: 12 }}>
                        Ya tienes un coche. Véndelo primero para comprar otro.
                    </Text>
                </View>
            )}

            {/* Cars Grid */}
            {loadingMarket ? (
                <View style={styles.centerPlace}>
                    <ActivityIndicator size="large" color={activeTheme.colors.primary} />
                    <Text style={{ color: activeTheme.colors.textMuted, marginTop: 12 }}>Cargando coches...</Text>
                </View>
            ) : displayCars.length === 0 ? (
                <View style={styles.centerPlace}>
                    <Ionicons name="car-sport" size={64} color={activeTheme.colors.textMuted} />
                    <Text style={{ color: activeTheme.colors.textMuted, marginTop: 12 }}>
                        No hay coches disponibles en este momento
                    </Text>
                    <TouchableOpacity
                        style={{ marginTop: 16, padding: 12, backgroundColor: activeTheme.colors.primary, borderRadius: 8 }}
                        onPress={() => fetchMarketCars(marketTab)}
                    >
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>REINTENTAR</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={displayCars}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={{ gap: 12 }}
                    contentContainerStyle={{ gap: 12, paddingBottom: 100 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                backgroundColor: activeTheme.colors.surface,
                                borderRadius: 12,
                                overflow: 'hidden'
                            }}
                            onPress={() => onSelectCar(item)}
                        >
                            {/* Car Image */}
                            <View style={{ height: 80, backgroundColor: activeTheme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }}>
                                <Image source={{ uri: getCarImage(item) }} style={{ width: '100%', height: 80 }} resizeMode="cover" />
                            </View>

                            {/* HP Badge */}
                            <View style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: activeTheme.colors.primary,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4
                            }}>
                                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{item.hp} CV</Text>
                            </View>

                            {/* Used Badge */}
                            {item.isUsed && (
                                <View style={{
                                    position: 'absolute',
                                    top: 8,
                                    left: 8,
                                    backgroundColor: activeTheme.colors.accent,
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 4
                                }}>
                                    <Text style={{ color: '#FFF', fontSize: 8, fontWeight: 'bold' }}>USADO</Text>
                                </View>
                            )}

                            {/* Car Info */}
                            <View style={{ padding: 10 }}>
                                <Text style={{ color: activeTheme.colors.text, fontWeight: 'bold', fontSize: 12 }} numberOfLines={1}>
                                    {item.brand}
                                </Text>
                                <Text style={{ color: activeTheme.colors.textMuted, fontSize: 11 }} numberOfLines={1}>
                                    {item.model} ({item.year})
                                </Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                    <Text style={{ color: activeTheme.colors.success, fontWeight: 'bold', fontSize: 14 }}>
                                        €{((item.price || 0) / 1000).toFixed(0)}k
                                    </Text>
                                    <View
                                        style={{
                                            backgroundColor: activeTheme.colors.primary,
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            borderRadius: 4
                                        }}
                                    >
                                        <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>
                                            {isSelectingStarter ? 'VER' : 'PUJAR'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    tabRow: {
        flexDirection: 'row',
        gap: 12,
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '800',
    },
    centerPlace: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
    }
});
