"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithGoogle, auth } from '../lib/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
export default function LoginPage({ onSuccess }) {
  // UI mode toggle
  const [useEmailLogin, setUseEmailLogin] = useState(false);

  // Google login state (existing password flow kept for demo purposes)
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shouldShake, setShouldShake] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Email login state
  const [email, setEmail] = useState('');
  const [emailPwd, setEmailPwd] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // ---------------------------------------------------------------
  // Simple password handler (kept for backward compatibility)
  // ---------------------------------------------------------------
  const handleSubmit = async (e) => {
  e.preventDefault();
  const { adminLogin } = useAuth(); // get adminLogin from context
  const success = adminLogin('test@test.in', password);
  if (success) {
    if (rememberMe) {
      localStorage.setItem('app_authenticated', 'true');
    } else {
      sessionStorage.setItem('app_authenticated', 'true');
    }
    onSuccess();
  } else {
    setError('Incorrect admin credentials');
    setShouldShake(true);
    setPassword('');
    setTimeout(() => setShouldShake(false), 500);
  }
};

  // ---------------------------------------------------------------
  // Email & password sign‑in using Firebase Auth
  // ---------------------------------------------------------------
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, emailPwd);
      onSuccess();
    } catch (err) {
      console.error('Email sign‑in error:', err);
      setEmailError(err.message || 'Sign‑in failed');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#0F172A] overflow-hidden font-sans">
      {/* Premium background styling */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[100px]" />
      <div className="absolute inset-0 backdrop-blur-xl z-0" />

      <motion.div
        animate={shouldShake ? "shake" : "idle"}
        variants={{
          shake: { x: [0, -10, 10, -10, 10, -10, 10, 0], transition: { duration: 0.4 } },
          idle: { x: 0 }
        }}
        className="relative z-10 max-w-md w-full mx-4 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800/80"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl mb-4 font-black text-2xl">📅</div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Daily Task Manager</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Please sign in to continue</p>
        </div>

        {/* Mode switch */}
        <div className="flex justify-center gap-4 my-4">
          <button
            type="button"
            onClick={() => setUseEmailLogin(false)}
            className={`px-3 py-1 rounded ${!useEmailLogin ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >Google</button>
          <button
            type="button"
            onClick={() => setUseEmailLogin(true)}
            className={`px-3 py-1 rounded ${useEmailLogin ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >Email</button>
        </div>

        {/* Simple password section (legacy) */}
        {!useEmailLogin && (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                className="appearance-none block w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/70 text-slate-950 dark:text-white rounded-2xl shadow-inner placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                placeholder="Enter Password"
              />
              {error && (
                <p className="text-red-500 text-xs font-semibold mt-2 absolute -bottom-5 left-1 animate-pulse">{error}</p>
              )}
            </div>
            <div className="flex items-center pt-1 pl-1">
              <input
                id="remember_me"
                name="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 rounded cursor-pointer transition-colors"
              />
              <label htmlFor="remember_me" className="ml-2 block text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                Remember this device
              </label>
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-95 mt-4"
            >Enter</button>
          </form>
        )}

        {/* Email + password section */}
        {useEmailLogin && (
          <form className="mt-8 space-y-5" onSubmit={handleEmailLogin}>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                className="appearance-none block w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/70 text-slate-950 dark:text-white rounded-2xl shadow-inner placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                placeholder="Email address"
              />
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={emailPwd}
                onChange={(e) => { setEmailPwd(e.target.value); if (emailError) setEmailError(''); }}
                className="appearance-none block w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/70 text-slate-950 dark:text-white rounded-2xl shadow-inner placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                placeholder="Password"
              />
            </div>
            {emailError && (
              <p className="text-red-500 text-xs font-semibold mt-2 animate-pulse">{emailError}</p>
            )}
            <button
              type="submit"
              disabled={emailLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all active:scale-95 mt-4"
            >
              {emailLoading ? 'Signing in…' : 'Sign in with Email'}
            </button>
          </form>
        )}

        {/* Google sign‑in button (always visible) */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={async () => {
              try {
                await signInWithGoogle();
                onSuccess();
              } catch (err) {
                console.error('Google sign‑in error:', err);
                setError(err?.message || 'Google sign‑in failed');
              }
            }}
            className="flex items-center gap-2 py-2 px-4 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md hover:shadow-lg text-sm font-semibold text-gray-700 dark:text-gray-200 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            Sign in with Google
          </button>
        </div>
      </motion.div>
    </div>
  );
}
