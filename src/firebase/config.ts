import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfRDoa6GK7XGYlokGBYU6eYv-TJzE_6M0",
  authDomain: "jbstakon-managers-c85e2.firebaseapp.com",
  projectId: "jbstakon-managers-c85e2",
  storageBucket: "jbstakon-managers-c85e2.firebasestorage.app",
  messagingSenderId: "329474294449",
  appId: "1:329474294449:web:2c087e9e852f05709b5890",
  measurementId: "G-74LYYTVS40"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { app, auth, db, rtdb, storage, analytics };

export default app;
