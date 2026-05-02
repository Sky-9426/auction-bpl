// src/pages/TeamPage.jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import SoldCelebration from '../components/SoldCelebration'
import StatsGraph from '../components/StatsGraph'
import { useAuction, usePlayers, useTeams, useTeam, getBidIncrement, auctionActions, formatMoney } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'

const ROLE_EMOJI = { Batsman: '🏏', Bowler: '⚾', 'All-Rounder': '⚡', 'Wicket Keeper': '🧤' }

function StatCard({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded bg-white/[0.05] border border-white/[0.08] min-w-[52px]">
      <span className="font-semibold text-base text-white/90">{value}</span>
      <span className="text-[0.55rem] text-white/35 tracking-widest uppercase mt-0.5">{label}</span>
    </div>
  )
}

export default function TeamPage() {
  const { user } = useAuth()
  const teamId = user?.teamId
  const { auction } = useAuction()
  const { players } = usePlayers()
  const { team } = useTeam(teamId)
  const { teams } = useTeams()
  const [tab, setTab] = useState('live')
  const [captainLoading, setCaptainLoading] = useState(false)
  const [expandedTeam, setExpandedTeam] = useState(null)
  const prevBidRef = useRef(null)
  const [bidFlash, setBidFlash] = useState(false)

  const remaining = team ? team.budget - (team.spent || 0) : 0
  const livePlayer = players.find(p => p.id === auction?.currentPlayerId)
  const isWinning = auction?.currentBidder === teamId
  const raised = auction?.raisedHands?.includes(teamId)
  const increment = getBidIncrement(auction?.currentBid || 0)
  const nextBid = (auction?.currentBid || 0) + increment
  const canAfford = remaining >= nextBid
  const mySquad = (team?.players || []).map(pid => players.find(p => p.id === pid)).filter(Boolean)

  // Flash when bid changes
  useEffect(() => {
    if (prevBidRef.current !== null && prevBidRef.current !== auction?.currentBid) {
      setBidFlash(true)
      setTimeout(() => setBidFlash(false), 600)
    }
    prevBidRef.current = auction?.currentBid
  }, [auction?.currentBid])

  // Notify when outbid
  useEffect(() => {
    if (auction?.currentBidder && auction.currentBidder !== teamId && prevBidRef.current !== null) {
      if (auction.currentBid > (prevBidRef.current || 0)) {
        // Someone else bid
        toast(`${teams[auction.currentBidder]?.emoji} ${auction.currentBidderName} bid ${formatMoney(auction.currentBid)}`, {
          icon: '⚠️',
          style: { background: '#2a1a0a', borderColor: 'rgba(245,166,35,0.4)' }
        })
      }
    }
  }, [auction?.currentBidder, auction?.currentBid])

  const handleSetCaptain = async (playerId, role) => {
    setCaptainLoading(playerId + role)
    try {
      await auctionActions.setCaptain(teamId, playerId, role)
      toast.success(role === 'captain' ? '🌟 Captain set!' : '⭐ Vice-captain set!')
    } catch { toast.error('Failed') }
    setCaptainLoading(null)
  }

  const handleRequestPause = async () => {
    try {
      await auctionActions.requestPause(teamId, team.name)
      toast('⏸️ Pause requested — waiting for auctioneer')
    } catch { toast.error('Failed to request pause') }
  }

  const handleRaiseHand = async () => {
    if (!canAfford || isWinning) return
    try {
      if (raised) {
        await auctionActions.lowerHand(teamId)
        toast('Hand lowered', { icon: '👇', duration: 1200 })
      } else {
        await auctionActions.raiseHand(teamId)
        toast('Hand raised! Waiting for auctioneer...', { icon: '🙋', duration: 2000 })
      }
    } catch { toast.error('Action failed') }
  }

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-grid" style={{background:'#15151e'}} />

      <Navbar rightContent={
        team && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="font-mono text-xs text-bpl-gold">
              Budget: {formatMoney(remaining)}
            </div>
            <div className="h-1.5 w-28 bg-white/8 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-bpl-orange to-bpl-gold rounded-full"
                animate={{ width: `${Math.max(0, (remaining / team.budget) * 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )
      } />
      <SoldCelebration auction={auction} teams={teams} />

      <div className="relative z-10 pt-16 max-w-4xl mx-auto px-4 py-8">
        {/* Team header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{team?.emoji}</span>
              <h1 className="font-display text-4xl tracking-[0.12em] text-gradient">{team?.name?.toUpperCase()}</h1>
            </div>
            <div className="text-white/30 text-xs tracking-widest mt-1 font-mono">BPL SEASON 4 · AUCTION</div>
          </div>
          <div className="flex gap-3">
            <div className="glass px-4 py-2 rounded-xl text-center">
              <div className="font-display text-2xl text-bpl-gold">{formatMoney(remaining)}</div>
              <div className="text-[0.6rem] text-white/35 tracking-widest">REMAINING</div>
            </div>
            <div className="glass px-4 py-2 rounded-xl text-center">
              <div className="font-display text-2xl text-bpl-orange">{mySquad.length}</div>
              <div className="text-[0.6rem] text-white/35 tracking-widest">PLAYERS</div>
            </div>
          </div>
        </motion.div>

        {/* Tabs — F1 underline style */}
        <div className="flex mb-6 border-b-2 border-white/[0.08] overflow-x-auto">
          <button onClick={() => setTab('live')} className={`px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] whitespace-nowrap transition-colors -mb-0.5 border-b-2 flex items-center gap-2 ${tab === 'live' ? 'border-bpl-orange text-white' : 'border-transparent text-white/35 hover:text-white/60'}`}>
            {auction?.status === 'live' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
            {auction?.status === 'paused' && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />}
            Live Auction
          </button>
          <button onClick={() => setTab('squad')} className={`px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] whitespace-nowrap transition-colors -mb-0.5 border-b-2 ${tab === 'squad' ? 'border-bpl-orange text-white' : 'border-transparent text-white/35 hover:text-white/60'}`}>
            My Squad
          </button>
          <button onClick={() => setTab('standings')} className={`px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] whitespace-nowrap transition-colors -mb-0.5 border-b-2 ${tab === 'standings' ? 'border-bpl-orange text-white' : 'border-transparent text-white/35 hover:text-white/60'}`}>
            All Teams
          </button>
          <button onClick={() => setTab('squads')} className={`px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] whitespace-nowrap transition-colors -mb-0.5 border-b-2 ${tab === 'squads' ? 'border-bpl-orange text-white' : 'border-transparent text-white/35 hover:text-white/60'}`}>
            Other Squads
          </button>
          <button onClick={() => setTab('pool')} className={`px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] whitespace-nowrap transition-colors -mb-0.5 border-b-2 flex items-center gap-2 ${tab === 'pool' ? 'border-bpl-orange text-white' : 'border-transparent text-white/35 hover:text-white/60'}`}>
            Remaining
            <span className="text-[0.6rem] bg-bpl-orange/20 text-bpl-orange px-1.5 py-0.5 rounded">
              {players.filter(p => p.status === 'available').length}
            </span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* LIVE AUCTION TAB */}
          {tab === 'live' && (
            <motion.div key="live" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {auction?.status === 'idle' && (
                <div className="text-center py-24 glass rounded-2xl">
                  <div className="text-5xl mb-4">⏳</div>
                  <div className="font-display text-xl tracking-widest text-white/30">WAITING FOR AUCTIONEER</div>
                  <div className="text-white/20 text-sm mt-2">Next player will appear here</div>
                </div>
              )}

              {auction?.status === 'paused' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-24 rounded-2xl border-2 border-blue-400/30 bg-blue-500/5"
                >
                  <div className="text-5xl mb-4">⏸️</div>
                  <div className="font-display text-xl tracking-widest text-blue-300">AUCTION PAUSED</div>
                  <div className="text-white/25 text-sm mt-2 font-mono">Waiting for auctioneer to resume...</div>
                  {auction.pauseRequestTeam && (
                    <div className="mt-3 text-xs text-white/20 font-mono">
                      Requested by {teams[auction.pauseRequestTeam]?.emoji} {auction.pauseRequestTeamName}
                    </div>
                  )}
                </motion.div>
              )}

              {auction?.status === 'sold' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 rounded-2xl border-2 border-green-400/30 bg-green-500/5"
                >
                  <div className="font-display text-5xl text-green-400 tracking-[0.2em] sold-stamp mb-3">SOLD!</div>
                  <div className="text-xl">{auction.soldPlayerName}</div>
                  <div className="text-white/40 mt-1">
                    {teams[auction.soldTo]?.emoji} {auction.soldToName} · <span className="text-bpl-gold font-mono">{formatMoney(auction.soldPrice)}</span>
                  </div>
                  {auction.soldTo === teamId && (
                    <div className="mt-4 text-green-400 font-bold tracking-widest text-sm">🎉 ADDED TO YOUR SQUAD!</div>
                  )}
                </motion.div>
              )}

              {auction?.status === 'live' && livePlayer && (
                <div>
                  {/* Pause request */}
                  {!auction?.pauseRequested && (
                    <div className="mb-3 flex justify-end">
                      <button
                        onClick={handleRequestPause}
                        className="btn-bpl btn-ghost text-xs py-1.5 px-4 flex items-center gap-2"
                      >
                        ⏸️ Request Pause
                      </button>
                    </div>
                  )}
                  {auction?.pauseRequested && auction.pauseRequestTeam === teamId && (
                    <div className="mb-3 text-center text-yellow-300/70 text-xs font-mono animate-pulse">
                      ⏸️ Pause request sent — waiting for auctioneer...
                    </div>
                  )}
                  {/* Player card */}
                  <div
                    className="relative overflow-hidden mb-6"
                    style={{
                      background: '#1a1a28',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderLeft: isWinning ? '4px solid #4ade80' : '4px solid #F5A623',
                    }}
                  >
                    <div style={{ height: '2px', background: isWinning ? '#4ade80' : '#F5A623' }} />

                    <div className="p-5">
                      {/* Top row: role badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="live-badge">LIVE</span>
                        <span className="font-mono text-[0.6rem] tracking-widest text-bpl-orange/50 uppercase">{livePlayer.role}</span>
                      </div>

                      <div className="flex gap-4">
                        {/* Left: photo */}
                        {livePlayer.imageUrl && (
                          <div className="shrink-0">
                            <img src={livePlayer.imageUrl} alt={livePlayer.name} className="w-20 h-20 rounded-xl object-cover border-2 border-bpl-orange/30 shadow-lg shadow-bpl-orange/15" />
                          </div>
                        )}

                        {/* Right: info */}
                        <div className="flex-1 min-w-0">
                          <motion.div
                            key={livePlayer.name}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-display text-3xl sm:text-4xl tracking-wider leading-tight mb-1"
                            style={{ background: 'linear-gradient(135deg, white 40%, #F5A623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                          >
                            {livePlayer.name}
                          </motion.div>
                          {livePlayer.prevTeam && (
                            <div className="text-xs text-blue-300/60 mb-2">Season {livePlayer.prevSeason || '?'} · {livePlayer.prevTeam}</div>
                          )}

                          {/* Full stats */}
                          {livePlayer.stats && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {livePlayer.stats.matches != null && <StatCard label="M" value={livePlayer.stats.matches} />}
                              {livePlayer.role !== 'Bowler' && livePlayer.stats.runs != null && <StatCard label="Runs" value={livePlayer.stats.runs} />}
                              {livePlayer.role !== 'Bowler' && livePlayer.stats.avg != null && <StatCard label="Avg" value={livePlayer.stats.avg} />}
                              {livePlayer.role !== 'Bowler' && livePlayer.stats.sr != null && <StatCard label="SR" value={livePlayer.stats.sr} />}
                              {livePlayer.role !== 'Bowler' && livePlayer.stats.hs != null && <StatCard label="HS" value={livePlayer.stats.hs} />}
                              {(livePlayer.role === 'Bowler' || livePlayer.role === 'All-Rounder') && livePlayer.stats.wickets != null && <StatCard label="Wkts" value={livePlayer.stats.wickets} />}
                              {(livePlayer.role === 'Bowler' || livePlayer.role === 'All-Rounder') && livePlayer.stats.economy != null && <StatCard label="Econ" value={livePlayer.stats.economy} />}
                              {(livePlayer.role === 'Bowler' || livePlayer.role === 'All-Rounder') && livePlayer.stats.best && <StatCard label="Best" value={livePlayer.stats.best} />}
                              {livePlayer.role === 'Wicket Keeper' && livePlayer.stats.stumpings != null && <StatCard label="St" value={livePlayer.stats.stumpings} />}
                              {livePlayer.stats.catches != null && <StatCard label="Ct" value={livePlayer.stats.catches} />}
                            </div>
                          )}

                          <div className="text-xs text-white/25 font-mono">
                            Base: {formatMoney(livePlayer.basePrice)}
                          </div>
                        </div>
                      </div>

                      {livePlayer.stats && <StatsGraph player={livePlayer} className="px-1 pb-2" />}

                      {/* Current bid */}
                      <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <motion.div
                            key={auction.currentBid}
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.1 }}
                            className={`font-mono text-4xl font-black ${bidFlash ? 'text-red-400' : 'text-bpl-gold'}`}
                          >
                            {formatMoney(auction.currentBid)}
                          </motion.div>
                          <div className="text-xs text-white/30 mt-0.5">
                            {isWinning
                              ? <span className="text-green-400 font-bold">🏆 YOU'RE WINNING!</span>
                              : auction.currentBidder
                                ? <>Leading: <span className="text-bpl-orange">{teams[auction.currentBidder]?.emoji} {auction.currentBidderName}</span></>
                                : <span className="text-white/20">No bids yet — be first!</span>
                            }
                          </div>
                        </div>
                        <div className="text-xs text-white/25 font-mono text-right">
                          <div>Next increment: +{formatMoney(increment)}</div>
                          <div className="text-white/40">Next bid: {formatMoney(nextBid)}</div>
                        </div>
                      </div>
                    </div>

                    {/* RAISE HAND BUTTON */}
                    <div className="px-5 pb-5">
                      {isWinning && (
                        <div className="mb-3 flex items-center gap-3 px-4 py-3" style={{borderLeft:'4px solid #4ade80', background:'rgba(74,222,128,0.06)'}}>                          
                          <span className="text-lg">🏆</span>
                          <span className="text-green-300 font-bold text-sm tracking-widest uppercase">You're leading — wait for another team</span>
                        </div>
                      )}
                      {raised && !isWinning && (
                        <div className="mb-3 flex items-center gap-3 px-4 py-3" style={{borderLeft:'4px solid #F5A623', background:'rgba(245,166,35,0.06)'}}>                          
                          <span className="text-lg">🙋</span>
                          <span className="text-bpl-orange font-bold text-sm tracking-widest uppercase">Hand raised — waiting for auctioneer</span>
                        </div>
                      )}

                      <button
                        onClick={handleRaiseHand}
                        disabled={!canAfford || isWinning}
                        className="w-full font-display tracking-[0.2em] transition-colors duration-150"
                        style={{
                          height: '76px',
                          fontSize: '1.5rem',
                          borderRadius: '2px',
                          background: (!canAfford || isWinning)
                            ? 'rgba(255,255,255,0.04)'
                            : raised ? '#7c3a00' : '#F5A623',
                          color: (!canAfford || isWinning) ? 'rgba(255,255,255,0.15)' : '#0a0a12',
                          border: (!canAfford || isWinning) ? '1px solid rgba(255,255,255,0.06)' : 'none',
                          cursor: (!canAfford || isWinning) ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {!canAfford
                          ? 'INSUFFICIENT BUDGET'
                          : isWinning
                            ? "YOU'RE LEADING"
                            : raised ? '▼  LOWER HAND' : '▲  RAISE HAND'
                        }
                      </button>

                      <p className="text-white/20 text-xs mt-2 font-mono">
                        {isWinning
                          ? 'Another team must bid before you can raise your hand'
                          : canAfford
                            ? raised ? 'Auctioneer will award the bid to you' : `Next: ${formatMoney(nextBid)} (+${formatMoney(increment)})`
                            : 'Insufficient budget'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Bid queue / history */}
                  {auction.bids?.length > 0 && (
                    <div className="glass rounded-xl p-4">
                      <div className="text-[0.65rem] tracking-widest text-white/25 uppercase font-mono mb-3">Bid Activity (latest first)</div>
                      <div className="space-y-px max-h-48 overflow-y-auto">
                        {[...auction.bids].reverse().map((b, i) => (
                          <div
                            key={b.ts || i}
                            className={`flex items-center justify-between px-3 py-2 ${b.teamId === teamId ? 'bg-bpl-orange/10' : 'bg-white/[0.02]'} ${i === 0 ? 'border-l-2 border-bpl-orange' : ''}`}
                          >
                            <span className="text-sm">{teams[b.teamId]?.emoji} <span className={b.teamId === teamId ? 'text-bpl-orange font-bold' : 'text-white/50'}>{b.teamName}</span></span>
                            <span className="font-mono text-xs text-bpl-gold">{formatMoney(b.amount)}</span>
                            <span className="text-white/20 text-xs">{b.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* SQUAD TAB */}
          {tab === 'squad' && (
            <motion.div key="squad" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {mySquad.length === 0
                ? <div className="text-center py-20 text-white/20 text-sm">Your squad is empty. Start bidding!</div>
                : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mySquad.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass rounded-xl p-4"
                      >
                        {/* Top row */}
                        <div className="flex items-start gap-3 mb-3">
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.name} className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0" />
                            : <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0 text-3xl">{ROLE_EMOJI[p.role]}</div>
                          }
                          <div className="flex-1 min-w-0">
                            <div className="font-display text-base tracking-wider leading-tight mb-0.5">{p.name}</div>
                            {p.prevTeam && <div className="text-[0.55rem] text-blue-300/60 tracking-wider truncate">S{p.prevSeason || '?'} · {p.prevTeam}</div>}
                            <div className="font-mono text-[0.55rem] text-bpl-orange/60 uppercase tracking-widest mt-0.5">{p.role}</div>
                            {p.description && (
                              <div className="text-[0.6rem] text-white/35 mt-1 leading-snug line-clamp-2">{p.description}</div>
                            )}
                          </div>
                        </div>

                        {/* Full stats grid */}
                        {p.stats && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {p.stats.matches != null && <StatCard label="M" value={p.stats.matches} />}
                            {p.role !== 'Bowler' && p.stats.runs != null && <StatCard label="Runs" value={p.stats.runs} />}
                            {p.role !== 'Bowler' && p.stats.avg != null && <StatCard label="Avg" value={p.stats.avg} />}
                            {p.role !== 'Bowler' && p.stats.sr != null && <StatCard label="SR" value={p.stats.sr} />}
                            {p.role !== 'Bowler' && p.stats.hs != null && <StatCard label="HS" value={p.stats.hs} />}
                            {(p.role === 'Bowler' || p.role === 'All-Rounder') && p.stats.wickets != null && <StatCard label="Wkts" value={p.stats.wickets} />}
                            {(p.role === 'Bowler' || p.role === 'All-Rounder') && p.stats.economy != null && <StatCard label="Econ" value={p.stats.economy} />}
                            {(p.role === 'Bowler' || p.role === 'All-Rounder') && p.stats.best && <StatCard label="Best" value={p.stats.best} />}
                            {p.role === 'Wicket Keeper' && p.stats.stumpings != null && <StatCard label="St" value={p.stats.stumpings} />}
                            {p.stats.catches != null && <StatCard label="Ct" value={p.stats.catches} />}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-white/30">Bought for</span>
                          <span className="font-mono text-sm text-bpl-gold font-bold">{formatMoney(p.soldPrice)}</span>
                        </div>
                        {p.status === 'retained' && (
                          <div className="mt-1 text-[0.6rem] text-purple-400 font-mono tracking-widest">🔒 RETAINED</div>
                        )}
                        {/* Captain / VC badges */}
                        {(team?.captain === p.id || team?.viceCaptain === p.id) && (
                          <div className="mt-2 flex gap-2">
                            {team?.captain === p.id && <span className="text-[0.6rem] text-yellow-300 font-mono bg-yellow-300/10 px-2 py-0.5 rounded-full border border-yellow-300/20">🌟 CAPTAIN</span>}
                            {team?.viceCaptain === p.id && <span className="text-[0.6rem] text-blue-300 font-mono bg-blue-300/10 px-2 py-0.5 rounded-full border border-blue-300/20">⭐ VICE-C</span>}
                          </div>
                        )}
                        {/* Assign captain/VC buttons */}
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {team?.captain !== p.id && (
                            <button
                              onClick={() => handleSetCaptain(p.id, 'captain')}
                              disabled={captainLoading === p.id + 'captain'}
                              className="btn-bpl btn-ghost text-[0.6rem] py-1 px-2.5 flex items-center gap-1"
                            >
                              {captainLoading === p.id + 'captain' ? '...' : '🌟 Set Captain'}
                            </button>
                          )}
                          {team?.viceCaptain !== p.id && (
                            <button
                              onClick={() => handleSetCaptain(p.id, 'viceCaptain')}
                              disabled={captainLoading === p.id + 'viceCaptain'}
                              className="btn-bpl btn-ghost text-[0.6rem] py-1 px-2.5 flex items-center gap-1"
                            >
                              {captainLoading === p.id + 'viceCaptain' ? '...' : '⭐ Set Vice-C'}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
              }
            </motion.div>
          )}

          {/* ALL TEAMS TAB — F1 table */}
          {tab === 'standings' && (
            <motion.div key="standings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Column headers */}
              <div className="grid items-center px-4 py-3 f1-slash" style={{gridTemplateColumns:'48px 1fr auto auto', background:'#15151e', borderBottom:'2px solid rgba(255,255,255,0.12)'}}>
                <span className="text-xs font-bold tracking-[0.15em] text-white/30 uppercase">Pos</span>
                <span className="text-xs font-bold tracking-[0.15em] text-white/30 uppercase">Team</span>
                <span className="text-xs font-bold tracking-[0.15em] text-white/30 uppercase text-right pr-8">Budget Left</span>
                <span className="text-xs font-bold tracking-[0.15em] text-white/30 uppercase text-right">Players</span>
              </div>
              {/* Rows */}
              <div style={{border:'1px solid rgba(255,255,255,0.07)', borderTop:'none'}}>
                {Object.values(teams).sort((a, b) => (b.players?.length || 0) - (a.players?.length || 0)).map((t, i) => {
                  const rem = t.budget - (t.spent || 0)
                  const pct = Math.max(0, (rem / t.budget) * 100)
                  const isMe = t.id === teamId
                  return (
                    <div
                      key={t.id}
                      className="grid items-center px-4 py-4 transition-colors hover:bg-white/[0.025]"
                      style={{
                        gridTemplateColumns:'48px 1fr auto auto',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        borderLeft: isMe ? '3px solid #F5A623' : '3px solid transparent',
                        background: isMe ? 'rgba(245,166,35,0.04)' : undefined,
                      }}
                    >
                      <span className="font-mono text-lg font-bold text-white/25">{i + 1}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{t.emoji}</span>
                        <div>
                          <div className="font-bold text-sm uppercase tracking-wider">
                            {t.name}
                            {isMe && <span className="ml-2 text-[0.5rem] text-bpl-orange border border-bpl-orange/40 px-1.5 py-0.5">YOU</span>}
                          </div>
                          <div className="mt-1 w-24 h-1" style={{background:'rgba(255,255,255,0.08)'}}>
                            <div className="h-full bg-bpl-orange" style={{width:`${pct}%`}} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right pr-8">
                        <div className="font-mono font-bold text-bpl-gold">{formatMoney(rem)}</div>
                        <div className="text-[0.6rem] text-white/25 uppercase tracking-widest">remaining</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-xl">{t.players?.length || 0}</div>
                        <div className="text-[0.6rem] text-white/25 uppercase tracking-widest">players</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
          {/* OTHER SQUADS TAB */}
          {tab === 'squads' && (
            <motion.div key="squads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {Object.values(teams).filter(t => t.id !== teamId).map((t, i) => {
                const squad = (t.players || []).map(pid => players.find(p => p.id === pid)).filter(Boolean)
                const isOpen = expandedTeam === t.id
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedTeam(isOpen ? null : t.id)}
                      className="w-full px-5 py-4 flex items-center gap-4 text-left"
                    >
                      <span className="text-2xl">{t.emoji}</span>
                      <div className="flex-1">
                        <div className="font-display tracking-wider text-sm">{t.name}</div>
                        <div className="text-white/30 text-xs">{squad.length} players · {formatMoney(t.budget - (t.spent || 0))} left</div>
                      </div>
                      <span className={`text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-white/5 pt-3">
                            {squad.length === 0
                              ? <div className="col-span-full text-white/20 text-xs text-center py-4">No players yet</div>
                              : squad.map(p => (
                                <div key={p.id} className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
                                  {p.imageUrl
                                    ? <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" />
                                    : <span className="text-lg shrink-0">{ROLE_EMOJI[p.role]}</span>
                                  }
                                  <div className="min-w-0">
                                    <div className="font-display text-xs tracking-wider truncate">
                                      {t.captain === p.id && <span className="text-yellow-300 mr-1">🌟</span>}
                                      {t.viceCaptain === p.id && <span className="text-blue-300 mr-1">⭐</span>}
                                      {p.name}
                                    </div>
                                    <div className="text-white/30 text-[0.5rem] truncate">{p.role} · {formatMoney(p.soldPrice)}</div>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
          {/* REMAINING PLAYERS TAB */}
          {tab === 'pool' && (() => {
            const ROLE_ORDER = ['Batsman', 'All-Rounder', 'Wicket Keeper', 'Bowler']
            const available = players.filter(p => p.status === 'available')
            const byRole = ROLE_ORDER.reduce((acc, r) => {
              const rp = available.filter(p => p.role === r)
              if (rp.length) acc[r] = rp
              return acc
            }, {})
            return (
              <motion.div key="pool" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {available.length === 0 ? (
                  <div className="text-center py-20 glass rounded-2xl">
                    <div className="text-4xl mb-3">🏏</div>
                    <div className="font-display text-lg tracking-widest text-white/30">ALL PLAYERS SOLD</div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Summary bar */}
                    <div className="flex gap-3 flex-wrap">
                      {ROLE_ORDER.map(r => {
                        const cnt = available.filter(p => p.role === r).length
                        if (!cnt) return null
                        return (
                          <div key={r} className="glass px-4 py-2 rounded-xl flex items-center gap-2">
                            <span>{ROLE_EMOJI[r]}</span>
                            <span className="font-mono text-bpl-gold text-lg font-bold">{cnt}</span>
                            <span className="text-white/30 text-xs uppercase tracking-widest">{r}</span>
                          </div>
                        )
                      })}
                    </div>

                    {Object.entries(byRole).map(([role, rps]) => (
                      <div key={role}>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xl">{ROLE_EMOJI[role]}</span>
                          <h3 className="font-display text-lg tracking-wider text-white">{role}s</h3>
                          <span className="text-white/25 text-xs font-mono">({rps.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {rps.map((p, i) => (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="glass rounded-xl p-4"
                              style={{ borderLeft: p.id === auction?.currentPlayerId ? '3px solid #e10600' : '3px solid transparent' }}
                            >
                              <div className="flex gap-3">
                                {p.imageUrl
                                  ? <img src={p.imageUrl} alt={p.name} className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0" />
                                  : <div className="w-14 h-14 rounded-xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-2xl shrink-0">{ROLE_EMOJI[p.role]}</div>
                                }
                                <div className="flex-1 min-w-0">
                                  <div className="font-display text-base tracking-wider leading-tight">
                                    {p.id === auction?.currentPlayerId && <span className="live-badge mr-1" style={{fontSize:'0.45rem'}}>LIVE</span>}
                                    {p.name}
                                  </div>
                                  {p.prevTeam && <div className="text-[0.55rem] text-blue-300/60 tracking-wider">S{p.prevSeason || '?'} · {p.prevTeam}</div>}
                                  <div className="text-[0.55rem] text-white/25 font-mono mt-0.5">Base {formatMoney(p.basePrice)}</div>
                                </div>
                              </div>

                              {p.stats && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {p.stats.matches != null && <StatCard label="M" value={p.stats.matches} />}
                                  {p.role !== 'Bowler' && p.stats.runs != null && <StatCard label="Runs" value={p.stats.runs} />}
                                  {p.role !== 'Bowler' && p.stats.avg != null && <StatCard label="Avg" value={p.stats.avg} />}
                                  {p.role !== 'Bowler' && p.stats.sr != null && <StatCard label="SR" value={p.stats.sr} />}
                                  {p.role !== 'Bowler' && p.stats.hs != null && <StatCard label="HS" value={p.stats.hs} />}
                                  {(p.role === 'Bowler' || p.role === 'All-Rounder') && p.stats.wickets != null && <StatCard label="Wkts" value={p.stats.wickets} />}
                                  {(p.role === 'Bowler' || p.role === 'All-Rounder') && p.stats.economy != null && <StatCard label="Econ" value={p.stats.economy} />}
                                  {(p.role === 'Bowler' || p.role === 'All-Rounder') && p.stats.best && <StatCard label="Best" value={p.stats.best} />}
                                  {p.role === 'Wicket Keeper' && p.stats.stumpings != null && <StatCard label="St" value={p.stats.stumpings} />}
                                  {p.stats.catches != null && <StatCard label="Ct" value={p.stats.catches} />}
                                </div>
                              )}

                              {p.description && (
                                <div className="text-[0.6rem] text-white/30 mt-2 leading-snug">{p.description}</div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })()}
        </AnimatePresence>
      </div>
    </div>
  )
}
