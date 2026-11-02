"use client"

import { useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Download,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Maximize,
  Minus,
  Palette,
  Plus,
  Redo2,
  Send,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Type,
  Undo2,
  X,
} from "lucide-react"
import { FORMATS, type ArtFormat } from "../types"

/** Partes fixas da tela do Studio v2: barra superior, barra de ícones, abas do celular, zoom */

export type Tab = "templates" | "marca" | "fotos" | "textos" | "elementos" | "ia" | "camadas" | "oferta" | "editar"

export const TABS: { id: Exclude<Tab, "editar">; label: string; short?: string; Icon: typeof LayoutTemplate }[] = [
  { id: "templates", label: "Templates", Icon: LayoutTemplate },
  { id: "marca", label: "Marca", Icon: Palette },
  { id: "fotos", label: "Fotos", Icon: ImageIcon },
  { id: "textos", label: "Textos", Icon: Type },
  { id: "elementos", label: "Elementos", Icon: Shapes },
  { id: "ia", label: "IA", Icon: Sparkles },
  { id: "camadas", label: "Camadas", Icon: Layers },
  { id: "oferta", label: "Dados da oferta", short: "Oferta", Icon: ClipboardList },
]

export const tabTitle = (tab: Tab | null, selectedName?: string) => (tab === "editar" ? selectedName || "Editar" : TABS.find((t) => t.id === tab)?.label)

interface TopBarProps {
  title: string
  subtitle: string
  format: ArtFormat
  status: string | null
  canUndo: boolean
  canRedo: boolean
  publishDisabled: boolean
  onBack: () => void
  onUndo: () => void
  onRedo: () => void
  onDownload: (which: ArtFormat | "all", mime: "image/png" | "image/jpeg") => void
  onPublish: () => void
}

export function TopBar({ title, subtitle, format, status, canUndo, canRedo, publishDisabled, onBack, onUndo, onRedo, onDownload, onPublish }: TopBarProps) {
  const [open, setOpen] = useState(false)
  const download = (which: ArtFormat | "all", mime: "image/png" | "image/jpeg") => {
    setOpen(false)
    onDownload(which, mime)
  }
  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b border-gray-200 bg-white px-2 sm:gap-2 sm:px-4">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 rounded-xl px-2 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100" aria-label="Voltar para a lista">
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Voltar</span>
      </button>
      <div className="hidden min-w-0 border-l border-gray-200 pl-3 md:block">
        <p className="truncate text-[14px] font-black leading-tight">{title}</p>
        <p className="truncate text-[11px] text-gray-500">{subtitle}</p>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <IconButton title="Desfazer (Ctrl+Z)" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </IconButton>
        <IconButton title="Refazer (Ctrl+Shift+Z)" onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </IconButton>
        <span className="hidden w-36 items-center justify-end text-[11px] text-gray-400 lg:flex">
          {status === "Salvo" ? (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" /> Salvo
            </span>
          ) : (
            status
          )}
        </span>
        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Baixar"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] font-bold text-gray-700 hover:border-gray-300 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Baixar</span>
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onMouseDown={() => setOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                <MenuItem onClick={() => download(format, "image/png")}>{FORMATS[format].label} em PNG</MenuItem>
                <MenuItem onClick={() => download(format, "image/jpeg")}>{FORMATS[format].label} em JPG</MenuItem>
                <MenuItem onClick={() => download("all", "image/jpeg")}>Os 4 formatos (.zip)</MenuItem>
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onPublish}
          disabled={publishDisabled}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-amber-400 disabled:opacity-50 sm:px-4"
        >
          <Send className="h-4 w-4" />
          Publicar
        </button>
      </div>
    </header>
  )
}

/** Barra de ícones à esquerda (computador); clicar no ícone ativo recolhe o painel */
export function ToolRail({ tab, onTab }: { tab: Tab | null; onTab: (t: Tab | null) => void }) {
  return (
    <nav className="flex w-[76px] shrink-0 flex-col items-center gap-0.5 overflow-y-auto border-r border-gray-200 bg-white py-2" aria-label="Ferramentas">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTab(tab === id ? null : id)}
          aria-pressed={tab === id}
          className={`flex w-16 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-[10.5px] font-semibold leading-tight transition-all ${tab === id ? "bg-amber-50 text-amber-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
        >
          <Icon className={`h-5 w-5 ${id === "ia" ? "text-violet-500" : ""}`} />
          {label}
        </button>
      ))}
    </nav>
  )
}

/** Abas embaixo (celular); "Editar" aparece com um elemento selecionado */
export function MobileTabs({ tab, onTab, withEdit }: { tab: Tab | null; onTab: (t: Tab | null) => void; withEdit: boolean }) {
  const tabs = [...TABS, ...(withEdit ? [{ id: "editar" as const, label: "Editar", short: undefined, Icon: SlidersHorizontal }] : [])]
  return (
    <nav className="flex shrink-0 overflow-x-auto border-t border-gray-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] [scrollbar-width:none]" aria-label="Ferramentas">
      {tabs.map(({ id, label, short, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTab(tab === id ? null : id)}
          aria-pressed={tab === id}
          className={`flex min-w-[58px] flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${tab === id ? "text-amber-600" : "text-gray-500"}`}
        >
          <Icon className={`h-5 w-5 ${id === "ia" && tab !== id ? "text-violet-500" : ""}`} />
          {short || label}
        </button>
      ))}
    </nav>
  )
}

export function ZoomControls({ percent, onZoom }: { percent: number; onZoom: (z: "in" | "out" | "fit") => void }) {
  return (
    <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
      <IconButton title="Diminuir zoom" onClick={() => onZoom("out")}>
        <Minus className="h-4 w-4" />
      </IconButton>
      <span className="w-11 text-center text-[11px] font-semibold text-gray-600">{percent}%</span>
      <IconButton title="Aumentar zoom" onClick={() => onZoom("in")}>
        <Plus className="h-4 w-4" />
      </IconButton>
      <IconButton title="Caber na tela" onClick={() => onZoom("fit")}>
        <Maximize className="h-4 w-4" />
      </IconButton>
    </div>
  )
}

/** Oferta de levar a edição para o mesmo elemento nos outros formatos */
export function PropagateBar({ onApply, onDismiss }: { onApply: () => void; onDismiss: () => void }) {
  return (
    <div role="status" className="absolute left-1/2 top-3 z-20 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-2 rounded-2xl bg-gray-900 py-1.5 pl-4 pr-1.5 text-[13px] text-white shadow-xl">
      <span className="hidden truncate text-gray-300 sm:inline">Este elemento também está nos outros formatos.</span>
      <button type="button" onClick={onApply} className="whitespace-nowrap rounded-xl bg-amber-500 px-3 py-1.5 font-bold hover:bg-amber-400">
        Aplicar nos 4 formatos
      </button>
      <button type="button" onClick={onDismiss} aria-label="Dispensar" className="rounded-lg p-1 text-gray-400 hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function PanelHeader({ title, onClose, closeLabel }: { title?: string; onClose: () => void; closeLabel: string }) {
  return (
    <div className="flex items-center justify-between px-4 pb-2 pt-3">
      <h2 className="text-[15px] font-black">{title}</h2>
      <button type="button" onClick={onClose} aria-label={closeLabel} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

function IconButton({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30">
      {children}
    </button>
  )
}

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="block w-full px-3 py-2 text-left text-[13px] font-semibold text-gray-700 hover:bg-amber-50">
      {children}
    </button>
  )
}
