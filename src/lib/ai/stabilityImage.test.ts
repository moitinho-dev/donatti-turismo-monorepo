import sharp from "sharp"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { AiContentFilteredError } from "./config"
import * as mod from "./stabilityImage"

const { send, clientRegions } = vi.hoisted(() => ({ send: vi.fn(), clientRegions: [] as string[] }))

vi.mock("@aws-sdk/client-bedrock-runtime", () => ({
  BedrockRuntimeClient: class {
    constructor(opts: { region: string }) {
      clientRegions.push(opts.region)
    }
    send = send
  },
  InvokeModelCommand: class {
    input: unknown
    constructor(input: unknown) {
      this.input = input
    }
  },
}))

async function png(width: number, height: number) {
  return sharp({ create: { width, height, channels: 3, background: "#3366cc" } }).png().toBuffer()
}

let outPng: Buffer
function okResponse(image: Buffer = outPng) {
  return { body: new TextEncoder().encode(JSON.stringify({ images: [image.toString("base64")], finish_reasons: [null], seeds: [1] })) }
}
function lastCall(i = -1) {
  const cmd = send.mock.calls.at(i)![0] as { input: { modelId: string; body: string; contentType: string } }
  return { modelId: cmd.input.modelId, body: JSON.parse(cmd.input.body) as Record<string, unknown> }
}

beforeAll(async () => {
  outPng = await png(64, 64)
})
beforeEach(() => {
  process.env.AWS_BEARER_TOKEN_BEDROCK = "test-token"
  send.mockReset()
})
afterEach(() => {
  delete process.env.AWS_BEARER_TOKEN_BEDROCK
})

describe("parseStabilityResponse", () => {
  it("decodifica as imagens base64", () => {
    const [img] = mod.parseStabilityResponse(JSON.stringify({ images: [Buffer.from("abc").toString("base64")], finish_reasons: [null] }))
    expect(img.toString()).toBe("abc")
  })

  it("filtro de conteúdo lança AiContentFilteredError", () => {
    expect(() => mod.parseStabilityResponse(JSON.stringify({ images: [], finish_reasons: ["Filter reason: prompt"] }))).toThrow(
      AiContentFilteredError,
    )
    expect(() => mod.parseStabilityResponse(JSON.stringify({ images: ["eA=="], finish_reasons: ["Filter reason: output image"] }))).toThrow(
      AiContentFilteredError,
    )
  })

  it("sem imagem lança erro comum", () => {
    expect(() => mod.parseStabilityResponse(JSON.stringify({ images: [], finish_reasons: ["Inference error"] }))).toThrow(/Inference error/)
  })
})

describe("generateImage", () => {
  it("usa aspect_ratio do formato e uma chamada por imagem no Core em us-west-2", async () => {
    send.mockResolvedValue(okResponse())
    const images = await mod.generateImage("praia ao pôr do sol", "story", { count: 2 })
    expect(images).toHaveLength(2)
    expect(send).toHaveBeenCalledTimes(2)
    const { modelId, body } = lastCall()
    expect(modelId).toBe("stability.stable-image-core-v1:1")
    expect(body).toMatchObject({ prompt: "praia ao pôr do sol", aspect_ratio: "9:16", output_format: "png" })
    expect(body.negative_prompt).toMatch(/watermark/)
    expect(body).not.toHaveProperty("width")
    expect(clientRegions).toContain("us-west-2")
  })

  it("mapeia os formatos para proporções suportadas", () => {
    expect(mod.buildGenerateBody("x", "feed").aspect_ratio).toBe("4:5")
    expect(mod.buildGenerateBody("x", "square").aspect_ratio).toBe("1:1")
    expect(mod.buildGenerateBody("x", "landscape").aspect_ratio).toBe("16:9")
  })

  it("devolve as que deram certo e só falha se todas falharem", async () => {
    send.mockResolvedValueOnce(okResponse()).mockRejectedValueOnce(new Error("boom"))
    expect(await mod.generateImage("x", "square", { count: 2 })).toHaveLength(1)
    send.mockRejectedValue(new Error("boom"))
    await expect(mod.generateImage("x", "square", { count: 2 })).rejects.toThrow("boom")
  })
})

describe("extendToFormat", () => {
  it("calcula as bordas para chegar à proporção sem cortar", () => {
    expect(mod.outpaintExtents(1000, 1000, "story")).toEqual({ left: 0, right: 0, up: 389, down: 389 })
    expect(mod.outpaintExtents(720, 1280, "square")).toEqual({ left: 280, right: 280, up: 0, down: 0 })
    const e = mod.outpaintExtents(100, 2000, "landscape")
    expect(e.left).toBeLessThanOrEqual(2000)
    expect(e.right).toBeLessThanOrEqual(2000)
  })

  it("envia imagem + bordas ao perfil de outpaint e devolve no tamanho do formato", async () => {
    send.mockResolvedValue(okResponse(await png(64, 114)))
    const [out] = await mod.extendToFormat(await png(200, 200), "story", "mar azul")
    const { modelId, body } = lastCall()
    expect(modelId).toBe("us.stability.stable-outpaint-v1:0")
    expect(body).toMatchObject({ left: 0, right: 0, up: 78, down: 78, prompt: "mar azul", output_format: "png" })
    expect(typeof body.image).toBe("string")
    const meta = await sharp(out).metadata()
    expect([meta.width, meta.height]).toEqual([720, 1280])
  })

  it("não chama a IA se a foto já está na proporção", async () => {
    const [out] = await mod.extendToFormat(await png(100, 100), "square")
    expect(send).not.toHaveBeenCalled()
    expect((await sharp(out).metadata()).width).toBe(100)
  })
})

describe("removeBackground", () => {
  it("envia a imagem em base64 ao perfil de remover fundo", async () => {
    send.mockResolvedValue(okResponse())
    const images = await mod.removeBackground(await png(64, 64))
    expect(images).toHaveLength(1)
    const { modelId, body } = lastCall()
    expect(modelId).toBe("us.stability.stable-image-remove-background-v1:0")
    expect(Object.keys(body).sort()).toEqual(["image", "output_format"])
  })
})

describe("editArea", () => {
  it("usa search_prompt para a área e prompt para a troca", async () => {
    send.mockResolvedValue(okResponse())
    await mod.editArea(await png(64, 64), "o céu nublado", "céu azul limpo")
    const { modelId, body } = lastCall()
    expect(modelId).toBe("us.stability.stable-image-search-replace-v1:0")
    expect(body).toMatchObject({ search_prompt: "o céu nublado", prompt: "céu azul limpo", output_format: "png" })
  })

  it("sem prompt pede para apagar o objeto (prompt é obrigatório no modelo)", () => {
    const body = mod.buildSearchReplaceBody("b64", "as pessoas na areia")
    expect(body.search_prompt).toBe("as pessoas na areia")
    expect(body.prompt.length).toBeGreaterThan(0)
  })

  it("sem credencial lança AiNotConfiguredError", async () => {
    delete process.env.AWS_BEARER_TOKEN_BEDROCK
    const saved = { ...process.env }
    for (const k of ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_PROFILE", "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI", "AWS_WEB_IDENTITY_TOKEN_FILE"]) delete process.env[k]
    await expect(mod.editArea(await png(64, 64), "céu")).rejects.toThrow(/não está ligada/)
    Object.assign(process.env, saved)
  })
})
