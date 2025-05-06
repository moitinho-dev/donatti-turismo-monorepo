import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header/Header"
import { FooterSection } from "@/components/footer/FooterSection"
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Star } from "lucide-react"

export const metadata: Metadata = {
  title: "Destinos | Donatti Turismo",
  description: "Conheça os melhores destinos nacionais e internacionais com a Donatti Turismo.",
}

export default function DestinosPage() {
  const destinos = [
    {
      nome: "Fernando de Noronha",
      imagem: "https://img.freepik.com/fotos-gratis/foto-aerea-de-uma-linda-pequena-ilha-verde-no-meio-do-oceano_181624-2038.jpg?t=st=1746560782~exp=1746564382~hmac=2a8b15ccb96e0026dc785ec44c35e6e4194d4328531de0668592287079628e8f&w=740",
      descricao: "Paraíso ecológico com praias de águas cristalinas e rica vida marinha.",
      categoria: "Praia",
      avaliacao: 5,
      duracao: "5-7 dias",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20Fernando%20de%20Noronha",
    },
    {
      nome: "Bonito - MS",
      imagem: "https://img.freepik.com/fotos-gratis/ecologia-ambiental-organica-ao-ar-livre-verde_53876-23439.jpg?t=st=1746562491~exp=1746566091~hmac=9e5aa2dddc251756dc3ab3c6246b2b84704340683777d8c9319cfe910f8c0d5a&w=826",
      descricao: "Destino de ecoturismo com rios de águas cristalinas e cavernas impressionantes.",
      categoria: "Ecoturismo",
      avaliacao: 5,
      duracao: "3-5 dias",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20Bonito%20-%20MS",
    },
    {
      nome: "Rio de Janeiro",
      imagem: "https://img.freepik.com/fotos-gratis/bondinho-do-pao-de-acucar-durante-o-por-do-sol_181624-36743.jpg?t=st=1746560834~exp=1746564434~hmac=fd4db0900f406d381355a79d42481233b330fc85956b150ce49a5db416c1f264&w=740",
      descricao: "Cidade maravilhosa com praias, montanhas e cultura vibrante.",
      categoria: "Cidade",
      avaliacao: 5,
      duracao: "4-6 dias",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20o%20Rio%20de%20Janeiro",
    },
    {
      nome: "Curitiba",
      imagem: "/7594.jpg",
      descricao: "Charme europeu e qualidade de vida com parques e atrações culturais.",
      categoria: "Cidade",
      avaliacao: 4.5,
      duracao: "3-5 dias",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20Curitiba",
    },
    {
      nome: "Foz do Iguaçu",
      imagem: "https://img.freepik.com/fotos-gratis/cataratas-do-niagara_649448-3318.jpg?uid=P117971533&ga=GA1.1.1073130592.1745352448&semt=ais_hybrid&w=740",
      descricao: "Cataratas impressionantes e atrações na fronteira com Argentina e Paraguai.",
      categoria: "Ecoturismo",
      avaliacao: 5,
      duracao: "3-4 dias",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20Foz%20do%20Iguaçu",
    },
    {
      nome: "Maceió",
      imagem: "https://img.freepik.com/fotos-gratis/bela-praia-tropical-mar-e-oceano-com-coqueiro-e-guarda-chuva-e-cadeira-no-ceu-azul_74190-8827.jpg?t=st=1746560930~exp=1746564530~hmac=9da296fe0aee8df0ea2978ea9398b0da6c6c9ae187163a010d7424f943ad345a&w=996",
      descricao: "Praias paradisíacas com piscinas naturais e gastronomia rica.",
      categoria: "Praia",
      avaliacao: 4.5,
      duracao: "5-7 dias",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20Maceió",
    },
    {
      nome: "Salvador",
      imagem: "https://img.freepik.com/fotos-gratis/bela-foto-de-uma-praia-com-um-guarda-sol-colorido-e-uma-cadeira-de-praia-com-ondas-incriveis_181624-3143.jpg?t=st=1746560950~exp=1746564550~hmac=04deb927a2c22d8e487cddac299df7685b7cb5e167254b0f73505aef422e1278&w=996",
      descricao: "Rica história e cultura afro-brasileira, com praias e gastronomia típica.",
      categoria: "Cidade/Praia",
      avaliacao: 4.5,
      duracao: "5-7 dias",
      link: "https://wa.me/556796372769?text=Olá,%20gostaria%20de%20um%20orçamento%20para%20Salvador",
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
              src="https://img.freepik.com/fotos-gratis/bondinho-do-pao-de-acucar-durante-o-por-do-sol_181624-36743.jpg?t=st=1746560834~exp=1746564434~hmac=fd4db0900f406d381355a79d42481233b330fc85956b150ce49a5db416c1f264&w=740"
              alt="Destinos Donatti Turismo"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">Destinos Incríveis</h1>
              <p className="text-lg md:text-xl text-white/90 mb-8">
                Descubra os melhores destinos nacionais e internacionais com a Donatti Turismo. Pacotes personalizados
                para sua próxima aventura.
              </p>
            </div>
          </div>
        </section>

        {/* Destinos Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="mb-4">Nossos Destinos</Badge>
              <h2 className="text-3xl font-medium text-gray-900 mb-4">Escolha seu próximo destino</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Conheça os destinos mais procurados pelos nossos clientes e prepare-se para viver experiências
                inesquecíveis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {destinos.map((destino, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-100 group hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={destino.imagem}
                      alt={destino.nome}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="bg-white/90 text-gray-800">
                        {destino.categoria}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-medium text-gray-900">{destino.nome}</h3>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                        <span className="text-sm font-medium">{destino.avaliacao}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{destino.descricao}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <div className="flex items-center mr-4">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        <span>{destino.duracao}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        <span>Brasil</span>
                      </div>
                    </div>
                    <Button asChild className="w-full">
                      <a href={destino.link} target="_blank" rel="noopener noreferrer">
                        Solicitar Orçamento
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-lg text-gray-600 mb-6">
                Não encontrou o destino que procura? Entre em contato conosco e personalizamos uma viagem exclusiva para
                você.
              </p>
              <Button size="lg" asChild>
                <Link href="/contato">Fale Conosco</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <FooterSection />
      <WhatsAppButton />
    </div>
  )
}