import React, { useState } from 'react';
import {
  ArrowUpDown,
  Bell,
  CheckCircle2,
  Clock,
  Dumbbell,
  Filter,
  Flame,
  HeartPulse,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  User,
  Zap,
} from 'lucide-react';
import { Coach, Recommendation, RecommendationStatus, User as UserType, UserProfile } from '../types';
import { CoachCard } from './CoachCard';
import { CoachDetailModal } from './CoachDetailModal';

interface ClientDashboardProps {
  currentUser: UserType;
  currentProfile: UserProfile | null;
  coaches: Coach[];
  recommendations: Recommendation[];
  onOpenWizard: () => void;
  onOpenN8nModal: () => void;
  onTriggerNotification: (recId: string, coach: Coach) => void;
  onTriggerBatchNotification: () => Promise<void>;
  onUpdateStatus: (recId: string, status: RecommendationStatus) => void;
  onRecalculateMatches: () => Promise<void>;
  isDispatching?: boolean;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  currentUser,
  currentProfile,
  coaches,
  recommendations,
  onOpenWizard,
  onOpenN8nModal,
  onTriggerNotification,
  onTriggerBatchNotification,
  onUpdateStatus,
  onRecalculateMatches,
  isDispatching = false,
}) => {
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [selectedRec, setSelectedRec] = useState<Recommendation | undefined>(undefined);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'price_asc' | 'price_desc'>('score');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const pendingRecs = recommendations.filter((r) => r.status === 'pending_notification');

  const handleViewDetails = (coach: Coach, rec?: Recommendation) => {
    setSelectedCoach(coach);
    setSelectedRec(rec);
    setIsDetailOpen(true);
  };

  // Combine recommendations with coach objects
  const matchedCoaches = coaches
    .map((coach) => {
      const rec = recommendations.find((r) => r.coach_id === coach.id);
      return {
        coach,
        recommendation: rec,
        score: rec?.recommendation_score ?? 70,
        status: rec?.status ?? 'pending_notification',
      };
    })
    // Search filter
    .filter(({ coach }) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        coach.name.toLowerCase().includes(q) ||
        coach.bio.toLowerCase().includes(q) ||
        coach.specialties.some((s) => s.toLowerCase().includes(q))
      );
    })
    // Specialty filter
    .filter(({ coach }) => {
      if (filterSpecialty === 'all') return true;
      return coach.specialties.includes(filterSpecialty);
    })
    // Status filter
    .filter(({ status }) => {
      if (filterStatus === 'all') return true;
      return status === filterStatus;
    })
    // Sorting
    .sort((a, b) => {
      if (sortBy === 'score') {
        return b.score - a.score;
      }
      if (sortBy === 'price_asc') {
        return a.coach.hourly_rate - b.coach.hourly_rate;
      }
      if (sortBy === 'price_desc') {
        return b.coach.hourly_rate - a.coach.hourly_rate;
      }
      return 0;
    });

  const weightDelta = currentProfile
    ? (currentProfile.target_weight_kg - currentProfile.current_weight_kg).toFixed(1)
    : '0';

  return (
    <div className="space-y-8">
      {/* Client Profile Summary Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Personalized Matching Dashboard
              </span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400 font-mono">
                {recommendations.length} Active Trainer Recommendations
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {currentProfile?.name || 'Athlete'}
            </h1>

            <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Our matching algorithm analyzed your target fitness goal, training experience level, and preferred workout environment to curate top-tier personal coaches.
            </p>
          </div>

          {/* User Stats Card */}
          {currentProfile ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 shrink-0">
              <div className="px-3 py-1 border-r border-neutral-800">
                <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                  Primary Goal
                </div>
                <div className="text-sm font-bold text-white capitalize mt-0.5">
                  {currentProfile.fitness_goal.replace('_', ' ')}
                </div>
              </div>

              <div className="px-3 py-1 border-r border-neutral-800">
                <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                  Target Weight
                </div>
                <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
                  {currentProfile.current_weight_kg}kg → {currentProfile.target_weight_kg}kg
                </div>
              </div>

              <div className="px-3 py-1">
                <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                  Level / Style
                </div>
                <div className="text-sm font-semibold text-neutral-200 capitalize mt-0.5">
                  {currentProfile.experience_level} · {currentProfile.preferred_workout_type}
                </div>
              </div>

              <button
                onClick={onOpenWizard}
                className="ml-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 px-3 py-2 text-xs font-semibold text-white transition-colors"
              >
                Edit Stats
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenWizard}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="h-4 w-4" />
              <span>Complete Profile Wizard</span>
            </button>
          )}
        </div>

        {/* Action Banner for n8n Webhook Batch Dispatch */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>n8n Webhook Sync Active</span>
                {pendingRecs.length > 0 && (
                  <span className="text-[10px] font-mono font-semibold rounded bg-amber-500/20 px-1.5 py-0.2 text-amber-300">
                    {pendingRecs.length} Pending Notification
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                Trigger n8n automation workflow immediately or send batch notifications to selected trainers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onTriggerBatchNotification}
              disabled={isDispatching || pendingRecs.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 disabled:opacity-40 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send Notification Batch ({pendingRecs.length})</span>
            </button>

            <button
              onClick={onOpenN8nModal}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700 transition-colors"
            >
              n8n Settings
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Sorting Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by coach name, specialty..."
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900/90 pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Specialty Filter */}
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="rounded-xl border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">All Specialties</option>
            <option value="muscle_gain">Muscle Gain</option>
            <option value="strength_training">Strength Training</option>
            <option value="weight_loss">Weight Loss</option>
            <option value="endurance">Endurance</option>
            <option value="yoga">Yoga & Mobility</option>
            <option value="general_fitness">General Fitness</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending_notification">Pending Notification</option>
            <option value="notified">Notified via n8n</option>
            <option value="accepted">Accepted Matches</option>
          </select>
        </div>

        {/* Sorting & Recalculate */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" />
            <span>Sort by:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'score' | 'price_asc' | 'price_desc')}
            className="rounded-xl border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-xs font-medium text-white focus:outline-none"
          >
            <option value="score">Highest Match Score</option>
            <option value="price_asc">Hourly Rate: Low to High</option>
            <option value="price_desc">Hourly Rate: High to Low</option>
          </select>

          <button
            onClick={onRecalculateMatches}
            title="Recalculate matching scores with current profile"
            className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Recalculate</span>
          </button>
        </div>
      </div>

      {/* Coach Cards Grid */}
      {matchedCoaches.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-12 text-center">
          <Dumbbell className="mx-auto h-10 w-10 text-neutral-600 mb-3" />
          <h3 className="text-base font-bold text-white">No Coaches Match Your Active Filter</h3>
          <p className="mt-1 text-xs text-neutral-400 max-w-md mx-auto">
            Try resetting your search query, selecting &quot;All Specialties&quot;, or retaking the onboarding wizard with broader preferences.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterSpecialty('all');
                setFilterStatus('all');
              }}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700"
            >
              Reset Filters
            </button>
            <button
              onClick={onOpenWizard}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400"
            >
              Retake Onboarding Wizard
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matchedCoaches.map(({ coach, recommendation }) => (
            <CoachCard
              key={coach.id}
              coach={coach}
              recommendation={recommendation}
              onViewDetails={handleViewDetails}
              onTriggerNotification={onTriggerNotification}
              onUpdateStatus={onUpdateStatus}
              isDispatching={isDispatching}
            />
          ))}
        </div>
      )}

      {/* Coach Details Modal */}
      <CoachDetailModal
        coach={selectedCoach}
        recommendation={selectedRec}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdateStatus={onUpdateStatus}
        onTriggerNotification={onTriggerNotification}
      />
    </div>
  );
};
