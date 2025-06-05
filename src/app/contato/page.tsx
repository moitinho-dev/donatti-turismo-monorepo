"use client"
import { useState } from "react"
import type React from "react"

import Image from "next/image"
import { Header } from "@/components/header/Header"
import { FooterSection } from "@/components/footer/FooterSection"
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Mail, Clock, Send, Check } from "lucide-react"

export default function ContatoPage() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulando envio
    setTimeout(() => {
      const mensagemWhatsApp = `Olá, meu nome é ${nome}. ${mensagem} Meu telefone é ${telefone} e meu email é ${email}.`
      const mensagemCodificada = encodeURIComponent(mensagemWhatsApp)
      window.open(`https://wa.me/556796372769?text=${mensagemCodificada}`, "_blank")

      setIsSubmitted(true)
      setIsLoading(false)
      setNome("")
      setEmail("")
      setTelefone("")
      setMensagem("")
    }, 1500)
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src="/placeholder.svg?query=Atendimento ao cliente, agência de viagens"
              alt="Contato Donatti Turismo"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white mb-6">Entre em Contato</h1>
              <p className="text-lg md:text-xl text-white/90 mb-8">
                Estamos prontos para ajudar você a planejar sua próxima viagem. Entre em contato conosco!
              </p>
            </div>
          </div>
        </section>

        {/* Contato Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <Badge className="mb-4">Informações de Contato</Badge>
                <h2 className="text-3xl font-medium text-gray-900 mb-6">Como nos encontrar</h2>

                <div className="space-y-6 mb-8">
                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 text-primary mt-0.5 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Endereço</h3>
                      <p className="text-gray-600">
                        Avenida Tamandaré, 8, Vila Planalto
                        <br />
                        Campo Grande, MS - CEP: 79.009-790
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="h-6 w-6 text-primary mt-0.5 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Telefone</h3>
                      <p className="text-gray-600">
                        <a href="tel:+556796372769" className="hover:text-primary transition-colors">
                          (67) 9637-2769
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Mail className="h-6 w-6 text-primary mt-0.5 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">E-mail</h3>
                      <p className="text-gray-600">
                        <a href="mailto:contato@donattiturismo.com.br" className="hover:text-primary transition-colors">
                          contato@donattiturismo.com.br
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Clock className="h-6 w-6 text-primary mt-0.5 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Horário de Funcionamento</h3>
                      <p className="text-gray-600">
                        Segunda a Sexta: 9h às 18h
                        <br />
                        Sábado: 9h às 13h
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative h-[300px] rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3736.1076962871424!2d-54.61994492394826!3d-20.46427935746761!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9486e8f1b0e0b3c3%3A0x3d7f2ff6cc7d1a8d!2sAv.%20Tamandar%C3%A9%2C%208%20-%20Vila%20Planalto%2C%20Campo%20Grande%20-%20MS%2C%2079009-790!5e0!3m2!1spt-BR!2sbr!4v1683654321012!5m2!1spt-BR!2sbr"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0"
                  ></iframe>
                </div>
              </div>

              <div>
                <Badge className="mb-4">Formulário de Contato</Badge>
                <h2 className="text-3xl font-medium text-gray-900 mb-6">Envie-nos uma mensagem</h2>

                {isSubmitted ? (
                  <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-center mb-4">
                      <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2 text-center">
                      Mensagem enviada com sucesso!
                    </h3>
                    <p className="text-gray-600 mb-6 text-center">
                      Obrigado por entrar em contato conosco. Em breve, um de nossos consultores entrará em contato com
                      você.
                    </p>
                    <Button onClick={() => setIsSubmitted(false)} className="w-full">
                      Enviar nova mensagem
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome completo
                      </label>
                      <Input
                        id="nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Digite seu nome completo"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          E-mail
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
                          Telefone
                        </label>
                        <Input
                          id="telefone"
                          value={telefone}
                          onChange={(e) => setTelefone(e.target.value)}
                          placeholder="(00) 00000-0000"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 mb-1">
                        Mensagem
                      </label>
                      <Textarea
                        id="mensagem"
                        value={mensagem}
                        onChange={(e) => setMensagem(e.target.value)}
                        placeholder="Como podemos ajudar? Conte-nos sobre sua viagem ideal..."
                        className="min-h-[150px]"
                        required
                      />
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
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <FooterSection />
      <WhatsAppButton />
    </div>
  )
}
