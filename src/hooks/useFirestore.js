// src/hooks/useFirestore.js
import { useState, useEffect } from 'react'
import {
  ref, onValue, update, set, remove, push,
  runTransaction,
} from 'firebase/database'
import { db } from '../lib/firebase'

// IPL-style bid increment tiers (tuned for budget scale of 10 000)
export function getBidIncrement(currentBid) {
  return 50000
}

// Format money: ≤100 full, <1 lakh → Xk, <1cr → X lakhs, ≥1cr → X cr
export function formatMoney(n) {
  if (!n && n !== 0) return '₹0'
  if (n <= 100) return `₹${n}`
  if (n < 1000) return `₹${n}`
  if (n < 100000) return `₹${parseFloat((n / 1000).toFixed(1))}k`
  if (n < 10000000) return `₹${parseFloat((n / 100000).toFixed(1))} lakhs`
  return `₹${parseFloat((n / 10000000).toFixed(2))} cr`
}

// ── Real-time auction state ──────────────────────────────────
export function useAuction() {
  const [auction, setAuction] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onValue(ref(db, 'auction/state'), (snap) => {
      const data = snap.val()
      if (data) {
        if (data.raisedHands && !Array.isArray(data.raisedHands))
          data.raisedHands = Object.values(data.raisedHands)
        else if (!data.raisedHands) data.raisedHands = []
        if (data.bids && !Array.isArray(data.bids))
          data.bids = Object.values(data.bids).sort((a, b) => (a.ts || 0) - (b.ts || 0))
        else if (!data.bids) data.bids = []
      }
      setAuction(data || null)
      setLoading(false)
    })
    return unsub
  }, [])

  return { auction, loading }
}

// ── Real-time players list ───────────────────────────────────
export function usePlayers() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onValue(ref(db, 'players'), (snap) => {
      const data = snap.val() || {}
      const arr = Object.entries(data).map(([id, p]) => ({ id, ...p }))
      arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      setPlayers(arr)
      setLoading(false)
    })
    return unsub
  }, [])

  return { players, loading }
}

// ── Real-time teams ──────────────────────────────────────────
export function useTeams() {
  const [teams, setTeams] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onValue(ref(db, 'teams'), (snap) => {
      const data = snap.val() || {}
      const result = {}
      Object.entries(data).forEach(([id, t]) => { result[id] = { id, ...t } })
      setTeams(result)
      setLoading(false)
    })
    return unsub
  }, [])

  return { teams, loading }
}

// ── Branding (BPL logo, ECE Rogers logo) ───────────────────
export function useBranding() {
  const [branding, setBranding] = useState({})

  useEffect(() => {
    const unsub = onValue(ref(db, 'settings/branding'), snap => {
      setBranding(snap.val() || {})
    })
    return unsub
  }, [])

  return branding
}

// ── Single team ──────────────────────────────────────────────
export function useTeam(teamId) {
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!teamId) return
    const unsub = onValue(ref(db, `teams/${teamId}`), (snap) => {
      const data = snap.val()
      setTeam(data ? { id: teamId, ...data } : null)
      setLoading(false)
    })
    return unsub
  }, [teamId])

  return { team, loading }
}

