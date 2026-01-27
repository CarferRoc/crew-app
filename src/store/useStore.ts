import { create } from 'zustand';
import { User, Crew, CrewEvent, Battle, RewardVoucher, ChatMessage } from '../models/types';
import { MOCK_USERS, MOCK_CREWS, MOCK_EVENTS, MOCK_BATTLES, MOCK_VOUCHERS } from '../data/mock';

interface AppState {
    users: User[];
    crews: Crew[];
    events: CrewEvent[];
    battles: Battle[];
    vouchers: RewardVoucher[];
    currentUser: User;
    messages: Record<string, ChatMessage[]>; // crewId -> messages

    // Actions
    joinCrewByInvite: (code: string) => boolean;
    createEvent: (crewId: string, eventData: Partial<CrewEvent>) => void;
    joinEvent: (eventId: string, userId: string) => void;
    chooseBattleWinner: (battleId: string, winnerCrewId: string) => void;
    redeemVoucher: (voucherId: string, userId: string) => boolean;
}

export const useStore = create<AppState>((set, get) => ({
    users: MOCK_USERS,
    crews: MOCK_CREWS,
    events: MOCK_EVENTS,
    battles: MOCK_BATTLES,
    vouchers: MOCK_VOUCHERS,
    currentUser: MOCK_USERS.find(u => u.id === 'user_me')!,
    messages: {},

    joinCrewByInvite: (code: string) => {
        const { crews, currentUser } = get();
        const crew = crews.find(c => c.invites.includes(code.toUpperCase()));

        if (crew && !crew.members.includes(currentUser.id)) {
            set(state => ({
                crews: state.crews.map(c =>
                    c.id === crew.id
                        ? { ...c, members: [...c.members, currentUser.id] }
                        : c
                )
            }));
            return true;
        }
        return false;
    },

    createEvent: (crewId, eventData) => {
        const newEvent: CrewEvent = {
            id: Math.random().toString(36).substr(2, 9),
            crewId,
            title: eventData.title || 'Untitled Event',
            dateTime: eventData.dateTime || new Date().toISOString(),
            location: eventData.location || 'TBA',
            description: eventData.description || '',
            capacity: eventData.capacity || 10,
            attendees: [get().currentUser.id],
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

    joinEvent: (eventId, userId) => {
        set(state => ({
            events: state.events.map(e =>
                e.id === eventId && !e.attendees.includes(userId)
                    ? { ...e, attendees: [...e.attendees, userId] }
                    : e
            ),
            users: state.users.map(u =>
                u.id === userId
                    ? { ...u, pointsPersonal: u.pointsPersonal + 1 }
                    : u
            ),
            currentUser: state.currentUser.id === userId
                ? { ...state.currentUser, pointsPersonal: state.currentUser.pointsPersonal + 1 }
                : state.currentUser
        }));
    },

    chooseBattleWinner: (battleId, winnerCrewId) => {
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

    redeemVoucher: (voucherId, userId) => {
        const { vouchers, users } = get();
        const voucher = vouchers.find(v => v.id === voucherId);
        const user = users.find(u => u.id === userId);

        if (voucher && user && user.pointsPersonal >= voucher.pointsCost) {
            set(state => ({
                users: state.users.map(u =>
                    u.id === userId ? { ...u, pointsPersonal: u.pointsPersonal - voucher.pointsCost } : u
                ),
                currentUser: state.currentUser.id === userId
                    ? { ...state.currentUser, pointsPersonal: state.currentUser.pointsPersonal - voucher.pointsCost }
                    : state.currentUser,
                vouchers: state.vouchers.map(v =>
                    v.id === voucherId ? { ...v, isRedeemed: true } : v
                )
            }));
            return true;
        }
        return false;
    }
}));
