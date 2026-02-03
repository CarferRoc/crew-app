import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';

interface LigaListLigaScreenProps {
    myLeagues: any[];
    loading: boolean;
    fetchMyLeagues: () => void;
    handleEnterLeague: (league: any) => void;
    setJoinMode: (mode: 'join' | 'create') => void;
    setJoinModalVisible: (visible: boolean) => void;
    joinModalVisible: boolean;
    joinMode: 'join' | 'create';
    joinCode: string;
    setJoinCode: (code: string) => void;
    newLeagueName: string;
    setNewLeagueName: (name: string) => void;
    handleJoinLeague: () => void;
    handleCreateLeague: () => void;
}

export const LigaListLigaScreen = ({
    myLeagues,
    loading,
    fetchMyLeagues,
    handleEnterLeague,
    setJoinMode,
    setJoinModalVisible,
    joinModalVisible,
    joinMode,
    joinCode,
    setJoinCode,
    newLeagueName,
    setNewLeagueName,
    handleJoinLeague,
    handleCreateLeague
}: LigaListLigaScreenProps) => {
    const activeTheme = useAppTheme();

    const renderOnboarding = () => (
        <View style={[styles.container, styles.centerContent]}>
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
                <Ionicons name="trophy-outline" size={80} color={activeTheme.colors.primary} />
                <Text style={[styles.modalTitle, { color: activeTheme.colors.text, marginTop: 20 }]}>LIGAS MEET N'GREET</Text>
                <Text style={{ color: activeTheme.colors.textMuted, textAlign: 'center', maxWidth: 300 }}>
                    Compite semanalmente, personaliza tus coches y domina las calles.
                </Text>
            </View>

            <View style={{ width: '80%', gap: 16 }}>
                <Button
                    title="CREAR NUEVA LIGA"
                    onPress={() => { setJoinMode('create'); setJoinModalVisible(true); }}
                />
                <Button
                    title="UNIRME CON CÓDIGO"
                    variant="outline"
                    onPress={() => { setJoinMode('join'); setJoinModalVisible(true); }}
                />
            </View>
        </View>
    );

    const renderJoinModal = () => (
        <Modal
            transparent
            visible={joinModalVisible}
            animationType="fade"
            onRequestClose={() => setJoinModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: activeTheme.colors.surface }]}>
                    <Text style={[styles.modalTitle, { color: activeTheme.colors.text }]}>
                        {joinMode === 'join' ? 'UNIRSE A LIGA' : 'CREAR LIGA'}
                    </Text>

                    {joinMode === 'join' ? (
                        <View style={styles.inputContainer}>
                            <Text style={{ color: activeTheme.colors.textMuted }}>Código de invitación:</Text>
                            <Button
                                title={joinCode || "Introducir Código"}
                                variant="outline"
                                onPress={() => Alert.prompt('Código', '', text => setJoinCode(text))}
                            />
                            <Button title="Unirse" onPress={handleJoinLeague} style={{ marginTop: 10 }} />
                        </View>
                    ) : (
                        <View style={styles.inputContainer}>
                            <Text style={{ color: activeTheme.colors.textMuted }}>Nombre de la liga:</Text>
                            <Button
                                title={newLeagueName || "Introducir Nombre"}
                                variant="outline"
                                onPress={() => Alert.prompt('Nombre', '', text => setNewLeagueName(text))}
                            />
                            <Button title="Crear" onPress={handleCreateLeague} style={{ marginTop: 10 }} />
                        </View>
                    )}

                    <TouchableOpacity onPress={() => setJoinModalVisible(false)} style={{ marginTop: 20 }}>
                        <Text style={{ color: activeTheme.colors.textMuted, textAlign: 'center' }}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (myLeagues.length === 0 && !loading) return (
        <>
            {renderOnboarding()}
            {renderJoinModal()}
        </>
    );

    return (
        <View style={styles.container}>
            <Header
                title="MIS LIGAS"
                rightAction={null}
            />

            <FlatList
                data={myLeagues}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.leagueCard, { backgroundColor: activeTheme.colors.surface }]}
                        onPress={() => handleEnterLeague(item)}
                    >
                        <LinearGradient
                            colors={[activeTheme.colors.surface, activeTheme.colors.surfaceVariant]}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.leagueIcon}>
                            <Ionicons name="trophy" size={24} color={activeTheme.colors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.leagueName, { color: activeTheme.colors.text }]}>
                                {item.league?.name
                                    ? `Liga ${item.league.name}`
                                    : item.name
                                        ? `Liga ${item.name}`
                                        : `Liga #${item.league_id?.slice(0, 6) || 'Sin ID'}`}
                            </Text>
                            <Text style={[styles.leagueCode, { color: activeTheme.colors.textMuted }]}>
                                Código: {item.league?.code || item.league_code || 'N/A'}
                            </Text>
                        </View>
                        <View>
                            <Text style={[styles.statValue, { color: activeTheme.colors.success }]}>
                                €{(item.budget / 1000).toFixed(0)}k
                            </Text>
                            <Text style={{ color: activeTheme.colors.textMuted, fontSize: 10 }}>SALDO</Text>
                        </View>
                    </TouchableOpacity>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={fetchMyLeagues}
                        tintColor={activeTheme.colors.primary}
                    />
                }
            />

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: activeTheme.colors.primary }]}
                onPress={() => {
                    Alert.alert(
                        "Nueva Liga",
                        "¿Qué quieres hacer?",
                        [
                            { text: "Cancelar", style: "cancel" },
                            {
                                text: "Crear Liga",
                                onPress: () => { setJoinMode('create'); setJoinModalVisible(true); }
                            },
                            {
                                text: "Unirme con Código",
                                onPress: () => { setJoinMode('join'); setJoinModalVisible(true); }
                            }
                        ]
                    );
                }}
            >
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>
            {renderJoinModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 10
    },
    leagueCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        gap: 12,
        overflow: 'hidden',
        height: 80
    },
    leagueIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    leagueName: {
        fontSize: 18,
        fontWeight: '800',
        fontStyle: 'italic',
        textTransform: 'uppercase'
    },
    leagueCode: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'right'
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        padding: 24,
        borderRadius: 20,
        gap: 16
    },
    inputContainer: {
        gap: 10
    },
});
