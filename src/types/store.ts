export interface StoreAccepted {
  difficulty?: string[]
  sizes?: string[]
  ages?: string[]
}

export interface StoreService {
  id: string
  name: string
  price: number
  description?: string
  duration?: number
  type?: string // "visit" | "outbound"
}

export interface StoreProduct {
  id: string
  productId: string
  name: string
  description?: string
  price?: number
  stock?: number
  isActive?: boolean
  photos?: string[]
  soldOut?: boolean
  categoryId?: string
  productCategory?: string
  targetSizes?: string[]
  targetAges?: string[]
}

export interface StoreLocation {
  latitude: number
  longitude: number
}

export interface Store {
  id: string
  categories: string[]
  name: string
  address?: string
  phone?: string
  email?: string
  description?: string
  openHours?: string
  isAcceptingReservations?: boolean
  holiday?: string
  accepted?: StoreAccepted
  photoUrls: string[]
  location?: StoreLocation
  services?: StoreService[]
  products?: StoreProduct[]
  status?: string
  isPublished?: boolean
  createdAt?: Date
}
