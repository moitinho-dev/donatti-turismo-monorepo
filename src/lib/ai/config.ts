/**
 * Configuração da IA via AWS Bedrock.
 *
 * Credenciais (qualquer uma): AWS_BEARER_TOKEN_BEDROCK (chave de API do Bedrock) ou
 * AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (ou a cadeia padrão da AWS).
 *
 * Textos (Claude):
 * BEDROCK_REGION         região do Claude (padrão: AWS_REGION ou us-east-1)
 * BEDROCK_CLAUDE_MODEL   perfil de inferência do Claude (padrão: us.anthropic.claude-opus-5-5).
 *                        Os modelos novos do Claude só rodam por perfil de inferência: um id puro
 *                        "anthropic.*" ganha o prefixo "us." automaticamente.
 *
 * Imagens (Stability AI no Bedrock):
 * STABILITY_IMAGE_MODEL  modelo de geração (padrão: stability.stable-image-core-v1:1;
 *                        alternativas: stability.stable-image-ultra-v1:1, stability.sd3-5-large-v1:0)
 * STABILITY_IMAGE_REGION região da geração (padrão: us-west-2; o Core não existe em us-east-1)
 * STABILITY_EDIT_REGION  região das edições (estender, remover fundo, trocar área), que usam
 *                        perfis "us.stability.*" (padrão: us-west-2)
 *
 * AI_DISABLED=1          desliga todos os recursos de IA
 *
 * NOVA_CANVAS_REGION / NOVA_CANVAS_MODEL não são mais usadas (o Nova Canvas saiu do Bedrock);
 * se ainda estiverem definidas, são ignoradas.
 */

/** Perfis de inferência entre regiões começam com o prefixo geográfico */
const PROFILE_PREFIX = /^(us|eu|apac|global|us-gov|jp|au|ca)\./

/** Converte um id puro do Claude ("anthropic.claude-...") no perfil de inferência "us.anthropic.claude-..." */
export function normalizeClaudeModelId(model: string | undefined): string {
  const id = (model || "").trim()
  if (!id) return "us.anthropic.claude-opus-5-5"
  if (id.startsWith("anthropic.") && !PROFILE_PREFIX.test(id)) return `us.${id}`
  return id
}

export const aiConfig = {
  region: process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-1",
  claudeModel: normalizeClaudeModelId(process.env.BEDROCK_CLAUDE_MODEL),
  imageModel: process.env.STABILITY_IMAGE_MODEL || "stability.stable-image-core-v1:1",
  imageRegion: process.env.STABILITY_IMAGE_REGION || "us-west-2",
  editRegion: process.env.STABILITY_EDIT_REGION || "us-west-2",
  outpaintModel: "us.stability.stable-outpaint-v1:0",
  removeBackgroundModel: "us.stability.stable-image-remove-background-v1:0",
  searchReplaceModel: "us.stability.stable-image-search-replace-v1:0",
}

/** Há credencial da AWS no ambiente? (não garante permissão no Bedrock, só que vale tentar) */
export function isAiConfigured() {
  if (process.env.AI_DISABLED === "1") return false
  return Boolean(
    process.env.AWS_BEARER_TOKEN_BEDROCK ||
      (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
      process.env.AWS_PROFILE ||
      process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
      process.env.AWS_WEB_IDENTITY_TOKEN_FILE,
  )
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("A IA ainda não está ligada. Peça ao administrador do sistema para ativar.")
  }
}

/** O filtro de conteúdo do modelo barrou o pedido ou a imagem gerada */
export class AiContentFilteredError extends Error {
  constructor(detail?: string) {
    super(`Conteúdo bloqueado pelo filtro da IA${detail ? `: ${detail}` : ""}`)
  }
}

export const AI_MESSAGES = {
  filtered: "A IA recusou esse pedido. Tente outra descrição.",
  imageFailed: "Não deu para gerar a imagem agora. Tente de novo em alguns minutos.",
  denied: "A IA não está disponível agora. Avise o administrador do sistema.",
  throttled: "Muitos pedidos à IA agora. Tente de novo em alguns segundos.",
}

/**
 * Mensagem para o painel a partir de erros do Bedrock (Claude ou Stability), sem termos técnicos.
 * O erro original vai para o log do servidor; o usuário vê só o que pode fazer.
 */
export function describeAiError(error: unknown, fallback: string): { message: string; status: number } {
  if (error instanceof AiNotConfiguredError) return { message: error.message, status: 503 }
  if (error instanceof AiContentFilteredError) return { message: AI_MESSAGES.filtered, status: 422 }
  const e = error as { status?: number; name?: string; message?: string; $metadata?: { httpStatusCode?: number } }
  const status = e?.status ?? e?.$metadata?.httpStatusCode
  if (typeof e?.message === "string" && /content filter|filter reason|moderation|blocked by/i.test(e.message)) {
    return { message: AI_MESSAGES.filtered, status: 422 }
  }
  if (status === 401 || status === 403 || e?.name === "UnrecognizedClientException" || e?.name === "AccessDeniedException") {
    return { message: AI_MESSAGES.denied, status: 502 }
  }
  if (status === 429 || e?.name === "ThrottlingException") {
    return { message: AI_MESSAGES.throttled, status: 429 }
  }
  return { message: fallback, status: 500 }
}
