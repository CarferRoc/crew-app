import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Alert, TouchableOpacity, Modal, ScrollView, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Car, CarPart, League, PartType, PartQuality, CarStats, MarketBid } from '../models/types';
import { calculateStats, calculateEventScore, getPartName, calculateLaborCost } from '../lib/gameplay';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Modular Components
import { LigaListLigaScreen } from './LigaListLigaScreen';
import { GarajeLigaScreen } from './GarajeLigaScreen';
import { MercadoLigaScreen } from './MercadoLigaScreen';
import { TuningLigaScreen } from './TuningLigaScreen';
import { RankingLigaScreen } from './RankingLigaScreen';
import { ModalesLigaScreen } from './ModalesLigaScreen';
import { ParticipantesLigaScreen } from './ParticipantesLigaScreen';
import { StarterCarSelectionModal } from '../components/StarterCarSelectionModal';

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
    const [viewMode, setViewMode] = useState<'dashboard' | 'garage' | 'market' | 'tuning' | 'participantes'>('garage');
    const [garageTab, setGarageTab] = useState<'cars' | 'parts'>('cars'); // New Toggle
    const [myCars, setMyCars] = useState<Car[]>([]);
    const [myParts, setMyParts] = useState<CarPart[]>([]); // User's Inventory
    const [saldo, setSaldo] = useState(0);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

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
    const { marketCars, fetchMarketCars } = useStore();
    // const [marketCars, setMarketCars] = useState<any[]>([]); // REPLACED BY STORE
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

    // STARTER CAR SELECTION STATE
    const [starterCars, setStarterCars] = useState<any[]>([]);
    const [isSelectingStarter, setIsSelectingStarter] = useState(false);

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

    const fetchStarterCars = async () => {
        try {
            // Query cars with HP <= 150 from cars_liga
            const { data: carsData, error } = await supabase
                .from('cars_liga')
                .select('*')
                .not('power', 'is', null)
                .limit(100); // Get a pool to filter from

            if (error) throw error;
            if (!carsData || carsData.length === 0) return [];

            // Parse HP and filter
            const parsePowerString = (str: string) => {
                if (!str) return null;
                const pClean = str.toString().replace(/,/g, '.');
                const matchHP = pClean.match(/(\d+(?:\.\d+)?)\s*(?:HP|CV|BHP|PS)/i);
                const matchKW = pClean.match(/(\d+(?:\.\d+)?)\s*KW/i);
                if (matchHP) return Math.round(parseFloat(matchHP[1]));
                if (matchKW) return Math.round(parseFloat(matchKW[1]) * 1.36);
                return null;
            };

            const eligibleCars = carsData.filter(car => {
                const hp = parsePowerString(car.power || car.engine_specs_title || car.title || '');
                return hp && hp <= 150;
            });

            if (eligibleCars.length === 0) return [];

            // Select 3 random cars
            const shuffled = eligibleCars.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 3);

            // Format cars with stats
            const formattedCars = selected.map((row: any) => {
                let imgs: string[] = [];
                if (row.image_urls && Array.isArray(row.image_urls)) imgs = row.image_urls;
                else if (typeof row.image_urls === 'string') {
                    try { imgs = JSON.parse(row.image_urls); }
                    catch { imgs = row.image_urls.split(',').map((s: string) => s.trim()); }
                }
                const image = imgs[0] || 'https://via.placeholder.com/800x450';

                const hpVal = parsePowerString(row.power || row.engine_specs_title || row.title || '') || 100;

                let year = row.from_year;
                if (!year && row.production_years) {
                    const yMatch = row.production_years.match(/(\d{4})/);
                    if (yMatch) year = parseInt(yMatch[1]);
                }
                if (!year) year = 2000;

                const safeFloat = (v: any) => {
                    if (typeof v === 'number') return v;
                    if (typeof v === 'string') return parseFloat(v.replace(',', '.')) || 0;
                    return 0;
                };

                const accel = safeFloat(row.acceleration);
                const tspeed = safeFloat(row.top_speed);
                const weight = safeFloat(row.unladen_weight) || 1500;
                const cons = safeFloat(row.combined) || 8;

                const st_ac = accel > 0 ? Math.max(10, Math.min(100, 115 - (accel * 8))) : 50;
                const st_tr = tspeed > 0 ? Math.max(10, Math.min(100, tspeed / 3.2)) : 50;
                const st_mn = Math.max(10, Math.min(100, 130 - (weight / 20)));
                const st_cn = Math.max(10, Math.min(100, 100 - (cons * 4)));

                // Used car - apply age penalty to reliability
                const age = Math.max(0, new Date().getFullYear() - year);
                const st_fi = Math.max(30, 95 - (age * 2.5));

                const realStats = {
                    ac: Math.round(st_ac),
                    mn: Math.round(st_mn),
                    tr: Math.round(st_tr),
                    cn: Math.round(st_cn),
                    es: 50,
                    fi: Math.round(st_fi)
                };

                const basePrice = (hpVal * 180) + 2000;

                return {
                    id: row.id,
                    brand: row.brand,
                    model: row.model,
                    production_years: row.production_years,
                    year: year,
                    hp: hpVal,
                    price: Math.floor(basePrice),
                    isUsed: true,
                    image: image,
                    image_urls: imgs,
                    stats: realStats,
                    dbStats: realStats,
                    baseStats: realStats,
                    parts: [],
                    cylinders: row.cylinders,
                    gearbox: row.gearbox,
                    drive_type: row.drive_type,
                    body_style: row.body_style,
                    segment: row.segment
                };
            });

            return formattedCars;
        } catch (error) {
            console.error('Error fetching starter cars:', error);
            return [];
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
        const leagueId = currentParticipant.league_id || currentParticipant.league?.id;
        if (!leagueId) return;

        try {

            // 1. Get league metadata focusing on resolution time
            const { data: league, error: lError } = await supabase
                .from('leagues')
                .select('id, code, last_auction_resolved_at, created_at')
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

            // 2. Check timing: must be after 20:00 and not resolved today
            if (lastResolved && lastResolved >= today20) {
                console.log('Auctions already resolved for today.');
                return;
            }

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

            // 5. Build updates for participants - Fetch by league_code since league_id might be null in records
            const { data: participants, error: pError } = await supabase
                .from('league_participants')
                .select('*')
                .eq('league_code', league.code);

            if (pError) throw pError;

            // Track changes in-memory to handle multiple wins per participant
            const participantMap: Record<string, any> = {};
            participants.forEach(p => {
                participantMap[p.id] = { ...p };
            });

            const winnersInfo: string[] = [];
            const processedParticipantIds = new Set<string>();

            for (const itemId in bidsByItem) {
                const itemBids = bidsByItem[itemId];
                itemBids.sort((a, b) => {
                    if (b.amount !== a.amount) return b.amount - a.amount;
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                });

                const winnerBid = itemBids[0];
                const p = participantMap[winnerBid.participant_id];

                if (p && p.budget >= winnerBid.amount) {
                    const marketItem = winnerBid.item_data;
                    console.log(`Processing win for ${p.id}: ${winnerBid.item_type} ${marketItem.brand || marketItem.type}`);

                    if (winnerBid.item_type === 'car') {
                        // Map MarketCar -> Car
                        const stats = marketItem.dbStats || { ac: 0, mn: 0, tr: 0, cn: 0, es: 0, fi: 0 };
                        const newCar: Car = {
                            id: marketItem.id + '-' + Date.now(), // Ensure unique ID for the instance
                            brand: marketItem.brand,
                            model: marketItem.model,
                            year: marketItem.year,
                            hp: marketItem.hp,
                            cylinders: marketItem.cylinders,
                            gearbox: marketItem.gearbox || marketItem.transmission,
                            drive_type: marketItem.drive_type || marketItem.drivetrain,
                            body_style: marketItem.style || marketItem.body_style,
                            segment: marketItem.category || marketItem.segment,
                            city: marketItem.cityMpg?.toString() || marketItem.city,
                            highway: marketItem.highwayMpg?.toString() || marketItem.highway,

                            production_years: marketItem.production_years || marketItem.year?.toString() || '2000',
                            image_urls: [marketItem.image],
                            parts: [],
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
                        newCar.stats = calculateStats(newCar);

                        // Only allow one car - if already has one, we skip or replace? 
                        // Per requirements: "Solo puedes tener un coche". 
                        // But if they bid on two and win both, they get the first one.
                        if (p.team_cars && p.team_cars.length > 0) {
                            console.log(`Participant ${p.id} already has a car. Skipping win.`);
                            continue;
                        }

                        p.team_cars = [newCar];
                        p.budget -= winnerBid.amount;
                        processedParticipantIds.add(p.id);

                        if (p.user_id === currentUser?.id) {
                            winnersInfo.push(`¡Ganaste la subasta! Coche: ${newCar.brand} ${newCar.model} por €${winnerBid.amount.toLocaleString()}.`);
                        }
                    } else if (winnerBid.item_type === 'part') {
                        // Map MarketPart -> CarPart
                        const newPart: CarPart = {
                            id: marketItem.id + '-' + Date.now(),
                            type: marketItem.type,
                            quality: marketItem.quality,
                            name: marketItem.name,
                            bonusStats: marketItem.bonusStats,
                            price: marketItem.price
                        };

                        p.team_parts = [...(p.team_parts || []), newPart];
                        p.budget -= winnerBid.amount;
                        processedParticipantIds.add(p.id);

                        if (p.user_id === currentUser?.id) {
                            winnersInfo.push(`¡Ganaste la subasta! Pieza: ${newPart.name} por €${winnerBid.amount.toLocaleString()}.`);
                        }
                    }
                } else {
                    console.log(`Win check failed for bid ${winnerBid.id}: Participant found? ${!!p}, Budget? ${p?.budget} >= ${winnerBid.amount}`);
                }
            }

            // 6. Persist ALL updates to DB
            for (const pId of Array.from(processedParticipantIds)) {
                const p = participantMap[pId];
                console.log(`Persisting updates for participant ${pId}`);
                const { error: upError } = await supabase.from('league_participants')
                    .update({
                        team_cars: p.team_cars,
                        team_parts: p.team_parts,
                        budget: p.budget
                    })
                    .eq('id', pId);

                if (upError) console.error(`Error updating participant ${pId}:`, upError);
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
                            const targetLeagueId = activeLeague.league_id || activeLeague.league?.id;
                            const targetLeagueCode = activeLeague.league_code || activeLeague.league?.code;

                            if (!targetLeagueId && !targetLeagueCode) {
                                Alert.alert("Error", "No se encontró el ID o código de la liga.");
                                return;
                            }

                            // First, delete all participants for this league
                            if (targetLeagueCode) {
                                const { error: participantsError } = await supabase
                                    .from('league_participants')
                                    .delete()
                                    .eq('league_code', targetLeagueCode);

                                if (participantsError) {
                                    console.error("Error deleting participants:", participantsError);
                                    throw participantsError;
                                }
                            }

                            // Then delete the league itself
                            if (targetLeagueId) {
                                const { error: leagueError } = await supabase
                                    .from('leagues')
                                    .delete()
                                    .eq('id', targetLeagueId);

                                if (leagueError) throw leagueError;
                            }

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

    // --- MARKET LOGIC (Store Connected) ---



    // --- MARKET LOGIC (Store Connected) ---

    const fetchMarketCarsHandler = async (type: 'new' | 'used') => {
        const id = activeLeague?.league?.id;
        if (!id) {
            console.log('[LigaScreen] skipping fetchMarketCars (No League ID)');
            return;
        }
        console.log('[LigaScreen] invoking fetchMarketCars for:', type);
        setLoadingMarket(true);
        await useStore.getState().fetchMarketCars(type, id);
        setLoadingMarket(false);
    };

    // Initial fetch
    useEffect(() => {
        if (activeLeague?.league?.id) {
            fetchMarketCarsHandler(marketTab);
        }
    }, [activeLeague?.league?.id, marketTab]);

    // --- PARTICIPANTS LOGIC ---
    const fetchParticipants = async () => {
        const leagueCode = activeLeague?.league?.code;
        if (!leagueCode) {
            console.log('[LigaScreen] skipping fetchParticipants (No League Code)');
            return;
        }
        console.log('[LigaScreen] fetching participants for league:', leagueCode);
        setLoadingParticipants(true);
        const data = await useStore.getState().fetchLeagueParticipants(leagueCode);
        setParticipants(data);
        setLoadingParticipants(false);
    };


    // Fetch parts for the tuning market
    const fetchMarketParts = async () => {
        setLoadingParts(true);
        try {
            // Get today's market day for deterministic selection
            const marketDay = getMarketDay();
            const leagueSeed = activeLeague?.league_code || activeLeague?.league?.code || 'global';
            const seed = `${leagueSeed}-${marketDay}-parts`;
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
                                gearbox: marketCar.gearbox || marketCar.transmission,
                                drive_type: marketCar.drive_type || marketCar.drivetrain,
                                body_style: marketCar.style || marketCar.body_style,
                                segment: marketCar.category || marketCar.segment,
                                city: marketCar.cityMpg?.toString() || marketCar.city,
                                highway: marketCar.highwayMpg?.toString() || marketCar.highway,

                                production_years: marketCar.production_years || marketCar.year?.toString() || '2000',
                                image_urls: [marketCar.image],
                                parts: [],
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

                            // If in starter selection mode, disable it
                            if (isSelectingStarter) {
                                setIsSelectingStarter(false);
                                setStarterCars([]);
                            }

                            setViewMode('garage');

                            Alert.alert(
                                '¡Compra Exitosa!',
                                isSelectingStarter
                                    ? `${marketCar.brand} ${marketCar.model} es ahora tu coche inicial. ¡Buena suerte!`
                                    : `${marketCar.brand} ${marketCar.model} ahora está en tu garaje.`
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

    // Handle starter car selection
    const handleSelectStarterCar = async (selectedCar: any) => {
        setLoading(true);
        try {
            // Create car object for garage
            const hp = selectedCar.hp;
            const stats = selectedCar.dbStats || selectedCar.stats || { ac: 0, mn: 0, tr: 0, cn: 0, es: 0, fi: 0 };

            const newCar: Car = {
                id: selectedCar.id,
                brand: selectedCar.brand,
                model: selectedCar.model,
                year: selectedCar.year,
                hp: hp,
                cylinders: selectedCar.cylinders,
                gearbox: selectedCar.gearbox || selectedCar.transmission,
                drive_type: selectedCar.drive_type || selectedCar.drivetrain,
                body_style: selectedCar.style || selectedCar.body_style,
                segment: selectedCar.category || selectedCar.segment,
                city: selectedCar.cityMpg?.toString() || selectedCar.city,
                highway: selectedCar.highwayMpg?.toString() || selectedCar.highway,
                production_years: selectedCar.production_years || selectedCar.year?.toString() || '2000',
                image_urls: selectedCar.image_urls || [selectedCar.image],
                parts: [],
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
            const newBudget = saldo - selectedCar.price;
            const newCars = [newCar];

            // Get the participant record ID
            const participantId = activeLeague?.id;
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

            // Close modal and disable starter mode
            setIsSelectingStarter(false);
            setStarterCars([]);

            // Go to garage
            setViewMode('garage');

            Alert.alert(
                '¡Coche Seleccionado!',
                `${selectedCar.brand} ${selectedCar.model} es ahora tu coche inicial. ¡Buena suerte!`
            );

        } catch (error: any) {
            console.error('Starter car selection error:', error);
            Alert.alert('Error', error.message || 'No se pudo seleccionar el coche.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch user's active bids
    const fetchMyBids = async () => {
        if (!activeLeague || !currentUser) return;
        try {
            const { data, error } = await supabase
                .from('market_bids')
                .select('*')
                .eq('league_id', activeLeague.league_id || activeLeague.league?.id)
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

        // Validation 1: Check if user already has a car when bidding on a car
        if (type === 'car' && myCars.length > 0) {
            Alert.alert(
                "Garaje Lleno",
                "Ya tienes un coche en el garaje. No puedes pujar por otro coche hasta que vendas el que tienes.",
                [{ text: "Entendido" }]
            );
            return;
        }

        // Validation 2: Ensure bid is higher than the car's price
        if (type === 'car' && item.price && bidAmount <= item.price) {
            Alert.alert(
                "Puja Inválida",
                `Tu puja debe ser mayor al precio del coche (€${item.price.toLocaleString()}). Puja actual: €${bidAmount.toLocaleString()}.`,
                [{ text: "Ok" }]
            );
            return;
        }

        if (saldo < bidAmount) {
            Alert.alert("Saldo Insuficiente", "No tienes suficiente dinero para esta puja.");
            return;
        }

        setLoading(true);
        try {
            const leagueId = activeLeague.league_id || activeLeague.league?.id;

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
                    production_years: c.production_years || `${year}`, // Fallback
                    year,
                    hp,
                    image_urls: [image],
                    parts: [],
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

            // 2. Fetch starter cars
            const starters = await fetchStarterCars();
            if (!starters || starters.length === 0) {
                throw new Error("No se pudieron cargar los coches iniciales");
            }

            // 3. Add Participant with empty cars and 50k budget
            const { data: insertedParticipant, error: partError } = await supabase
                .from('league_participants')
                .insert({
                    user_id: currentUser?.id,
                    league_code: code,
                    budget: 50000, // Budget for one car + one low quality part
                    team_cars: []
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

            // Set starter cars and show modal
            setStarterCars(starters);
            setIsSelectingStarter(true);
            setActiveLeague(newParticipant);
            setMyCars([]);
            setMyParts([]);
            setSaldo(50000);

            // Fetch background update
            fetchMyLeagues();
            Alert.alert('¡Liga Creada!', `Tu código es: ${code}\n\nAhora elige tu coche inicial.`);

        } catch (e) {
            Alert.alert('Error', 'No se pudo crear la liga.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinLeague = async () => {
        if (!joinCode || joinCode.length < 6) {
            Alert.alert('Error', 'El código de invitación debe tener al menos 6 caracteres.');
            return;
        }
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

            // 3. Fetch starter cars
            const starters = await fetchStarterCars();
            if (!starters || starters.length === 0) {
                throw new Error("No se pudieron cargar los coches iniciales");
            }

            // 4. Insert Participant with empty cars and 50k budget
            const { data: insertedParticipant, error } = await supabase
                .from('league_participants')
                .insert({
                    user_id: currentUser?.id,
                    league_code: joinCode.toUpperCase(),
                    budget: 50000, // Budget for one car + one low quality part
                    team_cars: []
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

            // Set starter cars and show modal
            setStarterCars(starters);
            setIsSelectingStarter(true);
            setActiveLeague(newParticipant);
            setMyCars([]);
            setMyParts([]);
            setSaldo(50000);

            fetchMyLeagues();
            Alert.alert('¡Bienvenido!', 'Ahora elige tu coche inicial.');

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
            stats: newStats
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
            stats: newStats
        });
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
                <LigaListLigaScreen
                    myLeagues={myLeagues}
                    loading={loading}
                    fetchMyLeagues={fetchMyLeagues}
                    handleEnterLeague={handleEnterLeague}
                    setJoinMode={setJoinMode}
                    setJoinModalVisible={setJoinModalVisible}
                    joinModalVisible={joinModalVisible}
                    joinMode={joinMode}
                    joinCode={joinCode}
                    setJoinCode={setJoinCode}
                    newLeagueName={newLeagueName}
                    setNewLeagueName={setNewLeagueName}
                    handleJoinLeague={handleJoinLeague}
                    handleCreateLeague={handleCreateLeague}
                />
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
                                            viewMode === 'tuning' ? 'PIEZAS DISPONIBLES' :
                                                viewMode === 'participantes' ? activeLeague.league?.code : ''}
                                </Text>
                                <Text style={[styles.leagueTitle, { color: activeTheme.colors.text }]}>
                                    {viewMode === 'garage' ? (activeLeague.league?.name || 'MI GARAJE') :
                                        viewMode === 'market' ? 'CONCESIONARIO' :
                                            viewMode === 'tuning' ? 'TUNNING' :
                                                viewMode === 'participantes' ? 'PARTICIPANTES' : 'LIGA'}
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
                            <GarajeLigaScreen
                                currentEvent={currentEvent}
                                myCars={myCars}
                                myParts={myParts}
                                garageTab={garageTab}
                                setGarageTab={setGarageTab}
                                handleCarSelect={handleCarSelect}
                            />
                        )}
                        {viewMode === 'market' && (
                            <MercadoLigaScreen
                                marketTab={marketTab}
                                setMarketTab={setMarketTab}
                                loadingMarket={loadingMarket}
                                marketCars={marketCars}
                                fetchMarketCars={fetchMarketCars}
                                myBids={myBids}
                                myCars={myCars}
                                isSelectingStarter={isSelectingStarter}
                                starterCars={starterCars}
                                onSelectCar={(car) => { setPreviewCar(car); setPreviewVisible(true); }}
                                onEditBid={(bid) => {
                                    setPreviewCar(bid.itemData);
                                    setBidAmount(bid.amount.toString());
                                    if (bid.itemType === 'car') setPreviewVisible(true);
                                    else setPartModalVisible(true);
                                }}
                            />
                        )}
                        {viewMode === 'tuning' && (
                            <TuningLigaScreen
                                loadingParts={loadingParts}
                                marketParts={marketParts}
                                fetchMarketParts={fetchMarketParts}
                                myBids={myBids}
                                saldo={saldo}
                                onEditBid={(bid) => {
                                    setPreviewCar(bid.itemData);
                                    setBidAmount(bid.amount.toString());
                                    setPartModalVisible(true);
                                }}
                                onSelectPart={(part) => { setPreviewCar(part); setBidAmount(part.price.toString()); setPartModalVisible(true); }}
                                onBuyPart={handleBuyPart}
                            />
                        )}
                        {viewMode === 'dashboard' && (
                            <RankingLigaScreen />
                        )}
                        {viewMode === 'participantes' && (
                            <ParticipantesLigaScreen
                                participants={participants}
                                loading={loadingParticipants}
                                currentUserId={currentUser?.id}
                            />
                        )}
                    </View>
                </View>
            )}

            {/* TUNING MARKET VIEW */}
            {/* The original tuning view block was removed as per instruction */}

            <ModalesLigaScreen
                selectedCar={selectedCar}
                editorVisible={editorVisible}
                setEditorVisible={setEditorVisible}
                myParts={myParts}
                handleRemovePart={handleRemovePart}
                handleEquipPart={handleEquipPart}
                handleInstallMods={handleInstallMods}
                handleSellCar={handleSellCar}
                previewCar={previewCar}
                previewVisible={previewVisible}
                setPreviewVisible={setPreviewVisible}
                saldo={saldo}
                myCars={myCars}
                bidAmount={bidAmount}
                setBidAmount={setBidAmount}
                handlePlaceBid={handlePlaceBid}
                isSelectingStarter={isSelectingStarter}
                partModalVisible={partModalVisible}
                setPartModalVisible={setPartModalVisible}
                menuVisible={menuVisible}
                setMenuVisible={setMenuVisible}
                activeLeague={activeLeague}
                setViewMode={setViewMode}
                setMarketTab={setMarketTab}
                fetchMarketCars={fetchMarketCars}
                handleDeleteLeague={handleDeleteLeague}
                handleDeleteAllLeagues={handleDeleteAllLeagues}
                fetchMyLeagues={fetchMyLeagues}
                setActiveLeague={setActiveLeague}
                fetchParticipants={fetchParticipants}
            />

            {/* Starter Car Selection Modal */}
            <StarterCarSelectionModal
                visible={isSelectingStarter}
                starterCars={starterCars}
                onSelectCar={handleSelectStarterCar}
            />

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


