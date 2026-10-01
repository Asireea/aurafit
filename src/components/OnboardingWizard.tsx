import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Flame,
  HeartPulse,
  Home,
  Loader2,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { db } from '../lib/db';
import { generateRecommendationsForUser } from '../lib/matching';
import { n8n } from '../lib/n8n';
import { ExperienceLevel, FitnessGoal, PreferredWorkoutType, User, UserProfile } from '../types';

interface OnboardingWizardProps {
  currentUser: User;
  currentProfile: UserProfile | null;
  onComplete: (profile: UserProfile) => void;
  onCancel?: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  currentUser,
  currentProfile,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Step 1: Basic Stats
  const [name, setName] = useState<string>(currentProfile?.name || 'Alex Chen');
  const [age, setAge] = useState<number>(currentProfile?.age || 29);
  const [currentWeight, setCurrentWeight] = useState<number>(currentProfile?.current_weight_kg || 74.0);
  const [targetWeight, setTargetWeight] = useState<number>(currentProfile?.target_weight_kg || 78.0);

  // Step 2: Fitness Goals & Preferences
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>(currentProfile?.fitness_goal || 'muscle_gain');
  const [workoutType, setWorkoutType] = useState<PreferredWorkoutType>(
    currentProfile?.preferred_workout_type || 'gym'
  );

