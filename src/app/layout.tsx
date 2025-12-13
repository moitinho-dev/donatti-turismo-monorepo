"use client"
import type React from "react"
import Script from "next/script"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { LayoutsProvider } from "@/hooks/useLayouts"
import IntercomChat from "@/components/IntercomChat"

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
  children: React.ReactNode
}) {
  // GTM & Analytics Configuration
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || "GTM-P3JPBSRM"
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXX"
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

        {/* Google Tag Manager - Client Side */}
        <Script id="gtm-init" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),
                  dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='${gtmServerUrl ? gtmServerUrl + '/gtm.js?id=' : 'https://www.googletagmanager.com/gtm.js?id='}'+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}
        </Script>

        {/* Google Analytics 4 - Configuração */}
        <Script id="ga4-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaMeasurementId}'${gtmServerUrl ? `, { transport_url: '${gtmServerUrl}', first_party_collection: true }` : ''});
          `}
        </Script>

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
      </head>
      <body className={`${inter.variable} font-sans antialiased max-w-[2000px] mx-auto`}>
        {/* Google Tag Manager (noscript) - Fallback para usuários sem JS */}
        <noscript>
          <iframe
            src={`${gtmServerUrl || 'https://www.googletagmanager.com'}/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        <SessionProvider>
          {/* Providers for app-wide state */}
          <LayoutsProvider>
            {/* Renderizando o conteúdo das páginas filhas */}
            {children}
            <IntercomChat />
          </LayoutsProvider>
        </SessionProvider>

      </body>
    </html>
  )
}
