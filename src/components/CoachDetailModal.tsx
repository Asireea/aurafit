import React from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  Send,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { Coach, Recommendation, RecommendationStatus } from '../types';

interface CoachDetailModalProps {
  coach: Coach | null;
  recommendation?: Recommendation;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (recId: string, status: RecommendationStatus) => void;
  onTriggerNotification?: (recId: string, coach: Coach) => void;
}

export const CoachDetailModal: React.FC<CoachDetailModalProps> = ({
  coach,
  recommendation,
  isOpen,
  onClose,
  onUpdateStatus,
  onTriggerNotification,
}) => {
  if (!isOpen || !coach) return null;

  const score = recommendation?.recommendation_score ?? 85;
  const status = recommendation?.status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Trainer Profile & Match Analysis
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[80vh] overflow-y-auto p-6 space-y-6">
          {/* Coach Header Profile */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-800 shadow-md">
              <img
                src={coach.avatar_url}
                alt={coach.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-white">{coach.name}</h2>
                <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-bold text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{score}% Compatibility</span>
                </div>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  <span className="font-semibold text-neutral-200">{coach.rating?.toFixed(2) || '4.95'}</span>
                  <span>({coach.review_count || 32} client reviews)</span>
                </div>
                {coach.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                    <span>{coach.location}</span>
                  </div>
                )}
              </div>

              <div className="mt-2 text-sm font-semibold text-white">
                <span className="font-mono text-lg font-bold text-emerald-400 tabular-nums">
                  ${coach.hourly_rate}
                </span>
                <span className="text-xs text-neutral-400 font-normal"> / 60-min personal coaching session</span>
              </div>
            </div>
          </div>

          {/* Match Algorithm Breakdown */}
          {recommendation?.match_reasons && recommendation.match_reasons.length > 0 && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                <Sparkles className="h-4 w-4" />
                <span>Why this coach is your top match</span>
              </div>
              <ul className="space-y-1.5 text-xs text-neutral-300">
                {recommendation.match_reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Bio */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              About & Coaching Philosophy
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed bg-neutral-950/40 p-4 rounded-xl border border-neutral-800">
              {coach.bio}
            </p>
          </div>

          {/* Specialties & Experience Levels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2.5">
                Core Specialties
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {coach.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="rounded-md border border-neutral-700 bg-neutral-800/80 px-2.5 py-1 text-xs text-neutral-200 capitalize"
                  >
                    {spec.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2.5">
                Target Experience Levels
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {coach.target_experience_levels.map((lvl) => (
                  <span
                    key={lvl}
                    className="rounded-md border border-neutral-700 bg-neutral-800/80 px-2.5 py-1 text-xs text-emerald-300 capitalize"
                  >
                    {lvl}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Certifications */}
          {coach.certifications && coach.certifications.length > 0 && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                <Award className="h-4 w-4 text-emerald-400" />
                <span>Verified Credentials & Licenses</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-neutral-300">
                {coach.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="rounded-md bg-neutral-800/90 px-3 py-1 font-mono text-neutral-300 border border-neutral-700"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 bg-neutral-950/60 px-6 py-4">
          <div className="text-xs text-neutral-400">
            {recommendation && (
              <span>
                Status:{' '}
                <strong className="text-white capitalize">
                  {status?.replace('_', ' ') || 'Pending'}
                </strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {recommendation && onTriggerNotification && (
              <button
                onClick={() => {
                  onTriggerNotification(recommendation.id, coach);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
              >
                <Send className="h-3.5 w-3.5 text-emerald-400" />
                <span>Dispatch n8n Ping</span>
              </button>
            )}

            {recommendation && onUpdateStatus && status !== 'accepted' && (
              <button
                onClick={() => {
                  onUpdateStatus(recommendation.id, 'accepted');
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm & Match Coach</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
