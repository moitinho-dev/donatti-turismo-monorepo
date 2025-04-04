import type React from "react"
import { Inter } from "next/font/google"
import Script from "next/script"
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
      {/* Corpo da página com classe para estilos específicos */}
      <body className="max-w-[2000px] mx-auto">
        <SessionProvider>
          {/* Renderizando o conteúdo das páginas filhas */}
          {children}
        </SessionProvider>
        {/* Script de integração com o Facebook Pixel com estratégia "afterInteractive" */}
        <Script id="pixel-meta" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1023858612283732'); // Inicializando o Facebook Pixel
            fbq('track', 'PageView'); // Rastreando a visualização da página
          `}
        </Script>
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','AW-327531753'); `}
        </Script>
        <noscript>
          <iframe
            id="google-tag-manager-noscript"
            src="https://www.googletagmanager.com/ns.html?id=AW-327531753"
            height="0"
            width="0"
            className="display:none;visibility:hidden"
          ></iframe>
        </noscript>
      </body>
    </html>
  )
}

