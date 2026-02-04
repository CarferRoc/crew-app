import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Image, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Car, CarPart, PartType, PartQuality, MarketBid } from '../models/types';
import { getPartName, calculateStats, calculateLaborCost, getCarImage } from '../lib/gameplay';
import { StatBar, TechnicalRow } from '../components/StatComponents';
import { PartItem } from '../components/PartItem';

interface ModalesLigaScreenProps {
    // Editor Props
    selectedCar: Car | null;
    editorVisible: boolean;
    setEditorVisible: (visible: boolean) => void;
    myParts: CarPart[];
    handleRemovePart: (part: CarPart) => void;
    handleEquipPart: (part: CarPart) => void;
    handleInstallMods: () => void;
    handleSellCar: () => void;

    // Preview Props
    previewCar: any | null;
    previewVisible: boolean;
    setPreviewVisible: (visible: boolean) => void;
    saldo: number;
    myCars: Car[];
    bidAmount: string;
    setBidAmount: (amount: string) => void;
    handlePlaceBid: (item: any, type: 'car' | 'part', amount: number) => void;
    isSelectingStarter?: boolean;

    // Part Modal Props
    partModalVisible: boolean;
    setPartModalVisible: (visible: boolean) => void;

    // Menu Props
    menuVisible: boolean;
    setMenuVisible: (visible: boolean) => void;
    activeLeague: any | null;
    setViewMode: (mode: any) => void;
    setMarketTab: (tab: any) => void;
    fetchMarketCars: (tab: any) => void;
    handleDeleteLeague: () => void;
    handleDeleteAllLeagues: () => void;
    fetchMyLeagues: () => void;
    setActiveLeague: (league: any) => void;
    fetchParticipants: () => void;
}

