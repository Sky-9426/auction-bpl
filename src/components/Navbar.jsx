// src/components/Navbar.jsx
import { LogOut, Wifi } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useBranding } from '../hooks/useFirestore'

export default function Navbar({ rightContent }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const branding = useBranding()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const roleColors = {
    admin: 'text-yellow-300 bg-yellow-400/10 border-yellow-400/30',
    auctioneer: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    team: 'text-blue-300 bg-blue-400/10 border-blue-400/30',
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-5"
      style={{
        background: '#001440',
        borderBottom: '3px solid #F5A623',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        {branding.bplLogoUrl
          ? <img src={branding.bplLogoUrl} alt="BPL" className="h-8 w-auto object-contain" />
          : <span className="font-display text-2xl tracking-[0.2em] text-gradient">BPL</span>
        }
        <span className="hidden sm:block font-mono text-[0.5rem] tracking-[0.3em] text-white/30 uppercase">Box Premier League</span>
      </div>

      {/* Center content (optional) */}
      <div className="flex-1 flex justify-center px-4">
        {rightContent}
      </div>

      {/* Right: role + logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Wifi size={10} className="text-green-400" />
          <span className="text-[0.6rem] text-green-400 font-mono tracking-widest hidden sm:block">LIVE</span>
        </div>

        <div className={`font-mono text-[0.6rem] tracking-[0.2em] px-3 py-1.5 rounded-full border ${roleColors[user?.role]}`}>
          {user?.role === 'team' ? user?.team?.emoji + ' ' + user?.label : user?.label || user?.role?.toUpperCase()}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors p-2 rounded-lg hover:bg-white/5"
        >
          <LogOut size={15} />
          <span className="text-xs hidden sm:block">Logout</span>
        </button>
      </div>
    </nav>
  )
}
