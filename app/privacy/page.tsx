"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiShield } from "react-icons/fi";

export default function PrivacyPolicy() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] text-gray-800 dark:text-slate-200 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            <FiArrowLeft className="text-base" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <FiShield className="text-sm" /> PWA Compliance Verified
          </div>
        </div>

        {/* Article Body */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white sm:text-4xl tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-semibold">
              Last Updated: May 21, 2026
            </p>
          </div>

          <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            At <strong>Daily Task Manager</strong>, we prioritize the privacy and security of our users. 
            This Privacy Policy outlines how your information is handled within our offline-ready Progressive Web App (PWA).
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">1. Information We Collect & Process</h2>
            <p className="mb-4 leading-relaxed">
              <strong>Daily Task Manager</strong> is designed to offer robust offline performance. Most of your daily tasks, logs, and long-term order information are stored securely in local browser storage (IndexedDB / LocalStorage) on your device.
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2 leading-relaxed">
              <li>
                <strong>Account Data:</strong> If you choose to sync your data by creating an account, your authentication credentials (email, name) are securely processed through Firebase Authentication.
              </li>
              <li>
                <strong>Application Data:</strong> Syncing your tasks across devices uploads your task titles, dates, descriptions, payment logs, and categories to our secure Firebase Firestore databases.
              </li>
              <li>
                <strong>Payment Information:</strong> Our payment modules (Razorpay Integration) securely capture transaction details required for order logging and bookkeeping. Credit card numbers or account credentials are processed solely by Razorpay and never touch our servers.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2. How Your Data is Used</h2>
            <p className="mb-4 leading-relaxed">
              Your data is strictly utilized to provide you with the task management dashboard capabilities. We do not sell, rent, trade, or distribute your private information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">3. Data Security and Offline Mode</h2>
            <p className="mb-4 leading-relaxed">
              When working in offline mode, your data remains encapsulated entirely inside your device's local cache. Once connected, standard industry-grade HTTPS encryption is used to transmit any queued sync cycles to your private Firebase account dashboard.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-4 leading-relaxed">
              We leverage trusted cloud providers to power specific application segments:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2 leading-relaxed">
              <li><strong>Firebase (Google LLC):</strong> Cloud-based hosting, accounts, and synchronization backend.</li>
              <li><strong>Razorpay:</strong> Order and billing transactions processing.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">5. User Control & Deletion Rights</h2>
            <p className="mb-4 leading-relaxed">
              You maintain complete authority over your data. If you wish to delete your sync profile or wipe all cloud-synced task logs, you can do so through the dashboard's Account settings panel or request formal account termination by reaching out to support.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">6. Contact Us</h2>
            <p className="mb-4 leading-relaxed">
              For any questions regarding this privacy policy or your local offline database security, feel free to contact us at <strong>support@businesstask.com</strong>.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
