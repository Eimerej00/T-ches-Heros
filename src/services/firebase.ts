import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export { doc, getDocFromServer, onSnapshot, setDoc, getDoc };
