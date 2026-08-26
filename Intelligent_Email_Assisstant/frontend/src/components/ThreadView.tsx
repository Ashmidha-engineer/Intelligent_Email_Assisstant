import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  FileText,
  HelpCircle,
  CheckSquare,
  Send,
  Reply,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailApi, workflowApi } from '../api/index.js';
import { ThreadMessage, AIDraftRecord, ExecutionRecord } from '../api/client.js';
import { useInboxStore, ToneType } from '../store/useInboxStore.js';
import { formatDistanceToNow, parseISO } from 'date-fns';

export const ThreadView: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    selectedThreadId,
    activeTone,
    setActiveTone,
    currentDraft,
    setCurrentDraft,
    showToast,
  } = useInboxStore();

  const [customInstructions, setCustomInstructions] = useState('');
  const [summaryFormat, setSummaryFormat] = useState<'bullets' | 'paragraph'>('bullets');
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  // Fetch complete thread messages, past drafts, and executions
  const { data, isLoading } = useQuery<{
    threadId: string;
    messages: ThreadMessage[];
    drafts: AIDraftRecord[];
    executions: ExecutionRecord[];
  }>({
    queryKey: ['thread', selectedThreadId],
    queryFn: () => emailApi.getThread(selectedThreadId!),
    enabled: !!selectedThreadId,
  });

  // AI Workflow Mutations
  const summarizeMutation = useMutation({
    mutationFn: () => workflowApi.summarize(selectedThreadId!, summaryFormat),
    onSuccess: () => {
      showToast({
        title: 'Summarization Queued',
        message: 'AI is analyzing thread context...',
        type: 'info',
      });
    },
  });

  const generateReplyMutation = useMutation({
    mutationFn: () => workflowApi.generateReply(selectedThreadId!, activeTone, customInstructions),
    onSuccess: () => {
      showToast({
        title: 'Reply Generation Queued',
        message: `Drafting in ${activeTone} tone...`,
        type: 'info',
      });
    },
  });

  const explainMutation = useMutation({
    mutationFn: () => workflowApi.explain(selectedThreadId!),
    onSuccess: () => {
      showToast({
        title: 'Explanation Queued',
        message: 'Translating thread to plain English...',
        type: 'info',
      });
    },
  });

  const extractActionsMutation = useMutation({
    mutationFn: () => workflowApi.extractActions(selectedThreadId!),
    onSuccess: () => {
      showToast({
        title: 'Action Extraction Queued',
        message: 'Scanning commitments and due dates...',
        type: 'info',
      });
    },
  });

  const compoundMutation = useMutation({
    mutationFn: () => workflowApi.compound(selectedThreadId!, activeTone, customInstructions),
    onSuccess: () => {
      showToast({
        title: 'Compound AI Orchestration Queued',
        message: 'Running Summarize + Draft Reply + Action Extraction...',
        type: 'info',
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => {
      const lastMessage = messages[messages.length - 1];
      return emailApi.sendEmail({
        to: lastMessage?.from || 'recipient@example.com',
        subject: lastMessage?.subject?.startsWith('Re:')
          ? lastMessage.subject
          : `Re: ${lastMessage?.subject || 'Reply'}`,
        body: currentDraft,
        threadId: selectedThreadId!,
      });
    },
    onSuccess: () => {
      showToast({ title: 'Email Sent', message: 'Your reply has been sent successfully.', type: 'success' });
      setCurrentDraft('');
      setCustomInstructions('');
      queryClient.invalidateQueries({ queryKey: ['thread', selectedThreadId] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });

  const messages = data?.messages || [];
  const latestExecution = data?.executions?.[0];
  const latestDraft = data?.drafts?.[0];

  // Auto-populate draft if newly generated and draft editor is empty
  React.useEffect(() => {
    if (latestDraft && !currentDraft) {
      setCurrentDraft(latestDraft.content);
    }
  }, [latestDraft, currentDraft, setCurrentDraft]);

  const tones: { id: ToneType; label: string; desc: string }[] = [
    { id: 'Professional', label: 'Professional', desc: 'Balanced & Business-ready' },
    { id: 'Friendly', label: 'Friendly', desc: 'Warm & Conversational' },
    { id: 'Formal', label: 'Formal', desc: 'Polished & Respectful' },
    { id: 'Concise', label: 'Concise', desc: 'Direct & Brief' },
  ];

  if (!selectedThreadId) {
    return (
      <main className="flex-1 h-screen bg-[#F7F5EB] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-3xl bg-[#EAE0DA] border border-[#A0C3D2]/50 flex items-center justify-center mb-4 shadow-soft-sm">
          <Sparkles className="w-8 h-8 text-[#E8A2A2]" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Select an email to read</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Choose any thread from the inbox list on the left to review messages, run AI summarization, or generate smart replies.
        </p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="flex-1 h-screen bg-[#F7F5EB] flex flex-col items-center justify-center p-8">
        <div className="w-8 h-8 border-3 border-[#E8A2A2] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">Loading conversation thread...</p>
      </main>
    );
  }

  const subject = messages[0]?.subject || 'No Subject';

  return (
    <main className="flex-1 h-screen bg-[#F7F5EB] flex flex-col overflow-hidden">
      {/* Thread Action Header */}
      <header className="px-6 py-4 bg-white/90 backdrop-blur-md border-b border-[#A0C3D2]/40 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">{subject}</h1>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            <span>{messages.length} {messages.length === 1 ? 'message' : 'messages'} in thread</span>
            <span>•</span>
            <span className="text-[#E8A2A2] font-semibold">AI Assistant Connected</span>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => {
              const comp = document.getElementById('reply-composer');
              comp?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8A2A2] text-white text-xs font-semibold hover:bg-[#de8f8f] transition-all shadow-soft-sm cursor-pointer"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>
        </div>
      </header>

      {/* Main Scrollable Body (Messages + AI Copilot + Composer) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* ======================================================== */}
        {/* 🤖 AI COPILOT ACTION CAROUSEL / COMMAND BAR */}
        {/* ======================================================== */}
        <div className="p-4 rounded-2xl bg-[#EAE0DA]/60 border border-[#A0C3D2]/60 shadow-soft-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#E8A2A2] to-[#EAC7C7] flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                AI Copilot Actions
              </h3>
            </div>

            {/* Summarize Format Toggle */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/70 border border-[#A0C3D2]/40 text-[11px]">
              <button
                onClick={() => setSummaryFormat('bullets')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                  summaryFormat === 'bullets' ? 'bg-[#D5E3E8] text-slate-900' : 'text-slate-500'
                }`}
              >
                Bullets
              </button>
              <button
                onClick={() => setSummaryFormat('paragraph')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                  summaryFormat === 'paragraph' ? 'bg-[#D5E3E8] text-slate-900' : 'text-slate-500'
                }`}
              >
                Paragraph
              </button>
            </div>
          </div>

          {/* AI Workflow Triggers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Summarize */}
            <button
              onClick={() => summarizeMutation.mutate()}
              disabled={summarizeMutation.isPending}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-[#F7F5EB] border border-[#A0C3D2]/60 text-slate-800 text-xs font-semibold shadow-soft-sm hover:border-[#E8A2A2] transition-all cursor-pointer disabled:opacity-50"
            >
              {summarizeMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E8A2A2]" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-[#E8A2A2]" />
              )}
              <span>Summarize</span>
            </button>

            {/* 2. Compound AI (1-Click) */}
            <button
              onClick={() => compoundMutation.mutate()}
              disabled={compoundMutation.isPending}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#E8A2A2] hover:bg-[#de8f8f] text-white text-xs font-semibold shadow-soft-sm hover:shadow-coral-glow transition-all cursor-pointer disabled:opacity-50"
            >
              {compoundMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-white" />
              )}
              <span>Compound AI</span>
            </button>

            {/* 3. Explain in Plain English */}
            <button
              onClick={() => explainMutation.mutate()}
              disabled={explainMutation.isPending}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-[#F7F5EB] border border-[#A0C3D2]/60 text-slate-800 text-xs font-semibold shadow-soft-sm hover:border-[#A0C3D2] transition-all cursor-pointer disabled:opacity-50"
            >
              {explainMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A0C3D2]" />
              ) : (
                <HelpCircle className="w-3.5 h-3.5 text-[#A0C3D2]" />
              )}
              <span>Plain English</span>
            </button>

            {/* 4. Action Items */}
            <button
              onClick={() => extractActionsMutation.mutate()}
              disabled={extractActionsMutation.isPending}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white hover:bg-[#F7F5EB] border border-[#A0C3D2]/60 text-slate-800 text-xs font-semibold shadow-soft-sm hover:border-[#A0C3D2] transition-all cursor-pointer disabled:opacity-50"
            >
              {extractActionsMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>Action Items</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 📊 AI RESULTS CONTAINER (Summary, Actions, Explanation) */}
        {/* ======================================================== */}
        {latestExecution && latestExecution.output && (
          <div className="p-5 rounded-2xl bg-white border-2 border-[#EAC7C7] shadow-soft-md space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#EAE0DA] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  AI Output • {latestExecution.workflowType.replace('_', ' ')}
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Generated in {latestExecution.durationMs || 450}ms
              </span>
            </div>

            {/* If Output has Summary */}
            {(latestExecution.output.summary || typeof latestExecution.output === 'string') && (
              <div className="space-y-2.5">
                <div className="prose prose-sm text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {typeof latestExecution.output === 'string'
                    ? latestExecution.output
                    : latestExecution.output.summary}
                </div>

                {latestExecution.output.keyPoints && latestExecution.output.keyPoints.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#F7F5EB] border border-[#EAE0DA] space-y-1.5 mt-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase">Key Takeaways:</div>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                      {latestExecution.output.keyPoints.map((pt: string, idx: number) => (
                        <li key={idx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* If Output has Action Items */}
            {latestExecution.output.actionItems && latestExecution.output.actionItems.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#EAE0DA]">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>Action Items & Commitments</span>
                </div>
                <div className="space-y-2">
                  {latestExecution.output.actionItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-[#D5E3E8]/40 border border-[#A0C3D2]/50 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-800">{item.task}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>Assignee: <strong className="text-slate-700">{item.assignee}</strong></span>
                          <span>•</span>
                          <span>Due: <strong className="text-slate-700">{item.dueDate || 'N/A'}</strong></span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E8A2A2] text-white flex-shrink-0">
                        {item.priority || 'HIGH'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* If Output has Plain English Explanation */}
            {latestExecution.output.explanation && (
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {latestExecution.output.explanation}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 📬 THREAD MESSAGES CHRONOLOGICAL FEED */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Conversation History
          </div>

          {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            const isExpanded = expandedMessageId === msg.id || isLast;

            return (
              <div
                key={msg.id}
                className={`rounded-2xl border transition-all ${
                  isLast
                    ? 'bg-white border-[#A0C3D2]/70 shadow-soft-sm'
                    : 'bg-white/80 border-[#EAE0DA]'
                }`}
              >
                {/* Message Header */}
                <div
                  onClick={() => setExpandedMessageId(isExpanded ? null : msg.id)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#D5E3E8] border border-[#A0C3D2] flex items-center justify-center font-bold text-xs text-slate-700 flex-shrink-0">
                      {msg.from[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {msg.from.split('<')[0].replace(/"/g, '').trim()}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">
                          &lt;{msg.from.split('<')[1]?.replace('>', '') || msg.from}&gt;
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">To: {msg.to}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 flex-shrink-0">
                    <span>
                      {formatDistanceToNow(parseISO(msg.receivedAt), { addSuffix: true })}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Message Body Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs text-slate-700 leading-relaxed">
                    {msg.bodyHtml ? (
                      <div
                        className="prose prose-sm max-w-none break-words"
                        dangerouslySetInnerHTML={{ __html: msg.bodyHtml }}
                      />
                    ) : (
                      <p className="whitespace-pre-line">{msg.bodyPlain || msg.snippet}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* ✍️ CONTEXT-AWARE SMART REPLY COMPOSER */}
        {/* ======================================================== */}
        <div
          id="reply-composer"
          className="p-5 rounded-2xl bg-white border-2 border-[#A0C3D2]/60 shadow-soft-md space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#EAE0DA] pb-3">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4 text-[#E8A2A2]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Smart Reply Copilot
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Drafting reply to {messages[messages.length - 1]?.from.split('<')[0].trim()}
            </span>
          </div>

          {/* Tone Personas Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Tone Persona:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tones.map((t) => {
                const isSelected = activeTone === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTone(t.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EAC7C7]/50 border-[#E8A2A2] shadow-soft-sm font-bold text-slate-900'
                        : 'bg-[#F7F5EB] border-[#EAE0DA] hover:bg-[#D5E3E8]/50 text-slate-600 font-medium'
                    }`}
                  >
                    <div className="text-xs font-bold">{t.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Instruction Input & Generate Button */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Custom instructions (e.g. 'accept the Tuesday meeting at 2 PM')..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-[#F7F5EB] border border-[#A0C3D2]/60 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E8A2A2] focus:ring-2 focus:ring-[#E8A2A2]/30 transition-all"
            />
            <button
              onClick={() => generateReplyMutation.mutate()}
              disabled={generateReplyMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A0C3D2] hover:bg-[#8eb3c3] text-slate-900 text-xs font-bold transition-all shadow-soft-sm cursor-pointer disabled:opacity-50 flex-shrink-0"
            >
              {generateReplyMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[#E8A2A2]" />
              )}
              <span>Generate AI Draft</span>
            </button>
          </div>

          {/* Reply Textarea */}
          <textarea
            rows={5}
            value={currentDraft}
            onChange={(e) => setCurrentDraft(e.target.value)}
            placeholder="Type your response here or click 'Generate AI Draft' above..."
            className="w-full p-3.5 text-xs rounded-xl bg-[#F7F5EB]/60 border border-[#A0C3D2]/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#E8A2A2] focus:ring-2 focus:ring-[#E8A2A2]/30 transition-all resize-none font-sans leading-relaxed"
          />

          {/* Send Actions */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400 font-medium">
              Review and edit the AI draft before sending.
            </span>
            <button
              onClick={() => sendEmailMutation.mutate()}
              disabled={!currentDraft.trim() || sendEmailMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8A2A2] hover:bg-[#de8f8f] text-white text-xs font-bold transition-all shadow-soft-md hover:shadow-coral-glow cursor-pointer disabled:opacity-40"
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
              <span>Send Reply</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
