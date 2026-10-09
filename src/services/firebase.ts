import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { doc, getDocFromServer, onSnapshot, setDoc, getDoc, signInWithPopup, signOut, onAuthStateChanged, type User };

