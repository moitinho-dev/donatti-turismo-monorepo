"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart2, FileText, ImageIcon, Users, Database, Home, Settings, LogOut, Menu, X } from "lucide-react"
import { signOut } from "next-auth/react"
import Image from "next/image"
import Logo from "../../../public/assets/logo-preto.png"

interface SidebarProps {
  user?: {
    name?: string | null
    email?: string | null
    role?: string | null
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <BarChart2 className="h-5 w-5" />,
      roles: ["admin", "agent"],
    },
    {
      title: "Promoções",
      href: "/admin",
      icon: <FileText className="h-5 w-5" />,
      roles: ["admin", "agent"],
    },
    {
      title: "Gerador de Imagens",
      href: "/admin?tab=imagens",
      icon: <ImageIcon className="h-5 w-5" />,
      roles: ["admin", "agent"],
    },
    {
      title: "Usuários",
      href: "/admin?tab=users",
      icon: <Users className="h-5 w-5" />,
      roles: ["admin"],
    },
    {
      title: "Banco de Dados",
      href: "/admin?tab=data",
      icon: <Database className="h-5 w-5" />,
      roles: ["admin"],
    },
  ]

  const otherNavItems = [
    {
      title: "Site Principal",
      href: "/",
      icon: <Home className="h-5 w-5" />,
      roles: ["admin", "agent"],
    },
    {
      title: "Configurações",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
      roles: ["admin", "agent"],
    },
  ]

  const filteredMainNavItems = mainNavItems.filter(
    (item) => !item.roles || !user?.role || item.roles.includes(user.role),
  )

  const filteredOtherNavItems = otherNavItems.filter(
    (item) => !item.roles || !user?.role || item.roles.includes(user.role),
  )

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md bg-white shadow-md">
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-donatti-blue" />
          ) : (
            <Menu className="h-6 w-6 text-donatti-blue" />
          )}
        </button>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden md:flex flex-col h-screen w-64 bg-white border-r border-gray-200 fixed left-0 top-0 z-40">
        <div className="p-4 border-b">
          <Link href="/admin" className="flex items-center justify-center">
            <Image src={Logo || "/placeholder.svg"} alt="Donatti Turismo" width={150} height={60} />
          </Link>
        </div>

        <div className="p-4 text-sm text-gray-500 font-medium">Navegação</div>

        <nav className="flex-1 overflow-y-auto">
          <ul className="px-2 space-y-1">
            {filteredMainNavItems.map((item, index) => (
              <li key={index}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href ? "bg-donatti-blue text-white" : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 text-sm text-gray-500 font-medium">Links Rápidos</div>

        <nav className="overflow-y-auto mb-auto">
          <ul className="px-2 space-y-1">
            {filteredOtherNavItems.map((item, index) => (
              <li key={index}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href ? "bg-donatti-blue text-white" : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {user && (
          <div className="p-4 border-t mt-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-donatti-blue flex items-center justify-center text-white">
                {user.name?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name || "Usuário"}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        )}
      </div>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50">
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="p-4 border-b">
              <Link href="/admin" className="flex items-center justify-center">
                <Image src={Logo || "/placeholder.svg"} alt="Donatti Turismo" width={150} height={60} />
              </Link>
            </div>

            <div className="p-4 text-sm text-gray-500 font-medium">Navegação</div>

            <nav className="flex-1 overflow-y-auto">
              <ul className="px-2 space-y-1">
                {filteredMainNavItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        pathname === item.href ? "bg-donatti-blue text-white" : "text-gray-700 hover:bg-gray-100",
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.icon}
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="p-4 text-sm text-gray-500 font-medium">Links Rápidos</div>

            <nav className="overflow-y-auto mb-auto">
              <ul className="px-2 space-y-1">
                {filteredOtherNavItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        pathname === item.href ? "bg-donatti-blue text-white" : "text-gray-700 hover:bg-gray-100",
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.icon}
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {user && (
              <div className="p-4 border-t mt-auto">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-donatti-blue flex items-center justify-center text-white">
                    {user.name?.[0] || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name || "Usuário"}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
