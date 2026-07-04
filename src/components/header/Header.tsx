"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import Logo from "../../../public/assets/logo-preto.png"
import LogoIcon from "../../../public/assets/logo-icon-preto.png"
import { SocialMediaIcons } from "./SocialMediaIcons"
import Dropdown from "./FlyOutMenu"

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md py-2" : "bg-primary-gray py-4"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center">
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <div className="hidden sm:block">
              <Image src={Logo || "/placeholder.svg"} alt="Donatti Turismo" className="h-16 w-auto" priority />
            </div>
            <div className="sm:hidden">
              <Image src={LogoIcon || "/placeholder.svg"} alt="Donatti Turismo" className="h-12 w-auto" priority />
            </div>
          </motion.div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex space-x-6">
              <SocialMediaIcons tipoRedeSocial="whatsapp" />
              <SocialMediaIcons tipoRedeSocial="instagram" />
              <SocialMediaIcons tipoRedeSocial="facebook" />
            </div>
            <Dropdown />
          </div>
        </div>
      </div>
    </motion.header>
  )
}

