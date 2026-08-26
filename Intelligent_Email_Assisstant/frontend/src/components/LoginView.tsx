import React, { useState } from 'react';
import { Mail, Sparkles, Shield, Zap, CheckCircle, ArrowRight, User as UserIcon, LogIn, AtSign } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { API_BASE_URL } from '../api/client.js';

export const LoginView: React.FC = () => {
  const { emailLogin, isEmailLoginLoading, demoLogin, isDemoLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loginMode, setLoginMode] = useState<'email' | 'options'>('email');

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    await emailLogin({ email: email.trim(), name: name.trim() });
  };

  return (
    <div className="min-h-screen bg-[#F7F5EB] flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      {/* Background Decorative Gradient Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#EAC7C7] opacity-40 blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-[#D5E3E8] opacity-50 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-[#A0C3D2] opacity-35 blur-3xl" />
      </div>

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-3xl border-2 border-[#A0C3D2]/50 shadow-soft-lg p-7 sm:p-9">
        {/* App Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E8A2A2] to-[#EAC7C7] flex items-center justify-center shadow-soft-md mb-4 border border-white/60">
            <Mail className="w-7 h-7 text-white" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D5E3E8]/80 border border-[#A0C3D2]/60 text-xs font-semibold text-slate-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#E8A2A2]" />
            AI-Powered Email Copilot
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Intelligent Email Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm">
            Sign in with your email to manage your inbox with AI summarization and tone-aware replies.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2 my-5">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F7F5EB] border border-[#EAE0DA]">
            <CheckCircle className="w-3.5 h-3.5 text-[#E8A2A2] flex-shrink-0" />
            <span className="text-[11px] font-semibold text-slate-700">1-Click Summaries</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F7F5EB] border border-[#EAE0DA]">
            <CheckCircle className="w-3.5 h-3.5 text-[#A0C3D2] flex-shrink-0" />
            <span className="text-[11px] font-semibold text-slate-700">4 Tone Personas</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F7F5EB] border border-[#EAE0DA]">
            <CheckCircle className="w-3.5 h-3.5 text-[#A0C3D2] flex-shrink-0" />
            <span className="text-[11px] font-semibold text-slate-700">Action Tracker</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F7F5EB] border border-[#EAE0DA]">
            <CheckCircle className="w-3.5 h-3.5 text-[#E8A2A2] flex-shrink-0" />
            <span className="text-[11px] font-semibold text-slate-700">MongoDB Atlas Synced</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 📧 DIRECT EMAIL SIGN-IN FORM */}
        {/* ======================================================== */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5 pt-2">
          {/* Email Address Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5 text-[#E8A2A2]" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ashmidha@example.com"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F7F5EB] border border-[#A0C3D2]/70 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#E8A2A2] focus:ring-2 focus:ring-[#E8A2A2]/30 transition-all font-medium"
            />
          </div>

          {/* User Name Input (Optional) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-[#A0C3D2]" />
              <span>Your Name <span className="text-[10px] text-slate-400 font-normal">(optional)</span></span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ashmidha"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F7F5EB] border border-[#A0C3D2]/70 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#E8A2A2] focus:ring-2 focus:ring-[#E8A2A2]/30 transition-all font-medium"
            />
          </div>

          {/* Submit Email Button */}
          <button
            type="submit"
            disabled={!email.trim() || isEmailLoginLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#E8A2A2] hover:bg-[#de8f8f] text-white font-bold text-xs shadow-soft-md hover:shadow-coral-glow transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            {isEmailLoginLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4 text-white" />
                <span>Continue with Email</span>
                <ArrowRight className="w-4 h-4 text-white/80" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-[#EAE0DA] w-full" />
          <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
            or quick access
          </span>
        </div>

        {/* Alternate Quick Sign-in Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Instant Demo Sandbox */}
          <button
            type="button"
            onClick={() => demoLogin()}
            disabled={isDemoLoading}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#D5E3E8] hover:bg-[#c2d7df] text-slate-800 text-xs font-semibold border border-[#A0C3D2]/60 shadow-soft-sm transition-all cursor-pointer disabled:opacity-60"
          >
            {isDemoLoading ? (
              <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-[#E8A2A2]" />
                <span>Demo Account</span>
              </>
            )}
          </button>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-[#F7F5EB] text-slate-800 text-xs font-semibold border border-[#A0C3D2]/60 shadow-soft-sm transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google OAuth</span>
          </button>
        </div>

        {/* Security & Privacy Footer */}
        <div className="mt-5 pt-4 border-t border-[#EAE0DA] flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <Shield className="w-3.5 h-3.5 text-[#A0C3D2]" />
          <span>MongoDB Atlas Connected • AES-256 Encrypted • Secure Session</span>
        </div>
      </div>
    </div>
  );
};
