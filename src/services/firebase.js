// src/services/firebase.js - VERSION CORRIGÉE
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCa_Ri4775mSkBRKpJz4wxQBNyU1IzvQZ8",
  authDomain: "ratrappage.firebaseapp.com",
  projectId: "ratrappage",
  storageBucket: "ratrappage.firebasestorage.app",
  messagingSenderId: "270502542618",
  appId: "1:270502542618:web:5e039ab19c264be174c0a3"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// ✅ CORRECTION : Utiliser initializeAuth avec persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialiser Firestore et Storage
const db = getFirestore(app);
const storage = getStorage(app);

// Pour compatibilité avec le code existant
export { auth, db, storage };

// Exporter l'instance app au cas où
export default app;