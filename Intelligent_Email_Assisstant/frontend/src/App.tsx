import React from 'react';
import { useAuth } from './hooks/useAuth.js';
import { useSocket } from './hooks/useSocket.js';
import { useInboxStore } from './store/useInboxStore.js';
import { LoginView } from './components/LoginView.js';
import { Sidebar } from './components/Sidebar.js';
import { EmailList } from './components/EmailList.js';
import { ThreadView } from './components/ThreadView.js';
import { ActivityView } from './components/ActivityView.js';
import { AnalyticsView } from './components/AnalyticsView.js';
import { SettingsView } from './components/SettingsView.js';
import { ComposeModal } from './components/ComposeModal.js';
import { Toast } from './components/ui/Toast.js';
import { Mail, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const activeTab = useInboxStore((state) => state.activeTab);

  // Initialize Real-time WebSocket connection
  useSocket(user?.id);

  // Loading Splash Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F5EB] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E8A2A2] to-[#EAC7C7] flex items-center justify-center shadow-soft-md animate-pulse">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Sparkles className="w-4 h-4 text-[#E8A2A2] animate-spin" />
          <span>Starting Intelligent Email Assistant...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated -> Show Login Screen
  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <Toast />
      </>
    );
  }

  // Authenticated Main Dashboard
  return (
    <div className="flex h-screen w-screen bg-[#F7F5EB] text-slate-800 font-sans overflow-hidden">
      {/* Left Sidebar Navigation */}
      <Sidebar />

      {/* Dynamic Content Area based on Active Tab */}
      {activeTab === 'inbox' && (
        <div className="flex flex-1 overflow-hidden">
          <EmailList />
          <ThreadView />
        </div>
      )}

      {activeTab === 'activity' && <ActivityView />}
      {activeTab === 'analytics' && <AnalyticsView />}
      {activeTab === 'settings' && <SettingsView />}

      {/* Modals & Overlays */}
      <ComposeModal />
      <Toast />
    </div>
  );
};

export default App;
