"use client"
import { createContext, useContext, type ReactNode } from "react"
import { usePromo } from "@/hooks/usePromo"

// Create context
const PromoContext = createContext<ReturnType<typeof usePromo> | undefined>(undefined)

// Provider component
export function PromoProvider({ children }: { children: ReactNode }) {
  const promoMethods = usePromo()

  return <PromoContext.Provider value={promoMethods}>{children}</PromoContext.Provider>
}

// Hook to use the promo context
export function usePromoContext() {
  const context = useContext(PromoContext)

  if (context === undefined) {
    throw new Error("usePromoContext must be used within a PromoProvider")
  }

  return context
}
