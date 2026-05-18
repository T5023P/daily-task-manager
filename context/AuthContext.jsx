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
  // DUMMY USER SCENARIO:
  const [user, setUser] = useState({ name: "Guest", role: "admin" });
  const [loading, setLoading] = useState(false);

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
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
