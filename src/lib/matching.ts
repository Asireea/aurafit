import { Coach, FitnessGoal, Recommendation, UserProfile } from '../types';
import { db } from './db';

export interface MatchResult {
  coach: Coach;
  score: number;
  reasons: string[];
}

/**
 * Goal to Specialty Affinity Map
 * Maps user fitness goals to coach specialties and tags with weightings
 */
const GOAL_AFFINITY_MAP: Record<FitnessGoal, string[]> = {
  weight_loss: ['weight_loss', 'general_fitness', 'hiit', 'nutrition', 'body_recomposition'],
  muscle_gain: ['muscle_gain', 'strength_training', 'hypertrophy', 'bodybuilding', 'gym'],
  endurance: ['endurance', 'cardio', 'running', 'triathlon', 'outdoor', 'stamina'],
  general_fitness: ['general_fitness', 'functional_fitness', 'mobility_yoga', 'wellness', 'home'],
};

/**
 * Calculates a match percentage score (0-100) between a user profile and coach
 */
export function calculateMatchScore(
  profile: UserProfile,
  coach: Coach
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const goalKeywords = GOAL_AFFINITY_MAP[profile.fitness_goal] || [];
  const normalizedCoachSpecialties = coach.specialties.map((s) => s.toLowerCase());

  // 1. Direct Goal Match (up to 45 points)
  const exactGoalMatch = normalizedCoachSpecialties.some((spec) =>
    spec.includes(profile.fitness_goal.toLowerCase())
  );

  const relatedGoalMatchCount = goalKeywords.filter((kw) =>
    normalizedCoachSpecialties.some((spec) => spec.includes(kw))
  ).length;

  if (exactGoalMatch) {
    score += 45;
    const readableGoal = profile.fitness_goal.replace('_', ' ');
    reasons.push(`Direct specialty alignment in ${readableGoal}`);
  } else if (relatedGoalMatchCount > 0) {
    const points = Math.min(38, relatedGoalMatchCount * 14);
    score += points;
    reasons.push(`Strong overlap with your ${profile.fitness_goal.replace('_', ' ')} target`);
  } else {
    // General fitness baseline
    score += 15;
  }

  // 2. Experience Level Compatibility (up to 30 points)
  const coachTargetLevels = coach.target_experience_levels.map((l) => l.toLowerCase());
  const userLevel = profile.experience_level.toLowerCase();

  if (coachTargetLevels.includes(userLevel)) {
    score += 30;
    reasons.push(`Certified & structured for ${profile.experience_level} trainees`);
  } else {
    // Partial penalty if coach doesn't target this level
    score += 5;
  }

  // 3. Preferred Workout Type & Environment (up to 20 points)
  const preferredType = profile.preferred_workout_type.toLowerCase();
  const environmentMatch =
    normalizedCoachSpecialties.some((spec) => spec.includes(preferredType)) ||
    coach.bio.toLowerCase().includes(preferredType);

  if (environmentMatch) {
    score += 20;
    reasons.push(`Offers specialized ${profile.preferred_workout_type} workout protocols`);
  } else {
    score += 8;
  }

  // 4. Client Ratings & Credential Bonus (up to 5 points)
  if (coach.rating && coach.rating >= 4.9) {
    score += 5;
    reasons.push(`Top-rated coach (${coach.rating.toFixed(2)}/5.0 from ${coach.review_count || 10}+ reviews)`);
  } else {
    score += 2;
  }

  // Clamp score between 0 and 100
  const finalScore = Math.max(10, Math.min(99, Math.round(score)));

  return {
    score: finalScore,
    reasons,
  };
}

/**
 * Runs matching engine for a specific user and records recommendations in the database
 */
export async function generateRecommendationsForUser(userId: string): Promise<Recommendation[]> {
  const profile = await db.getUserProfile(userId);
  if (!profile) {
    throw new Error(`User profile not found for user ID: ${userId}`);
  }

  const coaches = await db.getCoaches();
  const createdRecs: Recommendation[] = [];

  for (const coach of coaches) {
    const { score, reasons } = calculateMatchScore(profile, coach);

    // Persist recommendation
    const rec = await db.createRecommendation({
      user_id: userId,
      coach_id: coach.id,
      recommendation_score: score,
      status: 'pending_notification',
      match_reasons: reasons,
    });

    createdRecs.push(rec);
  }

  // Sort by recommendation score descending
  return createdRecs.sort((a, b) => b.recommendation_score - a.recommendation_score);
}
