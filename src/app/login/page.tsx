"use client"
import { useState } from "react"
import type React from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Logo from "../../../public/assets/logo-preto.png"
import { Loader2, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Add userAgent to help with session tracking
      const userAgent = window.navigator.userAgent

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        userAgent,
      })

      if (result?.error) {
        setError("Credenciais inválidas. Por favor, tente novamente.")
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        // Fetch the session to determine where to redirect
        const response = await fetch("/api/auth/session")
        const sessionData = await response.json()

        if (sessionData?.user?.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/agent")
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Ocorreu um erro ao fazer login. Por favor, tente novamente.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center">
          <Image src={Logo || "/placeholder.svg"} alt="Donatti Turismo" width={180} height={72} className="mb-6" />
          <h2 className="text-2xl font-bold text-donatti-blue">Acesso ao Gerenciador</h2>
          <p className="mt-2 text-sm text-gray-600">Entre com suas credenciais para acessar o sistema</p>
        </div>

        {error && <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm">{error}</div>}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-donatti-blue focus:border-donatti-blue"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-donatti-blue focus:border-donatti-blue"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-donatti-blue hover:bg-donatti-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-donatti-blue transition-colors disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Para fins de demonstração, use:</p>
          <p className="mt-1">Email: admin@donatti.com</p>
          <p>Senha: lemonde123</p>
        </div>
      </div>
    </div>
  )
}
