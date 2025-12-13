import type { Gtag } from "@/types/gtm"

export type AnalyticsParams = Record<string, unknown>

// Interface para conversões do RD Station
export interface RDStationConversion {
  conversion_identifier: string
  email?: string
  name?: string
  personal_phone?: string
  cf_destination?: string
  cf_period?: string
  traffic_source?: string
  tags?: string[]
}

// Tipos para os eventos customizados
export type CustomEventName =
  | "whatsapp_click"
  | "lead_form_submit"
  | "rdstation_lead"
  | "select_package"
  | "select_destination"
  | "catalog_filter"
  | "cta_click"
  | "phone_click"
  | "page_view"
  | "generate_lead"
  | "begin_checkout"
  | "purchase"

// Extensão da interface Window para incluir RD Station
declare global {
  interface Window {
    RDStation?: {
      event: (eventName: string, params: Record<string, unknown>) => void
      conversion: (data: RDStationConversion) => void
    }
  }
}

/**
 * Dispara um evento para GA4, GTM dataLayer e RD Station
 * @param eventName Nome do evento
 * @param params Parâmetros do evento
 */
export function trackEvent(eventName: CustomEventName | string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return

  const win = window as typeof window & {
    dataLayer?: unknown[]
    gtag?: Gtag.Gtag
    RDStation?: Window["RDStation"]
  }

  // Push para dataLayer (GTM)
  win.dataLayer = win.dataLayer || []
  win.dataLayer.push({ event: eventName, ...params })

  // Disparo para gtag (GA4)
  if (typeof win.gtag === "function") {
    try {
      win.gtag("event", eventName, params as Gtag.EventParams)
    } catch {
      // silently ignore
    }
  }

  // Disparo para RD Station (se disponível)
  if (win.RDStation && typeof win.RDStation.event === "function") {
    try {
      win.RDStation.event(eventName, params)
    } catch {
      // silently ignore
    }
  }
}

/**
 * Envia uma conversão para o RD Station Marketing
 * @param data Dados da conversão
 */
export function trackRDStationConversion(data: RDStationConversion) {
  if (typeof window === "undefined") return

  const win = window as typeof window & {
    RDStation?: Window["RDStation"]
    dataLayer?: unknown[]
  }

  // Push para dataLayer também
  win.dataLayer = win.dataLayer || []
  win.dataLayer.push({
    event: "rdstation_conversion",
    ...data,
  })

  // Envio direto para RD Station
  if (win.RDStation && typeof win.RDStation.conversion === "function") {
    try {
      win.RDStation.conversion(data)
    } catch {
      // silently ignore
    }
  }
}

/**
 * Rastreia um lead de formulário (GA4 + RD Station)
 * @param leadData Dados do lead
 */
export function trackLead(leadData: {
  name: string
  email: string
  phone: string
  destination?: string
  period?: string
  source?: string
}) {
  // Evento GA4
  trackEvent("generate_lead", {
    currency: "BRL",
    value: 0,
    ...leadData,
  })

  // Evento customizado para tracking interno
  trackEvent("lead_form_submit", leadData)

  // Conversão RD Station
  trackRDStationConversion({
    conversion_identifier: "formulario-contato",
    email: leadData.email,
    name: leadData.name,
    personal_phone: leadData.phone,
    cf_destination: leadData.destination,
    cf_period: leadData.period,
    traffic_source: leadData.source || document.referrer,
    tags: ["site", "lead"],
  })
}

/**
 * Rastreia clique no WhatsApp
 * @param location Localização do botão (hero, modal, floating, etc)
 * @param destination Destino de interesse (opcional)
 */
export function trackWhatsAppClick(location: string, destination?: string) {
  trackEvent("whatsapp_click", {
    location,
    destination,
  })

  // Conversão RD Station para WhatsApp
  trackRDStationConversion({
    conversion_identifier: "whatsapp-click",
    cf_destination: destination,
    tags: ["whatsapp", location],
  })
}

/**
 * Rastreia seleção de pacote
 * @param packageData Dados do pacote
 */
export function trackPackageSelection(packageData: {
  destino: string
  price?: number | string
  nights?: number | string
  hotel?: string
}) {
  trackEvent("select_package", packageData)
}

/**
 * Rastreia page view (útil para SPAs)
 * @param pagePath Caminho da página
 * @param pageTitle Título da página
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  if (typeof window === "undefined") return

  const win = window as typeof window & {
    gtag?: Gtag.Gtag
    dataLayer?: unknown[]
  }

  win.dataLayer = win.dataLayer || []
  win.dataLayer.push({
    event: "page_view",
    page_path: pagePath,
    page_title: pageTitle || document.title,
  })

  if (typeof win.gtag === "function") {
    try {
      win.gtag("event", "page_view", {
        page_path: pagePath,
        page_title: pageTitle || document.title,
      })
    } catch {
      // silently ignore
    }
  }
}

/**
 * Define consent mode (LGPD compliance)
 * @param granted Se o usuário concedeu permissão
 */
export function setConsentMode(granted: boolean) {
  if (typeof window === "undefined") return

  const win = window as typeof window & {
    gtag?: Gtag.Gtag
  }

  if (typeof win.gtag === "function") {
    try {
      win.gtag("consent", "update", {
        ad_storage: granted ? "granted" : "denied",
        analytics_storage: granted ? "granted" : "denied",
        ad_user_data: granted ? "granted" : "denied",
        ad_personalization: granted ? "granted" : "denied",
      })
    } catch {
      // silently ignore
    }
  }
}
