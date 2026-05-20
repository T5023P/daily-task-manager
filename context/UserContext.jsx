"use client";

import React, { createContext, useContext } from 'react';

const ADMIN_EMAILS = [
  'topsecuritieslko@gmail.com',
  'arsh5023siddiqui@gmail.com'
];

const UserContext = createContext({ uid: '', email: '', isAdmin: false });

export const UserProvider = ({ uid, email, children }) => {
  const isAdmin = !!email && ADMIN_EMAILS.includes(email.toLowerCase());
  return (
    <UserContext.Provider value={{ uid, email, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};

// Keep useUid for backwards compatibility
export const useUid = () => {
  const ctx = useContext(UserContext);
  return ctx?.uid || '';
};
