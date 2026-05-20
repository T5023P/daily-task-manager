"use client";

import React, { createContext, useContext } from 'react';

const ADMIN_EMAILS = [
  'topsecuritieslko@gmail.com',
  'arsh5023siddiqui@gmail.com'
];

const UserContext = createContext({ uid: '', email: '', isAdmin: false });

export const UserProvider = ({ uid, email, children }) => {
  const isAdmin = !!email && ADMIN_EMAILS.includes(email.toLowerCase());
  const value = React.useMemo(() => ({ uid, email, isAdmin }), [uid, email, isAdmin]);
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};

// Keep useUid for backwards compatibility, returning the full context object
export const useUid = () => {
  const ctx = useContext(UserContext);
  return ctx;
};
