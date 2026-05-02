// src/components/SoldCelebration.jsx
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatMoney } from '../hooks/useFirestore'

const COLORS = ['#F5A623', '#FFD700', '#FF6B00', '#fff', '#22c55e', '#3b82f6', '#f472b6']
const PARTICLE_COUNT = 80

function randomBetween(a, b) { return a + Math.random() * (b - a) }

// Canvas-based confetti
function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const particles = useRef([])

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current)
      particles.current = []
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')

    // Burst from both sides + top
    particles.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const side = i < PARTICLE_COUNT / 2 ? 'left' : 'right'
      return {
        x: side === 'left' ? randomBetween(0, 80) : randomBetween(canvas.width - 80, canvas.width),
        y: randomBetween(canvas.height * 0.1, canvas.height * 0.5),
        vx: side === 'left' ? randomBetween(3, 10) : randomBetween(-10, -3),
        vy: randomBetween(-12, -3),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: randomBetween(6, 14),
        rotation: randomBetween(0, 360),
        rotSpeed: randomBetween(-6, 6),
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        gravity: randomBetween(0.25, 0.45),
        alpha: 1,
      }
    })

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      for (const p of particles.current) {
        if (p.alpha <= 0) continue
        alive = true
        p.x += p.vx
        p.y += p.vy
        p.vy += p.gravity
        p.rotation += p.rotSpeed
        if (p.y > canvas.height * 0.7) p.alpha -= 0.02
        else if (p.alpha < 1) p.alpha = Math.min(1, p.alpha + 0.05)

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
      if (alive) rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}

export default function SoldCelebration({ auction, teams }) {
  const show = auction?.status === 'sold'

  return (
    <>
      <ConfettiCanvas active={show} />

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
          >
            {/* Radial glow */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.12) 0%, transparent 70%)'
            }} />

            <motion.div
              initial={{ scale: 0.4, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="text-center px-10"
            >
              <motion.div
                animate={{ scale: [1, 1.06, 1], textShadow: ['0 0 40px rgba(34,197,94,0.5)', '0 0 80px rgba(34,197,94,0.9)', '0 0 40px rgba(34,197,94,0.5)'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="font-display text-[5rem] sm:text-[8rem] tracking-[0.3em] text-green-400 leading-none"
                style={{ WebkitTextStroke: '2px rgba(34,197,94,0.5)' }}
              >
                SOLD!
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-display text-2xl sm:text-4xl tracking-wider mt-2 text-white"
              >
                {auction.soldPlayerName}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-3 flex items-center justify-center gap-3"
              >
                <span className="text-3xl">{teams?.[auction.soldTo]?.emoji}</span>
                <span className="text-xl text-white/70">{auction.soldToName}</span>
                <span className="font-mono text-2xl text-bpl-gold font-black">
                  {formatMoney(auction.soldPrice)}
                </span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
