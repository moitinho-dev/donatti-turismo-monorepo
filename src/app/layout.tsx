import type { Metadata } from "next"
import Script from "next/script"
import { GoogleTagManager } from "@next/third-parties/google"
import { Inter } from "next/font/google"
import "./globals.css"
import type { ReactNode } from "react"

import Providers from "./providers"
import { JsonLd } from "@/components/seo/JsonLd"
import { LOGO_IMAGE, OG_IMAGE, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site"

// Inter é mais performático e tem melhor legibilidade
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700']
})

// Componente funcional para o layout principal da aplicação

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Donatti Turismo | Pacotes de viagem saindo de Campo Grande e São Paulo",
    template: "%s | Donatti Turismo",
  },
  description:
    "Pacotes de viagem nacionais e internacionais com aéreo e hotel, saindo de Campo Grande e São Paulo. Parcelamento no cartão e atendimento humano no WhatsApp.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Donatti Turismo: pacotes de viagem com aéreo e hotel" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  // GTM & Analytics Configuration
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || "GTM-P3JPBSRM"
  const rdStationId = process.env.NEXT_PUBLIC_RDSTATION_ID
  const siteSchema = [
    {
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      "@id": `${SITE_URL}/#agencia`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl(LOGO_IMAGE),
      image: absoluteUrl(OG_IMAGE),
      telephone: "+55-67-99216-7694",
      email: "contato@donattiturismo.com.br",
      priceRange: "$$",
      areaServed: ["Campo Grande", "Mato Grosso do Sul", "São Paulo", "Brasil"],
      address: {
        "@type": "PostalAddress",
        streetAddress: "Avenida Tamandaré, 8 - Vila Planalto",
        addressLocality: "Campo Grande",
        addressRegion: "MS",
        postalCode: "79009-790",
        addressCountry: "BR",
      },
      sameAs: [
        "https://www.instagram.com/donattiturismo",
        "https://www.facebook.com/donattiturismo",
        "https://maps.app.goo.gl/xuzhiYXCPC2VE9Tp8",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#site`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "pt-BR",
      publisher: { "@id": `${SITE_URL}/#agencia` },
    },
  ]

  return (
    <html lang="pt-BR">
      <head>
        {rdStationId && (
          <Script id="rdstation-script" strategy="afterInteractive" src={`https://d335luupugsy2.cloudfront.net/js/loader-scripts/${rdStationId}-loader.js`} />
        )}

        {/* Analytics Event Delegator - Para data-attributes */}
        <Script id="analytics-delegator" strategy="afterInteractive">
          {`
            (function () {
              function safeParse(value) {
                if (!value) return null;
                try { return JSON.parse(value); } catch (e) { return null; }
              }
              function fire(eventName, params) {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
                if (typeof window.gtag === 'function') {
                  try { window.gtag('event', eventName, params || {}); } catch (e) {}
                }
                // RD Station custom event
                if (typeof window.RDStation === 'object' && typeof window.RDStation.event === 'function') {
                  try { window.RDStation.event(eventName, params || {}); } catch (e) {}
                }
              }
              document.addEventListener('click', function (e) {
                var target = e && e.target && e.target.closest ? e.target.closest('[data-analytics-event]') : null;
                if (!target) return;
                var eventName = target.getAttribute('data-analytics-event');
                if (!eventName) return;
                var params = safeParse(target.getAttribute('data-analytics-params')) || {};
                fire(eventName, params);
              }, true);
            })();
          `}
        </Script>
        {/* Google Tag Manager (Next.js third-party) */}
        <GoogleTagManager
          gtmId={gtmId}
          gtmScriptUrl={undefined}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased max-w-[2000px] mx-auto`}>
        {/* Google Tag Manager (noscript) - Fallback para usuários sem JS */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* Dados estruturados no HTML do servidor, para o Google ler sem executar JS */}
        <JsonLd data={siteSchema} />
        <Providers>{children}</Providers>

      </body>
    </html>
  )
}
