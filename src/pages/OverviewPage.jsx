// src/pages/OverviewPage.jsx — IPL-style live overview with team squad drill-down
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Navbar from '../components/Navbar'
import SoldCelebration from '../components/SoldCelebration'
import { useAuction, usePlayers, useTeams, useBranding, formatMoney } from '../hooks/useFirestore'

// Per-team brand colours
const TEAM_COLORS = {
  diode_dragons:    { top: '#1d6640', mid: '#155230', btm: '#0d3a22' },
  electrode_eagles: { top: '#1a2f8a', mid: '#121f6a', btm: '#0d1a50' },
  kirchoff_riders:  { top: '#8a1a2a', mid: '#6e1222', btm: '#4a0f17' },
  mux_mavericks:    { top: '#1a686e', mid: '#135254', btm: '#0d3a3e' },
  quantum_blasters: { top: '#521a8a', mid: '#3e126e', btm: '#2e0f4e' },
  voltage_vikings:  { top: '#8a561a', mid: '#6e4214', btm: '#4a300d' },
}
const DEFAULT_C = { top: '#2a2a3a', mid: '#222230', btm: '#1a1a28' }

const ROLE_ORDER  = ['Batsman', 'All-Rounder', 'Wicket Keeper', 'Bowler']
const ROLE_EMOJI  = { Batsman: '🏏', Bowler: '⚾', 'All-Rounder': '⚡', 'Wicket Keeper': '🧤' }
const ROLE_LABELS = { Batsman: 'Batters', Bowler: 'Bowlers', 'All-Rounder': 'All-Rounders', 'Wicket Keeper': 'Wicket Keepers' }

