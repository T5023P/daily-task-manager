"use client";

import React, { createContext, useContext } from 'react';

const ADMIN_EMAILS = [
  'topsecuritieslko@gmail.com',
  'arsh5023siddiqui@gmail.com'
];

// Users who can see the new beta features (Priority, Outstanding Collections, At-a-Glance)
const BETA_EMAILS = [
  'zuhaib@test.com'
];

const UserContext = createContext({ uid: '', email: '', isAdmin: false, betaFeatures: false });

export const UserProvider = ({ uid, email, children }) => {
  const lower = email ? email.toLowerCase() : '';
  const isAdmin = !!lower && ADMIN_EMAILS.includes(lower);
  const betaFeatures = !!lower && BETA_EMAILS.includes(lower);
  const value = React.useMemo(() => ({ uid, email, isAdmin, betaFeatures }), [uid, email, isAdmin, betaFeatures]);
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};

// Returns true only for users allowed to see the new beta features
export const useBetaFeatures = () => {
  const ctx = useContext(UserContext);
  return !!ctx?.betaFeatures;
};

// Keep useUid for backwards compatibility, returning the full context object
export const useUid = () => {
  const ctx = useContext(UserContext);
  return ctx;
};
