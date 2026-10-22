"use client"

import { ArrowDown, ArrowUp, Eye, EyeOff, Image as ImageIcon, Lock, Shapes, Trash2, Type, Unlock } from "lucide-react"
import { isLayerVisible } from "../render"
import { resolveText } from "../variables"
import type { Layer } from "../types"

interface LayersPanelProps {
  layers: Layer[]
  vars: Record<string, string>
  selectedId: string | null
  onSelect: (id: string) => void
  onPatch: (id: string, patch: Partial<Layer>) => void
  onMove: (id: string, dir: "up" | "down") => void
  onDelete: (id: string) => void
}

export function LayersPanel({ layers, vars, selectedId, onSelect, onPatch, onMove, onDelete }: LayersPanelProps) {
  // De cima (frente) para baixo (fundo), como no Canva
  const ordered = [...layers].reverse()
  if (ordered.length === 0) return <p className="text-[13px] text-gray-500">A arte está vazia. Escolha um modelo ou adicione elementos.</p>

  return (
    <ul className="space-y-1">
      {ordered.map((l) => {
        const autoHidden = !l.hidden && !isLayerVisible(l, vars)
        const label = l.type === "text" ? resolveText(l.text, vars).text || l.name : l.name
        const Icon = l.type === "text" ? Type : l.type === "image" ? ImageIcon : Shapes
        return (
          <li key={l.id}>
            <div
              className={`group flex items-center gap-2 rounded-xl border px-2 py-1.5 ${selectedId === l.id ? "border-amber-400 bg-amber-50" : "border-transparent hover:bg-gray-50"}`}
            >
              <button type="button" onClick={() => onSelect(l.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                <span className={`truncate text-[13px] ${l.hidden || autoHidden ? "text-gray-400" : "text-gray-800"}`}>{label}</span>
                {autoHidden && <span className="shrink-0 rounded bg-gray-100 px-1 text-[9px] text-gray-500" title="Sem dado na promo">vazio</span>}
              </button>
              <div className="flex shrink-0 items-center opacity-60 group-hover:opacity-100">
                <IconBtn title={l.hidden ? "Mostrar" : "Esconder"} onClick={() => onPatch(l.id, { hidden: !l.hidden })}>
                  {l.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </IconBtn>
                <IconBtn title={l.locked ? "Destravar" : "Travar"} onClick={() => onPatch(l.id, { locked: !l.locked })}>
                  {l.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                </IconBtn>
                <IconBtn title="Para frente" onClick={() => onMove(l.id, "up")}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn title="Para trás" onClick={() => onMove(l.id, "down")}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn title="Excluir" onClick={() => onDelete(l.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </IconBtn>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} className="rounded-md p-1.5 text-gray-600 hover:bg-gray-200">
      {children}
    </button>
  )
}
