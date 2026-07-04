"use client"
import { motion } from "framer-motion"
import Image from "next/image"
import wpp_icon from "../../../public/assets/whats_icon.png"
import insta_icon from "../../../public/assets/insta_icon.png"
import face_icon from "../../../public/assets/face_icon.png"

export function SocialMediaIcons({ tipoRedeSocial }: { tipoRedeSocial: "whatsapp" | "instagram" | "facebook" }) {
  const socialMediaLinks = {
    whatsapp: "https://wa.me/556796372769",
    instagram: "https://www.instagram.com/donattiturismo",
    facebook: "https://www.facebook.com/donattiturismo",
  }

  return (
    <motion.button
      className="flex"
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <a
        href={socialMediaLinks[tipoRedeSocial]}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visite nosso ${tipoRedeSocial}`}
      >
        <Image
          src={tipoRedeSocial === "whatsapp" ? wpp_icon : tipoRedeSocial === "instagram" ? insta_icon : face_icon}
          alt={`Ícone ${tipoRedeSocial}`}
          width={tipoRedeSocial === "whatsapp" ? 45 : tipoRedeSocial === "instagram" ? 44 : 21}
          height={tipoRedeSocial === "whatsapp" ? 43 : tipoRedeSocial === "instagram" ? 44 : 44}
        />
      </a>
    </motion.button>
  )
}

