// Tipos para Google Tag Manager e Google Analytics 4

declare global {
  interface Window {
    dataLayer: DataLayerEvent[]
    gtag: Gtag.Gtag
  }
}

export interface DataLayerEvent {
  event?: string
  [key: string]: unknown
}

export namespace Gtag {
  type EventNames =
    | "page_view"
    | "purchase"
    | "begin_checkout"
    | "add_to_cart"
    | "view_item"
    | "generate_lead"
    | "sign_up"
    | "login"
    | "search"
    | "select_content"
    | "share"
    // Eventos customizados Donatti
    | "whatsapp_click"
    | "lead_form_submit"
    | "rdstation_lead"
    | "select_package"
    | "select_destination"
    | "catalog_filter"
    | "cta_click"
    | "phone_click"

  interface EventParams {
    // Parâmetros padrão GA4
    page_title?: string
    page_location?: string
    page_path?: string
    send_to?: string
    // Parâmetros customizados
    location?: string
    destination?: string
    destino?: string
    price?: number | string
    nights?: number | string
    hotel?: string
    query?: string
    chip?: string
    label?: string
    name?: string
    email?: string
    phone?: string
    period?: string
    category?: string
    [key: string]: unknown
  }

  interface ConfigParams {
    page_title?: string
    page_path?: string
    send_page_view?: boolean
    cookie_domain?: string
    cookie_flags?: string
    transport_url?: string // URL do GTM Server-side
    first_party_collection?: boolean
    [key: string]: unknown
  }

  type Gtag = {
    (command: "config", targetId: string, config?: ConfigParams): void
    (command: "event", eventName: EventNames | string, eventParams?: EventParams): void
    (command: "js", date: Date): void
    (command: "set", params: Record<string, unknown>): void
    (command: "consent", action: "default" | "update", params: Record<string, string>): void
  }
}

export {}
