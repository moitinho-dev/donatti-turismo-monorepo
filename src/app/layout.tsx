import Script from "next/script"
import { GoogleTagManager } from "@next/third-parties/google"
import { Inter } from "next/font/google"
import "./globals.css"
import type { ReactNode } from "react"

import Providers from "./providers"

// Inter é mais performático e tem melhor legibilidade
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700']
})

// Componente funcional para o layout principal da aplicação
export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  // GTM & Analytics Configuration
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || "GTM-P3JPBSRM"
  const gtmServerUrl = process.env.NEXT_PUBLIC_GTM_SERVER_URL || ""
  const travelAgencySchema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Donatti Turismo",
    url: "https://donattiturismo.com.br",
    logo: "https://donattiturismo.com.br/favicon.svg",
    telephone: "+55 67 99216-7694",
    email: "contato@donattiturismo.com.br",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Avenida Tamandaré, 8 - Vila Planalto",
      addressLocality: "Campo Grande",
      addressRegion: "MS",
      postalCode: "79009-790",
      addressCountry: "BR",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "200",
    },
    sameAs: [
      "https://www.instagram.com/donattiturismo",
      "https://www.facebook.com/donattiturismo",
      "https://maps.app.goo.gl/xuzhiYXCPC2VE9Tp8",
    ],
  }

  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/* SEO Meta Tags */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Donatti Turismo </title>
        <meta name="description" content="Aproveite a Black Friday Donatti Turismo! Até 50% de desconto em pacotes de viagem selecionados, parcelamento em até 12x sem juros e suporte 24/7. Garanta sua próxima aventura!" />
        <meta name="keywords" content="black friday viagens, pacotes de viagem com desconto, parcelamento 12x sem juros, agência de viagens, turismo" />

        {/* Open Graph */}
        <meta property="og:title" content="Black Friday Donatti Turismo: Até 50% OFF em Pacotes de Viagem" />
        <meta property="og:description" content="Sua próxima aventura com até 50% OFF e 12x sem juros. Ofertas válidas apenas na Black Friday!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://donattiturismo.com.br" />
        <meta property="og:image" content="https://donattiturismo.com.br/og-image.jpg" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Black Friday Donatti Turismo: Até 50% OFF" />
        <meta name="twitter:description" content="Pacotes de viagem com até 50% de desconto e 12x sem juros!" />
        <meta name="twitter:image" content="https://donattiturismo.com.br/twitter-image.jpg" />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

        {/* RD Station Marketing - Script de Integração */}
        <Script id="rdstation-script" strategy="afterInteractive">
          {`
            (function() {
              var rdStationId = 'YOUR_RD_STATION_ID';
              var script = document.createElement('script');
              script.src = 'https://d335luupugsy2.cloudfront.net/js/loader-scripts/' + rdStationId + '-loader.js';
              script.async = true;
              document.head.appendChild(script);
            })();
          `}
        </Script>

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
        <Script
          id="travel-agency-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(travelAgencySchema) }}
        />

        {/* Google Tag Manager (Next.js third-party) */}
        <GoogleTagManager
          gtmId={gtmId}
          gtmScriptUrl={gtmServerUrl ? `${gtmServerUrl}/gtm.js` : undefined}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased max-w-[2000px] mx-auto`}>
        {/* Google Tag Manager (noscript) - Fallback para usuários sem JS */}
        <noscript>
          <iframe
            src={`${gtmServerUrl || "https://www.googletagmanager.com"}/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <Providers>{children}</Providers>

      </body>
    </html>
  )
}
