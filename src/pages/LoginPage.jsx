// src/pages/LoginPage.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ChevronRight } from 'lucide-react'
import { useBranding, useTeams } from '../hooks/useFirestore'

const TEAMS = [
  { id: 'diode_dragons',    name: 'Diode Dragons',    emoji: '🐉' },
  { id: 'electrode_eagles', name: 'Electrode Eagles', emoji: '🦅' },
  { id: 'kirchoff_riders',  name: 'Kirchoff Riders',  emoji: '⚔️' },
  { id: 'mux_mavericks',    name: 'Mux Mavericks',    emoji: '🐎' },
  { id: 'quantum_blasters', name: 'Quantum Blasters', emoji: '⚡' },
  { id: 'voltage_vikings',  name: 'Voltage Vikings',  emoji: '🪖' },
]

const ROLES = [
  {
    id: 'admin',
    title: 'Super Admin',
    icon: '👑',
    desc: 'Full control — manage players, teams, budgets & monitor everything',
    gradient: 'from-yellow-500/10 to-amber-600/5',
    border: 'hover:border-yellow-500/50',
    tag: 'All Access',
    tagColor: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',
  },
  {
    id: 'auctioneer',
    title: 'Auctioneer',
    icon: '🎙️',
    desc: 'Run the live auction — start bids, set prices, declare winners',
    gradient: 'from-orange-500/10 to-red-600/5',
    border: 'hover:border-orange-500/50',
    tag: 'Live Control',
    tagColor: 'text-orange-400 bg-orange-400/10 border-orange-400/25',
  },
  {
    id: 'team',
    title: 'Team Login',
    icon: '🏏',
    desc: 'Join the auction, place real-time bids & build your dream squad',
    gradient: 'from-blue-500/10 to-indigo-600/5',
    border: 'hover:border-blue-500/50',
    tag: '6 Teams',
    tagColor: 'text-blue-400 bg-blue-400/10 border-blue-400/25',
  },
  {
    id: 'player',
    title: 'Spectator View',
    icon: '👁️',
    desc: 'Watch the live auction in real-time — see bids, stats & results',
    gradient: 'from-green-500/10 to-emerald-600/5',
    border: 'hover:border-green-500/50',
    tag: 'Read-Only',
    tagColor: 'text-green-400 bg-green-400/10 border-green-400/25',
  },
  {
    id: 'overview',
    title: 'Overview',
    icon: '📺',
    desc: 'Full auction dashboard — live bids, team standings & player stats. No password needed',
    gradient: 'from-purple-500/10 to-violet-600/5',
    border: 'hover:border-purple-500/50',
    tag: 'Guest Access',
    tagColor: 'text-purple-400 bg-purple-400/10 border-purple-400/25',
  },
]

