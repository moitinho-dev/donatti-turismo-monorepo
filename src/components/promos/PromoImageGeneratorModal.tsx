"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PromoImageGenerator } from "./PromoImageGenerator"
import { X } from "lucide-react"

interface PromoImageGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  promo: any
}

export function PromoImageGeneratorModal({ isOpen, onClose, promo }: PromoImageGeneratorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-primary-blue">
            Gerar Imagem Promocional - {promo?.DESTINO}
          </DialogTitle>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DialogHeader>

        <div className="py-4">{promo && <PromoImageGenerator promo={promo} />}</div>
      </DialogContent>
    </Dialog>
  )
}
