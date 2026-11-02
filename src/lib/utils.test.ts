import { describe, expect, it } from "vitest"
import { getPriceNumber } from "@/lib/utils"

describe("getPriceNumber", () => {
  it("lê preço com ponto decimal", () => {
    expect(getPriceNumber("2843.83")).toBe(2843.83)
  })

  it("lê preço no formato brasileiro com R$ e separador de milhar", () => {
    expect(getPriceNumber("R$ 2.237,00")).toBe(2237)
  })
})
