import { AnthropicBedrockMantle } from "@anthropic-ai/bedrock-sdk"
import type Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { z } from "zod/v4"
import { AiNotConfiguredError, aiConfig, isAiConfigured } from "./config"

let client: AnthropicBedrockMantle | null = null

function getClient() {
  if (!isAiConfigured()) throw new AiNotConfiguredError()
  client ??= new AnthropicBedrockMantle({ awsRegion: aiConfig.region })
  return client
}

export class AiRefusalError extends Error {}

// ---------------------------------------------------------------------------
// Extração de promo a partir de PDF, print ou texto colado
// ---------------------------------------------------------------------------

const nullableString = z.string().nullable()

export const ExtractedPromoSchema = z.object({
  DESTINO: nullableString.describe("Cidade ou região de destino, ex.: 'Maceió', 'Cancún'"),
  HOTEL: nullableString.describe("Nome do hotel, resort ou navio"),
  DATA_IDA: nullableString.describe("Data de ida no formato AAAA-MM-DD"),
  DATA_VOLTA: nullableString.describe("Data de volta no formato AAAA-MM-DD"),
  NUMERO_DE_NOITES: z.number().int().nullable(),
  VALOR_TOTAL: z.number().nullable().describe("Preço total em reais como aparece no material, sem dividir"),
  VALOR_E_POR_PESSOA: z
    .boolean()
    .nullable()
    .describe("true se o material diz explicitamente que o preço é por pessoa; false se é para o casal/apto duplo"),
  VALOR_ORIGINAL: z.number().nullable().describe("Preço 'de' riscado, se o material mostrar um desconto"),
  PARCELAS: z.number().int().nullable(),
  REGIME: z.enum(["COM_CAFE", "SEM_CAFE", "MEIA_PENSAO", "PENSAO_COMPLETA", "ALL_INCLUSIVE"]).nullable(),
  AEREO: z.boolean().nullable().describe("true se inclui passagem aérea"),
  SAIDA_CAMPO_GRANDE: z.boolean().nullable(),
  SAIDA_SAO_PAULO: z.boolean().nullable(),
  OUTRAS_SAIDAS: z.array(z.string()).describe("Outras cidades de saída mencionadas"),
  INCLUSOES: z.array(z.string()).describe("Itens inclusos: traslado, passeios, seguro..."),
  OBSERVACOES: nullableString.describe("Algo que o agente precisa conferir: ambiguidades, várias datas, taxas à parte"),
})

export type ExtractedPromo = z.infer<typeof ExtractedPromoSchema>

const EXTRACTION_SYSTEM = `Você extrai dados de promoções de pacotes de viagem para uma agência de turismo de Campo Grande/MS.
O material vem de operadoras (PDF, print de tela ou texto copiado do WhatsApp/e-mail) e está em português.

Regras:
- Preencha só o que estiver no material. Campo ausente ou ilegível = null. Não invente hotel, data nem preço.
- Preços brasileiros: "R$ 5.000,00" = 5000; "10x de R$ 500" = total 5000 com 10 parcelas.
- VALOR_TOTAL é o número como aparece. Indique em VALOR_E_POR_PESSOA se o material deixa claro que é por pessoa.
- Datas sem ano: use o próximo ano em que a data ainda não passou, considerando a data de hoje informada.
- Se houver várias datas ou hotéis, extraia a primeira opção e descreva as outras em OBSERVACOES.`

export type ExtractionInput =
  | { kind: "pdf"; base64: string }
  | { kind: "image"; base64: string; mediaType: "image/png" | "image/jpeg" | "image/webp" }
  | { kind: "text"; text: string }

export async function extractPromo(input: ExtractionInput, today = new Date()): Promise<ExtractedPromo> {
  const content: Anthropic.ContentBlockParam[] = []
  if (input.kind === "pdf") {
    content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: input.base64 } })
  } else if (input.kind === "image") {
    content.push({ type: "image", source: { type: "base64", media_type: input.mediaType, data: input.base64 } })
  } else {
    content.push({ type: "text", text: `<material>\n${input.text}\n</material>` })
  }
  content.push({
    type: "text",
    text: `Hoje é ${today.toISOString().slice(0, 10)}. Extraia os dados da promoção acima.`,
  })

  const response = await getClient().messages.parse({
    model: aiConfig.claudeModel,
    max_tokens: 4000,
    system: EXTRACTION_SYSTEM,
    output_config: { effort: "medium", format: zodOutputFormat(ExtractedPromoSchema) },
    messages: [{ role: "user", content }],
  })

  if (response.stop_reason === "refusal") throw new AiRefusalError("A IA recusou processar este material")
  if (!response.parsed_output) throw new Error("A IA não conseguiu ler este material")
  return response.parsed_output
}

// ---------------------------------------------------------------------------
// Textos de marketing (título, legenda, hashtags) para uma promo
// ---------------------------------------------------------------------------

export const PromoCopySchema = z.object({
  headlines: z.array(z.string()).describe("3 títulos curtos para a arte, até 32 caracteres cada"),
  subheadline: z.string().describe("Uma linha de apoio, até 60 caracteres"),
  caption: z.string().describe("Legenda para Instagram, 3 a 6 linhas, com chamada para o WhatsApp no final"),
  hashtags: z.array(z.string()).describe("6 a 10 hashtags sem o #"),
  siteDescription: z.string().describe("Descrição para o card do site, até 160 caracteres"),
})

export type PromoCopy = z.infer<typeof PromoCopySchema>

const COPY_SYSTEM = `Você escreve textos de venda da Donatti Turismo, agência de Campo Grande/MS com atendimento humano pelo WhatsApp.
Tom: próximo, direto, animado sem exagero. Português do Brasil.
Regras:
- Use só os dados informados. Não prometa nada que não esteja nos dados (preço garantido, cancelamento grátis, "últimas vagas", "sem juros").
- Destaque destino, o que está incluso e a parcela.
- Sem emojis em excesso: no máximo 3 na legenda e nenhum nos títulos.`

export async function writePromoCopy(promo: Record<string, unknown>, tone?: string): Promise<PromoCopy> {
  const response = await getClient().messages.parse({
    model: aiConfig.claudeModel,
    max_tokens: 4000,
    system: COPY_SYSTEM,
    output_config: { effort: "medium", format: zodOutputFormat(PromoCopySchema) },
    messages: [
      {
        role: "user",
        content: `Dados da promoção:\n${JSON.stringify(promo, null, 2)}${tone ? `\n\nPedido do agente: ${tone}` : ""}`,
      },
    ],
  })

  if (response.stop_reason === "refusal") throw new AiRefusalError("A IA recusou escrever este texto")
  if (!response.parsed_output) throw new Error("A IA não conseguiu escrever o texto")
  return response.parsed_output
}
