"use client"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { FaPlane, FaHotel, FaPassport, FaShip, FaUmbrella, FaCreditCard } from "react-icons/fa"

export function FeatureSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const features = [
    {
      icon: <FaPlane className="h-8 w-8 text-primary-blue" />,
      title: "Passagens Aéreas",
      description: "Encontre as melhores tarifas para seu destino dos sonhos",
    },
    {
      icon: <FaHotel className="h-8 w-8 text-primary-blue" />,
      title: "Hospedagem",
      description: "Hotéis selecionados com conforto e qualidade garantidos",
    },
    {
      icon: <FaPassport className="h-8 w-8 text-primary-blue" />,
      title: "Pacotes Completos",
      description: "Tudo o que você precisa para uma viagem perfeita",
    },
    {
      icon: <FaShip className="h-8 w-8 text-primary-blue" />,
      title: "Cruzeiros",
      description: "Experiências inesquecíveis em alto mar",
    },
    {
      icon: <FaUmbrella className="h-8 w-8 text-primary-blue" />,
      title: "Seguro Viagem",
      description: "Viaje com tranquilidade e segurança garantida",
    },
    {
      icon: <FaCreditCard className="h-8 w-8 text-primary-blue" />,
      title: "Parcelamento",
      description: "Facilidade de pagamento em até 12x sem juros",
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <section className="py-16 px-4 md:px-8 lg:px-16 bg-primary-gray">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-blo text-primary-blue mb-4">Nossos Serviços</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-mon">
            Oferecemos soluções completas para suas viagens, com atendimento personalizado e os melhores preços do
            mercado.
          </p>
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
            >
              <div className="bg-primary-gray p-4 rounded-full mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-primary-blue mb-2 font-mon">{feature.title}</h3>
              <p className="text-gray-600 font-mon">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
