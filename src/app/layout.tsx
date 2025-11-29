"use client"
import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
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

        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://load.api.donattiturismo.com/ajnrhjzxk.js?'+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','71untgnx=AhxHLTw%2FQzpYMiooOyAjTB1FSERZVAoEVhwVBAkGGgMfDQgDGx8BRAgXFw%3D%3D');`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased max-w-[2000px] mx-auto`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-P3JPBSRM"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <SessionProvider>
          {/* Renderizando o conteúdo das páginas filhas */}
          {children}
          <IntercomChat />
        </SessionProvider>

      </body>
    </html>
  )
}

