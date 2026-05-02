// src/pages/AuctioneerPage.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Gavel, Users, Clock, TrendingUp, ChevronRight, SkipForward, RefreshCw } from 'lucide-react'
import Navbar from '../components/Navbar'
import SoldCelebration from '../components/SoldCelebration'
import { useAuction, usePlayers, useTeams, auctionActions, getBidIncrement, formatMoney } from '../hooks/useFirestore'

const ROLE_EMOJI = { Batsman: '🏏', Bowler: '⚾', 'All-Rounder': '⚡', 'Wicket Keeper': '🧤' }

export default function AuctioneerPage() {
  const { auction, loading: aLoading } = useAuction()
  const { players, loading: pLoading } = usePlayers()
  const { teams } = useTeams()
  const [tab, setTab] = useState('live')
  const [roleFilter, setRoleFilter] = useState('All')
  const [ageFilter, setAgeFilter] = useState('all')
  const [spinWinner, setSpinWinner] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const available = players.filter(p => p.status === 'available')
  const sold = players.filter(p => p.status === 'sold')
  const unsold = players.filter(p => p.status === 'unsold')
  const livePlayer = players.find(p => p.id === auction?.currentPlayerId)

  const handleStartBid = async (player) => {
    if (auction?.status === 'live') { toast.error('Close current auction first!'); return }
    setActionLoading(true)
    try {
      await auctionActions.startBid(player)
      toast.success(`🎙️ Bidding started for ${player.name}`)
      setTab('live')
    } catch (e) { toast.error('Failed to start bid') }
    setActionLoading(false)
  }

  const handleSold = async () => {
    if (!auction?.currentBidder) { toast.error('No bids placed yet!'); return }
    setActionLoading(true)
    try {
      const result = await auctionActions.declareSold(auction, teams)
      if (result?.error) toast.error(result.error)
      else toast.success(`🔨 SOLD! ${auction.currentPlayerName} → ${auction.currentBidderName}`)
    } catch (e) { toast.error('Error declaring sold') }
    setActionLoading(false)
  }

  const handleUnsold = async () => {
    setActionLoading(true)
    try {
      await auctionActions.markUnsold(auction)
      toast('❌ Player marked unsold')
    } catch (e) { toast.error('Error') }
    setActionLoading(false)
  }

  const handleReAuction = async (player) => {
    setActionLoading(true)
    try {
      await auctionActions.reAuction(player, teams)
      toast.success(`↩️ ${player.name} back in pool`)
    } catch (e) { toast.error('Failed') }
    setActionLoading(false)
  }

  const handleClearBidHistory = async () => {
    try {
      await auctionActions.clearBidHistory()
      toast.success('Bid history cleared')
    } catch (e) { toast.error('Failed to clear history') }
  }

  const handleAwardBid = async (teamId) => {
    const t = teams[teamId]
    if (!t) return
    try {
      await auctionActions.awardBid(teamId, t.name, t.emoji)
      toast.success(`${t.emoji} ${t.name} — bid awarded!`, { duration: 2000 })
    } catch (e) {
      toast.error('Award failed: ' + e.message)
    }
  }

  if (aLoading || pLoading) return <LoadingScreen />

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-grid" style={{background:'#15151e'}} />

      <Navbar />
      <SoldCelebration auction={auction} teams={teams} />

      <div className="relative z-10 pt-16 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-[0.15em]">
              AUCTIONEER <span className="text-gradient">CONSOLE</span>
            </h1>
            <p className="text-white/35 text-sm tracking-widest mt-1 font-mono">SEASON 4 · LIVE CONTROL</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="glass px-4 py-2 rounded-xl text-center">
              <div className="font-display text-2xl text-bpl-orange">{available.length}</div>
              <div className="text-[0.6rem] text-white/35 tracking-widest">AVAILABLE</div>
            </div>
            <div className="glass px-4 py-2 rounded-xl text-center">
              <div className="font-display text-2xl text-green-400">{sold.length}</div>
              <div className="text-[0.6rem] text-white/35 tracking-widest">SOLD</div>
            </div>
            <div className="glass px-4 py-2 rounded-xl text-center">
              <div className="font-display text-2xl text-white/60">{players.length}</div>
              <div className="text-[0.6rem] text-white/35 tracking-widest">TOTAL</div>
            </div>
          </div>
        </motion.div>

        {/* SOLD FLASH */}
        <AnimatePresence>
          {auction?.status === 'sold' && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-6 text-center border-l-4 border-green-400"
            style={{ background: '#0d2b1a' }}
          >
              <div className="font-display text-5xl text-green-400 tracking-[0.3em] mb-2">SOLD!</div>
              <div className="text-xl font-semibold">{auction.soldPlayerName}</div>
              <div className="text-white/50 mt-1">
                → <span className="text-green-300 font-bold">{auction.soldToName}</span>
                {' '}for <span className="text-bpl-gold font-mono">{formatMoney(auction.soldPrice)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LIVE AUCTION PANEL */}
        {auction?.status === 'live' && livePlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="mb-8 relative overflow-hidden"
            style={{ background: '#1a1a28', border: '1px solid rgba(255,255,255,0.07)', borderLeft: '4px solid #F5A623' }}
          >
            <div style={{ height: '2px', background: '#F5A623' }} />

            <div className="p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                {/* Player info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="live-badge">LIVE</span>
                    {livePlayer.imageUrl
                      ? <img src={livePlayer.imageUrl} alt={livePlayer.name} className="w-8 h-8 rounded-full object-cover border border-bpl-orange/40" />
                      : <span className="text-2xl">{ROLE_EMOJI[livePlayer.role]}</span>
                    }
                    <span className="font-mono text-[0.6rem] tracking-widest text-bpl-orange/60 uppercase">{livePlayer.role}</span>
                  </div>

                  <motion.div
                    key={livePlayer.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-display text-5xl sm:text-6xl tracking-wider mb-2"
                    style={{ background: 'linear-gradient(135deg, white, #F5A623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    {livePlayer.name}
                  </motion.div>

                  {livePlayer.prevTeam && (
                    <div className="text-sm text-blue-300/60 mb-2">Season {livePlayer.prevSeason || '?'} · {livePlayer.prevTeam}</div>
                  )}

                  {/* Full stats grid */}
                  {livePlayer.stats && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {livePlayer.stats.matches != null && <StatPill label="M" value={livePlayer.stats.matches} />}
                      {livePlayer.role !== 'Bowler' && livePlayer.stats.runs != null && <StatPill label="Runs" value={livePlayer.stats.runs} />}
                      {livePlayer.role !== 'Bowler' && livePlayer.stats.avg != null && <StatPill label="Avg" value={livePlayer.stats.avg} />}
                      {livePlayer.role !== 'Bowler' && livePlayer.stats.sr != null && <StatPill label="SR" value={livePlayer.stats.sr} />}
                      {livePlayer.role !== 'Bowler' && livePlayer.stats.hs != null && <StatPill label="HS" value={livePlayer.stats.hs} />}
                      {(livePlayer.role === 'Bowler' || livePlayer.role === 'All-Rounder') && livePlayer.stats.wickets != null && <StatPill label="Wkts" value={livePlayer.stats.wickets} />}
                      {(livePlayer.role === 'Bowler' || livePlayer.role === 'All-Rounder') && livePlayer.stats.economy != null && <StatPill label="Econ" value={livePlayer.stats.economy} />}
                      {(livePlayer.role === 'Bowler' || livePlayer.role === 'All-Rounder') && livePlayer.stats.best && <StatPill label="Best" value={livePlayer.stats.best} />}
                      {livePlayer.role === 'Wicket Keeper' && livePlayer.stats.stumpings != null && <StatPill label="St" value={livePlayer.stats.stumpings} />}
                      {livePlayer.stats.catches != null && <StatPill label="Ct" value={livePlayer.stats.catches} />}
                    </div>
                  )}

                  <div className="flex items-end gap-4 flex-wrap">
                    <motion.div
                      key={auction.currentBid}
                      initial={{ scale: 1.2, color: '#FFD700' }}
                      animate={{ scale: 1 }}
                      className="font-mono text-4xl sm:text-5xl font-black text-bpl-gold"
                      style={{ textShadow: '0 0 40px rgba(255,215,0,0.5)' }}
                    >
                      {formatMoney(auction.currentBid)}
                    </motion.div>
                    <div className="text-white/40 text-sm mb-1">
                      {auction.currentBidder
                        ? <>Leading: <span className="text-bpl-orange font-bold">{teams[auction.currentBidder]?.emoji} {auction.currentBidderName}</span></>
                        : <span className="text-white/25">No bids · base {formatMoney(livePlayer.basePrice)}</span>
                      }
                    </div>
                  </div>

                  {/* Next increment info */}
                  <div className="mt-2 text-xs text-white/30 font-mono">
                    Next bid: {formatMoney(auction.currentBid + getBidIncrement(auction.currentBid))}
                    <span className="ml-2 text-white/20">(+{formatMoney(getBidIncrement(auction.currentBid))})</span>
                  </div>

                  {/* ── RAISED HANDS QUEUE ── */}
                  <AnimatePresence>
                    {auction.raisedHands?.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-4 bg-yellow-400/8 border border-yellow-400/30 rounded-2xl p-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <motion.span
                            animate={{ rotate: [0, -20, 20, -12, 12, 0] }}
                            transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 1.2 }}
                            className="text-xl"
                          >🙋</motion.span>
                          <span className="text-yellow-300 font-bold text-sm tracking-wide">
                            {auction.raisedHands.length} team{auction.raisedHands.length > 1 ? 's' : ''} raised hand{auction.raisedHands.length > 1 ? 's' : ''}
                          </span>
                          <span className="text-white/25 text-xs ml-auto font-mono">tap to award bid</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {auction.raisedHands.map((tid, i) => (
                            <motion.button
                              key={tid}
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.06 }}
                              onClick={() => handleAwardBid(tid)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                              style={{
                                background: i === 0
                                  ? 'linear-gradient(135deg,#F5A623,#FF6B00)'
                                  : 'rgba(255,255,255,0.08)',
                                color: i === 0 ? '#060d1f' : 'white',
                                border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.12)',
                                boxShadow: i === 0 ? '0 4px 20px rgba(245,166,35,0.35)' : 'none',
                              }}
                            >
                              <span className="text-lg">{teams[tid]?.emoji}</span>
                              <span>{teams[tid]?.name || tid}</span>
                              {i === 0 && <span className="text-[0.6rem] font-mono ml-1 opacity-60">FIRST</span>}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Live bid queue / history */}
                  {auction.bids?.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[0.6rem] tracking-widest text-white/20 uppercase font-mono">Bid Queue (latest first)</div>
                        <button onClick={handleClearBidHistory} className="text-[0.6rem] text-red-400/60 hover:text-red-400 tracking-widest uppercase font-mono transition-colors">Clear History</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[...auction.bids].reverse().slice(0, 8).map((b, i) => (
                          <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${i === 0 ? 'bg-bpl-orange/15 border-bpl-orange/40' : 'bg-white/[0.03] border-white/8'}`}>
                            <span>{teams[b.teamId]?.emoji}</span>
                            <span className="font-mono text-bpl-gold">{formatMoney(b.amount)}</span>
                            <span className="text-white/20 text-[0.55rem]">{b.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-3 min-w-[180px]">
                  <button
                    onClick={handleSold}
                    disabled={actionLoading || !auction.currentBidder}
                    className="btn-bpl btn-success text-sm flex items-center justify-center gap-2 py-4"
                  >
                    <Gavel size={16} />
                    SOLD!
                  </button>
                  <button
                    onClick={handleUnsold}
                    disabled={actionLoading}
                    className="btn-bpl btn-danger text-sm flex items-center justify-center gap-2"
                  >
                    <SkipForward size={14} />
                    Unsold
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Idle State */}
        {auction?.status === 'idle' && (
          <div className="mb-8 glass rounded-2xl p-8 text-center border-dashed border-white/10">
            <div className="text-4xl mb-3">🎙️</div>
            <div className="text-white/30 tracking-widest text-sm">Select a player below to start the auction</div>
          </div>
        )}

        {/* PAUSE REQUEST BANNER */}
        <AnimatePresence>
          {auction?.pauseRequested && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center gap-4 bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4 flex-wrap"
            >
              <span className="text-xl">⏸️</span>
              <div className="flex-1">
                <div className="text-yellow-300 font-semibold text-sm">Pause Requested</div>
                <div className="text-white/40 text-xs">{auction.pauseRequestTeamName} is requesting a pause</div>
              </div>
              <button
                onClick={async () => { await auctionActions.acceptPause(); toast('⏸️ Auction paused') }}
                className="btn-bpl btn-orange text-xs py-2 px-4"
              >Accept Pause</button>
              <button
                onClick={async () => { await auctionActions.dismissPause(); toast('Pause dismissed') }}
                className="btn-bpl btn-ghost text-xs py-2 px-4"
              >Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PAUSED BANNER */}
        <AnimatePresence>
          {auction?.status === 'paused' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center gap-4 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4"
            >
              <span className="text-xl">⏸️</span>
              <div className="flex-1">
                <div className="text-blue-300 font-semibold">Auction Paused</div>
              </div>
              <button
                onClick={async () => { await auctionActions.resumeAuction(); toast('▶️ Auction resumed') }}
                className="btn-bpl btn-success text-xs py-2 px-4"
              >Resume</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex mb-6 border-b-2 border-white/[0.08] flex-wrap">
          {[['live', 'Available'], ['sold', 'Sold'], ['unsold', 'Unsold'], ['teams', 'Teams']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] whitespace-nowrap transition-colors -mb-0.5 border-b-2 ${tab === id ? 'border-bpl-orange text-white' : 'border-transparent text-white/35 hover:text-white/60'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Available Players — role sections + spin wheel */}
        {tab === 'live' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Role filter */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {['All', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'].map(r => (
                <button
                  key={r}
                  onClick={() => { setRoleFilter(r); setSpinWinner(null) }}
                  className={`btn-bpl text-xs py-1.5 px-3 ${roleFilter === r ? 'btn-orange' : 'btn-ghost border-0'}`}
                >
                  {r === 'All' ? '🌐 All' : `${ROLE_EMOJI[r]} ${r}`}
                </button>
              ))}
            </div>

            {/* New / Old toggle */}
            <div className="flex gap-2 mb-4">
              {[['all', 'All Players'], ['new', '🆕 New Players'], ['old', '🔄 Returning']].map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => { setAgeFilter(v); setSpinWinner(null) }}
                  className={`btn-bpl text-xs py-1 px-3 ${ageFilter === v ? 'btn-orange' : 'btn-ghost border-0'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Spin Wheel */}
            {(() => {
              const filtered = available.filter(p =>
                (roleFilter === 'All' || p.role === roleFilter) &&
                (ageFilter === 'all' || (ageFilter === 'new' ? !p.prevTeam : !!p.prevTeam))
              )
              const handleSpin = () => {
                if (filtered.length === 0 || spinning) return
                setSpinning(true)
                setSpinWinner(null)
                let count = 0
                const total = 20 + Math.floor(Math.random() * 10)
                const interval = setInterval(() => {
                  const random = filtered[Math.floor(Math.random() * filtered.length)]
                  setSpinWinner(random)
                  count++
                  if (count >= total) {
                    clearInterval(interval)
                    setSpinning(false)
                  }
                }, 80)
              }
              return (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={handleSpin}
                      disabled={spinning || filtered.length === 0}
                      className="btn-bpl btn-orange text-sm py-2 px-5 flex items-center gap-2 relative overflow-hidden"
                    >
                      <span className={spinning ? 'animate-spin inline-block' : ''}>🎡</span>
                      {spinning ? 'Spinning...' : 'Spin & Pick'}
                    </button>
                    <span className="text-white/30 text-xs font-mono">{filtered.length} players in pool</span>
                    {spinWinner && !spinning && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl border border-bpl-gold/30"
                      >
                        <span className="text-bpl-gold font-display text-sm tracking-wider">{spinWinner.name}</span>
                        <button
                          onClick={() => handleStartBid(spinWinner)}
                          className="btn-bpl btn-success text-xs py-1 px-2"
                        >Start ▶</button>
                      </motion.div>
                    )}
                  </div>

                  {/* Flash card while spinning */}
                  <AnimatePresence mode="wait">
                    {spinning && spinWinner && (
                      <motion.div
                        key={spinWinner.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.06 }}
                        className="mb-4 glass rounded-xl p-4 flex items-center gap-4 border border-bpl-gold/30"
                      >
                        {spinWinner.imageUrl
                          ? <img src={spinWinner.imageUrl} className="w-12 h-12 rounded-full object-cover" alt="" />
                          : <span className="text-3xl">{ROLE_EMOJI[spinWinner.role]}</span>
                        }
                        <div>
                          <div className="font-display text-2xl tracking-wider text-bpl-gold">{spinWinner.name}</div>
                          <div className="text-white/40 text-xs">{spinWinner.role} · {formatMoney(spinWinner.basePrice)}</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Player grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filtered.map((player, i) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => handleStartBid(player)}
                        className={`glass glass-hover rounded p-4 cursor-pointer text-center group ${
                          spinWinner?.id === player.id && !spinning ? 'ring-2 ring-bpl-gold/60' : ''
                        }`}
                      >
                        {player.imageUrl
                          ? <img src={player.imageUrl} alt={player.name} className="w-14 h-14 rounded-full object-cover mx-auto mb-2 border border-white/10" />
                          : <div className="text-3xl mb-2">{ROLE_EMOJI[player.role]}</div>
                        }
                        <div className="font-display text-sm tracking-wider mb-1 leading-tight">{player.name}</div>
                        <div className="font-mono text-[0.55rem] tracking-widest text-bpl-orange/60 uppercase mb-1">{player.role}</div>
                        {player.prevTeam && <div className="text-[0.5rem] text-blue-300/50 mb-1">{player.prevTeam}</div>}
                        <div className="font-mono text-xs text-bpl-gold">{formatMoney(player.basePrice)}</div>
                        <div className="mt-3 btn-bpl btn-orange text-xs py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          Start <ChevronRight size={12} />
                        </div>
                      </motion.div>
                    ))}
                    {filtered.length === 0 && (
                      <div className="col-span-full text-center py-16 text-white/20 text-sm">No players in this section</div>
                    )}
                  </div>
                </>
              )
            })()}
          </motion.div>
        )}

        {/* Sold players */}
        {tab === 'sold' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {sold.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-xl px-5 py-4 flex items-center gap-4 flex-wrap"
              >
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" />
                  : <span className="text-2xl">{ROLE_EMOJI[p.role]}</span>
                }
                <div className="flex-1">
                  <div className="font-display text-base tracking-wider">{p.name}</div>
                  <div className="text-white/35 text-xs">{p.role}</div>
                </div>
                <div className="text-right mr-2">
                  <div className="font-mono text-bpl-gold text-sm">{formatMoney(p.soldPrice)}</div>
                  <div className="text-white/35 text-xs">{teams[p.soldTo]?.emoji} {p.soldToName}</div>
                </div>
                <button
                  onClick={() => handleReAuction(p)}
                  disabled={actionLoading}
                  title="Put back in pool"
                  className="btn-bpl btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw size={12} /> Re-Auction
                </button>
              </motion.div>
            ))}
            {sold.length === 0 && <div className="text-center py-16 text-white/20 text-sm">No players sold yet</div>}
          </motion.div>
        )}

        {/* Unsold players */}
        {tab === 'unsold' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {unsold.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-xl px-5 py-4 flex items-center gap-4 flex-wrap"
              >
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" />
                  : <span className="text-2xl">{ROLE_EMOJI[p.role]}</span>
                }
                <div className="flex-1">
                  <div className="font-display text-base tracking-wider">{p.name}</div>
                  <div className="text-white/35 text-xs">{p.role}</div>
                  <div className="font-mono text-xs text-white/25">Base: {formatMoney(p.basePrice)}</div>
                </div>
                <button
                  onClick={() => handleReAuction(p)}
                  disabled={actionLoading}
                  className="btn-bpl btn-orange text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw size={12} /> Re-Auction
                </button>
              </motion.div>
            ))}
            {unsold.length === 0 && <div className="text-center py-16 text-white/20 text-sm">No unsold players</div>}
          </motion.div>
        )}

        {/* Teams overview — F1 table */}
        {tab === 'teams' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Column headers */}
            <div className="grid items-center px-4 py-3 f1-slash" style={{gridTemplateColumns:'48px 1fr auto auto', background:'#15151e', borderBottom:'2px solid rgba(255,255,255,0.12)'}}>
              <span className="text-xs font-bold tracking-[0.15em] text-white/30 uppercase">Pos</span>
              <span className="text-xs font-bold tracking-[0.15em] text-white/30 uppercase">Team</span>
              <span className="text-xs font-bold tracking-[0.15em] text-white/30 uppercase text-right pr-8">Budget Left</span>
              <span className="text-xs font-bold tracking-[0.15em] text-white/30 uppercase text-right">Players</span>
            </div>
            <div style={{border:'1px solid rgba(255,255,255,0.07)', borderTop:'none'}}>
              {Object.values(teams)
                .sort((a, b) => (b.players?.length || 0) - (a.players?.length || 0))
                .map((t, i) => {
                  const rem = t.budget - (t.spent || 0)
                  const pct = Math.max(0, (rem / t.budget) * 100)
                  return (
                    <div
                      key={t.id}
                      className="grid items-center px-4 py-4 transition-colors hover:bg-white/[0.025]"
                      style={{
                        gridTemplateColumns:'48px 1fr auto auto',
                        borderBottom:'1px solid rgba(255,255,255,0.06)',
                        borderLeft:'3px solid transparent',
                      }}
                    >
                      <span className="font-mono text-lg font-bold text-white/25">{i + 1}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{t.emoji}</span>
                        <div>
                          <div className="font-bold text-sm uppercase tracking-wider">{t.name}</div>
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
      </div>
    </div>
  )
}

function StatPill({ label, value }) {
  return (
    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/8 text-xs">
      <span className="text-white/30 font-mono">{label}</span>
      <span className="text-white/70 font-semibold">{value}</span>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-dark">
      <div className="text-center">
        <div className="font-display text-4xl text-gradient tracking-widest animate-pulse mb-4">BPL</div>
        <div className="w-8 h-8 border-2 border-bpl-orange/30 border-t-bpl-orange rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )
}
