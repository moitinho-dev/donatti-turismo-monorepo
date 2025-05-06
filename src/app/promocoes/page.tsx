import { Input } from "@/components/ui/input"
import type { Metadata } from "next"
import Image from "next/image"
import { Header } from "@/components/header/Header"
import { FooterSection } from "@/components/footer/FooterSection"
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Tag } from "lucide-react"

export const metadata: Metadata = {
  title: "Promoções | Donatti Turismo",
  description:
    "Aproveite as melhores promoções de viagens com a Donatti Turismo. Pacotes nacionais e internacionais com preços imperdíveis!",
}

export default function PromocoesPage() {
  const promocoes = [
    {
      titulo: "Férias de Verão em Fernando de Noronha",
      imagem: "/placeholder.svg?key=r9xbq",
      descricao:
        "Pacote completo para Fernando de Noronha com passagens, hospedagem, café da manhã e passeios inclusos.",
      validade: "Válido até 30/12/2023",
      duracao: "7 dias / 6 noites",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20a%20promoção%20de%20Fernando%20de%20Noronha",
      destaque: true,
    },
    {
      titulo: "Feriado em Bonito - MS",
      imagem: "/placeholder.svg?key=2wrau",
      descricao:
        "Aproveite o feriado em Bonito com este pacote que inclui hospedagem, café da manhã e os principais passeios.",
      validade: "Válido para o feriado de 15/11/2023",
      duracao: "4 dias / 3 noites",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20a%20promoção%20de%20Bonito%20no%20feriado",
      destaque: true,
    },
    {
      titulo: "Réveillon no Rio de Janeiro",
      imagem: "/placeholder.svg?query=Rio de Janeiro, fogos de artifício, Copacabana, réveillon",
      descricao:
        "Passe o réveillon na cidade maravilhosa com este pacote especial que inclui festa na praia de Copacabana.",
      validade: "Válido para 28/12/2023 a 02/01/2024",
      duracao: "6 dias / 5 noites",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20a%20promoção%20de%20Réveillon%20no%20Rio",
      destaque: true,
    },
    {
      titulo: "Natal em Gramado",
      imagem: "/placeholder.svg?query=Gramado, decoração de natal, luzes",
      descricao: "Viva a magia do Natal em Gramado com este pacote especial que inclui visita ao Natal Luz.",
      validade: "Válido para 20/12/2023 a 26/12/2023",
      duracao: "7 dias / 6 noites",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20a%20promoção%20de%20Natal%20em%20Gramado",
      destaque: false,
    },
    {
      titulo: "Férias em Maceió",
      imagem: "/placeholder.svg?key=ysb5h",
      descricao:
        "Aproveite as férias em Maceió com este pacote que inclui visitas às principais praias e piscinas naturais.",
      validade: "Válido até 31/01/2024",
      duracao: "8 dias / 7 noites",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20a%20promoção%20de%20Maceió",
      destaque: false,
    },
    {
      titulo: "Foz do Iguaçu em Família",
      imagem: "/placeholder.svg?key=siosw",
      descricao: "Pacote familiar para Foz do Iguaçu com visita às Cataratas, Parque das Aves e compras no Paraguai.",
      validade: "Válido até 15/12/2023",
      duracao: "5 dias / 4 noites",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20a%20promoção%20de%20Foz%20do%20Iguaçu%20em%20Família",
      destaque: false,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src="/placeholder.svg?query=Promoção de viagem, etiqueta de desconto, mala de viagem"
              alt="Promoções de Viagem"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white mb-6">Promoções Imperdíveis</h1>
              <p className="text-lg md:text-xl text-white/90 mb-8">
                Aproveite nossas ofertas especiais e realize a viagem dos seus sonhos pagando menos!
              </p>
            </div>
          </div>
        </section>

        {/* Promoções em Destaque */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <h2 className="text-3xl font-medium text-gray-900 mb-8">Promoções em Destaque</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {promocoes
                .filter((p) => p.destaque)
                .map((promocao, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 group"
                  >
                    <div className="relative h-60 overflow-hidden">
                      <Image
                        src={promocao.imagem || "/placeholder.svg"}
                        alt={promocao.titulo}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-primary text-white">Oferta Especial</Badge>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-medium text-gray-900 mb-2">{promocao.titulo}</h3>

                      <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {promocao.duracao}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {promocao.validade}
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4">{promocao.descricao}</p>

                      <Button asChild className="w-full">
                        <a href={promocao.link} target="_blank" rel="noopener noreferrer">
                          Solicitar Orçamento
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Todas as Promoções */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <h2 className="text-3xl font-medium text-gray-900 mb-8">Todas as Promoções</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {promocoes.map((promocao, index) => (
                <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 group">
                  <div className="relative h-60 overflow-hidden">
                    <Image
                      src={promocao.imagem || "/placeholder.svg"}
                      alt={promocao.titulo}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {promocao.destaque && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-primary text-white">Oferta Especial</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-medium text-gray-900 mb-2">{promocao.titulo}</h3>

                    <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {promocao.duracao}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {promocao.validade}
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{promocao.descricao}</p>

                    <Button asChild className="w-full">
                      <a href={promocao.link} target="_blank" rel="noopener noreferrer">
                        Solicitar Orçamento
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4">Não perca nenhuma promoção</Badge>
              <h2 className="text-3xl font-medium text-gray-900 mb-4">Inscreva-se em nossa newsletter</h2>
              <p className="text-lg text-gray-600 mb-8">
                Receba nossas promoções exclusivas diretamente no seu e-mail e seja o primeiro a saber sobre nossas
                ofertas especiais.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input placeholder="Seu melhor e-mail" className="sm:flex-1" />
                <Button>
                  <Tag className="h-4 w-4 mr-2" />
                  Quero receber promoções
                </Button>
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
