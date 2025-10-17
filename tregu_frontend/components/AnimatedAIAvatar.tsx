'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedAIAvatarProps {
  isTalking?: boolean
  size?: number
  className?: string
}

export default function AnimatedAIAvatar({
  isTalking = false,
  size = 140,
  className = ''
}: AnimatedAIAvatarProps) {
  const [blinkTimer, setBlinkTimer] = useState(0)
  const [mouthAnimation, setMouthAnimation] = useState(0)
  const [particleOffset, setParticleOffset] = useState(0)
  const [hologramIntensity, setHologramIntensity] = useState(0)
  const [energyPulse, setEnergyPulse] = useState(0)
  const animationRef = useRef<number>()

  useEffect(() => {
    const animate = () => {
      setBlinkTimer(prev => prev + 1)
      setParticleOffset(prev => (prev + 0.02) % (Math.PI * 2))
      setHologramIntensity(prev => (prev + 0.01) % (Math.PI * 2))
      setEnergyPulse(prev => (prev + 0.03) % (Math.PI * 2))

      if (isTalking) {
        setMouthAnimation(prev => (prev + 0.15) % (Math.PI * 2))
      } else {
        setMouthAnimation(prev => prev * 0.95) // Gradual decay
      }
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isTalking])

  // Random blink every 3-6 seconds
  const shouldBlink = (blinkTimer % (180 + Math.random() * 240)) < 12

  // Dynamic mouth animation
  const mouthHeight = isTalking ? Math.sin(mouthAnimation) * 4 + 6 : 2
  const mouthWidth = isTalking ? Math.cos(mouthAnimation * 0.7) * 3 + 10 : 6

  // Holographic effects
  const hologramOpacity = (Math.sin(hologramIntensity) + 1) * 0.3 + 0.4
  const energyRadius = 65 + Math.sin(energyPulse) * 5

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Outer energy field */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full border-2 border-cyan-400/30 animate-spin"
          style={{
            width: energyRadius * 2,
            height: energyRadius * 2,
            animationDuration: '8s'
          }}
        />
        <div
          className="absolute rounded-full border border-blue-400/20 animate-spin"
          style={{
            width: (energyRadius - 10) * 2,
            height: (energyRadius - 10) * 2,
            animationDuration: '6s',
            animationDirection: 'reverse'
          }}
        />
      </div>

      {/* Particle effects */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2 + particleOffset
          const radius = 75 + Math.sin(particleOffset * 2 + i) * 10
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius

          return (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                animationDelay: `${i * 0.1}s`,
                opacity: 0.6 + Math.sin(particleOffset + i) * 0.4
              }}
            />
          )
        })}
      </div>

      <svg
        width={size}
        height={size}
        viewBox="0 0 140 140"
        className="relative z-10 drop-shadow-2xl"
      >
        {/* Holographic background */}
        <defs>
          <radialGradient id="hologramBg" cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity={hologramOpacity} />
            <stop offset="50%" stopColor="#1e293b" stopOpacity={hologramOpacity * 0.8} />
            <stop offset="100%" stopColor="#334155" stopOpacity={hologramOpacity * 0.6} />
          </radialGradient>

          <radialGradient id="coreGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#00ffff" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#0088ff" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#0044ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#001122" stopOpacity="0.2" />
          </radialGradient>

          <linearGradient id="visorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#00ffff" stopOpacity="0.9" />
          </linearGradient>

          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="70%" stopColor="#00ffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0088ff" stopOpacity="0.4" />
          </radialGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="neon">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
          </filter>
        </defs>

        {/* Main holographic body */}
        <circle
          cx="70"
          cy="70"
          r="60"
          fill="url(#hologramBg)"
          stroke="url(#coreGlow)"
          strokeWidth="2"
          className="animate-pulse"
          style={{ filter: 'url(#glow)' }}
        />

        {/* Inner core */}
        <circle
          cx="70"
          cy="70"
          r="25"
          fill="url(#coreGlow)"
          className="animate-pulse"
          style={{ animationDuration: '2s' }}
        />

        {/* Visor/helmet */}
        <path
          d="M 45 45 Q 70 35 95 45 L 95 55 Q 70 45 45 55 Z"
          fill="url(#visorGradient)"
          stroke="#00ffff"
          strokeWidth="1"
          opacity="0.8"
          className="animate-pulse"
          style={{ filter: 'url(#neon)' }}
        />

        {/* Eyes */}
        <g className={`transition-all duration-200 ${shouldBlink ? 'animate-pulse' : ''}`}>
          {/* Left Eye */}
          <circle
            cx="58"
            cy="48"
            r={shouldBlink ? 1 : 4}
            fill="url(#eyeGlow)"
            className="animate-pulse"
            style={{
              filter: 'url(#glow)',
              opacity: shouldBlink ? 0.3 : 1
            }}
          />
          {/* Right Eye */}
          <circle
            cx="82"
            cy="48"
            r={shouldBlink ? 1 : 4}
            fill="url(#eyeGlow)"
            className="animate-pulse"
            style={{
              filter: 'url(#glow)',
              animationDelay: '0.1s',
              opacity: shouldBlink ? 0.3 : 1
            }}
          />
        </g>

        {/* Neural network lines */}
        <g stroke="#00ffff" strokeWidth="1" opacity="0.6" className="animate-pulse">
          <path d="M 50 60 Q 70 50 90 60" fill="none" />
          <path d="M 45 75 Q 70 65 95 75" fill="none" />
          <circle cx="50" cy="60" r="1" fill="#00ffff" />
          <circle cx="70" cy="50" r="1" fill="#00ffff" />
          <circle cx="90" cy="60" r="1" fill="#00ffff" />
          <circle cx="45" cy="75" r="1" fill="#00ffff" />
          <circle cx="70" cy="65" r="1" fill="#00ffff" />
          <circle cx="95" cy="75" r="1" fill="#00ffff" />
        </g>

        {/* Mouth/Speech synthesizer */}
        <ellipse
          cx="70"
          cy="80"
          rx={mouthWidth / 2}
          ry={mouthHeight / 2}
          fill="#ff0080"
          stroke="#ff0080"
          strokeWidth="1"
          className="transition-all duration-100"
          style={{
            filter: 'url(#glow)',
            opacity: isTalking ? 1 : 0.5
          }}
        />

        {/* Data streams */}
        {isTalking && (
          <g>
            {[...Array(3)].map((_, i) => (
              <rect
                key={i}
                x={55 + i * 8}
                y="85"
                width="2"
                height={Math.sin(mouthAnimation + i * 0.5) * 8 + 12}
                fill="#00ffff"
                opacity="0.8"
                className="animate-pulse"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  filter: 'url(#glow)'
                }}
              />
            ))}
          </g>
        )}

        {/* Antenna array */}
        <g>
          {[...Array(3)].map((_, i) => {
            const angle = (i / 3) * Math.PI * 2 / 3 - Math.PI / 3
            const antennaX = 70 + Math.cos(angle) * 35
            const antennaY = 70 + Math.sin(angle) * 35

            return (
              <g key={i}>
                <line
                  x1="70"
                  y1="35"
                  x2={antennaX}
                  y2={antennaY}
                  stroke="#00ffff"
                  strokeWidth="1"
                  opacity="0.7"
                  className="animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
                <circle
                  cx={antennaX}
                  cy={antennaY}
                  r="2"
                  fill="#00ffff"
                  className="animate-ping"
                  style={{
                    animationDuration: '2s',
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              </g>
            )
          })}
        </g>

        {/* Status indicators */}
        <g>
          <circle cx="45" cy="95" r="3" fill="#00ff00" className="animate-pulse" />
          <circle cx="70" cy="100" r="3" fill="#ffff00" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
          <circle cx="95" cy="95" r="3" fill="#ff0000" className="animate-pulse" style={{ animationDelay: '1s' }} />
        </g>
      </svg>

      {/* Enhanced speech bubble */}
      {isTalking && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="bg-gradient-to-r from-cyan-500/90 to-blue-500/90 backdrop-blur-sm border-2 border-cyan-400/50 rounded-xl px-4 py-2 shadow-2xl relative">
            <div className="text-sm text-white font-bold tracking-wider animate-pulse">
              PROCESSING...
            </div>
            {/* Enhanced speech bubble pointer */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-cyan-400/50"></div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-4 border-transparent border-t-cyan-500/90 mt-0.5"></div>

            {/* Data particles */}
            <div className="absolute -right-2 -top-2 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
            <div className="absolute -left-2 -bottom-2 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>
      )}

      {/* Ambient glow effect */}
      <div className="absolute inset-0 rounded-full bg-cyan-400/10 animate-pulse blur-xl -z-10"></div>
    </div>
  )
}