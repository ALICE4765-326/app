// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

// Debug: log environment variables
console.log('🔍 Variables d\'environnement chargées:');
console.log('- VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Présente' : '❌ Manquante');
console.log('- VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Présente' : '❌ Manquante');
console.log('- VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Présente' : '❌ Manquante');

// Check if Firebase is properly configured
const isFirebaseConfigured = firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId;

let app = null;
let auth = null;
let db = null;
let storage = null;
let analytics = null;

if (isFirebaseConfigured) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);

    // Initialize Firebase services
    auth = getAuth(app);

    // Configure persistence for auth
    auth.setPersistence = auth.setPersistence || (() => Promise.resolve());

    db = getFirestore(app);
    storage = getStorage(app);
    analytics = getAnalytics(app);

    console.log('🔥 Firebase initialisé avec succès');
    console.log('📊 Projet:', firebaseConfig.projectId);
    console.log('🔐 Auth domain:', firebaseConfig.authDomain);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation Firebase:', error);
    console.warn('🔧 Vérifiez votre configuration Firebase dans le fichier .env');
  }
} else {
  console.warn('⚠️ Firebase non configuré - variables d\'environnement manquantes');
  console.warn('📝 Créez un fichier .env avec vos clés Firebase pour activer les fonctionnalités temps réel');
}

export { auth, db, storage, analytics };
export default app;