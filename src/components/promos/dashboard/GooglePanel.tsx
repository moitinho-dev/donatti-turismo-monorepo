"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { useGoogleBusiness } from "@/hooks/useGoogleBusiness"

const NOTICES: Record<string, { tone: "ok" | "error"; text: string }> = {
  connected: { tone: "ok", text: "Google conectado." },
  incomplete: { tone: "error", text: "O Google não liberou o acesso completo. Tente conectar de novo." },
  forbidden: { tone: "error", text: "Só administradores conectam o Google." },
  "not-configured": { tone: "error", text: "A conexão com o Google ainda não foi preparada. Fale com o suporte." },
  error: { tone: "error", text: "Não deu para conectar o Google." },
}

/** Conexão com o Perfil da Empresa no Google: conectar, escolher conta e local, trocar */
export function GooglePanel({ gbp, isAdmin }: { gbp: ReturnType<typeof useGoogleBusiness>; isAdmin: boolean }) {
  const {
    gbpLoaded,
    gbpConfigured,
    gbpConnected,
    gbpReady,
    gbpLocationTitle,
    gbpAccountName,
    setGbpAccountName,
    gbpLocationName,
    setGbpLocationName,
    gbpAccounts,
    gbpLocations,
    setGbpLocations,
    gbpError,
    gbpBusy,
    loadGbpAccounts,
    loadGbpLocations,
    saveGbpTarget,
  } = gbp
  const params = useSearchParams()
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null)
  const [changing, setChanging] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    const key = params.get("google")
    if (!key || !NOTICES[key]) return
    setNotice({ ...NOTICES[key], text: params.get("msg") ? `${NOTICES[key].text} ${params.get("msg")}` : NOTICES[key].text })
    window.history.replaceState(null, "", "/promos")
  }, [params])

  // Escolhendo o local: carrega as contas uma vez (com uma conta só, já seleciona e traz os locais)
  const picking = isAdmin && gbpConnected && (!gbpReady || changing)
  useEffect(() => {
    if (!picking || loaded.current) return
    loaded.current = true
    void (async () => {
      const accounts = await loadGbpAccounts()
      const account = accounts.find((a) => a.name === gbpAccountName)?.name || (accounts.length === 1 ? accounts[0].name : "")
      if (account !== gbpAccountName) {
        setGbpAccountName(account)
        setGbpLocationName("")
      }
      if (!account) return
      const locations = await loadGbpLocations(account)
      if (locations.length === 1) setGbpLocationName(locations[0].name)
    })()
  }, [picking, gbpAccountName, loadGbpAccounts, loadGbpLocations, setGbpAccountName, setGbpLocationName])

  if (!gbpLoaded) return null
  const card = "max-w-7xl mx-auto mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm"
  const btn = "inline-flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-bold disabled:opacity-50"
  const select = "rounded-[14px] border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13px] font-semibold text-gray-700 disabled:opacity-50"

  const stopChanging = () => {
    setChanging(false)
    loaded.current = false
  }

  let text: string
  if (!gbpConnected) {
    text = !gbpConfigured
      ? "A conexão com o Google ainda não foi preparada."
      : isAdmin
        ? "Conecte o Perfil da Empresa da Donatti para postar as ofertas no Google."
        : "Conecte o Perfil da Empresa da Donatti para postar as ofertas no Google. Peça para um administrador conectar."
  } else if (picking || !gbpReady) {
    text = isAdmin ? "Escolha a conta e o local onde as ofertas serão postadas." : "Falta escolher o local das ofertas. Peça para um administrador escolher."
  } else {
    text = ""
  }

  return (
    <section className={card} aria-label="Google (Perfil da Empresa)">
      <div className="min-w-0">
        <p className="text-[15px] font-black text-gray-900">Google (Perfil da Empresa)</p>
        {text ? (
          <p className="text-[13px] text-gray-500">{text}</p>
        ) : (
          <p className="text-[13px] text-gray-500">
            Postando em <b className="text-gray-800">{gbpLocationTitle || "local escolhido"}</b>
          </p>
        )}
        {notice && <p className={`mt-1 text-[13px] font-semibold ${notice.tone === "ok" ? "text-emerald-600" : "text-red-600"}`}>{notice.text}</p>}
        {picking && gbpError && <p className="mt-1 text-[13px] font-semibold text-red-600">{gbpError}</p>}
      </div>

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          {picking && (
            <>
              <select
                aria-label="Conta"
                className={select}
                value={gbpAccountName}
                disabled={gbpBusy || !gbpAccounts.length}
                onChange={async (e) => {
                  const account = e.target.value
                  setGbpAccountName(account)
                  setGbpLocationName("")
                  setGbpLocations([])
                  const locations = await loadGbpLocations(account)
                  if (locations.length === 1) setGbpLocationName(locations[0].name)
                }}
              >
                <option value="">{gbpBusy && !gbpAccounts.length ? "Carregando contas…" : "Conta"}</option>
                {gbpAccounts.map((acc) => (
                  <option key={acc.name} value={acc.name}>
                    {acc.accountName || acc.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Local"
                className={select}
                value={gbpLocationName}
                disabled={gbpBusy || !gbpAccountName || !gbpLocations.length}
                onChange={(e) => setGbpLocationName(e.target.value)}
              >
                <option value="">{gbpBusy && gbpAccountName ? "Carregando locais…" : "Local"}</option>
                {gbpLocations.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.title || loc.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={`${btn} bg-gray-900 text-white hover:bg-gray-800`}
                disabled={gbpBusy || !gbpAccountName || !gbpLocationName}
                onClick={async () => {
                  if (!(await saveGbpTarget())) return
                  stopChanging()
                  setNotice({ tone: "ok", text: "Local salvo. As ofertas já podem ser postadas no Google." })
                }}
              >
                Salvar
              </button>
              {changing && gbpReady && (
                <button type="button" className={`${btn} text-gray-500 hover:text-gray-800`} onClick={stopChanging}>
                  Cancelar
                </button>
              )}
            </>
          )}
          {gbpConnected && gbpReady && !changing && (
            <button type="button" className={`${btn} border border-gray-200 text-gray-700 hover:bg-gray-50`} onClick={() => setChanging(true)}>
              Trocar local
            </button>
          )}
          {gbpConfigured && (
            <a
              href="/api/google-business/connect"
              className={gbpConnected ? `${btn} border border-gray-200 text-gray-700 hover:bg-gray-50` : `${btn} bg-[#1a73e8] text-white hover:bg-[#1765cc]`}
            >
              {gbpConnected ? "Reconectar" : "Conectar com o Google"}
            </a>
          )}
        </div>
      )}
    </section>
  )
}
