import { Coach, Recommendation, RecommendationStatus, User, UserProfile } from '../types';

// Asset references for default seed coaches
const COACH_MARCUS_IMG = '/src/assets/images/coach_marcus_strength_1790871175255.jpg';
const COACH_ELENA_IMG = '/src/assets/images/coach_elena_yoga_1790871187116.jpg';
const COACH_DAVID_IMG = '/src/assets/images/coach_david_endurance_1790871197324.jpg';
const COACH_SOPHIA_IMG = '/src/assets/images/coach_sophia_weightloss_1790871207721.jpg';

export interface DatabaseState {
  users: User[];
  user_profiles: UserProfile[];
  coaches: Coach[];
  recommendations: Recommendation[];
}

const STORAGE_KEY = 'aurafit_database_v1';

// Seed Initial Data
const INITIAL_COACHES: Coach[] = [
  {
    id: 'coach-1',
    name: 'Marcus Vance',
    bio: 'Former collegiate strength & conditioning coach with 9+ years experience. Specializes in hypertrophy, progressive overload biomechanics, and sustainable muscle gain for busy professionals.',
    avatar_url: COACH_MARCUS_IMG,
    specialties: ['muscle_gain', 'strength_training', 'gym', 'general_fitness'],
    target_experience_levels: ['beginner', 'intermediate', 'advanced'],
    hourly_rate: 85,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    rating: 4.96,
    review_count: 48,
    location: 'Austin, TX (Remote & Hybrid)',
    certifications: ['CSCS', 'NASM-PES', 'Precision Nutrition L1'],
  },
  {
    id: 'coach-2',
    name: 'Elena Rostova',
    bio: 'Mobility specialist, certified Vinyasa yoga instructor, and functional rehabilitation trainer. Focused on postural alignment, joint longevity, core control, and breathwork.',
    avatar_url: COACH_ELENA_IMG,
    specialties: ['yoga', 'general_fitness', 'home', 'outdoor'],
    target_experience_levels: ['beginner', 'intermediate'],
    hourly_rate: 75,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    rating: 4.98,
    review_count: 62,
    location: 'Boulder, CO (Remote)',
    certifications: ['RYT-500', 'FRC Mobility Specialist', 'ACE-CPT'],
  },
  {
    id: 'coach-3',
    name: 'David Okafor',
    bio: 'Endurance coach, 3x Ironman finisher, and VO2-max specialist. Helps runners and endurance athletes build aerobic stamina, prevent repetitive strain injuries, and peak for race day.',
    avatar_url: COACH_DAVID_IMG,
    specialties: ['endurance', 'outdoor', 'general_fitness'],
    target_experience_levels: ['intermediate', 'advanced'],
    hourly_rate: 90,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    rating: 4.92,
    review_count: 37,
    location: 'Seattle, WA (Remote)',
    certifications: ['USATF Level 2', 'UESCA Ultra Running', 'EXOS Performance'],
  },
  {
    id: 'coach-4',
    name: 'Sophia Martinez',
    bio: 'Passionate metabolic conditioning and body transformation coach. Specializes in sustainable fat loss, habit building, and high-energy home and gym circuit workouts with zero crash dieting.',
    avatar_url: COACH_SOPHIA_IMG,
    specialties: ['weight_loss', 'general_fitness', 'home', 'gym'],
    target_experience_levels: ['beginner', 'intermediate'],
    hourly_rate: 70,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    rating: 4.95,
    review_count: 53,
    location: 'Miami, FL (Remote & Hybrid)',
    certifications: ['NASM-CPT', 'FMS Level 1', 'ISSN Sports Nutrition'],
  },
];

const INITIAL_USERS: User[] = [
  {
    id: 'user-client-1',
    email: 'alex.chen@example.com',
    role: 'client',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'user-client-2',
    email: 'sarah.jenkins@example.com',
    role: 'client',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'user-admin-1',
    email: 'admin@aurafit.internal',
    role: 'admin',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
  },
];