  // Step 3: Experience Level
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    currentProfile?.experience_level || 'intermediate'
  );
  const [weeklyCommitment, setWeeklyCommitment] = useState<number>(4);

  const weightDelta = (targetWeight - currentWeight).toFixed(1);
  const weightDeltaNum = parseFloat(weightDelta);

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('Saving your fitness profile to repository...');

    try {
      const profileData: UserProfile = {
        user_id: currentUser.id,
        name: name.trim() || 'Client',
        age: Number(age),
        current_weight_kg: Number(currentWeight),
        target_weight_kg: Number(targetWeight),
        fitness_goal: fitnessGoal,
        experience_level: experienceLevel,
        preferred_workout_type: workoutType,
        updated_at: new Date().toISOString(),
      };

      // 1. Save profile in repository
      const savedProfile = await db.upsertUserProfile(profileData);

      // 2. Trigger matching algorithm calculation
      setStatusMessage('Calculating trainer compatibility scores...');
      const recs = await generateRecommendationsForUser(currentUser.id);

      // 3. Dispatch n8n Webhook
      setStatusMessage('Broadcasting USER_ONBOARDED & NEW_MATCH_GENERATED to n8n...');
      await n8n.notifyUserOnboarded(
        { id: currentUser.id, email: currentUser.email },
        { ...profileData, weeklyCommitment }
      );

      // Notify top matches to n8n
      const coaches = await db.getCoaches();
      const topMatches = recs.slice(0, 3).map((r) => {
        const c = coaches.find((coach) => coach.id === r.coach_id);
        return {
          coachId: r.coach_id,
          coachName: c?.name || 'Coach',
          score: r.recommendation_score,
          rate: c?.hourly_rate || 75,
        };
      });

      await n8n.notifyNewMatches(
        currentUser.id,
        currentUser.email,
        topMatches,
        recs.map((r) => r.id)
      );

      setStatusMessage('Matching complete!');
      setTimeout(() => {
        setIsSubmitting(false);
        onComplete(savedProfile);
      }, 500);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      setIsSubmitting(false);
      setStatusMessage('Error saving profile. Please check console.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-2xl backdrop-blur-xl">
        {/* Step Indicator Header */}
        <div className="border-b border-neutral-800 bg-neutral-950/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Client Onboarding Wizard
              </span>
              <h2 className="text-xl font-bold text-white">
                {step === 1 && 'Step 1: Your Body & Baseline Stats'}
                {step === 2 && 'Step 2: Goals & Preferred Workout Style'}
                {step === 3 && 'Step 3: Experience & Commitment'}
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-400">Step {step} of 3</span>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="p-6 sm:p-8">
          {/* STEP 1: Basic Stats */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min={16}
                    max={99}
                    required
                    value={age}
                    onChange={(e) => setAge(Math.max(16, parseInt(e.target.value) || 18))}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
                    Current Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={30}
                    max={250}
                    required
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 70)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
                    Target Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={30}
                    max={250}
                    required
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 70)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Target delta summary */}
              <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/40 p-4 text-xs">
                <span className="text-neutral-400">Target Weight Differential:</span>
                <span className={`font-mono font-semibold ${weightDeltaNum > 0 ? 'text-blue-400' : weightDeltaNum < 0 ? 'text-emerald-400' : 'text-neutral-200'}`}>
                  {weightDeltaNum > 0 ? `+${weightDelta} kg (Hypertrophy / Bulk)` : weightDeltaNum < 0 ? `${weightDelta} kg (Weight Loss Deficit)` : 'Maintenance (Body Recomposition)'}
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Fitness Goals & Preferences */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-3">
                  Primary Fitness Goal
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    {
                      id: 'weight_loss' as FitnessGoal,
                      title: 'Weight Loss & Lean Body',
                      desc: 'Caloric deficit, metabolic circuits, fat reduction',
                      icon: Flame,
                    },
                    {
                      id: 'muscle_gain' as FitnessGoal,
                      title: 'Muscle Gain & Hypertrophy',
                      desc: 'Progressive overload, muscle mass, strength development',
                      icon: Trophy,
                    },
                    {
                      id: 'endurance' as FitnessGoal,
                      title: 'Endurance & Cardio Capacity',
                      desc: 'VO2 max, stamina, marathon, cycling, and race conditioning',
                      icon: HeartPulse,
                    },
                    {
                      id: 'general_fitness' as FitnessGoal,
                      title: 'General Fitness & Longevity',
                      desc: 'Daily vitality, joint health, functional movement patterns',
                      icon: Sparkles,
                    },
                  ].map((goal) => {
                    const Icon = goal.icon;
                    const isSelected = fitnessGoal === goal.id;
                    return (
                      <button
                        type="button"
                        key={goal.id}
                        onClick={() => setFitnessGoal(goal.id)}
                        className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-sm ring-1 ring-emerald-500/50'
                            : 'border-neutral-800 bg-neutral-950/40 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/40'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isSelected ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{goal.title}</div>
                          <div className="text-xs text-neutral-400 mt-0.5">{goal.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-3">
                  Preferred Workout Environment
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { id: 'gym' as PreferredWorkoutType, label: 'Gym Facility', icon: Target },
                    { id: 'home' as PreferredWorkoutType, label: 'Home Setup', icon: Home },
                    { id: 'outdoor' as PreferredWorkoutType, label: 'Outdoor', icon: Compass },
                    { id: 'yoga' as PreferredWorkoutType, label: 'Yoga / Studio', icon: Zap },
                  ].map((type) => {
                    const Icon = type.icon;
                    const isSelected = workoutType === type.id;
                    return (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setWorkoutType(type.id)}
                        className={`flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/50'
                            : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <Icon className="h-5 w-5 mb-1.5" />
                        <span className="text-xs font-medium text-neutral-200">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Experience Level & Commitment */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-3">
                  Training Experience Level
                </label>
                <div className="space-y-3">
                  {[
                    {
                      id: 'beginner' as ExperienceLevel,
                      title: 'Beginner (0 – 1 Years)',
                      desc: 'New to formal training, learning foundational movement form and establishing consistent habits.',
                    },
                    {
                      id: 'intermediate' as ExperienceLevel,
                      title: 'Intermediate (1 – 3 Years)',
                      desc: 'Familiar with barbell or bodyweight fundamentals, seeking structured periodization and breaking plateaus.',
                    },
                    {
                      id: 'advanced' as ExperienceLevel,
                      title: 'Advanced (3+ Years)',
                      desc: 'Extensive training history, seeking precision coaching, injury prevention, and peak athletic performance.',
                    },
                  ].map((lvl) => {
                    const isSelected = experienceLevel === lvl.id;
                    return (
                      <button
                        type="button"
                        key={lvl.id}
                        onClick={() => setExperienceLevel(lvl.id)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500/50'
                            : 'border-neutral-800 bg-neutral-950/40 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500 text-neutral-950'
                              : 'border-neutral-700 bg-neutral-800'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{lvl.title}</div>
                          <div className="text-xs text-neutral-400 mt-1">{lvl.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Target Weekly Sessions
                  </label>
                  <span className="font-mono text-xs font-bold text-emerald-400">{weeklyCommitment} Days / Week</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={weeklyCommitment}
                  onChange={(e) => setWeeklyCommitment(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
                  <span>2 days (Light)</span>
                  <span>4 days (Standard)</span>
                  <span>6 days (Intense)</span>
                </div>
              </div>

              {statusMessage && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-neutral-800 pt-6">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-700 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              ) : onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-lg px-3 py-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors"
                >
                  Next Step
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Matching Coaches...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Calculate Matches & Sync n8n
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
