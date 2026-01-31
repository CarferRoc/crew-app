export type User = {
  id: string;
  username: string; // matches DB column
  avatar_url: string; // matches DB column
  bio: string;
  location: string;
  role: 'user' | 'lider' | 'admin';
  pointsPersonal: number;
  cars: Car[];
};

export type CrewRole = 'member' | 'crew_lider';

export type CrewMember = {
  crewId: string;
  userId: string;
  role: CrewRole;
  joinedAt: string;
};

export type Conversation = {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessage?: string;
  updatedAt: string;
};

export type DirectMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  type?: 'text' | 'image' | 'file';
  media_url?: string;
};

export type Car = {
  id: string;
  brand: string;
  model: string;
  year: number;
  hp: number;
  nickname?: string;
  description?: string;
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
  inviteCode?: string; // Single invite code for joining
  isVerified?: boolean;
};

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'pending';

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
  latitude?: number;
  longitude?: number;
  image_url?: string;
  requester_id?: string;
  jointCrewIds?: string[];
};

export type CrewAlliance = {
  id: string;
  requesterCrewId: string;
  targetCrewId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  partnerCrew?: { // For UI
    id: string;
    name: string;
    image_url?: string;
  };
};

export type ChatMessage = {
  id: string;
  crewId: string;
  profileId: string;
  content: string;
  createdAt: string;
  type?: 'text' | 'image' | 'file';
  media_url?: string;
  user?: any; // For UI rendering optimistically
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
