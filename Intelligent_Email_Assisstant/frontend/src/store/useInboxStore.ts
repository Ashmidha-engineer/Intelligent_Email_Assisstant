import { create } from 'zustand';

export type FolderType = 'INBOX' | 'STARRED' | 'SENT' | 'DRAFT' | 'ARCHIVE' | 'TRASH';
export type ToneType = 'Professional' | 'Friendly' | 'Formal' | 'Concise';

export interface ToastInfo {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface InboxState {
  activeFolder: FolderType;
  activeCategory: string;
  searchQuery: string;
  selectedThreadId: string | null;
  isComposeModalOpen: boolean;
  activeTone: ToneType;
  currentDraft: string;
  activeExecutions: Record<string, any>;
  toast: ToastInfo | null;
  activeTab: 'inbox' | 'activity' | 'analytics' | 'settings';

  setActiveFolder: (folder: FolderType) => void;
  setActiveCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedThreadId: (threadId: string | null) => void;
  setComposeModalOpen: (open: boolean) => void;
  setActiveTone: (tone: ToneType) => void;
  setCurrentDraft: (draft: string) => void;
  updateExecution: (executionId: string, data: any) => void;
  showToast: (toast: Omit<ToastInfo, 'id'>) => void;
  clearToast: () => void;
  setActiveTab: (tab: 'inbox' | 'activity' | 'analytics' | 'settings') => void;
}

export const useInboxStore = create<InboxState>((set) => ({
  activeFolder: 'INBOX',
  activeCategory: 'ALL',
  searchQuery: '',
  selectedThreadId: 'thread-q3-roadmap', // default to first seeded thread for immediate preview
  isComposeModalOpen: false,
  activeTone: 'Professional',
  currentDraft: '',
  activeExecutions: {},
  toast: null,
  activeTab: 'inbox',

  setActiveFolder: (folder) => set({ activeFolder: folder, activeCategory: 'ALL' }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedThreadId: (threadId) => set({ selectedThreadId: threadId, currentDraft: '' }),
  setComposeModalOpen: (open) => set({ isComposeModalOpen: open }),
  setActiveTone: (tone) => set({ activeTone: tone }),
  setCurrentDraft: (draft) => set({ currentDraft: draft }),
  
  updateExecution: (executionId, data) =>
    set((state) => ({
      activeExecutions: {
        ...state.activeExecutions,
        [executionId]: {
          ...state.activeExecutions[executionId],
          ...data,
        },
      },
    })),

  showToast: (toast) => {
    const id = `toast-${Date.now()}`;
    set({ toast: { ...toast, id } });
    setTimeout(() => {
      set((state) => (state.toast?.id === id ? { toast: null } : state));
    }, 4500);
  },

  clearToast: () => set({ toast: null }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
