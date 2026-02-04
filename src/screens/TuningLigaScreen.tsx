import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { CarPart, MarketBid } from '../models/types';
import { MyBidsSection } from '../components/MyBidsSection';

interface TuningLigaScreenProps {
    loadingParts: boolean;
    marketParts: any[];
    fetchMarketParts: () => void;
    myBids: MarketBid[];
    saldo: number;
    onSelectPart: (part: any) => void;
    onBuyPart: (part: any) => void;
    onEditBid: (bid: MarketBid) => void;
}

export const TuningLigaScreen = ({
    loadingParts,
    marketParts,
    fetchMarketParts,
    myBids,
    saldo,
    onSelectPart,
    onBuyPart,
    onEditBid
}: TuningLigaScreenProps) => {
    const activeTheme = useAppTheme();

    const qualityColors: Record<string, string> = { low: '#888', mid: '#3498db', high: '#f39c12' };

    return (
        <View style={styles.container}>
            {/* Info Banner */}
            <View style={{ backgroundColor: activeTheme.colors.primary + '20', padding: 12, borderRadius: 8, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="construct" size={20} color={activeTheme.colors.primary} />
                <Text style={{ color: activeTheme.colors.text, flex: 1, fontSize: 12 }}>
                    Compra piezas para mejorar tu coche. El stock cambia cada día a las 20:00.
                </Text>
            </View>

            <MyBidsSection myBids={myBids} onEditBid={onEditBid} />

            {/* Parts Grid */}
            {loadingParts ? (
                <View style={styles.centerPlace}>
                    <ActivityIndicator size="large" color={activeTheme.colors.primary} />
                    <Text style={{ color: activeTheme.colors.textMuted, marginTop: 12 }}>Cargando piezas...</Text>
                </View>
            ) : marketParts.length === 0 ? (
                <View style={styles.centerPlace}>
                    <Ionicons name="construct" size={64} color={activeTheme.colors.textMuted} />
                    <Text style={{ color: activeTheme.colors.textMuted, marginTop: 12 }}>
                        No hay piezas disponibles en este momento
                    </Text>
                    <TouchableOpacity
                        style={{ marginTop: 16, padding: 12, backgroundColor: activeTheme.colors.primary, borderRadius: 8 }}
                        onPress={fetchMarketParts}
                    >
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>REINTENTAR</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={marketParts}
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
                                padding: 12,
                                borderLeftWidth: 4,
                                borderLeftColor: qualityColors[item.quality] || '#888'
                            }}
                            onPress={() => onSelectPart(item)}
                        >
                            {/* Part Icon */}
                            <View style={{ alignItems: 'center', marginBottom: 8 }}>
                                <Ionicons
                                    name={
                                        item.type === 'turbo' ? 'flash' :
                                            item.type === 'tires' ? 'ellipse' :
                                                item.type === 'suspension' ? 'git-merge' :
                                                    item.type === 'intercooler' ? 'snow' :
                                                        'cog'
                                    }
                                    size={32}
                                    color={qualityColors[item.quality] || '#888'}
                                />
                            </View>

                            {/* Quality Badge */}
                            <View style={{
                                backgroundColor: qualityColors[item.quality] || '#888',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                                alignSelf: 'center',
                                marginBottom: 6
                            }}>
                                <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>
                                    {item.quality?.toUpperCase()}
                                </Text>
                            </View>

                            {/* Part Info */}
                            <Text style={{ color: activeTheme.colors.text, fontWeight: 'bold', fontSize: 11, textAlign: 'center' }} numberOfLines={2}>
                                {item.name}
                            </Text>
                            <Text style={{ color: activeTheme.colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 2 }}>
                                {item.type?.toUpperCase()}
                            </Text>

                            {/* Price & Buy */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                                <Text style={{ color: activeTheme.colors.success, fontWeight: 'bold', fontSize: 12 }}>
                                    €{(item.price / 1000).toFixed(0)}k
                                </Text>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: saldo >= item.price
                                            ? activeTheme.colors.primary
                                            : activeTheme.colors.textMuted,
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderRadius: 4
                                    }}
                                    onPress={() => onBuyPart(item)}
                                >
                                    <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>COMPRAR</Text>
                                </TouchableOpacity>
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
    centerPlace: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
    }
});
