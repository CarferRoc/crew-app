import { create } from 'zustand';
import { User, Crew, CrewEvent, Battle, RewardVoucher, ChatMessage, Conversation, DirectMessage, GarageCar } from '../models/types';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

interface AppState {
    users: User[];
    crews: Crew[];
    events: CrewEvent[];
    battles: Battle[];
    vouchers: RewardVoucher[];
    currentUser: User | null;
    messages: Record<string, ChatMessage[]>; // crewId -> messages
    conversations: Conversation[];
    directMessages: Record<string, DirectMessage[]>; // conversationId -> messages
    garage: GarageCar[];
    isDarkMode: boolean;

    // Actions
    setUsers: (users: User[]) => void;
    setUser: (user: User | null) => void;
    setDarkMode: (dark: boolean) => void;
    updateProfile: (updates: Partial<User>) => void;
    updateUserRole: (userId: string, role: User['role']) => void;
    addCar: (car: any) => void;
    joinCrewByInvite: (code: string) => Promise<boolean>;
    fetchCrews: () => Promise<void>;
    createEvent: (crewId: string, eventData: Partial<CrewEvent>) => void;
    joinEvent: (eventId: string, userId: string) => Promise<boolean>;
    leaveEvent: (eventId: string, userId: string) => Promise<boolean>;
    chooseBattleWinner: (battleId: string, winnerCrewId: string) => void;
    redeemVoucher: (voucherId: string, userId: string) => boolean;
    setConversations: (conversations: Conversation[]) => void;
    addDirectMessage: (convId: string, message: DirectMessage) => void;
    generateInviteCode: (crewId: string) => Promise<string | null>;

    // Invites
    sendInvite: (crewId: string, userId: string) => Promise<boolean>;
    fetchMyInvites: () => Promise<any[]>;
    acceptInvite: (inviteId: string) => Promise<boolean>;
    rejectInvite: (inviteId: string) => Promise<boolean>;

    // Requests
    requestJoinCrew: (crewId: string, message: string) => Promise<boolean>;
    fetchCrewRequests: (crewId: string) => Promise<any[]>;
    approveRequest: (requestId: string) => Promise<boolean>;
    rejectRequest: (requestId: string) => Promise<boolean>;

    // New Actions
    fetchUserProfile: (userId: string) => Promise<User | null>;
    createEventRequest: (crewId: string, eventData: { title: string, location: string, dateTime: string, description: string, latitude?: number, longitude?: number, image_url?: string }) => Promise<boolean>;
    approveEvent: (eventId: string) => Promise<boolean>;
    rejectEvent: (eventId: string) => Promise<boolean>;
    deleteEvent: (eventId: string) => Promise<boolean>;
    getOrCreateConversation: (otherUserId: string) => Promise<string | null>;

    // Alliances
    fetchMyManagedCrews: () => Crew[];
    sendAllianceRequest: (requesterId: string, targetId: string) => Promise<'success' | 'duplicate' | 'error'>;
    approveAllianceRequest: (allianceId: string) => Promise<boolean>;
    rejectAllianceRequest: (allianceId: string) => Promise<boolean>;
    deleteAlliance: (allianceId: string) => Promise<boolean>;
    fetchCrewAlliances: (crewId: string) => Promise<any[]>;
    leaveCrew: (crewId: string, userId: string, newLeaderId?: string) => Promise<boolean>;

    // Garage
    fetchGarage: (userId: string) => Promise<void>;
    addCarToGarage: (car: Omit<GarageCar, 'id' | 'createdAt'>) => Promise<boolean>;
}

