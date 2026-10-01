/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Cpu, Dumbbell, ShieldCheck, Sparkles, X } from 'lucide-react';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { ClientDashboard } from './components/ClientDashboard';
import { N8nSettingsModal } from './components/N8nSettingsModal';
import { Navbar } from './components/Navbar';
import { OnboardingWizard } from './components/OnboardingWizard';
import { db } from './lib/db';
import { generateRecommendationsForUser } from './lib/matching';
import { n8n } from './lib/n8n';
import { Coach, Recommendation, RecommendationStatus, User, UserProfile } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [userRecs, setUserRecs] = useState<Recommendation[]>([]);
  const [allRecs, setAllRecs] = useState<Recommendation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);

  const [activeView, setActiveView] = useState<'dashboard' | 'wizard' | 'admin'>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isN8nModalOpen, setIsN8nModalOpen] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(
    null
  );

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Load all application data
  const loadData = async (targetUser?: User | null) => {
    try {
      const usersList = await db.getUsers();
      setAllUsers(usersList);

      const activeUser = targetUser !== undefined ? targetUser : currentUser || usersList[0];
      if (activeUser) {
        setCurrentUser(activeUser);

        const profile = await db.getUserProfile(activeUser.id);
        setCurrentProfile(profile);

        const userRecommendations = await db.getRecommendations(activeUser.id);
        setUserRecs(userRecommendations);
      }

      const coachesList = await db.getCoaches();
      setCoaches(coachesList);

      const allRecommendations = await db.getRecommendations();
      setAllRecs(allRecommendations);

      // Collect all profiles
      const profs: UserProfile[] = [];
      for (const u of usersList) {
        const p = await db.getUserProfile(u.id);
        if (p) profs.push(p);
      }
      setAllProfiles(profs);
    } catch (err) {
      console.error('Error loading repository data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectUser = async (user: User) => {
    await loadData(user);
    if (user.role === 'admin') {
      setActiveView('admin');
    } else {
      setActiveView('dashboard');
    }
    showToast(`Switched account to ${user.email} (${user.role})`, 'info');
  };

  // Trigger single notification via n8n
  const handleTriggerSingleNotification = async (recId: string, coach: Coach) => {
    if (!currentUser) return;
    setIsDispatching(true);

    try {
      const res = await n8n.dispatchEvent(
        'NEW_MATCH_GENERATED',
        {
          action: 'dispatch_single_trainer_invitation',
          userId: currentUser.id,
          userEmail: currentUser.email,
          coach: {
            id: coach.id,
            name: coach.name,
            hourlyRate: coach.hourly_rate,
          },
        },
        [recId]
      );

      await loadData();
      showToast(res.message, res.success ? 'success' : 'info');
    } catch (err) {
      console.error('Failed to trigger single notification:', err);
      showToast('Error dispatching webhook to n8n', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  // Trigger batch notification via n8n
  const handleTriggerBatchNotification = async () => {
    setIsDispatching(true);
    try {
      const pendingIds = (
        currentUser?.role === 'admin'
          ? allRecs
          : userRecs
      )
        .filter((r) => r.status === 'pending_notification')
        .map((r) => r.id);

      if (pendingIds.length === 0) {
        showToast('No recommendations currently pending notification.', 'info');
        return;
      }

      const res = await n8n.triggerBatchNotification(pendingIds);
      await loadData();
      showToast(
        `n8n Batch Notification dispatched! ${pendingIds.length} candidate trainer match(es) marked as notified.`,
        'success'
      );
    } catch (err) {
      console.error('Failed to dispatch batch:', err);
      showToast('Failed to dispatch batch notifications', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  // Update status (e.g. user accepted or declined match)
  const handleUpdateStatus = async (recId: string, status: RecommendationStatus) => {
    try {
      await db.updateRecommendationStatus(recId, status);
      await loadData();

      // Trigger status changed event to n8n
      await n8n.dispatchEvent('RECOMMENDATION_STATUS_CHANGED', {
        recommendationId: recId,
        newStatus: status,
        updatedAt: new Date().toISOString(),
      });

      showToast(`Recommendation status updated to "${status.replace('_', ' ')}"`, 'success');
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Recalculate matches
  const handleRecalculateMatches = async () => {
    if (!currentUser) return;
    try {
      await generateRecommendationsForUser(currentUser.id);
      await loadData();
      showToast('Coach match percentages recalculated using current profile!', 'success');
    } catch (err) {
      console.error('Failed to recalculate matches:', err);
    }
  };

  // Complete onboarding wizard
  const handleCompleteWizard = async (profile: UserProfile) => {
    setCurrentProfile(profile);
    await loadData();
    setActiveView('dashboard');
    showToast('Profile saved & recommendations synchronized with n8n!', 'success');
  };

  const pendingCount = (
    currentUser?.role === 'admin' ? allRecs : userRecs
  ).filter((r) => r.status === 'pending_notification').length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-neutral-900/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-xs font-medium text-neutral-200 max-w-sm">{toast.message}</div>
          <button
            onClick={() => setToast(null)}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Global Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        currentProfile={currentProfile}
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        onOpenN8nModal={() => setIsN8nModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        pendingRecsCount={pendingCount}
      />

      {/* Main View Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'wizard' && currentUser && (
          <OnboardingWizard
            currentUser={currentUser}
            currentProfile={currentProfile}
            onComplete={handleCompleteWizard}
            onCancel={() => setActiveView('dashboard')}
          />
        )}

        {activeView === 'dashboard' && currentUser && (
          <ClientDashboard
            currentUser={currentUser}
            currentProfile={currentProfile}
            coaches={coaches}
            recommendations={userRecs}
            onOpenWizard={() => setActiveView('wizard')}
            onOpenN8nModal={() => setIsN8nModalOpen(true)}
            onTriggerNotification={handleTriggerSingleNotification}
            onTriggerBatchNotification={handleTriggerBatchNotification}
            onUpdateStatus={handleUpdateStatus}
            onRecalculateMatches={handleRecalculateMatches}
            isDispatching={isDispatching}
          />
        )}

        {activeView === 'admin' && (
          <AdminPortal
            coaches={coaches}
            recommendations={allRecs}
            users={allUsers}
            profiles={allProfiles}
            onRefreshData={async () => {
              await loadData();
            }}
            onTriggerBatchNotification={handleTriggerBatchNotification}
            onNavigateToWizard={() => setActiveView('wizard')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950/80 py-6 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-400">AuraFit</span>
            <span>·</span>
            <span>Personal Trainer Matching & n8n Automation Engine</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsN8nModalOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              n8n Webhook Inspector
            </button>
            <span>·</span>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Switch Role / Persona
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        currentUser={currentUser}
        onClose={() => setIsAuthModalOpen(false)}
        onSelectUser={handleSelectUser}
      />

      <N8nSettingsModal
        isOpen={isN8nModalOpen}
        onClose={() => setIsN8nModalOpen(false)}
        onTriggerBatchNotification={handleTriggerBatchNotification}
        pendingRecsCount={pendingCount}
      />
    </div>
  );
}
