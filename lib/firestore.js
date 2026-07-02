import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from './firebase';

// Ensure Firestore instance
export const db = getFirestore(app);

// Re-export common Firestore helpers for convenience
export { doc, setDoc };
