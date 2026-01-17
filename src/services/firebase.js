// Firebase JS SDK (pour React Native avec Expo)
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Votre configuration Firebase
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

// Initialiser Auth avec AsyncStorage pour la persistance
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialiser Firestore
const db = getFirestore(app);

// Initialiser Storage
const storage = getStorage(app);

export { auth, db, storage };
export default app;