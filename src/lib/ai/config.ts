/**
 * Configuração da IA via AWS Bedrock.
 *
 * Credenciais (qualquer uma): AWS_BEARER_TOKEN_BEDROCK (chave de API do Bedrock) ou
 * AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (ou a cadeia padrão da AWS).
 * BEDROCK_REGION       região do Claude no Bedrock (padrão: AWS_REGION ou us-east-1)
 * BEDROCK_CLAUDE_MODEL modelo do Claude (padrão: anthropic.claude-opus-5-5)
 * NOVA_CANVAS_REGION   região do Nova Canvas (padrão: us-east-1; disponível em us-east-1, eu-west-1, ap-northeast-1)
 * AI_DISABLED=1        desliga todos os recursos de IA
 */

export const aiConfig = {
  region: process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-1",
  claudeModel: process.env.BEDROCK_CLAUDE_MODEL || "anthropic.claude-opus-5-5",
  novaRegion: process.env.NOVA_CANVAS_REGION || "us-east-1",
  novaModel: process.env.NOVA_CANVAS_MODEL || "amazon.nova-canvas-v1:0",
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
    super("IA não configurada: defina as credenciais da AWS Bedrock nas variáveis de ambiente")
  }
}

/** Mensagem útil para o painel a partir de erros do Bedrock (Claude ou Nova Canvas) */
export function describeAiError(error: unknown, fallback: string): { message: string; status: number } {
  if (error instanceof AiNotConfiguredError) return { message: error.message, status: 503 }
  const e = error as { status?: number; name?: string; $metadata?: { httpStatusCode?: number } }
  const status = e?.status ?? e?.$metadata?.httpStatusCode
  if (status === 401 || status === 403 || e?.name === "UnrecognizedClientException" || e?.name === "AccessDeniedException") {
    return {
      message: "A AWS recusou o acesso: confira as credenciais e se o modelo está liberado no Bedrock para esta região",
      status: 502,
    }
  }
  if (status === 429 || e?.name === "ThrottlingException") {
    return { message: "Muitas requisições à IA agora. Tente de novo em alguns segundos.", status: 429 }
  }
  return { message: fallback, status: 500 }
}
