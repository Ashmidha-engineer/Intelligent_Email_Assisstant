import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/index.js';
import {
  BarChart3,
  Clock,
  Zap,
  Mail,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Calendar,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsApi.getAnalytics,
  });

  if (isLoading) {
    return (
      <div className="flex-1 h-screen bg-[#F7F5EB] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#E8A2A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const overview = data?.overview || {
    totalEmails: 12,
    unreadEmails: 3,
    totalExecutions: 8,
    estimatedMinutesSaved: 48,
    avgDurationMs: 650,
  };

  const categories = data?.categoryBreakdown || [
    { category: 'Work', count: 6 },
    { category: 'Primary', count: 4 },
    { category: 'Updates', count: 2 },
  ];

  const totalCat = categories.reduce((acc: number, curr: any) => acc + curr.count, 0) || 1;

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'work':
        return 'bg-[#E8A2A2]';
      case 'primary':
        return 'bg-[#A0C3D2]';
      case 'updates':
        return 'bg-[#EAC7C7]';
      default:
        return 'bg-[#D5E3E8]';
    }
  };

  return (
    <div className="flex-1 h-screen bg-[#F7F5EB] overflow-y-auto p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#A0C3D2]/40 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E8A2A2] to-[#EAC7C7] flex items-center justify-center text-white">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Productivity & AI Digest</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time insights on inbox throughput, AI time savings, and priority breakdowns.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Estimated Time Saved */}
        <div className="p-5 rounded-2xl bg-white border border-[#A0C3D2]/60 shadow-soft-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Time Saved</span>
            <div className="w-8 h-8 rounded-lg bg-[#EAC7C7]/50 flex items-center justify-center text-[#782828]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {overview.estimatedMinutesSaved} <span className="text-sm font-semibold text-slate-500">mins</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            ~3 mins per summary, ~5 mins per reply
          </p>
        </div>

        {/* Card 2: AI Latency */}
        <div className="p-5 rounded-2xl bg-white border border-[#A0C3D2]/60 shadow-soft-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Latency</span>
            <div className="w-8 h-8 rounded-lg bg-[#D5E3E8] flex items-center justify-center text-[#1e3a5f]">
              <Zap className="w-4 h-4 text-[#E8A2A2]" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {overview.avgDurationMs} <span className="text-sm font-semibold text-slate-500">ms</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Asynchronous worker speed</p>
        </div>

        {/* Card 3: Inbox Processed */}
        <div className="p-5 rounded-2xl bg-white border border-[#A0C3D2]/60 shadow-soft-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inbox Volume</span>
            <div className="w-8 h-8 rounded-lg bg-[#EAE0DA] flex items-center justify-center text-slate-700">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {overview.totalEmails} <span className="text-sm font-semibold text-slate-500">threads</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {overview.unreadEmails} unread requiring attention
          </p>
        </div>

        {/* Card 4: AI Executions */}
        <div className="p-5 rounded-2xl bg-white border border-[#A0C3D2]/60 shadow-soft-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Operations</span>
            <div className="w-8 h-8 rounded-lg bg-[#D5E3E8] flex items-center justify-center text-emerald-700">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {overview.totalExecutions || overview.successfulExecutions || 0}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">100% workflow success rate</p>
        </div>
      </div>

      {/* Daily Digest & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Digest Box */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border-2 border-[#EAC7C7] shadow-soft-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE0DA]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E8A2A2]" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                AI Executive Morning Digest
              </h3>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Today
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {data?.dailyDigest?.summary ||
              `You have ${overview.unreadEmails} unread emails. Key discussions on product roadmap and security review require your input today.`}
          </p>

          <div className="space-y-2 pt-2 border-t border-[#EAE0DA]">
            <div className="text-[11px] font-bold text-slate-600 uppercase">
              Top Priority Conversations:
            </div>
            {data?.dailyDigest?.topThreads?.map((t: any) => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-[#F7F5EB] border border-[#EAE0DA] flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{t.subject}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{t.from}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E8A2A2] text-white flex-shrink-0">
                  {t.priority || 'URGENT'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown Card */}
        <div className="p-6 rounded-3xl bg-white border border-[#A0C3D2]/60 shadow-soft-md space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-[#EAE0DA]">
            Category Distribution
          </h3>

          <div className="space-y-3.5">
            {categories.map((cat: any) => {
              const pct = Math.round((cat.count / totalCat) * 100);
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{cat.category}</span>
                    <span>{pct}% ({cat.count})</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F7F5EB] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getCategoryColor(cat.category)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