// ─────────────────────────────────────────────────────────────
// Squad detail panel (shown when a team card is clicked)
// ─────────────────────────────────────────────────────────────
function TeamSquadPanel({ team, players, allPlayers, auction, onBack }) {
  const c = TEAM_COLORS[team.id] || DEFAULT_C
  const isLive   = auction?.status === 'live'
  const isBidding = auction?.currentTeamId === team.id && isLive

  // Resolve captain name
  const captainPlayer  = team.captain     ? allPlayers.find(p => p.id === team.captain)     : null
  const vcPlayer       = team.viceCaptain ? allPlayers.find(p => p.id === team.viceCaptain) : null

  const rem  = team.budget - (team.spent || 0)
  const pct  = Math.max(0, (rem / team.budget) * 100)

  // Group squad by role
  const byRole = ROLE_ORDER.reduce((acc, r) => {
    const rp = players.filter(p => p.role === r)
    if (rp.length) acc[r] = rp
    return acc
  }, {})

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${c.top} 0%, ${c.mid} 50%, ${c.btm} 100%)` }}
      >
        {/* Decorative rings */}
        <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }} />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-6 pb-8">
          {/* Back */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-6 text-white/60 hover:text-white transition-colors text-sm font-mono"
          >
            <ArrowLeft size={15} />
            <span className="tracking-widest uppercase text-xs">All Teams</span>
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Logo / emoji */}
            <div className="shrink-0">
              {team.logoUrl
                ? <img src={team.logoUrl} alt={team.name}
                    className="w-24 h-24 object-contain drop-shadow-2xl" />
                : <div className="text-8xl leading-none drop-shadow-2xl">{team.emoji}</div>
              }
            </div>

            {/* Name + budget bar */}
            <div className="flex-1">
              <div className="font-display text-5xl tracking-wider text-white leading-none mb-1">{team.name}</div>
              {isBidding && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-300 text-xs font-mono uppercase tracking-widest font-bold">Currently Bidding</span>
                </div>
              )}
              <div className="w-40 h-1.5 mt-3 overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div className="h-full bg-white/70" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-white/50 text-xs font-mono mt-1">
                {formatMoney(rem)} remaining
              </div>
            </div>

            {/* Owner photos — now left of table */}
            {(team.owner1Url || team.owner2Url) && (
              <div className="shrink-0 flex sm:flex-col gap-4 items-center justify-center px-2">
                <div className="text-[0.55rem] text-white/30 font-mono uppercase tracking-widest hidden sm:block text-center mb-1">Owners</div>
                {[team.owner1Url, team.owner2Url].filter(Boolean).map((url, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <img
                      src={url}
                      alt={`Owner ${idx + 1}`}
                      className="w-24 h-24 rounded-full object-cover border-2 shadow-xl"
                      style={{ borderColor: 'rgba(255,255,255,0.25)' }}
                    />
                    <span className="text-[0.55rem] text-white/35 font-mono uppercase tracking-wider">Owner {idx + 1}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Info table (IPL-style) — now right of owners */}
            <div
              className="shrink-0 w-full sm:w-64 overflow-hidden sm:ml-2"
              style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)' }}
            >
              {[
                { label: 'Captain',    value: captainPlayer?.name || '—' },
                { label: 'Vice-Capt', value: vcPlayer?.name || '—' },
                { label: 'Players',   value: players.length },
                { label: 'Spent',     value: formatMoney(team.spent || 0) },
                { label: 'Remaining', value: formatMoney(rem) },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-bpl-orange/80 text-xs font-mono w-20 shrink-0">{row.label}</span>
                  <span className="text-white/30 text-sm">–</span>
                  <span className="text-white text-sm font-medium flex-1">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Squad content (light IPL-style) ── */}
      <div style={{ background: '#f0f3f8', minHeight: '50vh' }}>
        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* Section label */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-wide">Squad</h2>
            <span className="text-sm text-gray-500 font-mono">{players.length} player{players.length !== 1 ? 's' : ''}</span>
          </div>

          {players.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-sm">No players acquired yet</div>
          ) : (
            Object.entries(byRole).map(([role, rps]) => (
              <div key={role} className="mb-10">
                {/* Role heading */}
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>{ROLE_EMOJI[role]}</span>
                  {ROLE_LABELS[role]}
                </h3>

                {/* Player cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {rps.map((p, i) => {
                    const isCaptain  = team.captain     === p.id
                    const isViceCap  = team.viceCaptain === p.id
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-white overflow-hidden"
                        style={{
                          borderRadius: '8px',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)',
                        }}
                      >
                        {/* Photo area */}
                        <div
                          className="relative flex items-end justify-center overflow-hidden"
                          style={{
                            background: `linear-gradient(180deg, ${c.top}22 0%, ${c.top}44 100%)`,
                            height: '140px',
                          }}
                        >
                          {/* Captain badge */}
                          {isCaptain && (
                            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow">
                              <span className="text-[0.55rem] font-black text-yellow-900">C</span>
                            </div>
                          )}
                          {isViceCap && (
                            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center shadow">
                              <span className="text-[0.55rem] font-black text-blue-900">V</span>
                            </div>
                          )}

                          {/* Sold price badge */}
                          <div
                            className="absolute top-2 right-2 px-1.5 py-0.5 font-mono font-bold text-[0.55rem]"
                            style={{
                              background: 'rgba(0,0,0,0.55)',
                              color: '#FFD700',
                              borderRadius: '3px',
                            }}
                          >
                            {formatMoney(p.soldPrice || 0)}
                          </div>

                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-full w-full object-cover object-top"
                            />
                          ) : (
                            <div className="text-6xl pb-3 opacity-70">{ROLE_EMOJI[p.role] || '🏏'}</div>
                          )}
                        </div>

                        {/* Name strip */}
                        <div className="px-2.5 py-2.5">
                          <div className="font-bold text-xs uppercase tracking-wider text-gray-900 leading-tight truncate">
                            {p.name}
                          </div>
                          <div className="text-gray-400 text-[0.6rem] mt-0.5">{p.role}</div>
                          {p.description && (
                            <div className="text-gray-500 text-[0.6rem] mt-1 leading-snug line-clamp-2">
                              {p.description}
                            </div>
                          )}
                          {p.status === 'retained' && (
                            <div className="text-[0.5rem] text-purple-600 font-mono mt-1">🔒 RETAINED</div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Overview page
// ─────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const { auction } = useAuction()
  const { players } = usePlayers()
  const { teams } = useTeams()
  const branding = useBranding()
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [hoveredTeam, setHoveredTeam] = useState(null)
  const [slideIdx, setSlideIdx] = useState(0)
  const topRef = useRef(null)

  const slides = branding.slideshowImages || []

  // Auto-advance slideshow every 4s
  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => setSlideIdx(i => (i + 1) % slides.length), 4000)
    return () => clearInterval(t)
  }, [slides.length])

  const livePlayer  = players.find(p => p.id === auction?.currentPlayerId)
  const soldPlayers = players.filter(p => p.status === 'sold' || p.status === 'retained')
  const available   = players.filter(p => p.status === 'available')
  const isLive      = auction?.status === 'live'
  const isPaused    = auction?.status === 'paused'
  const teamList    = Object.values(teams)

  // Sync selectedTeam from live teams data
  const selectedTeamData = selectedTeam ? teams[selectedTeam.id] : null

  const handleSelectTeam = (team) => {
    setSelectedTeam(team)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleBack = () => {
    setSelectedTeam(null)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen" style={{ background: selectedTeamData ? '#f0f3f8' : '#001224' }}>
      <Navbar />
      <SoldCelebration auction={auction} teams={teams} />
      <div ref={topRef} className="pt-16" />

      <AnimatePresence mode="wait">

        {/* ════════ TEAM DETAIL VIEW ════════ */}
        {selectedTeamData && (
          <TeamSquadPanel
            key={selectedTeamData.id}
            team={selectedTeamData}
            players={soldPlayers.filter(p => p.soldTo === selectedTeamData.id)}
            allPlayers={players}
            auction={auction}
            onBack={handleBack}
          />
        )}

        {/* ════════ OVERVIEW VIEW ════════ */}
        {!selectedTeamData && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* ── Hero ── */}
            <div
              className="relative overflow-hidden"
              style={{ background: 'linear-gradient(180deg, #001e50 0%, #001224 100%)' }}
            >
              {/* Hero-scoped slideshow crossfade */}
              {slides.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="absolute inset-0 w-full h-full"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center',
                    filter: 'grayscale(1)',
                    opacity: i === slideIdx ? 0.45 : 0,
                    transition: 'opacity 1.4s ease-in-out',
                  }}
                />
              ))}
              {slides.length > 0 && (
                <div className="absolute inset-0" style={{ background: 'rgba(0,18,36,0.45)' }} />
              )}
              {/* Ghost watermark — only shown when no slideshow */}
              {slides.length === 0 && (
                <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none select-none overflow-hidden"
                  style={{ lineHeight: 1 }}>
                  <span className="font-display text-white uppercase tracking-[0.25em]"
                    style={{ fontSize: 'clamp(5rem, 22vw, 15rem)', opacity: 0.04 }}>
                    TEAMS
                  </span>
                </div>
              )}

              <div className="relative z-10 flex flex-col items-center py-10">
                {branding.bplLogoUrl
                  ? <img src={branding.bplLogoUrl} alt="BPL" className="h-20 object-contain drop-shadow-2xl mb-3" />
                  : <div className="font-display text-7xl text-gradient tracking-[0.12em] mb-2">BPL</div>
                }
                <div className="font-mono text-[0.6rem] tracking-[0.5em] text-white/30 uppercase">
                  Box Premier League · Season 4 · Auction
                </div>

                {/* Status pill */}
                <div className="mt-5 flex items-center gap-3 px-5 py-2 rounded-full"
                  style={{
                    background: isLive ? 'rgba(225,6,0,0.18)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isLive ? 'rgba(225,6,0,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  }}>
                  <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : isPaused ? 'bg-blue-400' : 'bg-white/25'}`} />
                  <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-white/60">
                    {isLive ? 'Auction Live' : isPaused ? 'Paused' : 'Awaiting Auction'}
                  </span>
                  <span className="w-px h-3 bg-white/15" />
                  <span className="font-mono text-xs text-green-400/70">{soldPlayers.length} Sold</span>
                  <span className="font-mono text-xs text-bpl-orange/70">{available.length} Available</span>
                </div>

                {/* Slideshow dot indicators */}
                {slides.length > 1 && (
                  <div className="mt-4 flex justify-center gap-1.5">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlideIdx(i)}
                        className="w-2 h-2 rounded-full transition-all"
                        style={{ background: i === slideIdx ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Live auction banner ── */}
            {(isLive || isPaused) && livePlayer && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: isLive ? '#e10600' : '#1e3a6e', borderBottom: '3px solid rgba(0,0,0,0.25)' }}
              >
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="font-bold text-xs tracking-[0.25em] uppercase text-white/80">On The Block</span>
                  </div>
                  {livePlayer.imageUrl
                    ? <img src={livePlayer.imageUrl} alt={livePlayer.name} className="w-8 h-8 object-cover rounded shrink-0" />
                    : <span className="text-xl shrink-0">{ROLE_EMOJI[livePlayer.role] || '🏏'}</span>
                  }
                  <div className="font-display text-xl tracking-wider text-white">{livePlayer.name}</div>
                  <div className="text-white/60 text-sm hidden sm:block border-l border-white/20 pl-4">
                    {livePlayer.role} · Base {formatMoney(livePlayer.basePrice || 0)}
                  </div>
                  <div className="ml-auto flex items-center gap-2 flex-wrap">
                    {auction?.currentTeamName && (
                      <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: 'rgba(0,0,0,0.25)' }}>
                        <span className="text-lg">{auction.currentTeamEmoji}</span>
                        <div>
                          <div className="text-[0.5rem] text-white/50 font-mono uppercase tracking-widest">Leader</div>
                          <div className="font-bold text-xs text-white uppercase tracking-wide">{auction.currentTeamName}</div>
                        </div>
                      </div>
                    )}
                    <div className="px-4 py-2" style={{ background: 'rgba(0,0,0,0.25)' }}>
                      <div className="text-[0.5rem] text-white/50 font-mono uppercase tracking-widest">Current Bid</div>
                      <div className="font-mono font-bold text-white text-xl leading-none">
                        {formatMoney(auction?.currentBid || livePlayer.basePrice || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Team Cards ── */}
            <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-6">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 mb-7 text-xs font-mono text-white/20 tracking-widest">
                <span className="text-white/40">Overview</span>
                <span>/</span>
                <span>Teams</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {teamList.map((team, i) => {
                  const c = TEAM_COLORS[team.id] || DEFAULT_C
                  const rem = team.budget - (team.spent || 0)
                  const remPct = Math.max(0, (rem / team.budget) * 100)
                  const isBidding  = auction?.currentTeamId === team.id && isLive
                  const isHovered  = hoveredTeam === team.id
                  const squadCount = soldPlayers.filter(p => p.soldTo === team.id).length

                  return (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.35 }}
                      whileHover={{ y: -8, transition: { duration: 0.2 } }}
                      onClick={() => handleSelectTeam(team)}
                      onMouseEnter={() => setHoveredTeam(team.id)}
                      onMouseLeave={() => setHoveredTeam(null)}
                      className="cursor-pointer select-none overflow-hidden"
                      style={{
                        borderRadius: '12px',
                        boxShadow: isBidding
                          ? '0 0 0 2px #22c55e, 0 16px 50px rgba(0,0,0,0.6)'
                          : '0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)',
                      }}
                    >
                      {/* Coloured top */}
                      <div
                        className="relative flex flex-col items-center justify-center"
                        style={{
                          background: `linear-gradient(145deg, ${c.top} 0%, ${c.btm} 100%)`,
                          paddingTop: '2.5rem',
                          paddingBottom: '3.5rem',
                        }}
                      >
                        {isBidding && (
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1"
                            style={{ background: 'rgba(34,197,94,0.92)', borderRadius: '20px' }}>
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            <span className="text-white text-[0.5rem] font-bold uppercase tracking-widest">Live Bid</span>
                          </div>
                        )}
                        <motion.div
                          animate={{ scale: isHovered ? 1.1 : 1 }}
                          transition={{ duration: 0.22 }}
                        >
                          {team.logoUrl
                            ? <img src={team.logoUrl} alt={team.name} className="w-28 h-28 object-contain drop-shadow-2xl" />
                            : <div className="text-8xl leading-none drop-shadow-2xl">{team.emoji}</div>
                          }
                        </motion.div>
                        {/* IPL dome arch */}
                        <div className="absolute bottom-0 left-0 right-0"
                          style={{ height: '44px', background: '#0e1d38', borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
                      </div>

                      {/* Dark name strip */}
                      <div style={{ background: '#0e1d38', padding: '0 14px 18px' }}>
                        <div className="font-bold text-sm uppercase tracking-wider text-white text-center mb-2 truncate">
                          {team.name}
                        </div>

                        {/* Hover reveal */}
                        <motion.div
                          initial={false}
                          animate={{ height: isHovered ? 'auto' : 0, opacity: isHovered ? 1 : 0 }}
                          transition={{ duration: 0.18 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="h-px w-full mb-2.5" style={{ background: 'rgba(255,255,255,0.1)' }} />
                          <div className="h-1 w-full mb-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-full transition-all duration-700" style={{
                              width: `${remPct}%`,
                              background: isBidding ? '#22c55e' : '#F5A623',
                            }} />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-white/35 font-mono">{squadCount} players</span>
                            <span className="text-bpl-gold font-mono font-bold">{formatMoney(rem)}</span>
                          </div>
                          <div className="mt-2 text-center text-[0.6rem] text-white/30 font-mono uppercase tracking-widest">
                            Tap to view squad →
                          </div>
                        </motion.div>

                        {!isHovered && (
                          <div className="text-center text-white/25 text-[0.65rem] font-mono">
                            {squadCount} players · {formatMoney(rem)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* ── Footer counters ── */}
            <div style={{ background: '#000e1e', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Players Sold', value: soldPlayers.length, color: '#22c55e'  },
                  { label: 'Available',    value: available.length,   color: '#F5A623'  },
                  { label: 'Total Teams',  value: teamList.length,    color: '#a78bfa'  },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="font-mono font-bold text-3xl" style={{ color }}>{value}</div>
                    <div className="text-white/20 text-[0.6rem] uppercase tracking-widest font-mono mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Top Buys (only when ≥10 players sold) ── */}
            {soldPlayers.length > 0 && (() => {
              const topBuys = [...soldPlayers]
                .filter(p => p.soldPrice > 0)
                .sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))
              if (!topBuys.length) return null
              return (
                <div style={{ background: '#00091a', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="max-w-5xl mx-auto px-4 py-10">
                    {/* Section header */}
                    <div className="flex items-center gap-4 mb-7">
                      <div className="h-px flex-1" style={{ background: 'rgba(255,215,0,0.15)' }} />
                      <div className="text-center">
                        <div className="font-display text-2xl tracking-[0.25em] text-bpl-gold">TOP BUYS</div>
                        <div className="text-[0.55rem] text-white/20 font-mono tracking-widest mt-0.5 uppercase">Highest sold players this auction</div>
                      </div>
                      <div className="h-px flex-1" style={{ background: 'rgba(255,215,0,0.15)' }} />
                    </div>

                    <div className="space-y-2">
                      {topBuys.map((p, i) => {
                        const buyerTeam = Object.values(teams).find(t => t.id === p.soldTo)
                        const c = TEAM_COLORS[p.soldTo] || DEFAULT_C
                        return (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-4 px-4 py-3 rounded-xl"
                            style={{
                              background: i === 0 ? 'rgba(255,215,0,0.07)' : i === 1 ? 'rgba(192,192,192,0.05)' : i === 2 ? 'rgba(205,127,50,0.05)' : 'rgba(255,255,255,0.025)',
                              border: i === 0 ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            {/* Rank */}
                            <div className="w-8 text-center shrink-0">
                              {i === 0 ? <span className="text-xl">🥇</span>
                                : i === 1 ? <span className="text-xl">🥈</span>
                                : i === 2 ? <span className="text-xl">🥉</span>
                                : <span className="font-mono font-bold text-white/25 text-sm">#{i + 1}</span>
                              }
                            </div>

                            {/* Photo */}
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0" />
                              : <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg shrink-0">{ROLE_EMOJI[p.role] || '🏏'}</div>
                            }

                            {/* Name + role */}
                            <div className="flex-1 min-w-0">
                              <div className="font-display text-sm tracking-wider text-white truncate">{p.name}</div>
                              <div className="text-[0.55rem] text-white/30 font-mono uppercase tracking-wider">{p.role}</div>
                            </div>

                            {/* Buyer team */}
                            {buyerTeam && (
                              <div className="hidden sm:flex items-center gap-2 shrink-0">
                                {buyerTeam.logoUrl
                                  ? <img src={buyerTeam.logoUrl} alt={buyerTeam.name} className="w-6 h-6 object-contain" />
                                  : <span className="text-base">{buyerTeam.emoji}</span>
                                }
                                <span className="text-white/40 text-xs font-mono truncate max-w-[100px]">{buyerTeam.name}</span>
                              </div>
                            )}

                            {/* Price */}
                            <div className="shrink-0 text-right">
                              <div className={`font-mono font-bold text-base ${i === 0 ? 'text-bpl-gold' : 'text-white/80'}`}>
                                {formatMoney(p.soldPrice)}
                              </div>
                              {p.basePrice > 0 && (
                                <div className="text-[0.5rem] text-white/20 font-mono">base {formatMoney(p.basePrice)}</div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
