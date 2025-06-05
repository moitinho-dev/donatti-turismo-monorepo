"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, User, LogOut, Home, FileText } from "lucide-react"
import Logo from "../../../public/assets/logo-preto.png"
import LogoIcon from "../../../public/assets/logo-icon-preto.png"

interface UserProps {
  id: string
  name?: string | null
  email?: string | null
  role?: string | null
}

interface AgentHeaderProps {
  user: UserProps
  onSignOut: () => void
}

export function AgentHeader({ user, onSignOut }: AgentHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm py-3 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/agent" className="flex items-center">
          <div className="hidden sm:block">
            <Image src={Logo || "/placeholder.svg"} alt="Donatti Turismo" priority className="h-12 w-auto" />
          </div>
          <div className="sm:hidden">
            <Image src={LogoIcon || "/placeholder.svg"} alt="Donatti Turismo" className="h-10 w-auto" />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/agent"
            className="text-gray-600 hover:text-primary-blue transition-colors font-mon flex items-center"
          >
            <FileText className="h-4 w-4 mr-1" />
            Promoções
          </Link>

          <Link href="/" className="text-gray-600 hover:text-primary-blue transition-colors font-mon flex items-center">
            <Home className="h-4 w-4 mr-1" />
            Site Principal
          </Link>

          <div className="flex items-center">
            <div className="bg-second-blue text-white p-2 rounded-full mr-3">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 font-mon">{user.name || "Agente"}</p>
              <p className="text-xs text-gray-500 font-mon">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors font-mon"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t mt-3 py-4 px-4 shadow-md">
          <div className="flex flex-col space-y-4">
            <Link
              href="/agent"
              className="text-gray-600 hover:text-primary-blue transition-colors font-mon flex items-center p-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Promoções
            </Link>

            <Link
              href="/"
              className="text-gray-600 hover:text-primary-blue transition-colors font-mon flex items-center p-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="h-4 w-4 mr-2" />
              Site Principal
            </Link>

            <div className="flex items-center p-2 border-t border-gray-100 pt-4">
              <div className="bg-second-blue text-white p-2 rounded-full mr-3">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 font-mon">{user.name || "Agente"}</p>
                <p className="text-xs text-gray-500 font-mon">{user.email}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsMenuOpen(false)
                onSignOut()
              }}
              className="flex items-center gap-2 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors font-mon border-t border-gray-100 pt-4"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
