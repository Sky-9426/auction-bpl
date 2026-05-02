// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import AuctioneerPage from './pages/AuctioneerPage'
import TeamPage from './pages/TeamPage'
import PlayerPage from './pages/PlayerPage'
import OverviewPage from './pages/OverviewPage'

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={
          user
            ? <Navigate to={`/${user.role}`} replace />
            : <LoginPage />
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auctioneer"
        element={
          <ProtectedRoute allowedRole="auctioneer">
            <AuctioneerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team"
        element={
          <ProtectedRoute allowedRole="team">
            <TeamPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/player"
        element={
          <ProtectedRoute allowedRole="player">
            <PlayerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/overview"
        element={
          <ProtectedRoute allowedRole="overview">
            <OverviewPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
