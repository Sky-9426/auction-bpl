// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { ref, onValue, update } from 'firebase/database'
import { db } from '../lib/firebase'
import { TEAMS_DATA } from '../lib/seedData'

const AuthContext = createContext(null)

const DEFAULT_CREDENTIALS = {
  admin:            { role: 'admin',      password: 'admin123',  label: 'Super Admin' },
  auctioneer:       { role: 'auctioneer', password: 'auction123', label: 'Auctioneer' },
  diode_dragons:    { role: 'team', password: 'dragons',  teamId: 'diode_dragons' },
  electrode_eagles: { role: 'team', password: 'eagles',   teamId: 'electrode_eagles' },
  kirchoff_riders:  { role: 'team', password: 'riders',   teamId: 'kirchoff_riders' },
  mux_mavericks:    { role: 'team', password: 'mavs',     teamId: 'mux_mavericks' },
  quantum_blasters: { role: 'team', password: 'blasters', teamId: 'quantum_blasters' },
  voltage_vikings:  { role: 'team', password: 'vikings',  teamId: 'voltage_vikings' },
  player:           { role: 'player', password: 'player123', label: 'Spectator' },
  overview:         { role: 'overview', password: '', label: 'Auction Overview' },
}

export function AuthProvider({ children }) {
  const [credentials, setCredentials] = useState(DEFAULT_CREDENTIALS)
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('bpl_user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  // Sync credentials from Realtime Database so passwords can be changed at runtime
  useEffect(() => {
    const unsub = onValue(
      ref(db, 'settings/credentials'),
      (snap) => {
        const data = snap.val()
        if (data) {
          setCredentials(() => {
            const merged = {}
            for (const [k, v] of Object.entries(DEFAULT_CREDENTIALS)) merged[k] = { ...v }
            for (const [k, v] of Object.entries(data)) {
              if (merged[k] && v?.password) merged[k] = { ...merged[k], password: v.password }
            }
            return merged
          })
        }
      },
      () => {} // silently ignore if Firebase not yet configured
    )
    return unsub
  }, [])

  const login = (identifier, password) => {
    const cred = credentials[identifier]
    if (!cred) return { success: false, error: 'Unknown user' }
    if (cred.password !== password) return { success: false, error: 'Wrong password' }

    const userData = {
      role: cred.role,
      identifier,
      label: cred.label || TEAMS_DATA[cred.teamId]?.name,
      teamId: cred.teamId || null,
      team: cred.teamId ? TEAMS_DATA[cred.teamId] : null,
      loginTime: Date.now(),
    }

    setUser(userData)
    sessionStorage.setItem('bpl_user', JSON.stringify(userData))
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('bpl_user')
  }

  const updateCredential = async (identifier, newPassword) => {
    await update(ref(db, 'settings/credentials'), {
      [identifier]: { password: newPassword },
    })
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, credentials, updateCredential }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
