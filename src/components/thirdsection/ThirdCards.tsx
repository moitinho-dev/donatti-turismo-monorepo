"use client"
import { motion } from "framer-motion"
import Image from "next/image"
import foto1 from "../../../public/assets/natal.jpeg"
import foto2 from "../../../public/assets/rj.jpeg"
import foto3 from "../../../public/assets/pga.jpeg"

export function ThirdCards() {
  const cardsData = [
    {
      imageSrc: foto1,
      text: "Natal",
      link: "https://wa.me/556796372769?text=Olá%20gostaria%20de%20saber%20mais%20sobre%20pacotes%20para%20Natal!",
    },
    {
      imageSrc: foto2,
      text: "Rio de Janeiro",
      link: "https://wa.me/556796372769?text=Olá%20gostaria%20de%20saber%20mais%20sobre%20pacotes%20para%20o%20Rio%20de%20Janeiro!",
    },
    {
      imageSrc: foto3,
      text: "P. de Galinhas",
      link: "https://wa.me/556796372769?text=Olá%20gostaria%20de%20saber%20mais%20sobre%20pacotes%20para%20Porto%20de%20Galinhas!",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <div className="relative">
      <div className="bg-primary-yellow rounded-t-xl py-3 px-6 mb-6 inline-block">
        <h3 className="text-primary-blue text-xl font-bold font-mon">Mais Procurados</h3>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {cardsData.map((card, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="group relative overflow-hidden rounded-xl shadow-lg"
          >
            <a href={card.link} className="block">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={card.imageSrc || "/placeholder.svg"}
                  alt={`Destino ${card.text}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  width={500}
                  height={300}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h4 className="text-white text-2xl font-bold font-mon">{card.text}</h4>
                  <p className="text-white/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Clique para saber mais
                  </p>
                </div>
              </div>
            </a>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
