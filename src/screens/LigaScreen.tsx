import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Alert, TouchableOpacity, Modal, ScrollView, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Car, CarPart, League, PartType, PartQuality, CarStats, MarketBid } from '../models/types';
import { calculateStats, calculateEventScore, checkMalfunctionRisk, getPartName } from '../lib/gameplay';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// --- COMPONENTS ---

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    leagueTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
    leagueCode: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
    cashContainer: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(50, 215, 75, 0.1)', borderRadius: 8 },
    cashText: { fontWeight: '800', fontSize: 16 },

    navContainer: {

        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    navPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    navText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },

    content: { flex: 1 },
    listContent: { padding: 16, paddingBottom: 100 },

    centerPlace: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    marketTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 4, marginTop: 16 },

    // Card
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
        backgroundColor: 'rgba(0,0,0,0.3)', // gradient overlay
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

    // Week Banner
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

    // Editor
    editorContainer: { flex: 1 },
    editorContent: { padding: 20 },
    editorImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 20 },
    editorTitle: { fontSize: 24, fontWeight: '800', marginBottom: 20, textAlign: 'center' },

    statsPanel: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        gap: 12,
    },
    statRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statLabel: { width: 40, fontSize: 12, fontWeight: '700', color: '#888' },
    statBarContainer: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
    statBarBase: { height: '100%', backgroundColor: '#FFF' },
    statBarDiff: { position: 'absolute', height: '100%' },
    statValue: { width: 40, fontSize: 12, fontWeight: '700', color: '#FFF', textAlign: 'right' },

    synergyBadge: {
        backgroundColor: '#FFE600',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        gap: 8
    },
    synergyText: { color: '#000', fontWeight: '800', fontSize: 12 },

    riskBadge: {
        backgroundColor: '#FF453A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
        gap: 8
    },
    riskText: { color: '#FFF', fontWeight: '800', fontSize: 12 },

    sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
    partsGrid: { gap: 16 },
    partCategory: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
    partItem: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
    },
    qualityDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
    partName: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
    qualityText: { fontSize: 8, color: '#888', marginTop: 2 },
    removeBtn: { width: 30, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: 8 },

    // League List
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
    cardCode: {
        fontSize: 12,
        letterSpacing: 1
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5
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
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 10
    },
    inputContainer: {
        gap: 10
    },
    // New UX Styles
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    menuContainer: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 200,
        borderRadius: 12,
        padding: 8,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
        borderRadius: 8
    },
    menuText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1
    },
    divider: {
        height: 1,
        marginVertical: 8,
        marginHorizontal: 12
    },
    // Inventory & Tabs
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
        borderBottomColor: '#FFD700' // Gold
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
    emptySlot: {
        width: 80,
        height: 60,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed'
    },
    removeBtnAbs: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#FF3B30',
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
    },
    vertDivider: {
        width: 1,
        height: '80%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 8
    }
});




