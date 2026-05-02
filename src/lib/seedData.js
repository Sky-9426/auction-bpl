// src/lib/seedData.js
// Run this ONCE to populate your Realtime Database
// Call seedDatabase() from browser console after first login

import { db } from './firebase'
import { ref, set, push, onValue } from 'firebase/database'

export const TEAMS_DATA = {
  diode_dragons: {
    id: 'diode_dragons',
    name: 'Diode Dragons',
    shortName: 'DD',
    emoji: '🐉',
    color: '#2d9e41',
    budget: 10000,
    spent: 0,
    players: [],
    password: 'dragons',
  },
  electrode_eagles: {
    id: 'electrode_eagles',
    name: 'Electrode Eagles',
    shortName: 'EE',
    emoji: '🦅',
    color: '#1a7abf',
    budget: 10000,
    spent: 0,
    players: [],
    password: 'eagles',
  },
  kirchoff_riders: {
    id: 'kirchoff_riders',
    name: 'Kirchoff Riders',
    shortName: 'KR',
    emoji: '⚔️',
    color: '#c8a000',
    budget: 10000,
    spent: 0,
    players: [],
    password: 'riders',
  },
  mux_mavericks: {
    id: 'mux_mavericks',
    name: 'Mux Mavericks',
    shortName: 'MM',
    emoji: '🐎',
    color: '#8b4513',
    budget: 10000,
    spent: 0,
    players: [],
    password: 'mavs',
  },
  quantum_blasters: {
    id: 'quantum_blasters',
    name: 'Quantum Blasters',
    shortName: 'QB',
    emoji: '⚡',
    color: '#4169e1',
    budget: 10000,
    spent: 0,
    players: [],
    password: 'blasters',
  },
  voltage_vikings: {
    id: 'voltage_vikings',
    name: 'Voltage Vikings',
    shortName: 'VV',
    emoji: '🪖',
    color: '#f5a623',
    budget: 10000,
    spent: 0,
    players: [],
    password: 'vikings',
  },
}

export const INITIAL_PLAYERS = [
  {
    name: 'Arjun Reddy', role: 'Batsman', basePrice: 800,
    prevTeam: 'Diode Dragons', prevSeason: 3,
    stats: { matches: 12, runs: 340, avg: 28.3, sr: 126, hs: 67, catches: 4 },
  },
  {
    name: 'Kiran Sharma', role: 'Bowler', basePrice: 600,
    prevTeam: 'Voltage Vikings', prevSeason: 3,
    stats: { matches: 10, wickets: 18, economy: 7.2, bowlingAvg: 18.5, best: '4/22', catches: 3 },
  },
  {
    name: 'Vivek Raj', role: 'All-Rounder', basePrice: 1200,
    prevTeam: 'Quantum Blasters', prevSeason: 3,
    stats: { matches: 15, runs: 280, avg: 22.4, sr: 119, wickets: 12, economy: 8.1, catches: 6 },
  },
  {
    name: 'Suresh Kumar', role: 'Wicket Keeper', basePrice: 700,
    prevTeam: 'Kirchoff Riders', prevSeason: 3,
    stats: { matches: 11, runs: 220, avg: 20.0, sr: 108, stumpings: 8, catches: 7 },
  },
  {
    name: 'Dev Prakash', role: 'Batsman', basePrice: 900,
    prevTeam: 'Electrode Eagles', prevSeason: 3,
    stats: { matches: 13, runs: 410, avg: 34.2, sr: 132, hs: 82, catches: 5 },
  },
  {
    name: 'Mohit Singh', role: 'Bowler', basePrice: 500,
    prevTeam: 'Mux Mavericks', prevSeason: 3,
    stats: { matches: 9, wickets: 14, economy: 8.1, bowlingAvg: 22.3, best: '3/18', catches: 2 },
  },
  {
    name: 'Rajan Pillai', role: 'All-Rounder', basePrice: 1000,
    prevTeam: 'Diode Dragons', prevSeason: 3,
    stats: { matches: 14, runs: 300, avg: 25.0, sr: 115, wickets: 10, economy: 8.8, catches: 5 },
  },
  {
    name: 'Aditya Nair', role: 'Batsman', basePrice: 750,
    prevTeam: 'Voltage Vikings', prevSeason: 2,
    stats: { matches: 10, runs: 295, avg: 26.8, sr: 121, hs: 58, catches: 3 },
  },
  {
    name: 'Pradeep Iyer', role: 'Bowler', basePrice: 650,
    prevTeam: 'Quantum Blasters', prevSeason: 3,
    stats: { matches: 11, wickets: 16, economy: 7.8, bowlingAvg: 20.1, best: '3/14', catches: 4 },
  },
  {
    name: 'Yusuf Khan', role: 'All-Rounder', basePrice: 1100,
    prevTeam: 'Kirchoff Riders', prevSeason: 3,
    stats: { matches: 16, runs: 320, avg: 26.7, sr: 124, wickets: 14, economy: 7.6, catches: 7 },
  },
  {
    name: 'Sanjay Verma', role: 'Batsman', basePrice: 850,
    prevTeam: 'Electrode Eagles', prevSeason: 3,
    stats: { matches: 12, runs: 380, avg: 31.7, sr: 129, hs: 74, catches: 4 },
  },
  {
    name: 'Nikhil Menon', role: 'Wicket Keeper', basePrice: 680,
    prevTeam: 'Mux Mavericks', prevSeason: 3,
    stats: { matches: 10, runs: 200, avg: 18.2, sr: 104, stumpings: 6, catches: 9 },
  },
]

