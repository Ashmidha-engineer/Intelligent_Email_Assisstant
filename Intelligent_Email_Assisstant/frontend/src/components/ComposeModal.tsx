import React, { useState } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { useInboxStore, ToneType } from '../store/useInboxStore.js';
import { useQueryClient } from '@tanstack/react-query';
import { emailApi } from '../api/index.js';

export const ComposeModal: React.FC = () => {
  const { isComposeModalOpen, setComposeModalOpen, activeTone, setActiveTone, showToast } =
    useInboxStore();
  const queryClient = useQueryClient();

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  if (!isComposeModalOpen) return null;

  const handleAiDraft = async () => {
    if (!subject.trim()) {
      showToast({
        title: 'Subject needed',
        message: 'Please provide a subject for AI generation.',
        type: 'warning',
      });
      return;
    }

    setIsGeneratingAi(true);
    try {
      setTimeout(() => {
        setBody(
          `Hi team,\n\nI hope you're having a productive week. Regarding "${subject}":\n\nI wanted to share our latest updates and confirm our action items for the upcoming milestone. Please let me know your availability for a quick sync tomorrow.\n\nBest regards,\nUser`
        );
        setIsGeneratingAi(false);
        showToast({
          title: 'AI Draft Generated',
          message: `Generated email draft in ${activeTone} tone.`,
          type: 'success',
        });
      }, 700);
    } catch {
      setIsGeneratingAi(false);
    }
  };

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      showToast({
        title: 'Missing Fields',
        message: 'Please fill in recipient, subject, and message body.',
        type: 'warning',
      });
      return;
    }

    try {
      await emailApi.sendEmail({ to, subject, body, cc: showCc ? cc : undefined });
      showToast({
        title: 'Email Sent',
        message: `Message dispatched to ${to}`,
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setComposeModalOpen(false);
      setTo('');
      setSubject('');
      setBody('');
    } catch (err: any) {
      showToast({
        title: 'Failed to send',
        message: err.message || 'Could not dispatch message',
        type: 'error',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl border-2 border-[#A0C3D2]/70 shadow-soft-lg flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 bg-[#EAE0DA]/60 border-b border-[#A0C3D2]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#E8A2A2] to-[#EAC7C7] flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">New Message with AI Assist</h3>
          </div>
          <button
            onClick={() => setComposeModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="p-6 space-y-3.5 flex-1 overflow-y-auto">
          {/* To */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-600 w-16">To:</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#F7F5EB] border border-[#A0C3D2]/60 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E8A2A2] focus:ring-2 focus:ring-[#E8A2A2]/30"
            />
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="text-xs text-slate-500 font-semibold hover:text-[#E8A2A2] cursor-pointer"
              >
                + CC
              </button>
            )}
          </div>

          {/* CC */}
          {showCc && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-600 w-16">CC:</label>
              <input
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="colleague@example.com"
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#F7F5EB] border border-[#A0C3D2]/60 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E8A2A2] focus:ring-2 focus:ring-[#E8A2A2]/30"
              />
            </div>
          )}

          {/* Subject */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-600 w-16">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#F7F5EB] border border-[#A0C3D2]/60 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E8A2A2] focus:ring-2 focus:ring-[#E8A2A2]/30 font-semibold"
            />
          </div>

          {/* AI Helper Bar */}
          <div className="p-3 rounded-2xl bg-[#D5E3E8]/40 border border-[#A0C3D2]/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-600">Tone:</span>
              {(['Professional', 'Friendly', 'Formal', 'Concise'] as ToneType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTone(t)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    activeTone === t
                      ? 'bg-[#E8A2A2] text-white shadow-soft-sm'
                      : 'bg-white/80 text-slate-700 hover:bg-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAiDraft}
              disabled={isGeneratingAi}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#A0C3D2] hover:bg-[#8eb3c3] text-slate-900 text-xs font-bold transition-all shadow-soft-sm cursor-pointer disabled:opacity-50"
            >
              {isGeneratingAi ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[#E8A2A2]" />
              )}
              <span>Auto-Draft with AI</span>
            </button>
          </div>

          {/* Body */}
          <textarea
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email here..."
            className="w-full p-3.5 text-xs rounded-xl bg-[#F7F5EB] border border-[#A0C3D2]/60 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#E8A2A2] focus:ring-2 focus:ring-[#E8A2A2]/30 resize-none font-sans leading-relaxed"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#EAE0DA]/40 border-t border-[#A0C3D2]/40 flex items-center justify-between">
          <button
            onClick={() => setComposeModalOpen(false)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Discard
          </button>

          <button
            onClick={handleSend}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8A2A2] hover:bg-[#de8f8f] text-white text-xs font-bold transition-all shadow-soft-sm hover:shadow-coral-glow cursor-pointer"
          >
            <Send className="w-4 h-4 text-white" />
            <span>Send Email</span>
          </button>
        </div>
      </div>
    </div>
  );
};
