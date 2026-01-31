export type User = {
  id: string;
  username: string; // matches DB column
  avatar_url: string; // matches DB column
  bio: string;
  location: string;
  role: 'user' | 'lider' | 'admin';
  pointsPersonal: number;
  saldo: number; // Added for Budget/Market
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

// GAMEPLAY TYPES

export interface CarStats {
  ac: number; // Aceleración (0-100)
  mn: number; // Manejo (0-100)
  tr: number; // Tracción (0-100)
  cn: number; // Consumo (0-100)
  es: number; // Estética (0-100)
  fi: number; // Fiabilidad (0-100)
}

export type PartType = 'tires' | 'turbo' | 'intercooler' | 'suspension' | 'transmission';
export type PartQuality = 'low' | 'mid' | 'high';

export interface CarPart {
  id: string;
  name: string;
  type: PartType;
  quality: PartQuality;
  bonusStats: Partial<CarStats>;
  price: number;
}

export type Car = {
  id: string;
  // Real Columns (CSV / Supabase 'cars')
  brand: string; // "Make"
  model: string; // "Model"
  year: number;  // "Year"
  hp: number;    // "Engine HP"
  cylinders?: number; // "Engine Cylinders"
  transmission?: string; // "Transmission Type"
  drivetrain?: string; // "Driven_Wheels"
  style?: string; // "Vehicle Style"
  size?: string; // "Vehicle Size"
  category?: string; // "Market Category"
  cityMpg?: number; // "city mpg"
  highwayMpg?: number; // "highway MPG"
  popularity?: number; // "Popularity"
  msrp?: number; // "MSRP" - Base value

  // Game Props
  nickname?: string;
  description?: string;
  mods: string[]; // Legacy (keep to avoid break)
  parts: CarPart[]; // New Antigravity Parts
  photos: string[];

  // Game Stats
  stats: CarStats; // Dynamic Stats
  baseStats?: CarStats; // Stock Stats
  isStock: boolean;

  puntuacion?: number; // Legacy rating
  valorMercado?: number; // Calculated Value
};

export type League = {
  id: string;
  name: string;
  code: string;
  created_by: string;
  created_at?: string;
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
  // Ranking System
  leagueId?: string;
  leagueName?: string;
  leagueLevel?: number;
  totalSeasonPoints?: number;
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

  // Antigravity Event Props
  eventType: 'drift' | 'offroad' | 'consumption' | 'aesthetic' | 'acceleration';
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

export interface MarketBid {
  itemId: string;
  itemType: 'car' | 'part';
  amount: number;
  bidAt: string;
  itemData: any; // Store the item snapshot to handle stats/pricing at auction end
}

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

// Ranking System Types

export type League = {
  id: string;
  name: string;
  level: number;
  description: string;
};

export type ClanWarEvent = {
  id: string;
  name: string;
  event_date: string;
  status: 'pending' | 'active' | 'completed';
  created_at: string;
};

export type EventParticipation = {
  id: string;
  event_id: string;
  crew_id: string;
  total_score: number;
  rank: number;
  bonus_points: number;
  crew?: {
    name: string;
    badge: string;
  };
};

export type CarEvaluation = {
  id: string;
  event_id: string;
  crew_id: string;
  member_id: string;
  car_name: string;
  car_image_url?: string;
  score_aesthetics: number;
  score_power: number;
  score_sound: number;
  score_x_factor: number;
  admin_notes?: string;
  total_score?: number; // Calculated field
};

export type GarageCar = {
  id: string;
  userId: string;
  name: string;
  nickname: string;
  power: string; // Text or number, effectively text for simplicity if user types "300 HP"
  specs: string; // Long text
  photos: string[];
  createdAt: string;
};
