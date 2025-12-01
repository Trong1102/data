import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - THAY BẰNG CONFIG CỦA BẠN
const firebaseConfig = {
  apiKey: "AIzaSyD5tMNL13YoTne5yUlu11qwq-BD6drf-a8",
  authDomain: "shop-log-60232.firebaseapp.com",
  projectId: "shop-log-60232",
  storageBucket: "shop-log-60232.firebasestorage.app",
  messagingSenderId: "80742607284",
  appId: "1:80742607284:web:2107f50e9cc14e5be8eae1",
  measurementId: "G-G5W5V6TYQ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;