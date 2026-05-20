"use client";

import React, { createContext, useContext } from 'react';

const UserContext = createContext({ uid: '' });

export const UserProvider = ({ uid, children }) => (
  <UserContext.Provider value={{ uid }}>{children}</UserContext.Provider>
);

export const useUid = () => {
  const ctx = useContext(UserContext);
  return ctx?.uid || '';
};
