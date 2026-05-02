// src/pages/AdminPage.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Trash2, Plus, RefreshCw, AlertTriangle, Key, Upload, Eye, EyeOff, Wallet, Lock, X, Pencil, Download } from 'lucide-react'
import Navbar from '../components/Navbar'
import SoldCelebration from '../components/SoldCelebration'
import { useAuction, usePlayers, useTeams, useBranding, auctionActions, formatMoney } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'
import { seedDatabase } from '../lib/seedData'

const ROLE_EMOJI = { Batsman: '🏏', Bowler: '⚾', 'All-Rounder': '⚡', 'Wicket Keeper': '🧤' }

const CRED_LIST = [
  { id: 'admin',            emoji: '👑', label: 'Super Admin' },
  { id: 'auctioneer',       emoji: '🎙️', label: 'Auctioneer' },
  { id: 'diode_dragons',    emoji: '🐉', label: 'Diode Dragons' },
  { id: 'electrode_eagles', emoji: '🦅', label: 'Electrode Eagles' },
  { id: 'kirchoff_riders',  emoji: '⚔️', label: 'Kirchoff Riders' },
  { id: 'mux_mavericks',    emoji: '🐎', label: 'Mux Mavericks' },
  { id: 'quantum_blasters', emoji: '⚡', label: 'Quantum Blasters' },
  { id: 'voltage_vikings',  emoji: '🪖', label: 'Voltage Vikings' },  { id: 'player',         emoji: '👁️', label: 'Spectator' },]

