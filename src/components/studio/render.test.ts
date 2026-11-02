import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./images", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./images")>()
  return { ...actual, loadImage: vi.fn() }
})
// Konva de mentira: o teste só olha quais camadas entram e o que sai no fim
vi.mock("konva", () => {
  class Node {
    attrs: Record<string, unknown>
    children: Node[] = []
    constructor(attrs: Record<string, unknown> = {}) {
      this.attrs = attrs
    }
    add(n: Node) {
      this.children.push(n)
    }
    draw() {}
    destroy() {}
    toDataURL() {
      return "data:image/jpeg;base64,OK"
    }
  }
  const Konva = { Stage: Node, Layer: Node, Rect: Node, Text: Node, Ellipse: Node, Image: Node, Group: Node }
  return { default: Konva }
})

import { ImageLoadError, loadImage } from "./images"
import { renderDoc } from "./render"
import type { ImageLayer, StudioDoc } from "./types"

const image = (id: string, src: string, extra: Partial<ImageLayer> = {}): ImageLayer => ({
  id,
  name: id,
  type: "image",
  src,
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotation: 0,
  opacity: 1,
  fit: "cover",
  cornerRadius: 0,
  ...extra,
})

const doc = (...layers: ImageLayer[]): StudioDoc => ({ version: 1, format: "landscape", width: 1200, height: 628, background: "#000", layers })

const FOTO = "https://cors-bloqueado.example/foto.jpg"
const LOGO = "/assets/logo.png"
const okImg = { naturalWidth: 100, naturalHeight: 100 } as HTMLImageElement

beforeEach(() => {
  vi.clearAllMocks()
  // Só o mínimo de DOM que renderDoc usa (folha de fontes e o container fora da tela)
  const el = () => ({ style: {} as Record<string, string>, remove() {}, onload: null as null | (() => void) })
  vi.stubGlobal("document", {
    createElement: el,
    head: { appendChild: (l: { onload?: () => void }) => l.onload?.() },
    body: { appendChild() {} },
    fonts: { load: async () => [] },
  })
  vi.mocked(loadImage).mockImplementation(async (src: string) => (src === FOTO ? null : okImg))
})

afterEach(() => vi.unstubAllGlobals())

describe("renderDoc", () => {
  it("por padrão pula a foto que não carregou e devolve a imagem (como sempre foi)", async () => {
    await expect(renderDoc(doc(image("foto", FOTO), image("logo", LOGO)), {})).resolves.toBe("data:image/jpeg;base64,OK")
  })

  it("strict: foto que não carregou lança ImageLoadError com o endereço dela", async () => {
    const err = await renderDoc(doc(image("foto", FOTO), image("logo", LOGO)), {}, { strict: true }).catch((e) => e)
    expect(err).toBeInstanceOf(ImageLoadError)
    expect((err as ImageLoadError).srcs).toEqual([FOTO])
  })

  it("strict: com todas as imagens carregadas desenha normalmente", async () => {
    await expect(renderDoc(doc(image("logo", LOGO)), {}, { strict: true })).resolves.toBe("data:image/jpeg;base64,OK")
  })

  it("strict: camada escondida que não carregou não impede (ela nem é desenhada)", async () => {
    await expect(renderDoc(doc(image("foto", FOTO, { hidden: true }), image("logo", LOGO)), {}, { strict: true })).resolves.toBe(
      "data:image/jpeg;base64,OK",
    )
  })
})
