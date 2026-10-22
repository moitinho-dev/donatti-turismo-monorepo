"use client"

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Copy,
  Image as ImageIcon,
  Lock,
  Strikethrough,
  Trash2,
  Unlock,
} from "lucide-react"
import { VARIABLES } from "../variables"
import { FONTS, type Layer, type StudioDoc, type TextLayer } from "../types"
import { Btn, ColorPicker, NumberField, Section, Segmented, Slider } from "./ui"

interface PropertiesPanelProps {
  doc: StudioDoc
  layer: Layer | null
  photoUrl: string | null
  onChange: (patch: Partial<Layer>) => void
  onBackground: (color: string) => void
  onDelete: () => void
  onDuplicate: () => void
  onMove: (dir: "up" | "down") => void
}

export function PropertiesPanel({ doc, layer, photoUrl, onChange, onBackground, onDelete, onDuplicate, onMove }: PropertiesPanelProps) {
  if (!layer) {
    return (
      <div className="space-y-5">
        <Section title="Fundo da arte">
          <ColorPicker value={doc.background} onChange={onBackground} />
        </Section>
        <p className="text-[12px] leading-relaxed text-gray-500">
          Toque em um elemento da arte para editar. Duplo clique em um texto edita direto na arte.
          <br />
          Atalhos: Delete apaga · Ctrl+D duplica · Ctrl+Z desfaz · setas movem.
        </p>
      </div>
    )
  }

  const t = layer.type === "text" ? (layer as TextLayer) : null
  const fontWeights = FONTS.find((f) => f.family === t?.fontFamily)?.weights || ["400", "700"]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        <Btn onClick={onDuplicate} title="Duplicar (Ctrl+D)">
          <Copy className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => onMove("up")} title="Trazer para frente">
          <ArrowUp className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => onMove("down")} title="Enviar para trás">
          <ArrowDown className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => onChange({ locked: !layer.locked })} title={layer.locked ? "Destravar" : "Travar posição"}>
          {layer.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </Btn>
        <Btn onClick={onDelete} variant="danger" title="Excluir (Delete)">
          <Trash2 className="h-4 w-4" />
        </Btn>
      </div>

      {t && (
        <>
          <Section title="Texto">
            <textarea
              value={t.text}
              onChange={(e) => onChange({ text: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[14px] outline-none focus:border-amber-400"
            />
            <div className="flex flex-wrap gap-1">
              {VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  title={`Exemplo: ${v.example}`}
                  onClick={() => onChange({ text: `${t.text}${t.text.endsWith(" ") || !t.text ? "" : " "}{${v.key}}` })}
                  className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-100"
                >
                  {v.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400">Os campos roxos puxam os dados da promo e mudam sozinhos em cada arte.</p>
          </Section>

          <Section title="Fonte">
            <select
              value={t.fontFamily}
              onChange={(e) => {
                const weights = FONTS.find((f) => f.family === e.target.value)?.weights || ["400"]
                onChange({ fontFamily: e.target.value, fontWeight: weights.includes(t.fontWeight) ? t.fontWeight : weights[weights.length - 1] })
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[14px]"
              style={{ fontFamily: t.fontFamily }}
            >
              {FONTS.map((f) => (
                <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>
                  {f.family}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Tamanho" value={t.fontSize} min={8} max={600} onChange={(v) => onChange({ fontSize: v })} />
              <label className="flex flex-col gap-1 text-[11px] font-semibold text-gray-500">
                Peso
                <select value={t.fontWeight} onChange={(e) => onChange({ fontWeight: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[13px] text-gray-900">
                  {fontWeights.map((w) => (
                    <option key={w} value={w}>
                      {{ "400": "Normal", "500": "Médio", "600": "Semi", "700": "Negrito", "800": "Extra", "900": "Black" }[w] || w}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                value={t.align}
                onChange={(align) => onChange({ align })}
                options={[
                  { value: "left", label: <AlignLeft className="h-4 w-4" />, title: "Alinhar à esquerda" },
                  { value: "center", label: <AlignCenter className="h-4 w-4" />, title: "Centralizar" },
                  { value: "right", label: <AlignRight className="h-4 w-4" />, title: "Alinhar à direita" },
                ]}
              />
              <Btn onClick={() => onChange({ uppercase: !t.uppercase })} variant={t.uppercase ? "primary" : "default"} title="Caixa alta">
                AA
              </Btn>
              <Btn onClick={() => onChange({ fontStyle: t.fontStyle === "italic" ? "normal" : "italic" })} variant={t.fontStyle === "italic" ? "primary" : "default"} title="Itálico">
                <span className="italic">I</span>
              </Btn>
              <Btn
                onClick={() => onChange({ textDecoration: t.textDecoration === "line-through" ? "" : "line-through" })}
                variant={t.textDecoration === "line-through" ? "primary" : "default"}
                title="Riscado (preço &quot;de&quot;)"
              >
                <Strikethrough className="h-4 w-4" />
              </Btn>
            </div>
            {t.width > 0 && (
              <label className="flex items-center gap-2 text-[12px] text-gray-600">
                <input type="checkbox" checked={t.fit === "shrink"} onChange={(e) => onChange({ fit: e.target.checked ? "shrink" : undefined })} className="accent-amber-500" />
                Diminuir a fonte para caber em uma linha
              </label>
            )}
            {t.width <= 0 && (
              <p className="text-[11px] text-gray-400">Largura automática. Arraste as alças laterais para quebrar linha.</p>
            )}
          </Section>

          <Section title="Cor">
            <ColorPicker value={t.fill} onChange={(fill) => onChange({ fill })} />
          </Section>

          <Section title="Espaçamento e efeitos">
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Entre linhas" value={t.lineHeight} step={0.05} min={0.6} max={3} onChange={(v) => onChange({ lineHeight: v })} />
              <NumberField label="Entre letras" value={t.letterSpacing} step={0.5} min={-10} max={50} onChange={(v) => onChange({ letterSpacing: v })} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn onClick={() => onChange({ shadow: !t.shadow })} variant={t.shadow ? "primary" : "default"}>
                Sombra
              </Btn>
              <Btn
                onClick={() => onChange(t.strokeWidth ? { strokeWidth: 0 } : { stroke: "#000000", strokeWidth: Math.max(2, Math.round(t.fontSize / 20)) })}
                variant={t.strokeWidth ? "primary" : "default"}
              >
                Contorno
              </Btn>
            </div>
            {!!t.strokeWidth && <ColorPicker value={t.stroke || "#000000"} onChange={(stroke) => onChange({ stroke })} />}
          </Section>
        </>
      )}

      {(layer.type === "rect" || layer.type === "ellipse") && (
        <>
          <Section title="Preenchimento">
            <ColorPicker value={layer.fill} onChange={(fill) => onChange({ fill, gradient: undefined })} />
            {layer.type === "rect" && (
              <Btn
                onClick={() => onChange({ gradient: layer.gradient ? undefined : { from: "rgba(0,0,0,0)", to: "rgba(0,0,0,0.85)" } })}
                variant={layer.gradient ? "primary" : "default"}
              >
                Degradê escuro
              </Btn>
            )}
          </Section>
          {layer.type === "rect" && (
            <Slider label="Cantos arredondados" value={layer.cornerRadius || 0} min={0} max={Math.min(layer.width, layer.height) / 2} step={1} onChange={(cornerRadius) => onChange({ cornerRadius })} />
          )}
        </>
      )}

      {layer.type === "image" && (
        <Section title="Imagem">
          <div className="flex flex-wrap gap-2">
            <Segmented
              value={layer.fit}
              onChange={(fit) => onChange({ fit })}
              options={[
                { value: "cover", label: "Preencher" },
                { value: "contain", label: "Encaixar" },
                { value: "fill", label: "Esticar" },
              ]}
            />
          </div>
          {layer.role !== "photo" && photoUrl && (
            <Btn onClick={() => onChange({ src: photoUrl, role: "photo" })}>
              <ImageIcon className="h-4 w-4" /> Usar a foto do destino aqui
            </Btn>
          )}
          {layer.role === "photo" && <p className="text-[11px] text-gray-400">Esta é a foto do destino: troca junto quando você escolhe outra foto.</p>}
          <Slider label="Cantos arredondados" value={layer.cornerRadius} min={0} max={Math.min(layer.width, layer.height) / 2} step={1} onChange={(cornerRadius) => onChange({ cornerRadius })} />
        </Section>
      )}

      <Section title="Posição e tamanho">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={layer.x} onChange={(x) => onChange({ x })} />
          <NumberField label="Y" value={layer.y} onChange={(y) => onChange({ y })} />
          {layer.type !== "text" && <NumberField label="Largura" value={layer.width} min={10} onChange={(width) => onChange({ width })} />}
          {layer.type !== "text" && <NumberField label="Altura" value={layer.height} min={10} onChange={(height) => onChange({ height })} />}
          <NumberField label="Rotação" value={layer.rotation} suffix="°" onChange={(rotation) => onChange({ rotation })} />
        </div>
        <Slider label="Opacidade" value={layer.opacity} min={0.05} max={1} step={0.05} onChange={(opacity) => onChange({ opacity })} />
      </Section>
    </div>
  )
}
