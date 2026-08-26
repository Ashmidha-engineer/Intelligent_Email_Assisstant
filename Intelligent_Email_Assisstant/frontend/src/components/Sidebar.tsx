import React from 'react';
import {
  Inbox,
  Star,
  Send,
  FileEdit,
  Archive,
  Trash2,
  Activity,
  BarChart3,
  Settings,
  Plus,
  Mail,
  LogOut,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useInboxStore, FolderType } from '../store/useInboxStore.js';
import { useAuth } from '../hooks/useAuth.js';

interface SidebarProps {
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ unreadCount = 0 }) => {
  const { user, isGoogleConnected, logout } = useAuth();
  const {
    activeFolder,
    setActiveFolder,
    activeCategory,
    setActiveCategory,
    activeTab,
    setActiveTab,
    setComposeModalOpen,
  } = useInboxStore();

  const folders: { id: FolderType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'INBOX', label: 'Inbox', icon: <Inbox className="w-4 h-4" />, count: unreadCount },
    { id: 'STARRED', label: 'Starred', icon: <Star className="w-4 h-4" /> },
    { id: 'SENT', label: 'Sent', icon: <Send className="w-4 h-4" /> },
    { id: 'DRAFT', label: 'Drafts', icon: <FileEdit className="w-4 h-4" /> },
    { id: 'ARCHIVE', label: 'Archive', icon: <Archive className="w-4 h-4" /> },
    { id: 'TRASH', label: 'Trash', icon: <Trash2 className="w-4 h-4" /> },
  ];

  const categories = [
    { id: 'ALL', label: 'All Messages', color: 'bg-slate-400' },
    { id: 'Work', label: 'Work', color: 'bg-[#E8A2A2]' },
    { id: 'Primary', label: 'Primary', color: 'bg-[#A0C3D2]' },
    { id: 'Updates', label: 'Updates', color: 'bg-[#EAC7C7]' },
    { id: 'Promotions', label: 'Promotions', color: 'bg-amber-400' },
    { id: 'Social', label: 'Social', color: 'bg-emerald-400' },
  ];

  const tabs: { id: 'inbox' | 'activity' | 'analytics' | 'settings'; label: string; icon: React.ReactNode }[] = [
    { id: 'inbox', label: 'Inbox Workspace', icon: <Mail className="w-4 h-4" /> },
    { id: 'activity', label: 'AI Execution Log', icon: <Activity className="w-4 h-4" /> },
    { id: 'analytics', label: 'Productivity & Digest', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Integrations', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 h-screen bg-[#EAE0DA]/60 backdrop-blur-md border-r border-[#A0C3D2]/40 flex flex-col justify-between p-4 flex-shrink-0 select-none">
      {/* Top Header & Navigation */}
      <div className="flex flex-col gap-5 overflow-y-auto pr-1">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E8A2A2] to-[#EAC7C7] flex items-center justify-center shadow-soft-sm border border-white/60">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">Intelligent Mail</h2>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-slate-500">AI Assistant Ready</span>
            </div>
          </div>
        </div>

        {/* Compose Button */}
        <button
          onClick={() => setComposeModalOpen(true)}
          className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 rounded-xl bg-[#E8A2A2] hover:bg-[#de8f8f] text-white font-semibold shadow-soft-sm hover:shadow-coral-glow transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Message</span>
          <Sparkles className="w-3.5 h-3.5 ml-auto text-white/80" />
        </button>

        {/* Main Tab Switcher */}
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2.5 mb-1">
            Navigation
          </div>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#D5E3E8] text-slate-900 shadow-soft-sm border border-[#A0C3D2]'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-[#E8A2A2]' : 'text-slate-500'}>{tab.icon}</span>
                <span className="flex-1 truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Inbox Folder Section (Only when in Inbox tab) */}
        {activeTab === 'inbox' && (
          <>
            <div className="flex flex-col gap-1 pt-2 border-t border-[#A0C3D2]/30">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2.5 mb-1">
                Folders
              </div>
              {folders.map((folder) => {
                const isActive = activeFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => setActiveFolder(folder.id)}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 font-semibold shadow-soft-sm border border-[#A0C3D2]/60'
                        : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-[#E8A2A2]' : 'text-slate-400'}>{folder.icon}</span>
                      <span>{folder.label}</span>
                    </div>
                    {typeof folder.count === 'number' && folder.count > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8A2A2] text-white">
                        {folder.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Smart Categories */}
            <div className="flex flex-col gap-1 pt-2 border-t border-[#A0C3D2]/30">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2.5 mb-1">
                Smart Categories
              </div>
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#EAC7C7]/50 text-slate-900 font-semibold border border-[#E8A2A2]/40'
                        : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Bottom User Card & Connected Status */}
      <div className="pt-3 border-t border-[#A0C3D2]/40 flex flex-col gap-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-white/70 border border-[#A0C3D2]/40">
          <div className="w-8 h-8 rounded-full bg-[#D5E3E8] border border-[#A0C3D2] flex items-center justify-center font-bold text-xs text-slate-700 overflow-hidden flex-shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || 'User'} className="w-full h-full object-cover" />
            ) : (
              (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'Authorized User'}</p>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] text-slate-500 truncate">
                {isGoogleConnected ? 'Gmail Synced' : 'Sandbox Demo'}
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
