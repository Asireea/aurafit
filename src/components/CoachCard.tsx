import React, { useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Send,
  Sparkles,
  Star,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { Coach, Recommendation, RecommendationStatus } from '../types';

interface CoachCardProps {
  coach: Coach;
  recommendation?: Recommendation;
  onViewDetails: (coach: Coach, recommendation?: Recommendation) => void;
  onTriggerNotification?: (recId: string, coach: Coach) => void;
  onUpdateStatus?: (recId: string, newStatus: RecommendationStatus) => void;
  isDispatching?: boolean;
}

export const CoachCard: React.FC<CoachCardProps> = ({
  coach,
  recommendation,
  onViewDetails,
  onTriggerNotification,
  onUpdateStatus,
  isDispatching = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const score = recommendation?.recommendation_score ?? 85;
  const status = recommendation?.status ?? 'pending_notification';

  // Format specialties into human-readable strings
  const formattedSpecialties = coach.specialties.map((s) =>
    s
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );

  const formattedLevels = coach.target_experience_levels.map((l) =>
    l.charAt(0).toUpperCase() + l.slice(1)
  );

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-lg transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-900">
      {/* Top row: Avatar, Info & Match Score */}
      <div>
        <div className="flex items-start gap-4">
          {/* Avatar with fallback */}
          <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-800">
            {!imageError && coach.avatar_url ? (
              <img
                src={coach.avatar_url}
                alt={coach.name}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-600/30 to-neutral-900 text-lg font-bold text-emerald-400">
                {coach.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
            )}

            {/* Online/Verified indicator dot */}
            <span
              className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-neutral-900 bg-emerald-500"
              title="Active Certified Coach"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                {coach.name}
              </h3>

              {/* Match Score Badge */}
              <div
                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-mono font-bold shrink-0 ${
                  score >= 90
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : score >= 75
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                }`}
                title="Compatibility score calculated by matching engine"
              >
                <Sparkles className="h-3 w-3" />
                <span>{score}% Match</span>
              </div>
            </div>

            {/* Certifications or Rating text */}
            <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="h-3 w-3 fill-amber-400" />
                <span className="font-semibold text-neutral-200">{coach.rating?.toFixed(2) || '4.95'}</span>
              </div>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>{coach.review_count || 32} reviews</span>
              {coach.location && (
                <>
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                  <span className="truncate">{coach.location.split('(')[0]}</span>
                </>
              )}
            </div>

            {/* Hourly Rate */}
            <div className="mt-2 flex items-baseline gap-1 text-sm font-semibold text-white">
              <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                ${coach.hourly_rate}
              </span>
              <span className="text-xs text-neutral-400 font-normal">/ session</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="mt-3.5 text-xs text-neutral-300 line-clamp-2 leading-relaxed">
          {coach.bio}
        </p>

        {/* Specialties - Clean unboxed text with typographic separators */}
        <div className="mt-3 border-t border-neutral-800/80 pt-3">
          <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-1">
            Focus & Specialties
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-300">
            {formattedSpecialties.slice(0, 3).map((spec, i) => (
              <React.Fragment key={spec}>
                <span>{spec}</span>
                {i < Math.min(formattedSpecialties.length, 3) - 1 && (
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Target Levels */}
        <div className="mt-2 text-xs text-neutral-400">
          <span className="text-neutral-500">Experience: </span>
          {formattedLevels.join(' · ')}
        </div>

        {/* Status Indicator */}
        {recommendation && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs">
            <span className="text-neutral-400">Dispatch Status:</span>
            <span
              className={`flex items-center gap-1.5 font-medium ${
                status === 'accepted'
                  ? 'text-emerald-400'
                  : status === 'notified'
                  ? 'text-blue-400'
                  : status === 'rejected'
                  ? 'text-neutral-500'
                  : 'text-amber-400'
              }`}
            >
              {status === 'accepted' && <CheckCircle2 className="h-3.5 w-3.5" />}
              {status === 'notified' && <BellRing className="h-3.5 w-3.5" />}
              {status === 'pending_notification' && <Clock className="h-3.5 w-3.5" />}
              {status === 'rejected' && <XCircle className="h-3.5 w-3.5" />}
              <span>
                {status === 'pending_notification' && 'Pending n8n Notification'}
                {status === 'notified' && 'Dispatched via n8n'}
                {status === 'accepted' && 'Match Accepted'}
                {status === 'rejected' && 'Declined'}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-neutral-800 pt-3.5">
        <button
          onClick={() => onViewDetails(coach, recommendation)}
          className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
        >
          View Bio & Schedule
        </button>

        {recommendation && status === 'pending_notification' && onTriggerNotification && (
          <button
            onClick={() => onTriggerNotification(recommendation.id, coach)}
            disabled={isDispatching}
            title="Trigger n8n webhook notification for this match"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Notify n8n</span>
          </button>
        )}

        {recommendation && status !== 'accepted' && onUpdateStatus && (
          <button
            onClick={() => onUpdateStatus(recommendation.id, 'accepted')}
            title="Accept this coach match"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Connect</span>
          </button>
        )}
      </div>
    </div>
  );
};
