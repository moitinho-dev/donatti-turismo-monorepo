'use client'

import { useEffect, useState } from 'react'
import { getTimeLeft } from '@/config/blackFriday'

interface CountdownProps {
  target: Date
  /** "dark" para fundo preto, "light" para fundo claro */
  tone?: 'dark' | 'light'
  size?: 'sm' | 'lg'
}

const pad = (n: number) => String(n).padStart(2, '0')

export function Countdown({ target, tone = 'dark', size = 'lg' }: CountdownProps) {
  // Só calcula no cliente para não divergir do HTML do servidor
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft> | null>(null)

  useEffect(() => {
    const tick = () => setTimeLeft(getTimeLeft(target))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [target])

  const units = [
    { label: 'dias', value: timeLeft?.days },
    { label: 'horas', value: timeLeft?.hours },
    { label: 'min', value: timeLeft?.minutes },
    { label: 'seg', value: timeLeft?.seconds },
  ]

  const box =
    tone === 'dark'
      ? 'bg-white/10 text-white ring-1 ring-white/15'
      : 'bg-gray-900 text-[#FED400]'
  const dims = size === 'lg' ? 'min-w-[64px] px-3 py-2 sm:min-w-[76px]' : 'min-w-[40px] px-1.5 py-0.5'
  const num = size === 'lg' ? 'text-2xl sm:text-4xl' : 'text-sm'
  const label = size === 'lg' ? 'text-[10px] sm:text-xs' : 'text-[9px]'

  return (
    <div className="flex items-center gap-1.5 sm:gap-2" role="timer" aria-live="off">
      {units.map((unit) => (
        <div key={unit.label} className={`flex flex-col items-center rounded-xl ${box} ${dims}`}>
          <span className={`font-extrabold tabular-nums leading-none ${num}`}>
            {unit.value === undefined ? '--' : pad(unit.value)}
          </span>
          <span className={`mt-1 uppercase tracking-wider opacity-70 ${label}`}>{unit.label}</span>
        </div>
      ))}
    </div>
  )
}
