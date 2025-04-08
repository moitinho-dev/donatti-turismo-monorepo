"use client"
import { useEffect } from "react"
import Image from "next/image"
import { motion, useAnimation } from "framer-motion"
import { useInView } from "react-intersection-observer"
import BgImage from "../../../public/assets/secondcontent-bg.png"
import FotoAgencia1 from "../../../public/assets/agencia1.webp"
import LocIcon from "../../../public/assets/LOC_ICON.svg"

export function FifthSection() {
  const controls = useAnimation()
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
      },
    },
  }

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="font-bsf text-5xl md:text-7xl text-black mb-6">quem somos</h2>
            <p className="text-lg md:text-xl font-mon text-gray-800 leading-relaxed">
              Somos uma agência de turismo localizada em Campo Grande, Mato Grosso do Sul,{" "}
              <span className="font-bold">com profissionais experientes no mercado</span>, que oferecem{" "}
              <span className="font-bold">agilidade</span> para sua viagem, o{" "}
              <span className="font-bold">atendimento que vocês merecem</span> e acima de tudo,{" "}
              <span className="font-bold">confiança</span>. Pacotes de{" "}
              <span className="font-bold">viagens nacionais, internacionais</span>,{" "}
              <span className="font-bold">passagem aérea, hospedagem, seguro viagem, cruzeiro</span>.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <a
                href="https://maps.app.goo.gl/25niN2toSbKu2hi97"
                className="block overflow-hidden rounded-xl shadow-xl"
              >
                <div className="relative overflow-hidden group">
                  <Image
                    src={FotoAgencia1 || "/placeholder.svg"}
                    alt="Agência Lemonde Tourisme"
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-primary-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </a>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-primary-blue">
                <h3 className="text-2xl font-bold font-mon text-primary-blue mb-4">Nossa Unidade</h3>
                <div className="flex items-start space-x-4">
                  <Image
                    src={LocIcon || "/placeholder.svg"}
                    alt="Localização"
                    width={40}
                    height={40}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-mon text-gray-800">
                      Av. Tamandaré, n. 08
                      <br />
                      Jd. Planalto
                      <br />
                      Campo Grande - MS
                    </p>
                    <a
                      href="https://maps.app.goo.gl/25niN2toSbKu2hi97"
                      className="inline-flex items-center mt-3 text-second-blue hover:underline font-mon"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      Ver no mapa
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-primary-yellow">
                <h3 className="text-xl font-bold font-mon text-primary-blue mb-2">Horário de Funcionamento</h3>
                <p className="font-mon text-gray-800">
                  Segunda a Sexta: 9h às 18h
                  <br />
                  Sábado: 9h às 12h
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={BgImage || "/placeholder.svg"}
          alt="Background"
          fill
          className="object-cover opacity-30"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-primary-yellow/10"></div>
      </div>
    </section>
  )
}
