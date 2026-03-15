"use client"

import { signOut } from "next-auth/react"
import {
  Plus,
  BarChart3,
  FileText,
  LogOut,
  Bell,
  Users,
  Layers,
} from "lucide-react"
import Link from "next/link"
import type { UserData, ActivePanel } from "./types"

interface DashboardHeaderProps {
  user: UserData
  activePanel: ActivePanel
  onPanelChange: (panel: ActivePanel) => void
  onNewPromo: () => void
}

export function DashboardHeader({ user, activePanel, onPanelChange, onNewPromo }: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">Promocoes</h1>
          <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onPanelChange("list")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activePanel === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="h-4 w-4 inline mr-1.5" />
              Lista
            </button>
            <button
              onClick={onNewPromo}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activePanel === "form" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Plus className="h-4 w-4 inline mr-1.5" />
              Nova
            </button>
            <button
              onClick={() => onPanelChange("stats")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activePanel === "stats" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-1.5" />
              Stats
            </button>
            <Link
              href="/promos/leads"
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-gray-900"
            >
              <Users className="h-4 w-4 inline mr-1.5" />
              Leads
            </Link>
            <Link
              href="/promos/templates"
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-gray-900"
            >
              <Layers className="h-4 w-4 inline mr-1.5" />
              Templates
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Bell className="h-5 w-5 text-gray-500" />
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {user.name?.[0] || "U"}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/promos/login" })}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Sair"
            >
              <LogOut className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
