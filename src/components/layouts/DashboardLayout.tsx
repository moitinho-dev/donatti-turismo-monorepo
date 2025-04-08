"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { signOut } from "next-auth/react"
import {
  Home,
  FileText,
  BarChart2,
  Users,
  Settings,
  LogOut,
  Menu,
  ImageIcon,
  Database,
  User,
  ChevronDown,
  Plus,
} from "lucide-react"
import Logo from "../../../public/assets/logo-preto.png"
import LogoIcon from "../../../public/assets/logo-icon-preto.png"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserType {
  id: string
  name?: string | null
  email?: string | null
  role?: string | null
}

interface DashboardLayoutProps {
  user: UserType
  children: React.ReactNode
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [defaultOpen, setDefaultOpen] = useState(true)

  // Check if the screen is mobile on mount and when resized
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setDefaultOpen(window.innerWidth >= 1024)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const handleAddNew = () => {
    if (pathname?.includes("/admin")) {
      router.push("/admin?tab=add-promo")
    } else {
      router.push("/agent?tab=adicionar")
    }
  }

  const isAdmin = user?.role === "admin"
  const isActive = (path: string) => pathname?.startsWith(path)

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex h-screen w-full overflow-hidden bg-gray-50">
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="flex items-center justify-between p-4">
            <Link href="/" className="flex items-center">
              <div className="hidden sm:block">
                <Image
                  src={Logo || "/placeholder.svg"}
                  alt="Donatti Turismo"
                  width={150}
                  height={60}
                  className="h-10 w-auto"
                />
              </div>
              <div className="sm:hidden">
                <Image
                  src={LogoIcon || "/placeholder.svg"}
                  alt="Donatti Turismo"
                  width={40}
                  height={40}
                  className="h-8 w-auto"
                />
              </div>
            </Link>
            <SidebarTrigger className="md:hidden" />
          </SidebarHeader>

          <SidebarContent className="px-3 py-2">
            <SidebarGroup>
              <SidebarGroupLabel>Navegação</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/admin")} tooltip="Dashboard">
                        <Link href="/admin">
                          <BarChart2 className="h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/agent") || isActive("/promos")} tooltip="Promoções">
                      <Link href={isAdmin ? "/agent" : "/promos"}>
                        <FileText className="h-4 w-4" />
                        <span>Promoções</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname?.includes("imagens") || pathname?.includes("images")}
                      tooltip="Gerador de Imagens"
                    >
                      <Link href={isAdmin ? "/admin?tab=images" : "/agent?tab=imagens"}>
                        <ImageIcon className="h-4 w-4" />
                        <span>Gerador de Imagens</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname?.includes("users")} tooltip="Usuários">
                        <Link href="/admin?tab=users">
                          <Users className="h-4 w-4" />
                          <span>Usuários</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname?.includes("data")} tooltip="Banco de Dados">
                        <Link href="/admin?tab=data">
                          <Database className="h-4 w-4" />
                          <span>Banco de Dados</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>Links Rápidos</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Site Principal">
                      <Link href="/">
                        <Home className="h-4 w-4" />
                        <span>Site Principal</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Configurações">
                      <Link href="#">
                        <Settings className="h-4 w-4" />
                        <span>Configurações</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary-blue text-white p-2 rounded-full">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "Usuário"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col w-full">
          <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-xl font-semibold text-primary-blue hidden md:block">
                {isAdmin ? "Painel Administrativo" : "Gerenciador de Promoções"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleAddNew}
                className="flex items-center gap-2 bg-primary-blue hover:bg-second-blue text-white"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Promoção</span>
                <span className="sm:hidden">Novo</span>
              </Button>

              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Menu</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 w-full max-w-full">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
