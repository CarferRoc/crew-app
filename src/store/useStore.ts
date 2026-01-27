import { create } from 'zustand';
import { User, Crew, CrewEvent, Battle, RewardVoucher, ChatMessage, Conversation, DirectMessage } from '../models/types';
import { supabase } from '../lib/supabase';

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
    joinEvent: (eventId: string, userId: string) => void;
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
                    members_data:crew_members(profile_id)
                `);

            if (error) throw error;

            const mappedCrews: Crew[] = (data || []).map(c => ({
                id: c.id,
                name: c.name,
                badge: c.image_url || '',
                privacy: 'public', // Default for now
                members: c.members_data?.map((m: any) => m.profile_id) || [],
                scoreCrew: 0,
                createdBy: c.created_by,
                invites: [],
                inviteCode: c.invite_code
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

    joinEvent: (eventId: string, userId: string) => {
        set(state => {
            if (!state.currentUser) return state;

            const updatedEvents = state.events.map(e =>
                e.id === eventId && !e.attendees.includes(userId)
                    ? { ...e, attendees: [...e.attendees, userId] }
                    : e
            );

            const updatedUsers = state.users.map(u =>
                u.id === userId
                    ? { ...u, pointsPersonal: u.pointsPersonal + 1 }
                    : u
            );

            const updatedCurrentUser = state.currentUser.id === userId
                ? { ...state.currentUser, pointsPersonal: state.currentUser.pointsPersonal + 1 }
                : state.currentUser;

            return {
                events: updatedEvents,
                users: updatedUsers,
                currentUser: updatedCurrentUser
            };
        });
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
    }
}));
