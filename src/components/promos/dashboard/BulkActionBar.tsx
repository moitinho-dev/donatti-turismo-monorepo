"use client"

import type { ReactNode } from "react"
import { Copy, EyeOff, Globe, Loader2, PenTool, Trash2, X } from "lucide-react"

interface BulkActionBarProps {
  /** Quantas promos estão marcadas (a barra só aparece com 1 ou mais) */
  count: number
  /** Ids marcados, na ordem em que foram marcados (vão para o Studio com várias) */
  selectedIds?: string[]
  /** Com 1 marcada: abre o Studio normal */
  onOpenStudio: () => void
  /** Com 2 ou mais: abre o Studio com várias; sem ele o botão fica desligado */
  onOpenStudioMany?: (ids: string[]) => void
  onPublishSite: () => void
  onUnpublishSite: () => void
  onDuplicate: () => void
  onDelete: () => void
  onClear: () => void
  /** Alguma marcada ainda fora do site / já no site */
  canPublish?: boolean
  canUnpublish?: boolean
  /** Uma ação em lote está rodando */
  busy?: boolean
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  hint,
  tone = "default",
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  hint?: string
  tone?: "default" | "primary" | "danger"
}) {
  const toneClass =
    tone === "primary"
      ? "bg-amber-500 text-white hover:bg-amber-400"
      : tone === "danger"
        ? "text-red-300 hover:bg-white/10 hover:text-red-200"
        : "text-white hover:bg-white/10"
  return (
    // O aviso fica no invólucro: botão desligado não mostra dica em todo navegador
    <span title={hint ?? label} className="shrink-0">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={`inline-flex items-center gap-1.5 rounded-[12px] px-2.5 sm:px-3 py-2.5 text-[13px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${toneClass}`}
      >
        {icon}
        <span className="hidden lg:inline">{label}</span>
      </button>
    </span>
  )
}

/** Barra fixa embaixo da lista quando há promos marcadas */
export function BulkActionBar({
  count,
  selectedIds = [],
  onOpenStudio,
  onOpenStudioMany,
  onPublishSite,
  onUnpublishSite,
  onDuplicate,
  onDelete,
  onClear,
  canPublish = true,
  canUnpublish = true,
  busy = false,
}: BulkActionBarProps) {
  if (count < 1) return null
  const many = count > 1
  const studioMany = many && !!onOpenStudioMany

  return (
    <div
      role="toolbar"
      aria-label="Ações nas promos marcadas"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 sm:pb-4 pointer-events-none"
    >
      <div className="pointer-events-auto flex max-w-full items-center gap-0.5 sm:gap-1 overflow-x-auto rounded-[18px] bg-gray-900 p-1.5 pl-3 sm:pl-4 shadow-2xl">
        <span className="shrink-0 pr-1 sm:pr-2 text-[13px] font-black text-white" aria-live="polite">
          {count} {count === 1 ? "selecionada" : "selecionadas"}
        </span>
        {busy && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-400" aria-label="Processando" />}
        <ActionButton
          icon={<PenTool className="h-4 w-4" />}
          label="Abrir no Studio"
          tone="primary"
          disabled={busy || (many && !studioMany)}
          hint={many && !studioMany ? "Disponível em breve" : undefined}
          onClick={() => (many ? onOpenStudioMany?.(selectedIds) : onOpenStudio())}
        />
        <ActionButton
          icon={<Globe className="h-4 w-4" />}
          label="Publicar no site"
          disabled={busy || !canPublish}
          hint={canPublish ? undefined : "Todas já estão no site"}
          onClick={onPublishSite}
        />
        <ActionButton
          icon={<EyeOff className="h-4 w-4" />}
          label="Tirar do site"
          disabled={busy || !canUnpublish}
          hint={canUnpublish ? undefined : "Nenhuma está no site"}
          onClick={onUnpublishSite}
        />
        <ActionButton
          icon={<Copy className="h-4 w-4" />}
          label="Duplicar"
          disabled={busy || many}
          hint={many ? "Duplique uma de cada vez" : undefined}
          onClick={onDuplicate}
        />
        <ActionButton icon={<Trash2 className="h-4 w-4" />} label="Excluir" tone="danger" disabled={busy} onClick={onDelete} />
        <span className="mx-0.5 sm:mx-1 h-6 w-px shrink-0 bg-white/15" aria-hidden />
        <ActionButton icon={<X className="h-4 w-4" />} label="Limpar" disabled={busy} onClick={onClear} />
      </div>
    </div>
  )
}
