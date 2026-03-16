"use client"

import { signOut } from "next-auth/react"
import {
  Plus,
  BarChart2,
  List,
  LogOut,
  Bell,
  Users,
  Layers,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import type { UserData, ActivePanel } from "./types"

interface DashboardHeaderProps {
  user: UserData
  activePanel: ActivePanel
  onPanelChange: (panel: ActivePanel) => void
  onNewPromo: () => void
}

const DONATTI_LOGO = "https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/1511914d-33e8-4dbe-aaf4-8a27bd98a45a/1773605008514-bb2f07ed/LOGOTIPO_PNG_COR.png"

export function DashboardHeader({ user, activePanel, onPanelChange, onNewPromo }: DashboardHeaderProps) {
  const tabs = [
    { id: "list" as const, label: "Lista", Icon: List, action: () => onPanelChange("list") },
    { id: "form" as const, label: "Nova Promo", Icon: Plus, action: onNewPromo },
    { id: "stats" as const, label: "Dashboard", Icon: BarChart2, action: () => onPanelChange("stats") },
    { id: "leads" as const, label: "Leads", Icon: Users, href: "/promos/leads" },
    { id: "templates" as const, label: "Templates", Icon: Layers, href: "/promos/templates" },
  ]

  return (
    <header className="bg-white w-full border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-3.5 gap-3 md:gap-0">

        {/* Left: Logo & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(247,158,10,0.4)]">
            <img src={DONATTI_LOGO} alt="Donatti" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="text-gray-900 leading-tight font-black text-[18px] m-0 tracking-tight">
              Donatti <span className="text-amber-500">Studio</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Workspace</p>
          </div>
        </div>

        {/* Center: Navigation Island */}
        <div className="flex-1 flex justify-start md:justify-center w-full md:w-auto overflow-x-auto py-1 md:py-0">
          <div className="bg-gray-50 flex items-center gap-1.5 p-1.5 rounded-[18px] border border-gray-200 shadow-sm">
            {tabs.map((tab) => {
              const isActive = activePanel === tab.id
              const content = (
                <button
                  key={tab.id}
                  onClick={tab.action}
                  className={`relative flex items-center gap-2 font-bold text-[13px] px-4 py-2 rounded-[12px] transition-all duration-300 whitespace-nowrap focus:outline-none ${
                    isActive
                      ? "text-gray-900"
                      : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white rounded-[12px] shadow-sm border border-gray-200/50"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <tab.Icon className={`w-4 h-4 relative z-10 transition-colors ${isActive ? "text-amber-500" : "text-gray-400"}`} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              )

              if (tab.href) {
                return (
                  <Link key={tab.id} href={tab.href} className="contents">
                    {content}
                  </Link>
                )
              }
              return content
            })}
          </div>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
          <button
            title="Notificacoes"
            className="relative bg-gray-50 hover:bg-gray-100 text-gray-700 p-2.5 rounded-[14px] transition-all border border-gray-200 shadow-sm focus:outline-none"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-gray-50" />
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-gray-900 leading-tight font-bold text-[13px] m-0">{user.name || "Usuario"}</p>
              <p className="text-amber-500 leading-tight text-[11px] font-medium m-0 capitalize">{user.role || "agent"}</p>
            </div>

            <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-black text-[15px] flex justify-center items-center rounded-[14px] shadow-md border-2 border-white ring-2 ring-amber-500/20">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/promos/login" })}
              title="Sair"
              className="bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 p-2.5 rounded-[14px] transition-all border border-transparent hover:border-red-200 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  )
}
