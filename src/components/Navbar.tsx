import React from 'react';
import { Activity, Bell, Cpu, Dumbbell, ShieldCheck, User as UserIcon } from 'lucide-react';
import { User, UserProfile } from '../types';

interface NavbarProps {
  currentUser: User | null;
  currentProfile: UserProfile | null;
  activeView: 'dashboard' | 'wizard' | 'admin';
  onNavigate: (view: 'dashboard' | 'wizard' | 'admin') => void;
  onOpenN8nModal: () => void;
  onOpenAuthModal: () => void;
  pendingRecsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentProfile,
  activeView,
  onNavigate,
  onOpenN8nModal,
  onOpenAuthModal,
  pendingRecsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white hover:text-emerald-400 transition-colors">
              AuraFit
            </span>
          </button>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-neutral-300">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              Coach Matches
            </button>

            {currentUser?.role === 'client' && (
              <button
                onClick={() => onNavigate('wizard')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeView === 'wizard'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                Fitness Profile
              </button>
            )}

            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                activeView === 'admin'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Admin Portal</span>
            </button>
          </nav>
        </div>

        {/* Zone 3: Primary actions & integration access */}
        <div className="flex items-center gap-3">
          {/* n8n Webhook quick trigger / settings trigger */}
          <button
            onClick={onOpenN8nModal}
            title="Configure n8n Webhook Integration"
            className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:border-emerald-500/50 hover:bg-neutral-800 transition-colors"
          >
            <Cpu className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">n8n Automation</span>
            {pendingRecsCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500/20 px-1 text-[10px] font-bold text-emerald-300">
                {pendingRecsCount}
              </span>
            )}
          </button>

          {/* User Profile / Role Switcher */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2.5 rounded-lg border border-neutral-800 bg-neutral-900/90 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-700 hover:bg-neutral-850 transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-neutral-300">
              <UserIcon className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-neutral-200 leading-tight">
                {currentProfile?.name || currentUser?.email.split('@')[0] || 'Guest'}
              </span>
              <span className="text-[10px] text-neutral-400 capitalize">
                {currentUser?.role || 'Switch Role'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
