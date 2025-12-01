"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { CallOutButton } from "./CallOutButton"
import HeroContent from "../contents/HeroContent"

export function HeroSection() {
  const content = HeroContent[0]
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-gray to-white py-12 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <motion.div
            className="lg:col-span-5 z-10"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="font-bsf text-2xl md:text-3xl text-primary-blue mb-2">{content.herotexto1}</h2>
            <h1 className="font-blo text-5xl md:text-7xl text-primary-blue mb-6 whitespace-pre-line">{content.herotexto2}</h1>
            <p className="font-mon text-lg md:text-xl font-bold text-gray-800 mb-3">{content.herotexto3}</p>
            <p className="font-mon text-base md:text-lg text-gray-700 mb-8">{content.herotexto4}</p>
            <CallOutButton text="Fale com uma agente" />
          </motion.div>

          <motion.div
            className="lg:col-span-7 z-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={content.herobanner || "/placeholder.svg"}
                width={content.width}
                height={content.height}
                alt="Pacotes de viagem nacionais e internacionais com a Donatti Turismo"
                className="w-full h-auto object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <p className="font-mon text-xl text-primary-blue max-w-3xl mx-auto">{content.herotexto5}</p>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-primary-yellow opacity-20 blur-3xl"></div>
      <div className="absolute top-32 -right-16 w-48 h-48 rounded-full bg-second-blue opacity-10 blur-3xl"></div>
    </section>
  )
}