export default function LoginPage() {
  const [selected, setSelected] = useState(null)
  const [teamId, setTeamId] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const branding = useBranding()
  const { teams } = useTeams()

  const handleLogin = async () => {
    setError('')

    // Overview: no password required
    if (selected === 'overview') {
      if (branding.overviewEnabled === false) {
        setError('Overview is currently disabled by admin')
        return
      }
      setLoading(true)
      const result = login('overview', '')
      if (result.success) {
        toast.success('Watching BPL Auction Live! 📺')
        navigate('/overview')
      } else {
        setError('Overview access unavailable')
        setLoading(false)
      }
      return
    }

    if (selected === 'team' && !teamId) { setError('Please select your team'); return }
    if (!password) { setError('Enter your password'); return }

    setLoading(true)
    const identifier = selected === 'team' ? teamId : selected
    const result = login(identifier, password)

    if (result.success) {
      toast.success('Welcome to BPL Auction! 🏏')
      navigate(`/${selected === 'team' ? 'team' : selected}`)
    } else {
      setError(result.error || 'Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative px-4 py-12">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-navy-dark via-[#0a1628] to-navy-dark" />
      <div className="fixed inset-0 bg-grid opacity-60" />
      <div className="fixed inset-0" style={{
        background: 'radial-gradient(ellipse at 15% 50%, rgba(245,166,35,0.06) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(13,27,62,0.8) 0%, transparent 55%)'
      }} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-12 relative z-10"
      >
        {branding.bplLogoUrl
          ? <img src={branding.bplLogoUrl} alt="BPL" className="h-24 mx-auto mb-2 object-contain drop-shadow-2xl" />
          : <div className="font-display text-[5.5rem] leading-none text-gradient tracking-[0.15em] drop-shadow-2xl">BPL</div>
        }
        <div className="font-mono text-[0.65rem] tracking-[0.5em] text-white/25 mt-1 uppercase">
          Box Premier League
        </div>
        <div className="flex items-center justify-center gap-3 mt-4">
          {branding.eceLogoUrl && (
            <img src={branding.eceLogoUrl} alt="ECE Rogers" className="h-6 object-contain opacity-70" />
          )}
          <div className="inline-block font-mono text-[0.6rem] tracking-[0.3em] text-bpl-orange/70 bg-bpl-orange/8 border border-bpl-orange/20 px-4 py-1.5 rounded-full">
            ECE ROGERS · SEASON 4 · AUCTION
          </div>
        </div>
      </motion.div>

      {/* Role Cards */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-3xl mb-8 relative z-10"
      >
        {ROLES.map((role, i) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            onClick={() => { setSelected(role.id); setError(''); setPassword('') }}
            className={`
              relative text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer shine
              bg-gradient-to-br ${role.gradient}
              ${selected === role.id
                ? 'border-bpl-orange/60 shadow-lg shadow-bpl-orange/15 scale-[1.02]'
                : `border-white/8 ${role.border}`
              }
            `}
          >
            <div className="text-3xl mb-3">{role.icon}</div>
            <div className="font-display text-lg tracking-wider mb-1">{role.title}</div>
            <div className="text-white/45 text-sm leading-relaxed mb-4">{role.desc}</div>
            <div className={`inline-block font-mono text-[0.6rem] tracking-widest px-2.5 py-1 rounded-full border ${role.tagColor}`}>
              {role.tag}
            </div>
            {selected === role.id && (
              <motion.div
                layoutId="selectedIndicator"
                className="absolute top-3 right-3 w-2.5 h-2.5 bg-bpl-orange rounded-full"
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Login Form */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-sm relative z-10"
          >
            {/* Overview: no password form — direct entry */}
            {selected === 'overview' ? (
              <div className="glass rounded-2xl p-6 shadow-2xl text-center">
                <div className="text-4xl mb-3">📺</div>
                <div className="font-display text-xl tracking-[0.2em] text-gradient mb-1">OVERVIEW</div>
                <div className="text-white/35 text-xs tracking-widest mb-2 font-mono uppercase">Full Auction Dashboard</div>
                <div className="text-white/20 text-xs mb-6">See live bids, team standings and player stats — no password required</div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogin}
                  disabled={loading}
                  className="btn-bpl btn-orange w-full flex items-center justify-center gap-2 text-base"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
                      Entering...
                    </span>
                  ) : (
                    <>
                      Watch Live
                      <ChevronRight size={16} />
                    </>
                  )}
                </motion.button>
              </div>
            ) : (
            <div className="glass rounded-2xl p-6 shadow-2xl">
              <div className="font-display text-xl tracking-[0.2em] text-gradient mb-1">
                {ROLES.find(r => r.id === selected)?.title}
              </div>
              <div className="text-white/35 text-xs tracking-widest mb-5 font-mono uppercase">
                Enter credentials
              </div>

              {/* Team selector */}
              {selected === 'team' && (
                <div className="mb-4">
                  <label className="block text-[0.7rem] text-white/40 tracking-widest uppercase mb-2">
                    Select Team
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEAMS.map(t => {
                      const td = teams[t.id]
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTeamId(t.id)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-200
                            ${teamId === t.id
                              ? 'border-bpl-orange/60 bg-bpl-orange/10 shadow shadow-bpl-orange/10'
                              : 'border-white/8 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]'
                            }`}
                        >
                          {td?.logoUrl
                            ? <img src={td.logoUrl} alt={t.name} className="w-8 h-8 object-contain rounded-md shrink-0" />
                            : <span className="text-xl w-8 text-center shrink-0">{t.emoji}</span>
                          }
                          <span className="text-[0.7rem] text-white/70 font-mono leading-tight">{t.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="mb-4">
                <label className="block text-[0.7rem] text-white/40 tracking-widest uppercase mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="Enter password..."
                    className="bpl-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-xs mb-4 flex items-center gap-1.5"
                >
                  <span>⚠</span> {error}
                </motion.div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleLogin}
                disabled={loading}
                className="btn-bpl btn-orange w-full flex items-center justify-center gap-2 text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
                    Entering...
                  </span>
                ) : (
                  <>
                    Enter Auction
                    <ChevronRight size={16} />
                  </>
                )}
              </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-10 text-center text-white/20 text-xs tracking-widest font-mono relative z-10"
      >
        POWERED BY ECE ROGERS · BPL S4
      </motion.div>
    </div>
  )
}
