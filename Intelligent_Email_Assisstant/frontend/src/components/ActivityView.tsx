import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executionApi } from '../api/index.js';
import { ExecutionRecord } from '../api/client.js';
import {
  Activity,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Code,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useInboxStore } from '../store/useInboxStore.js';

export const ActivityView: React.FC = () => {
  const queryClient = useQueryClient();
  const showToast = useInboxStore((state) => state.showToast);
  const [selectedExecution, setSelectedExecution] = useState<ExecutionRecord | null>(null);

  const { data, isLoading } = useQuery<{ executions: ExecutionRecord[] }>({
    queryKey: ['executions'],
    queryFn: () => executionApi.listExecutions(50),
    refetchInterval: 5000,
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => executionApi.retry(id),
    onSuccess: () => {
      showToast({
        title: 'Execution Re-queued',
        message: 'Job dispatched to background worker.',
        type: 'info',
      });
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
  });

  const executions = data?.executions || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            SUCCEEDED
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D5E3E8] text-slate-800 border border-[#A0C3D2] animate-pulse">
            <Sparkles className="w-3 h-3 text-[#E8A2A2]" />
            RUNNING
          </span>
        );
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            QUEUED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            FAILED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 h-screen bg-[#F7F5EB] overflow-y-auto p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#A0C3D2]/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E8A2A2] to-[#EAC7C7] flex items-center justify-center text-white">
              <Activity className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">AI Execution Log & Audit</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry and audit trail of all AI tasks, queue dispatches, and provider latencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-[#A0C3D2]/50 text-xs font-semibold text-slate-700 shadow-soft-sm">
            Total Jobs: <strong>{executions.length}</strong>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-[#A0C3D2]/60 shadow-soft-md overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-[#E8A2A2] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Fetching telemetry records...</p>
          </div>
        ) : executions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-1">
            <Activity className="w-10 h-10 mx-auto text-[#A0C3D2] stroke-[1.5]" />
            <p className="text-xs font-bold text-slate-700">No executions recorded yet</p>
            <p className="text-[11px] text-slate-400">
              Trigger a workflow from the inbox (Summarize, Reply, Compound AI) to see logs here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#EAE0DA]/50 border-b border-[#A0C3D2]/40 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Workflow Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE0DA]">
                {executions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-[#F7F5EB]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E8A2A2]" />
                      <span className="capitalize">{ex.workflowType.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(ex.status)}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {ex.durationMs ? `${ex.durationMs}ms` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDistanceToNow(parseISO(ex.createdAt), { addSuffix: true })}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedExecution(ex)}
                        className="px-2.5 py-1 rounded-lg bg-[#D5E3E8] hover:bg-[#c2d7df] text-slate-800 font-semibold text-[11px] transition-all cursor-pointer"
                      >
                        Inspect
                      </button>
                      {ex.status === 'FAILED' && (
                        <button
                          onClick={() => retryMutation.mutate(ex.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#EAC7C7] hover:bg-[#deb1b1] text-rose-900 font-semibold text-[11px] transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3 inline mr-1" />
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Output Inspect Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl border-2 border-[#A0C3D2] shadow-soft-lg p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE0DA]">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#E8A2A2]" />
                <h3 className="text-sm font-bold text-slate-900 capitalize">
                  {selectedExecution.workflowType.replace('_', ' ')} Execution Payload
                </h3>
              </div>
              <button
                onClick={() => setSelectedExecution(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Output JSON:</label>
              <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed">
                {JSON.stringify(
                  typeof selectedExecution.output === 'string'
                    ? JSON.parse(selectedExecution.output)
                    : selectedExecution.output,
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-[#EAE0DA]">
              <span>ID: <code className="font-mono">{selectedExecution.id}</code></span>
              <span>Latency: <strong>{selectedExecution.durationMs || 0}ms</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