export async function seedDatabase() {
  try {
    // Check if already seeded by looking at teams
    const teamsSnapshot = await (async () => {
      return new Promise((resolve) => {
        const unsub = onValue(ref(db, 'teams'), (snap) => {
          unsub()
          resolve(snap)
        }, () => {
          resolve(null)
        })
      })
    })()

    if (teamsSnapshot && teamsSnapshot.val() && Object.keys(teamsSnapshot.val()).length > 0) {
      // Data already exists
      console.log('Data already seeded. Updating...')
      // Still update the auction state and credentials in case they're missing
      await set(ref(db, 'settings/credentials'), {
        admin:            { password: 'admin123' },
        auctioneer:       { password: 'auction123' },
        diode_dragons:    { password: 'dragons' },
        electrode_eagles: { password: 'eagles' },
        kirchoff_riders:  { password: 'riders' },
        mux_mavericks:    { password: 'mavs' },
        quantum_blasters: { password: 'blasters' },
        voltage_vikings:  { password: 'vikings' },
      })
      
      await set(ref(db, 'auction/state'), {
        status: 'idle',
        currentPlayerId: null,
        currentPlayerName: null,
        currentPlayerRole: null,
        currentBid: 0,
        basePrice: 0,
        currentBidder: null,
        currentBidderName: null,
        startedAt: null,
        bids: [],
      })
      
      console.log('✅ Database updated successfully!')
      alert('✅ Database already has teams. Settings updated. Refresh the page.')
      return
    }

    // Seed teams
    for (const [id, team] of Object.entries(TEAMS_DATA)) {
      await set(ref(db, `teams/${id}`), team)
    }

    // Seed credentials
    await set(ref(db, 'settings/credentials'), {
      admin:            { password: 'admin123' },
      auctioneer:       { password: 'auction123' },
      diode_dragons:    { password: 'dragons' },
      electrode_eagles: { password: 'eagles' },
      kirchoff_riders:  { password: 'riders' },
      mux_mavericks:    { password: 'mavs' },
      quantum_blasters: { password: 'blasters' },
      voltage_vikings:  { password: 'vikings' },
    })

    // Seed auction state
    await set(ref(db, 'auction/state'), {
      status: 'idle',
      currentPlayerId: null,
      currentPlayerName: null,
      currentPlayerRole: null,
      currentBid: 0,
      basePrice: 0,
      currentBidder: null,
      currentBidderName: null,
      startedAt: null,
      bids: [],
    })

    // Seed players
    for (const player of INITIAL_PLAYERS) {
      await push(ref(db, 'players'), {
        ...player,
        status: 'available',
        soldTo: null,
        soldToName: null,
        soldPrice: null,
        createdAt: Date.now(),
      })
    }

    console.log('✅ Database seeded successfully!')
    alert('✅ Database seeded! Refresh the page.')
  } catch (err) {
    console.error('Seed failed:', err)
    alert('❌ Seed failed. Check console.')
    throw err
  }
}
