"use client"

import { Circle, Square, Type } from "lucide-react"
import { VARIABLES } from "../variables"
import { BRAND, newId, type Layer, type StudioDoc, type TextLayer } from "../types"
import { Section } from "./ui"

interface AddPanelProps {
  doc: StudioDoc
  onAdd: (layers: Layer[]) => void
}

export function AddPanel({ doc, onAdd }: AddPanelProps) {
  const W = doc.width
  const H = doc.height
  const s = Math.min(W, H) / 1080

  const text = (t: Partial<TextLayer> & { text: string; fontSize: number }): TextLayer => ({
    id: newId(),
    name: t.text.replace(/[{}]/g, "").slice(0, 24),
    type: "text",
    x: W * 0.1,
    y: H * 0.42,
    width: W * 0.8,
    height: t.fontSize * 1.2,
    rotation: 0,
    opacity: 1,
    fontFamily: "Montserrat",
    fontWeight: "800",
    fill: doc.background.toLowerCase() === "#ffffff" ? BRAND.navy : BRAND.white,
    align: "center",
    lineHeight: 1.1,
    letterSpacing: 0,
    ...t,
  })

  const textPresets = [
    { label: "Título", node: () => text({ text: "Seu título aqui", fontSize: 110 * s, fontWeight: "900" }) },
    { label: "Subtítulo", node: () => text({ text: "Subtítulo", fontSize: 56 * s, fontWeight: "700" }) },
    { label: "Texto", node: () => text({ text: "Texto do corpo", fontSize: 36 * s, fontWeight: "500" }) },
  ]

  const elements: { label: string; preview: React.ReactNode; make: () => Layer[] }[] = [
    {
      label: "Retângulo",
      preview: <Square className="h-6 w-6" />,
      make: () => [{ id: newId(), name: "Retângulo", type: "rect", x: W * 0.25, y: H * 0.4, width: W * 0.5, height: H * 0.12, rotation: 0, opacity: 1, fill: BRAND.orange, cornerRadius: 0 }],
    },
    {
      label: "Círculo",
      preview: <Circle className="h-6 w-6" />,
      make: () => [{ id: newId(), name: "Círculo", type: "ellipse", x: W / 2 - 150 * s, y: H / 2 - 150 * s, width: 300 * s, height: 300 * s, rotation: 0, opacity: 1, fill: BRAND.yellow }],
    },
    {
      label: "Selo / botão",
      preview: <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">OFERTA</span>,
      make: () => {
        const w = 420 * s
        const h = 90 * s
        const x = (W - w) / 2
        const y = H * 0.1
        return [
          { id: newId(), name: "Selo", type: "rect", x, y, width: w, height: h, rotation: 0, opacity: 1, fill: BRAND.orange, cornerRadius: h / 2 },
          text({ text: "OFERTA", x, y: y + h * 0.27, width: w, fontSize: h * 0.48, fontWeight: "900", fill: BRAND.white, letterSpacing: 3 }),
        ]
      },
    },
    {
      label: "Selo desconto",
      preview: <span className="rounded-full bg-yellow-300 px-1.5 py-1 text-[10px] font-black">-20%</span>,
      make: () => {
        const d = 260 * s
        const x = W - d - 60 * s
        const y = 60 * s
        return [
          { id: newId(), name: "Selo desconto", type: "ellipse", x, y, width: d, height: d, rotation: 0, opacity: 1, fill: BRAND.yellow, showIf: "DESCONTO" },
          text({ text: "-{DESCONTO}%", x, y: y + d * 0.33, width: d, fontSize: d * 0.3, fontWeight: "900", fill: BRAND.black }),
        ]
      },
    },
    {
      label: "Black Friday",
      preview: <span className="bg-black px-1 text-[10px] font-black text-yellow-300">BLACK FRIDAY</span>,
      make: () => [text({ text: "BLACK FRIDAY", y: H * 0.08, fontSize: 130 * s, fontFamily: "Anton", fontWeight: "400", fill: BRAND.yellow, letterSpacing: 4 })],
    },
    {
      label: "Degradê",
      preview: <span className="h-6 w-6 rounded bg-gradient-to-b from-transparent to-black" />,
      make: () => [
        { id: newId(), name: "Degradê", type: "rect", x: 0, y: H * 0.45, width: W, height: H * 0.55, rotation: 0, opacity: 1, fill: "#000000", gradient: { from: "rgba(0,0,0,0)", to: "rgba(0,0,0,0.85)" } },
      ],
    },
    {
      label: "Logo (branco)",
      preview: <img src={BRAND.logoLight} alt="" className="h-5 rounded bg-gray-800 px-1" />,
      make: () => [{ id: newId(), name: "Logo Donatti", type: "image", role: "logo", src: BRAND.logoLight, x: 60 * s, y: 60 * s, width: 320 * s, height: 320 * s * (439 / 1539), rotation: 0, opacity: 1, fit: "contain", cornerRadius: 0 }],
    },
    {
      label: "Logo (azul)",
      preview: <img src={BRAND.logoDark} alt="" className="h-5" />,
      make: () => [{ id: newId(), name: "Logo Donatti", type: "image", role: "logo", src: BRAND.logoDark, x: 60 * s, y: 60 * s, width: 320 * s, height: 320 * s * (439 / 1539), rotation: 0, opacity: 1, fit: "contain", cornerRadius: 0 }],
    },
  ]

  return (
    <div className="space-y-6">
      <Section title="Textos">
        <div className="grid gap-2">
          {textPresets.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onAdd([p.node()])}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left hover:border-amber-400"
            >
              <Type className="h-4 w-4 text-gray-400" />
              <span className={i === 0 ? "text-[18px] font-black" : i === 1 ? "text-[15px] font-bold" : "text-[13px]"}>{p.label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Dados da promo">
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              title={`Exemplo: ${v.example}`}
              onClick={() => onAdd([text({ text: `{${v.key}}`, fontSize: 48 * s, fontWeight: "700" })])}
              className="rounded-lg bg-violet-50 px-2 py-1 text-[12px] font-semibold text-violet-700 hover:bg-violet-100"
            >
              {v.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400">Viram texto que muda sozinho com os dados de cada promo.</p>
      </Section>

      <Section title="Elementos">
        <div className="grid grid-cols-2 gap-2">
          {elements.map((el) => (
            <button
              key={el.label}
              type="button"
              onClick={() => onAdd(el.make())}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 py-3 text-[11px] font-semibold text-gray-600 hover:border-amber-400"
            >
              <span className="flex h-7 items-center text-gray-500">{el.preview}</span>
              {el.label}
            </button>
          ))}
        </div>
      </Section>
    </div>
  )
}
