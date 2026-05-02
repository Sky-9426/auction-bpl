// src/lib/firebase.js
// ─────────────────────────────────────────────────────────────
// STEP 1: Go to https://console.firebase.google.com
// STEP 2: Create project → "BPL-Auction"
// STEP 3: Add a Web App → copy the firebaseConfig below
// STEP 4: Enable Firestore Database (test mode)
// STEP 5: Enable Authentication → Email/Password
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'

// 🔴 REPLACE THIS WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyD_kMR835Zv9QyvxZI6fXBFDivq0lJouUI",
  authDomain: "bvritbpl-8fd60.firebaseapp.com",
  projectId: "bvritbpl-8fd60",
  storageBucket: "bvritbpl-8fd60.firebasestorage.app",
  messagingSenderId: "997754582808",
  appId: "1:997754582808:web:48a622f6b030034901506d",
  measurementId: "G-0RE1F7MJ7H",
  databaseURL: "https://bvritbpl-8fd60-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig)

export const db = getDatabase(app)
export const auth = getAuth(app)
export default app
