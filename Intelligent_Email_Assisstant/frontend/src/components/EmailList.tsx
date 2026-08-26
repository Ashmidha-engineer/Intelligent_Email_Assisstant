import React from 'react';
import {
  Search,
  Star,
  Archive,
  Paperclip,
  Clock,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailApi } from '../api/index.js';
import { EmailItem } from '../api/client.js';
import { useInboxStore } from '../store/useInboxStore.js';
import { formatDistanceToNow, parseISO } from 'date-fns';

export const EmailList: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    activeFolder,
    activeCategory,
    searchQuery,
    setSearchQuery,
    selectedThreadId,
    setSelectedThreadId,
    showToast,
  } = useInboxStore();

  // Fetch emails based on active folder and search query
  const { data, isLoading, error, refetch } = useQuery<{ emails: EmailItem[]; total: number }>({
    queryKey: ['emails', activeFolder, searchQuery],
    queryFn: () => emailApi.listEmails({ folder: activeFolder, q: searchQuery, limit: 40 }),
  });

  // Toggle Star Mutation
  const starMutation = useMutation({
    mutationFn: ({ id, isStarred }: { id: string; isStarred: boolean }) =>
      emailApi.markStar(id, isStarred),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });

  // Toggle Read Mutation
  const readMutation = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      emailApi.markRead(id, isRead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });

  // Archive Mutation
  const archiveMutation = useMutation({
    mutationFn: (id: string) => emailApi.archiveEmail(id),
    onSuccess: () => {
      showToast({ title: 'Archived', message: 'Thread moved to archive', type: 'info' });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });

  const emails = data?.emails || [];

  // Filter by category if not 'ALL'
  const filteredEmails = emails.filter((e) => {
    if (activeCategory === 'ALL') return true;
    return e.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const formatEmailDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E8A2A2] text-white">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EAC7C7] text-[#782828]">HIGH</span>;
      case 'NORMAL':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#D5E3E8] text-[#1e3a5f]">NORMAL</span>;
      default:
        return null;
    }
  };

  return (
    <section className="w-80 sm:w-96 h-screen bg-[#F7F5EB] border-r border-[#A0C3D2]/40 flex flex-col flex-shrink-0">
      {/* Top Search & Filter Bar */}
      <div className="p-3.5 border-b border-[#A0C3D2]/40 bg-[#EAE0DA]/30 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 capitalize flex items-center gap-2">
            <span>{activeFolder.toLowerCase()}</span>
            {activeCategory !== 'ALL' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#D5E3E8] text-slate-700 font-semibold border border-[#A0C3D2]">
                {activeCategory}
              </span>
            )}
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {filteredEmails.length} {filteredEmails.length === 1 ? 'thread' : 'threads'}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emails, topics, senders..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-[#A0C3D2]/60 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E8A2A2] focus:ring-2 focus:ring-[#E8A2A2]/30 shadow-soft-sm transition-all"
          />
        </div>
      </div>

      {/* Email List Container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {isLoading ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-[#E8A2A2] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Syncing mailbox...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-600 space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
            <p className="text-xs font-semibold">Failed to load emails</p>
            <button
              onClick={() => refetch()}
              className="text-xs text-[#E8A2A2] font-semibold underline hover:text-[#d68585] cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-64">
            <Inbox className="w-10 h-10 text-[#A0C3D2] mb-2 stroke-[1.5]" />
            <p className="text-xs font-bold text-slate-700">No emails found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {searchQuery ? 'Try clearing your search query' : 'Your folder is clean'}
            </p>
          </div>
        ) : (
          filteredEmails.map((email) => {
            const isSelected = selectedThreadId === email.threadId;

            return (
              <div
                key={email.id}
                onClick={() => {
                  setSelectedThreadId(email.threadId);
                  if (!email.isRead) {
                    readMutation.mutate({ id: email.id, isRead: true });
                  }
                }}
                className={`group relative p-3 rounded-2xl transition-all duration-150 cursor-pointer border ${
                  isSelected
                    ? 'bg-white border-[#E8A2A2] shadow-soft-md scale-[0.99]'
                    : email.isRead
                    ? 'bg-white/60 hover:bg-white border-[#A0C3D2]/30 hover:border-[#A0C3D2]/70'
                    : 'bg-white border-[#A0C3D2]/60 shadow-soft-sm font-semibold'
                }`}
              >
                {/* Header Row: Sender, Unread Dot, Timestamp */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {!email.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#E8A2A2] flex-shrink-0 animate-pulse" />
                    )}
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {email.from.split('<')[0].replace(/"/g, '').trim()}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3 text-slate-300" />
                    {formatEmailDate(email.receivedAt)}
                  </span>
                </div>

                {/* Subject */}
                <h4
                  className={`text-xs text-slate-800 line-clamp-1 mb-1 ${
                    !email.isRead ? 'font-bold text-slate-950' : 'font-medium'
                  }`}
                >
                  {email.subject || '(No Subject)'}
                </h4>

                {/* Snippet */}
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {email.snippet}
                </p>

                {/* Footer: Category, Priority, Attachments, Actions */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#D5E3E8]/80 text-[#1e3a5f] border border-[#A0C3D2]/40">
                      {email.category}
                    </span>
                    {getPriorityBadge(email.priority)}
                    {email.hasAttachments && (
                      <Paperclip className="w-3 h-3 text-slate-400" />
                    )}
                  </div>

                  {/* Quick Action Buttons on Hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        starMutation.mutate({ id: email.id, isStarred: !email.isStarred });
                      }}
                      className="p-1 rounded-md hover:bg-[#EAE0DA] text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                      title={email.isStarred ? 'Unstar' : 'Star'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          email.isStarred ? 'text-amber-500 fill-amber-500' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveMutation.mutate(email.id);
                      }}
                      className="p-1 rounded-md hover:bg-[#EAE0DA] text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      title="Archive"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
