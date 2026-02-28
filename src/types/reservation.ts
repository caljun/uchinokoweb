export interface PaymentInfo {
  paymentIntentId: string
  clientSecret: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
}

export interface Reservation {
  id?: string
  ownerId: string
  dogId: string
  shopId: string
  shopName: string
  dogName: string
  serviceType?: string
  serviceName?: string
  servicePrice?: number
  requestedDate?: Date
  confirmedDate?: Date
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  message?: string
  shopMessage?: string
  paymentInfo?: PaymentInfo
  createdAt: Date
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
