"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Logo from "../../../public/assets/logo-preto.png"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      // Redirect based on user role
      if (session.user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/agent")
      }
    }
  }, [session, status, router])

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
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="flex flex-col items-center">
          <Image src={Logo || "/placeholder.svg"} alt="Donatti Turismo" width={180} height={72} className="mb-6" />
          <h2 className="text-2xl font-bold text-primary-blue">Acesso ao Gerenciador</h2>
          <p className="mt-2 text-sm text-gray-600">Entre com suas credenciais para acessar o sistema</p>
        </div>

        {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm">{error}</div>}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-blue hover:bg-second-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue transition-colors disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
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
          <p>Para recuperar seu acesso, entre em contato com o administrador.</p>
        </div>
      </div>
    </div>
  )
}

