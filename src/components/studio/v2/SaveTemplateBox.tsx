"use client"

import { useState } from "react"
import { LayoutTemplate } from "lucide-react"
import { Btn, Section, Spinner } from "../panels/ui"

/** "Salvar como template": grava os 4 formatos para a equipe reaproveitar */
export function SaveTemplateBox({ defaultName, saving, onSave }: { defaultName: string; saving: boolean; onSave: (name: string) => Promise<void> }) {
  const [name, setName] = useState("")
  return (
    <Section title="Salvar como template">
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          await onSave(name.trim() || defaultName)
          setName("")
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={defaultName}
          aria-label="Nome do template"
          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[13px] outline-none focus:border-amber-400"
        />
        <Btn type="submit" variant="primary" disabled={saving} title="Salvar como template da equipe">
          {saving ? <Spinner /> : <LayoutTemplate className="h-4 w-4" />}
          Salvar
        </Btn>
      </form>
      <p className="text-[11px] text-gray-400">Guarda os 4 formatos juntos. Os dados da promo entram como variáveis e mudam em cada oferta.</p>
    </Section>
  )
}
