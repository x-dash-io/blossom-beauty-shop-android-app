export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  description: string;
  images: string[];
  category: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  inStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  stockQuantity?: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  productCount: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  color: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export type OrderStatus = 'pending_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type PaymentMethod = 'mpesa' | 'cash_on_delivery';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'timeout';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  productBrand: string;
  price: number;
  quantity: number;
}

export interface OrderTrackingEvent {
  status: OrderStatus;
  date: string;
  description: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  date: string;
  address: Address;
  trackingEvents: OrderTrackingEvent[];
  estimatedDelivery?: string;
  trackingNumber?: string;
  paymentMethod?: PaymentMethod;
  paymentId?: string;
}

export interface MpesaPayment {
  id: string;
  orderId: string;
  phoneNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  mpesaReceiptNumber?: string;
  checkoutRequestId?: string;
  resultDesc?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  helpful: number;
}
