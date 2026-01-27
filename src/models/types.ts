export type User = {
  id: string;
  nick: string;
  avatar: string;
  bio: string;
  location: string;
  pointsPersonal: number;
  cars: Car[];
};

export type Car = {
  id: string;
  brand: string;
  model: string;
  year: number;
  hp: number;
  mods: string[];
  photos: string[];
};

export type Crew = {
  id: string;
  name: string;
  badge: string;
  privacy: 'inviteOnly' | 'public';
  members: string[]; // User IDs
  scoreCrew: number;
  createdBy: string; // User ID
  invites: string[]; // Invite codes
};

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type CrewEvent = {
  id: string;
  crewId: string;
  title: string;
  dateTime: string;
  location: string;
  description: string;
  capacity: number;
  attendees: string[]; // User IDs
  status: EventStatus;
};

export type ChatMessage = {
  id: string;
  crewId: string;
  userId: string;
  text: string;
  createdAt: string;
};

export type Battle = {
  id: string;
  crewA: string; // Crew ID
  crewB: string; // Crew ID
  winnerCrewId?: string;
  decidedByAdmin: boolean;
  createdAt: string;
};

export type RewardVoucher = {
  id: string;
  brand: string;
  title: string;
  description: string;
  pointsCost: number;
  code: string;
  expiresAt: string;
  isRedeemed?: boolean;
};
