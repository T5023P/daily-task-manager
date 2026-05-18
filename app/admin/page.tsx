"use client";

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiLock } from 'react-icons/fi';

export default function AdminPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100 text-center max-w-md w-full">
        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiLock className="text-3xl text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 mb-6">
          Hello, {user?.name || "User"}. This area is currently under construction.
        </p>
        <div className="inline-block bg-amber-100 text-amber-800 font-bold px-4 py-2 rounded-lg text-sm tracking-wide">
          COMING SOON
        </div>
      </div>
    </div>
  );
}
