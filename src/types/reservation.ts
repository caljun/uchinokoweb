export interface PaymentInfo {
  paymentIntentId: string
  clientSecret: string
  amount: number
  platformFee?: number
  status: 'pending' | 'succeeded' | 'failed'
  createdAt?: Date
  completedAt?: Date
}

export interface DogInfo {
  name: string
  photoUrl?: string | null
  breed?: string
  breedSize?: number
}

export interface Reservation {
  id?: string
  // Firestore / iOS 準拠フィールド
  userId: string
  storeId: string
  shopName: string
  dogId: string
  dogName: string
  dogInfo?: DogInfo
  serviceId?: string | null
  serviceName?: string
  servicePrice?: number
  serviceType?: string        // "inStore" | "visit"
  selectedDate?: string       // ISO8601 "2026-03-15T10:00:00+09:00"
  dateStr?: string            // "2026-03-15"  for querying
  timeSlot?: string           // "10:00"
  requestedDates?: string[]
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  paymentStatus?: 'paid'
  paymentInfo?: PaymentInfo
  createdAt: Date | { toDate(): Date }
  updatedAt?: Date | { toDate(): Date }
  // Legacy fields
  ownerId?: string
  shopId?: string
  requestedDate?: Date
  confirmedDate?: Date
  message?: string
  shopMessage?: string
}

export interface Order {
  id?: string
  ownerId: string
  shopId: string
  shopName: string
  items: OrderItem[]
  totalAmount: number
  platformFee: number
  status: 'draft' | 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  shippingAddress?: Address
  paymentInfo?: PaymentInfo
  createdAt: Date
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  photoUrl?: string
}

export interface Address {
  postalCode: string
  prefecture: string
  city: string
  address: string
  name: string
  phone: string
}
