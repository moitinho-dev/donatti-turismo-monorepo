"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ThirdCards } from "./ThirdCards"
import ThirdBgPhoto from "../../../public/assets/thirdbg.jpg"
import Third from "../contents/ThirdContent"
import { ThirdInfoDisplay } from "./ThirdInfoDisplay"
import { ThirdSearchCard } from "./ThirdSearchCard"

export function ThirdSection() {
  const content = Third[0]
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById("third-section")
      if (section) {
        const rect = section.getBoundingClientRect()
        setIsVisible(rect.top < window.innerHeight * 0.75)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Check on initial load
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section id="third-section" className="relative py-20 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
            transition={{ duration: 0.8 }}
            className="text-white"
          >
            <h2 className="font-blo text-5xl md:text-6xl mb-4">{content.thirdtexto1}</h2>
            <p className="font-mon font-bold text-xl md:text-2xl mb-8">{content.thirdtexto2}</p>
            <ThirdInfoDisplay />
            <ThirdSearchCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <ThirdCards />
          </motion.div>
        </div>
      </div>

      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={ThirdBgPhoto || "/placeholder.svg"}
          alt="Fundo de viagens"
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />
        <div className="absolute inset-0 bg-primary-blue/30 backdrop-filter backdrop-blur-[2px]"></div>
      </div>
    </section>
  )
}
