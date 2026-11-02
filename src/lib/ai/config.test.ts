import { describe, expect, it } from "vitest"
import { AI_MESSAGES, AiContentFilteredError, describeAiError, normalizeClaudeModelId } from "./config"

describe("normalizeClaudeModelId", () => {
  it("usa o perfil us.anthropic.claude-opus-5-5 por padrão", () => {
    expect(normalizeClaudeModelId(undefined)).toBe("us.anthropic.claude-opus-5-5")
    expect(normalizeClaudeModelId("  ")).toBe("us.anthropic.claude-opus-5-5")
  })

  it("prefixa ids puros anthropic.* com us.", () => {
    expect(normalizeClaudeModelId("anthropic.claude-opus-5-5")).toBe("us.anthropic.claude-opus-5-5")
    expect(normalizeClaudeModelId(" anthropic.claude-sonnet-5-5 ")).toBe("us.anthropic.claude-sonnet-5-5")
  })

  it("mantém perfis e ARNs como vieram", () => {
    expect(normalizeClaudeModelId("us.anthropic.claude-opus-5-5")).toBe("us.anthropic.claude-opus-5-5")
    expect(normalizeClaudeModelId("global.anthropic.claude-opus-5-5")).toBe("global.anthropic.claude-opus-5-5")
    expect(normalizeClaudeModelId("eu.anthropic.claude-opus-5-5")).toBe("eu.anthropic.claude-opus-5-5")
    const arn = "arn:aws:bedrock:us-east-1:123:application-inference-profile/abc"
    expect(normalizeClaudeModelId(arn)).toBe(arn)
  })
})

describe("describeAiError", () => {
  it("filtro de conteúdo vira mensagem amigável 422", () => {
    expect(describeAiError(new AiContentFilteredError("Filter reason: prompt"), "x")).toEqual({ message: AI_MESSAGES.filtered, status: 422 })
    expect(describeAiError(new Error("Your request was blocked by our content filters"), "x").status).toBe(422)
  })

  it("acesso negado não cita AWS/Bedrock", () => {
    const r = describeAiError({ name: "AccessDeniedException", $metadata: { httpStatusCode: 403 } }, "x")
    expect(r.status).toBe(502)
    expect(r.message).not.toMatch(/AWS|Bedrock|Nova/i)
  })

  it("erro desconhecido usa o fallback (não vaza a mensagem do provedor)", () => {
    const r = describeAiError(new Error("This model version has reached the end of its life"), AI_MESSAGES.imageFailed)
    expect(r).toEqual({ message: AI_MESSAGES.imageFailed, status: 500 })
  })
})
