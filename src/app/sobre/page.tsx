import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header/Header"
import { FooterSection } from "@/components/footer/FooterSection"
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Users, Award, Clock, MapPin } from "lucide-react"

export const metadata: Metadata = {
  title: "Sobre Nós | Donatti Turismo",
  description: "Conheça a história e os valores da Donatti Turismo, sua agência de viagens em Campo Grande - MS.",
}

export default function SobrePage() {
  const valores = [
    {
      titulo: "Excelência no Atendimento",
      descricao: "Priorizamos um atendimento personalizado e de qualidade para cada cliente.",
      icone: <Users className="h-6 w-6 text-primary" />,
    },
    {
      titulo: "Compromisso com a Qualidade",
      descricao: "Selecionamos cuidadosamente nossos parceiros para garantir a melhor experiência.",
      icone: <Award className="h-6 w-6 text-primary" />,
    },
    {
      titulo: "Transparência",
      descricao: "Prezamos pela clareza em todas as etapas do planejamento da sua viagem.",
      icone: <CheckCircle2 className="h-6 w-6 text-primary" />,
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
              src="https://img.freepik.com/fotos-gratis/foto-aerea-de-uma-linda-pequena-ilha-verde-no-meio-do-oceano_181624-2038.jpg?t=st=1746560782~exp=1746564382~hmac=2a8b15ccb96e0026dc785ec44c35e6e4194d4328531de0668592287079628e8f&w=740"
              alt="Sobre a Donatti Turismo"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">Sobre a Donatti Turismo</h1>
              <p className="text-lg md:text-xl text-white/90 mb-8">
                Conheça nossa história, valores e o que nos torna a melhor opção para planejar sua próxima viagem.
              </p>
            </div>
          </div>
        </section>

        {/* Nossa História */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4">Nossa História</Badge>
                <h2 className="text-3xl font-medium text-gray-900 mb-6">
                  Transformando sonhos em experiências inesquecíveis
                </h2>
                <p className="text-gray-600 mb-4">
                  A Donatti Turismo nasceu do sonho de proporcionar experiências de viagem únicas e memoráveis para
                  nossos clientes. Fundada em Campo Grande - MS, nossa agência tem se destacado pela excelência no
                  atendimento e pelo compromisso com a satisfação dos nossos clientes.
                </p>
                <p className="text-gray-600 mb-4">
                  Com uma equipe de profissionais experientes e apaixonados por viagens, trabalhamos incansavelmente
                  para oferecer os melhores pacotes, com preços competitivos e um atendimento personalizado que faz toda
                  a diferença.
                </p>
                <p className="text-gray-600">
                  Ao longo dos anos, construímos parcerias sólidas com as principais operadoras de turismo, companhias
                  aéreas e redes hoteleiras, o que nos permite oferecer as melhores condições para nossos clientes.
                </p>
              </div>
              <div className="relative h-[400px] rounded-lg overflow-hidden">
                <Image
                  src="/473401641_1576578736424177_2114758080391035558_n.jpg"
                  alt="Equipe Donatti Turismo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Nossos Valores */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="mb-4">Nossos Valores</Badge>
              <h2 className="text-3xl font-medium text-gray-900 mb-4">O que nos guia</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Nossos valores são a base de tudo o que fazemos. Eles definem quem somos e como trabalhamos para
                proporcionar a melhor experiência aos nossos clientes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {valores.map((valor, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="mb-4">{valor.icone}</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">{valor.titulo}</h3>
                  <p className="text-gray-600">{valor.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nossa Localização */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="mb-4">Nossa Localização</Badge>
              <h2 className="text-3xl font-medium text-gray-900 mb-4">Onde nos encontrar</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Estamos localizados em Campo Grande - MS, prontos para atender você pessoalmente ou remotamente, de
                acordo com sua preferência.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="relative h-[400px] rounded-lg overflow-hidden">
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

              <div className="space-y-6">
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

                <div className="pt-4">
                  <Button size="lg" asChild>
                    <Link href="/contato">Entre em Contato</Link>
                  </Button>
                </div>
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
