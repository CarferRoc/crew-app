
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { useStore } from '../store/useStore';
import { War, WarEntry } from '../models/types';
import { WarService } from '../services/WarService';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase'; // Assuming supabase is imported from here

export const CarWarScreen = () => {
    const { t } = useTranslation();
    const { currentUser } = useStore();
    const activeTheme = useAppTheme();
    // State
    const [currentWar, setCurrentWar] = useState<War | null>(null);
    const [entries, setEntries] = useState<WarEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userCrew, setUserCrew] = useState<any>(null);
    const [userLeague, setUserLeague] = useState<any>(null); // New state for League
    const [showJoinModal, setShowJoinModal] = useState(false);

    // Admin State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [warName, setWarName] = useState('');
    const [isMultiguerra, setIsMultiguerra] = useState(false);

    // Voting State
    const [selectedEntry, setSelectedEntry] = useState<WarEntry | null>(null);
    const [voteScore, setVoteScore] = useState('');
    const [crewMembers, setCrewMembers] = useState<any[]>([]);

    // Join War State
    // const [showJoinModal, setShowJoinModal] = useState(false); // Moved up
    const [myEligibleCrews, setMyEligibleCrews] = useState<any[]>([]);
    const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);

    useEffect(() => {
        fetchWarData();
    }, []);

    useEffect(() => {
        if (showJoinModal) fetchEligibleCrews();
    }, [showJoinModal]);

    const fetchEligibleCrews = async () => {
        if (!currentUser || !currentWar) return;
        // 1. Get my led crews
        const ledCrews = await WarService.getLedCrews(currentUser.id);

        // 2. Filter out already joined
        const joinedCrewIds = entries.map(e => e.crew_id);
        // Note: ledCrews returns items like { crew_id: '...', crews: { ... } }
        // We need to map it to just the crew object with ID
        const eligible = ledCrews
            .map((item: any) => item.crews)
            .filter((c: any) => c && !joinedCrewIds.includes(c.id) && c.name !== 'Líderes');

        setMyEligibleCrews(eligible);
        if (eligible.length > 0) setSelectedCrewId(eligible[0].id);
    };

    const handleJoinWar = async () => {
        if (!selectedCrewId || !currentWar) {
            Alert.alert('Error', 'Please select a crew.');
            return;
        }

        // Find city from selected crew (location column)
        const crew = myEligibleCrews.find(c => c.id === selectedCrewId);
        const city = crew?.location || 'Unknown';

        try {
            await WarService.joinWar(currentWar.id, selectedCrewId, city);
            setShowJoinModal(false);
            fetchWarData();
            Alert.alert('Success', 'Your crew has joined the war!');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const fetchWarData = async () => {
        setLoading(true);
        try {
            const activeWar = await WarService.getCurrentWar();
            setCurrentWar(activeWar);

            // 2. Get User's Crew & League
            let crewId = null;
            let themeLeagueId = null;

            if (currentUser) {
                // ... (existing logic to find crew) ...
                // Optimized: fetch crew with league
                const { data: memberData } = await supabase
                    .from('crew_members')
                    .select('crew_id, crews(id, name, war_league_id, war_leagues(id, name, level))')
                    .eq('profile_id', currentUser.id)
                    .single();

                if (memberData?.crews) {
                    // crews is likely an object because of .single() on the main query memberData
                    // But war_leagues might be an array or object depending on relation
                    const crew = Array.isArray(memberData.crews) ? memberData.crews[0] : memberData.crews;
                    setUserCrew(crew);
                    crewId = crew.id;

                    if (crew.war_leagues) {
                        // If it's a single relation it's an object, if multiple it's array. 
                        // Typically relations are arrays unless !inner and specific constrained.
                        // Safest is to handle both.
                        const league = Array.isArray(crew.war_leagues) ? crew.war_leagues[0] : crew.war_leagues;
                        setUserLeague(league);
                        themeLeagueId = league?.id;
                    }
                }
            }

            // 3. Get Entries (Filtered by League if applicable)
            if (activeWar) {
                // If user has a league, filter by it. If not, show all? Or show none?
                // Request says "only compete between same league". 
                // So if user has a league, show that league's entries.
                // If user has NO league (no crew), maybe show a default or global?
                // Let's default to the user's league.
                const warEntries = await WarService.getWarEntries(activeWar.id, themeLeagueId || undefined);
                setEntries(warEntries);
            } else {
                setEntries([]);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load war data');
        }
        setLoading(false);
    };

    const handleCreateWar = async () => {
        if (!warName.trim()) {
            Alert.alert('Error', 'Please enter a war name');
            return;
        }
        try {
            await WarService.startWar(warName, isMultiguerra);
            setShowCreateModal(false);
            setWarName('');
            fetchWarData();
            Alert.alert('Success', 'War started successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to start war');
        }
    };

    useEffect(() => {
        if (selectedEntry && currentUser?.role === 'admin') {
            loadCrewMembers(selectedEntry.crew_id);
        }
    }, [selectedEntry]);

    const loadCrewMembers = async (crewId: string) => {
        const members = await WarService.getCrewMembers(crewId);
        setCrewMembers(members);
    };

    const handleAwardPoints = async (amount: number, memberId?: string) => {
        if (!selectedEntry) return;
        try {
            await WarService.awardPoints(selectedEntry.crew_id, amount, memberId);
            Alert.alert('Success', `Awarded ${amount} points to ${memberId ? 'MVP' : 'all crew members'}`);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleVote = async () => {
        if (!selectedEntry || !currentWar) return;
        const score = parseInt(voteScore);
        if (isNaN(score) || score < 1 || score > 10) {
            Alert.alert('Error', 'Score must be between 1 and 10');
            return;
        }
        try {
            await WarService.submitVote(currentWar.id, selectedEntry.id, score);
            setSelectedEntry(null);
            setVoteScore('');
            setCrewMembers([]);
            fetchWarData(); // Refresh scores
            Alert.alert('Success', 'Vote submitted');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleEndWar = () => {
        if (!currentWar) return;
        Alert.alert(
            t('war.confirmEndTitle'),
            t('war.confirmEndMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('war.endWar'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await WarService.endWar(currentWar.id);
                            fetchWarData();
                            Alert.alert('Success', 'War ended and results calculated.');
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const renderEntry = ({ item, index }: { item: WarEntry; index: number }) => {
        const isTop3 = index < 3;
        return (
            <TouchableOpacity
                style={[styles.entryCard, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}
                onPress={() => currentUser?.role === 'admin' ? setSelectedEntry(item) : null}
            >
                <View style={[styles.rankBadge, isTop3 ? { backgroundColor: activeTheme.colors.accent } : { backgroundColor: '#444' }]}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                </View>

                <Image
                    source={{ uri: item.car_photo_url || item.crew?.image_url || item.crew?.badge || 'https://via.placeholder.com/100' }}
                    style={styles.carImage}
                />

                <View style={styles.entryInfo}>
                    <Text style={[styles.crewName, { color: activeTheme.colors.text }]}>{item.crew?.name || 'Unknown Crew'}</Text>
                    {item.city && <Text style={[styles.cityName, { color: activeTheme.colors.textMuted }]}>{item.city}</Text>}
                </View>

                <View style={styles.scoreContainer}>
                    <Text style={[styles.scoreText, { color: activeTheme.colors.primary }]}>{item.total_score}</Text>
                    <Text style={[styles.ptsLabel, { color: activeTheme.colors.textMuted }]}>PTS</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (!currentUser) return null;

    // Admin UI State inside Modal
    const [showAdminTools, setShowAdminTools] = useState(false);

    const handleCloseModal = () => {
        setSelectedEntry(null);
        setVoteScore('');
        setCrewMembers([]);
        setShowAdminTools(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title={t('war.title')} />

            <View style={styles.content}>

                {/* Admin Controls */}
                {currentUser.role === 'admin' && (
                    <View style={styles.adminPanel}>
                        <Text style={[styles.adminTitle, { color: activeTheme.colors.textMuted }]}>{t('war.adminPanel')}</Text>
                        {!currentWar ? (
                            <TouchableOpacity
                                style={[styles.adminBtn, { backgroundColor: activeTheme.colors.primary }]}
                                onPress={() => setShowCreateModal(true)}
                            >
                                <Text style={styles.btnText}>{t('war.createMonthlyWar')}</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.adminActions}>
                                <TouchableOpacity
                                    style={[styles.adminBtn, { backgroundColor: activeTheme.colors.error, flex: 1, marginRight: 8 }]}
                                    onPress={handleEndWar}
                                >
                                    <Text style={styles.btnText}>{t('war.endWar')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* Active War Display */}
                {currentWar ? (
                    <>
                        <View style={styles.warHeader}>
                            <Text style={[styles.warTitle, { color: activeTheme.colors.text }]}>{currentWar.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[styles.warStatus, { color: activeTheme.colors.accent, marginRight: 10 }]}>
                                    {currentWar.status.toUpperCase()}
                                </Text>
                                {userLeague && (
                                    <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 10 }}>
                                        <Text style={{ color: activeTheme.colors.text, fontSize: 12, fontWeight: 'bold' }}>
                                            {userLeague.name}
                                        </Text>
                                    </View>
                                )}
                                {/* Join Button for Crew Leaders */}
                                {(currentUser.role === 'admin' || currentUser.role === 'lider' || currentUser.role === 'user') && (
                                    <TouchableOpacity
                                        style={[styles.joinBtn, { backgroundColor: activeTheme.colors.secondary }]}
                                        onPress={() => setShowJoinModal(true)}
                                    >
                                        <Text style={styles.joinBtnText}>{t('war.join')}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <FlatList
                            data={entries}
                            renderItem={renderEntry}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.list}
                            ListEmptyComponent={
                                <Text style={[styles.emptyText, { color: activeTheme.colors.textMuted }]}>
                                    {t('war.noEntries')}
                                </Text>
                            }
                        />
                    </>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: activeTheme.colors.textMuted }]}>
                            {t('war.noActive')}
                        </Text>
                    </View>
                )}

            </View>

            {/* Create Modal */}
            <Modal visible={showCreateModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: activeTheme.colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: activeTheme.colors.text }]}>{t('war.startNew')}</Text>

                        <TextInput
                            style={[styles.input, { color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                            placeholder={t('war.warNamePlaceholder')}
                            placeholderTextColor={activeTheme.colors.textMuted}
                            value={warName}
                            onChangeText={setWarName}
                        />

                        <TouchableOpacity onPress={() => setIsMultiguerra(!isMultiguerra)}>
                            <Text style={{ color: activeTheme.colors.primary, marginBottom: 20 }}>
                                {t('war.mode')}: {isMultiguerra ? t('war.multiguerraInitial') : t('war.regularPromo')}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowCreateModal(false)}>
                                <Text style={{ color: activeTheme.colors.textMuted }}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleCreateWar}>
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{t('war.startBtn')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Join Modal */}
            <Modal visible={showJoinModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: activeTheme.colors.surface, maxHeight: '80%' }]}>
                        <Text style={[styles.modalTitle, { color: activeTheme.colors.text }]}>Join War</Text>

                        {myEligibleCrews.length === 0 ? (
                            <Text style={{ color: activeTheme.colors.textMuted, textAlign: 'center', marginBottom: 20 }}>
                                You have no eligible crews to register (or they already joined).
                            </Text>
                        ) : (
                            <ScrollView>
                                <Text style={{ color: activeTheme.colors.textMuted, marginBottom: 5 }}>Select Crew:</Text>
                                {myEligibleCrews.map(crew => (
                                    <TouchableOpacity
                                        key={crew.id}
                                        style={[styles.optionItem, selectedCrewId === crew.id && { borderColor: activeTheme.colors.primary, borderWidth: 1 }]}
                                        onPress={() => setSelectedCrewId(crew.id)}
                                    >
                                        <Text style={{ color: activeTheme.colors.text }}>{crew.name} ({crew.location || 'No Location'})</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowJoinModal(false)}>
                                <Text style={{ color: activeTheme.colors.textMuted }}>Cancel</Text>
                            </TouchableOpacity>
                            {myEligibleCrews.length > 0 && (
                                <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleJoinWar}>
                                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Join War</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Vote / Manage Modal */}
            <Modal visible={!!selectedEntry} transparent animationType="fade" onRequestClose={handleCloseModal}>
                <View style={styles.modalOverlay}>
                    {/* Background Touch Area */}
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={handleCloseModal}
                    />

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
                        pointerEvents="box-none"
                    >
                        {/* Modal Content */}
                        <View style={[styles.modalContent, { backgroundColor: activeTheme.colors.surface, maxHeight: '85%', width: '90%' }]}>
                            <ScrollView
                                contentContainerStyle={{ paddingBottom: 20 }}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={true}
                            >
                                <TouchableOpacity style={{ alignSelf: 'flex-end', padding: 5 }} onPress={handleCloseModal}>
                                    <Ionicons name="close" size={24} color={activeTheme.colors.textMuted} />
                                </TouchableOpacity>

                                <Text style={[styles.modalTitle, { color: activeTheme.colors.text }]}>
                                    {selectedEntry?.crew?.name || 'Unknown Crew'}
                                </Text>
                                <Image
                                    source={{ uri: selectedEntry?.car_photo_url || selectedEntry?.crew?.image_url || selectedEntry?.crew?.badge || 'https://via.placeholder.com/200' }}
                                    style={styles.voteImage}
                                />

                                <Text style={{ color: activeTheme.colors.textMuted, marginBottom: 10, textAlign: 'center' }}>{t('war.rate')}</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
                                    <TextInput
                                        style={[styles.input, { color: activeTheme.colors.text, borderColor: activeTheme.colors.border, textAlign: 'center', fontSize: 24, width: 100, marginBottom: 0 }]}
                                        placeholder="0"
                                        placeholderTextColor={activeTheme.colors.textMuted}
                                        keyboardType="number-pad"
                                        value={voteScore}
                                        onChangeText={setVoteScore}
                                        maxLength={2}
                                    />
                                </View>

                                <TouchableOpacity style={[styles.modalBtnConfirm, { marginBottom: 10 }]} onPress={handleVote}>
                                    <Text style={{ color: '#FFF', fontWeight: 'bold', textAlign: 'center' }}>{t('war.submitVote')}</Text>
                                </TouchableOpacity>

                                {/* Admin Point Management */}
                                {currentUser?.role === 'admin' && (
                                    <View style={styles.adminBonusSection}>
                                        <TouchableOpacity
                                            style={styles.adminBonusHeader}
                                            onPress={() => setShowAdminTools(!showAdminTools)}
                                        >
                                            <Ionicons name="shield-checkmark" size={16} color={activeTheme.colors.primary} />
                                            <Text style={[styles.adminBonusTitle, { color: activeTheme.colors.primary }]}>{t('war.adminTools')}</Text>
                                            <Ionicons name={showAdminTools ? "chevron-up" : "chevron-down"} size={16} color={activeTheme.colors.primary} style={{ marginLeft: 'auto' }} />
                                        </TouchableOpacity>

                                        {showAdminTools && (
                                            <View>
                                                <Text style={[styles.mvpLabel, { color: activeTheme.colors.textMuted }]}>{t('war.selectMvp')}</Text>

                                                {crewMembers.length === 0 ? (
                                                    <Text style={{ color: activeTheme.colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginVertical: 10 }}>{t('war.loadingMembers')}</Text>
                                                ) : (
                                                    <View style={styles.memberListContainer}>
                                                        {crewMembers.map((member: any) => (
                                                            <View key={member.profile_id} style={[styles.memberRow, { backgroundColor: activeTheme.colors.background, borderColor: activeTheme.colors.border }]}>
                                                                <View style={styles.memberInfo}>
                                                                    <Image
                                                                        source={{ uri: member.profile?.avatar_url || 'https://via.placeholder.com/30' }}
                                                                        style={styles.memberAvatar}
                                                                    />
                                                                    <Text style={[styles.memberName, { color: activeTheme.colors.text }]} numberOfLines={1}>
                                                                        {member.profile?.username || t('war.unknown')}
                                                                    </Text>
                                                                </View>
                                                                <TouchableOpacity
                                                                    style={[styles.mvpBtn, { backgroundColor: activeTheme.colors.primary }]}
                                                                    onPress={() => handleAwardPoints(10, member.profile_id)}
                                                                >
                                                                    <Ionicons name="trophy" size={12} color="#FFF" style={{ marginRight: 4 }} />
                                                                    <Text style={styles.mvpBtnText}>{t('war.mvp')}</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        ))}
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: theme.spacing.m },
    adminPanel: { marginBottom: theme.spacing.l, padding: theme.spacing.s, borderBottomWidth: 1, borderBottomColor: '#333' },
    adminTitle: { fontSize: 12, textTransform: 'uppercase', marginBottom: 8 },
    adminActions: { flexDirection: 'row' },
    adminBtn: { padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    btnText: { color: '#FFF', fontWeight: 'bold' },

    warHeader: { marginBottom: theme.spacing.m, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    warTitle: { fontSize: 20, fontWeight: 'bold' },
    warStatus: { fontWeight: 'bold', fontSize: 12 },
    joinBtn: { padding: 8, borderRadius: 6 },
    joinBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },

    list: { paddingBottom: 100 },
    entryCard: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, alignItems: 'center' },
    rankBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rankText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
    carImage: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: '#333' },
    entryInfo: { flex: 1 },
    crewName: { fontWeight: 'bold', fontSize: 16 },
    cityName: { fontSize: 12 },
    scoreContainer: { alignItems: 'center' },
    scoreText: { fontSize: 18, fontWeight: 'bold' },
    ptsLabel: { fontSize: 10 },

    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyText: { fontSize: 16 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
    modalContent: { padding: 20, borderRadius: 16 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 20 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    modalBtnCancel: { padding: 12 },
    modalBtnConfirm: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8 },
    voteImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 20, resizeMode: 'cover' },
    optionItem: { padding: 12, backgroundColor: '#333', borderRadius: 8, marginBottom: 8 },

    // Admin Bonus Styles
    adminBonusSection: { marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#333' },
    adminBonusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'center' },
    adminBonusTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginLeft: 6 },
    clanBonusBtn: { flexDirection: 'row', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderStyle: 'dashed' },
    clanBonusText: { fontWeight: 'bold', fontSize: 14 },
    mvpLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    memberListContainer: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 8 },
    memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: 8, borderRadius: 8, borderWidth: 1 },
    memberInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    memberAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10, borderWidth: 1, borderColor: '#444' },
    memberName: { fontSize: 14, fontWeight: '500' },
    mvpBtn: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
    mvpBtnText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' }
});
