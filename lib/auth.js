import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { app } from './firebase';

export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

const isMobile = () =>
  typeof window !== 'undefined' &&
  (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    window.matchMedia('(max-width: 1023px)').matches);

export const signInWithGoogle = () => {
  if (isMobile()) {
    return signInWithRedirect(auth, googleProvider);
  }
  return signInWithPopup(auth, googleProvider);
};

export const completeRedirectSignIn = () => getRedirectResult(auth);

export const logOut = () => signOut(auth);

export { onAuthStateChanged };
