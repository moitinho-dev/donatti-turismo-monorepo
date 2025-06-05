"use client"
import { useState } from "react"
import type React from "react"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

export function FifthSection() {
  const [email, setEmail] = useState("")
  const [nome, setNome] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulando envio
    setTimeout(() => {
      setIsSubmitted(true)
      setIsLoading(false)
      setEmail("")
      setNome("")
    }, 1500)
  }

  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Badge className="mb-4">Newsletter</Badge>
          <h2 className="text-3xl font-medium text-gray-900 mb-4">Receba nossas melhores ofertas</h2>
          <p className="text-lg text-gray-600 mb-8">
            Cadastre-se para receber promoções exclusivas, dicas de viagem e novidades sobre destinos incríveis.
          </p>

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-lg shadow-sm border border-gray-100"
            >
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Inscrição realizada com sucesso!</h3>
              <p className="text-gray-600 mb-6">
                Obrigado por se inscrever em nossa newsletter. Em breve você receberá nossas melhores ofertas!
              </p>
              <Button onClick={() => setIsSubmitted(false)}>Voltar</Button>
            </motion.div>
          ) : (
            <motion.form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Seu nome
                  </label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Digite seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Seu e-mail
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center mb-4">
                <input
                  id="termos"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  required
                />
                <label htmlFor="termos" className="ml-2 block text-sm text-gray-600">
                  Concordo em receber e-mails promocionais da Donatti Turismo
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  "Inscrever-se"
                )}
              </Button>
            </motion.form>
          )}
        </motion.div>
      </div>
    </section>
  )
}
