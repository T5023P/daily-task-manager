"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function LoginPage({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shouldShake, setShouldShake] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD || "Top@123";
    
    if (password === correctPassword) {
      if (rememberMe) {
        localStorage.setItem('app_authenticated', 'true');
      } else {
        sessionStorage.setItem('app_authenticated', 'true');
      }
      onSuccess();
    } else {
      setError('Incorrect password');
      setShouldShake(true);
      setPassword('');
      setTimeout(() => setShouldShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#0F172A] overflow-hidden font-sans">
      {/* Premium background styling with ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[100px]" />
      
      <div className="absolute inset-0 backdrop-blur-xl z-0" />

      <motion.div 
        animate={shouldShake ? "shake" : "idle"}
        variants={{
          shake: {
            x: [0, -10, 10, -10, 10, -10, 10, 0],
            transition: { duration: 0.4 }
          },
          idle: { x: 0 }
        }}
        className="relative z-10 max-w-md w-full mx-4 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800/80"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl mb-4 font-black text-2xl">
            📅
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Daily Task Manager</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Please enter your password to continue</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="relative">
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              className="appearance-none block w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/70 text-slate-950 dark:text-white rounded-2xl shadow-inner placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
              placeholder="Enter Password" 
            />
            {error && (
              <p className="text-red-500 text-xs font-semibold mt-2 absolute -bottom-5 left-1 animate-pulse">
                {error}
              </p>
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
          >
            Enter
          </button>
        </form>
      </motion.div>
    </div>
  );
}
