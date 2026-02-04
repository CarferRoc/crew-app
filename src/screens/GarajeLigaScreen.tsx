import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { Car, CarPart } from '../models/types';
import { calculateEventScore, getCarImage } from '../lib/gameplay';

interface GarajeLigaScreenProps {
    currentEvent: any;
    myCars: Car[];
    myParts: CarPart[];
    garageTab: 'cars' | 'parts';
    setGarageTab: (tab: 'cars' | 'parts') => void;
    handleCarSelect: (car: Car) => void;
}

export const GarajeLigaScreen = ({
    currentEvent,
    myCars,
    myParts,
    garageTab,
    setGarageTab,
    handleCarSelect
}: GarajeLigaScreenProps) => {
    const activeTheme = useAppTheme();

    const renderCarCard = ({ item }: { item: Car }) => {
        const eventScore = calculateEventScore(item, currentEvent.type as any);
        return (
            <TouchableOpacity activeOpacity={0.9} onPress={() => handleCarSelect(item)}>
                <LinearGradient colors={[activeTheme.colors.surface, activeTheme.colors.surfaceVariant]} style={styles.card}>
                    <Image source={{ uri: getCarImage(item) }} style={styles.cardImage} resizeMode="cover" />
                    {(!item.parts || item.parts.length === 0) && (
                        <View style={styles.stockBadge}><Text style={styles.stockText}>DE SERIE</Text></View>
                    )}
                    <View style={styles.cardContent}>
                        <View>
                            <Text style={[styles.brand, { color: activeTheme.colors.text }]}>{item.brand}</Text>
                            <Text style={[styles.model, { color: activeTheme.colors.textMuted }]}>{item.model}</Text>
                        </View>
                        <View style={styles.miniStatRow}>
                            <View style={styles.ptsBadge}><Text style={styles.ptsLabel}>PTS</Text><Text style={styles.ptsValue}>{eventScore}</Text></View>
                            <View><Text style={[styles.hpText, { color: activeTheme.colors.accent }]}>{item.hp} HP</Text></View>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Weekly Event Banner */}
            <LinearGradient colors={['#2A0000', '#000000']} style={styles.eventBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.eventContent}>
                    <Text style={styles.eventTag}>COMPETICIÓN SEMANAL</Text>
                    <Text style={styles.eventName}>{currentEvent.name}</Text>
                    <Text style={styles.eventDesc}>{currentEvent.required}</Text>
                </View>
                <Ionicons name="trophy" size={40} color="#FFD700" style={{ opacity: 0.8 }} />
            </LinearGradient>

            {/* GARAGE TABS */}
            <View style={styles.tabRow}>
                <TouchableOpacity onPress={() => setGarageTab('cars')} style={[styles.tabBtn, garageTab === 'cars' && styles.tabBtnActive]}>
                    <Text style={[styles.tabText, garageTab === 'cars' ? { color: activeTheme.colors.primary } : { color: activeTheme.colors.textMuted }]}>MIS COCHES ({myCars.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setGarageTab('parts')} style={[styles.tabBtn, garageTab === 'parts' && styles.tabBtnActive]}>
                    <Text style={[styles.tabText, garageTab === 'parts' ? { color: activeTheme.colors.primary } : { color: activeTheme.colors.textMuted }]}>MIS PIEZAS ({myParts.length})</Text>
                </TouchableOpacity>
            </View>

            {garageTab === 'cars' ? (
                <FlatList
                    key="cars"
                    data={myCars}
                    renderItem={renderCarCard}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <FlatList
                    key="parts"
                    data={myParts}
                    numColumns={3}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={{ gap: 12 }}
                    ListEmptyComponent={
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Ionicons name="construct-outline" size={48} color={activeTheme.colors.textMuted} />
                            <Text style={{ color: activeTheme.colors.textMuted, marginTop: 10, textAlign: 'center' }}>
                                No tienes piezas sueltas.{'\n'}Visita el Mercado para comprar mejoras.
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={[styles.partCard, { backgroundColor: activeTheme.colors.surface }]}>
                            <View style={[styles.qualityDot, { backgroundColor: item.quality === 'high' ? '#FFD700' : item.quality === 'mid' ? '#007AFF' : '#CD7F32' }]} />
                            <Text style={[styles.partCardName, { color: activeTheme.colors.text }]}>{item.name}</Text>
                            <Text style={{ fontSize: 8, color: activeTheme.colors.textMuted }}>{Object.keys(item.bonusStats).join(' ')}</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { padding: 16, paddingBottom: 100 },
    card: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        height: 200,
        elevation: 5,
    },
    cardImage: { width: '100%', height: '100%', position: 'absolute' },
    cardContent: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    stockBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    stockText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    brand: { fontSize: 24, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' },
    model: { fontSize: 16, fontWeight: '500' },
    miniStatRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    ptsBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    ptsLabel: { fontSize: 8, fontWeight: '900', color: '#000' },
    ptsValue: { fontSize: 18, fontWeight: '900', color: '#000' },
    hpText: { fontSize: 14, fontWeight: '800' },
    eventBanner: {
        marginHorizontal: 16,
        marginBottom: 20,
        padding: 20,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#FF3B30'
    },
    eventContent: { flex: 1 },
    eventTag: { color: '#FF3B30', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
    eventName: { color: '#FFF', fontSize: 20, fontWeight: '800', fontStyle: 'italic' },
    eventDesc: { color: '#AAA', fontSize: 12, marginTop: 4 },
    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 16
    },
    tabBtn: {
        paddingBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    tabBtnActive: {
        borderBottomColor: '#FFD700'
    },
    tabText: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1
    },
    partCard: {
        width: '31%',
        aspectRatio: 1,
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4
    },
    partCardName: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
    qualityDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
});
