"use client"
import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"

// Configurando a fonte Inter com suporte ao subset 'latin'
const inter = Inter({ subsets: ["latin"] })

// Componente funcional para o layout principal da aplicação
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Estrutura básica do HTML
    <html lang="pt-BR">
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src="https://load.api.donattiturismo.com/ajnrhjzxk.js?"+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','71untgnx=AhxHLTw%2FQzpYMiooOyAjTB1FSERZVAoEVhwVBAkGGgMfDQgDGx8BRAgXFw%3D%3D');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      {/* Corpo da página com classe para estilos específicos */}
      <body className="max-w-[2000px] mx-auto">
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
        </SessionProvider>
      </body>
    </html>
  )
}

