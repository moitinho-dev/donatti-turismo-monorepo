"use client"
import { motion } from "framer-motion"
import Image from "next/image"
import AviaoIcon from "../../../public/assets/AVIAO_ICON.svg"
import OnibusIcon from "../../../public/assets/ONIBUS_ICON.svg"
import CafeIcon from "../../../public/assets/CAFE_ICON.svg"
import CamaIcon from "../../../public/assets/CAMA_ICON.svg"

export function ThirdInfoDisplay() {
  const features = [
    {
      icon: AviaoIcon,
      text: "Voos de ida e volta",
    },
    {
      icon: OnibusIcon,
      text: "Transfer de chegada e saída",
    },
    {
      icon: CafeIcon,
      text: "Café da manhã",
    },
    {
      icon: CamaIcon,
      text: "Hotéis selecionados",
    },
  ]

  return (
    <div className="my-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="flex flex-col items-center text-center"
          >
            <div className="bg-white/10 p-3 rounded-full mb-3">
              <Image
                src={feature.icon || "/placeholder.svg"}
                alt={feature.text}
                width={40}
                height={40}
                className="w-8 h-8"
              />
            </div>
            <p className="text-white text-sm font-mon">{feature.text}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
