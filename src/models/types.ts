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
  email?: string;
  created_at?: string;
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
  id: string; // UUID in Supabase
  // cars_liga columns
  brand: string;
  model: string;
  production_years: string; // e.g. "2008-2012"
  from_year?: number;
  to_year?: number; // Can be null (present)
  body_style?: string;
  segment?: string;
  title?: string;
  description?: string;

  // Engine
  engine_specs_title?: string;
  cylinders?: string; // Text like "V8" or number
  displacement?: string;
  power?: string; // Raw text e.g. "420 HP @ 8300 RPM"
  torque?: string;
  fuel_system?: string;
  fuel?: string;
  fuel_capacity?: string;

  // Performance
  top_speed?: string; // Text "300 km/h"
  acceleration?: string; // "4.6 s"
  aerodynamics?: string;

  // Drivetrain
  drive_type?: string;
  gearbox?: string;

  // Chassis / Dimensions
  front_brakes?: string;
  rear_brakes?: string;
  tire_size?: string;
  length?: string;
  width?: string;
  height?: string;
  front_rear_track?: string;
  wheelbase?: string;
  cargo_volume?: string;
  unladen_weight?: string;
  gross_weight_limit?: string;
  ground_clearance?: string;

  // Consumption
  city?: string;
  highway?: string;
  combined?: string;
  co2_emissions?: string;

  // Media
  brand_url?: string;
  brand_logo_url?: string;
  model_url?: string;
  image_urls?: string[]; // Array of URLs
  image_file_names?: string[];
  total_images?: number;

  // Game Props (Computed / Legacy support)
  hp?: number; // Parsed numerical HP
  year?: number; // Parsed Year
  price?: number; // Calculated price
  isUsed?: boolean; // Market status

  // Legacy Game Stats
  stats?: CarStats;
  baseStats?: CarStats;
  parts: CarPart[];
};


export type League = {
  id: string;
  name: string;
  code: string;
  level: number;
  description: string;
  created_by?: string;
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
  location?: string;
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

// Consolidated League type in line 97

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
