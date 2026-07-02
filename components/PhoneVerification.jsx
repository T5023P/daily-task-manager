"use client";

import React, { useState, useRef, useEffect } from 'react';
import { RecaptchaVerifier, PhoneAuthProvider, linkWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../lib/auth';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';

export default function PhoneVerification({ user, onVerified }) {
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const recaptchaRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch (e) {}
      }
    };
  }, []);

  const setupRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try { recaptchaVerifierRef.current.clear(); } catch (e) {}
    }
    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
      size: 'invisible',
      callback: () => {},
    });
    return recaptchaVerifierRef.current;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length < 10) {
      setError('Enter a valid phone number with country code');
      return;
    }

    setLoading(true);
    try {
      // Check if phone already used (limit to 5 accounts per number)
      const phoneDoc = await getDoc(doc(db, 'phones', cleaned));
      if (phoneDoc.exists()) {
        const data = phoneDoc.data();
        const uids = data.uids || (data.uid ? [data.uid] : []);
        if (uids.length >= 5) {
          setError('This phone number has already been used for the maximum limit of 5 accounts.');
          setLoading(false);
          return;
        }
      }

      const verifier = setupRecaptcha();
      const provider = new PhoneAuthProvider(auth);
      const vId = await provider.verifyPhoneNumber(cleaned, verifier);
      setVerificationId(vId);
      setStep('otp');
    } catch (err) {
      console.error('Send OTP error:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Use +91XXXXXXXXXX');
      } else {
        setError(err.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length < 6) {
      setError('Enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await linkWithCredential(user, credential);

      const cleaned = phone.replace(/\s/g, '');
      const now = new Date().toISOString();

      const phoneDoc = await getDoc(doc(db, 'phones', cleaned));
      let uids = [];
      if (phoneDoc.exists()) {
        const data = phoneDoc.data();
        uids = data.uids || (data.uid ? [data.uid] : []);
      }
      if (!uids.includes(user.uid)) {
        uids.push(user.uid);
      }

      // Store user trial info
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        phone: cleaned,
        trialStartDate: now,
        verified: true,
      }, { merge: true });

      // Mark phone as used
      await setDoc(doc(db, 'phones', cleaned), {
        uids,
        lastUsedAt: now,
      });

      onVerified();
    } catch (err) {
      console.error('Verify OTP error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please try again.');
      } else if (err.code === 'auth/credential-already-in-use') {
        // Phone is already linked in Firebase Auth to another account, but OTP is valid!
        // Allow up to 5 accounts per phone number
        try {
          const cleaned = phone.replace(/\s/g, '');
          const now = new Date().toISOString();
          const phoneDoc = await getDoc(doc(db, 'phones', cleaned));
          let uids = [];
          if (phoneDoc.exists()) {
            const data = phoneDoc.data();
            uids = data.uids || (data.uid ? [data.uid] : []);
          }
          
          if (!uids.includes(user.uid)) {
            uids.push(user.uid);
          }
          
          if (uids.length > 5) {
            setError('This phone number has already been used for the maximum limit of 5 accounts.');
          } else {
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              phone: cleaned,
              trialStartDate: now,
              verified: true,
            }, { merge: true });
            
            await setDoc(doc(db, 'phones', cleaned), {
              uids,
              lastUsedAt: now,
            });
            onVerified();
          }
        } catch (dbErr) {
          setError(dbErr.message || 'Database update failed');
        }
      } else if (err.code === 'auth/provider-already-linked') {
        // Phone already linked to this account — just save trial
        const cleaned = phone.replace(/\s/g, '');
        const now = new Date().toISOString();
        const phoneDoc = await getDoc(doc(db, 'phones', cleaned));
        let uids = [];
        if (phoneDoc.exists()) {
          const data = phoneDoc.data();
          uids = data.uids || (data.uid ? [data.uid] : []);
        }
        if (!uids.includes(user.uid)) {
          uids.push(user.uid);
        }
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          phone: cleaned,
          trialStartDate: now,
          verified: true,
        }, { merge: true });
        await setDoc(doc(db, 'phones', cleaned), { uids, lastUsedAt: now });
        onVerified();
      } else {
        setError(err.message || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0F172A] transition-colors p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-sm w-full flex flex-col items-center text-center"
      >
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20">
          <span className="text-2xl">📱</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Verify Your Phone</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-8">
          {step === 'phone'
            ? 'Enter your phone number to start your 7-day free trial'
            : `Enter the OTP sent to ${phone}`}
        </p>

        {error && (
          <p className="text-xs text-red-500 mb-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl w-full">{error}</p>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="w-full flex flex-col gap-4">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full px-4 py-3.5 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-2xl text-base text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold tracking-wider"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="w-full flex flex-col gap-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="______"
              className="w-full px-4 py-3.5 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-2xl text-2xl text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono tracking-[0.5em]"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? 'Verifying...' : 'Verify & Start Trial'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Change number
            </button>
          </form>
        )}

        <div ref={recaptchaRef} id="recaptcha-container" />
      </motion.div>
    </div>
  );
}
