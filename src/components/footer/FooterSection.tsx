"use client"
import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import BgImage from "../../../public/assets/secondcontent-bg.png"
import { FooterEmailBox } from "./FooterEmailBox"
import { Terms } from "../modals/Terms"
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaWhatsapp } from "react-icons/fa"

export function FooterSection() {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)

  const openTermsModal = () => {
    setIsTermsModalOpen(true)
  }

  const closeTermsModal = () => {
    setIsTermsModalOpen(false)
  }

  return (
    <section className="relative overflow-hidden">
      <Terms isOpen={isTermsModalOpen} onClose={closeTermsModal} />

      <div className="relative z-10 bg-primary-blue pt-16 pb-8">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <h3 className="text-2xl font-bold font-mon text-white mb-6">DONATTI TURISMO</h3>
                <div className="space-y-4 text-white/90 font-mon">
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="mt-1 mr-3 text-primary-yellow" />
                    <div>
                      <p>Avenida Tamandaré, 8, Vila Planalto</p>
                      <p>Campo Grande, MS - CEP: 79.009-790</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaPhone className="mr-3 text-primary-yellow" />
                    <p>(67) 9637-2769</p>
                  </div>
                  <div className="flex items-center">
                    <FaWhatsapp className="mr-3 text-primary-yellow" />
                    <a href="https://wa.me/556796372769" className="hover:underline">
                      (67) 9637-2769
                    </a>
                  </div>
                  <div className="flex items-center">
                    <FaEnvelope className="mr-3 text-primary-yellow" />
                    <p>contato@donattiturismo.com.br</p>
                  </div>
                </div>

                <div className="mt-8">
                  <iframe
                    className="w-full h-[250px] rounded-xl border-2 border-white/10"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3738.1132929822643!2d-54.63646658944231!3d-20.460539454969034!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9486e71ddefc0ac3%3A0xa552f4c0c93e9999!2sLe%20Monde%20Turismo!5e0!3m2!1spt-BR!2sbr!4v1698785317968!5m2!1spt-BR!2sbr"
                    loading="lazy"
                    title="Localização da Donatti Turismo"
                  ></iframe>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h3 className="text-2xl font-bold uppercase font-mon text-white mb-6">
                  RECEBA AS PROMOÇÕES NO SEU E-MAIL
                </h3>
                <FooterEmailBox />

                <div className="mt-8 text-right">
                  <p className="text-white font-mon">
                    2026 - DONATTI TURISMO®
                    <br />
                    TODOS OS DIREITOS RESERVADOS
                  </p>
                  <p
                    className="cursor-pointer text-xs text-primary-yellow mt-2 hover:underline font-mon"
                    onClick={openTermsModal}
                  >
                    Termos de uso e Política de privacidade
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Background image with overlay */}
      <Image
        className="absolute inset-0 object-cover mix-blend-overlay opacity-10 z-0"
        src={BgImage || "/placeholder.svg"}
        alt="Background"
        fill
        sizes="100vw"
      />
    </section>
  )
}

