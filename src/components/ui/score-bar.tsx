'use client'
import { useState, useEffect } from 'react'

export function ScoreBar({ score, animate = false }: { score: number; animate?: boolean }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (animate) {
      setTimeout(() => setWidth(score), 80)
    } else {
      setWidth(score)
    }
  }, [score, animate])

  const color = score >= 75 ? 'oklch(68% 0.19 25)' : score >= 60 ? 'var(--c-green)' : 'var(--c-gold)'
  return (
    <div style={{ height: 5, borderRadius: 99, background: 'var(--c-sub)', overflow: 'hidden', marginTop: 8 }}>
      <div style={{
        height: '100%', borderRadius: 99,
        background: color, width: `${width}%`,
        transition: animate ? 'width 1.1s cubic-bezier(0.16,1,0.3,1)' : 'none',
      }} />
    </div>
  )
}
