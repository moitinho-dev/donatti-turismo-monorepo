"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Download, Copy, Check, ImageIcon } from "lucide-react"
import { PromoImageGenerator } from "./PromoImageGenerator"

interface PromoImageGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  promo: any
}

export function PromoImageGeneratorModal({ isOpen, onClose, promo }: PromoImageGeneratorModalProps) {
  const [activeTab, setActiveTab] = useState("instagram")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setImageUrl(null)
      setIsGenerating(false)
      setIsCopied(false)
    }
  }, [isOpen])

  const handleImageGenerated = (url: string) => {
    setImageUrl(url)
    setIsGenerating(false)
  }

  const handleGenerateImage = () => {
    setIsGenerating(true)
    // The actual generation happens in the PromoImageGenerator component
  }

  const handleDownload = () => {
    if (!imageUrl) return

    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `promo-${promo.DESTINO.toLowerCase().replace(/\s+/g, "-")}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopy = async () => {
    if (!imageUrl) return

    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ])
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy image: ", err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ImageIcon className="h-5 w-5 text-primary-blue" />
            Gerador de Imagem Promocional
          </DialogTitle>
          <DialogDescription>
            Gere uma imagem promocional para {promo.DESTINO} - {promo.HOTEL}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="facebook">Facebook</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>

          <TabsContent value="instagram" className="mt-0">
            <div className="flex flex-col items-center">
              <div className="w-full aspect-square bg-gray-100 rounded-md overflow-hidden relative">
                {isGenerating ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
                    <span className="ml-2">Gerando imagem...</span>
                  </div>
                ) : (
                  <PromoImageGenerator
                    promo={promo}
                    format="instagram"
                    onGenerated={handleImageGenerated}
                    onGenerating={() => setIsGenerating(true)}
                  />
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleDownload}
                  disabled={!imageUrl || isGenerating}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar</span>
                </Button>
                <Button
                  onClick={handleCopy}
                  disabled={!imageUrl || isGenerating}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{isCopied ? "Copiado!" : "Copiar"}</span>
                </Button>
                <Button onClick={handleGenerateImage} disabled={isGenerating} variant="outline">
                  Gerar Novamente
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="facebook" className="mt-0">
            <div className="flex flex-col items-center">
              <div className="w-full aspect-video bg-gray-100 rounded-md overflow-hidden relative">
                {isGenerating ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
                    <span className="ml-2">Gerando imagem...</span>
                  </div>
                ) : (
                  <PromoImageGenerator
                    promo={promo}
                    format="facebook"
                    onGenerated={handleImageGenerated}
                    onGenerating={() => setIsGenerating(true)}
                  />
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleDownload}
                  disabled={!imageUrl || isGenerating}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar</span>
                </Button>
                <Button
                  onClick={handleCopy}
                  disabled={!imageUrl || isGenerating}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{isCopied ? "Copiado!" : "Copiar"}</span>
                </Button>
                <Button onClick={handleGenerateImage} disabled={isGenerating} variant="outline">
                  Gerar Novamente
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-0">
            <div className="flex flex-col items-center">
              <div className="w-full aspect-square bg-gray-100 rounded-md overflow-hidden relative">
                {isGenerating ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
                    <span className="ml-2">Gerando imagem...</span>
                  </div>
                ) : (
                  <PromoImageGenerator
                    promo={promo}
                    format="whatsapp"
                    onGenerated={handleImageGenerated}
                    onGenerating={() => setIsGenerating(true)}
                  />
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleDownload}
                  disabled={!imageUrl || isGenerating}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar</span>
                </Button>
                <Button
                  onClick={handleCopy}
                  disabled={!imageUrl || isGenerating}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{isCopied ? "Copiado!" : "Copiar"}</span>
                </Button>
                <Button onClick={handleGenerateImage} disabled={isGenerating} variant="outline">
                  Gerar Novamente
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
