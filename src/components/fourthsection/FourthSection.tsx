"use client"
import { motion } from "framer-motion"
import Image from "next/image"
import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function FourthSection() {
  const depoimentos = [
    {
      nome: "Dalila Isabel Falcão",
      destino: "Viagem Nacional",
      texto:
        "Viajo com a Donatti desde 2021, e só tive experiências maravilhosas, preço, atendimento, dúvidas todas esclarecidas. A Tati da todo apoio e suporte, recomendo de olhos fechados!",
      avatar: "https://lh3.googleusercontent.com/a-/ALV-UjUCA_UR4wNN8TlPgtNdFuIzAQIMrFHkFjv3SZW2R9W1MZCW408cFA=w72-h72-p-rp-mo-br100",
      avaliacao: 5,
    },
    {
      nome: "Daniel Neves",
      destino: "Viagem Internacional",
      texto:
        "O atendimento é mega diferenciado, você tem suporte vip! Eles procuram as melhores opções baseado nas espectativas e no bolso do cliente. Super recomendo!",
      avatar: "https://lh3.googleusercontent.com/a-/ALV-UjWNaRQ8H36rOio5EiJD4lfQNcp54PPgOXqD-2FDP8F0W8r2qET-=w72-h72-p-rp-mo-br100",
      avaliacao: 5,
    },
    {
      nome: "Milton César Machado",
      destino: "Viagem em Família",
      texto:
        "Tati e equipe nota 1000! Viajar com segurança e credibilidade é com a equipe da Tati! Muito obrigado! Até o ano que vem!",
      avatar: "https://lh3.googleusercontent.com/a-/ALV-UjUgXXPJMaAS2-2_l6yKoR08iMg2jMtmF0wybzmOg6lmAvllJ389TQ=w72-h72-p-rp-mo-ba3-br100",
      avaliacao: 5,
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
          <Badge className="mb-4">Depoimentos</Badge>
          <h2 className="text-3xl font-medium text-gray-900 mb-4">O que nossos clientes dizem</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A satisfação dos nossos clientes é o nosso maior orgulho. Confira alguns depoimentos de quem já viajou
            conosco.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {depoimentos.map((depoimento, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
              variants={itemVariants}
            >
              <div className="flex items-center mb-4">
                <div className="relative h-12 w-12 rounded-full overflow-hidden mr-4">
                  <Image
                    src={depoimento.avatar || "/placeholder.svg"}
                    alt={depoimento.nome}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{depoimento.nome}</h3>
                  <p className="text-sm text-gray-500">{depoimento.destino}</p>
                </div>
              </div>

              <p className="text-gray-600 mb-4 italic">"{depoimento.texto}"</p>

              <div className="flex">
                {[...Array(depoimento.avaliacao)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
