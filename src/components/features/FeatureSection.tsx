"use client"
import { motion } from "framer-motion"
import { MapPin, Calendar, CreditCard, Phone } from "lucide-react"

export function FeatureSection() {
  const features = [
    {
      icon: <MapPin className="h-10 w-10 text-primary" />,
      title: "Destinos Exclusivos",
      description: "Conheça lugares incríveis no Brasil e no mundo com roteiros personalizados.",
    },
    {
      icon: <Calendar className="h-10 w-10 text-primary" />,
      title: "Flexibilidade",
      description: "Escolha as datas que melhor se encaixam na sua agenda e preferências.",
    },
    {
      icon: <CreditCard className="h-10 w-10 text-primary" />,
      title: "Pagamento Facilitado",
      description: "Parcele sua viagem em até 12x e aproveite nossas condições especiais.",
    },
    {
      icon: <Phone className="h-10 w-10 text-primary" />,
      title: "Atendimento Personalizado",
      description: "Consultores especializados para ajudar em cada etapa da sua viagem.",
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
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-medium text-gray-900 mb-4">Por que escolher a Donatti Turismo?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Oferecemos serviços completos para tornar sua viagem inesquecível, com atendimento personalizado e os
            melhores preços.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center"
              variants={itemVariants}
            >
              <div className="flex justify-center mb-4">{feature.icon}</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
