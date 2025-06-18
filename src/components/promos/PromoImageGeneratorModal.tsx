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
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full overflow-hidden p-0">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b bg-white sticky top-0 z-50">
          <DialogTitle className="text-xl font-semibold text-primary-blue">
            Editor Visual - {promo?.DESTINO}
          </DialogTitle>
          <button 
            onClick={onClose} 
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {promo && <PromoImageGenerator promo={promo} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}