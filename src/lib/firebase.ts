import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "studio-5751693164-b0fd0",
  "appId": "1:926945615988:web:5005143b865a423520f121",
  "storageBucket": "studio-5751693164-b0fd0.firebasestorage.app",
  "apiKey": "AIzaSyA0tJHXYfAfdX9bk0ao6AzFFd--QvMBFr4",
  "authDomain": "studio-5751693164-b0fd0.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "926945615988"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
