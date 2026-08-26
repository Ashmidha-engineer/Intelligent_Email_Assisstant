import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, integrationApi } from '../api/index.js';
import {
  Settings,
  Sparkles,
  Mail,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { useInboxStore, ToneType } from '../store/useInboxStore.js';

export const SettingsView: React.FC = () => {
  const queryClient = useQueryClient();
  const showToast = useInboxStore((state) => state.showToast);

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getSettings,
  });

  const { data: integrationsData } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationApi.getStatus,
  });

  const [defaultTone, setDefaultTone] = useState<ToneType>('Professional');
  const [aiProvider, setAiProvider] = useState('claude');
  const [autoClassify, setAutoClassify] = useState(true);

  React.useEffect(() => {
    if (settingsData?.settings) {
      setDefaultTone(settingsData.settings.defaultTone || 'Professional');
      setAiProvider(settingsData.settings.aiProvider || 'claude');
      setAutoClassify(settingsData.settings.autoClassify ?? true);
    }
  }, [settingsData]);

  const updateSettingsMutation = useMutation({
    mutationFn: () =>
      settingsApi.updateSettings({
        defaultTone,
        aiProvider,
        autoClassify,
      }),
    onSuccess: () => {
      showToast({
        title: 'Settings Saved',
        message: 'Your AI and notification preferences have been updated.',
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const integrations = integrationsData?.integrations || [
    { id: 'google-gmail', name: 'Google Gmail', type: 'email', connected: true },
    { id: 'anthropic-claude', name: 'Anthropic Claude AI', type: 'ai', connected: true },
    { id: 'openai-gpt4', name: 'OpenAI GPT-4o', type: 'ai', connected: true },
    { id: 'microsoft-outlook', name: 'Microsoft Outlook', type: 'email', connected: false },
  ];

  return (
    <div className="flex-1 h-screen bg-[#F7F5EB] overflow-y-auto p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#A0C3D2]/40 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E8A2A2] to-[#EAC7C7] flex items-center justify-center text-white">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Settings & Integrations</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure connected email accounts, AI tone presets, and notification channels.
          </p>
        </div>

        <button
          onClick={() => updateSettingsMutation.mutate()}
          disabled={updateSettingsMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8A2A2] hover:bg-[#de8f8f] text-white text-xs font-bold transition-all shadow-soft-sm hover:shadow-coral-glow cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-white" />
          <span>Save Preferences</span>
        </button>
      </div>

      {/* Grid: Integrations + AI Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connected Services */}
        <div className="p-6 rounded-3xl bg-white border border-[#A0C3D2]/60 shadow-soft-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EAE0DA]">
            <Mail className="w-4 h-4 text-[#E8A2A2]" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Connected Providers
            </h3>
          </div>

          <div className="space-y-3">
            {integrations.map((item: any) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#F7F5EB] border border-[#EAE0DA] flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                  <p className="text-[11px] text-slate-500">
                    {item.connected ? 'Active connection' : 'Not configured / Available'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.connected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Connected
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-600">
                      Disconnected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Behavior & Default Tone */}
        <div className="p-6 rounded-3xl bg-white border border-[#A0C3D2]/60 shadow-soft-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#EAE0DA]">
            <Sparkles className="w-4 h-4 text-[#E8A2A2]" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              AI Engine Preferences
            </h3>
          </div>

          {/* Default Tone Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Default Reply Tone</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Professional', 'Friendly', 'Formal', 'Concise'] as ToneType[]).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setDefaultTone(tone)}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                    defaultTone === tone
                      ? 'bg-[#EAC7C7]/50 border-[#E8A2A2] text-slate-900 shadow-soft-sm'
                      : 'bg-[#F7F5EB] border-[#EAE0DA] text-slate-600 hover:bg-[#D5E3E8]/40'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* AI Model Router */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-slate-700">Preferred AI Provider</label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl bg-[#F7F5EB] border border-[#A0C3D2]/60 text-slate-800 focus:outline-none focus:border-[#E8A2A2]"
            >
              <option value="claude">Anthropic Claude 3.5 Sonnet (Recommended)</option>
              <option value="openai">OpenAI GPT-4o Mini</option>
              <option value="gemini">Google Gemini 1.5 Flash</option>
              <option value="simulation">Intelligent Simulator (Zero API Key)</option>
            </select>
          </div>

          {/* Auto Classification Toggle */}
          <div className="pt-3 border-t border-[#EAE0DA] flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Auto-Classify & Priority Scoring</h4>
              <p className="text-[11px] text-slate-500">Automatically tag incoming emails with urgency levels</p>
            </div>
            <input
              type="checkbox"
              checked={autoClassify}
              onChange={(e) => setAutoClassify(e.target.checked)}
              className="w-4 h-4 rounded text-[#E8A2A2] focus:ring-[#E8A2A2]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
