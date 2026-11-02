import { describe, expect, it } from "vitest"
import type { PromoData } from "./types"
import {
  bulkPublishNotice,
  deleteConfirm,
  hiddenCount,
  keepExisting,
  selectAllVisible,
  selectable,
  toggleSelection,
  unpublishConfirm,
  unselectVisible,
} from "./selection"

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

describe("textos das ações em lote", () => {
  it("conta as marcadas fora do filtro atual", () => {
    expect(hiddenCount(["a", "b", "c"], ["a"])).toBe(2)
    expect(hiddenCount(["a"], ["a", "b"])).toBe(0)
    expect(hiddenCount(["a"], null)).toBe(0)
  })

  it("Tirar do site pergunta antes, no singular e no plural", () => {
    expect(unpublishConfirm(1)).toBe("Tirar 1 promoção do site?")
    expect(unpublishConfirm(3)).toBe("Tirar 3 promoções do site?")
  })

  it("Excluir diz quantas não aparecem no filtro", () => {
    expect(deleteConfirm(3, 0)).toBe("Excluir 3 promoções? Isso não pode ser desfeito.")
    expect(deleteConfirm(1, 0)).toBe("Excluir 1 promoção? Isso não pode ser desfeito.")
    expect(deleteConfirm(3, 2)).toBe("Excluir 3 promoções? 2 delas não aparecem no filtro atual. Isso não pode ser desfeito.")
    expect(deleteConfirm(3, 1)).toBe("Excluir 3 promoções? 1 delas não aparece no filtro atual. Isso não pode ser desfeito.")
    expect(deleteConfirm(1, 1)).toBe("Excluir 1 promoção? Ela não aparece no filtro atual. Isso não pode ser desfeito.")
  })

  it("Publicar no site: Google que falhou conta à parte, a promo segue publicada no site", () => {
    expect(bulkPublishNotice(3, [], [])).toEqual({ type: "success", text: "3 publicadas no site." })
    expect(bulkPublishNotice(3, [], ["Maceió: Conecte o Google no painel antes de publicar", "Natal: x"])).toEqual({
      type: "error",
      text: "3 publicadas no site. Google falhou em 2: Maceió: Conecte o Google no painel antes de publicar.",
    })
    expect(bulkPublishNotice(1, ["Sem permissão."], ["Natal: x"])).toEqual({
      type: "error",
      text: "1 publicada no site; 1 com erro: Sem permissão. Google falhou em 1: Natal: x.",
    })
  })
})
