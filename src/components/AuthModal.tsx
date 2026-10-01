import React, { useState } from 'react';
import { CheckCircle2, Dumbbell, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import { db } from '../lib/db';
import { User, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSelectUser,
}) => {
  const [tab, setTab] = useState<'demo' | 'custom'>('demo');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const DEMO_ACCOUNTS = [
    {
      id: 'user-client-1',
      name: 'Alex Chen',
      email: 'alex.chen@example.com',
      role: 'client' as UserRole,
      badge: 'Client: Muscle Gain',
      desc: '29 yrs · 72.5kg → 78kg · Intermediate Gym',
    },
    {
      id: 'user-client-2',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      role: 'client' as UserRole,
      badge: 'Client: Weight Loss',
      desc: '34 yrs · 84kg → 72kg · Beginner Home Workouts',
    },
    {
      id: 'user-admin-1',
      name: 'Head Coach & Platform Admin',
      email: 'admin@aurafit.internal',
      role: 'admin' as UserRole,
      badge: 'Platform Administrator',
      desc: 'Manage coaches, view recommendations & n8n pipeline',
    },
  ];

  const handleSelectDemo = async (demo: (typeof DEMO_ACCOUNTS)[0]) => {
    let user = await db.getUserById(demo.id);
    if (!user) {
      user = await db.createUser({
        id: demo.id,
        email: demo.email,
        role: demo.role,
      });
    }
    onSelectUser(user);
    onClose();
  };

  const handleCustomAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      let user = await db.getUserByEmail(email.trim());
      if (!user) {
        user = await db.createUser({
          email: email.trim(),
          role,
        });
      }
      onSelectUser(user);
      onClose();
    } catch (err) {
      console.error('Error authenticating user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Authentication & Roles</h2>
              <p className="text-xs text-neutral-400">Switch persona or sign in with custom credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-6 pt-2">
          <button
            onClick={() => setTab('demo')}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              tab === 'demo'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            1-Click Demo Profiles
          </button>
          <button
            onClick={() => setTab('custom')}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              tab === 'custom'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Sign In / Register
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {tab === 'demo' ? (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400 mb-2">
                Select an existing persona to instantly test matching and role-specific permissions:
              </p>

              {DEMO_ACCOUNTS.map((acc) => {
                const isCurrent = currentUser?.id === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => handleSelectDemo(acc)}
                    className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                      isCurrent
                        ? 'border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                        : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {acc.role === 'admin' ? (
                          <ShieldCheck className="h-4 w-4 text-purple-400" />
                        ) : (
                          <UserIcon className="h-4 w-4 text-emerald-400" />
                        )}
                        <span className="font-bold text-sm text-white">{acc.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold rounded px-2 py-0.5 uppercase ${
                          acc.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {acc.badge}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">{acc.desc}</div>
                    <div className="text-[11px] font-mono text-neutral-500 mt-1">{acc.email}</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCustomAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@example.com"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`rounded-lg border p-3 text-center text-xs font-semibold transition-all ${
                      role === 'client'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : 'border-neutral-800 bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    Client Athlete
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`rounded-lg border p-3 text-center text-xs font-semibold transition-all ${
                      role === 'admin'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                        : 'border-neutral-800 bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    Platform Admin
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors mt-2"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In / Continue'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
