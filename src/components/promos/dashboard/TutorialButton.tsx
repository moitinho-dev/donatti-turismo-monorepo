"use client"

import { useState } from "react"
import { HelpCircle, X, FileText, FileUp, Image, Share2 } from "lucide-react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"

const tourCadastrar = () => {
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
          description: "Clique aqui para abrir o formulario de nova promocao. Voce pode preencher manualmente todos os campos.",
          side: "bottom" as const,
          align: "center" as const,
        },
      },
      {
        element: "[data-tour='promo-list']",
        popover: {
          title: "2. Lista de promos",
          description: "Aqui ficam todas as promos cadastradas. Voce pode buscar, filtrar, editar ou excluir.",
          side: "top" as const,
          align: "center" as const,
        },
      },
      {
        element: "[data-tour='stats-grid']",
        popover: {
          title: "3. Estatisticas",
          description: "Acompanhe o total de promos, destinos ativos, valor medio e destino mais buscado.",
          side: "bottom" as const,
          align: "center" as const,
        },
      },
    ],
  })
  d.drive()
}

const tourPdf = () => {
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
          title: "1. Abra o formulario",
          description: "Clique em 'Nova Promo' para abrir o formulario de cadastro.",
          side: "bottom" as const,
          align: "center" as const,
        },
      },
      {
        popover: {
          title: "2. Upload de PDF",
          description: "No formulario, voce vera uma area de upload no topo. Arraste o PDF da operadora ou clique para selecionar o arquivo.",
          side: "bottom" as const,
          align: "center" as const,
        },
      },
      {
        popover: {
          title: "3. Escolha o tipo de preco",
          description: "Selecione 'Preco Total (÷2)' se o PDF tem valor para 2 adultos, ou 'Preco Unitario' se ja e por pessoa.",
          side: "bottom" as const,
          align: "center" as const,
        },
      },
      {
        popover: {
          title: "4. Revise e salve",
          description: "A IA extrai automaticamente destino, hotel, datas, valor e regime. Revise os campos e clique em Adicionar.",
          side: "bottom" as const,
          align: "center" as const,
        },
      },
    ],
  })
  d.drive()
}

const tourGerarImagem = () => {
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
        element: "[data-tour='promo-list']",
        popover: {
          title: "1. Escolha uma promo",
          description: "Na lista de promos, encontre a promo desejada.",
          side: "top" as const,
          align: "center" as const,
        },
      },
      {
        popover: {
          title: "2. Abra o editor",
          description: "Clique no botao 'GERAR IMAGENS' no card da promo, ou no icone de pincel. Isso abre o Donatti Studio.",
          side: "bottom" as const,
          align: "center" as const,
        },
      },
      {
        popover: {
          title: "3. Escolha a imagem de fundo",
          description: "No painel esquerdo, busque e selecione uma imagem de fundo para a promo. Voce pode buscar por qualquer termo.",
          side: "bottom" as const,
          align: "center" as const,
        },
      },
      {
        popover: {
          title: "4. Customize e baixe",
          description: "Ajuste o layout, cores e textos no editor visual. Quando estiver pronto, clique em Baixar para salvar a imagem.",
          side: "bottom" as const,
          align: "center" as const,
        },
      },
    ],
  })
  d.drive()
}

const tourCompartilhar = () => {
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
        element: "[data-tour='promo-list']",
        popover: {
          title: "1. Escolha a promo e abra o editor",
          description: "Clique em 'GERAR IMAGENS' em qualquer promo para abrir o Donatti Studio.",
          side: "top" as const,
          align: "center" as const,
        },
      },
      {
        popover: {
          title: "2. Gere a imagem",
          description: "No editor, escolha a imagem de fundo e clique em Baixar. Isso gera o PNG e salva a imagem no sistema.",
          side: "bottom" as const,
          align: "center" as const,
        },
      },
      {
        popover: {
          title: "3. Publique no site",
          description: "No painel esquerdo, marque 'Publicar', defina a secao e slug, e clique em 'Salvar card'. A promo aparece no site.",
          side: "bottom" as const,
          align: "center" as const,
        },
      },
      {
        popover: {
          title: "4. Poste no Instagram",
          description: "Ainda no painel esquerdo, use o painel do Instagram para postar no Feed ou Stories. A imagem e enviada automaticamente.",
          side: "bottom" as const,
          align: "center" as const,
        },
      },
      {
        popover: {
          title: "5. Google Business",
          description: "Se o Google Business estiver conectado, a promo e postada automaticamente ao publicar no site.",
          side: "bottom" as const,
          align: "center" as const,
        },
      },
    ],
  })
  d.drive()
}

const tutorials = [
  {
    icon: FileText,
    label: "Cadastrar uma promocao",
    description: "Preencher manualmente o formulario",
    action: tourCadastrar,
  },
  {
    icon: FileUp,
    label: "Cadastrar com PDF",
    description: "Importar dados de PDF de operadora",
    action: tourPdf,
  },
  {
    icon: Image,
    label: "Cadastrar e gerar imagem",
    description: "Criar imagem promocional no editor",
    action: tourGerarImagem,
  },
  {
    icon: Share2,
    label: "Cadastrar, gerar e compartilhar",
    description: "Publicar no site, Instagram e Google",
    action: tourCompartilhar,
  },
]

export function TutorialButton() {
  const [open, setOpen] = useState(false)

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
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Menu */}
          <div className="absolute right-0 top-12 z-50 w-80 bg-white rounded-[18px] border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                    // Small delay so the menu closes before the tour starts
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
