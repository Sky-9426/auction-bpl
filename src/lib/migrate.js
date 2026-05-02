// src/lib/migrate.js
// ONE-TIME migration: copies existing Firestore data → Realtime Database
// Run from browser console: import('/src/lib/migrate.js').then(m => m.migrateToRTDB())

import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore,
  collection, doc,
  getDocs, getDoc,
} from 'firebase/firestore'
import { getDatabase, ref, set, update } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyD_kMR835Zv9QyvxZI6fXBFDivq0lJouUI",
  authDomain: "bvritbpl-8fd60.firebaseapp.com",
  projectId: "bvritbpl-8fd60",
  storageBucket: "bvritbpl-8fd60.firebasestorage.app",
  messagingSenderId: "997754582808",
  appId: "1:997754582808:web:48a622f6b030034901506d",
  measurementId: "G-0RE1F7MJ7H",
  databaseURL: "https://bvritbpl-8fd60-default-rtdb.firebaseio.com",
}

export async function migrateToRTDB() {
  console.log('🚀 Starting migration from Firestore → Realtime Database...')

  const app = getApps()[0] || initializeApp(firebaseConfig)
  const fs = getFirestore(app)
  const rtdb = getDatabase(app)

  try {
    // ── 1. Migrate teams ──────────────────────────────────────
    console.log('📦 Migrating teams...')
    const teamsSnap = await getDocs(collection(fs, 'teams'))
    for (const d of teamsSnap.docs) {
      await set(ref(rtdb, `teams/${d.id}`), { id: d.id, ...d.data() })
      console.log(`  ✅ Team: ${d.id}`)
    }

    // ── 2. Migrate players ────────────────────────────────────
    console.log('📦 Migrating players...')
    const playersSnap = await getDocs(collection(fs, 'players'))
    for (const d of playersSnap.docs) {
      await set(ref(rtdb, `players/${d.id}`), { id: d.id, ...d.data() })
      console.log(`  ✅ Player: ${d.data().name}`)
    }

    // ── 3. Migrate auction state ──────────────────────────────
    console.log('📦 Migrating auction state...')
    const auctionSnap = await getDoc(doc(fs, 'auction', 'state'))
    if (auctionSnap.exists()) {
      const data = auctionSnap.data()
      // bids array may be large — trim to last 20
      if (Array.isArray(data.bids) && data.bids.length > 20)
        data.bids = data.bids.slice(-20)
      await set(ref(rtdb, 'auction/state'), data)
      console.log('  ✅ Auction state migrated')
    }

    // ── 4. Migrate settings/branding ─────────────────────────
    console.log('📦 Migrating settings...')
    const brandingSnap = await getDoc(doc(fs, 'settings', 'branding'))
    if (brandingSnap.exists()) {
      await set(ref(rtdb, 'settings/branding'), brandingSnap.data())
      console.log('  ✅ Branding migrated')
    }

    const credsSnap = await getDoc(doc(fs, 'settings', 'credentials'))
    if (credsSnap.exists()) {
      await set(ref(rtdb, 'settings/credentials'), credsSnap.data())
      console.log('  ✅ Credentials migrated')
    }

    console.log('🎉 Migration complete! Refresh the page.')
    alert('✅ Migration complete! Refresh the page.')
  } catch (err) {
    console.error('❌ Migration failed:', err)
    alert('❌ Migration failed: ' + err.message + '\n\nCheck the console for details.')
  }
}
