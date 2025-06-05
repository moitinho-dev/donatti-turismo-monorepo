"use client"
import { useState } from "react"
import { Search, Edit, Trash2, X, User, Mail, UserCog, Calendar } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  lastLogin?: string
}

interface UsersListProps {
  users: User[]
  onEdit: (user: User) => void
  onRefresh: () => void
}

// Add this helper function at the top of the component
const formatDate = (dateString?: string) => {
  if (!dateString) return "-"

  try {
    const date = parseISO(dateString)
    if (isNaN(date.getTime())) {
      return "Data inválida"
    }
    return format(date, "dd/MM/yyyy", { locale: ptBR })
  } catch (error) {
    console.error("Error formatting date:", error, dateString)
    return "Data inválida"
  }
}

const formatDateTime = (dateString?: string) => {
  if (!dateString) return "-"

  try {
    const date = parseISO(dateString)
    if (isNaN(date.getTime())) {
      return "Data inválida"
    }
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR })
  } catch (error) {
    console.error("Error formatting date:", error, dateString)
    return "Data inválida"
  }
}

export function UsersList({ users, onEdit, onRefresh }: UsersListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredUsers = users.filter((user) => {
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id)
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmId) {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/users?id=${deleteConfirmId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erro ao excluir usuário")
        }

        setDeleteConfirmId(null)
        onRefresh()
      } catch (error) {
        console.error("Error deleting user:", error)
        setError(error instanceof Error ? error.message : "Erro ao excluir usuário")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmId(null)
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "agent":
        return "Agente de Turismo"
      default:
        return role
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar usuários..."
              className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-mon">
          <p>{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-mon">
            {users.length === 0 ? "Nenhum usuário cadastrado." : "Nenhum usuário encontrado com os filtros atuais."}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nome
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Função
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Criado em
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Último Login
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 font-mon">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 font-mon">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserCog className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 font-mon">{getRoleName(user.role)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 font-mon">{formatDate(user.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 font-mon">{formatDateTime(user.lastLogin)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deleteConfirmId === user.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleConfirmDelete}
                          disabled={isLoading}
                          className="text-white bg-red-600 hover:bg-red-700 p-1.5 rounded"
                        >
                          {isLoading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelDelete}
                          className="text-gray-600 hover:text-gray-800 p-1.5 rounded bg-gray-100 hover:bg-gray-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onEdit(user)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.id)}
                          className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