const INITIAL_PROFILES: UserProfile[] = [
  {
    user_id: 'user-client-1',
    name: 'Alex Chen',
    age: 29,
    current_weight_kg: 72.5,
    target_weight_kg: 78.0,
    fitness_goal: 'muscle_gain',
    experience_level: 'intermediate',
    preferred_workout_type: 'gym',
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    user_id: 'user-client-2',
    name: 'Sarah Jenkins',
    age: 34,
    current_weight_kg: 84.0,
    target_weight_kg: 72.0,
    fitness_goal: 'weight_loss',
    experience_level: 'beginner',
    preferred_workout_type: 'home',
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec-1',
    user_id: 'user-client-1',
    coach_id: 'coach-1',
    recommendation_score: 95,
    status: 'pending_notification',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    match_reasons: [
      'High alignment on Muscle Gain goal',
      'Matches intermediate gym programming',
      'Proven hypertrophy strength track record',
    ],
  },
  {
    id: 'rec-2',
    user_id: 'user-client-1',
    coach_id: 'coach-4',
    recommendation_score: 72,
    status: 'notified',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    match_reasons: [
      'Supports strength & general fitness',
      'Provides gym workout structure',
    ],
  },
  {
    id: 'rec-3',
    user_id: 'user-client-2',
    coach_id: 'coach-4',
    recommendation_score: 96,
    status: 'pending_notification',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    match_reasons: [
      '100% Match for Weight Loss & Habit Change',
      'Specialized in Beginner Home Workouts',
      'High client retention in body recomposition',
    ],
  },
  {
    id: 'rec-4',
    user_id: 'user-client-2',
    coach_id: 'coach-2',
    recommendation_score: 82,
    status: 'pending_notification',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    match_reasons: [
      'Home workout and joint mobility focus',
      'Beginner-friendly low impact progression',
    ],
  },
];

/**
 * Flexible Data Repository Pattern
 * Provides a unified asynchronous interface. Automatically falls back to
 * persistent LocalStorage and JSON data representation.
 */
class DataRepository {
  private memoryCache: DatabaseState | null = null;

