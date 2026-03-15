"use client"

interface DeleteConfirmModalProps {
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmModal({ onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar exclusao</h3>
        <p className="text-gray-500 mb-6">Tem certeza que deseja excluir esta promocao? Esta acao nao pode ser desfeita.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
