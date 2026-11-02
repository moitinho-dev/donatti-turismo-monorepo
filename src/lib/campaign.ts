import { getPriceNumber } from "@/lib/utils"
import type { PublicPromo } from "@/components/home/RealTimePromos"

// Dados da campanha usados no servidor (JSON-LD) e na página (componente de cliente)

/** Também vira o FAQPage do JSON-LD da página */
export const campaignFaqs = [
  {
    q: "O desconto é real?",
    a: "Sim. O preço “de” é o valor praticado antes da campanha e o “por” já tem o desconto aplicado. Não precisa de cupom.",
  },
  {
    q: "O que é a Black November da Donatti?",
    a: "É a Black Friday da Donatti Turismo durando o mês de novembro inteiro: pacotes com aéreo e hotel com desconto, saindo de Campo Grande e São Paulo, com ofertas novas toda semana.",
  },
  {
    q: "Preciso viajar em novembro?",
    a: "Não. Você compra durante a campanha e viaja na data da oferta escolhida, que pode ser meses depois.",
  },
  {
    q: "Por que as ofertas esgotam?",
    a: "As tarifas são por lote, com poucos lugares por data. Quando o lote acaba, o preço sobe ou a oferta sai do ar.",
  },
  {
    q: "Posso parcelar?",
    a: "Sim. Cada oferta mostra em quantas vezes pode ser parcelada no cartão. Também aceitamos Pix e boleto.",
  },
  {
    q: "Não moro em Campo Grande nem em São Paulo. Posso comprar?",
    a: "Pode. As saídas principais são CGR e GRU, mas cotamos outras cidades pelo WhatsApp.",
  },
]

/** Desconto em % entre o "de" e o "por" (0 sem preço "de") */
export const discountOf = (promo: PublicPromo) => {
  const now = getPriceNumber(promo.VALOR)
  const before = promo.VALOR_ORIGINAL ? getPriceNumber(promo.VALOR_ORIGINAL) : 0
  return before > now && now > 0 ? Math.round((1 - now / before) * 100) : 0
}

