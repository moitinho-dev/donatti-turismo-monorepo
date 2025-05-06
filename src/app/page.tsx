import type { Metadata } from "next"
import { FifthSection } from "@/components/fifthsection/FifthSection"
import { FooterSection } from "@/components/footer/FooterSection"
import { FourthSection } from "@/components/fourthsection/FourthSection"
import { Header } from "@/components/header/Header"
import { HeroSection } from "@/components/hero/HeroSection"
import ThirdSection from "@/components/thirdsection/ThirdSection"
import { FeatureSection } from "@/components/features/FeatureSection"
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton"

// Enhanced SEO metadata
export const metadata: Metadata = {
  title: "Donatti Turismo | Pacotes de Viagens e Passagens Aéreas",
  description:
    "Viaje mais pagando menos com a Donatti Turismo. Pacotes nacionais e internacionais, passagens aéreas, hospedagem e muito mais!",
  keywords: ["viagens", "pacotes", "turismo", "passagens aéreas", "hospedagem", "Campo Grande", "Mato Grosso do Sul"],
  openGraph: {
    title: "Donatti Turismo | Pacotes de Viagens com Descontos!",
    description:
      "Encontre os melhores pacotes de viagens nacionais e internacionais com a Donatti Turismo. Viaje mais pagando menos!",
    images: ["https://lh3.googleusercontent.com/p/AF1QipOYOS8Q6O9EgC0vPlRwwAWbAnAWUkc4Hq7Yuboo=s1360-w1360-h1020"],
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Donatti Turismo | Pacotes de Viagens com Descontos!",
    description:
      "Encontre os melhores pacotes de viagens nacionais e internacionais com a Donatti Turismo. Viaje mais pagando menos!",
    images: ["https://lh3.googleusercontent.com/p/AF1QipOYOS8Q6O9EgC0vPlRwwAWbAnAWUkc4Hq7Yuboo=s1360-w1360-h1020"],
  },
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 pt-16">
        <HeroSection />
        <FeatureSection />
        <ThirdSection />
        <FourthSection />
        <FifthSection />
      </main>
      <FooterSection />
      <WhatsAppButton />
    </div>
  )
}
