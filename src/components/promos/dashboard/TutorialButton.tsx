"use client"

import { useState } from "react"
import { HelpCircle, X, FileText, FileUp, Image, Share2 } from "lucide-react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"

interface TutorialButtonProps {
  onOpenModal?: () => void
  onOpenStudio?: () => void
}

function createTourCadastrar(onOpenModal?: () => void) {
  return () => {
    const d = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(0,0,0,0.6)",
      popoverClass: "donatti-tour-popover",
      nextBtnText: "Proximo",
      prevBtnText: "Anterior",
      doneBtnText: "Entendi!",
      steps: [
        {
          element: "[data-tour='nav-nova-promo']",
          popover: {
            title: "1. Criar nova promo",
            description: "Clique aqui para abrir o formulario de nova promocao.",
            side: "bottom" as const,
            align: "center" as const,
          },
        },
        {
          element: "[data-tour='nav-nova-promo']",
          popover: {
            title: "2. Formulario abre",
            description: "O formulario abre como modal. Preencha destino, hotel, datas, valor, noites e regime de alimentacao.",
            side: "bottom" as const,
            align: "center" as const,
          },
          onHighlightStarted: () => { onOpenModal?.() },
        },
        {
          element: "[data-tour='promo-list']",
          popover: {
            title: "3. Promo na lista",
            description: "Apos salvar, a promo aparece aqui na lista. Voce pode editar, excluir ou gerar imagens.",
            side: "top" as const,
            align: "center" as const,
          },
        },
        {
          element: "[data-tour='stats-grid']",
          popover: {
            title: "4. Estatisticas atualizadas",
            description: "Os numeros atualizam automaticamente: total de promos, destinos, valor medio.",
            side: "bottom" as const,
            align: "center" as const,
          },
        },
      ],
    })
    d.drive()
  }
}

function createTourPdf(onOpenModal?: () => void) {
  return () => {
    // First open the modal so elements are visible
    onOpenModal?.()

    setTimeout(() => {
      const d = driver({
        showProgress: true,
        animate: true,
        overlayColor: "rgba(0,0,0,0.6)",
        popoverClass: "donatti-tour-popover",
        nextBtnText: "Proximo",
        prevBtnText: "Anterior",
        doneBtnText: "Entendi!",
        steps: [
          {
            element: "[data-tour='pdf-upload-zone']",
            popover: {
              title: "1. Area de upload de PDF",
              description: "Arraste o PDF da operadora aqui ou clique para selecionar o arquivo. A IA vai extrair automaticamente os dados.",
              side: "bottom" as const,
              align: "center" as const,
            },
          },
          {
            element: "[data-tour='pdf-valor-toggle']",
            popover: {
              title: "2. Tipo de valor",
              description: "IMPORTANTE: Selecione 'Valor Total (÷2)' se o PDF tem preco para 2 adultos, ou 'Valor Unitario' se ja e por pessoa. A maioria dos PDFs vem com valor total.",
              side: "bottom" as const,
              align: "center" as const,
            },
          },
          {
            element: "[data-tour='form-destino']",
            popover: {
              title: "3. Campos preenchidos",
              description: "Apos o upload, destino, hotel, datas, valor e regime sao preenchidos automaticamente. Revise antes de salvar!",
              side: "bottom" as const,
              align: "center" as const,
            },
          },
          {
            element: "[data-tour='form-submit']",
            popover: {
              title: "4. Salvar",
              description: "Confira tudo e clique em 'Criar Promocao' para salvar.",
              side: "top" as const,
              align: "center" as const,
            },
          },
        ],
      })
      d.drive()
    }, 500) // wait for modal animation
  }
}

