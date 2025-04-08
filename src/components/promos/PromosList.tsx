"use client"
import { useState } from "react"
import { Edit, Trash2, Eye, MapPin, Calendar, Hotel, Plane, Coffee, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PromoImageGeneratorModal } from "./PromoImageGeneratorModal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PromosListProps {
  promos: any[]
  onEdit: (promo: any) => void
  onDelete: () => void
}

export function PromosList({ promos, onEdit, onDelete }: PromosListProps) {
  const [selectedPromo, setSelectedPromo] = useState<any>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [promoToDelete, setPromoToDelete] = useState<any>(null)

  const handleViewImage = (promo: any) => {
    setSelectedPromo(promo)
    setIsImageModalOpen(true)
  }

  const handleEdit = (promo: any) => {
    onEdit(promo)
  }

  const handleDeleteClick = (promo: any) => {
    setPromoToDelete(promo)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!promoToDelete) return

    try {
      const response = await fetch(`/api/promos?id=${promoToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete promo")
      }

      onDelete()
    } catch (error) {
      console.error("Error deleting promo:", error)
    } finally {
      setIsDeleteDialogOpen(false)
      setPromoToDelete(null)
    }
  }

  // Format currency
  const formatCurrency = (value: string) => {
    if (!value) return "R$ 0,00"
    return `R$ ${value}`
  }

  // Get regime de alimentação
  const getRegimeAlimentacao = (promo: any) => {
    if (promo.ALL_INCLUSIVE) return "All inclusive"
    if (promo.PENSAO_COMPLETA) return "Pensão completa"
    if (promo.MEIA_PENSAO) return "Meia pensão"
    if (promo.COM_CAFE) return "Com café da manhã"
    if (promo.SEM_CAFE) return "Sem café da manhã"
    return "Sem café da manhã"
  }

  // Get departure airport
  const getDepartureAirport = (promo: any) => {
    if (promo.CG && !promo.SP) return "Campo Grande (CGR)"
    if (promo.SP && !promo.CG) return "São Paulo (GRU)"
    if (promo.CG && promo.SP) return "Campo Grande (CGR) ou São Paulo (GRU)"
    return "Campo Grande (CGR)"
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.map((promo) => (
          <Card key={promo.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="bg-primary-blue text-white p-3 flex justify-between items-center">
                <h3 className="font-bold truncate">{promo.DESTINO}</h3>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-blue-700"
                    onClick={() => handleViewImage(promo)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-blue-700"
                    onClick={() => handleEdit(promo)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-blue-700"
                    onClick={() => handleDeleteClick(promo)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Hotel className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{promo.HOTEL}</p>
                    <p className="text-sm text-gray-500">{promo.NUMERO_DE_NOITES} noites</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <p className="text-sm">{promo.DESTINO}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <p className="text-sm">{promo.DATA_FORMATADA}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <p className="text-sm">{getDepartureAirport(promo)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <p className="text-sm">{getRegimeAlimentacao(promo)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm">
                      Valor total:{" "}
                      <span className="font-bold text-primary-blue">{formatCurrency(promo.VALOR_TOTAL)}</span>
                    </p>
                    <p className="text-sm">
                      Por pessoa: <span className="font-medium">{formatCurrency(promo.VALOR_POR_PESSOA)}</span>
                    </p>
                    <p className="text-sm">
                      Em {promo.PARCELAS}x: <span className="font-medium">{formatCurrency(promo.VALOR)}</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {promos.length === 0 && (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Nenhuma promoção encontrada.</p>
          </div>
        )}
      </div>

      {selectedPromo && (
        <PromoImageGeneratorModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          promo={selectedPromo}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a promoção para {promoToDelete?.DESTINO}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
