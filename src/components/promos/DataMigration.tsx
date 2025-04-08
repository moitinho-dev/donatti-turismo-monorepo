"use client"
import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Loader2, Upload, Check, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"

export function DataMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMigrateData = async () => {
    setIsLoading(true)
    setSuccess(null)
    setError(null)

    try {
      // Fetch existing data
      const response = await fetch("/api/promos")

      if (!response.ok) {
        throw new Error("Failed to fetch existing data")
      }

      const data = await response.json()

      // Migrate data to Redis
      const migrateResponse = await fetch("/api/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!migrateResponse.ok) {
        const errorData = await migrateResponse.json()
        throw new Error(errorData.error || "Failed to migrate data")
      }

      const result = await migrateResponse.json()
      setSuccess(result.message)
    } catch (err) {
      console.error("Error migrating data:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido ao migrar dados")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInitializeRedis = async () => {
    setIsLoading(true)
    setSuccess(null)
    setError(null)

    try {
      const response = await fetch("/api/init")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to initialize Redis")
      }

      const result = await response.json()
      setSuccess(result.message)
    } catch (err) {
      console.error("Error initializing Redis:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido ao inicializar Redis")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-primary-blue mb-4">Gerenciamento de Dados</h3>

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Sucesso</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Erro</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleInitializeRedis}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Inicializar Redis
        </Button>

        <Button
          onClick={handleMigrateData}
          disabled={isLoading}
          className="flex items-center gap-2 bg-primary-blue hover:bg-second-blue"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Migrar Dados para Redis
        </Button>
      </div>
    </div>
  )
}
