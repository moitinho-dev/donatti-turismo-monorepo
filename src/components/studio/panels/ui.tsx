"use client"

import type React from "react"
import { BRAND_COLORS } from "../types"

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Btn({
  children,
  onClick,
  variant = "default",
  disabled,
  title,
  className = "",
  type = "button",
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "default" | "primary" | "ai" | "danger" | "ghost"
  disabled?: boolean
  title?: string
  className?: string
  type?: "button" | "submit"
}) {
  const styles = {
    default: "bg-white border border-gray-200 text-gray-700 hover:border-amber-400 hover:text-gray-900",
    primary: "bg-amber-500 text-white hover:bg-amber-400 shadow-sm",
    ai: "bg-violet-600 text-white hover:bg-violet-700 shadow-sm",
    danger: "bg-white border border-red-200 text-red-600 hover:bg-red-50",
    ghost: "text-gray-600 hover:bg-gray-100",
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isHex = /^#[0-9a-f]{6}$/i.test(value)
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {BRAND_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`Cor ${c}`}
          className={`h-7 w-7 rounded-full border transition-transform hover:scale-110 ${value.toLowerCase() === c.toLowerCase() ? "ring-2 ring-amber-500 ring-offset-1" : "border-gray-200"}`}
          style={{ background: c }}
        />
      ))}
      <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border border-gray-200" title="Outra cor">
        <span className="absolute inset-0" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }} />
        <input type="color" value={isHex ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
      </label>
    </div>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-semibold text-gray-500">
      {label}
      <span className="flex items-center rounded-lg border border-gray-200 bg-white focus-within:border-amber-400">
        <input
          type="number"
          value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = parseFloat(e.target.value)
            if (Number.isFinite(n)) onChange(n)
          }}
          className="w-full min-w-0 bg-transparent px-2 py-1.5 text-[13px] text-gray-900 outline-none"
        />
        {suffix && <span className="pr-2 text-[11px] text-gray-400">{suffix}</span>}
      </span>
    </label>
  )
}

export function Slider({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-semibold text-gray-500">
      <span className="flex justify-between">
        {label}
        <span className="text-gray-400">{Math.round(value * 100) / 100}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="accent-amber-500" />
    </label>
  )
}

export function Segmented<const T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: React.ReactNode; title?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-label={o.title}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-all ${value === o.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} aria-hidden="true" />
}
