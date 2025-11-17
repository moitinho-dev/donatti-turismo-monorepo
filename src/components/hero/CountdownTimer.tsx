'use client'

import { useState, useEffect } from 'react'

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date()
    let timeLeft = {}

    if (difference > 0) {
      timeLeft = {
        dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
        horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((difference / 1000 / 60) % 60),
        segundos: Math.floor((difference / 1000) % 60),
      }
    }

    return timeLeft
  }

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearTimeout(timer)
  })

  const timerComponents: JSX.Element[] = []

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval as keyof typeof timeLeft]) {
      return
    }

    timerComponents.push(
      <div key={interval} className="mx-2 text-center">
        <div className="text-4xl font-bold text-white">
          {timeLeft[interval as keyof typeof timeLeft]}
        </div>
        <div className="text-sm uppercase text-gray-300">{interval}</div>
      </div>
    )
  })

  return (
    <div className="flex justify-center">
      {timerComponents.length ? timerComponents : <span>Oferta Encerrada!</span>}
    </div>
  )
}

export default CountdownTimer