export default function AdminPage() {
  const { auction } = useAuction()
  const { players } = usePlayers()
  const { teams } = useTeams()
  const branding = useBranding()
  const { credentials, updateCredential } = useAuth()
  const [tab, setTab] = useState('overview')
  const [newPlayer, setNewPlayer] = useState({
    name: '', role: 'Batsman', basePrice: '', imageUrl: '',
    prevTeam: '', prevSeason: '', description: '',
    matches: '', runs: '', avg: '', sr: '', hs: '',
    wickets: '', economy: '', bowlingAvg: '', best: '',
    catches: '', stumpings: '',
  })
  const [playerImagePreview, setPlayerImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [credInputs, setCredInputs] = useState({})
  const [showPasswords, setShowPasswords] = useState({})
  const [credLoading, setCredLoading] = useState({})
  const [logoLoading, setLogoLoading] = useState({})
  const [ownerLoading, setOwnerLoading] = useState({})
  const [brandingLoading, setBrandingLoading] = useState({})
  const [budgetInputs, setBudgetInputs] = useState({})
  const [budgetLoading, setBudgetLoading] = useState({})
  const [retainTeamId, setRetainTeamId] = useState('')
  const [retainPlayerId, setRetainPlayerId] = useState('')
  const [retainPrice, setRetainPrice] = useState('')
  const [retainLoading, setRetainLoading] = useState(false)
  const [slideshowLoading, setSlideshowLoading] = useState(false)
  const [editPlayer, setEditPlayer] = useState(null)  // { player data + id }
  const [editLoading, setEditLoading] = useState(false)
  const [editImagePreview, setEditImagePreview] = useState(null)
  const [seedLoading, setSeedLoading] = useState(false)

  const totalBudgetUsed = Object.values(teams).reduce((s, t) => s + (t.spent || 0), 0)
  const sold = players.filter(p => p.status === 'sold')
  const available = players.filter(p => p.status === 'available')

  const handleAddPlayer = async () => {
    if (!newPlayer.name.trim() || !newPlayer.basePrice) { toast.error('Fill in all fields'); return }
    setLoading(true)
    try {
      const stats = {}
      const numFields = ['matches','runs','avg','sr','hs','wickets','economy','bowlingAvg','catches','stumpings']
      numFields.forEach(k => { if (newPlayer[k] !== '') stats[k] = parseFloat(newPlayer[k]) })
      if (newPlayer.best) stats.best = newPlayer.best
      await auctionActions.addPlayer({
        name: newPlayer.name.trim(),
        role: newPlayer.role,
        basePrice: parseInt(newPlayer.basePrice),
        imageUrl: newPlayer.imageUrl || '',
        prevTeam: newPlayer.prevTeam || '',
        prevSeason: newPlayer.prevSeason ? parseInt(newPlayer.prevSeason) : null,
        description: newPlayer.description?.trim() || '',
        stats,
      })
      setNewPlayer({ name: '', role: 'Batsman', basePrice: '', imageUrl: '', prevTeam: '', prevSeason: '', description: '', matches: '', runs: '', avg: '', sr: '', hs: '', wickets: '', economy: '', bowlingAvg: '', best: '', catches: '', stumpings: '' })
      setPlayerImagePreview(null)
      toast.success(`${newPlayer.name} added to player pool!`)
    } catch (e) { toast.error('Failed to add player') }
    setLoading(false)
  }

  const handleReAuction = async (player) => {
    if (player.status === 'available' || player.status === 'live') return
    try {
      await auctionActions.reAuction(player, teams)
      toast.success(`↩️ ${player.name} back in pool`)
    } catch (e) { toast.error('Failed to re-auction') }
  }

  const handleDelete = async (player) => {
    try {
      await auctionActions.deletePlayer(player.id)
      toast.success(`${player.name} removed`)
    } catch (e) { toast.error('Failed to delete') }
  }

  const handleReset = async () => {
    setLoading(true)
    try {
      await auctionActions.resetAuction(players)
      setConfirmReset(false)
      toast.success('Auction reset! All players returned to pool.')
    } catch (e) { toast.error('Reset failed') }
    setLoading(false)
  }

  const compressImage = (file, maxDim = 300, quality = 0.78) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = (e) => {
        const img = new Image()
        img.onerror = reject
        img.onload = () => {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })

  const removeWhiteBackground = (dataUrl) =>
    new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = data.data
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i+1], b = d[i+2]
          // remove near-white pixels (tolerance 30)
          if (r > 225 && g > 225 && b > 225) {
            const brightness = (r + g + b) / 3
            d[i+3] = Math.round(d[i+3] * Math.max(0, (255 - brightness) / 30))
          }
        }
        ctx.putImageData(data, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = dataUrl
    })

  const handleLogoUpload = async (teamId, file) => {
    if (!file) return
    setLogoLoading(prev => ({ ...prev, [teamId]: true }))
    try {
      const compressed = await compressImage(file, 300, 0.95)
      const nobg = await removeWhiteBackground(compressed)
      await auctionActions.updateTeamLogo(teamId, nobg)
      toast.success('Team logo updated!')
    } catch (e) { toast.error('Failed to upload logo') }
    setLogoLoading(prev => ({ ...prev, [teamId]: false }))
  }

  const handleOwnerPhotoUpload = async (teamId, slot, file) => {
    if (!file) return
    const key = `${teamId}_${slot}`
    setOwnerLoading(prev => ({ ...prev, [key]: true }))
    try {
      const compressed = await compressImage(file, 400, 0.88)
      await auctionActions.updateTeamOwnerPhoto(teamId, slot, compressed)
      toast.success('Owner photo updated!')
    } catch (e) { toast.error('Failed to upload owner photo') }
    setOwnerLoading(prev => ({ ...prev, [key]: false }))
  }

  const handleBrandingUpload = async (field, file) => {
    if (!file) return
    setBrandingLoading(p => ({ ...p, [field]: true }))
    try {
      const compressed = await compressImage(file, 500, 0.88)
      await auctionActions.updateBranding(field, compressed)
      toast.success('Branding logo updated!')
    } catch (e) { toast.error('Upload failed') }
    setBrandingLoading(p => ({ ...p, [field]: false }))
  }

  const convertToGrayscale = (dataUrl) =>
    new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width; canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height)
        for (let i = 0; i < d.data.length; i += 4) {
          const avg = 0.299 * d.data[i] + 0.587 * d.data[i+1] + 0.114 * d.data[i+2]
          d.data[i] = d.data[i+1] = d.data[i+2] = avg
        }
        ctx.putImageData(d, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.80))
      }
      img.src = dataUrl
    })

  const handleSlideshowUpload = async (files) => {
    if (!files.length) return
    setSlideshowLoading(true)
    try {
      const existing = branding.slideshowImages || []
      const added = []
      for (const file of Array.from(files)) {
        const compressed = await compressImage(file, 1400, 0.85)
        const bw = await convertToGrayscale(compressed)
        added.push(bw)
      }
      await auctionActions.updateSlideshowImages([...existing, ...added])
      toast.success(`${added.length} photo${added.length > 1 ? 's' : ''} added!`)
    } catch (e) { toast.error('Upload failed') }
    setSlideshowLoading(false)
  }

  const handleSlideshowDelete = async (idx) => {
    const updated = (branding.slideshowImages || []).filter((_, i) => i !== idx)
    try {
      await auctionActions.updateSlideshowImages(updated)
      toast.success('Photo removed')
    } catch (e) { toast.error('Failed to remove') }
  }

  const handlePlayerImageSelect = async (file) => {
    if (!file) return
    try {
      const compressed = await compressImage(file, 300, 0.78)
      setPlayerImagePreview(compressed)
      setNewPlayer(p => ({ ...p, imageUrl: compressed }))
    } catch (e) { toast.error('Image processing failed') }
  }

  const handleUpdateCredential = async (identifier) => {
    const newPass = (credInputs[identifier] || '').trim()
    if (newPass.length < 4) { toast.error('Password must be at least 4 characters'); return }
    setCredLoading(prev => ({ ...prev, [identifier]: true }))
    try {
      await updateCredential(identifier, newPass)
      toast.success('Password updated!')
      setCredInputs(prev => ({ ...prev, [identifier]: '' }))
    } catch (e) { toast.error('Failed to update') }
    setCredLoading(prev => ({ ...prev, [identifier]: false }))
  }

  const handleUpdateBudget = async (teamId) => {
    const val = parseInt(budgetInputs[teamId])
    if (!val || val < 1) { toast.error('Enter a valid budget amount'); return }
    setBudgetLoading(prev => ({ ...prev, [teamId]: true }))
    try {
      await auctionActions.updateTeamBudget(teamId, val)
      toast.success('Purse updated!')
      setBudgetInputs(prev => ({ ...prev, [teamId]: '' }))
    } catch (e) { toast.error('Failed to update purse') }
    setBudgetLoading(prev => ({ ...prev, [teamId]: false }))
  }

  const handleRetain = async () => {
    if (!retainTeamId || !retainPlayerId || !retainPrice) { toast.error('Fill all retention fields'); return }
    const team = teams[retainTeamId]
    const player = players.find(p => p.id === retainPlayerId)
    const price = parseInt(retainPrice)
    if (!team || !player || isNaN(price)) { toast.error('Invalid selection'); return }
    if ((team.budget - (team.spent || 0)) < price) { toast.error('Insufficient purse for this retention price'); return }
    setRetainLoading(true)
    try {
      await auctionActions.retainPlayer(player, team, price)
      toast.success(`${player.name} retained by ${team.name}!`)
      setRetainTeamId(''); setRetainPlayerId(''); setRetainPrice('')
    } catch (e) { toast.error('Retention failed') }
    setRetainLoading(false)
  }

  const handleReleaseRetention = async (player) => {
    const team = teams[player.soldTo]
    if (!team) return
    try {
      await auctionActions.releaseRetention(player, team)
      toast.success(`${player.name} released back to pool`)
    } catch (e) { toast.error('Release failed') }
  }

  const openEdit = (p) => {
    setEditImagePreview(p.imageUrl || null)
    setEditPlayer({
      id: p.id,
      name: p.name || '',
      role: p.role || 'Batsman',
      basePrice: p.basePrice?.toString() || '',
      imageUrl: p.imageUrl || '',
      prevTeam: p.prevTeam || '',
      prevSeason: p.prevSeason?.toString() || '',
      description: p.description || '',
      matches: p.stats?.matches?.toString() || '',
      runs: p.stats?.runs?.toString() || '',
      avg: p.stats?.avg?.toString() || '',
      sr: p.stats?.sr?.toString() || '',
      hs: p.stats?.hs?.toString() || '',
      wickets: p.stats?.wickets?.toString() || '',
      economy: p.stats?.economy?.toString() || '',
      bowlingAvg: p.stats?.bowlingAvg?.toString() || '',
      best: p.stats?.best || '',
      catches: p.stats?.catches?.toString() || '',
      stumpings: p.stats?.stumpings?.toString() || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editPlayer?.name.trim() || !editPlayer?.basePrice) { toast.error('Fill required fields'); return }
    setEditLoading(true)
    try {
      const stats = {}
      const numFields = ['matches','runs','avg','sr','hs','wickets','economy','bowlingAvg','catches','stumpings']
      numFields.forEach(k => { if (editPlayer[k] !== '') stats[k] = parseFloat(editPlayer[k]) })
      if (editPlayer.best) stats.best = editPlayer.best
      await auctionActions.updatePlayer(editPlayer.id, {
        name: editPlayer.name.trim(),
        role: editPlayer.role,
        basePrice: parseInt(editPlayer.basePrice),
        imageUrl: editPlayer.imageUrl || '',
        prevTeam: editPlayer.prevTeam || '',
        prevSeason: editPlayer.prevSeason ? parseInt(editPlayer.prevSeason) : null,
        description: editPlayer.description?.trim() || '',
        stats,
      })
      toast.success(`${editPlayer.name} updated!`)
      setEditPlayer(null)
      setEditImagePreview(null)
    } catch(e) { toast.error('Failed to update player') }
    setEditLoading(false)
  }

  const handleEditImageSelect = async (file) => {
    if (!file) return
    try {
      const compressed = await compressImage(file, 300, 0.78)
      setEditImagePreview(compressed)
      setEditPlayer(p => ({ ...p, imageUrl: compressed }))
    } catch { toast.error('Image error') }
  }

  const handleSeedDatabase = async () => {
    setSeedLoading(true)
    try {
      await seedDatabase()
      toast.success('✅ Database seeded successfully! Refresh to see updates.')
    } catch (err) {
      toast.error('❌ Seed failed. Check console for details.')
      console.error('Seed error:', err)
    }
    setSeedLoading(false)
  }

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-gradient-to-br from-navy-dark via-[#0a1628] to-navy-dark" />
      <div className="fixed inset-0 bg-grid opacity-40" />

      <Navbar />
      <SoldCelebration auction={auction} teams={teams} />

      <div className="relative z-10 pt-16 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-[0.15em]">
              ADMIN <span className="text-gradient">DASHBOARD</span>
            </h1>
            <p className="text-white/30 text-sm tracking-widest mt-1 font-mono">SEASON 4 · SUPER ADMIN</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleSeedDatabase()}
              disabled={seedLoading}
              className="btn-bpl btn-ghost text-xs flex items-center gap-1.5"
            >
              {seedLoading ? (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download size={12} />
              )}
              Seed Database
            </button>
            <button
              onClick={() => setConfirmReset(true)}
              className="btn-bpl btn-danger text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={12} /> Reset Auction
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8"
        >
          {[
            { v: players.length,    l: 'Total Players', c: 'text-white' },
            { v: available.length,  l: 'Available',     c: 'text-bpl-orange' },
            { v: sold.length,       l: 'Sold',          c: 'text-bpl-gold' },
            { v: Object.keys(teams).length, l: 'Teams', c: 'text-blue-300' },
            { v: formatMoney(totalBudgetUsed), l: 'Total Spent', c: 'text-green-400' },
            { v: auction?.status?.toUpperCase() || 'IDLE', l: 'Auction', c: auction?.status === 'live' ? 'text-red-400' : 'text-white/40' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="glass rounded-xl p-4 text-center"
            >
              <div className={`font-display text-2xl ${s.c}`}>{s.v}</div>
              <div className="text-[0.6rem] text-white/30 tracking-widest mt-0.5 uppercase">{s.l}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Current auction status */}
        {auction?.status === 'live' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 rounded-xl border border-red-400/30 bg-red-500/5 flex items-center gap-4"
          >
            <span className="live-badge">LIVE</span>
            <span className="font-display text-xl tracking-wider">{auction.currentPlayerName}</span>
            <span className="font-mono text-bpl-gold">{formatMoney(auction.currentBid)}</span>
            {auction.currentBidder && (
              <span className="text-white/40 text-sm">Leader: {teams[auction.currentBidder]?.emoji} {auction.currentBidderName}</span>
            )}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white/[0.03] p-1 rounded-xl w-fit flex-wrap">
          {[['overview', 'Teams Overview'], ['players', 'Players'], ['retentions', '🔒 Retentions'], ['addplayer', '+ Add Player'], ['credentials', '🔑 Credentials']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`btn-bpl text-sm py-2 px-5 ${tab === id ? 'btn-orange' : 'btn-ghost border-0'}`}>
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* TEAMS OVERVIEW */}
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {Object.values(teams).map((t, i) => {
                const rem = t.budget - (t.spent || 0)
                const pct = Math.max(0, (rem / t.budget) * 100)
                const squad = (t.players || []).map(pid => players.find(p => p.id === pid)).filter(Boolean)
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="glass rounded-xl p-5"
                  >
                    <div className="flex items-center gap-4 mb-3 flex-wrap">
                      <label className="relative cursor-pointer group/logo shrink-0" title="Click to upload team logo">
                        {t.logoUrl
                          ? <img src={t.logoUrl} alt={t.name} className="w-12 h-12 rounded-full object-contain border-2 border-white/10 group-hover/logo:border-bpl-orange/50 transition-all" />
                          : <span className="w-12 h-12 flex items-center justify-center text-3xl bg-white/5 rounded-full border-2 border-dashed border-white/15 group-hover/logo:border-bpl-orange/40 transition-all">{t.emoji}</span>
                        }
                        <span className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity">
                          {logoLoading[t.id] ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={13} className="text-white" />}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleLogoUpload(t.id, e.target.files[0])} />
                      </label>
                      <div className="flex-1">
                        <div className="font-display text-lg tracking-widest">{t.name}</div>
                        <div className="text-white/30 text-xs">{squad.length} players · {formatMoney(t.spent || 0)} spent</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-bpl-gold font-bold">{formatMoney(rem)}</div>
                        <div className="text-white/25 text-xs">remaining</div>
                      </div>
                    </div>
                    <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-3">
                      <motion.div
                        className="h-full bg-gradient-to-r from-bpl-orange to-bpl-gold rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                      />
                    </div>
                    {/* Owner photo uploads */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[0.6rem] text-white/30 tracking-widest uppercase shrink-0">Owners:</span>
                      {['owner1Url', 'owner2Url'].map((slot, idx) => (
                        <label key={slot} className="relative cursor-pointer group/owner shrink-0" title={`Upload Owner ${idx + 1} photo`}>
                          {t[slot]
                            ? <img src={t[slot]} alt={`Owner ${idx + 1}`} className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover/owner:border-bpl-orange/50 transition-all" />
                            : <div className="w-10 h-10 rounded-full bg-white/5 border border-dashed border-white/15 group-hover/owner:border-bpl-orange/40 transition-all flex items-center justify-center text-white/30 text-xs font-mono">{idx + 1}</div>
                          }
                          <span className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover/owner:opacity-100 transition-opacity">
                            {ownerLoading[`${t.id}_${slot}`] ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={10} className="text-white" />}
                          </span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleOwnerPhotoUpload(t.id, slot, e.target.files[0])} />
                        </label>
                      ))}
                    </div>

                    {squad.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {squad.map(p => (
                          <span key={p.id} className={`text-xs px-3 py-1 rounded-full border ${p.status === 'retained' ? 'bg-purple-400/10 border-purple-400/20 text-purple-300' : 'bg-white/[0.05] border-white/8 text-white/50'}`}>
                            {p.status === 'retained' && '🔒 '}{ROLE_EMOJI[p.role]} {p.name}
                            <span className="text-bpl-gold/50 ml-1">{formatMoney(p.soldPrice)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Budget / Purse editor */}
                    <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06] flex-wrap">
                      <Wallet size={11} className="text-white/30 shrink-0" />
                      <span className="text-[0.6rem] text-white/30 tracking-widest uppercase shrink-0">Total Purse:</span>
                      <span className="font-mono text-xs text-bpl-gold/70">{formatMoney(t.budget)}</span>
                      <div className="flex-1" />
                      <input
                        type="number"
                        value={budgetInputs[t.id] || ''}
                        onChange={e => setBudgetInputs(prev => ({ ...prev, [t.id]: e.target.value }))}
                        placeholder="New purse size"
                        className="bpl-input text-xs py-1.5 w-36"
                        style={{ height: '32px' }}
                        onKeyDown={e => e.key === 'Enter' && handleUpdateBudget(t.id)}
                      />
                      <button
                        onClick={() => handleUpdateBudget(t.id)}
                        disabled={budgetLoading[t.id] || !budgetInputs[t.id]}
                        className="btn-bpl btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                      >
                        {budgetLoading[t.id]
                          ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <Wallet size={10} />
                        }
                        Set
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* PLAYERS LIST */}
          {tab === 'players' && (
            <motion.div key="players" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {players.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass glass-hover rounded-xl p-4 text-center relative group"
                  >
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-full object-cover mx-auto mb-2 border border-white/10" />
                      : <div className="text-2xl mb-2">{ROLE_EMOJI[p.role]}</div>
                    }
                    <div className="font-display text-sm tracking-wider mb-0.5 leading-tight">{p.name}</div>
                    {p.prevTeam ? (
                      <div className="text-[0.5rem] text-blue-300/60 tracking-wider mb-1 truncate px-1">S{p.prevSeason || '?'} · {p.prevTeam}</div>
                    ) : null}
                    <div className="font-mono text-[0.5rem] tracking-widest uppercase mb-1 text-bpl-orange/50">{p.role}</div>
                    <div className="font-mono text-xs text-bpl-gold mb-1">{formatMoney(p.basePrice)}</div>
                    {p.stats && (
                      <div className="text-[0.48rem] text-white/25 mb-1.5 leading-snug px-1">
                        {p.role === 'Batsman' && p.stats.runs != null && `${p.stats.runs}R · avg ${p.stats.avg} · SR ${p.stats.sr || '-'}`}
                        {p.role === 'Bowler' && p.stats.wickets != null && `${p.stats.wickets}W · econ ${p.stats.economy} · ${p.stats.best || '-'}`}
                        {p.role === 'All-Rounder' && `${p.stats.runs ?? '-'}R / ${p.stats.wickets ?? '-'}W`}
                        {p.role === 'Wicket Keeper' && `${p.stats.runs ?? '-'}R · ${p.stats.stumpings ?? '-'}st · ${p.stats.catches ?? '-'}ct`}
                      </div>
                    )}
                    <div className={`text-[0.6rem] tracking-widest px-2 py-0.5 rounded-full inline-block ${
                      p.status === 'available' ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                      : p.status === 'live'    ? 'bg-red-400/10 text-red-400 border border-red-400/20 animate-pulse'
                      : p.status === 'sold'    ? 'bg-bpl-orange/10 text-bpl-orange border border-bpl-orange/20'
                      : p.status === 'retained' ? 'bg-purple-400/10 text-purple-400 border border-purple-400/20'
                      : 'bg-white/5 text-white/30 border border-white/10'
                    }`}>
                      {p.status === 'sold' ? `${teams[p.soldTo]?.emoji} ${p.soldToName}`
                      : p.status === 'retained' ? `🔒 ${p.soldToName}`
                      : p.status?.toUpperCase()}
                    </div>
                    {p.status === 'available' && (
                      <button
                        onClick={() => handleDelete(p)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    {(p.status === 'sold' || p.status === 'unsold' || p.status === 'retained') && (
                      <button
                        onClick={() => handleReAuction(p)}
                        title="Put back in available pool"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-bpl-orange/10 text-bpl-orange hover:bg-bpl-orange/20"
                      >
                        <RefreshCw size={12} />
                      </button>
                    )}
                    {/* Edit button — disabled only while player is live */}
                    {p.status !== 'live' && (
                      <button
                        onClick={() => openEdit(p)}
                        title="Edit player details"
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ADD PLAYER */}
          {tab === 'addplayer' && (
            <motion.div key="add" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl">
              <div className="glass rounded-2xl p-6">
                <div className="font-display text-xl tracking-widest text-gradient mb-5">ADD NEW PLAYER</div>
                <div className="space-y-5">
                  {/* Basic info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Player Name *</label>
                      <input value={newPlayer.name} onChange={e => setNewPlayer(p => ({...p, name: e.target.value}))} placeholder="e.g. Rahul Kumar" className="bpl-input" />
                    </div>
                    <div>
                      <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Role *</label>
                      <select value={newPlayer.role} onChange={e => setNewPlayer(p => ({...p, role: e.target.value}))} className="bpl-input">
                        <option>Batsman</option><option>Bowler</option><option>All-Rounder</option><option>Wicket Keeper</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Base Price (₹) *</label>
                      <input type="number" value={newPlayer.basePrice} onChange={e => setNewPlayer(p => ({...p, basePrice: e.target.value}))} placeholder="e.g. 800" className="bpl-input" />
                    </div>
                    <div>
                      <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Previous Team</label>
                      <input value={newPlayer.prevTeam} onChange={e => setNewPlayer(p => ({...p, prevTeam: e.target.value}))} placeholder="e.g. Diode Dragons" className="bpl-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Previous Season #</label>
                      <input type="number" value={newPlayer.prevSeason} onChange={e => setNewPlayer(p => ({...p, prevSeason: e.target.value}))} placeholder="e.g. 3" className="bpl-input" />
                    </div>
                    <div>
                      <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Player Photo</label>
                      <label className="flex items-center gap-3 cursor-pointer group/img">
                        {playerImagePreview
                          ? <img src={playerImagePreview} alt="preview" className="w-12 h-12 rounded-xl object-cover border-2 border-bpl-orange/40 shrink-0" />
                          : <div className="w-12 h-12 rounded-xl bg-white/5 border-2 border-dashed border-white/15 flex items-center justify-center shrink-0 group-hover/img:border-bpl-orange/40 transition-colors"><Upload size={16} className="text-white/30" /></div>
                        }
                        <div>
                          <div className="text-sm text-white/50 group-hover/img:text-white/80 transition-colors">{playerImagePreview ? 'Change photo' : 'Upload photo'}</div>
                          <div className="text-[0.6rem] text-white/25 mt-0.5">JPG, PNG · auto-compressed</div>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handlePlayerImageSelect(e.target.files[0])} />
                      </label>
                    </div>
                  </div>

                  {/* Bio / Description */}
                  <div>
                    <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Bio / Description</label>
                    <textarea
                      value={newPlayer.description}
                      onChange={e => setNewPlayer(p => ({...p, description: e.target.value}))}
                      placeholder="Short bio shown on team & spectator views..."
                      rows={2}
                      className="bpl-input resize-none"
                    />
                  </div>

                  {/* Stats */}
                  <div className="border-t border-white/[0.06] pt-4">
                    <div className="text-[0.65rem] tracking-widest text-white/35 uppercase mb-3">Previous Season Stats (optional)</div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Matches</label>
                        <input type="number" value={newPlayer.matches} onChange={e => setNewPlayer(p => ({...p, matches: e.target.value}))} placeholder="0" className="bpl-input text-sm" />
                      </div>
                      {newPlayer.role !== 'Bowler' && <>
                        <div>
                          <label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Runs</label>
                          <input type="number" value={newPlayer.runs} onChange={e => setNewPlayer(p => ({...p, runs: e.target.value}))} placeholder="0" className="bpl-input text-sm" />
                        </div>
                        <div>
                          <label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Avg</label>
                          <input type="number" step="0.1" value={newPlayer.avg} onChange={e => setNewPlayer(p => ({...p, avg: e.target.value}))} placeholder="0.0" className="bpl-input text-sm" />
                        </div>
                        <div>
                          <label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Strike Rate</label>
                          <input type="number" step="0.1" value={newPlayer.sr} onChange={e => setNewPlayer(p => ({...p, sr: e.target.value}))} placeholder="0.0" className="bpl-input text-sm" />
                        </div>
                        <div>
                          <label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">High Score</label>
                          <input type="number" value={newPlayer.hs} onChange={e => setNewPlayer(p => ({...p, hs: e.target.value}))} placeholder="0" className="bpl-input text-sm" />
                        </div>
                      </>
                      }
                      {(newPlayer.role === 'Bowler' || newPlayer.role === 'All-Rounder') && <>
                        <div>
                          <label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Wickets</label>
                          <input type="number" value={newPlayer.wickets} onChange={e => setNewPlayer(p => ({...p, wickets: e.target.value}))} placeholder="0" className="bpl-input text-sm" />
                        </div>
                        <div>
                          <label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Economy</label>
                          <input type="number" step="0.1" value={newPlayer.economy} onChange={e => setNewPlayer(p => ({...p, economy: e.target.value}))} placeholder="0.0" className="bpl-input text-sm" />
                        </div>
                        <div>
                          <label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Bowl Avg</label>
                          <input type="number" step="0.1" value={newPlayer.bowlingAvg} onChange={e => setNewPlayer(p => ({...p, bowlingAvg: e.target.value}))} placeholder="0.0" className="bpl-input text-sm" />
                        </div>
                        <div>
                          <label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Best</label>
                          <input type="text" value={newPlayer.best} onChange={e => setNewPlayer(p => ({...p, best: e.target.value}))} placeholder="4/22" className="bpl-input text-sm" />
                        </div>
                      </>
                      }
                      <div>
                        <label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Catches</label>
                        <input type="number" value={newPlayer.catches} onChange={e => setNewPlayer(p => ({...p, catches: e.target.value}))} placeholder="0" className="bpl-input text-sm" />
                      </div>
                      {newPlayer.role === 'Wicket Keeper' && (
                        <div>
                          <label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Stumpings</label>
                          <input type="number" value={newPlayer.stumpings} onChange={e => setNewPlayer(p => ({...p, stumpings: e.target.value}))} placeholder="0" className="bpl-input text-sm" />
                        </div>
                      )}
                    </div>
                  </div>

                  <button onClick={handleAddPlayer} disabled={loading} className="btn-bpl btn-orange w-full flex items-center justify-center gap-2">
                    {loading ? <span className="w-4 h-4 border-2 border-navy-dark/40 border-t-navy-dark rounded-full animate-spin" /> : <Plus size={16} />}
                    Add to Pool
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* CREDENTIALS */}
          {tab === 'credentials' && (
            <motion.div key="credentials" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-xl space-y-6">

              {/* Branding logos */}
              <div className="glass rounded-2xl p-6">
                <div className="font-display text-xl tracking-widest text-gradient mb-1">BRANDING</div>
                <div className="text-white/30 text-xs mb-5">Upload the BPL and ECE Rogers logos. They appear on the login page and navbar.</div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { field: 'bplLogoUrl',  label: 'BPL Logo',        hint: 'Used in navbar & login header' },
                    { field: 'eceLogoUrl',  label: 'ECE Rogers Logo', hint: 'Shown on login page' },
                  ].map(({ field, label, hint }) => (
                    <label key={field} className="group cursor-pointer">
                      <div className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all p-4 min-h-[110px]
                        ${branding[field] ? 'border-bpl-orange/40 bg-bpl-orange/5' : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'}`}>
                        {brandingLoading[field]
                          ? <span className="w-6 h-6 border-2 border-bpl-orange/40 border-t-bpl-orange rounded-full animate-spin" />
                          : branding[field]
                            ? <img src={branding[field]} alt={label} className="max-h-14 max-w-full object-contain rounded" />
                            : <Upload size={20} className="text-white/25 group-hover:text-white/50 transition-colors" />
                        }
                        <span className="text-[0.6rem] font-mono tracking-widest text-white/30 uppercase">{label}</span>
                        <span className="text-[0.55rem] text-white/20 text-center">{hint}</span>
                      </div>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => handleBrandingUpload(field, e.target.files[0])} />
                    </label>
                  ))}
                </div>
              </div>

              {/* Hero Slideshow */}
              <div className="glass rounded-2xl p-6">
                <div className="font-display text-xl tracking-widest text-gradient mb-1">OVERVIEW PAGE</div>
                <div className="text-white/30 text-xs mb-4">Enable or disable the public Overview page. When disabled, guests cannot log in via the Overview option.</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/70 font-medium">Allow Overview Access</div>
                    <div className="text-[0.6rem] text-white/30 font-mono mt-0.5">{branding.overviewEnabled === false ? 'Disabled — guests cannot enter' : 'Enabled — guests can view'}</div>
                  </div>
                  <button
                    onClick={() => auctionActions.updateOverviewEnabled(branding.overviewEnabled === false ? true : false)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${branding.overviewEnabled === false ? 'bg-white/10' : 'bg-bpl-orange'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${branding.overviewEnabled === false ? 'translate-x-0' : 'translate-x-6'}`}
                    />
                  </button>
                </div>
              </div>

              {/* Hero Slideshow */}
              <div className="glass rounded-2xl p-6">
                <div className="font-display text-xl tracking-widest text-gradient mb-1">HERO SLIDESHOW</div>
                <div className="text-white/30 text-xs mb-5">Photos shown behind the BPL logo on the Overview page. Auto-converted to black &amp; white. Upload multiple at once.</div>

                {/* Upload button */}
                <label className="group cursor-pointer block mb-5">
                  <div className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-bpl-orange/40 hover:bg-bpl-orange/5 transition-all p-5">
                    {slideshowLoading
                      ? <span className="w-6 h-6 border-2 border-bpl-orange/40 border-t-bpl-orange rounded-full animate-spin" />
                      : <Upload size={20} className="text-white/30 group-hover:text-bpl-orange/70 transition-colors" />
                    }
                    <div>
                      <div className="text-sm text-white/50 group-hover:text-white/80 transition-colors">Click to upload photos</div>
                      <div className="text-[0.6rem] text-white/25 mt-0.5">JPG, PNG · multiple files supported · auto B&amp;W</div>
                    </div>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={e => handleSlideshowUpload(e.target.files)} />
                </label>

                {/* Uploaded photos grid */}
                {(branding.slideshowImages || []).length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {(branding.slideshowImages || []).map((src, i) => (
                      <div key={i} className="relative group/slide rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                        <img src={src} alt={`Slide ${i+1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleSlideshowDelete(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover/slide:opacity-100 transition-opacity hover:bg-red-600/80"
                        >
                          <X size={11} className="text-white" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 text-center text-[0.5rem] font-mono text-white/40 bg-black/40 py-0.5">{i+1}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-white/20 text-xs">No photos yet</div>
                )}
              </div>

              {/* Credentials */}
              <div className="glass rounded-2xl p-6">
                <div className="font-display text-xl tracking-widest text-gradient mb-1">CREDENTIALS</div>
                <div className="text-white/30 text-xs mb-6">Set new passwords for all accounts. Changes are saved to Firestore instantly.</div>
                <div className="space-y-3">
                  {CRED_LIST.map(({ id, emoji, label }) => (
                    <div key={id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8">
                      <span className="text-xl w-7 text-center">{emoji}</span>
                      <div className="hidden sm:block w-36 shrink-0">
                        <div className="text-xs text-white/60 font-medium">{label}</div>
                        <div className="font-mono text-[0.55rem] text-white/25">{id}</div>
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type={showPasswords[id] ? 'text' : 'password'}
                          value={credInputs[id] || ''}
                          onChange={e => setCredInputs(p => ({ ...p, [id]: e.target.value }))}
                          placeholder={`Current: ${credentials?.[id]?.password || '••••'}`}
                          className="bpl-input text-sm pr-10"
                          onKeyDown={e => e.key === 'Enter' && handleUpdateCredential(id)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(p => ({ ...p, [id]: !p[id] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                        >
                          {showPasswords[id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <button
                        onClick={() => handleUpdateCredential(id)}
                        disabled={credLoading[id] || !credInputs[id]}
                        className="btn-bpl btn-orange text-xs px-3 py-2 flex items-center gap-1.5 shrink-0"
                      >
                        {credLoading[id]
                          ? <span className="w-3.5 h-3.5 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
                          : <Key size={12} />
                        }
                        Save
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* RETENTIONS */}
          {tab === 'retentions' && (
            <motion.div key="retentions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Retain a player form */}
              <div className="glass rounded-2xl p-6 mb-6 max-w-2xl">
                <div className="font-display text-xl tracking-widest text-gradient mb-1">RETAIN A PLAYER</div>
                <div className="text-white/30 text-xs mb-5">Pre-assign a player to a team before auction. The retention price is immediately deducted from the team's purse.</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Team</label>
                    <select value={retainTeamId} onChange={e => setRetainTeamId(e.target.value)} className="bpl-input">
                      <option value="">Select team...</option>
                      {Object.values(teams).map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Player</label>
                    <select value={retainPlayerId} onChange={e => setRetainPlayerId(e.target.value)} className="bpl-input">
                      <option value="">Select player...</option>
                      {players.filter(p => p.status === 'available').map(p => <option key={p.id} value={p.id}>{p.name} · {p.role}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Retention Price (₹)</label>
                    <input type="number" value={retainPrice} onChange={e => setRetainPrice(e.target.value)} placeholder="e.g. 2000" className="bpl-input" />
                  </div>
                </div>
                {retainTeamId && (
                  <div className="text-xs text-white/35 mb-3 font-mono">
                    {teams[retainTeamId]?.name} remaining purse: {formatMoney((teams[retainTeamId]?.budget || 0) - (teams[retainTeamId]?.spent || 0))}
                  </div>
                )}
                <button
                  onClick={handleRetain}
                  disabled={retainLoading || !retainTeamId || !retainPlayerId || !retainPrice}
                  className="btn-bpl btn-orange flex items-center gap-2"
                >
                  {retainLoading ? <span className="w-4 h-4 border-2 border-navy-dark/40 border-t-navy-dark rounded-full animate-spin" /> : <Lock size={14} />}
                  Retain Player
                </button>
              </div>

              {/* Retained players per team */}
              <div className="space-y-4">
                {Object.values(teams).map(t => {
                  const retained = players.filter(p => p.status === 'retained' && p.soldTo === t.id)
                  if (retained.length === 0) return null
                  return (
                    <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        {t.logoUrl ? <img src={t.logoUrl} alt={t.name} className="w-8 h-8 rounded-full object-contain" /> : <span className="text-xl">{t.emoji}</span>}
                        <div className="font-display text-sm tracking-widest">{t.name}</div>
                        <span className="font-mono text-xs text-white/30">Purse used: {formatMoney(t.spent||0)} / {formatMoney(t.budget)}</span>
                        <span className="ml-auto text-xs text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2 py-0.5 rounded-full">{retained.length} retained</span>
                      </div>
                      <div className="space-y-2">
                        {retained.map(p => (
                          <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-purple-400/5 border border-purple-400/15">
                            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-full object-cover shrink-0" /> : <span className="text-lg">{ROLE_EMOJI[p.role]}</span>}
                            <div className="flex-1 min-w-0">
                              <div className="font-display text-sm tracking-wider">{p.name}</div>
                              <div className="text-white/30 text-xs">{p.role}{p.prevTeam ? ` · ex ${p.prevTeam}` : ''}</div>
                            </div>
                            <div className="font-mono text-bpl-gold text-sm shrink-0">{formatMoney(p.soldPrice)}</div>
                            <button
                              onClick={() => handleReleaseRetention(p)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                              title="Release to pool"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
                {players.filter(p => p.status === 'retained').length === 0 && (
                  <div className="text-center py-16 glass rounded-2xl text-white/20 text-sm">
                    No players retained yet. Use the form above to retain players.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Player Modal */}
      <AnimatePresence>
        {editPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setEditPlayer(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass rounded-2xl p-6 max-w-2xl w-full my-8 border border-blue-400/20"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="font-display text-xl tracking-widest text-gradient">EDIT PLAYER</div>
                <button onClick={() => setEditPlayer(null)} className="text-white/30 hover:text-white/70">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Player Name *</label>
                    <input value={editPlayer.name} onChange={e => setEditPlayer(p => ({...p, name: e.target.value}))} className="bpl-input" />
                  </div>
                  <div>
                    <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Role *</label>
                    <select value={editPlayer.role} onChange={e => setEditPlayer(p => ({...p, role: e.target.value}))} className="bpl-input">
                      <option>Batsman</option><option>Bowler</option><option>All-Rounder</option><option>Wicket Keeper</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Base Price (₹) *</label>
                    <input type="number" value={editPlayer.basePrice} onChange={e => setEditPlayer(p => ({...p, basePrice: e.target.value}))} className="bpl-input" />
                  </div>
                  <div>
                    <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Previous Team</label>
                    <input value={editPlayer.prevTeam} onChange={e => setEditPlayer(p => ({...p, prevTeam: e.target.value}))} className="bpl-input" />
                  </div>
                </div>

                {/* Player Description */}
                <div>
                  <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Player Description / Bio</label>
                  <textarea
                    value={editPlayer.description}
                    onChange={e => setEditPlayer(p => ({...p, description: e.target.value}))}
                    placeholder="Short description shown on team and spectator views..."
                    rows={2}
                    className="bpl-input resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Previous Season #</label>
                    <input type="number" value={editPlayer.prevSeason} onChange={e => setEditPlayer(p => ({...p, prevSeason: e.target.value}))} className="bpl-input" />
                  </div>
                  <div>
                    <label className="block text-[0.65rem] tracking-widest text-white/35 uppercase mb-2">Player Photo</label>
                    <label className="flex items-center gap-3 cursor-pointer group/img">
                      {editImagePreview
                        ? <img src={editImagePreview} alt="preview" className="w-12 h-12 rounded-xl object-cover border-2 border-blue-400/40 shrink-0" />
                        : <div className="w-12 h-12 rounded-xl bg-white/5 border-2 border-dashed border-white/15 flex items-center justify-center shrink-0 group-hover/img:border-blue-400/40 transition-colors"><Upload size={16} className="text-white/30" /></div>
                      }
                      <span className="text-sm text-white/50 group-hover/img:text-white/80 transition-colors">
                        {editImagePreview ? 'Change photo' : 'Upload photo'}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleEditImageSelect(e.target.files[0])} />
                    </label>
                  </div>
                </div>

                {/* Stats */}
                <div className="border-t border-white/[0.06] pt-4">
                  <div className="text-[0.65rem] tracking-widest text-white/35 uppercase mb-3">Stats</div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Matches</label>
                      <input type="number" value={editPlayer.matches} onChange={e => setEditPlayer(p => ({...p, matches: e.target.value}))} placeholder="0" className="bpl-input text-sm" />
                    </div>
                    {editPlayer.role !== 'Bowler' && <>
                      <div><label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Runs</label><input type="number" value={editPlayer.runs} onChange={e => setEditPlayer(p=>({...p,runs:e.target.value}))} placeholder="0" className="bpl-input text-sm" /></div>
                      <div><label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Avg</label><input type="number" step="0.1" value={editPlayer.avg} onChange={e => setEditPlayer(p=>({...p,avg:e.target.value}))} placeholder="0.0" className="bpl-input text-sm" /></div>
                      <div><label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">SR</label><input type="number" step="0.1" value={editPlayer.sr} onChange={e => setEditPlayer(p=>({...p,sr:e.target.value}))} placeholder="0.0" className="bpl-input text-sm" /></div>
                      <div><label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">HS</label><input type="number" value={editPlayer.hs} onChange={e => setEditPlayer(p=>({...p,hs:e.target.value}))} placeholder="0" className="bpl-input text-sm" /></div>
                    </>}
                    {(editPlayer.role === 'Bowler' || editPlayer.role === 'All-Rounder') && <>
                      <div><label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Wkts</label><input type="number" value={editPlayer.wickets} onChange={e => setEditPlayer(p=>({...p,wickets:e.target.value}))} placeholder="0" className="bpl-input text-sm" /></div>
                      <div><label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Econ</label><input type="number" step="0.1" value={editPlayer.economy} onChange={e => setEditPlayer(p=>({...p,economy:e.target.value}))} placeholder="0.0" className="bpl-input text-sm" /></div>
                      <div><label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Bowl Avg</label><input type="number" step="0.1" value={editPlayer.bowlingAvg} onChange={e => setEditPlayer(p=>({...p,bowlingAvg:e.target.value}))} placeholder="0.0" className="bpl-input text-sm" /></div>
                      <div><label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Best</label><input type="text" value={editPlayer.best} onChange={e => setEditPlayer(p=>({...p,best:e.target.value}))} placeholder="4/22" className="bpl-input text-sm" /></div>
                    </>}
                    <div><label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Catches</label><input type="number" value={editPlayer.catches} onChange={e => setEditPlayer(p=>({...p,catches:e.target.value}))} placeholder="0" className="bpl-input text-sm" /></div>
                    {editPlayer.role === 'Wicket Keeper' && (
                      <div><label className="block text-[0.55rem] tracking-widest text-white/25 uppercase mb-1">Stumpings</label><input type="number" value={editPlayer.stumpings} onChange={e => setEditPlayer(p=>({...p,stumpings:e.target.value}))} placeholder="0" className="bpl-input text-sm" /></div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditPlayer(null)} className="btn-bpl btn-ghost flex-1">Cancel</button>
                  <button onClick={handleSaveEdit} disabled={editLoading} className="btn-bpl btn-orange flex-1 flex items-center justify-center gap-2">
                    {editLoading ? <span className="w-4 h-4 border-2 border-navy-dark/40 border-t-navy-dark rounded-full animate-spin" /> : <Pencil size={14} />}
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirm Modal */}
      <AnimatePresence>
        {confirmReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmReset(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass rounded-2xl p-8 max-w-sm w-full border border-red-400/30"
            >
              <div className="text-4xl mb-4 text-center">⚠️</div>
              <div className="font-display text-2xl tracking-widest text-center text-red-400 mb-2">RESET AUCTION</div>
              <div className="text-white/45 text-sm text-center mb-6">
                This will reset ALL teams' budgets, clear all squads, and return all players to the pool. This cannot be undone.
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmReset(false)} className="btn-bpl btn-ghost flex-1">Cancel</button>
                <button onClick={handleReset} disabled={loading} className="btn-bpl btn-danger flex-1 flex items-center justify-center gap-2">
                  {loading ? <span className="w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" /> : <RefreshCw size={14} />}
                  Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