  private loadData(): DatabaseState {
    if (this.memoryCache) {
      return this.memoryCache;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DatabaseState;
        if (parsed.users && parsed.coaches && parsed.user_profiles && parsed.recommendations) {
          this.memoryCache = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using in-memory defaults:', e);
    }

    const initial: DatabaseState = {
      users: INITIAL_USERS,
      user_profiles: INITIAL_PROFILES,
      coaches: INITIAL_COACHES,
      recommendations: INITIAL_RECOMMENDATIONS,
    };

    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseState): void {
    this.memoryCache = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // --- Users Operations ---
  async getUsers(): Promise<User[]> {
    const data = this.loadData();
    return [...data.users];
  }

  async getUserById(id: string): Promise<User | null> {
    const data = this.loadData();
    return data.users.find((u) => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const data = this.loadData();
    const normalized = email.toLowerCase().trim();
    return data.users.find((u) => u.email.toLowerCase().trim() === normalized) || null;
  }

  async createUser(user: Omit<User, 'id' | 'created_at'> & Partial<Pick<User, 'id' | 'created_at'>>): Promise<User> {
    const data = this.loadData();
    const newUser: User = {
      id: user.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: user.email.toLowerCase().trim(),
      role: user.role,
      created_at: user.created_at || new Date().toISOString(),
    };

    data.users.push(newUser);
    this.saveData(data);
    return newUser;
  }

  // --- User Profiles Operations ---
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const data = this.loadData();
    return data.user_profiles.find((p) => p.user_id === userId) || null;
  }

  async upsertUserProfile(profile: UserProfile): Promise<UserProfile> {
    const data = this.loadData();
    const index = data.user_profiles.findIndex((p) => p.user_id === profile.user_id);
    const updatedProfile: UserProfile = {
      ...profile,
      updated_at: new Date().toISOString(),
    };

    if (index >= 0) {
      data.user_profiles[index] = updatedProfile;
    } else {
      data.user_profiles.push(updatedProfile);
    }

    this.saveData(data);
    return updatedProfile;
  }

  // --- Coaches Operations ---
  async getCoaches(): Promise<Coach[]> {
    const data = this.loadData();
    return [...data.coaches];
  }

  async getCoachById(id: string): Promise<Coach | null> {
    const data = this.loadData();
    return data.coaches.find((c) => c.id === id) || null;
  }

  async createCoach(coach: Omit<Coach, 'id' | 'created_at'>): Promise<Coach> {
    const data = this.loadData();
    const newCoach: Coach = {
      ...coach,
      id: `coach-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      rating: coach.rating ?? 5.0,
      review_count: coach.review_count ?? 1,
    };

    data.coaches.unshift(newCoach);
    this.saveData(data);
    return newCoach;
  }

  async updateCoach(id: string, updates: Partial<Coach>): Promise<Coach | null> {
    const data = this.loadData();
    const index = data.coaches.findIndex((c) => c.id === id);
    if (index < 0) return null;

    const updated = {
      ...data.coaches[index],
      ...updates,
    };
    data.coaches[index] = updated;
    this.saveData(data);
    return updated;
  }

  async deleteCoach(id: string): Promise<boolean> {
    const data = this.loadData();
    const originalLen = data.coaches.length;
    data.coaches = data.coaches.filter((c) => c.id !== id);
    data.recommendations = data.recommendations.filter((r) => r.coach_id !== id);
    this.saveData(data);
    return data.coaches.length < originalLen;
  }

  // --- Recommendations Operations ---
  async getRecommendations(userId?: string): Promise<Recommendation[]> {
    const data = this.loadData();
    if (userId) {
      return data.recommendations.filter((r) => r.user_id === userId);
    }
    return [...data.recommendations];
  }

  async createRecommendation(
    rec: Omit<Recommendation, 'id' | 'created_at'> & Partial<Pick<Recommendation, 'id' | 'created_at'>>
  ): Promise<Recommendation> {
    const data = this.loadData();
    const newRec: Recommendation = {
      ...rec,
      id: rec.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: rec.created_at || new Date().toISOString(),
    };

    // Remove existing recommendation for the same user and coach if any
    data.recommendations = data.recommendations.filter(
      (r) => !(r.user_id === newRec.user_id && r.coach_id === newRec.coach_id)
    );

    data.recommendations.push(newRec);
    this.saveData(data);
    return newRec;
  }

  async updateRecommendationStatus(id: string, status: RecommendationStatus): Promise<Recommendation | null> {
    const data = this.loadData();
    const index = data.recommendations.findIndex((r) => r.id === id);
    if (index < 0) return null;

    data.recommendations[index] = {
      ...data.recommendations[index],
      status,
    };
    this.saveData(data);
    return data.recommendations[index];
  }

  async batchUpdateRecommendations(ids: string[], status: RecommendationStatus): Promise<number> {
    const data = this.loadData();
    let updatedCount = 0;
    const idSet = new Set(ids);

    data.recommendations = data.recommendations.map((r) => {
      if (idSet.has(r.id)) {
        updatedCount++;
        return { ...r, status };
      }
      return r;
    });

    this.saveData(data);
    return updatedCount;
  }

  // --- Utility & Testing Helpers ---
  resetToDefaults(): DatabaseState {
    const defaults: DatabaseState = {
      users: INITIAL_USERS,
      user_profiles: INITIAL_PROFILES,
      coaches: INITIAL_COACHES,
      recommendations: INITIAL_RECOMMENDATIONS,
    };
    this.saveData(defaults);
    return defaults;
  }

  exportDbJson(): string {
    const data = this.loadData();
    return JSON.stringify(data, null, 2);
  }

  importDbJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString) as DatabaseState;
      if (parsed.users && parsed.coaches && parsed.user_profiles && parsed.recommendations) {
        this.saveData(parsed);
        return true;
      }
    } catch (e) {
      console.error('Invalid DB JSON format:', e);
    }
    return false;
  }
}

export const db = new DataRepository();