export const LigaScreen = ({ navigation }: any) => {
    const activeTheme = useAppTheme();
    const { currentUser } = useStore();

    // GAME STATE
    const [loading, setLoading] = useState(false);
    const [myLeagues, setMyLeagues] = useState<any[]>([]);
    const [activeLeague, setActiveLeague] = useState<any | null>(null); // The league user is currently playing in context of
    const [menuVisible, setMenuVisible] = useState(false);

    // CONTEXT STATE (Once inside a league)
    const [viewMode, setViewMode] = useState<'dashboard' | 'garage' | 'market' | 'tuning'>('garage');
    const [garageTab, setGarageTab] = useState<'cars' | 'parts'>('cars'); // New Toggle
    const [myCars, setMyCars] = useState<Car[]>([]);
    const [myParts, setMyParts] = useState<CarPart[]>([]); // User's Inventory
    const [saldo, setSaldo] = useState(0);

    // EDITOR STATE
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [editorVisible, setEditorVisible] = useState(false);

    // CREATE/JOIN MODAL
    const [joinModalVisible, setJoinModalVisible] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [newLeagueName, setNewLeagueName] = useState('');
    const [joinMode, setJoinMode] = useState<'join' | 'create'>('join');

    // MARKET STATE
    const [marketTab, setMarketTab] = useState<'new' | 'used'>('new');
    const [marketCars, setMarketCars] = useState<any[]>([]);
    const [loadingMarket, setLoadingMarket] = useState(false);

    // TUNING MARKET STATE
    const [marketParts, setMarketParts] = useState<CarPart[]>([]);
    const [loadingParts, setLoadingParts] = useState(false);
    const [myBids, setMyBids] = useState<MarketBid[]>([]);

    // CAR PREVIEW MODAL STATE
    const [previewCar, setPreviewCar] = useState<any | null>(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [partModalVisible, setPartModalVisible] = useState(false);
    const [bidAmount, setBidAmount] = useState('0');

    // MOCK EVENT (Eventually fetch from DB)
    const currentEvent = {
        type: 'drift',
        name: 'Semana Drift',
        description: 'El control es una ilusión.',
        required: 'Manejo (MN) y Fiabilidad (FI)'
    };

    useEffect(() => {
        if (currentUser) {
            fetchMyLeagues();
        }
    }, [currentUser]);

    useEffect(() => {
        if (activeLeague) {
            fetchMyBids();
            checkAndResolveAuctions(activeLeague);
        }
    }, [activeLeague?.id]);

    // --- DATA FETCHING ---

    const fetchMyLeagues = async () => {
        try {
            setLoading(true);
            if (!currentUser?.id) return;

            // 1. Fetch Participant Records (My entries)
            const { data: participants, error: partError } = await supabase
                .from('league_participants')
                .select('*')
                .eq('user_id', currentUser.id);

            if (partError) {
                console.error("Error fetching participants:", partError);
                return;
            }

            if (!participants || participants.length === 0) {
                setMyLeagues([]);
                return;
            }

            // 2. Fetch League Details manually using league_code (not league_id)
            const leagueCodes = participants
                .map(p => p.league_code)
                .filter(code => code !== undefined && code !== null);

            if (leagueCodes.length === 0) {
                // No leagues to fetch
                console.log('No league codes found in participants');
                setMyLeagues(participants.map(p => ({ ...p, league: null })));
                return;
            }

            console.log('Fetching leagues by codes:', leagueCodes);
            const { data: leaguesData, error: leagueError } = await supabase
                .from('leagues')
                .select('*')
                .in('code', leagueCodes);

            if (leagueError) {
                console.error("Error fetching league details:", leagueError);
            }

            console.log('Fetched leagues:', leaguesData?.length || 0);

            // 3. Merge Data by matching code
            const mergedData = participants.map(p => {
                const leagueDetails = leaguesData?.find(l => l.code === p.league_code);
                return {
                    ...p,
                    league: leagueDetails || null
                };
            });

            // 4. Filter out orphan participants (league was deleted but participant record remains)
            const validLeagues = mergedData.filter(p => p.league !== null);
            const orphanParticipants = mergedData.filter(p => p.league === null);

            // Clean up orphan records from DB
            if (orphanParticipants.length > 0) {
                console.log('Cleaning up orphan participants:', orphanParticipants.length);
                for (const orphan of orphanParticipants) {
                    await supabase
                        .from('league_participants')
                        .delete()
                        .eq('id', orphan.id);
                }
            }

            console.log("Valid leagues loaded:", validLeagues.length);
            setMyLeagues(validLeagues);

        } catch (error) {
            console.error('Error fetching leagues', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnterLeague = async (participantRecord: any) => {
        // Debug log
        console.log('Entering league with record:', JSON.stringify(participantRecord, null, 2));

        // Try multiple paths to find the league code or ID
        const leagueCode = participantRecord.league_code || participantRecord.league?.code;
        const leagueId = participantRecord.league_id || participantRecord.league?.id;

        if (!leagueCode && !leagueId) {
            console.error('Could not find league code or ID in record:', participantRecord);
            Alert.alert("Error", "Datos de liga corruptos. Por favor, elimina esta liga y crea una nueva.");
            return;
        }

        // Validate league exists - prefer code lookup since that's what we store
        let leagueData = null;
        if (leagueCode) {
            const { data, error } = await supabase
                .from('leagues')
                .select('*')
                .eq('code', leagueCode)
                .single();
            if (!error && data) leagueData = data;
        } else if (leagueId) {
            const { data, error } = await supabase
                .from('leagues')
                .select('*')
                .eq('id', leagueId)
                .single();
            if (!error && data) leagueData = data;
        }

        if (!leagueData) {
            Alert.alert("Liga Inexistente", "Esta liga ya no existe o ha sido eliminada.");
            fetchMyLeagues(); // Refresh list to remove it
            return;
        }

        // Proceed
        setActiveLeague(participantRecord);
        setMyCars(participantRecord.team_cars || []);
        setMyParts(participantRecord.team_parts || []); // Load parts
        setSaldo(participantRecord.budget || 0);

        // Load active bids and check auctions
        fetchMyBids();
        checkAndResolveAuctions(participantRecord);

        setViewMode('garage');
        setGarageTab('cars');
        setMenuVisible(false);
    };

    // Daily Auction Resolution Logic
    const checkAndResolveAuctions = async (currentParticipant: any) => {
        if (!currentParticipant?.league_id) return;

        try {
            const leagueId = currentParticipant.league_id;

            // 1. Get league metadata focusing on resolution time
            const { data: league, error: lError } = await supabase
                .from('leagues')
                .select('last_auction_resolved_at, created_at')
                .eq('id', leagueId)
                .single();

            if (lError) throw lError;

            // 2. Check timing: must be after 20:00 and not resolved today
            const now = new Date();
            const hour = now.getHours();

            // For testing/demo, we can make it more flexible, but user asked for 20:00
            const isAfterResolutionHour = hour >= 20;

            const lastResolved = league.last_auction_resolved_at ? new Date(league.last_auction_resolved_at) : null;
            const today20 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);

            // If already resolved today after 20:00, skip
            if (lastResolved && lastResolved >= today20) {
                console.log('Auctions already resolved for today.');
                return;
            }

            // If not yet 20:00 today, skip
            if (!isAfterResolutionHour) {
                console.log('Auction resolution time (20:00) has not arrived yet.');
                return;
            }

            console.log('RESOLVING AUCTIONS for league:', leagueId);
            setLoading(true);

            // 3. Fetch all bids for this league
            const { data: allBids, error: bError } = await supabase
                .from('market_bids')
                .select('*')
                .eq('league_id', leagueId);

            if (bError) throw bError;
            if (!allBids || allBids.length === 0) {
                // Just update the timestamp to today even if no bids
                await supabase.from('leagues')
                    .update({ last_auction_resolved_at: now.toISOString() })
                    .eq('id', leagueId);
                return;
            }

            // 4. Determine winners for each unique itemId
            const bidsByItem: Record<string, any[]> = {};
            allBids.forEach(b => {
                if (!bidsByItem[b.item_id]) bidsByItem[b.item_id] = [];
                bidsByItem[b.item_id].push(b);
            });

            // 5. Build updates for participants
            const { data: participants, error: pError } = await supabase
                .from('league_participants')
                .select('*')
                .eq('league_id', leagueId);

            if (pError) throw pError;

            const winnersInfo: string[] = [];

            for (const itemId in bidsByItem) {
                const itemBids = bidsByItem[itemId];
                // Sort by amount DESC, then by date ASC (tie-breaker)
                itemBids.sort((a, b) => {
                    if (b.amount !== a.amount) return b.amount - a.amount;
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                });

                const winnerBid = itemBids[0];
                const participant = participants.find(p => p.id === winnerBid.participant_id);

                if (participant && participant.budget >= winnerBid.amount) {
                    // Winner found and has budget
                    const item = winnerBid.item_data;

                    if (winnerBid.item_type === 'car') {
                        const newCars = [...(participant.team_cars || []), item];
                        const newBudget = participant.budget - winnerBid.amount;

                        await supabase.from('league_participants')
                            .update({ team_cars: newCars, budget: newBudget })
                            .eq('id', participant.id);

                        if (participant.user_id === currentUser?.id) {
                            winnersInfo.push(`¡Ganaste la subasta! Comprado ${item.brand} ${item.model} por €${winnerBid.amount.toLocaleString()}.`);
                        }
                    } else if (winnerBid.item_type === 'part') {
                        const newParts = [...(participant.team_parts || []), item];
                        const newBudget = participant.budget - winnerBid.amount;

                        await supabase.from('league_participants')
                            .update({ team_parts: newParts, budget: newBudget })
                            .eq('id', participant.id);

                        if (participant.user_id === currentUser?.id) {
                            winnersInfo.push(`¡Ganaste la subasta! Comprada pieza ${getPartName(item.type)} por €${winnerBid.amount.toLocaleString()}.`);
                        }
                    }
                }
            }

            // 6. Clear bids for today after resolution
            await supabase.from('market_bids').delete().eq('league_id', leagueId);

            // 7. Update last resolved timestamp
            await supabase.from('leagues')
                .update({ last_auction_resolved_at: now.toISOString() })
                .eq('id', leagueId);

            if (winnersInfo.length > 0) {
                Alert.alert("Resultados de Subasta", winnersInfo.join('\n'));
                // Refresh local state if I am a winner
                fetchMyLeagues(); // This will trigger re-entry and update local state
            } else {
                console.log('Auctions resolved. You did not win anything today.');
            }

        } catch (err) {
            console.error('Auction resolution error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLeague = async () => {
        if (!activeLeague) return;

        Alert.alert(
            "Eliminar Liga",
            "¿Estás seguro de que quieres eliminar esta liga? Esta acción borrará la liga y todos sus participantes permanentemente.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            // Delete from 'leagues' table (Cascade should remove participants)
                            const targetLeagueId = activeLeague.league_id || activeLeague.league?.id;
                            if (!targetLeagueId) {
                                Alert.alert("Error", "No se encontró el ID de la liga.");
                                return;
                            }

                            const { error } = await supabase
                                .from('leagues')
                                .delete()
                                .eq('id', targetLeagueId);

                            if (error) throw error;

                            Alert.alert("Éxito", "Liga eliminada correctamente.");
                            setActiveLeague(null);
                            setMyCars([]);
                            setSaldo(0);
                            setMenuVisible(false);
                            fetchMyLeagues(); // Refresh list
                        } catch (e: any) {
                            Alert.alert("Error", e.message || "No se pudo eliminar la liga.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAllLeagues = async () => {
        Alert.alert(
            "NUCLEAR OPTION",
            "¿Borrar TODAS tus ligas y participaciones? Esto no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "BORRAR TODO",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            if (!currentUser?.id) return;

                            // 1. Get all leagues I created or am in
                            // A simpler approach for the user request: Delete my participant records
                            const { error: partError } = await supabase
                                .from('league_participants')
                                .delete()
                                .eq('user_id', currentUser.id);

                            if (partError) throw partError;

                            // 2. Also delete leagues created by me (optional, but requested "delete leagues")
                            const { error: leagueError } = await supabase
                                .from('leagues')
                                .delete()
                                .eq('created_by', currentUser.id);

                            if (leagueError) throw leagueError;

                            Alert.alert("Limpieza Completa", "Todas tus ligas han sido eliminadas.");
                            setMyLeagues([]);
                            setActiveLeague(null);
                            setMyCars([]);
                            setSaldo(0);
                            setViewMode('garage');
                            // Also refresh from DB to ensure sync
                            fetchMyLeagues();

                        } catch (e: any) {
                            Alert.alert("Error", e.message);
                        } finally {
                            setLoading(false);
                            setMenuVisible(false);
                        }
                    }
                }
            ]
        );
    };

    // --- GAME LOGIC ---

    // Get the current "market day" - changes at 20:00 each day
    const getMarketDay = (): string => {
        const now = new Date();
        const hour = now.getHours();
        // If before 20:00, use previous day's date
        if (hour < 20) {
            now.setDate(now.getDate() - 1);
        }
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    // Seeded random number generator for deterministic daily selection
    const seededRandom = (seed: string): () => number => {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return () => {
            hash = (hash * 1103515245 + 12345) & 0x7fffffff;
            return hash / 0x7fffffff;
        };
    };

    // Fisher-Yates shuffle with seeded random
    const seededShuffle = <T,>(array: T[], random: () => number): T[] => {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    };

    // Calculate ADVANCED REAL stats from car data
    const calculateRealStats = (c: any, isUsed: boolean) => {
        const hp = c["Engine HP"] || c.hp || 150;
        const year = c.Year || c.year || 2000;
        const brand = c.Make || c.make || 'Unknown';
        const cylinders = c["Engine Cylinders"] || 4;
        const transmission = c["Transmission Type"] || 'AUTOMATIC';
        const drivetrain = c["Driven_Wheels"] || 'front wheel drive';
        const size = c["Vehicle Size"] || 'Midsize';
        const style = c["Vehicle Style"] || 'Sedan';
        const category = c["Market Category"] || '';
        const cityMpg = c["city mpg"] || 20;
        const highwayMpg = c["highway MPG"] || 25;
        const popularity = c["Popularity"] || 1000;
        const msrp = c["MSRP"] || 30000;

        // --- 1. AC (Acceleration) ---
        // Base on HP-to-Weight estimation
        let acBase = (hp / 800) * 80;

        // Weight penalty based on size and style
        if (size === 'Large') acBase -= 10;
        if (size === 'Compact') acBase += 5;
        if (style.includes('SUV') || style.includes('Wagon')) acBase -= 5;

        // Transmission bonus
        if (transmission === 'DIRECT_DRIVE') acBase += 10; // Electric/CVT instant torque
        if (transmission === 'MANUAL') acBase += 5;

        // Category bonus
        if (category.includes('High-Performance')) acBase += 10;

        const ac = Math.min(99, Math.max(10, Math.floor(20 + acBase)));

        // --- 2. MN (Handling) ---
        // Base on size and drivetrain
        let mnBase = 60;
        if (size === 'Compact') mnBase += 15;
        if (size === 'Large') mnBase -= 10;

        if (drivetrain === 'rear wheel drive') mnBase += 10;
        if (drivetrain === 'front wheel drive') mnBase -= 5;
        if (drivetrain.includes('all wheel drive')) mnBase += 5;

        // Style factor
        if (style.includes('SUV')) mnBase -= 15;
        if (style === 'Convertible' || style === 'Coupe') mnBase += 10;

        // Brand/Category DNA
        if (category.includes('Factory Tuner')) mnBase += 10;
        if (brand === 'Porsche' || brand === 'Lotus' || brand === 'McLaren') mnBase += 15;

        const mn = Math.min(99, Math.max(10, Math.floor(mnBase)));

        // --- 3. TR (Traction) ---
        let trBase = 50;
        if (drivetrain.includes('all wheel drive') || drivetrain.includes('four wheel drive')) trBase += 35;
        else if (drivetrain === 'front wheel drive') trBase += 10;

        if (style.includes('SUV')) trBase += 5;
        if (category.includes('Luxury')) trBase += 5; // Heavier stable cars

        const tr = Math.min(99, Math.max(10, Math.floor(trBase)));

        // --- 4. CN (Consumption) ---
        // Direct map from MPG
        const avgMpg = (cityMpg + highwayMpg) / 2;
        // 10 MPG = very bad (10 stat), 50 MPG = very good (90 stat)
        const cn = Math.min(99, Math.max(5, Math.floor((avgMpg / 50) * 90)));

        // --- 5. ES (Aesthetics) ---
        let esBase = 50;
        // Price/Popularity proxy
        if (msrp > 100000) esBase += 30;
        else if (msrp > 50000) esBase += 15;

        if (popularity > 3000) esBase += 10;

        if (category.includes('Exotic') || category.includes('Luxury')) esBase += 10;
        if (style === 'Convertible') esBase += 5;

        const es = Math.min(99, Math.max(10, Math.floor(esBase)));

        // --- 6. FI (Reliability) ---
        const reliabilityBrands: Record<string, number> = {
            'Toyota': 95, 'Honda': 92, 'Lexus': 98, 'Mazda': 85, 'Subaru': 80,
            'BMW': 65, 'Mercedes-Benz': 70, 'Audi': 68, 'Alfa Romeo': 55, 'Land Rover': 50,
            'Ford': 72, 'Chevrolet': 75, 'Hyundai': 82, 'Kia': 80, 'Volvo': 88
        };
        let fiBase = reliabilityBrands[brand] || 70;

        if (category.includes('High-Performance')) fiBase -= 10; // High maintenance

        let fi = isUsed ? Math.floor(fiBase * (0.6 + Math.random() * 0.3)) : 100;
        fi = Math.min(100, Math.max(5, fi));

        return { ac, mn, tr, cn, es, fi };
    };

    // Fetch cars for the market dealership
    const fetchMarketCars = async (type: 'new' | 'used') => {
        setLoadingMarket(true);
        try {
            const { data: cars, error } = await supabase
                .from('cars')
                .select('*')
                .limit(200); // Fetch more to have variety

            if (error) throw error;

            // Get today's market day and create seeded random
            const marketDay = getMarketDay();
            const seed = `${activeLeague?.id || 'global'}-${marketDay}-${type}`; // Shared seed per league
            const random = seededRandom(seed);

            console.log(`Market day: ${marketDay}, type: ${type}`);

            // Process cars with pricing (using seeded random for used car discounts)
            const processedCars = (cars || [])
                .filter((c: any) => {
                    const year = c.Year || c.year || 2000;
                    if (type === 'new') {
                        return year >= 2006;
                    }
                    return true;
                })
                .map((c: any) => {
                    const hp = c["Engine HP"] || c.hp || c.engine_hp || 150;
                    const year = c.Year || c.year || 2000;
                    const brand = c.Make || c.make || c.brand || 'Unknown';
                    const model = c.Model || c.model || 'Unknown';
                    const msrp = c.MSRP || c.msrp || hp * 800; // Fallback to old heuristic if MSRP is missing

                    // Pricing logic
                    let basePrice = msrp;

                    if (type === 'used') {
                        // Used cars: 40-60% of MSRP (deterministic based on seed)
                        // If older than 2006, maybe an extra discount for age
                        let discountFactor = 1.0;
                        if (year < 2000) discountFactor = 0.4;
                        else if (year < 2006) discountFactor = 0.6;
                        else discountFactor = 0.8;

                        const randomDiscount = 0.8 + random() * 0.2; // 80-100% of the age-based price
                        basePrice = Math.floor(msrp * discountFactor * randomDiscount);
                    }

                    // Round to nearest 100
                    const price = Math.round(basePrice / 100) * 100;
                    // Calculate REAL stats based on FULL car data
                    const calculatedStats = calculateRealStats(c, type === 'used');

                    return {
                        id: c.id,
                        brand,
                        model,
                        year,
                        hp,
                        cylinders: c["Engine Cylinders"],
                        transmission: c["Transmission Type"],
                        drivetrain: c["Driven_Wheels"],
                        style: c["Vehicle Style"],
                        size: c["Vehicle Size"],
                        category: c["Market Category"],
                        cityMpg: c["city mpg"],
                        highwayMpg: c["highway MPG"],
                        popularity: c["Popularity"],
                        msrp: msrp,
                        price,
                        isUsed: type === 'used',
                        image: c.image_url || c.photos?.[0] || 'https://images.unsplash.com/photo-1603584173870-7b299f5892b2?auto=format&fit=crop&q=80',
                        // Calculated real stats
                        dbStats: calculatedStats,
                        rawData: c
                    };
                });

            // Shuffle deterministically based on date and select only 10 cars
            const shuffled = seededShuffle(processedCars, random);
            const dailySelection = shuffled.slice(0, 10);

            // Sort by price
            dailySelection.sort((a, b) => a.price - b.price);

            console.log(`Showing ${dailySelection.length} cars for ${type} market`);
            setMarketCars(dailySelection);
        } catch (error) {
            console.error('Error fetching market cars:', error);
            Alert.alert('Error', 'No se pudieron cargar los coches del mercado.');
        } finally {
            setLoadingMarket(false);
        }
    };

    // Fetch parts for the tuning market
    const fetchMarketParts = async () => {
        setLoadingParts(true);
        try {
            // Get today's market day for deterministic selection
            const marketDay = getMarketDay();
            const seed = `${activeLeague?.id || 'global'}-${marketDay}-parts`;
            const random = seededRandom(seed);

            console.log(`Generating parts for market day: ${marketDay}`);

            const partTypes: PartType[] = ['tires', 'turbo', 'intercooler', 'suspension', 'transmission'];
            const qualities: PartQuality[] = ['low', 'mid', 'high'];

            // Price mapping by TYPE and QUALITY
            const prices: Record<PartType, Record<PartQuality, number>> = {
                turbo: { low: 12000, mid: 28000, high: 65000 },
                transmission: { low: 10000, mid: 25000, high: 55000 },
                suspension: { low: 6000, mid: 18000, high: 45000 },
                tires: { low: 4000, mid: 12000, high: 35000 },
                intercooler: { low: 3000, mid: 10000, high: 25000 }
            };

            const partNames = {
                tires: { low: 'Neumáticos Sport', mid: 'Neumáticos Semi-Slick', high: 'Neumáticos Racing Slick' },
                turbo: { low: 'Turbo TD04', mid: 'Turbo GT28', high: 'Turbo GT35R' },
                intercooler: { low: 'Intercooler Frontal', mid: 'Intercooler FMIC', high: 'Intercooler Racing' },
                suspension: { low: 'Muelles Rebajados', mid: 'Coilovers Street', high: 'Coilovers Racing' },
                transmission: { low: 'Kit Embrague Sport', mid: 'Caja Corta', high: 'Secuencial Racing' }
            };

            // Bonus stats by type and quality
            const getBonusStats = (type: PartType, quality: PartQuality): Partial<CarStats> => {
                const mult = quality === 'high' ? 3 : quality === 'mid' ? 2 : 1;
                switch (type) {
                    case 'tires': return { mn: 5 * mult, cn: -2 * mult };
                    case 'turbo': return { ac: 10 * mult, fi: -5 * mult };
                    case 'intercooler': return { fi: 8 * mult };
                    case 'suspension': return { mn: 5 * mult, es: 3 * mult };
                    case 'transmission': return { ac: 5 * mult, mn: 2 * mult };
                    default: return {};
                }
            };

            // Generate all possible parts pool
            const allPossibleParts: CarPart[] = [];
            partTypes.forEach(type => {
                qualities.forEach(quality => {
                    allPossibleParts.push({
                        id: `part-${type}-${quality}-${marketDay}`,
                        type,
                        quality,
                        price: prices[type][quality],
                        name: partNames[type][quality],
                        bonusStats: getBonusStats(type, quality)
                    });
                });
            });

            // Filter into pools by quality
            const lowPool = allPossibleParts.filter(p => p.quality === 'low');
            const midPool = allPossibleParts.filter(p => p.quality === 'mid');
            const highPool = allPossibleParts.filter(p => p.quality === 'high');

            // Determine distribution
            // 5-6 low, 2-3 mid, 1-2 high (total 10)
            const numLow = 5 + Math.floor(random() * 2); // 5 or 6
            const numHigh = 1 + Math.floor(random() * 2); // 1 or 2
            const numMid = 10 - numLow - numHigh; // Guaranteed to be 2 or 3

            const selectedParts: CarPart[] = [
                ...seededShuffle(lowPool, random).slice(0, numLow),
                ...seededShuffle(midPool, random).slice(0, numMid),
                ...seededShuffle(highPool, random).slice(0, numHigh)
            ];

            // Final sort for UI
            const dailyParts = selectedParts.sort((a, b) => {
                if (a.type !== b.type) return a.type.localeCompare(b.type);
                return a.price - b.price;
            });

            console.log(`Showing ${dailyParts.length} parts (L:${numLow}, M:${numMid}, H:${numHigh})`);
            setMarketParts(dailyParts);
        } catch (error) {
            console.error('Error generating market parts:', error);
            Alert.alert('Error', 'No se pudieron cargar las piezas.');
        } finally {
            setLoadingParts(false);
        }
    };

    // Handle part purchase
    const handleBuyPart = async (part: CarPart & { price: number; name: string }) => {
        // Check budget
        if (saldo < part.price) {
            Alert.alert(
                "Saldo Insuficiente",
                `Necesitas €${part.price.toLocaleString()} pero solo tienes €${saldo.toLocaleString()}.`,
                [{ text: "Ok" }]
            );
            return;
        }

        // Confirm purchase
        Alert.alert(
            "Confirmar Compra",
            `¿Comprar ${part.name} (${part.quality.toUpperCase()}) por €${part.price.toLocaleString()}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Comprar",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            // Add part to inventory with all required fields
                            const newPart: CarPart = {
                                id: `${part.id}-${Date.now()}`, // Unique ID
                                type: part.type,
                                quality: part.quality,
                                name: part.name,
                                bonusStats: part.bonusStats,
                                price: part.price
                            };

                            const updatedParts = [...myParts, newPart];
                            const newBudget = saldo - part.price;

                            // Update Supabase
                            const { error } = await supabase
                                .from('league_participants')
                                .update({
                                    team_parts: updatedParts,
                                    budget: newBudget
                                })
                                .eq('id', activeLeague?.id);

                            if (error) throw error;

                            // Update local state
                            setMyParts(updatedParts);
                            setSaldo(newBudget);

                            Alert.alert(
                                "¡Compra Exitosa!",
                                `Has comprado ${part.name}. La pieza está en tu inventario.`
                            );
                        } catch (e) {
                            console.error('Part purchase error:', e);
                            Alert.alert('Error', 'No se pudo completar la compra.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Handle car purchase
    const handleBuyCar = async (marketCar: any) => {
        // Check if user already has a car
        if (myCars.length > 0) {
            Alert.alert(
                "Garaje Lleno",
                "Solo puedes tener un coche. Para comprar este, primero vende el que tienes en el garaje.",
                [{ text: "Entendido" }]
            );
            return;
        }

        // Check budget
        if (saldo < marketCar.price) {
            Alert.alert(
                "Saldo Insuficiente",
                `Necesitas €${marketCar.price.toLocaleString()} pero solo tienes €${saldo.toLocaleString()}.`,
                [{ text: "Ok" }]
            );
            return;
        }

        // Confirm purchase
        Alert.alert(
            "Confirmar Compra",
            `¿Comprar ${marketCar.brand} ${marketCar.model} por €${marketCar.price.toLocaleString()}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Comprar",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            // Create car object for garage
                            const hp = marketCar.hp;

                            // Use calculated stats (already includes used car fi penalty from calculateRealStats)
                            const stats = marketCar.dbStats || { ac: 0, mn: 0, tr: 0, cn: 0, es: 0, fi: 0 };

                            const newCar: Car = {
                                id: marketCar.id,
                                brand: marketCar.brand,
                                model: marketCar.model,
                                year: marketCar.year,
                                hp: hp,
                                cylinders: marketCar.cylinders,
                                transmission: marketCar.transmission,
                                drivetrain: marketCar.drivetrain,
                                style: marketCar.style,
                                size: marketCar.size,
                                category: marketCar.category,
                                cityMpg: marketCar.cityMpg,
                                highwayMpg: marketCar.highwayMpg,
                                popularity: marketCar.popularity,
                                msrp: marketCar.msrp,
                                photos: [marketCar.image],
                                parts: [],
                                mods: [],
                                isStock: !marketCar.isUsed,
                                baseStats: {
                                    ac: stats.ac,
                                    mn: stats.mn,
                                    tr: stats.tr,
                                    cn: stats.cn,
                                    es: stats.es,
                                    fi: stats.fi
                                },
                                stats: { ac: 0, mn: 0, tr: 0, cn: 0, es: 0, fi: 0 }
                            };

                            // Calculate stats
                            newCar.stats = calculateStats(newCar);

                            // Update local state
                            const newBudget = saldo - marketCar.price;
                            const newCars = [newCar];

                            // Get the participant record ID (not league ID)
                            const participantId = activeLeague?.id;
                            console.log('Updating participant ID:', participantId);
                            console.log('Active league object:', JSON.stringify(activeLeague, null, 2));

                            if (!participantId) {
                                throw new Error('No se encontró el ID del participante');
                            }

                            // Update Supabase
                            const { error } = await supabase
                                .from('league_participants')
                                .update({
                                    team_cars: newCars,
                                    budget: newBudget
                                })
                                .eq('id', participantId);

                            if (error) throw error;

                            // Update local state
                            setMyCars(newCars);
                            setSaldo(newBudget);
                            setViewMode('garage');

                            Alert.alert(
                                "¡Compra Exitosa!",
                                `Has comprado un ${marketCar.brand} ${marketCar.model}. ¡Ve al garaje para verlo!`
                            );

                        } catch (error: any) {
                            console.error('Purchase error:', error);
                            Alert.alert('Error', error.message || 'No se pudo completar la compra.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Fetch user's active bids
    const fetchMyBids = async () => {
        if (!activeLeague || !currentUser) return;
        try {
            const { data, error } = await supabase
                .from('market_bids')
                .select('*')
                .eq('league_id', activeLeague.league_id || activeLeague.id)
                .eq('participant_id', activeLeague.id);

            if (error) throw error;

            const formattedBids: MarketBid[] = (data || []).map(b => ({
                itemId: b.item_id,
                itemType: b.item_type,
                amount: b.amount,
                bidAt: b.created_at,
                itemData: b.item_data
            }));

            setMyBids(formattedBids);
        } catch (error) {
            console.error('Error fetching bids:', error);
        }
    };

    // Handle placing a blind bid
    const handlePlaceBid = async (item: any, type: 'car' | 'part', bidAmount: number) => {
        if (!activeLeague || !currentUser) return;

        if (saldo < bidAmount) {
            Alert.alert("Saldo Insuficiente", "No tienes suficiente dinero para esta puja.");
            return;
        }

        setLoading(true);
        try {
            const leagueId = activeLeague.league_id || activeLeague.id;

            const { error } = await supabase
                .from('market_bids')
                .upsert({
                    league_id: leagueId,
                    participant_id: activeLeague.id,
                    item_id: item.id,
                    item_type: type,
                    amount: bidAmount,
                    item_data: item
                }, {
                    onConflict: 'league_id,participant_id,item_id,item_type'
                });

            if (error) throw error;

            Alert.alert("Puja Registrada", `Has pujado €${bidAmount.toLocaleString()} por el ${item.brand || getPartName(item.type)}.`);
            fetchMyBids();
            setPreviewVisible(false);
            setPartModalVisible(false);
        } catch (error: any) {
            console.error('Bid error:', error);
            Alert.alert("Error", error.message || "No se pudo registrar la puja.");
        } finally {
            setLoading(false);
        }
    };

    const generateRandomStarterPack = async (): Promise<{ cars: Car[], budget: number } | null> => {
        try {
            // 1. Fetch random pool of cars from Supabase 'cars' table
            const { data: carsPool, error } = await supabase
                .from('cars')
                .select('*')
                .limit(200);

            if (error) {
                console.error('Supabase fetch error:', error);
                Alert.alert('Error de Conexión', 'No se pudieron descargar los coches de la base de datos.');
                return null;
            }

            if (!carsPool || carsPool.length < 4) {
                console.error('Not enough cars found.');
                Alert.alert('Error', 'No hay suficientes coches en la base de datos.');
                return null;
            }

            // 2. Filter for "Bad" cars (Starter Tier) -> HP < 150
            const allUniqueCars = Array.from(new Map(carsPool.map((item: any) => [item.id, item])).values());

            const tier1Cars = allUniqueCars.filter((c: any) => {
                const hp = c["Engine HP"] || c.hp || c.engine_hp || 999;
                return hp < 150;
            });

            // Tier 2: 150 < HP < 170 (Fallback)
            const tier2Cars = allUniqueCars.filter((c: any) => {
                const hp = c["Engine HP"] || c.hp || c.engine_hp || 999;
                return hp >= 150 && hp < 170;
            });

            // Tier 3: Everything else (Last resort)
            const tier3Cars = allUniqueCars.filter((c: any) => {
                const hp = c["Engine HP"] || c.hp || c.engine_hp || 999;
                return hp >= 170;
            });

            let finalSelection: any[] = [];

            if (tier1Cars.length >= 4) {
                // CASE A: Enough cars < 150HP
                const shuffledT1 = [...tier1Cars];
                for (let i = shuffledT1.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledT1[i], shuffledT1[j]] = [shuffledT1[j], shuffledT1[i]];
                }
                finalSelection = shuffledT1.slice(0, 4);
            } else {
                // CASE B: Not enough < 150HP. Take all of them.
                console.log(`Only found ${tier1Cars.length} bad cars (<150HP). Checking Tier 2 (<170HP).`);
                finalSelection = [...tier1Cars];

                let needed = 4 - finalSelection.length;

                // Fill with Tier 2
                if (tier2Cars.length > 0) {
                    const shuffledT2 = [...tier2Cars];
                    for (let i = shuffledT2.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffledT2[i], shuffledT2[j]] = [shuffledT2[j], shuffledT2[i]];
                    }
                    const takenFromT2 = shuffledT2.slice(0, needed);
                    finalSelection = [...finalSelection, ...takenFromT2];
                }

                // CASE C: Still not enough? Fill with Tier 3 (Any)
                if (finalSelection.length < 4) {
                    needed = 4 - finalSelection.length;
                    console.log(`Still need ${needed} cars. Filling with Tier 3.`);
                    const shuffledT3 = [...tier3Cars];
                    for (let i = shuffledT3.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffledT3[i], shuffledT3[j]] = [shuffledT3[j], shuffledT3[i]];
                    }
                    finalSelection = [...finalSelection, ...shuffledT3.slice(0, needed)];
                }
            }

            // Shuffle the final mixed selection so the "good" cars aren't always at the end
            const shuffledFinal = [...finalSelection];
            for (let i = shuffledFinal.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledFinal[i], shuffledFinal[j]] = [shuffledFinal[j], shuffledFinal[i]];
            }

            const selectedRaw = shuffledFinal.slice(0, 4);

            // 3. Map to Game Car Type
            const starterCars: Car[] = selectedRaw.map((c: any) => {
                const brand = c.Make || c.make || c.brand || 'Unknown';
                const model = c.Model || c.model || 'Unknown';
                const year = c.Year || c.year || 2020;

                const hp = c["Engine HP"] || c.hp || c.engine_hp || 300;
                const image = c.image_url || c.photos?.[0] || 'https://images.unsplash.com/photo-1603584173870-7b299f5892b2?auto=format&fit=crop&q=80';

                return {
                    id: c.id,
                    brand,
                    model,
                    year,
                    hp,
                    photos: [image],
                    parts: [],
                    mods: [],
                    isStock: true,
                    baseStats: {
                        // Generate pseudo-stats based on HP/Year if possible
                        ac: Math.min(100, Math.floor((hp || 200) / 6)),
                        mn: 50 + Math.floor(Math.random() * 40),
                        tr: 40 + Math.floor(Math.random() * 40),
                        cn: 40 + Math.floor(Math.random() * 40),
                        es: 50 + Math.floor(Math.random() * 40),
                        fi: 70 + Math.floor(Math.random() * 20)
                    },
                    stats: { ac: 0, mn: 0, tr: 0, cn: 0, es: 0, fi: 0 } // Will be filled by calc
                };
            });

            // Calculate initial dynamic stats
            starterCars.forEach(c => {
                c.stats = calculateStats(c);
            });

            // 4. Generate Random Budget (60k - 70k)
            const randomBudget = 60000 + Math.floor(Math.random() * 10000);

            // NEW: Return empty cars array - users must buy from market
            return { cars: [], budget: randomBudget };

        } catch (error) {
            console.error('Starter pack error:', error);
            return null;
        }
    };

    const handleCreateLeague = async () => {
        if (!newLeagueName) return;
        setLoading(true);
        try {
            console.log('Creating league...');
            // 1. Create League
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { data: league, error } = await supabase
                .from('leagues')
                .insert({
                    name: newLeagueName,
                    code: code,
                    created_by: currentUser?.id
                })
                .select()
                .single();

            if (error) {
                console.error('League create error', error);
                throw error;
            }

            // 2. Generate Starter Pack
            const pack = await generateRandomStarterPack();
            if (!pack) throw new Error("Failed to generate pack");

            // 3. Add Participant
            const { data: insertedParticipant, error: partError } = await supabase
                .from('league_participants')
                .insert({
                    user_id: currentUser?.id,
                    league_code: code,
                    budget: pack.budget,
                    team_cars: pack.cars
                })
                .select()
                .single();

            if (partError) {
                console.error('Participant insert error', partError);
                throw partError;
            }

            // Construct the full participant object with league data
            const newParticipant = {
                ...insertedParticipant,
                league: league
            };

            // Success
            setJoinModalVisible(false);
            setNewLeagueName('');

            // AUTO ENTER - Now with proper ID
            console.log('Entering league with ID:', newParticipant.id);
            handleEnterLeague(newParticipant);

            // Fetch background update
            fetchMyLeagues();
            Alert.alert('¡Liga Creada!', `Tu código es: ${code}`);

        } catch (e) {
            Alert.alert('Error', 'No se pudo crear la liga.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinLeague = async () => {
        if (!joinCode) return;
        setLoading(true);
        try {
            // 1. Validate Code
            // Check if already in
            const existing = myLeagues.find(l => l.league_code === joinCode.toUpperCase());
            if (existing) {
                Alert.alert('Info', 'Ya estás en esta liga.');
                setLoading(false);
                return;
            }

            // 2. Verify league exists
            const { data: leagueData, error: leagueError } = await supabase
                .from('leagues')
                .select('*')
                .eq('code', joinCode.toUpperCase())
                .single();

            if (leagueError || !leagueData) {
                Alert.alert('Error', 'Código de liga inválido.');
                setLoading(false);
                return;
            }

            // 3. Generate Starter Pack (budget only now)
            const pack = await generateRandomStarterPack();
            if (!pack) throw new Error("Failed to generate pack");

            // 4. Insert Participant and get the ID
            const { data: insertedParticipant, error } = await supabase
                .from('league_participants')
                .insert({
                    user_id: currentUser?.id,
                    league_code: joinCode.toUpperCase(),
                    budget: pack.budget,
                    team_cars: pack.cars
                })
                .select()
                .single();

            if (error) throw error;

            // 5. Construct full participant with league data
            const newParticipant = {
                ...insertedParticipant,
                league: leagueData
            };

            setJoinModalVisible(false);
            setJoinCode('');

            // AUTO ENTER with proper ID
            console.log('Joining league with ID:', newParticipant.id);
            handleEnterLeague(newParticipant);

            fetchMyLeagues();
            Alert.alert('¡Bienvenido!', 'Has entrado a la liga. ¡Ve al mercado a comprar tu coche!');

        } catch (e) {
            Alert.alert('Error', 'Código inválido o error de conexión.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- ACTIONS ---

    const handleCarSelect = (car: Car) => {
        setSelectedCar({ ...car });
        setEditorVisible(true);
    };

    // --- INVENTORY ACTIONS ---

    // Equip: Move from myParts -> selectedCar.parts
    const handleEquipPart = (partToEquip: CarPart) => {
        if (!selectedCar) return;

        // 1. Check if slot occupied
        const existingPart = selectedCar.parts.find(p => p.type === partToEquip.type);
        let updatedPartsInventory = myParts.filter(p => p.id !== partToEquip.id);

        // 2. If occupied, unequip current part to inventory
        if (existingPart) {
            updatedPartsInventory = [...updatedPartsInventory, existingPart];
        }

        // 3. Equip new part
        const updatedCarParts = [
            ...selectedCar.parts.filter(p => p.type !== partToEquip.type),
            partToEquip
        ];

        // 4. Update Stats
        const newStats = calculateStats({ ...selectedCar, parts: updatedCarParts });

        // 5. Update State
        setMyParts(updatedPartsInventory);

        setSelectedCar({
            ...selectedCar,
            parts: updatedCarParts,
            stats: newStats,
            isStock: false
        });
    };

    const handleRemovePart = (partToRemove: CarPart) => {
        if (!selectedCar) return;

        // 1. Move to Inventory
        const updatedPartsInventory = [...myParts, partToRemove];

        // 2. Remove from Car
        const updatedCarParts = selectedCar.parts.filter(p => p.id !== partToRemove.id);
        const newStats = calculateStats({ ...selectedCar, parts: updatedCarParts });

        setMyParts(updatedPartsInventory);
        setSelectedCar({
            ...selectedCar,
            parts: updatedCarParts,
            stats: newStats,
            isStock: updatedCarParts.length === 0
        });
    };

    // Calculate installation labor cost based on equipped parts quality
    const calculateLaborCost = (car: Car): number => {
        if (!car.parts || car.parts.length === 0) return 0;

        let totalCost = 0;
        car.parts.forEach(part => {
            // Labor cost varies by quality
            switch (part.quality) {
                case 'high':
                    totalCost += 8000; // Premium quality = high labor cost
                    break;
                case 'mid':
                    totalCost += 4000; // Mid quality = medium labor
                    break;
                case 'low':
                    totalCost += 2000; // Low quality = cheap labor
                    break;
            }
        });
        return totalCost;
    };

    const handleInstallMods = async () => {
        if (!selectedCar || !activeLeague) return;

        const laborCost = calculateLaborCost(selectedCar);

        // Check if user has enough money
        if (saldo < laborCost) {
            Alert.alert(
                "Saldo Insuficiente",
                `La mano de obra cuesta €${laborCost.toLocaleString()} pero solo tienes €${saldo.toLocaleString()}.`,
                [{ text: "Ok" }]
            );
            return;
        }

        // Confirm installation
        Alert.alert(
            "Confirmar Instalación",
            `El coste de mano de obra es €${laborCost.toLocaleString()}.\n\n¿Instalar las modificaciones?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Instalar",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            // Update local state
                            const updatedList = myCars.map(c => c.id === selectedCar.id ? selectedCar : c);
                            const newBudget = saldo - laborCost;

                            // Persist to Supabase
                            const { error } = await supabase
                                .from('league_participants')
                                .update({
                                    team_cars: updatedList,
                                    team_parts: myParts,
                                    budget: newBudget
                                })
                                .eq('id', activeLeague.id);

                            if (error) throw error;

                            setMyCars(updatedList);
                            setSaldo(newBudget);

                            Alert.alert(
                                '¡Instalación Completa!',
                                `Has pagado €${laborCost.toLocaleString()} de mano de obra. Tus modificaciones están listas.`
                            );
                            setEditorVisible(false);
                        } catch (e) {
                            Alert.alert('Error', 'No se pudieron instalar las modificaciones.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleSellCar = async () => {
        if (!selectedCar || !activeLeague) return;

        // Calculate sale price (50% of HP-based new car value)
        const hp = selectedCar.hp || 150;
        const baseValue = hp * 800;
        const salePrice = Math.round((baseValue * 0.5) / 1000) * 1000; // 50% value, rounded to 1000

        Alert.alert(
            "Vender Coche",
            `¿Vender ${selectedCar.brand} ${selectedCar.model} por €${salePrice.toLocaleString()}?\n\nLas piezas equipadas se devolverán a tu inventario.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Vender",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            // Move equipped parts back to inventory
                            const partsToReturn = selectedCar.parts || [];
                            const updatedInventory = [...myParts, ...partsToReturn];

                            // Remove car from list
                            const updatedCars = myCars.filter(c => c.id !== selectedCar.id);
                            const newBudget = saldo + salePrice;

                            // Update Supabase
                            const { error } = await supabase
                                .from('league_participants')
                                .update({
                                    team_cars: updatedCars,
                                    team_parts: updatedInventory,
                                    budget: newBudget
                                })
                                .eq('id', activeLeague.id);

                            if (error) throw error;

                            // Update local state
                            setMyCars(updatedCars);
                            setMyParts(updatedInventory);
                            setSaldo(newBudget);
                            setEditorVisible(false);
                            setSelectedCar(null);

                            Alert.alert(
                                "¡Vendido!",
                                `Has vendido tu ${selectedCar.brand} ${selectedCar.model} por €${salePrice.toLocaleString()}.\n\nAhora puedes comprar un nuevo coche en el mercado.`
                            );
                        } catch (e) {
                            console.error('Sell error:', e);
                            Alert.alert('Error', 'No se pudo vender el coche.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const getPartStats = (type: PartType, quality: PartQuality): Partial<CarStats> => {
        const mult = quality === 'high' ? 3 : quality === 'mid' ? 2 : 1;
        switch (type) {
            case 'tires': return { mn: 5 * mult, cn: -2 * mult };
            case 'turbo': return { ac: 10 * mult, fi: -5 * mult };
            case 'intercooler': return { fi: 8 * mult };
            case 'suspension': return { mn: 5 * mult, es: 3 * mult };
            case 'transmission': return { ac: 5 * mult, mn: 2 * mult };
            default: return {};
        }
    };





    // --- RENDERS ---

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
            {renderJoinModal()}
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
                            <Button title={joinCode || "Introducir Código"} variant="outline" onPress={() => Alert.prompt('Código', '', text => setJoinCode(text))} />
                            <Button title="Unirse" onPress={handleJoinLeague} style={{ marginTop: 10 }} />
                        </View>
                    ) : (
                        <View style={styles.inputContainer}>
                            <Text style={{ color: activeTheme.colors.textMuted }}>Nombre de la liga:</Text>
                            <Button title={newLeagueName || "Introducir Nombre"} variant="outline" onPress={() => Alert.prompt('Nombre', '', text => setNewLeagueName(text))} />
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

    const renderLeagueList = () => (
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

    const renderCarCard = ({ item }: { item: Car }) => {
        const eventScore = calculateEventScore(item, currentEvent.type as any);
        return (
            <TouchableOpacity activeOpacity={0.9} onPress={() => handleCarSelect(item)}>
                <LinearGradient colors={[activeTheme.colors.surface, activeTheme.colors.surfaceVariant]} style={styles.card}>
                    <Image source={{ uri: item.photos[0] }} style={styles.cardImage} resizeMode="cover" />
                    {item.isStock && (
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
                        <Image source={{ uri: selectedCar.photos[0] }} style={styles.editorImage} />
                        <Text style={[styles.editorTitle, { color: activeTheme.colors.text }]}>{selectedCar.brand} {selectedCar.model}</Text>

                        {/* Technical Info Panel (Garage) */}
                        <View style={styles.statsPanel}>
                            <Text style={{ color: activeTheme.colors.textMuted, fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
                                FICHA TÉCNICA (DB)
                            </Text>
                            <View style={{ gap: 8 }}>
                                <TechnicalRow label="Cilindros" value={selectedCar.cylinders || 'N/A'} />
                                <TechnicalRow label="Transmisión" value={selectedCar.transmission || 'N/A'} />
                                <TechnicalRow label="Tracción" value={selectedCar.drivetrain || 'N/A'} />
                                <TechnicalRow label="Categoría" value={selectedCar.category || 'Standard'} />
                                <TechnicalRow label="Estilo" value={selectedCar.style || 'N/A'} />
                                <TechnicalRow label="Tamaño" value={selectedCar.size || 'N/A'} />
                                <TechnicalRow label="City MPG" value={selectedCar.cityMpg || 'N/A'} />
                                <TechnicalRow label="Highway MPG" value={selectedCar.highwayMpg || 'N/A'} />
                            </View>
                        </View>

                        <View style={[styles.statsPanel, { marginTop: 16 }]}>
                            <Text style={{ color: activeTheme.colors.textMuted, fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
                                ESPECIFICACIONES (DINÁMICAS)
                            </Text>
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

                        <Text style={[styles.sectionTitle, { color: activeTheme.colors.textMuted }]}>EQUIPAMIENTO</Text>

                        <View style={styles.partsGrid}>
                            {partTypes.map(type => {
                                const equippedPart = selectedCar.parts.find(p => p.type === type);
                                const availableParts = myParts.filter(p => p.type === type);

                                return (
                                    <View key={type} style={{ marginBottom: 16 }}>
                                        <Text style={[styles.partCategory, { color: activeTheme.colors.text }]}>{type.toUpperCase()}</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>

                                            {/* EQUIPPED SLOT */}
                                            {equippedPart ? (
                                                <View style={{ position: 'relative' }}>
                                                    <PartItem
                                                        type={type}
                                                        quality={equippedPart.quality}
                                                        isEquipped={true}
                                                        onPress={() => { }} // No action on click
                                                    />
                                                    <TouchableOpacity
                                                        onPress={() => handleRemovePart(equippedPart)}
                                                        style={styles.removeBtnAbs}
                                                    >
                                                        <Ionicons name="close" size={12} color="#FFF" />
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <View style={styles.emptySlot}>
                                                    <Text style={{ color: activeTheme.colors.textMuted, fontSize: 10 }}>VACÍO</Text>
                                                </View>
                                            )}

                                            {/* DIVIDER IF AVAILABLE PARTS EXIST */}
                                            {availableParts.length > 0 && <View style={styles.vertDivider} />}

                                            {/* AVAILABLE INVENTORY */}
                                            {availableParts.map(p => (
                                                <PartItem
                                                    key={p.id}
                                                    type={type}
                                                    quality={p.quality}
                                                    isEquipped={false}
                                                    onPress={() => handleEquipPart(p)}
                                                />
                                            ))}

                                            {availableParts.length === 0 && !equippedPart && (
                                                <Text style={{ color: activeTheme.colors.textMuted, fontSize: 10, alignSelf: 'center', fontStyle: 'italic' }}>
                                                    Sin piezas
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* INSTALL MODIFICATIONS BUTTON */}
                        {selectedCar.parts.length > 0 && (
                            <TouchableOpacity
                                onPress={handleInstallMods}
                                style={{
                                    backgroundColor: activeTheme.colors.primary,
                                    padding: 16,
                                    borderRadius: 12,
                                    marginTop: 24,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8
                                }}
                            >
                                <Ionicons name="build-outline" size={24} color="#FFF" />
                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                                    INSTALAR (€{calculateLaborCost(selectedCar) / 1000}k mano de obra)
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Separator */}
                        <View style={{
                            height: 1,
                            backgroundColor: activeTheme.colors.textMuted + '40',
                            marginVertical: 20
                        }} />

                        {/* SELL CAR BUTTON */}
                        <TouchableOpacity
                            onPress={handleSellCar}
                            style={{
                                backgroundColor: activeTheme.colors.error,
                                padding: 16,
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8
                            }}
                        >
                            <Ionicons name="trash-outline" size={24} color="#FFF" />
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                                VENDER (€{selectedCar ? Math.round(((selectedCar.hp || 150) * 800 * 0.5) / 1000) : 0}k)
                            </Text>
                        </TouchableOpacity>

                        <View style={{ height: 100 }} />
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    // CAR PREVIEW MODAL (Market)
    const renderCarPreview = () => {
        if (!previewCar) return null;

        const dbStats = previewCar.dbStats || { ac: 0, mn: 0, tr: 0, cn: 0, es: 0, fi: 0 };
        const canAfford = saldo >= previewCar.price;
        const hasCar = myCars.length > 0;

        return (
            <Modal animationType="slide" visible={previewVisible} onRequestClose={() => setPreviewVisible(false)}>
                <View style={[styles.editorContainer, { backgroundColor: activeTheme.colors.background }]}>
                    <Header title={previewCar.isUsed ? "COCHE USADO" : "COCHE NUEVO"} showBack onBack={() => setPreviewVisible(false)} />
                    <ScrollView contentContainerStyle={styles.editorContent}>
                        <Image source={{ uri: previewCar.image }} style={styles.editorImage} />

                        {/* Car Info */}
                        <Text style={[styles.editorTitle, { color: activeTheme.colors.text }]}>
                            {previewCar.brand} {previewCar.model}
                        </Text>
                        <Text style={{ color: activeTheme.colors.textMuted, textAlign: 'center', marginBottom: 16 }}>
                            {previewCar.year} • {previewCar.hp} HP
                        </Text>

                        {/* Price Badge */}
                        <View style={{
                            backgroundColor: canAfford ? activeTheme.colors.success + '20' : activeTheme.colors.error + '20',
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            borderRadius: 20,
                            alignSelf: 'center',
                            marginBottom: 20
                        }}>
                            <Text style={{
                                color: canAfford ? activeTheme.colors.success : activeTheme.colors.error,
                                fontWeight: 'bold',
                                fontSize: 20
                            }}>
                                €{(previewCar.price / 1000).toFixed(0)}k
                            </Text>
                        </View>

                        {/* Technical Info Panel */}
                        <View style={styles.statsPanel}>
                            <Text style={{ color: activeTheme.colors.textMuted, fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
                                FICHA TÉCNICA (DB)
                            </Text>
                            <View style={{ gap: 8 }}>
                                <TechnicalRow label="Cilindros" value={previewCar.cylinders || 'N/A'} />
                                <TechnicalRow label="Transmisión" value={previewCar.transmission || 'N/A'} />
                                <TechnicalRow label="Tracción" value={previewCar.drivetrain || 'N/A'} />
                                <TechnicalRow label="Categoría" value={previewCar.category || 'Standard'} />
                                <TechnicalRow label="Estilo" value={previewCar.style || 'N/A'} />
                                <TechnicalRow label="Tamaño" value={previewCar.size || 'N/A'} />
                                <TechnicalRow label="City MPG" value={previewCar.cityMpg || 'N/A'} />
                                <TechnicalRow label="Highway MPG" value={previewCar.highwayMpg || 'N/A'} />
                            </View>
                        </View>

                        {/* Stats Panel */}
                        <View style={[styles.statsPanel, { marginTop: 16 }]}>
                            <Text style={{ color: activeTheme.colors.textMuted, fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
                                ESPECIFICACIONES
                            </Text>
                            <StatBar label="AC" value={dbStats.ac} baseValue={dbStats.ac} color="#FF3B30" />
                            <StatBar label="MN" value={dbStats.mn} baseValue={dbStats.mn} color="#007AFF" />
                            <StatBar label="TR" value={dbStats.tr} baseValue={dbStats.tr} color="#FF9500" />
                            <StatBar label="FI" value={previewCar.isUsed ? Math.round(dbStats.fi * 0.8) : dbStats.fi} baseValue={dbStats.fi} color="#34C759" />
                            <StatBar label="CN" value={dbStats.cn} baseValue={dbStats.cn} color="#5856D6" />
                            <StatBar label="ES" value={dbStats.es} baseValue={dbStats.es} color="#AF52DE" />
                        </View>

                        {/* Warnings */}
                        {hasCar && (
                            <View style={{
                                backgroundColor: '#FFB80020',
                                padding: 12,
                                borderRadius: 8,
                                marginTop: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                <Ionicons name="warning" size={20} color="#FFB800" />
                                <Text style={{ color: '#FFB800', flex: 1, fontSize: 12 }}>
                                    Ya tienes un coche. Debes venderlo antes de comprar otro.
                                </Text>
                            </View>
                        )}

                        {!canAfford && (
                            <View style={{
                                backgroundColor: activeTheme.colors.error + '20',
                                padding: 12,
                                borderRadius: 8,
                                marginTop: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                <Ionicons name="wallet" size={20} color={activeTheme.colors.error} />
                                <Text style={{ color: activeTheme.colors.error, flex: 1, fontSize: 12 }}>
                                    Saldo insuficiente. Tienes €{(saldo / 1000).toFixed(0)}k
                                </Text>
                            </View>
                        )}

                        {/* Bidding UI */}
                        <View style={[styles.statsPanel, { marginTop: 16, borderTopWidth: 2, borderTopColor: activeTheme.colors.primary }]}>
                            <Text style={{ color: activeTheme.colors.text, fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>
                                TU PUJA A CIEGAS
                            </Text>
                            <Text style={{ color: activeTheme.colors.textMuted, fontSize: 12, marginBottom: 8 }}>
                                El ganador se decidirá a las 20:00. Introduce tu oferta:
                            </Text>

                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                marginBottom: 16
                            }}>
                                <Text style={{ color: activeTheme.colors.success, fontSize: 18, fontWeight: 'bold' }}>€</Text>
                                <TextInput
                                    style={{
                                        flex: 1,
                                        color: '#FFF',
                                        fontSize: 20,
                                        fontWeight: 'bold',
                                        padding: 12
                                    }}
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
                                        Alert.alert("Puja Inválida", `La puja mínima debe ser el precio base (€${previewCar.price.toLocaleString()})`);
                                        return;
                                    }
                                    handlePlaceBid(previewCar, 'car', amount);
                                }}
                                disabled={hasCar}
                                style={{
                                    backgroundColor: (!hasCar) ? activeTheme.colors.primary : activeTheme.colors.textMuted,
                                    padding: 16,
                                    borderRadius: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8
                                }}
                            >
                                <Ionicons name="megaphone-outline" size={24} color="#FFF" />
                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                                    {hasCar ? 'VENDE TU COCHE PRIMERO' : `PUJAR POR ESTE COCHE`}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: 100 }} />
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    const renderMarketPartPreview = () => {
        if (!previewCar || previewCar.brand) return null;
        const part = previewCar;

        return (
            <Modal animationType="slide" visible={partModalVisible} onRequestClose={() => setPartModalVisible(false)}>
                <View style={[styles.editorContainer, { backgroundColor: activeTheme.colors.background }]}>
                    <Header title="MEJORA DE RENDIMIENTO" showBack onBack={() => setPartModalVisible(false)} />
                    <ScrollView contentContainerStyle={styles.editorContent}>
                        <View style={{ alignItems: 'center', marginVertical: 40 }}>
                            <Ionicons
                                name={
                                    part.type === 'turbo' ? 'flash' :
                                        part.type === 'tires' ? 'ellipse' :
                                            part.type === 'suspension' ? 'git-merge' : 'cog'
                                }
                                size={120}
                                color={part.quality === 'high' ? '#FFD700' : part.quality === 'mid' ? '#007AFF' : '#CD7F32'}
                            />
                        </View>

                        <Text style={[styles.editorTitle, { color: activeTheme.colors.text }]}>
                            {getPartName(part.type)} {part.quality.toUpperCase()}
                        </Text>

                        <View style={styles.statsPanel}>
                            <Text style={{ color: activeTheme.colors.textMuted, fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
                                BONIFICACIONES
                            </Text>
                            {Object.entries(part.bonusStats || {}).map(([stat, val]: [string, any]) => (
                                <View key={stat} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ color: activeTheme.colors.text, fontWeight: 'bold' }}>{stat.toUpperCase()}</Text>
                                    <Text style={{ color: activeTheme.colors.success }}>+{val}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={[styles.statsPanel, { marginTop: 16, borderTopWidth: 2, borderTopColor: activeTheme.colors.primary }]}>
                            <Text style={{ color: activeTheme.colors.text, fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>
                                TU PUJA POR ESTA PIEZA
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 16, marginBottom: 16 }}>
                                <Text style={{ color: activeTheme.colors.success, fontSize: 18, fontWeight: 'bold' }}>€</Text>
                                <TextInput
                                    style={{ flex: 1, color: '#FFF', fontSize: 20, fontWeight: 'bold', padding: 12 }}
                                    keyboardType="numeric"
                                    value={bidAmount}
                                    onChangeText={setBidAmount}
                                    placeholder={part.price?.toString()}
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                />
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    const amount = parseInt(bidAmount);
                                    if (isNaN(amount) || amount < part.price) {
                                        Alert.alert("Puja Inválida", `La puja mínima es €${part.price?.toLocaleString()}`);
                                        return;
                                    }
                                    handlePlaceBid(part, 'part', amount);
                                }}
                                style={{ backgroundColor: activeTheme.colors.primary, padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                <Ionicons name="megaphone-outline" size={24} color="#FFF" />
                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>PUJAR POR ESTA PIEZA</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ height: 100 }} />
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    const renderMyBidsSection = () => {
        if (myBids.length === 0) return null;
        return (
            <View style={{ marginBottom: 20 }}>
                <Text style={{ color: activeTheme.colors.text, fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>
                    MIS PUJAS ACTIVAS ({myBids.length})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {myBids.map(bid => (
                        <View key={bid.itemId} style={{ backgroundColor: activeTheme.colors.surface, padding: 12, borderRadius: 12, marginRight: 10, minWidth: 140, borderWidth: 1, borderColor: activeTheme.colors.primary + '40' }}>
                            <Text style={{ color: activeTheme.colors.text, fontSize: 10, fontWeight: 'bold' }}>
                                {bid.itemType === 'car' ? `${bid.itemData.brand} ${bid.itemData.model}` : getPartName(bid.itemData.type)}
                            </Text>
                            <Text style={{ color: activeTheme.colors.success, fontWeight: 'bold', fontSize: 14, marginTop: 4 }}>
                                €{bid.amount.toLocaleString()}
                            </Text>
                            <TouchableOpacity onPress={() => { setPreviewCar(bid.itemData); setBidAmount(bid.amount.toString()); if (bid.itemType === 'car') { setPreviewVisible(true); } else { setPartModalVisible(true); } }} style={{ marginTop: 8 }}>
                                <Text style={{ color: activeTheme.colors.primary, fontSize: 10, fontWeight: 'bold' }}>EDITAR PUJA</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderMenu = () => {
        console.log("Rendering Menu, visible:", menuVisible);
        return (
            <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => { console.log("Overlay Pressed"); setMenuVisible(false); }}>
                    <View style={[styles.menuContainer, { backgroundColor: activeTheme.colors.surface }]}>
                        {activeLeague ? (
                            <>
                                <TouchableOpacity style={styles.menuItem} onPress={() => { setViewMode('garage'); setMenuVisible(false); }}>
                                    <Ionicons name="car-sport-outline" size={24} color={activeTheme.colors.text} />
                                    <Text style={[styles.menuText, { color: activeTheme.colors.text }]}>MI GARAJE</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.menuItem} onPress={() => { setViewMode('market'); setMarketTab('new'); fetchMarketCars('new'); setMenuVisible(false); }}>
                                    <Ionicons name="storefront-outline" size={24} color={activeTheme.colors.text} />
                                    <Text style={[styles.menuText, { color: activeTheme.colors.text }]}>CONCESIONARIO</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.menuItem} onPress={() => { setViewMode('tuning'); setMenuVisible(false); }}>
                                    <Ionicons name="construct-outline" size={24} color={activeTheme.colors.text} />
                                    <Text style={[styles.menuText, { color: activeTheme.colors.text }]}>TUNNING</Text>
                                </TouchableOpacity>

                                <View style={styles.divider} />

                                <View style={{ paddingVertical: 10, paddingHorizontal: 16 }}>
                                    <Text style={{ color: activeTheme.colors.textMuted, fontSize: 12, fontWeight: 'bold' }}>AJUSTES</Text>
                                </View>
                                <TouchableOpacity style={styles.menuItem} onPress={handleDeleteLeague}>
                                    <Ionicons name="trash-outline" size={24} color={activeTheme.colors.error} />
                                    <Text style={[styles.menuText, { color: activeTheme.colors.error }]}
                                    >ELIMINAR LIGA ACTUAL</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAllLeagues}>
                                    <Ionicons name="nuclear-outline" size={24} color={activeTheme.colors.error} />
                                    <Text style={[styles.menuText, { color: activeTheme.colors.error }]}
                                    >ELIMINAR TODAS (DEBUG)</Text>
                                </TouchableOpacity>

                                <View style={styles.divider} />

                                <TouchableOpacity style={styles.menuItem} onPress={() => { setActiveLeague(null); setMenuVisible(false); }}>
                                    <Ionicons name="exit-outline" size={24} color={activeTheme.colors.text} />
                                    <Text style={[styles.menuText, { color: activeTheme.colors.text }]}>SALIR A MIS LIGAS</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                                    <Text style={{ color: activeTheme.colors.textMuted, fontSize: 12 }}>OPCIONES GLOBALES</Text>
                                </View>
                                <TouchableOpacity style={styles.menuItem} onPress={() => { fetchMyLeagues(); setMenuVisible(false); }}>
                                    <Ionicons name="refresh-outline" size={24} color={activeTheme.colors.text} />
                                    <Text style={[styles.menuText, { color: activeTheme.colors.text }]}>RECARGAR LIGAS</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.menuItem} onPress={() => { Alert.alert('Perfil', 'Próximamente'); setMenuVisible(false); }}>
                                    <Ionicons name="person-circle-outline" size={24} color={activeTheme.colors.text} />
                                    <Text style={[styles.menuText, { color: activeTheme.colors.text }]}>MI PERFIL</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    };

    // --- MAIN RENDER LOGIC ---

    // 1. Loading
    if (loading && !activeLeague) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: activeTheme.colors.background }]}>
                <ActivityIndicator size="large" color={activeTheme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {!activeLeague ? (
                // 2. Not in League -> Onboarding or List
                myLeagues.length === 0 ? renderOnboarding() : renderLeagueList()
            ) : (
                // 3. Inside League -> Dashboard / Garage
                <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
                    {/* TOP BAR w/ HAMBURGER - Dynamic based on viewMode */}
                    <View style={[styles.topBar, { backgroundColor: activeTheme.colors.surface }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            {/* Back button for non-garage views */}
                            {viewMode !== 'garage' && (
                                <TouchableOpacity onPress={() => setViewMode('garage')}>
                                    <Ionicons name="arrow-back" size={24} color={activeTheme.colors.text} />
                                </TouchableOpacity>
                            )}
                            <View>
                                <Text style={[styles.leagueCode, { color: activeTheme.colors.textMuted }]}>
                                    {viewMode === 'garage' ? activeLeague.league?.code :
                                        viewMode === 'market' ? 'COCHES DISPONIBLES' :
                                            viewMode === 'tuning' ? 'PIEZAS DISPONIBLES' : ''}
                                </Text>
                                <Text style={[styles.leagueTitle, { color: activeTheme.colors.text }]}>
                                    {viewMode === 'garage' ? (activeLeague.league?.name || 'MI GARAJE') :
                                        viewMode === 'market' ? 'CONCESIONARIO' :
                                            viewMode === 'tuning' ? 'TUNNING' : 'LIGA'}
                                </Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={styles.cashContainer}>
                                <Text style={[styles.cashText, { color: activeTheme.colors.success }]}>
                                    €{(saldo / 1000).toFixed(0)}k
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setMenuVisible(true)}>
                                <Ionicons name="menu" size={32} color={activeTheme.colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* CONTENT */}
                    <View style={styles.content}>
                        {viewMode === 'garage' && (
                            <>
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
                            </>
                        )}
                        {viewMode === 'market' && (
                            <>
                                {/* Dealership Tabs */}
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

                                {renderMyBidsSection()}

                                {/* Info Banner */}
                                {myCars.length > 0 && (
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
                                ) : marketCars.length === 0 ? (
                                    <View style={styles.centerPlace}>
                                        <Ionicons name="car-sport" size={64} color={activeTheme.colors.textMuted} />
                                        <Text style={{ color: activeTheme.colors.textMuted, marginTop: 12 }}>
                                            Selecciona un concesionario
                                        </Text>
                                        <TouchableOpacity
                                            style={{ marginTop: 16, padding: 12, backgroundColor: activeTheme.colors.primary, borderRadius: 8 }}
                                            onPress={() => fetchMarketCars(marketTab)}
                                        >
                                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>CARGAR COCHES</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <FlatList
                                        data={marketCars}
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
                                                onPress={() => {
                                                    setPreviewCar(item);
                                                    setPreviewVisible(true);
                                                }}
                                            >
                                                {/* Car Image */}
                                                <View style={{ height: 80, backgroundColor: activeTheme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }}>
                                                    {item.image ? (
                                                        <Image source={{ uri: item.image }} style={{ width: '100%', height: 80 }} resizeMode="cover" />
                                                    ) : (
                                                        <Ionicons name="car-sport" size={40} color={activeTheme.colors.textMuted} />
                                                    )}
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
                                                            €{(item.price / 1000).toFixed(0)}k
                                                        </Text>
                                                        <TouchableOpacity
                                                            style={{
                                                                backgroundColor: activeTheme.colors.primary,
                                                                paddingHorizontal: 8,
                                                                paddingVertical: 4,
                                                                borderRadius: 4
                                                            }}
                                                            onPress={() => {
                                                                setPreviewCar(item);
                                                                setPreviewVisible(true);
                                                            }}
                                                        >
                                                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>PUJAR</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        )}
                                    />
                                )}
                            </>
                        )}
                        {viewMode === 'tuning' && (
                            <>
                                {/* Info Banner */}
                                <View style={{ backgroundColor: activeTheme.colors.primary + '20', padding: 12, borderRadius: 8, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="construct" size={20} color={activeTheme.colors.primary} />
                                    <Text style={{ color: activeTheme.colors.text, flex: 1, fontSize: 12 }}>
                                        Compra piezas para mejorar tu coche. El stock cambia cada día a las 20:00.
                                    </Text>
                                </View>
                                {renderMyBidsSection()}

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
                                            Pulsa para cargar el catálogo
                                        </Text>
                                        <TouchableOpacity
                                            style={{ marginTop: 16, padding: 12, backgroundColor: activeTheme.colors.primary, borderRadius: 8 }}
                                            onPress={fetchMarketParts}
                                        >
                                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>CARGAR PIEZAS</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <FlatList
                                        data={marketParts}
                                        keyExtractor={(item) => item.id}
                                        numColumns={2}
                                        columnWrapperStyle={{ gap: 12 }}
                                        contentContainerStyle={{ gap: 12, paddingBottom: 100 }}
                                        renderItem={({ item }) => {
                                            const qualityColors = { low: '#888', mid: '#3498db', high: '#f39c12' };
                                            return (
                                                <TouchableOpacity
                                                    style={{
                                                        flex: 1,
                                                        backgroundColor: activeTheme.colors.surface,
                                                        borderRadius: 12,
                                                        padding: 12,
                                                        borderLeftWidth: 4,
                                                        borderLeftColor: qualityColors[item.quality]
                                                    }}
                                                    onPress={() => {
                                                        setPreviewCar(item);
                                                        setBidAmount(item.price.toString());
                                                        setPartModalVisible(true);
                                                    }}
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
                                                            color={qualityColors[item.quality]}
                                                        />
                                                    </View>

                                                    {/* Quality Badge */}
                                                    <View style={{
                                                        backgroundColor: qualityColors[item.quality],
                                                        paddingHorizontal: 6,
                                                        paddingVertical: 2,
                                                        borderRadius: 4,
                                                        alignSelf: 'center',
                                                        marginBottom: 6
                                                    }}>
                                                        <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>
                                                            {item.quality.toUpperCase()}
                                                        </Text>
                                                    </View>

                                                    {/* Part Info */}
                                                    <Text style={{ color: activeTheme.colors.text, fontWeight: 'bold', fontSize: 11, textAlign: 'center' }} numberOfLines={2}>
                                                        {item.name}
                                                    </Text>
                                                    <Text style={{ color: activeTheme.colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 2 }}>
                                                        {item.type.toUpperCase()}
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
                                                            onPress={() => handleBuyPart(item)}
                                                        >
                                                            <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>COMPRAR</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </View>
                </View>
            )}

            {/* TUNING MARKET VIEW */}
            {/* The original tuning view block was removed as per instruction */}

            {renderPartsEditor()}
            {renderCarPreview()}
            {renderMarketPartPreview()}
            {renderMenu()}
            {
                loading && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }]}>
                        <ActivityIndicator size="large" color={activeTheme.colors.primary} />
                    </View>
                )
            }
        </View >
    );
};





// --- COMPONENTS (Hoisted) ---

function StatBar({ label, value, baseValue, color }: { label: string, value: number, baseValue: number, color: string }) {
    const diff = value - baseValue;
    return (
        <View style={styles.statRow}>
            <Text style={styles.statLabel}>{label}</Text>
            <View style={styles.statBarContainer}>
                <View style={[styles.statBarBase, { width: `${baseValue}%` }]} />
                {diff > 0 && (
                    <View style={[styles.statBarDiff, { left: `${baseValue}%`, width: `${diff}%`, backgroundColor: '#32D74B' }]} />
                )}
                {diff < 0 && (
                    <View style={[styles.statBarDiff, { left: `${value}%`, width: `${Math.abs(diff)}%`, backgroundColor: '#FF453A' }]} />
                )}
            </View>
            <Text style={styles.statValue}>
                {value}
                {diff !== 0 && <Text style={{ color: diff > 0 ? '#32D74B' : '#FF453A' }}> {diff > 0 ? '+' : ''}{diff}</Text>}
            </Text>
        </View>
    );
}

function TechnicalRow({ label, value }: { label: string, value: string | number }) {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: '#8E8E93', fontSize: 13 }}>{label}</Text>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '500' }}>{value}</Text>
        </View>
    );
}

function PartItem({ type, quality, isEquipped, onPress }: { type: PartType, quality: PartQuality, isEquipped: boolean, onPress: () => void }) {
    const activeTheme = useAppTheme();
    const getQualityColor = () => {
        switch (quality) {
            case 'high': return '#FFD700'; // Gold
            case 'mid': return '#007AFF'; // Blue
            case 'low': return '#CD7F32'; // Bronze
            default: return '#888';
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.partItem,
                { borderColor: isEquipped ? activeTheme.colors.primary : 'transparent', borderWidth: 1 }
            ]}
            onPress={onPress}
        >
            <View style={[styles.qualityDot, { backgroundColor: getQualityColor() }]} />
            <Text style={[styles.partName, { color: activeTheme.colors.text }]}>{getPartName(type)}</Text>
            <Text style={styles.qualityText}>{quality.toUpperCase()}</Text>
        </TouchableOpacity>
    );
};
