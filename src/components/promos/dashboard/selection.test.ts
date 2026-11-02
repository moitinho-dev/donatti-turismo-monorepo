import { describe, expect, it } from "vitest"
import type { PromoData } from "./types"
import { keepExisting, selectAllVisible, selectable, toggleSelection, unselectVisible } from "./selection"

const NOW = new Date(2026, 10, 2, 12)
const promo = (id: string, data = "10/12 até 17/12 de 2026"): PromoData => ({
  id,
  DESTINO: `Destino ${id}`,
  HOTEL: "Hotel",
  DATA_FORMATADA: data,
  VALOR: "1000",
})
const VENCIDA = "01/10 até 08/10 de 2026"

describe("selectable", () => {
  it("promo no prazo pode ser marcada", () => {
    expect(selectable(promo("a"), NOW)).toEqual({ ok: true, reason: null })
  })

  it("promo vencida não pode ser marcada e diz o motivo", () => {
    expect(selectable(promo("a", VENCIDA), NOW)).toEqual({ ok: false, reason: "Promoção vencida" })
  })
})

describe("toggleSelection", () => {
  it("adiciona no fim, na ordem em que foram marcadas", () => {
    expect(toggleSelection(toggleSelection(toggleSelection([], "c"), "a"), "b")).toEqual(["c", "a", "b"])
  })

  it("remove a que já estava marcada sem mexer na ordem das outras", () => {
    expect(toggleSelection(["c", "a", "b"], "a")).toEqual(["c", "b"])
  })
})

describe("selectAllVisible", () => {
  it("marca só as selecionáveis, depois das já marcadas", () => {
    const visible = [promo("a"), promo("b", VENCIDA), promo("c"), promo("d")]
    expect(selectAllVisible(["d", "x"], visible, NOW)).toEqual(["d", "x", "a", "c"])
  })

  it("sem nada novo devolve a mesma seleção", () => {
    expect(selectAllVisible(["a"], [promo("a")], NOW)).toEqual(["a"])
  })
})

describe("unselectVisible", () => {
  it("tira só as visíveis e mantém a ordem do resto", () => {
    expect(unselectVisible(["x", "a", "y", "c"], [promo("a"), promo("c")])).toEqual(["x", "y"])
  })
})

describe("keepExisting", () => {
  it("ignora ids que não estão mais na lista, mantendo a ordem", () => {
    expect(keepExisting(["c", "gone", "a"], [promo("a"), promo("c")])).toEqual(["c", "a"])
  })
})
