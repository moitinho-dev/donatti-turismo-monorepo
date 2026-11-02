"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { useMeta } from "@/hooks/useMeta"

const NOTICES: Record<string, { tone: "ok" | "error"; text: string }> = {
  connected: { tone: "ok", text: "Meta conectada. Já dá para publicar na Página e no Instagram." },
  "no-page": { tone: "error", text: "A conexão não trouxe nenhuma Página. Confira os ativos marcados na configuração do login." },
  forbidden: { tone: "error", text: "Só administradores conectam a conta da Meta." },
  "not-configured": { tone: "error", text: "Faltam META_APP_ID, META_APP_SECRET ou META_LOGIN_CONFIG_ID na Vercel." },
  error: { tone: "error", text: "Não deu para conectar a Meta." },
}

/** Conexão com Facebook + Instagram (Login do Facebook para Empresas) */
export function MetaPanel({ meta }: { meta: ReturnType<typeof useMeta> }) {
  const { status, refresh, selectPage, disconnect } = meta
  const params = useSearchParams()
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const key = params.get("meta")
    if (!key || !NOTICES[key]) return
    setNotice({ ...NOTICES[key], text: params.get("msg") ? `${NOTICES[key].text} ${params.get("msg")}` : NOTICES[key].text })
    window.history.replaceState(null, "", "/promos")
  }, [params])

  if (!status) return null
  const card = "max-w-7xl mx-auto mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm"
  const btn = "inline-flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-bold disabled:opacity-50"

  return (
    <section className={card} aria-label="Facebook e Instagram">
      <div className="min-w-0">
        <p className="text-[15px] font-black text-gray-900">Facebook e Instagram</p>
        {status.connected ? (
          <p className="text-[13px] text-gray-500">
            Publicando em <b className="text-gray-800">{status.pageName}</b>
            {status.hasInstagram ? (
              <>
                {" "}
                e <b className="text-gray-800">@{status.igUsername}</b>
              </>
            ) : (
              " (sem Instagram profissional ligado)"
            )}
          </p>
        ) : (
          <p className="text-[13px] text-gray-500">
            {status.configured ? "Conecte a Página da Donatti para publicar direto do lote." : "Integração ainda não configurada na Vercel."}
          </p>
        )}
        {notice && <p className={`mt-1 text-[13px] font-semibold ${notice.tone === "ok" ? "text-emerald-600" : "text-red-600"}`}>{notice.text}</p>}
      </div>

      {status.canManage && (
        <div className="flex flex-wrap items-center gap-2">
          {status.connected && status.pages && status.pages.length > 1 && (
            <select
              className="rounded-[14px] border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13px] font-semibold text-gray-700"
              value={status.pages.find((p) => p.selected)?.id}
              disabled={busy}
              onChange={async (e) => {
                setBusy(true)
                await selectPage(e.target.value).catch((err) => setNotice({ tone: "error", text: err.message }))
                setBusy(false)
              }}
            >
              {status.pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.instagram ? ` · @${p.instagram}` : ""}
                </option>
              ))}
            </select>
          )}
          {status.connected && !status.pages && (
            <button type="button" className={`${btn} border border-gray-200 text-gray-700 hover:bg-gray-50`} onClick={() => void refresh(true)}>
              Trocar Página
            </button>
          )}
          {status.configured && (
            <a href="/api/meta/connect" className={`${btn} bg-[#1877F2] text-white hover:bg-[#166FE5]`}>
              {status.connected ? "Reconectar" : "Conectar com o Facebook"}
            </a>
          )}
          {status.connected && (
            <button
              type="button"
              className={`${btn} text-gray-500 hover:text-red-600`}
              disabled={busy}
              onClick={async () => {
                if (!window.confirm("Desconectar a Meta? O lote para de publicar até conectar de novo.")) return
                setBusy(true)
                await disconnect()
                setBusy(false)
              }}
            >
              Desconectar
            </button>
          )}
        </div>
      )}
    </section>
  )
}
