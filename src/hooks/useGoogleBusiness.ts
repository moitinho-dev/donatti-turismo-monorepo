"use client"

import { useState, useCallback } from "react"

interface UseGoogleBusinessOptions {
  userRole: string | null | undefined
  fetchPromos: () => Promise<void>
}

export function useGoogleBusiness({ userRole, fetchPromos }: UseGoogleBusinessOptions) {
  const [gbpConnected, setGbpConnected] = useState(false)
  /** Conectado e com conta/local escolhidos: dá para postar */
  const [gbpReady, setGbpReady] = useState(false)
  /** Já leu a situação da conexão (o painel só aparece depois) */
  const [gbpLoaded, setGbpLoaded] = useState(false)
  /** O login do Google está configurado no servidor */
  const [gbpConfigured, setGbpConfigured] = useState(true)
  /** Nome do local onde as ofertas são postadas */
  const [gbpLocationTitle, setGbpLocationTitle] = useState<string | null>(null)
  const [gbpAccountName, setGbpAccountName] = useState("")
  const [gbpLocationName, setGbpLocationName] = useState("")
  const [gbpAccounts, setGbpAccounts] = useState<Array<{ name: string; accountName?: string }>>([])
  const [gbpLocations, setGbpLocations] = useState<Array<{ name: string; title?: string }>>([])
  const [gbpMessage, setGbpMessage] = useState<string | null>(null)
  const [gbpError, setGbpError] = useState<string | null>(null)
  const [gbpBusy, setGbpBusy] = useState(false)

  const refreshGbp = useCallback(async () => {
    let statusOk = false
    try {
      // Situação da conexão: qualquer pessoa da equipe publica no Google
      const res = await fetch("/api/google-business/status")
      if (res.ok) {
        const data = await res.json()
        setGbpConnected(Boolean(data?.connected))
        setGbpReady(Boolean(data?.ready))
        setGbpConfigured(data?.configured !== false)
        setGbpLocationTitle(data?.locationTitle || null)
        statusOk = true
      }
      // Conta e local escolhidos: só admin troca
      if (userRole !== "admin") return
      const settings = await fetch("/api/google-business/settings")
      if (!settings.ok) return
      const data = await settings.json()
      setGbpAccountName(data?.accountName || "")
      setGbpLocationName(data?.locationName || "")
    } catch {
      // ignore
    } finally {
      // O painel aparece depois de ler tudo (a escolha de conta parte do que já está salvo)
      if (statusOk) setGbpLoaded(true)
    }
  }, [userRole])

  const loadGbpAccounts = useCallback(async () => {
    setGbpBusy(true)
    setGbpError(null)
    try {
      const res = await fetch("/api/google-business/accounts")
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Não foi possível carregar as contas do Google.")
      const accounts: Array<{ name: string; accountName?: string }> = Array.isArray(data) ? data : []
      setGbpAccounts(accounts)
      return accounts
    } catch (err) {
      setGbpError(err instanceof Error ? err.message : "Não foi possível carregar as contas do Google.")
      return []
    } finally {
      setGbpBusy(false)
    }
  }, [])

  const loadGbpLocations = useCallback(async (accountName: string): Promise<Array<{ name: string; title?: string }>> => {
    if (!accountName) return []
    setGbpBusy(true)
    setGbpError(null)
    try {
      const res = await fetch(`/api/google-business/locations?accountName=${encodeURIComponent(accountName)}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Não foi possível carregar os locais do Google.")
      const locations: Array<{ name: string; title?: string }> = Array.isArray(data) ? data : []
      setGbpLocations(locations)
      return locations
    } catch (err) {
      setGbpError(err instanceof Error ? err.message : "Não foi possível carregar os locais do Google.")
      return []
    } finally {
      setGbpBusy(false)
    }
  }, [])

  /** Salva a conta e o local escolhidos; devolve se deu certo */
  const saveGbpTarget = useCallback(async () => {
    setGbpBusy(true)
    setGbpError(null)
    setGbpMessage(null)
    try {
      const locationTitle = gbpLocations.find((l) => l.name === gbpLocationName)?.title || null
      const res = await fetch("/api/google-business/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountName: gbpAccountName, locationName: gbpLocationName, locationTitle }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Não foi possível salvar a conta e o local do Google.")
      setGbpMessage("Conta e local salvos.")
      await refreshGbp()
      return true
    } catch (err) {
      setGbpError(err instanceof Error ? err.message : "Não foi possível salvar a conta e o local do Google.")
      return false
    } finally {
      setGbpBusy(false)
    }
  }, [gbpAccountName, gbpLocationName, gbpLocations, refreshGbp])

  const syncGbpPosts = useCallback(async () => {
    setGbpBusy(true)
    setGbpError(null)
    setGbpMessage(null)
    try {
      const res = await fetch("/api/google-business/sync", { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Erro ao sincronizar posts no Google")
      const okCount = Array.isArray(data?.results) ? data.results.filter((r: { ok?: boolean; skipped?: boolean }) => r.ok && !r.skipped).length : 0
      const skippedCount = Array.isArray(data?.results) ? data.results.filter((r: { ok?: boolean; skipped?: boolean }) => r.ok && r.skipped).length : 0
      setGbpMessage(`Sincronizado: ${okCount} post(s). Ignorados: ${skippedCount}.`)
      await fetchPromos()
    } catch (err) {
      setGbpError(err instanceof Error ? err.message : "Erro ao sincronizar posts no Google")
    } finally {
      setGbpBusy(false)
    }
  }, [fetchPromos])

  const postPromoToGbp = useCallback(async (promoId: string) => {
    setGbpBusy(true)
    setGbpError(null)
    setGbpMessage(null)
    try {
      const res = await fetch("/api/google-business/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Erro ao postar no Google")
      setGbpMessage("Post enviado ao Google Business.")
      await fetchPromos()
    } catch (err) {
      setGbpError(err instanceof Error ? err.message : "Erro ao postar no Google")
    } finally {
      setGbpBusy(false)
    }
  }, [fetchPromos])

  return {
    gbpConnected,
    gbpReady,
    gbpLoaded,
    gbpConfigured,
    gbpLocationTitle,
    gbpAccountName,
    setGbpAccountName,
    gbpLocationName,
    setGbpLocationName,
    gbpAccounts,
    gbpLocations,
    setGbpLocations,
    gbpMessage,
    gbpError,
    gbpBusy,
    refreshGbp,
    loadGbpAccounts,
    loadGbpLocations,
    saveGbpTarget,
    syncGbpPosts,
    postPromoToGbp,
  }
}
