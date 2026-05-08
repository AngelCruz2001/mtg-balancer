'use client'
import { useState, useEffect } from 'react'

export function CountUp({ to, duration = 1100 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start: number | null = null
    const raf = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * to))
      if (p < 1) requestAnimationFrame(raf)
    }
    const id = requestAnimationFrame(raf)
    return () => cancelAnimationFrame(id)
  }, [to, duration])
  return <>{val}</>
}