export const useStore = create<AppState>((set, get) => ({
    users: [],
    crews: [],
    events: [],
    battles: [],
    vouchers: [],
    currentUser: null,
    messages: {},
    conversations: [],
    directMessages: {},
    garage: [],
    isDarkMode: true,

    setUsers: (users: User[]) => set({ users }),
    setUser: (user: User | null) => set({ currentUser: user }),
    setDarkMode: (isDarkMode: boolean) => set({ isDarkMode }),

    updateProfile: (updates: Partial<User>) => set(state => ({
        currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null
    })),

    updateUserRole: async (userId: string, role: User['role']) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId);

        if (!error) {
            set(state => {
                const updatedUsers = state.users.map(u => u.id === userId ? { ...u, role } : u);
                const updatedCurrentUser = state.currentUser?.id === userId
                    ? { ...state.currentUser, role }
                    : state.currentUser;

                return {
                    users: updatedUsers,
                    currentUser: updatedCurrentUser
                };
            });
        } else {
            throw error;
        }
    },

    addCar: (car: any) => set(state => ({
        currentUser: state.currentUser
            ? { ...state.currentUser, cars: [...state.currentUser.cars, car] }
            : null
    })),

    joinCrewByInvite: async (code: string) => {
        const { currentUser } = get();
        if (!currentUser) return false;

        try {
            // Find crew by invite code
            const { data: crewData, error: crewError } = await supabase
                .from('crews')
                .select('*')
                .eq('invite_code', code.toUpperCase())
                .single();

            if (crewError || !crewData) {
                return false;
            }

            // Check if already a member
            const { data: memberData } = await supabase
                .from('crew_members')
                .select('*')
                .eq('crew_id', crewData.id)
                .eq('profile_id', currentUser.id)
                .single();

            if (memberData) {
                // Already a member
                return true;
            }

            // Join crew
            const { error: joinError } = await supabase
                .from('crew_members')
                .insert({
                    crew_id: crewData.id,
                    profile_id: currentUser.id,
                    role: 'member'
                });

            if (joinError) throw joinError;

            // Refresh crews
            await get().fetchCrews();
            return true;

        } catch (error) {
            console.error('Error joining crew:', error);
            return false;
        }
    },

    fetchCrews: async () => {
        try {
            const { data, error } = await supabase
                .from('crews')
                .select(`
                    *,
                    members_data:crew_members(profile_id),
                    league:leagues(id, name, level)
                `)
                .order('total_season_points', { ascending: false }); // Sort by score by default

            if (error) throw error;

            const mappedCrews: Crew[] = (data || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                badge: c.image_url || '',
                privacy: 'public',
                members: c.members_data?.map((m: any) => m.profile_id) || [],
                scoreCrew: c.total_season_points || 0,
                createdBy: c.created_by,
                invites: [],
                inviteCode: c.invite_code,
                isVerified: false,
                // Ranking Mapping
                leagueId: c.league?.id,
                leagueName: c.league?.name || 'Unranked',
                leagueLevel: c.league?.level || 0,
                totalSeasonPoints: c.total_season_points || 0
            }));

            set({ crews: mappedCrews });
        } catch (error) {
            console.error('Error fetching crews:', error);
        }
    },

    createEvent: (crewId: string, eventData: Partial<CrewEvent>) => {
        const { currentUser } = get();
        if (!currentUser) return;

        const newEvent: CrewEvent = {
            id: Math.random().toString(36).substr(2, 9),
            crewId,
            title: eventData.title || 'Untitled Event',
            dateTime: eventData.dateTime || new Date().toISOString(),
            location: eventData.location || 'TBA',
            description: eventData.description || '',
            capacity: eventData.capacity || 10,
            attendees: [currentUser.id],
            status: 'upcoming',
        };

        set(state => ({
            events: [...state.events, newEvent],
            crews: state.crews.map(c =>
                c.id === crewId
                    ? { ...c, scoreCrew: c.scoreCrew + 10 }
                    : c
            )
        }));
    },

    joinEvent: async (eventId: string, userId: string) => {
        try {
            // Fetch current event to get attendees
            const { data: event, error: fetchError } = await supabase
                .from('events')
                .select('attendees')
                .eq('id', eventId)
                .single();

            if (fetchError) throw fetchError;

            const currentAttendees = event.attendees || [];
            if (currentAttendees.includes(userId)) return true; // Already joined

            const updatedAttendees = [...currentAttendees, userId];

            const { error: updateError } = await supabase
                .from('events')
                .update({ attendees: updatedAttendees })
                .eq('id', eventId);

            if (updateError) throw updateError;

            // Update local state (optimistic)
            set(state => ({
                events: state.events.map(e =>
                    e.id === eventId
                        ? { ...e, attendees: updatedAttendees }
                        : e
                )
            }));

            return true;
        } catch (error) {
            console.error('Error joining event:', error);
            return false;
        }
    },

    leaveEvent: async (eventId: string, userId: string) => {
        try {
            // Fetch current event to get attendees
            const { data: event, error: fetchError } = await supabase
                .from('events')
                .select('attendees')
                .eq('id', eventId)
                .single();

            if (fetchError) throw fetchError;

            const currentAttendees = event.attendees || [];
            if (!currentAttendees.includes(userId)) return true; // Already not attending

            const updatedAttendees = currentAttendees.filter((id: string) => id !== userId);

            const { error: updateError } = await supabase
                .from('events')
                .update({ attendees: updatedAttendees })
                .eq('id', eventId);

            if (updateError) throw updateError;

            // Update local state (optimistic)
            set(state => ({
                events: state.events.map(e =>
                    e.id === eventId
                        ? { ...e, attendees: updatedAttendees }
                        : e
                )
            }));

            return true;
        } catch (error) {
            console.error('Error leaving event:', error);
            return false;
        }
    },

    chooseBattleWinner: (battleId: string, winnerCrewId: string) => {
        set(state => ({
            battles: state.battles.map(b =>
                b.id === battleId
                    ? { ...b, winnerCrewId, decidedByAdmin: true }
                    : b
            ),
            crews: state.crews.map(c =>
                c.id === winnerCrewId
                    ? { ...c, scoreCrew: c.scoreCrew + 50 }
                    : c
            )
        }));
    },

    redeemVoucher: (voucherId: string, userId: string) => {
        const { vouchers, users, currentUser } = get();
        const voucher = vouchers.find(v => v.id === voucherId);
        const user = users.find(u => u.id === userId);

        if (voucher && user && currentUser && user.pointsPersonal >= voucher.pointsCost) {
            set(state => {
                if (!state.currentUser) return state;

                const updatedUsers = state.users.map(u =>
                    u.id === userId ? { ...u, pointsPersonal: u.pointsPersonal - voucher.pointsCost } : u
                );

                const updatedCurrentUser = state.currentUser.id === userId
                    ? { ...state.currentUser, pointsPersonal: state.currentUser.pointsPersonal - voucher.pointsCost }
                    : state.currentUser;

                const updatedVouchers = state.vouchers.map(v =>
                    v.id === voucherId ? { ...v, isRedeemed: true } : v
                );

                return {
                    users: updatedUsers,
                    currentUser: updatedCurrentUser,
                    vouchers: updatedVouchers
                };
            });
            return true;
        }
        return false;
    },

    setConversations: (conversations: Conversation[]) => set({ conversations }),
    addDirectMessage: (convId: string, message: DirectMessage) => set(state => ({
        directMessages: {
            ...state.directMessages,
            [convId]: [...(state.directMessages[convId] || []), message]
        }
    })),

    generateInviteCode: async (crewId: string) => {
        try {
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            const { error } = await supabase
                .from('crews')
                .update({ invite_code: code })
                .eq('id', crewId);

            if (error) throw error;

            // Update local state
            set(state => ({
                crews: state.crews.map(c => c.id === crewId ? { ...c, inviteCode: code } : c)
            }));

            return code;
        } catch (error) {
            console.error('Error generating invite code:', error);
            return null;
        }
    },

    sendInvite: async (crewId: string, userId: string) => {
        try {
            const { error } = await supabase
                .from('crew_invites')
                .insert({ crew_id: crewId, user_id: userId });

            if (error) {
                console.error('Error sending invite:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    fetchMyInvites: async () => {
        try {
            const { currentUser } = get();
            if (!currentUser) return [];

            const { data, error } = await supabase
                .from('crew_invites')
                .select(`
                    id, 
                    created_at,
                    crews (
                        id,
                        name,
                        image_url,
                        members_data:crew_members(count)
                    )
                `)
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching invites:', error);
            return [];
        }
    },

    acceptInvite: async (inviteId: string) => {
        try {
            const { currentUser } = get();
            if (!currentUser) return false;

            // Get invite details first to get crew_id
            const { data: invite } = await supabase
                .from('crew_invites')
                .select('crew_id')
                .eq('id', inviteId)
                .single();

            if (!invite) return false;

            // Join crew
            const { error: joinError } = await supabase
                .from('crew_members')
                .insert({
                    crew_id: invite.crew_id,
                    profile_id: currentUser.id,
                    role: 'member'
                });

            if (joinError) throw joinError;

            // Delete invite
            await supabase.from('crew_invites').delete().eq('id', inviteId);

            // Refetch crews
            await get().fetchCrews();
            return true;
        } catch (error) {
            console.error('Error accepting invite:', error);
            return false;
        }
    },

    rejectInvite: async (inviteId: string) => {
        try {
            const { error } = await supabase
                .from('crew_invites')
                .delete()
                .eq('id', inviteId);
            return !error;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    requestJoinCrew: async (crewId: string, message: string) => {
        try {
            const { currentUser } = get();
            if (!currentUser) return false;

            const { error } = await supabase
                .from('crew_join_requests')
                .insert({
                    crew_id: crewId,
                    user_id: currentUser.id,
                    message,
                    status: 'pending'
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error requesting join:', error);
            return false;
        }
    },

    fetchCrewRequests: async (crewId: string) => {
        try {
            const { data, error } = await supabase
                .from('crew_join_requests')
                .select(`
                    *,
                    user:profiles(*)
                `)
                .eq('crew_id', crewId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching requests:', error);
            return [];
        }
    },

    approveRequest: async (requestId: string) => {
        try {
            // Get request details
            const { data: request } = await supabase
                .from('crew_join_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (!request) return false;

            // Add to members
            const { error: joinError } = await supabase
                .from('crew_members')
                .insert({
                    crew_id: request.crew_id,
                    profile_id: request.user_id,
                    role: 'member'
                });

            if (joinError) throw joinError;

            // Update request status
            await supabase
                .from('crew_join_requests')
                .update({ status: 'approved' })
                .eq('id', requestId);

            return true;
        } catch (error) {
            console.error('Error approving request:', error);
            return false;
        }
    },

    rejectRequest: async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('crew_join_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId);

            return !error;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    fetchUserProfile: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            // Fetch cars properly
            // Note: cars are usually in a separate table, but for now assuming they might be attached or needing separate fetch
            // Let's assume cars are in 'cars' table
            const { data: carsData } = await supabase
                .from('cars')
                .select('*')
                .eq('owner_id', userId);

            return { ...data, cars: carsData || [] };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    },

    createEventRequest: async (crewId: string, eventData: { title: string, location: string, dateTime: string, description: string, latitude?: number, longitude?: number, image_url?: string }) => {
        try {
            const { currentUser } = get();
            if (!currentUser) return false;

            // Determine status based on role (leader -> upcoming, member -> pending)
            // We need to check role in this crew
            const { data: memberData } = await supabase
                .from('crew_members')
                .select('role')
                .eq('crew_id', crewId)
                .eq('profile_id', currentUser.id)
                .single();

            const isLeader = memberData?.role === 'crew_lider';
            const status = isLeader ? 'upcoming' : 'pending';

            const { error } = await supabase
                .from('events')
                .insert({
                    crew_id: crewId,
                    title: eventData.title || 'Quedada',
                    date_time: eventData.dateTime,
                    location: eventData.location,
                    description: eventData.description,
                    status: status,
                    created_by: currentUser.id,
                    latitude: eventData.latitude,
                    longitude: eventData.longitude,
                    image_url: eventData.image_url
                });

            if (error) {
                console.error('Supabase Error:', error);
                Alert.alert('Debug Error', JSON.stringify(error));
                throw error;
            }
            return true;
        } catch (error) {
            console.error('Error creating event:', error);
            // Alert.alert('Catch Error', JSON.stringify(error)); 
            return false;
        }
    },

    approveEvent: async (eventId: string) => {
        try {
            const { error } = await supabase
                .from('events')
                .update({ status: 'upcoming' })
                .eq('id', eventId);
            return !error;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    rejectEvent: async (eventId: string) => {
        try {
            const { error } = await supabase
                .from('events')
                .delete() // Simply delete the pending event
                .eq('id', eventId);
            return !error;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    deleteEvent: async (eventId: string) => {
        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

            if (!error) {
                set(state => ({
                    events: state.events.filter(e => e.id !== eventId)
                }));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting event:', error);
            return false;
        }
    },



    getOrCreateConversation: async (otherUserId: string) => {
        try {
            const { currentUser } = get();
            if (!currentUser) return null;

            // Sort IDs to ensure consistent order for participant columns
            const ids = [currentUser.id, otherUserId].sort();
            const p1 = ids[0];
            const p2 = ids[1];

            // 1. Direct Lookup in conversations table (Primary Source of Truth)
            const { data: existing } = await supabase
                .from('conversations')
                .select('id')
                .eq('participant1_id', p1)
                .eq('participant2_id', p2)
                .maybeSingle();

            if (existing) {
                return existing.id;
            }

            // 2. Create new conversation if not found
            const { data: newConv, error: createError } = await supabase
                .from('conversations')
                .insert({
                    participant1_id: p1,
                    participant2_id: p2,
                    last_message: 'Nueva conversación',
                    updated_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (createError) {
                // Handle Race Condition / Duplicate (PGRST204 or 23505)
                if (createError.code === '23505') {
                    // It was created by someone else in the meantime, fetch it
                    const { data: retry } = await supabase
                        .from('conversations')
                        .select('id')
                        .eq('participant1_id', p1)
                        .eq('participant2_id', p2)
                        .maybeSingle();
                    return retry?.id || null;
                }
                throw createError;
            }

            // 3. Add participants to junction table (Best effort for compatibility)
            const { error: partError } = await supabase
                .from('conversation_participants')
                .insert([
                    { conversation_id: newConv.id, user_id: currentUser.id },
                    { conversation_id: newConv.id, user_id: otherUserId }
                ]);

            if (partError) {
                console.warn('Could not add to conversation_participants:', partError);
            }

            return newConv.id;
        } catch (error) {
            console.error('Error getting conversation:', error);
            return null;
        }
    },

    fetchMyManagedCrews: () => {
        const { crews, currentUser } = get();
        if (!currentUser) return [];
        // Ideally we should check role from `crew_members` table or store, 
        // but for now we rely on `createdBy` or if we have roles in `crews` store (which we mapped poorly).
        // Let's rely on checking `created_by` for simplicity or iterate members if available.
        // Actually, in fetchCrews we mapped members. 
        // Better: We need to know where I am leader. 
        // Let's assume for now "created_by" denotes Ownership/Leadership for this feature, 
        // OR we can fetch from DB. 
        // Given we don't store roles in `crews` list state efficiently, let's filter by createdBy for MVP.
        return crews.filter(c => c.createdBy === currentUser.id);
    },

    sendAllianceRequest: async (requesterId: string, targetId: string) => {
        try {
            const { error } = await supabase
                .from('crew_alliances')
                .insert({
                    requester_crew_id: requesterId,
                    target_crew_id: targetId,
                    status: 'pending'
                });
            if (error) {
                if (error.code === '23505') return 'duplicate'; // Unique violation
                throw error;
            }
            return 'success';
        } catch (error) {
            console.error('Error sending alliance request:', error);
            // Alert.alert('Error', JSON.stringify(error));
            return 'error';
        }
    },

    approveAllianceRequest: async (allianceId: string) => {
        try {
            const { error } = await supabase
                .from('crew_alliances')
                .update({ status: 'accepted' })
                .eq('id', allianceId);
            return !error;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    rejectAllianceRequest: async (allianceId: string) => {
        try {
            const { error } = await supabase
                .from('crew_alliances')
                .update({ status: 'rejected' }) // or delete
                .eq('id', allianceId);
            return !error;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    deleteAlliance: async (allianceId: string) => {
        try {
            const { error } = await supabase
                .from('crew_alliances')
                .delete()
                .eq('id', allianceId);
            return !error;
        } catch (error) {
            console.error(error);
            return false;
        }
    },

    fetchCrewAlliances: async (crewId: string) => {
        try {
            // We need alliances where I am requester OR target
            const { data, error } = await supabase
                .from('crew_alliances')
                .select(`
                    *,
                    requester:crews!requester_crew_id(id, name, image_url),
                    target:crews!target_crew_id(id, name, image_url)
                `)
                .or(`requester_crew_id.eq.${crewId},target_crew_id.eq.${crewId}`);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching alliances:', error);
            return [];
        }
    },

    leaveCrew: async (crewId: string, userId: string, newLeaderId?: string) => {
        try {
            // Check if user is leader
            const { data: memberData, error: memberError } = await supabase
                .from('crew_members')
                .select('role')
                .eq('crew_id', crewId)
                .eq('profile_id', userId)
                .single();

            if (memberError) throw memberError;

            // QUANTITY CHECK
            const { count } = await supabase
                .from('crew_members')
                .select('*', { count: 'exact', head: true })
                .eq('crew_id', crewId);

            if (memberData.role === 'crew_lider' && count && count > 1) {
                if (!newLeaderId) {
                    console.error("Leader must appoint a successor");
                    return false;
                }

                // Transfer leadership
                const { error: updateError } = await supabase
                    .from('crew_members')
                    .update({ role: 'crew_lider' })
                    .eq('crew_id', crewId)
                    .eq('profile_id', newLeaderId);

                if (updateError) throw updateError;

                // Update crew owner (for fetchMyManagedCrews consistency)
                await supabase
                    .from('crews')
                    .update({ created_by: newLeaderId })
                    .eq('id', crewId);
            }

            if (count === 1) {
                // If I'm the last one, delete the crew completely (CASCADE will handle members)
                const { error: deleteCrewError } = await supabase
                    .from('crews')
                    .delete()
                    .eq('id', crewId);

                if (deleteCrewError) throw deleteCrewError;
            } else {
                // If there are more people, delete only my membership
                const { error } = await supabase
                    .from('crew_members')
                    .delete()
                    .eq('crew_id', crewId)
                    .eq('profile_id', userId);

                if (error) throw error;
            }

            // Refresh crews to update UI
            await get().fetchCrews();
            return true;
        } catch (error) {
            console.error('Error leaving crew:', error);
            return false;
        }
    },

    fetchGarage: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('garaje')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mapped: GarageCar[] = (data || []).map(item => ({
                id: item.id,
                userId: item.user_id,
                name: item.name,
                nickname: item.nickname,
                power: item.power,
                specs: item.specs,
                photos: item.photos || [],
                createdAt: item.created_at
            }));

            set({ garage: mapped });
        } catch (error) {
            console.error('Error fetching garage:', error);
            set({ garage: [] });
        }
    },

    addCarToGarage: async (car) => {
        try {
            const { currentUser } = get();
            if (!currentUser) return false;

            const { error } = await supabase
                .from('garaje')
                .insert({
                    user_id: currentUser.id,
                    name: car.name,
                    nickname: car.nickname,
                    power: car.power,
                    specs: car.specs,
                    photos: car.photos
                });

            if (error) throw error;

            // Refresh if it's my garage
            await get().fetchGarage(currentUser.id);
            return true;
        } catch (error) {
            console.error('Error adding car to garage:', error);
            return false;
        }
    }
}));