export const ModalesLigaScreen = ({
    selectedCar,
    editorVisible,
    setEditorVisible,
    myParts,
    handleRemovePart,
    handleEquipPart,
    handleInstallMods,
    handleSellCar,
    previewCar,
    previewVisible,
    setPreviewVisible,
    saldo,
    myCars,
    bidAmount,
    setBidAmount,
    handlePlaceBid,
    isSelectingStarter,
    partModalVisible,
    setPartModalVisible,
    menuVisible,
    setMenuVisible,
    activeLeague,
    setViewMode,
    setMarketTab,
    fetchMarketCars,
    handleDeleteLeague,
    handleDeleteAllLeagues,
    fetchMyLeagues,
    setActiveLeague,
    fetchParticipants
}: ModalesLigaScreenProps) => {
    const activeTheme = useAppTheme();

    const renderPartsEditor = () => {
        if (!selectedCar) return null;
        const stats = selectedCar.stats || calculateStats(selectedCar);
        const activeSynergy1 = selectedCar.parts.some(p => p.type === 'turbo') && selectedCar.parts.some(p => p.type === 'intercooler');
        const partTypes: PartType[] = ['tires', 'turbo', 'intercooler', 'suspension', 'transmission'];

        return (
            <Modal animationType="slide" visible={editorVisible} onRequestClose={() => setEditorVisible(false)}>
                <View style={[styles.editorContainer, { backgroundColor: activeTheme.colors.background }]}>
                    <Header title="TALLER" showBack onBack={() => setEditorVisible(false)} />
                    <ScrollView contentContainerStyle={styles.editorContent}>
                        <Image source={{ uri: getCarImage(selectedCar) }} style={styles.editorImage} />
                        <Text style={[styles.editorTitle, { color: activeTheme.colors.text }]}>{selectedCar.brand} {selectedCar.model}</Text>

                        <View style={styles.statsPanel}>
                            <Text style={styles.panelTitle}>FICHA TÉCNICA (DB)</Text>
                            <View style={{ gap: 8 }}>
                                <TechnicalRow label="Cilindros" value={selectedCar.cylinders || 'N/A'} />
                                <TechnicalRow label="Caja" value={selectedCar.gearbox || 'N/A'} />
                                <TechnicalRow label="Tracción" value={selectedCar.drive_type || 'N/A'} />
                                <TechnicalRow label="0-100 km/h" value={selectedCar.acceleration ? `${selectedCar.acceleration}s` : 'N/A'} />
                                <TechnicalRow label="Vel. Máx" value={selectedCar.top_speed ? `${selectedCar.top_speed} km/h` : 'N/A'} />
                                <TechnicalRow label="Par Motor" value={selectedCar.torque || 'N/A'} />
                                <TechnicalRow label="Peso" value={selectedCar.unladen_weight ? `${selectedCar.unladen_weight} kg` : 'N/A'} />
                            </View>
                        </View>

                        <View style={[styles.statsPanel, { marginTop: 16 }]}>
                            <Text style={styles.panelTitle}>ESPECIFICACIONES</Text>
                            <StatBar label="AC" value={stats.ac} baseValue={selectedCar.baseStats?.ac || 0} color="#FF3B30" />
                            <StatBar label="MN" value={stats.mn} baseValue={selectedCar.baseStats?.mn || 0} color="#007AFF" />
                            <StatBar label="TR" value={stats.tr} baseValue={selectedCar.baseStats?.tr || 0} color="#FF9500" />
                            <StatBar label="FI" value={stats.fi} baseValue={selectedCar.baseStats?.fi || 0} color="#34C759" />
                        </View>

                        {activeSynergy1 && (
                            <View style={styles.synergyBadge}>
                                <Ionicons name="flash" size={16} color="#000" />
                                <Text style={styles.synergyText}>STAGE 2 ACTIVADO (+15% AC)</Text>
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>EQUIPAMIENTO</Text>
                        <View style={styles.partsGrid}>
                            {partTypes.map(type => {
                                const equippedPart = selectedCar.parts.find(p => p.type === type);
                                const availableParts = myParts.filter(p => p.type === type);
                                return (
                                    <View key={type} style={{ marginBottom: 16 }}>
                                        <Text style={[styles.partCategory, { color: activeTheme.colors.text }]}>{type.toUpperCase()}</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                            {equippedPart ? (
                                                <View style={{ position: 'relative' }}>
                                                    <PartItem type={type} quality={equippedPart.quality} isEquipped={true} onPress={() => { }} />
                                                    <TouchableOpacity onPress={() => handleRemovePart(equippedPart)} style={styles.removeBtnAbs}>
                                                        <Ionicons name="close" size={12} color="#FFF" />
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <View style={styles.emptySlot}><Text style={{ color: activeTheme.colors.textMuted, fontSize: 10 }}>VACÍO</Text></View>
                                            )}
                                            {availableParts.length > 0 && <View style={styles.vertDivider} />}
                                            {availableParts.map(p => (
                                                <PartItem key={p.id} type={type} quality={p.quality} isEquipped={false} onPress={() => handleEquipPart(p)} />
                                            ))}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        <TouchableOpacity onPress={handleInstallMods} style={styles.primaryBtn}>
                            <Ionicons name="build-outline" size={24} color="#FFF" />
                            <Text style={styles.btnText}>INSTALAR (€{calculateLaborCost(selectedCar) / 1000}k)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSellCar} style={[styles.primaryBtn, { backgroundColor: activeTheme.colors.error, marginTop: 12 }]}>
                            <Ionicons name="trash-outline" size={24} color="#FFF" />
                            <Text style={styles.btnText}>VENDER (€{selectedCar ? Math.round(((selectedCar.hp || 150) * 800 * 0.5) / 1000) : 0}k)</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    const renderCarPreview = () => {
        if (!previewCar || !previewVisible) return null;
        const dbStats = previewCar.dbStats || { ac: 0, mn: 0, tr: 0, cn: 0, es: 0, fi: 0 };
        const canAfford = saldo >= previewCar.price;
        const hasCar = myCars.length > 0;

        return (
            <Modal animationType="slide" visible={previewVisible} onRequestClose={() => setPreviewVisible(false)}>
                <View style={[styles.editorContainer, { backgroundColor: activeTheme.colors.background }]}>

                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
                        <Header title={isSelectingStarter ? "COCHE INICIAL" : (previewCar.isUsed ? "COCHE USADO" : "COCHE NUEVO")} showBack onBack={() => setPreviewVisible(false)} />
                    </View>

                    <ScrollView style={{ flex: 1 }} bounces={false}>
                        {/* Hero Image Section */}
                        <View style={{ width: '100%', height: 400, position: 'relative' }}>
                            <Image
                                source={{ uri: getCarImage(previewCar) }}
                                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                            />
                            <LinearGradient
                                colors={['transparent', activeTheme.colors.background]}
                                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 200 }}
                            />
                            <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                                <Text style={{ color: activeTheme.colors.text, fontSize: 36, fontWeight: '800', lineHeight: 40 }}>
                                    {previewCar.brand}
                                </Text>
                                <Text style={{ color: activeTheme.colors.text, fontSize: 28, fontWeight: '300', marginBottom: 8 }}>
                                    {previewCar.model}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={{ backgroundColor: activeTheme.colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                                        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>{previewCar.year}</Text>
                                    </View>
                                    <Text style={{ color: '#CCC', fontSize: 16, fontWeight: '600' }}>{previewCar.hp} HP</Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ padding: 20, paddingTop: 0 }}>

                            <View style={[styles.priceBadge, { backgroundColor: canAfford ? activeTheme.colors.success + '20' : activeTheme.colors.error + '20', alignSelf: 'flex-start', marginTop: 10 }]}>
                                <Text style={{ color: canAfford ? activeTheme.colors.success : activeTheme.colors.error, fontWeight: 'bold', fontSize: 24 }}>
                                    €{(previewCar.price / 1000).toFixed(0)}k
                                </Text>
                            </View>

                            <View style={styles.statsPanel}>
                                <Text style={styles.panelTitle}>FICHA TÉCNICA (DB)</Text>
                                <View style={{ gap: 8 }}>
                                    <TechnicalRow label="Cilindros" value={previewCar.cylinders || 'N/A'} />
                                    <TechnicalRow label="Caja" value={previewCar.gearbox || 'N/A'} />
                                    <TechnicalRow label="Tracción" value={previewCar.drive_type || 'N/A'} />
                                    <TechnicalRow
                                        label="0-100 km/h"
                                        value={previewCar.acceleration ? `${previewCar.acceleration.toString().replace(/s\s*$/i, '')} s` : 'N/A'}
                                    />
                                    <TechnicalRow
                                        label="Vel. Máx"
                                        value={previewCar.top_speed ? `${previewCar.top_speed.toString().replace(/\s*km\/h$/i, '')} km/h` : 'N/A'}
                                    />
                                    <TechnicalRow
                                        label="Par Motor"
                                        value={(() => {
                                            if (!previewCar.torque) return 'N/A';
                                            const s = previewCar.torque.toString();
                                            const matchNm = s.match(/(\d+\s*Nm)/i);
                                            if (matchNm) return matchNm[1];
                                            return s.length > 25 ? s.substring(0, 25) + '...' : s;
                                        })()}
                                    />
                                    <TechnicalRow
                                        label="Peso"
                                        value={previewCar.unladen_weight ? `${previewCar.unladen_weight.toString().replace(/\s*kg$/i, '')} kg` : 'N/A'}
                                    />
                                </View>
                            </View>

                            <View style={[styles.statsPanel, { marginTop: 16 }]}>
                                <Text style={styles.panelTitle}>ESPECIFICACIONES</Text>
                                <StatBar label="AC" value={dbStats.ac} baseValue={dbStats.ac} color="#FF3B30" />
                                <StatBar label="MN" value={dbStats.mn} baseValue={dbStats.mn} color="#007AFF" />
                                <StatBar label="TR" value={dbStats.tr} baseValue={dbStats.tr} color="#FF9500" />
                                <StatBar label="FI" value={dbStats.fi} baseValue={dbStats.fi} color="#34C759" />
                            </View>

                            {isSelectingStarter ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        handlePlaceBid(previewCar, 'car', previewCar.price);
                                    }}
                                    style={styles.primaryBtn}
                                >
                                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                                    <Text style={styles.btnText}>SELECCIONAR ESTE COCHE</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.statsPanel, { marginTop: 16 }]}>
                                    <Text style={[styles.panelTitle, { color: activeTheme.colors.text }]}>TU PUJA A CIEGAS</Text>
                                    <View style={styles.bidInputContainer}>
                                        <Text style={styles.currencySymbol}>€</Text>
                                        <TextInput
                                            style={styles.bidInput}
                                            keyboardType="numeric"
                                            value={bidAmount}
                                            onChangeText={setBidAmount}
                                            placeholder={previewCar.price.toString()}
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                        />
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            const amount = parseInt(bidAmount);
                                            if (isNaN(amount) || amount < previewCar.price) {
                                                Alert.alert("Puja Inválida", `Mínima: €${previewCar.price.toLocaleString()}`);
                                                return;
                                            }
                                            handlePlaceBid(previewCar, 'car', amount);
                                        }}
                                        disabled={hasCar}
                                        style={[styles.primaryBtn, hasCar && { opacity: 0.5 }]}
                                    >
                                        <Text style={styles.btnText}>PUJAR POR ESTE COCHE</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            <View style={{ height: 40 }} />
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    const renderPartPreview = () => {
        if (!previewCar || !partModalVisible) return null;
        const canAfford = saldo >= previewCar.price;

        return (
            <Modal animationType="slide" visible={partModalVisible} onRequestClose={() => setPartModalVisible(false)}>
                <View style={[styles.editorContainer, { backgroundColor: activeTheme.colors.background }]}>
                    <Header title="VALORACIÓN DE PIEZA" showBack onBack={() => setPartModalVisible(false)} />
                    <ScrollView contentContainerStyle={styles.editorContent}>
                        <View style={{ alignItems: 'center', marginVertical: 40 }}>
                            <Ionicons name="construct" size={100} color={activeTheme.colors.primary} />
                            <Text style={[styles.editorTitle, { color: activeTheme.colors.text, marginTop: 20 }]}>{previewCar.name}</Text>
                            <Text style={styles.subtitle}>{previewCar.type.toUpperCase()} • {previewCar.quality.toUpperCase()}</Text>
                        </View>

                        <View style={[styles.priceBadge, { backgroundColor: canAfford ? activeTheme.colors.success + '20' : activeTheme.colors.error + '20' }]}>
                            <Text style={{ color: canAfford ? activeTheme.colors.success : activeTheme.colors.error, fontWeight: 'bold', fontSize: 24 }}>
                                €{(previewCar.price / 1000).toFixed(0)}k
                            </Text>
                        </View>

                        <View style={[styles.statsPanel, { marginTop: 16 }]}>
                            <Text style={styles.panelTitle}>TU PUJA A CIEGAS</Text>
                            <View style={styles.bidInputContainer}>
                                <Text style={styles.currencySymbol}>€</Text>
                                <TextInput
                                    style={styles.bidInput}
                                    keyboardType="numeric"
                                    value={bidAmount}
                                    onChangeText={setBidAmount}
                                    placeholder={previewCar.price.toString()}
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                />
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    const amount = parseInt(bidAmount);
                                    if (isNaN(amount) || amount < previewCar.price) {
                                        Alert.alert("Puja Inválida", `Mínima: €${previewCar.price.toLocaleString()}`);
                                        return;
                                    }
                                    handlePlaceBid(previewCar, 'part', amount);
                                }}
                                style={styles.primaryBtn}
                            >
                                <Text style={styles.btnText}>PUJAR POR ESTA PIEZA</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    const renderMenu = () => (
        <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
                <View style={[styles.menuContainer, { backgroundColor: activeTheme.colors.surface }]}>
                    {activeLeague ? (
                        <>
                            <MenuBtn icon="car-sport-outline" text="MI GARAJE" onPress={() => { setViewMode('garage'); setMenuVisible(false); }} />
                            <MenuBtn icon="storefront-outline" text="CONCESIONARIO" onPress={() => { setViewMode('market'); setMarketTab('new'); fetchMarketCars('new'); setMenuVisible(false); }} />
                            <MenuBtn icon="construct-outline" text="TUNNING" onPress={() => { setViewMode('tuning'); setMenuVisible(false); }} />
                            <MenuBtn icon="people-outline" text="PARTICIPANTES" onPress={() => { setViewMode('participantes'); fetchParticipants(); setMenuVisible(false); }} />
                            <View style={styles.divider} />
                            <MenuBtn icon="trash-outline" text="ELIMINAR LIGA" color={activeTheme.colors.error} onPress={handleDeleteLeague} />
                            <View style={styles.divider} />
                            <MenuBtn icon="exit-outline" text="SALIR A MIS LIGAS" onPress={() => { setActiveLeague(null); setMenuVisible(false); }} />
                        </>
                    ) : (
                        <>
                            <MenuBtn icon="refresh-outline" text="RECARGAR LIGAS" onPress={() => { fetchMyLeagues(); setMenuVisible(false); }} />
                            <MenuBtn icon="person-circle-outline" text="MI PERFIL" onPress={() => { Alert.alert('Perfil', 'Próximamente'); setMenuVisible(false); }} />
                        </>
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const MenuBtn = ({ icon, text, onPress, color }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <Ionicons name={icon} size={24} color={color || activeTheme.colors.text} />
            <Text style={[styles.menuText, { color: color || activeTheme.colors.text }]}>{text}</Text>
        </TouchableOpacity>
    );

    return (
        <>
            {renderPartsEditor()}
            {renderCarPreview()}
            {renderPartPreview()}
            {renderMenu()}
        </>
    );
};

const styles = StyleSheet.create({
    editorContainer: { flex: 1 },
    editorContent: { padding: 20 },
    editorImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 20 },
    editorTitle: { fontSize: 24, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
    subtitle: { color: '#888', textAlign: 'center', marginBottom: 16 },
    priceBadge: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, alignSelf: 'center', marginBottom: 20 },
    statsPanel: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, marginBottom: 20 },
    panelTitle: { color: '#888', fontSize: 12, marginBottom: 12, textAlign: 'center' },
    synergyBadge: { backgroundColor: '#FFE600', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, marginBottom: 8, gap: 8 },
    synergyText: { color: '#000', fontWeight: '800', fontSize: 12 },
    sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 1, marginBottom: 12, color: '#888' },
    partsGrid: { gap: 16 },
    partCategory: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
    emptySlot: { width: 80, height: 60, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
    removeBtnAbs: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FF3B30', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    vertDivider: { width: 1, height: '80%', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 8 },
    primaryBtn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    bidInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 16, marginBottom: 16 },
    currencySymbol: { color: '#32D74B', fontSize: 18, fontWeight: 'bold' },
    bidInput: { flex: 1, color: '#FFF', fontSize: 20, fontWeight: 'bold', padding: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
    menuContainer: { position: 'absolute', top: 60, right: 20, width: 220, borderRadius: 12, padding: 8, backgroundColor: '#1C1C1E' },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderRadius: 8 },
    menuText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 8, marginHorizontal: 12 },
});
