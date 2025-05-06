"use client"
import { useState } from "react"
import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [nome, setNome] = useState("")
  const [interesse, setInteresse] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const mensagem = `Olá, meu nome é ${nome}. Tenho interesse em: ${interesse}`
    const mensagemCodificada = encodeURIComponent(mensagem)
    window.open(`https://wa.me/556796372769?text=${mensagemCodificada}`, "_blank")
    setIsOpen(false)
    setNome("")
    setInteresse("")
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="bg-white rounded-lg shadow-lg p-4 mb-4 w-[300px]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-800">Fale Conosco</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="nome" className="text-sm font-medium text-gray-700 mb-1 block">
                      Seu nome
                    </label>
                    <Input
                      id="nome"
                      placeholder="Digite seu nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="interesse" className="text-sm font-medium text-gray-700 mb-1 block">
                      Seu interesse
                    </label>
                    <Textarea
                      id="interesse"
                      placeholder="Em que podemos ajudar?"
                      value={interesse}
                      onChange={(e) => setInteresse(e.target.value)}
                      required
                      className="min-h-[80px]"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Iniciar Conversa
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          className="bg-[#25D366] h-14 w-14 rounded-full flex items-center justify-center shadow-lg hover:bg-[#20BA5C] transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-7 w-7 fill-white">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
          </svg>
        </motion.button>
      </div>
    </>
  )
}
