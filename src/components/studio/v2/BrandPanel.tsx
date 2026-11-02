"use client"

import { BRAND } from "../types"
import { Section } from "../panels/ui"

/** Logos do manual (proporção altura/largura do arquivo, para a camada nascer do tamanho certo) */
export const BRAND_LOGOS: { src: string; label: string; ratio: number; dark: boolean }[] = [
  { src: "/images/black-november/logo-black-november.svg", label: "Black November", ratio: 530.8 / 1112, dark: true },
  { src: "/images/black-november/donatti-preto.svg", label: "Donatti preto", ratio: 230.3 / 756, dark: false },
  { src: "/images/black-november/donatti-negativo-black.svg", label: "Donatti negativo", ratio: 230.3 / 756, dark: true },
  { src: BRAND.logoLight, label: "Donatti branco", ratio: 439 / 1539, dark: true },
  { src: BRAND.logoDark, label: "Donatti azul", ratio: 439 / 1539, dark: false },
]

export const BRAND_PALETTE: { hex: string; name: string }[] = [
  { hex: "#0A0A0C", name: "Preto" },
  { hex: "#FED400", name: "Amarelo" },
  { hex: "#F79E08", name: "Laranja" },
  { hex: "#1D3153", name: "Azul" },
  { hex: "#FFFFFF", name: "Branco" },
]

interface BrandPanelProps {
  /** Há um elemento com cor selecionado: a cor vai para ele; senão, para o fundo */
  colorTarget: "layer" | "background"
  onAddLogo: (logo: (typeof BRAND_LOGOS)[number]) => void
  onColor: (hex: string) => void
}

/** Kit da marca, como no Canva: logos e cores do manual */
export function BrandPanel({ colorTarget, onAddLogo, onColor }: BrandPanelProps) {
  return (
    <div className="space-y-6">
      <Section title="Logos">
        <div className="grid grid-cols-2 gap-2.5">
          {BRAND_LOGOS.map((logo) => (
            <button
              key={logo.src}
              type="button"
              onClick={() => onAddLogo(logo)}
              title={`Adicionar ${logo.label}`}
              className="flex flex-col overflow-hidden rounded-xl border border-gray-200 text-left transition-all hover:border-amber-400"
            >
              <span className={`flex h-20 items-center justify-center p-3 ${logo.dark ? "bg-[#0A0A0C]" : "bg-gray-50"}`}>
                <img src={logo.src} alt={logo.label} className="max-h-full max-w-full object-contain" />
              </span>
              <span className="truncate px-2 py-1.5 text-[12px] font-semibold text-gray-700">{logo.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400">Clique para colocar o logo na arte.</p>
      </Section>

      <Section title="Cores">
        <div className="grid grid-cols-5 gap-2">
          {BRAND_PALETTE.map((c) => (
            <button key={c.hex} type="button" onClick={() => onColor(c.hex)} title={`${c.name} ${c.hex}`} className="flex flex-col items-center gap-1">
              <span className="h-10 w-10 rounded-full border border-gray-200 shadow-sm transition-transform hover:scale-110" style={{ background: c.hex }} />
              <span className="text-[10px] font-semibold text-gray-500">{c.name}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400">
          {colorTarget === "layer" ? "A cor vai para o elemento selecionado." : "Sem elemento selecionado, a cor vai para o fundo da arte."}
        </p>
      </Section>
    </div>
  )
}
