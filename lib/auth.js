import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
} from 'firebase/auth';
import { app } from './firebase';

export const auth = getAuth(app);

if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error('Failed to set auth persistence:', err);
  });
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const logOut = () => signOut(auth);

export const signInWithEmail = (email, password) =>
  firebaseSignInWithEmailAndPassword(auth, email, password);

export const createAccountWithEmail = (email, password) =>
  firebaseCreateUserWithEmailAndPassword(auth, email, password);

export { onAuthStateChanged };
