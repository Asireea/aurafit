export type UserRole = 'client' | 'admin';

export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'endurance' | 'general_fitness';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type PreferredWorkoutType = 'gym' | 'home' | 'outdoor' | 'yoga';

export type RecommendationStatus = 'pending_notification' | 'notified' | 'accepted' | 'rejected';

export interface User {
  id: string; // UUID
  email: string;
  role: UserRole;
  created_at: string; // Timestamp
}

export interface UserProfile {
  user_id: string; // Foreign Key to users.id
  name: string;
  age: number; // Integer
  current_weight_kg: number; // Decimal
  target_weight_kg: number; // Decimal
  fitness_goal: FitnessGoal;
  experience_level: ExperienceLevel;
  preferred_workout_type: PreferredWorkoutType;
  updated_at: string; // Timestamp
}

export interface Coach {
  id: string; // UUID
  name: string;
  bio: string;
  avatar_url: string;
  specialties: string[]; // Array of Enum strings: e.g. ['weight_loss', 'muscle_gain', ...]
  target_experience_levels: ExperienceLevel[]; // Array of Enum strings
  hourly_rate: number; // Decimal
  created_at: string; // Timestamp
  rating?: number;
  review_count?: number;
  location?: string;
  certifications?: string[];
}

export interface Recommendation {
  id: string; // UUID
  user_id: string; // UUID
  coach_id: string; // UUID
  recommendation_score: number; // Integer 0-100
  status: RecommendationStatus;
  created_at: string; // Timestamp
  match_reasons?: string[];
}

export interface EnrichedRecommendation extends Recommendation {
  coach?: Coach;
  user_profile?: UserProfile;
}

export interface N8nConfig {
  webhookUrl: string;
  apiKey?: string;
  enabled: boolean;
  autoDispatchOnOnboard: boolean;
  autoDispatchOnMatch: boolean;
}

export type N8nEventType =
  | 'USER_ONBOARDED'
  | 'NEW_MATCH_GENERATED'
  | 'NOTIFICATION_BATCH'
  | 'RECOMMENDATION_STATUS_CHANGED'
  | 'TEST_PING';

export interface N8nWebhookPayload {
  event: N8nEventType;
  timestamp: string;
  source: 'AuraFit-Web';
  data: Record<string, unknown>;
}

export interface N8nLogEntry {
  id: string;
  event: N8nEventType;
  timestamp: string;
  status: 'success' | 'simulated' | 'failed';
  httpStatus?: number;
  payload: N8nWebhookPayload;
  response?: string;
}
