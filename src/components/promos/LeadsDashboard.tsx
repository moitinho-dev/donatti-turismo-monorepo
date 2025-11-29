"use client"

import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import {
  Search,
  Filter,
  ChevronDown,
  Loader2,
  LogOut,
  Bell,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
  Trash2,
  Edit2,
  ArrowLeft,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  RefreshCw,
} from "lucide-react"

interface UserData {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
}

interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  source: string
  destino: string | null
  hotel: string | null
  promoDetails: string | null
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface LeadsDashboardProps {
  user: UserData
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  new: { label: "Novo", color: "bg-blue-100 text-blue-800", icon: Clock },
  contacted: { label: "Contactado", color: "bg-yellow-100 text-yellow-800", icon: MessageCircle },
  converted: { label: "Convertido", color: "bg-green-100 text-green-800", icon: CheckCircle },
  lost: { label: "Perdido", color: "bg-red-100 text-red-800", icon: XCircle },
}

const sourceConfig: Record<string, string> = {
  promo_popup: "Popup de Promo",
  whatsapp_popup: "Popup WhatsApp",
  contact_form: "Formulario de Contato",
  website: "Website",
}

export default function LeadsDashboard({ user }: LeadsDashboardProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("")
  const [sourceFilter, setSourceFilter] = useState("")
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [editNotes, setEditNotes] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    converted: 0,
    lost: 0,
  })

  const fetchLeads = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (sourceFilter) params.set("source", sourceFilter)
      if (searchQuery) params.set("search", searchQuery)

      const response = await fetch(`/api/leads?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data)

        // Calculate stats
        const newStats = {
          total: data.length,
          new: data.filter((l: Lead) => l.status === "new").length,
          contacted: data.filter((l: Lead) => l.status === "contacted").length,
          converted: data.filter((l: Lead) => l.status === "converted").length,
          lost: data.filter((l: Lead) => l.status === "lost").length,
        }
        setStats(newStats)
      }
    } catch (error) {
      console.error("Erro ao buscar leads:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [statusFilter, sourceFilter])

  const handleSearch = () => {
    fetchLeads()
  }

  const handleUpdateLead = async () => {
    if (!editingLead) return

    try {
      const response = await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingLead.id,
          status: editStatus || editingLead.status,
          notes: editNotes,
        }),
      })

      if (response.ok) {
        setEditingLead(null)
        fetchLeads()
      }
    } catch (error) {
      console.error("Erro ao atualizar lead:", error)
    }
  }

  const handleDeleteLead = async (id: string) => {
    try {
      const response = await fetch(`/api/leads?id=${id}`, { method: "DELETE" })
      if (response.ok) {
        setDeleteConfirm(null)
        fetchLeads()
      }
    } catch (error) {
      console.error("Erro ao excluir lead:", error)
    }
  }

  const openWhatsApp = (phone: string, name: string) => {
    const message = `Ola ${name}! Vi que voce tem interesse em nossos pacotes de viagem. Como posso te ajudar?`
    const cleanPhone = phone.replace(/\D/g, "")
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.phone.includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.destino?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/promos"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Leads</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLeads}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Atualizar"
            >
              <RefreshCw className={`h-5 w-5 text-gray-500 ${isLoading ? "animate-spin" : ""}`} />
            </button>
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

      {/* Main Content */}
      <main className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
                <p className="text-sm text-gray-500">Novos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.contacted}</p>
                <p className="text-sm text-gray-500">Contactados</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
                <p className="text-sm text-gray-500">Convertidos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.lost}</p>
                <p className="text-sm text-gray-500">Perdidos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone, email ou destino..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700"
            >
              <option value="">Todos os status</option>
              <option value="new">Novo</option>
              <option value="contacted">Contactado</option>
              <option value="converted">Convertido</option>
              <option value="lost">Perdido</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700"
            >
              <option value="">Todas as origens</option>
              <option value="promo_popup">Popup de Promo</option>
              <option value="whatsapp_popup">Popup WhatsApp</option>
              <option value="contact_form">Formulario</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Users className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Nenhum lead encontrado</p>
              <p className="text-sm">Os leads capturados aparecerao aqui</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interesse
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Origem
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeads.map((lead) => {
                    const statusInfo = statusConfig[lead.status] || statusConfig.new
                    const StatusIcon = statusInfo.icon
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                              {lead.name[0].toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                              {lead.notes && (
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{lead.notes}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-900 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </p>
                            {lead.email && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lead.destino ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {lead.destino}
                              </p>
                              {lead.hotel && (
                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{lead.hotel}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {sourceConfig[lead.source] || lead.source}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(lead.createdAt)}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openWhatsApp(lead.phone, lead.name)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingLead(lead)
                                setEditNotes(lead.notes || "")
                                setEditStatus(lead.status)
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(lead.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Editar Lead</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <p className="text-gray-900">{editingLead.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="new">Novo</option>
                  <option value="contacted">Contactado</option>
                  <option value="converted">Convertido</option>
                  <option value="lost">Perdido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
                  placeholder="Adicione notas sobre este lead..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingLead(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateLead}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Lead?</h3>
            <p className="text-gray-500 mb-6">Esta acao nao pode ser desfeita.</p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteLead(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
