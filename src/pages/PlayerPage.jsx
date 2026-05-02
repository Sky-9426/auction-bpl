// src/pages/PlayerPage.jsx — Read-only spectator view
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import SoldCelebration from '../components/SoldCelebration'
import StatsGraph from '../components/StatsGraph'
import { useAuction, usePlayers, useTeams, formatMoney } from '../hooks/useFirestore'

const ROLE_EMOJI = { Batsman: '🏏', Bowler: '⚾', 'All-Rounder': '⚡', 'Wicket Keeper': '🧤' }

function StatBadge({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-white/[0.04] border border-white/8 min-w-[52px]">
      <span className="font-semibold text-base text-white/85">{value}</span>
      <span className="text-[0.55rem] text-white/30 tracking-widest uppercase mt-0.5">{label}</span>
    </div>
  )
}

export default function PlayerPage() {
  const { auction } = useAuction()
  const { players } = usePlayers()
  const { teams } = useTeams()
  const livePlayer = players.find(p => p.id === auction?.currentPlayerId)
  const sold = players.filter(p => p.status === 'sold').length
  const available = players.filter(p => p.status === 'available').length

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-gradient-to-br from-navy-dark via-[#0a1628] to-navy-dark" />
      <div className="fixed inset-0 bg-grid opacity-40" />

      <Navbar />
      <SoldCelebration auction={auction} teams={teams} />

      <div className="relative z-10 pt-16 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="font-display text-4xl tracking-[0.2em] text-gradient">LIVE AUCTION</h1>
          <p className="text-white/30 text-xs tracking-widest mt-1 font-mono">SPECTATOR VIEW · READ-ONLY</p>
          <div className="flex justify-center gap-4 mt-4">
            <div className="glass px-4 py-2 rounded-xl text-center">
              <div className="font-display text-xl text-bpl-orange">{available}</div>
              <div className="text-[0.6rem] text-white/35 tracking-widest">AVAILABLE</div>
            </div>
            <div className="glass px-4 py-2 rounded-xl text-center">
              <div className="font-display text-xl text-green-400">{sold}</div>
              <div className="text-[0.6rem] text-white/35 tracking-widest">SOLD</div>
            </div>
            <div className="glass px-4 py-2 rounded-xl text-center">
              <div className={`font-display text-xl ${auction?.status === 'live' ? 'text-red-400' : 'text-white/40'}`}>
                {auction?.status?.toUpperCase() || 'IDLE'}
              </div>
              <div className="text-[0.6rem] text-white/35 tracking-widest">STATUS</div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* IDLE */}
          {(!auction || auction.status === 'idle') && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-24 glass rounded-2xl"
            >
              <div className="text-5xl mb-4">⏳</div>
              <div className="font-display text-xl tracking-widest text-white/30">WAITING FOR NEXT PLAYER</div>
              <div className="text-white/20 text-sm mt-2">The auctioneer will start a bid shortly</div>
            </motion.div>
          )}

          {/* PAUSED */}
          {auction?.status === 'paused' && (
            <motion.div key="paused" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-24 glass rounded-2xl border border-blue-400/20"
            >
              <div className="text-5xl mb-4">⏸️</div>
              <div className="font-display text-xl tracking-widest text-blue-300">AUCTION PAUSED</div>
            </motion.div>
          )}

          {/* SOLD SUMMARY */}
          {auction?.status === 'sold' && (
            <motion.div key="sold" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center py-16 glass rounded-2xl border-2 border-green-400/30 bg-green-500/5"
            >
              <div className="font-display text-5xl text-green-400 tracking-[0.2em] mb-3">SOLD!</div>
              <div className="text-2xl font-semibold mb-2">{auction.soldPlayerName}</div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">{teams[auction.soldTo]?.emoji}</span>
                <span className="text-lg text-white/70">{auction.soldToName}</span>
                <span className="font-mono text-xl text-bpl-gold font-bold">{formatMoney(auction.soldPrice)}</span>
              </div>
            </motion.div>
          )}

          {/* LIVE */}
          {auction?.status === 'live' && livePlayer && (
            <motion.div key="live" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Player card */}
              <div className="rounded-2xl border-2 border-bpl-orange/35 overflow-hidden mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.07), rgba(13,27,62,0.95))' }}
              >
                <div className="h-1 bg-gradient-to-r from-bpl-orange via-bpl-gold to-bpl-fire animate-pulse" />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="live-badge">LIVE</span>
                    <span className="font-mono text-[0.6rem] tracking-widest text-bpl-orange/50 uppercase">{livePlayer.role}</span>
                  </div>

                  <div className="flex gap-5">
                    {livePlayer.imageUrl && (
                      <img src={livePlayer.imageUrl} alt={livePlayer.name}
                        className="w-24 h-24 rounded-xl object-cover border-2 border-bpl-orange/30 shadow-lg shadow-bpl-orange/15 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <motion.div
                        key={livePlayer.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-display text-4xl tracking-wider leading-tight mb-1"
                        style={{ background: 'linear-gradient(135deg, white 40%, #F5A623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                      >
                        {livePlayer.name}
                      </motion.div>
                      {livePlayer.prevTeam && (
                        <div className="text-xs text-blue-300/60 mb-1">Season {livePlayer.prevSeason || '?'} · {livePlayer.prevTeam}</div>
                      )}
                      {livePlayer.description && (
                        <div className="text-sm text-white/45 mb-3 leading-relaxed">{livePlayer.description}</div>
                      )}
                      {livePlayer.stats && (
                        <div className="flex flex-wrap gap-1.5">
                          {livePlayer.stats.matches != null && <StatBadge label="M" value={livePlayer.stats.matches} />}
                          {livePlayer.role !== 'Bowler' && livePlayer.stats.runs != null && <StatBadge label="Runs" value={livePlayer.stats.runs} />}
                          {livePlayer.role !== 'Bowler' && livePlayer.stats.avg != null && <StatBadge label="Avg" value={livePlayer.stats.avg} />}
                          {livePlayer.role !== 'Bowler' && livePlayer.stats.sr != null && <StatBadge label="SR" value={livePlayer.stats.sr} />}
                          {(livePlayer.role === 'Bowler' || livePlayer.role === 'All-Rounder') && livePlayer.stats.wickets != null && <StatBadge label="Wkts" value={livePlayer.stats.wickets} />}
                          {(livePlayer.role === 'Bowler' || livePlayer.role === 'All-Rounder') && livePlayer.stats.economy != null && <StatBadge label="Econ" value={livePlayer.stats.economy} />}
                          {livePlayer.stats.catches != null && <StatBadge label="Ct" value={livePlayer.stats.catches} />}
                        </div>
                      )}
                    </div>
                  </div>

                  {livePlayer.stats && <StatsGraph player={livePlayer} className="mb-3" />}

                  {/* Current bid */}
                  <div className="mt-5 flex items-end justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-xs text-white/30 font-mono mb-1">CURRENT BID</div>
                      <motion.div
                        key={auction.currentBid}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="font-mono text-5xl font-black text-bpl-gold"
                        style={{ textShadow: '0 0 40px rgba(255,215,0,0.5)' }}
                      >
                        {formatMoney(auction.currentBid)}
                      </motion.div>
                    </div>
                    <div className="text-right">
                      {auction.currentBidder
                        ? <div className="text-sm font-bold text-bpl-orange">
                            {teams[auction.currentBidder]?.emoji} {auction.currentBidderName}
                          </div>
                        : <div className="text-white/25 text-sm">No bids yet</div>
                      }
                      <div className="text-xs text-white/25 font-mono mt-1">
                        Base: {formatMoney(livePlayer.basePrice)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bid activity feed */}
              {auction.bids?.length > 0 && (
                <div className="glass rounded-xl p-4">
                  <div className="text-[0.65rem] tracking-widest text-white/25 uppercase font-mono mb-3">Bid Activity</div>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {[...auction.bids].reverse().map((b, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg ${i === 0 ? 'bg-bpl-orange/10 border border-bpl-orange/20' : 'bg-white/[0.03]'}`}
                      >
                        <span className="text-sm">{teams[b.teamId]?.emoji} <span className="text-white/60">{b.teamName}</span></span>
                        <span className="font-mono text-xs text-bpl-gold">{formatMoney(b.amount)}</span>
                        <span className="text-white/25 text-xs">{b.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Teams budget overview */}
        {Object.keys(teams).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
            <div className="text-[0.65rem] tracking-widest text-white/25 uppercase font-mono mb-3">Teams Overview</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.values(teams).map((t, i) => {
                const rem = t.budget - (t.spent || 0)
                const pct = Math.max(0, (rem / t.budget) * 100)
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="glass rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-xs tracking-wider truncate">{t.name}</div>
                        <div className="text-white/30 text-[0.55rem]">{t.players?.length || 0} players</div>
                      </div>
                    </div>
                    <div className="h-1 bg-white/8 rounded-full overflow-hidden mb-1">
                      <motion.div
                        className="h-full bg-gradient-to-r from-bpl-orange to-bpl-gold rounded-full"
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                      />
                    </div>
                    <div className="font-mono text-[0.6rem] text-bpl-gold">{formatMoney(rem)} left</div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
