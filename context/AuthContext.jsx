"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from '../lib/auth';

/*
 * ========================================================
 * TO ENABLE REAL FIREBASE AUTHENTICATION:
 * 1. Uncomment the imports above (`onAuthStateChanged`, `auth`)
 * 2. Delete the dummy user initialization: `const [user, setUser] = useState({ name: "Guest", role: "admin" });`
 * 3. Uncomment the real state & useEffect block below to listen to Firebase auth state.
 * ========================================================
 */

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Use real or admin authentication based on env vars
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set loading to false on mount so page.tsx can handle its own auth
  useEffect(() => {
    setLoading(false);
  }, []);

  // Admin login using env vars
  const adminLogin = (email, password) => {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (email === adminEmail && password === adminPass) {
      setUser({ name: 'Admin', role: 'admin' });
      setLoading(false);
      return true;
    }
    return false;
  };

  // REAL AUTHENTICATION SCENARIO (Uncomment to enable):
  /*
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  */

  return (
    <AuthContext.Provider value={{ user, loading, adminLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
