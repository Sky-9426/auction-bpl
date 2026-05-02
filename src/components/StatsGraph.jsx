// src/components/StatsGraph.jsx — Animated bar chart for player stats
import { motion } from 'framer-motion'

// Each bar: label, value, max (used for bar width %), color, lowerIsBetter
function Bar({ label, value, max, color = '#F5A623', lowerIsBetter = false, delay = 0 }) {
  if (value == null || value === '') return null
  const numVal = parseFloat(value)
  const pct = Math.min(100, Math.max(4, (numVal / max) * 100))
  // For lower-is-better stats (economy, bowling avg), flip the visual to green when low
  const barColor = lowerIsBetter
    ? numVal <= max * 0.4 ? '#22c55e' : numVal <= max * 0.65 ? '#f97316' : '#ef4444'
    : color

  return (
    <div className="flex items-center gap-3 group">
      {/* Label */}
      <div className="w-16 shrink-0 text-right">
        <span className="text-[0.6rem] text-white/35 tracking-widest uppercase font-mono">{label}</span>
      </div>

      {/* Bar track */}
      <div className="flex-1 h-5 bg-white/[0.04] rounded-full overflow-hidden relative border border-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay, ease: 'easeOut' }}
          className="h-full rounded-full relative overflow-hidden"
          style={{ background: `linear-gradient(90deg, ${barColor}99, ${barColor})` }}
        >
          {/* Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]" />
        </motion.div>
      </div>

      {/* Value */}
      <div className="w-14 shrink-0">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.4 }}
          className="font-mono text-sm font-bold"
          style={{ color: barColor }}
        >
          {typeof value === 'number' ? value : value}
          {lowerIsBetter && <span className="text-[0.55rem] text-white/25 ml-0.5">↓</span>}
        </motion.span>
      </div>
    </div>
  )
}

export default function StatsGraph({ player, className = '' }) {
  if (!player?.stats) return null
  const { stats, role } = player

  const hasBatting = role !== 'Bowler' && (stats.runs != null || stats.avg != null || stats.sr != null)
  const hasBowling = role === 'Bowler' || role === 'All-Rounder'
  const hasFielding = stats.catches != null || stats.stumpings != null

  return (
    <div className={`mt-4 space-y-4 ${className}`}>
      {/* ── BATTING ── */}
      {hasBatting && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4 rounded-full bg-bpl-orange" />
            <span className="text-[0.6rem] tracking-[0.18em] text-white/30 uppercase font-mono">Batting</span>
          </div>
          <div className="space-y-1.5">
            {stats.runs != null  && <Bar label="Runs"  value={stats.runs}  max={500} color="#F5A623" delay={0.05} />}
            {stats.avg != null   && <Bar label="Avg"   value={stats.avg}   max={60}  color="#FFD700" delay={0.10} />}
            {stats.sr != null    && <Bar label="S/R"   value={stats.sr}    max={200} color="#f97316" delay={0.15} />}
            {stats.hs != null    && <Bar label="HS"    value={stats.hs}    max={150} color="#fb923c" delay={0.20} />}
          </div>
        </div>
      )}

      {/* ── BOWLING ── */}
      {hasBowling && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4 rounded-full bg-blue-400" />
            <span className="text-[0.6rem] tracking-[0.18em] text-white/30 uppercase font-mono">Bowling</span>
          </div>
          <div className="space-y-1.5">
            {stats.wickets != null   && <Bar label="Wickets" value={stats.wickets}   max={30}  color="#60a5fa" delay={0.05} />}
            {stats.economy != null   && <Bar label="Economy" value={stats.economy}   max={12}  color="#60a5fa" lowerIsBetter delay={0.10} />}
            {stats.bowlingAvg != null && <Bar label="Bowl Avg" value={stats.bowlingAvg} max={45} color="#60a5fa" lowerIsBetter delay={0.15} />}
          </div>
        </div>
      )}

      {/* ── FIELDING ── */}
      {hasFielding && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4 rounded-full bg-green-400" />
            <span className="text-[0.6rem] tracking-[0.18em] text-white/30 uppercase font-mono">Fielding</span>
          </div>
          <div className="space-y-1.5">
            {stats.catches != null    && <Bar label="Catches"   value={stats.catches}   max={15} color="#4ade80" delay={0.05} />}
            {stats.stumpings != null  && <Bar label="Stumpings" value={stats.stumpings} max={10} color="#4ade80" delay={0.10} />}
          </div>
        </div>
      )}
    </div>
  )
}
