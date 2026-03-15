"use client"

interface GoogleBusinessPanelProps {
  gbpConnected: boolean
  gbpAccountName: string
  setGbpAccountName: (v: string) => void
  gbpLocationName: string
  setGbpLocationName: (v: string) => void
  gbpAccounts: Array<{ name: string; accountName?: string }>
  gbpLocations: Array<{ name: string; title?: string }>
  setGbpLocations: (v: Array<{ name: string; title?: string }>) => void
  gbpMessage: string | null
  gbpError: string | null
  gbpBusy: boolean
  onLoadAccounts: () => void
  onLoadLocations: (accountName: string) => void
  onSaveTarget: () => void
  onSync: () => void
  onPostSelected: () => void
  hasSelectedPromo: boolean
}

export function GoogleBusinessPanel({
  gbpConnected,
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
  onLoadAccounts,
  onLoadLocations,
  onSaveTarget,
  onSync,
  onPostSelected,
  hasSelectedPromo,
}: GoogleBusinessPanelProps) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Google Business</p>
          <p className="text-[11px] text-gray-400">Posta automaticamente quando publicar no site</p>
        </div>
        <a
          href="/api/google-business/connect"
          className="text-[11px] rounded-md bg-gray-900 border border-gray-700 px-3 py-1.5 text-gray-200 hover:bg-gray-850"
        >
          {gbpConnected ? "Reconectar" : "Conectar"}
        </a>
      </div>

      <button
        type="button"
        onClick={onLoadAccounts}
        disabled={!gbpConnected || gbpBusy}
        className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-xs text-gray-100 hover:bg-gray-850 disabled:opacity-50"
      >
        {gbpBusy ? "Carregando..." : "Carregar contas"}
      </button>

      <div className="space-y-2">
        <label className="text-[11px] text-gray-400">Conta</label>
        <select
          value={gbpAccountName}
          onChange={(e) => {
            setGbpAccountName(e.target.value)
            setGbpLocationName("")
            setGbpLocations([])
            onLoadLocations(e.target.value)
          }}
          disabled={!gbpConnected}
          className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-xs text-gray-100 disabled:opacity-50"
        >
          <option value="">{gbpConnected ? "Selecione" : "Conecte o Google"}</option>
          {gbpAccounts.map((acc) => (
            <option key={acc.name} value={acc.name}>
              {acc.accountName || acc.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] text-gray-400">Local (unidade)</label>
        <select
          value={gbpLocationName}
          onChange={(e) => setGbpLocationName(e.target.value)}
          disabled={!gbpConnected || !gbpAccountName}
          className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-xs text-gray-100 disabled:opacity-50"
        >
          <option value="">Selecione</option>
          {gbpLocations.map((loc) => (
            <option key={loc.name} value={loc.name}>
              {loc.title || loc.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onSaveTarget}
          disabled={!gbpConnected || !gbpAccountName || !gbpLocationName || gbpBusy}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 disabled:opacity-50"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onSync}
          disabled={!gbpConnected || !gbpAccountName || !gbpLocationName || gbpBusy}
          className="rounded-lg bg-gray-900 border border-gray-700 text-gray-100 text-xs font-semibold py-2 hover:bg-gray-850 disabled:opacity-50"
        >
          Sincronizar
        </button>
      </div>

      <button
        type="button"
        onClick={onPostSelected}
        disabled={!gbpConnected || !gbpAccountName || !gbpLocationName || gbpBusy || !hasSelectedPromo}
        className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-xs text-gray-100 hover:bg-gray-850 disabled:opacity-50"
      >
        Postar promo selecionada
      </button>

      {gbpError && <p className="text-[11px] text-red-400">{gbpError}</p>}
      {gbpMessage && <p className="text-[11px] text-green-400">{gbpMessage}</p>}
    </div>
  )
}
