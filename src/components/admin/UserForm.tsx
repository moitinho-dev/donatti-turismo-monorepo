"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { Loader2, Save, X, User, Mail, Lock, UserCog } from "lucide-react"

interface UserFormProps {
  user?: any
  onSuccess: () => void
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState<{
    id: string
    name: string
    email: string
    password: string
    role: string
  }>({
    id: "",
    name: "",
    email: "",
    password: "",
    role: "agent",
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form with user data if editing
  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id || "",
        name: user.name || "",
        email: user.email || "",
        password: "", // Don't populate password for security
        role: user.role || "agent",
      })
    }
  }, [user])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    // Validate required fields
    const requiredFields = ["name", "email", "role"]
    const missingFields = requiredFields.filter((field) => !(formData as any)[field])

    // Also require password for new users
    if (!user && !formData.password) {
      missingFields.push("password")
    }

    if (missingFields.length > 0) {
      setFormError(`Campos obrigatórios não preenchidos: ${missingFields.join(", ")}`)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setFormError("Por favor, insira um email válido.")
      return
    }

    // Validate password length if provided
    if (formData.password && formData.password.length < 6) {
      setFormError("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    try {
      setIsLoading(true)
      // Prepare data for API
      const userData: Partial<typeof formData> = { ...formData }

      if (user && !userData.password) {
        delete userData.password
      }

      // If editing and password is empty, remove it from the request
      if (user && !userData.password) {
        delete userData.password
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao salvar usuário")
      }

      setFormSuccess(formData.id ? "Usuário atualizado com sucesso!" : "Usuário adicionado com sucesso!")

      // Reset form if it's a new user
      if (!formData.id) {
        resetForm()
      }

      // Notify parent component
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (error) {
      console.error("Error saving user:", error)
      setFormError(error instanceof Error ? error.message : "Erro ao salvar usuário")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      email: "",
      password: "",
      role: "agent",
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-primary-blue mb-6 font-mon">
          {user ? "Editar Usuário" : "Adicionar Novo Usuário"}
        </h2>

        {formError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-mon">
            <p>{formError}</p>
          </div>
        )}

        {formSuccess && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 font-mon">
            <p>{formSuccess}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-primary-blue font-mon font-medium">
                <User className="h-4 w-4" />
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-primary-blue font-mon font-medium">
                <Mail className="h-4 w-4" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-primary-blue font-mon font-medium">
                <Lock className="h-4 w-4" />
                Senha {!user && <span className="text-red-500">*</span>}
              </label>
              <input
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder={user ? "Deixe em branco para manter a senha atual" : "Mínimo de 6 caracteres"}
                required={!user}
              />
              {user && <p className="text-xs text-gray-500 font-mon">Deixe em branco para manter a senha atual</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-primary-blue font-mon font-medium">
                <UserCog className="h-4 w-4" />
                Função <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-800 font-mon"
                id="role"
                value={formData.role}
                onChange={(e) => handleChange("role", e.target.value)}
                required
              >
                <option value="admin">Administrador</option>
                <option value="agent">Agente de Turismo</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-mon font-medium flex items-center justify-center"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar
            </button>

            <button
              type="submit"
              className="px-6 py-3 bg-primary-blue text-white rounded-md hover:bg-second-blue transition-colors font-mon font-medium flex items-center justify-center min-w-[160px]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {user ? "Atualizar" : "Adicionar"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
