import { Crew, User, Car, CrewEvent, Battle, RewardVoucher } from '../models/types';

export const MOCK_CARS: Car[] = [
    { id: 'c1', brand: 'BMW', model: 'M3 G80', year: 2023, hp: 510, mods: ['Exhaust', 'Wheels'], photos: ['https://example.com/bmw.jpg'] },
    { id: 'c2', brand: 'Nissan', model: 'GT-R R35', year: 2021, hp: 600, mods: ['Turbo kit'], photos: ['https://example.com/gtr.jpg'] },
    { id: 'c3', brand: 'Toyota', model: 'Supra A90', year: 2022, hp: 450, mods: ['Downpipe'], photos: ['https://example.com/supra.jpg'] },
    { id: 'c4', brand: 'Porsche', model: '911 GT3', year: 2022, hp: 502, mods: ['Stock'], photos: ['https://example.com/porsche.jpg'] },
    { id: 'c5', brand: 'VW', model: 'Golf R', year: 2020, hp: 320, mods: ['Remap'], photos: ['https://example.com/golf.jpg'] },
];

export const MOCK_USERS: User[] = [
    { id: 'u1', nick: 'RaceKing', avatar: 'https://i.pravatar.cc/150?u=u1', bio: 'Living on the edge.', location: 'Madrid', pointsPersonal: 120, cars: [MOCK_CARS[0]] },
    { id: 'u2', nick: 'DriftQueen', avatar: 'https://i.pravatar.cc/150?u=u2', bio: 'Sidle it.', location: 'Barcelona', pointsPersonal: 85, cars: [MOCK_CARS[1]] },
    { id: 'user_me', nick: 'CarlosDev', avatar: 'https://i.pravatar.cc/150?u=me', bio: 'Senior Mobile Engineer', location: 'Valencia', pointsPersonal: 50, cars: [MOCK_CARS[2], MOCK_CARS[3]] },
];

export const MOCK_CREWS: Crew[] = [
    { id: 'crew1', name: 'Elite Tuners', badge: '🏎️', privacy: 'inviteOnly', members: ['u1', 'user_me'], scoreCrew: 450, createdBy: 'u1', invites: ['ELITE123'] },
    { id: 'crew2', name: 'Midnight Drifters', badge: '🌙', privacy: 'inviteOnly', members: ['u2'], scoreCrew: 320, createdBy: 'u2', invites: ['DRIFT99'] },
    { id: 'crew3', name: 'JDM Squad', badge: '🔰', privacy: 'inviteOnly', members: ['u1', 'u2'], scoreCrew: 510, createdBy: 'u1', invites: ['JDM4LIFE'] },
];

export const MOCK_EVENTS: CrewEvent[] = [
    { id: 'e1', crewId: 'crew1', title: 'Mountain Pass Run', dateTime: '2026-02-10T21:00:00Z', location: 'A-7 Pass', description: 'Night run through the curves.', capacity: 10, attendees: ['u1', 'user_me'], status: 'upcoming' },
    { id: 'e2', crewId: 'crew2', title: 'Parking Meet', dateTime: '2026-02-15T18:00:00Z', location: 'Shopping Center', description: 'Chill and chat.', capacity: 20, attendees: ['u2'], status: 'upcoming' },
];

export const MOCK_BATTLES: Battle[] = [
    { id: 'b1', crewA: 'crew1', crewB: 'crew2', winnerCrewId: 'crew1', decidedByAdmin: true, createdAt: '2026-01-20T12:00:00Z' },
    { id: 'b2', crewA: 'crew3', crewB: 'crew1', winnerCrewId: undefined, decidedByAdmin: false, createdAt: '2026-01-25T15:00:00Z' },
];

export const MOCK_VOUCHERS: RewardVoucher[] = [
    { id: 'v1', brand: 'TuningMaster', title: '20% Off Remap', description: 'Unlock your cars potential.', pointsCost: 100, code: 'TUNING20', expiresAt: '2026-12-31' },
    { id: 'v2', brand: 'WheelHub', title: '100€ Voucher', description: 'Discount for new rims.', pointsCost: 300, code: 'WHEELS100', expiresAt: '2026-12-31' },
    { id: 'v3', brand: 'GlossPro', title: 'Full Detailing', description: 'Professional car cleaning.', pointsCost: 200, code: 'CLEANFREE', expiresAt: '2026-06-30' },
];
