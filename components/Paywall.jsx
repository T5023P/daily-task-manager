"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logOut } from '../lib/auth';

export default function Paywall({ user, onSubscribed }) {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plans = {
    monthly: {
      label: 'Monthly',
      price: '₹499',
      period: '/month',
      planId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_MONTHLY,
    },
    annual: {
      label: 'Annual',
      price: '₹4999',
      period: '/year',
      badge: 'Save 16%',
      planId: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ANNUAL,
    },
  };

  const handleSubscribe = async () => {
    setError('');
    setLoading(true);

    try {
      const plan = plans[selectedPlan];

      // Create subscription via API
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.planId,
          userId: user.uid,
          email: user.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create subscription');

      // Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: 'Daily Task Manager',
        description: `${plan.label} Subscription`,
        prefill: {
          email: user.email,
          name: user.displayName || '',
        },
        theme: { color: '#2563eb' },
        handler: async (response) => {
          // Payment successful — poll Firestore for subscription activation
          let attempts = 0;
          const checkSubscription = async () => {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().subscriptionStatus === 'active') {
              onSubscribed();
              return;
            }
            attempts++;
            if (attempts < 10) {
              setTimeout(checkSubscription, 2000);
            } else {
              // Webhook might be slow — just let them in
              onSubscribed();
            }
          };
          checkSubscription();
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0F172A] transition-colors p-4">
      {/* Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-sm w-full flex flex-col items-center"
      >
        <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
          <span className="text-2xl">⏰</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight text-center">Trial Expired</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-8 text-center">
          Your 1-year free trial has ended. Subscribe to continue.
        </p>

        {error && (
          <p className="text-xs text-red-500 mb-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl w-full text-center">{error}</p>
        )}

        {/* Plan selection */}
        <div className="w-full flex flex-col gap-3 mb-6">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
              selectedPlan === 'monthly'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B]'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-gray-900 dark:text-white">Monthly</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Billed every month</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-gray-900 dark:text-white">₹499</div>
                <div className="text-xs text-gray-500">/month</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedPlan('annual')}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative ${
              selectedPlan === 'annual'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B]'
            }`}
          >
            <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full uppercase">
              Save 16%
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-gray-900 dark:text-white">Annual</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Billed once a year</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-gray-900 dark:text-white">₹4999</div>
                <div className="text-xs text-gray-500">/year</div>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? 'Processing...' : 'Subscribe Now'}
        </button>

        <button
          onClick={() => logOut()}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Sign out
        </button>
      </motion.div>
    </div>
  );
}