function createTourGerarImagem(onOpenStudio?: () => void) {
  return () => {
    // Open studio with mock promo first
    onOpenStudio?.()

    setTimeout(() => {
      const d = driver({
        showProgress: true,
        animate: true,
        overlayColor: "rgba(0,0,0,0.6)",
        popoverClass: "donatti-tour-popover",
        nextBtnText: "Proximo",
        prevBtnText: "Anterior",
        doneBtnText: "Entendi!",
        steps: [
          {
            element: "[data-tour='studio-gallery']",
            popover: {
              title: "1. Galeria de imagens",
              description: "Aqui voce busca e seleciona a imagem de fundo para a promo. Clique em uma foto para usar como fundo.",
              side: "right" as const,
              align: "start" as const,
            },
          },
          {
            element: "[data-tour='studio-search']",
            popover: {
              title: "2. Buscar imagens",
              description: "Digite qualquer termo (ex: 'praia', 'montanha', 'cancun') e pressione Enter para buscar novas fotos.",
              side: "bottom" as const,
              align: "center" as const,
            },
          },
          {
            element: "[data-tour='studio-editor']",
            popover: {
              title: "3. Editor visual",
              description: "Aqui voce ve o preview da imagem gerada. Ajuste layout, cores e textos usando os controles do editor.",
              side: "left" as const,
              align: "center" as const,
            },
          },
          {
            element: "[data-tour='studio-site-card']",
            popover: {
              title: "4. Card do site",
              description: "Configure a publicacao no site: ative 'Publicar', escolha a secao e clique em 'Salvar card'.",
              side: "right" as const,
              align: "center" as const,
            },
          },
          {
            popover: {
              title: "5. Baixar imagem",
              description: "Use o botao 'Baixar' no editor para gerar e salvar o PNG no seu computador. Pronto!",
            },
          },
        ],
      })
      d.drive()
    }, 1500) // wait for studio to load + images to fetch
  }
}

function createTourCompartilhar(onOpenStudio?: () => void) {
  return () => {
    onOpenStudio?.()

    setTimeout(() => {
      const d = driver({
        showProgress: true,
        animate: true,
        overlayColor: "rgba(0,0,0,0.6)",
        popoverClass: "donatti-tour-popover",
        nextBtnText: "Proximo",
        prevBtnText: "Anterior",
        doneBtnText: "Entendi!",
        steps: [
          {
            element: "[data-tour='studio-gallery']",
            popover: {
              title: "1. Escolha a imagem",
              description: "Selecione uma foto de fundo para a promo na galeria.",
              side: "right" as const,
              align: "start" as const,
            },
          },
          {
            element: "[data-tour='studio-editor']",
            popover: {
              title: "2. Gere a imagem",
              description: "Clique em 'Baixar' no editor para gerar o PNG. Isso tambem salva a imagem no sistema.",
              side: "left" as const,
              align: "center" as const,
            },
          },
          {
            element: "[data-tour='studio-site-card']",
            popover: {
              title: "3. Publique no site",
              description: "Ative 'Publicar', defina a secao e slug, e clique em 'Salvar card'. A promo aparece na home do site!",
              side: "right" as const,
              align: "center" as const,
            },
          },
          {
            element: "[data-tour='studio-instagram']",
            popover: {
              title: "4. Poste no Instagram",
              description: "Escreva a legenda e clique em 'Feed' ou 'Stories'. A imagem e convertida e postada automaticamente!",
              side: "right" as const,
              align: "center" as const,
            },
          },
          {
            element: "[data-tour='studio-gbp']",
            popover: {
              title: "5. Google Business",
              description: "Se conectado, a promo e postada automaticamente no Google ao publicar no site. Tudo em um so lugar!",
              side: "right" as const,
              align: "center" as const,
            },
          },
        ],
      })
      d.drive()
    }, 1500)
  }
}

export function TutorialButton({ onOpenModal, onOpenStudio }: TutorialButtonProps) {
  const [open, setOpen] = useState(false)

  const tutorials = [
    {
      icon: FileText,
      label: "Cadastrar uma promocao",
      description: "Preencher manualmente o formulario",
      action: createTourCadastrar(onOpenModal),
    },
    {
      icon: FileUp,
      label: "Cadastrar com PDF",
      description: "Importar dados de PDF de operadora",
      action: createTourPdf(onOpenModal),
    },
    {
      icon: Image,
      label: "Cadastrar e gerar imagem",
      description: "Criar imagem promocional no editor",
      action: createTourGerarImagem(onOpenStudio),
    },
    {
      icon: Share2,
      label: "Cadastrar, gerar e compartilhar",
      description: "Publicar no site, Instagram e Google",
      action: createTourCompartilhar(onOpenStudio),
    },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        title="Tutoriais"
        className="relative bg-amber-500 hover:bg-amber-400 text-white p-2.5 rounded-[14px] transition-all shadow-sm focus:outline-none"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 bg-white rounded-[18px] border border-gray-200 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-black text-gray-900">Tutoriais</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Aprenda a usar o Donatti Studio</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2">
              {tutorials.map((t) => (
                <button
                  key={t.label}
                  onClick={() => {
                    setOpen(false)
                    setTimeout(t.action, 200)
                  }}
                  className="w-full flex items-start gap-3 px-3 py-3 rounded-[12px] hover:bg-amber-50 transition-colors text-left group"
                >
                  <div className="w-9 h-9 rounded-[10px] bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center shrink-0 transition-colors">
                    <t.icon className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">{t.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