// ── Auction actions ──────────────────────────────────────────
export const auctionActions = {
  // Auctioneer: start bidding on a player
  async startBid(player) {
    await Promise.all([
      update(ref(db, 'auction/state'), {
        status: 'live',
        currentPlayerId: player.id,
        currentPlayerName: player.name,
        currentPlayerRole: player.role,
        currentBid: player.basePrice,
        basePrice: player.basePrice,
        currentBidder: null,
        currentBidderName: null,
        startedAt: Date.now(),
        bids: [],
        raisedHands: [],
      }),
      update(ref(db, `players/${player.id}`), { status: 'live' }),
    ])
  },

  // Team: raise hand — signals intent to bid
  async raiseHand(teamId) {
    await runTransaction(ref(db, 'auction/state/raisedHands'), (current) => {
      const arr = Array.isArray(current) ? current : []
      if (arr.includes(teamId)) return arr
      return [...arr, teamId]
    })
  },

  // Team: lower hand — withdraw from queue
  async lowerHand(teamId) {
    await runTransaction(ref(db, 'auction/state/raisedHands'), (current) => {
      const arr = Array.isArray(current) ? current : []
      return arr.filter(id => id !== teamId)
    })
  },

  // Auctioneer: award bid to a team from the raised-hands queue
  async awardBid(teamId, teamName, teamEmoji) {
    await runTransaction(ref(db, 'auction/state'), (state) => {
      if (!state || state.status !== 'live') return state
      const newBid = state.currentBid + getBidIncrement(state.currentBid)
      const bidEntry = { teamId, teamName, teamEmoji, amount: newBid, time: new Date().toLocaleTimeString(), ts: Date.now() }
      const prevBids = Array.isArray(state.bids) ? state.bids : []
      const trimmedBids = prevBids.length >= 20 ? prevBids.slice(-19) : prevBids
      return { ...state, currentBid: newBid, currentBidder: teamId, currentBidderName: teamName, bids: [...trimmedBids, bidEntry], raisedHands: [] }
    })
  },

  // Team: place a bid (transaction-safe — first submitter wins at each price)
  async placeBid(teamId, teamName, teamEmoji) {
    await runTransaction(ref(db, 'auction/state'), (state) => {
      if (!state || state.status !== 'live') return state
      const newBid = state.currentBid + getBidIncrement(state.currentBid)
      const bidEntry = { teamId, teamName, teamEmoji, amount: newBid, time: new Date().toLocaleTimeString(), ts: Date.now() }
      const prevBids = Array.isArray(state.bids) ? state.bids : []
      const trimmedBids = prevBids.length >= 20 ? prevBids.slice(-19) : prevBids
      return { ...state, currentBid: newBid, currentBidder: teamId, currentBidderName: teamName, bids: [...trimmedBids, bidEntry] }
    })
  },

  // Auctioneer: declare sold
  async declareSold(auction, teams) {
    const { currentPlayerId, currentBidder, currentBid, currentPlayerName } = auction
    if (!currentBidder) return { error: 'No bids placed!' }
    const team = teams[currentBidder]
    await Promise.all([
      update(ref(db, `players/${currentPlayerId}`), { status: 'sold', soldTo: currentBidder, soldToName: team.name, soldPrice: currentBid }),
      update(ref(db, `teams/${currentBidder}`), { spent: (team.spent || 0) + currentBid, players: [...(team.players || []), currentPlayerId] }),
      update(ref(db, 'auction/state'), { status: 'sold', soldPlayerName: currentPlayerName, soldTo: currentBidder, soldToName: team.name, soldPrice: currentBid }),
    ])
    setTimeout(() => {
      update(ref(db, 'auction/state'), { status: 'idle', currentPlayerId: null, currentPlayerName: null, currentPlayerRole: null, currentBid: 0, basePrice: 0, currentBidder: null, currentBidderName: null, bids: [] })
    }, 3000)
    return { success: true }
  },

  // Auctioneer: clear bid price history (keeps current bid/bidder intact)
  async clearBidHistory() {
    await update(ref(db, 'auction/state'), { bids: [] })
  },

  // Auctioneer: mark unsold
  async markUnsold(auction) {
    await Promise.all([
      update(ref(db, `players/${auction.currentPlayerId}`), { status: 'unsold' }),
      update(ref(db, 'auction/state'), { status: 'idle', currentPlayerId: null, currentPlayerName: null, currentBid: 0, currentBidder: null, currentBidderName: null, bids: [] }),
    ])
  },

  // Admin/Auctioneer: put a sold/unsold/retained player back into the pool
  async reAuction(player, teams) {
    const resets = [update(ref(db, `players/${player.id}`), { status: 'available', soldTo: null, soldToName: null, soldPrice: null })]
    if ((player.status === 'sold' || player.status === 'retained') && player.soldTo) {
      const team = Object.values(teams).find(t => t.id === player.soldTo)
      if (team) {
        resets.push(update(ref(db, `teams/${team.id}`), {
          spent: Math.max(0, (team.spent || 0) - (player.soldPrice || 0)),
          players: (team.players || []).filter(id => id !== player.id),
        }))
      }
    }
    await Promise.all(resets)
  },

  // Admin: add a player
  async addPlayer(playerData) {
    const newRef = push(ref(db, 'players'))
    await set(newRef, { ...playerData, status: 'available', soldTo: null, soldToName: null, soldPrice: null, createdAt: Date.now() })
    return newRef
  },

  // Admin: delete a player
  async deletePlayer(playerId) {
    return remove(ref(db, `players/${playerId}`))
  },

  // Admin: update any field(s) on a player
  async updatePlayer(playerId, data) {
    return update(ref(db, `players/${playerId}`), data)
  },

  // Team: request auction pause
  async requestPause(teamId, teamName) {
    return update(ref(db, 'auction/state'), { pauseRequested: true, pauseRequestTeam: teamId, pauseRequestTeamName: teamName })
  },

  // Admin/Auctioneer: pause auction
  async acceptPause() {
    return update(ref(db, 'auction/state'), { status: 'paused', pauseRequested: false, pauseRequestTeam: null, pauseRequestTeamName: null })
  },

  // Admin/Auctioneer: resume from pause
  async resumeAuction() {
    return update(ref(db, 'auction/state'), { status: 'live', pauseRequested: false })
  },

  // Admin/Auctioneer: dismiss pause request
  async dismissPause() {
    return update(ref(db, 'auction/state'), { pauseRequested: false, pauseRequestTeam: null, pauseRequestTeamName: null })
  },

  // Team: set captain / vice-captain
  async setCaptain(teamId, playerId, role) {
    const field = role === 'captain' ? 'captain' : 'viceCaptain'
    return update(ref(db, `teams/${teamId}`), { [field]: playerId })
  },

  // Admin: update app branding logos
  async updateBranding(field, url) {
    return update(ref(db, 'settings/branding'), { [field]: url })
  },

  // Admin: update hero slideshow images array
  async updateSlideshowImages(images) {
    return update(ref(db, 'settings/branding'), { slideshowImages: images })
  },

  // Admin: enable / disable overview page
  async updateOverviewEnabled(enabled) {
    return update(ref(db, 'settings/branding'), { overviewEnabled: enabled })
  },

  // Admin: update team logo (base64 data URL)
  async updateTeamLogo(teamId, logoDataUrl) {
    return update(ref(db, `teams/${teamId}`), { logoUrl: logoDataUrl })
  },

  // Admin: update team owner photo (slot: 'owner1Url' | 'owner2Url')
  async updateTeamOwnerPhoto(teamId, slot, url) {
    return update(ref(db, `teams/${teamId}`), { [slot]: url })
  },

  // Admin: update player photo (base64 data URL)
  async updatePlayerImage(playerId, imageDataUrl) {
    return update(ref(db, `players/${playerId}`), { imageUrl: imageDataUrl })
  },

  // Admin: change a team's total purse/budget
  async updateTeamBudget(teamId, newBudget) {
    return update(ref(db, `teams/${teamId}`), { budget: parseInt(newBudget) })
  },

  // Admin: retain a player for a team at a fixed price (deducted from purse)
  async retainPlayer(player, team, retainPrice) {
    await Promise.all([
      update(ref(db, `players/${player.id}`), { status: 'retained', soldTo: team.id, soldToName: team.name, soldPrice: retainPrice }),
      update(ref(db, `teams/${team.id}`), { spent: (team.spent || 0) + retainPrice, players: [...(team.players || []), player.id] }),
    ])
  },

  // Admin: release a retained player back to the pool
  async releaseRetention(player, team) {
    await Promise.all([
      update(ref(db, `players/${player.id}`), { status: 'available', soldTo: null, soldToName: null, soldPrice: null }),
      update(ref(db, `teams/${team.id}`), {
        spent: Math.max(0, (team.spent || 0) - (player.soldPrice || 0)),
        players: (team.players || []).filter(id => id !== player.id),
      }),
    ])
  },

  // Admin: reset entire auction (preserved retained players)
  async resetAuction(players) {
    const updates = players
      .filter(p => p.status !== 'retained')
      .map(p => update(ref(db, `players/${p.id}`), { status: 'available', soldTo: null, soldToName: null, soldPrice: null }))

    const retSpent = {}
    const retIds = {}
    players.filter(p => p.status === 'retained').forEach(p => {
      retSpent[p.soldTo] = (retSpent[p.soldTo] || 0) + (p.soldPrice || 0)
      retIds[p.soldTo] = [...(retIds[p.soldTo] || []), p.id]
    })

    const teamIds = ['diode_dragons','electrode_eagles','kirchoff_riders','mux_mavericks','quantum_blasters','voltage_vikings']
    const teamResets = teamIds.map(id => update(ref(db, `teams/${id}`), { spent: retSpent[id] || 0, players: retIds[id] || [] }))

    await Promise.all([
      ...updates,
      ...teamResets,
      update(ref(db, 'auction/state'), { status: 'idle', currentPlayerId: null, currentBid: 0, currentBidder: null, bids: [] }),
    ])
  },
}
