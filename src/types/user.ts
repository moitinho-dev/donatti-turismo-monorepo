export interface User {
  id: string
  email: string
  name: string
  password: string
  role: "admin" | "agent" // Define os papéis possíveis
  createdAt: string
  updatedAt?: string
  lastLogin?: string
  active: boolean
}

export interface UserStats {
  id: string
  name: string
  email: string
  role: string
  totalPromos: number
  lastPromoDate?: string
  lastLoginDate?: string
}
