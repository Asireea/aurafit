import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Dumbbell,
  FileCode,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import { db } from '../lib/db';
import { Coach, ExperienceLevel, Recommendation, RecommendationStatus, User, UserProfile } from '../types';

interface AdminPortalProps {
  coaches: Coach[];
  recommendations: Recommendation[];
  users: User[];
  profiles: UserProfile[];
  onRefreshData: () => Promise<void>;
  onTriggerBatchNotification: () => Promise<void>;
  onNavigateToWizard?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  coaches,
  recommendations,
  users,
  profiles,
  onRefreshData,
  onTriggerBatchNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'create-coach' | 'coaches' | 'pipeline' | 'users' | 'raw-db'>(
    'create-coach'
  );

  // Form State for creating a new coach
  const [coachName, setCoachName] = useState('');
  const [coachBio, setCoachBio] = useState('');
  const [coachAvatar, setCoachAvatar] = useState('/src/assets/images/coach_marcus_strength_1790871175255.jpg');
  const [hourlyRate, setHourlyRate] = useState<number>(80);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(['strength_training', 'gym']);
  const [selectedLevels, setSelectedLevels] = useState<ExperienceLevel[]>(['beginner', 'intermediate']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Filter for recommendations pipeline
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const PRESET_AVATARS = [
    { label: 'Strength Coach (Marcus)', url: '/src/assets/images/coach_marcus_strength_1790871175255.jpg' },
    { label: 'Yoga & Mobility (Elena)', url: '/src/assets/images/coach_elena_yoga_1790871187116.jpg' },
    { label: 'Endurance & Cardio (David)', url: '/src/assets/images/coach_david_endurance_1790871197324.jpg' },
    { label: 'Fat Loss & Conditioning (Sophia)', url: '/src/assets/images/coach_sophia_weightloss_1790871207721.jpg' },
  ];

  const SPECIALTY_OPTIONS = [
    { id: 'muscle_gain', label: 'Muscle Gain' },
    { id: 'strength_training', label: 'Strength Training' },
    { id: 'weight_loss', label: 'Weight Loss' },
    { id: 'endurance', label: 'Endurance & Cardio' },
    { id: 'general_fitness', label: 'General Fitness' },
    { id: 'yoga', label: 'Yoga & Mobility' },
    { id: 'hiit', label: 'HIIT Circuits' },
    { id: 'home', label: 'Home Workouts' },
    { id: 'gym', label: 'Gym Facilities' },
    { id: 'outdoor', label: 'Outdoor Conditioning' },
  ];

  const LEVEL_OPTIONS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

  const toggleSpecialty = (specId: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specId) ? prev.filter((s) => s !== specId) : [...prev, specId]
    );
  };

  const toggleLevel = (lvl: ExperienceLevel) => {
    setSelectedLevels((prev) =>
      prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]
    );
  };

  const handleCreateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachName.trim() || !coachBio.trim()) {
      alert('Please fill out all required coach fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await db.createCoach({
        name: coachName.trim(),
        bio: coachBio.trim(),
        avatar_url: coachAvatar.trim(),
        specialties: selectedSpecialties,
        target_experience_levels: selectedLevels,
        hourly_rate: Number(hourlyRate),
        rating: 5.0,
        review_count: 1,
        location: 'Remote & Hybrid',
        certifications: ['Certified Trainer (Verified)'],
      });

      setFormSuccess(true);
      setCoachName('');
      setCoachBio('');
      await onRefreshData();

      setTimeout(() => setFormSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to create coach:', err);
      alert('Error creating coach in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoach = async (coachId: string, name: string) => {
    if (confirm(`Are you sure you want to delete coach "${name}" and their recommendations?`)) {
      await db.deleteCoach(coachId);
      await onRefreshData();
    }
  };

  const handleUpdateStatus = async (recId: string, newStatus: RecommendationStatus) => {
    await db.updateRecommendationStatus(recId, newStatus);
    await onRefreshData();
  };

  // Filtered recommendations
  const filteredRecs = recommendations.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery) {
      const coach = coaches.find((c) => c.id === r.coach_id);
      const user = users.find((u) => u.id === r.user_id);
      const profile = profiles.find((p) => p.user_id === r.user_id);
      const q = searchQuery.toLowerCase();
      const matchesCoach = coach?.name.toLowerCase().includes(q);
      const matchesUser = user?.email.toLowerCase().includes(q) || profile?.name.toLowerCase().includes(q);
      if (!matchesCoach && !matchesUser) return false;
    }
    return true;
  });

  const pendingCount = recommendations.filter((r) => r.status === 'pending_notification').length;

  return (
    <div className="space-y-6">
      {/* Admin Portal Header */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Administration & Staff Management
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Trainer Roster & Pipeline Control
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Add verified coaches, supervise user recommendation funnels, and dispatch n8n notification batches.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onTriggerBatchNotification}
              disabled={pendingCount === 0}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 disabled:opacity-40 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Batch Notify via n8n ({pendingCount})</span>
            </button>

            <button
              onClick={() => onRefreshData()}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-neutral-800 pt-4">
          <button
            onClick={() => setActiveTab('create-coach')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'create-coach'
                ? 'bg-emerald-500 text-neutral-950'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Coach (/admin/create-coach)</span>
          </button>

          <button
            onClick={() => setActiveTab('coaches')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'coaches'
                ? 'bg-emerald-500 text-neutral-950'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            <span>Coach Directory ({coaches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'pipeline'
                ? 'bg-emerald-500 text-neutral-950'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Recommendations Pipeline ({recommendations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'users'
                ? 'bg-emerald-500 text-neutral-950'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Clients & Profiles ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('raw-db')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'raw-db'
                ? 'bg-emerald-500 text-neutral-950'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Repository Data State</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CREATE COACH FORM */}
      {activeTab === 'create-coach' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Add New Personal Coach</h2>
                <p className="text-xs text-neutral-400">
                  Adds record to the <code className="text-emerald-400">coaches</code> repository entity.
                </p>
              </div>
            </div>

            {formSuccess && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Coach successfully registered in database! Available for client matching immediately.</span>
              </div>
            )}

            <form onSubmit={handleCreateCoach} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1.5">
                    Coach Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    placeholder="e.g. Jordan Mitchell, CSCS"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1.5">
                    Hourly Session Rate (USD $) *
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={500}
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1.5">
                  Professional Bio & Philosophy *
                </label>
                <textarea
                  required
                  rows={3}
                  value={coachBio}
                  onChange={(e) => setCoachBio(e.target.value)}
                  placeholder="Summarize their training methodology, credentials, target student demographics, and track record..."
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Avatar Preset or Custom URL */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
                  Coach Avatar Portrait
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {PRESET_AVATARS.map((preset) => {
                    const isSelected = coachAvatar === preset.url;
                    return (
                      <button
                        type="button"
                        key={preset.label}
                        onClick={() => setCoachAvatar(preset.url)}
                        className={`flex flex-col items-center gap-2 rounded-xl border p-2 text-center transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50'
                            : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                        <span className="text-[10px] text-neutral-300 leading-tight">
                          {preset.label.split('(')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={coachAvatar}
                  onChange={(e) => setCoachAvatar(e.target.value)}
                  placeholder="Or enter custom image URL"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-xs font-mono text-neutral-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Specialties Multi-select */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
                  Specialties ({selectedSpecialties.length} Selected)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTY_OPTIONS.map((spec) => {
                    const isSelected = selectedSpecialties.includes(spec.id);
                    return (
                      <button
                        type="button"
                        key={spec.id}
                        onClick={() => toggleSpecialty(spec.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                            : 'border-neutral-800 bg-neutral-800/60 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {spec.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Experience Levels Multi-select */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
                  Target Trainee Experience Levels
                </label>
                <div className="flex gap-2">
                  {LEVEL_OPTIONS.map((lvl) => {
                    const isSelected = selectedLevels.includes(lvl);
                    return (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => toggleLevel(lvl)}
                        className={`rounded-lg border px-4 py-1.5 text-xs font-medium capitalize transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                            : 'border-neutral-800 bg-neutral-800/60 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="border-t border-neutral-800 pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isSubmitting ? 'Registering Coach...' : 'Publish Coach to Repository'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 flex flex-col justify-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Live Preview
            </span>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-800">
                  <img
                    src={coachAvatar}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">
                    {coachName || 'Coach Name'}
                  </h4>
                  <div className="mt-1 font-mono text-xs font-bold text-emerald-400 tabular-nums">
                    ${hourlyRate || 80} / session
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1 capitalize">
                    {selectedLevels.join(' · ') || 'Experience Levels'}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-neutral-300 line-clamp-3 leading-relaxed">
                {coachBio || 'Coach bio summary will appear here for prospective clients...'}
              </p>
              <div className="mt-3 flex flex-wrap gap-1 text-[10px] text-neutral-400 border-t border-neutral-800 pt-2">
                {selectedSpecialties.slice(0, 3).map((s) => (
                  <span key={s} className="capitalize">
                    {s.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COACH DIRECTORY */}
      {activeTab === 'coaches' && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
            <h2 className="text-lg font-bold text-white">Active Coaches ({coaches.length})</h2>
            <button
              onClick={() => setActiveTab('create-coach')}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Coach</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coaches.map((c) => {
              const coachRecs = recommendations.filter((r) => r.coach_id === c.id);
              const acceptedCount = coachRecs.filter((r) => r.status === 'accepted').length;

              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={c.avatar_url}
                      alt={c.name}
                      className="h-14 w-14 rounded-xl object-cover shrink-0 border border-neutral-800"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-sm text-white truncate">{c.name}</h3>
                        <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                          ${c.hourly_rate}/hr
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-2 mt-1">{c.bio}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-neutral-800/80 pt-3 text-xs">
                    <div className="text-neutral-400">
                      Matches: <span className="font-mono text-neutral-200">{coachRecs.length}</span> (
                      <span className="text-emerald-400 font-mono">{acceptedCount} accepted</span>)
                    </div>

                    <button
                      onClick={() => handleDeleteCoach(c.id, c.name)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: RECOMMENDATIONS PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800 mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Recommendations Pipeline</h2>
              <p className="text-xs text-neutral-400">
                Track status across client-coach pairings and trigger n8n notification dispatches.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status filter tabs */}
              <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-950/60 p-1 text-xs">
                {(['all', 'pending_notification', 'notified', 'accepted'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-md px-2.5 py-1 text-xs capitalize transition-colors ${
                      statusFilter === st
                        ? 'bg-neutral-800 text-white font-medium'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search client or coach..."
                  className="rounded-lg border border-neutral-700 bg-neutral-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {filteredRecs.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-8 text-center text-xs text-neutral-400">
              No recommendations match the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Matched Coach</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredRecs.map((rec) => {
                    const coach = coaches.find((c) => c.id === rec.coach_id);
                    const user = users.find((u) => u.id === rec.user_id);
                    const profile = profiles.find((p) => p.user_id === rec.user_id);

                    return (
                      <tr key={rec.id} className="hover:bg-neutral-850/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{profile?.name || 'Client'}</div>
                          <div className="text-[11px] text-neutral-400">{user?.email || rec.user_id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{coach?.name || rec.coach_id}</div>
                          <div className="text-[11px] text-neutral-400 font-mono tabular-nums">
                            ${coach?.hourly_rate || 75}/hr
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-mono font-bold text-xs ${
                              rec.recommendation_score >= 90
                                ? 'text-emerald-400'
                                : rec.recommendation_score >= 75
                                ? 'text-blue-400'
                                : 'text-neutral-400'
                            }`}
                          >
                            {rec.recommendation_score}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${
                              rec.status === 'accepted'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : rec.status === 'notified'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : rec.status === 'rejected'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {rec.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <select
                            value={rec.status}
                            onChange={(e) =>
                              handleUpdateStatus(rec.id, e.target.value as RecommendationStatus)
                            }
                            aria-label={`Change status for recommendation ${rec.id}`}
                            className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-[11px] text-neutral-200 focus:outline-none"
                          >
                            <option value="pending_notification">pending_notification</option>
                            <option value="notified">notified</option>
                            <option value="accepted">accepted</option>
                            <option value="rejected">rejected</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: USERS & PROFILES */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-xl">
          <div className="pb-4 border-b border-neutral-800 mb-4">
            <h2 className="text-lg font-bold text-white">Registered Users & Client Profiles</h2>
            <p className="text-xs text-neutral-400">
              Corresponds to <code className="text-emerald-400">users</code> and{' '}
              <code className="text-emerald-400">user_profiles</code> entities.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4">User Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Profile Stats</th>
                  <th className="py-3 px-4">Fitness Goal</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Workout Style</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {users.map((u) => {
                  const p = profiles.find((prof) => prof.user_id === u.id);
                  return (
                    <tr key={u.id} className="hover:bg-neutral-850/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{p?.name || 'Unnamed'}</div>
                        <div className="text-[11px] text-neutral-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-medium capitalize ${
                            u.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p ? (
                          <div className="font-mono text-neutral-200">
                            {p.age} yrs · {p.current_weight_kg}kg → {p.target_weight_kg}kg
                          </div>
                        ) : (
                          <span className="text-neutral-500">No profile created</span>
                        )}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        {p?.fitness_goal ? p.fitness_goal.replace('_', ' ') : '—'}
                      </td>
                      <td className="py-3 px-4 capitalize">{p?.experience_level || '—'}</td>
                      <td className="py-3 px-4 capitalize">{p?.preferred_workout_type || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: RAW REPOSITORY DATA STATE */}
      {activeTab === 'raw-db' && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Data Repository State (Flexible Layer)</h2>
              <p className="text-xs text-neutral-400">
                Export, inspect, or restore the 4 entities: <code className="text-emerald-400">users</code>,{' '}
                <code className="text-emerald-400">user_profiles</code>, <code className="text-emerald-400">coaches</code>,{' '}
                <code className="text-emerald-400">recommendations</code>.
              </p>
            </div>

            <button
              onClick={() => {
                if (confirm('Reset database to initial seed defaults?')) {
                  db.resetToDefaults();
                  onRefreshData();
                }
              }}
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20"
            >
              Reset Seed Data
            </button>
          </div>

          <pre className="max-h-96 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-[11px] text-emerald-300 leading-relaxed">
            {db.exportDbJson()}
          </pre>
        </div>
      )}
    </div>
  );
};
