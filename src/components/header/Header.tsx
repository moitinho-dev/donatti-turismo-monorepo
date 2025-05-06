"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Logo from "../../../public/assets/logo-preto.png"
import LogoIcon from "../../../public/assets/logo-icon-preto.png"

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="relative z-10">
            <div className="hidden sm:block">
              <Image
                src={Logo || "/placeholder.svg"}
                alt="Donatti Turismo"
                width={160}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>
            <div className="sm:hidden">
              <Image
                src={LogoIcon || "/placeholder.svg"}
                alt="Donatti Turismo"
                width={40}
                height={40}
                className="h-9 w-auto"
                priority
              />
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/destinos" className="text-sm font-medium text-gray-800 hover:text-primary transition-colors">
              Destinos
            </Link>
            
            <Link href="/sobre" className="text-sm font-medium text-gray-800 hover:text-primary transition-colors">
              Sobre
            </Link>
            <Link href="/contato" className="text-sm font-medium text-gray-800 hover:text-primary transition-colors">
              Contato
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/556796372769"
              className="hidden md:flex items-center text-sm font-medium text-gray-800 hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4 mr-2" />
              (67) 9637-2769
            </a>

            <Button className="hidden md:inline-flex rounded-full px-6" size="sm">
              Reservar
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                <div className="flex flex-col h-full">
                  <div className="py-6">
                    <Image
                      src={Logo || "/placeholder.svg"}
                      alt="Donatti Turismo"
                      width={140}
                      height={35}
                      className="h-8 w-auto"
                    />
                  </div>
                  <nav className="flex flex-col gap-5">
                    <Link
                      href="/destinos"
                      className="text-base font-medium text-gray-800 hover:text-primary transition-colors"
                    >
                      Destinos
                    </Link>
                    <Link
                      href="/pacotes"
                      className="text-base font-medium text-gray-800 hover:text-primary transition-colors"
                    >
                      Pacotes
                    </Link>
                   
                    <Link
                      href="/contato"
                      className="text-base font-medium text-gray-800 hover:text-primary transition-colors"
                    >
                      Contato
                    </Link>
                  </nav>
                  <div className="mt-auto pt-6 border-t">
                    <a
                      href="https://wa.me/556796372769"
                      className="flex items-center text-sm font-medium text-gray-800 hover:text-primary transition-colors mb-4"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      (67) 9637-2769
                    </a>
                    <Button className="w-full rounded-full">Reservar Agora</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
