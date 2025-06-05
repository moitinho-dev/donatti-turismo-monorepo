import type { Metadata } from "next"
import Image from "next/image"
import { Header } from "@/components/header/Header"
import { FooterSection } from "@/components/footer/FooterSection"
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plane, Hotel, Car } from "lucide-react"

export const metadata: Metadata = {
  title: "Pacotes | Donatti Turismo",
  description: "Conheça nossos pacotes de viagem nacionais e internacionais com os melhores preços.",
}

export default function PacotesPage() {
  const pacotes = [
    {
      nome: "Férias em Fernando de Noronha",
      imagem: "/placeholder.svg?key=dtjhc",
      descricao:
        "Pacote completo para Fernando de Noronha com passagens, hospedagem, café da manhã e passeios inclusos.",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20o%20pacote%20de%20Fernando%20de%20Noronha",
      duracao: "7 dias / 6 noites",
      inclui: ["Passagens", "Hospedagem", "Café da manhã", "Passeios"],
      destaque: true,
    },
    {
      nome: "Aventura em Bonito",
      imagem: "/placeholder.svg?key=by3gp",
      descricao: "Pacote para Bonito com hospedagem, café da manhã e os principais passeios da região.",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20o%20pacote%20de%20Bonito",
      duracao: "5 dias / 4 noites",
      inclui: ["Hospedagem", "Café da manhã", "Passeios", "Traslados"],
      destaque: false,
    },
    {
      nome: "Rio de Janeiro Completo",
      imagem: "/placeholder.svg?key=ldbfu",
      descricao:
        "Conheça o Rio de Janeiro com este pacote que inclui passagens, hospedagem e city tour pelos principais pontos turísticos.",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20o%20pacote%20do%20Rio%20de%20Janeiro",
      duracao: "6 dias / 5 noites",
      inclui: ["Passagens", "Hospedagem", "Café da manhã", "City tour"],
      destaque: true,
    },
    {
      nome: "Gramado Romântico",
      imagem: "/placeholder.svg?key=mhudn",
      descricao:
        "Pacote romântico para Gramado com hospedagem em hotel boutique, jantar especial e passeios pela cidade.",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20o%20pacote%20de%20Gramado%20Romântico",
      duracao: "5 dias / 4 noites",
      inclui: ["Passagens", "Hospedagem", "Café da manhã", "Jantar especial"],
      destaque: false,
    },
    {
      nome: "Maceió e Praias",
      imagem: "/placeholder.svg?key=zgohd",
      descricao: "Pacote para Maceió com visitas às principais praias e piscinas naturais da região.",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20o%20pacote%20de%20Maceió",
      duracao: "7 dias / 6 noites",
      inclui: ["Passagens", "Hospedagem", "Café da manhã", "Passeios às praias"],
      destaque: false,
    },
    {
      nome: "Foz do Iguaçu Completo",
      imagem: "/placeholder.svg?key=eszsx",
      descricao: "Pacote para Foz do Iguaçu com visita às Cataratas, Parque das Aves e compras no Paraguai.",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20o%20pacote%20de%20Foz%20do%20Iguaçu",
      duracao: "4 dias / 3 noites",
      inclui: ["Passagens", "Hospedagem", "Café da manhã", "Passeios"],
      destaque: true,
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
              src="/placeholder.svg?query=Família feliz viajando, mala de viagem, aeroporto"
              alt="Pacotes de Viagem"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white mb-6">Pacotes de Viagem</h1>
              <p className="text-lg md:text-xl text-white/90 mb-8">
                Encontre o pacote ideal para suas próximas férias. Temos opções para todos os gostos e bolsos!
              </p>
            </div>
          </div>
        </section>

        {/* Pacotes em Destaque */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <h2 className="text-3xl font-medium text-gray-900 mb-8">Pacotes em Destaque</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pacotes
                .filter((p) => p.destaque)
                .map((pacote, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 group"
                  >
                    <div className="relative h-60 overflow-hidden">
                      <Image
                        src={pacote.imagem || "/placeholder.svg"}
                        alt={pacote.nome}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-primary text-white">Destaque</Badge>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-medium text-gray-900 mb-2">{pacote.nome}</h3>

                      <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {pacote.duracao}
                      </div>

                      <p className="text-gray-600 mb-4">{pacote.descricao}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {pacote.inclui.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {item === "Passagens" && <Plane className="h-3 w-3 mr-1" />}
                            {item === "Hospedagem" && <Hotel className="h-3 w-3 mr-1" />}
                            {item === "Traslados" && <Car className="h-3 w-3 mr-1" />}
                            {!["Passagens", "Hospedagem", "Traslados"].includes(item) && (
                              <div className="h-1 w-1 bg-gray-700 rounded-full mr-1" />
                            )}
                            {item}
                          </div>
                        ))}
                      </div>

                      <Button asChild className="w-full">
                        <a href={pacote.link} target="_blank" rel="noopener noreferrer">
                          Solicitar Orçamento
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Todos os Pacotes */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <h2 className="text-3xl font-medium text-gray-900 mb-8">Todos os Pacotes</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pacotes.map((pacote, index) => (
                <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 group">
                  <div className="relative h-60 overflow-hidden">
                    <Image
                      src={pacote.imagem || "/placeholder.svg"}
                      alt={pacote.nome}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {pacote.destaque && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-primary text-white">Destaque</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-medium text-gray-900 mb-2">{pacote.nome}</h3>

                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {pacote.duracao}
                    </div>

                    <p className="text-gray-600 mb-4">{pacote.descricao}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {pacote.inclui.map((item, i) => (
                        <div key={i} className="flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {item === "Passagens" && <Plane className="h-3 w-3 mr-1" />}
                          {item === "Hospedagem" && <Hotel className="h-3 w-3 mr-1" />}
                          {item === "Traslados" && <Car className="h-3 w-3 mr-1" />}
                          {!["Passagens", "Hospedagem", "Traslados"].includes(item) && (
                            <div className="h-1 w-1 bg-gray-700 rounded-full mr-1" />
                          )}
                          {item}
                        </div>
                      ))}
                    </div>

                    <Button asChild className="w-full">
                      <a href={pacote.link} target="_blank" rel="noopener noreferrer">
                        Solicitar Orçamento
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <FooterSection />
      <WhatsAppButton />
    </div>
  )
}
