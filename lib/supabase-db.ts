import { supabase } from './supabase';
import { Product, Category, Order, Review, Address, OrderItem, OrderTrackingEvent, CartItem, MpesaPayment, PaymentMethod, PaymentStatus } from '@/types';

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  price: number;
  description: string;
  images: string[];
  category: string;
  rating: number;
  review_count: number;
  tags: string[];
  in_stock: boolean;
  is_featured: boolean;
  is_new: boolean;
  stock_quantity?: number;
}

interface CategoryRow {
  id: string;
  name: string;
  image: string;
  product_count: number;
}

interface OrderRow {
  id: string;
  user_id: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  date: string;
  address: Address;
  tracking_events: OrderTrackingEvent[];
  estimated_delivery: string | null;
  tracking_number: string | null;
  payment_method?: string;
  payment_id?: string;
}

interface ReviewRow {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title: string;
  body: string;
  helpful: number;
  created_at: string;
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: Number(row.price),
    description: row.description,
    images: row.images ?? [],
    category: row.category,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    tags: row.tags ?? [],
    inStock: row.in_stock,
    isFeatured: row.is_featured,
    isNew: row.is_new,
    stockQuantity: row.stock_quantity ?? undefined,
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    productCount: row.product_count,
  };
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    items: row.items,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    status: row.status as Order['status'],
    date: row.date,
    address: row.address,
    trackingEvents: row.tracking_events ?? [],
    estimatedDelivery: row.estimated_delivery ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
    paymentMethod: (row.payment_method as PaymentMethod) ?? undefined,
    paymentId: row.payment_id ?? undefined,
  };
}

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    userName: row.user_name,
    rating: row.rating,
    title: row.title,
    body: row.body,
    date: row.created_at,
    helpful: row.helpful,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  console.log('[DB] Fetching products...');
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('[DB] Error fetching products:', error.message);
    return [];
  }

  console.log('[DB] Fetched', data?.length ?? 0, 'products');
  return (data as ProductRow[]).map(mapProduct);
}

export async function fetchCategories(): Promise<Category[]> {
  console.log('[DB] Fetching categories...');
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.log('[DB] Error fetching categories:', error.message);
    return [];
  }

  console.log('[DB] Fetched', data?.length ?? 0, 'categories');
  return (data as CategoryRow[]).map(mapCategory);
}

export async function fetchUserOrders(userId: string): Promise<Order[]> {
  console.log('[DB] Fetching user orders');
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.log('[DB] Error fetching orders:', error.message);
    return [];
  }

  console.log('[DB] Fetched', data?.length ?? 0, 'orders');
  return (data as OrderRow[]).map(mapOrder);
}

export async function createOrder(userId: string, order: Order): Promise<boolean> {
  console.log('[DB] Creating order:', order.id);
  const { error } = await supabase
    .from('orders')
    .insert({
      id: order.id,
      user_id: userId,
      items: order.items,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      status: order.status,
      date: order.date,
      address: order.address,
      tracking_events: order.trackingEvents,
      estimated_delivery: order.estimatedDelivery ?? null,
      tracking_number: order.trackingNumber ?? null,
      payment_method: order.paymentMethod ?? 'cash_on_delivery',
      payment_id: order.paymentId ?? null,
    });

  if (error) {
    console.log('[DB] Error creating order:', error.message);
    return false;
  }

  console.log('[DB] Order created successfully');
  return true;
}

export async function fetchAllReviews(): Promise<Review[]> {
  console.log('[DB] Fetching all reviews...');
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('[DB] Error fetching reviews:', error.message);
    return [];
  }

  console.log('[DB] Fetched', data?.length ?? 0, 'reviews');
  return (data as ReviewRow[]).map(mapReview);
}

export async function createReview(review: Review): Promise<boolean> {
  console.log('[DB] Creating review for product:', review.productId);
  const { error } = await supabase
    .from('reviews')
    .insert({
      id: review.id,
      product_id: review.productId,
      user_id: review.userId,
      user_name: review.userName,
      rating: review.rating,
      title: review.title,
      body: review.body,
      helpful: review.helpful,
    });

  if (error) {
    console.log('[DB] Error creating review:', error.message);
    return false;
  }

  console.log('[DB] Review created successfully');
  return true;
}

export async function updateReviewHelpful(reviewId: string, newCount: number): Promise<boolean> {
  const { error } = await supabase
    .from('reviews')
    .update({ helpful: newCount })
    .eq('id', reviewId);

  if (error) {
    console.log('[DB] Error updating review helpful:', error.message);
    return false;
  }
  return true;
}

export async function fetchUserFavoriteIds(userId: string): Promise<string[]> {
  console.log('[DB] Fetching user favorites');
  const { data, error } = await supabase
    .from('favorites')
    .select('product_id')
    .eq('user_id', userId);

  if (error) {
    console.log('[DB] Error fetching favorites:', error.message);
    return [];
  }

  console.log('[DB] Fetched', data?.length ?? 0, 'favorites');
  return (data as { product_id: string }[]).map(row => row.product_id);
}

export async function addFavorite(userId: string, productId: string): Promise<boolean> {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, product_id: productId });

  if (error) {
    console.log('[DB] Error adding favorite:', error.message);
    return false;
  }
  return true;
}

export async function removeFavorite(userId: string, productId: string): Promise<boolean> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);

  if (error) {
    console.log('[DB] Error removing favorite:', error.message);
    return false;
  }
  return true;
}

export async function fetchUserAddresses(userId: string) {
  const { data, error } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });

  if (error) {
    console.log('[DB] Error fetching addresses:', error.message);
    return [];
  }

  return data as {
    id: number;
    user_id: string;
    full_name: string;
    street: string;
    city: string;
    state: string | null;
    zip_code: string | null;
    phone: string;
    is_default: boolean;
  }[];
}

export async function createUserAddress(userId: string, address: {
  fullName: string;
  street: string;
  city: string;
  state?: string;
  zipCode?: string;
  phone: string;
  isDefault?: boolean;
}): Promise<boolean> {
  if (address.isDefault) {
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', userId);
  }

  const { error } = await supabase
    .from('user_addresses')
    .insert({
      user_id: userId,
      full_name: address.fullName,
      street: address.street,
      city: address.city,
      state: address.state ?? null,
      zip_code: address.zipCode ?? null,
      phone: address.phone,
      is_default: address.isDefault ?? false,
    });

  if (error) {
    console.log('[DB] Error creating address:', error.message);
    return false;
  }
  return true;
}

export async function updateUserAddress(addressId: number, address: {
  fullName: string;
  street: string;
  city: string;
  state?: string;
  zipCode?: string;
  phone: string;
  isDefault?: boolean;
}, userId?: string): Promise<boolean> {
  if (address.isDefault && userId) {
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', userId);
  }

  const { error } = await supabase
    .from('user_addresses')
    .update({
      full_name: address.fullName,
      street: address.street,
      city: address.city,
      state: address.state ?? null,
      zip_code: address.zipCode ?? null,
      phone: address.phone,
      is_default: address.isDefault ?? false,
    })
    .eq('id', addressId);

  if (error) {
    console.log('[DB] Error updating address:', error.message);
    return false;
  }
  return true;
}

export async function deleteUserAddress(addressId: number): Promise<boolean> {
  const { error } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', addressId);

  if (error) {
    console.log('[DB] Error deleting address:', error.message);
    return false;
  }
  return true;
}

export async function fetchUserCart(userId: string): Promise<CartItem[]> {
  console.log('[DB] Fetching user cart');
  try {
    const { data: cartData, error: cartError } = await supabase
      .from('cart_items')
      .select('product_id, quantity')
      .eq('user_id', userId);

    if (cartError) {
      console.log('[DB] Error fetching cart:', cartError.message);
      return [];
    }

    if (!cartData || cartData.length === 0) return [];

    const productIds = cartData.map(c => c.product_id as string);
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productError || !productData) {
      console.log('[DB] Error fetching cart products:', productError?.message);
      return [];
    }

    const productMap = new Map(
      (productData as ProductRow[]).map(p => [p.id, mapProduct(p)])
    );

    return cartData
      .filter(c => productMap.has(c.product_id as string))
      .map(c => ({
        product: productMap.get(c.product_id as string)!,
        quantity: c.quantity as number,
      }));
  } catch (err) {
    console.log('[DB] fetchUserCart failed:', err);
    return [];
  }
}

export async function syncUserCart(userId: string, items: CartItem[]): Promise<boolean> {
  console.log('[DB] Syncing user cart, items:', items.length);
  try {
    await supabase.from('cart_items').delete().eq('user_id', userId);

    if (items.length === 0) return true;

    const { error } = await supabase.from('cart_items').insert(
      items.map(item => ({
        user_id: userId,
        product_id: item.product.id,
        quantity: item.quantity,
      }))
    );

    if (error) {
      console.log('[DB] Error syncing cart:', error.message);
      return false;
    }

    console.log('[DB] Cart synced successfully');
    return true;
  } catch (err) {
    console.log('[DB] syncUserCart failed:', err);
    return false;
  }
}

interface PaymentRow {
  id: string;
  order_id: string;
  user_id: string;
  phone_number: string;
  amount: number;
  payment_method: string;
  status: string;
  mpesa_receipt_number: string | null;
  checkout_request_id: string | null;
  merchant_request_id: string | null;
  result_code: string | null;
  result_desc: string | null;
  created_at: string;
  updated_at: string;
}

function mapPayment(row: PaymentRow): MpesaPayment {
  return {
    id: row.id,
    orderId: row.order_id,
    phoneNumber: row.phone_number,
    amount: Number(row.amount),
    paymentMethod: row.payment_method as PaymentMethod,
    status: row.status as PaymentStatus,
    mpesaReceiptNumber: row.mpesa_receipt_number ?? undefined,
    checkoutRequestId: row.checkout_request_id ?? undefined,
    resultDesc: row.result_desc ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createPayment(userId: string, payment: {
  id: string;
  orderId: string;
  phoneNumber: string;
  amount: number;
  paymentMethod: string;
}): Promise<boolean> {
  console.log('[DB] Creating payment:', payment.id);
  const { error } = await supabase
    .from('payments')
    .insert({
      id: payment.id,
      order_id: payment.orderId,
      user_id: userId,
      phone_number: payment.phoneNumber,
      amount: payment.amount,
      payment_method: payment.paymentMethod,
      status: 'pending',
    });

  if (error) {
    console.log('[DB] Error creating payment:', error.message);
    return false;
  }
  console.log('[DB] Payment created successfully');
  return true;
}

export async function fetchPaymentStatus(paymentId: string): Promise<MpesaPayment | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (error || !data) {
    console.log('[DB] Error fetching payment:', error?.message);
    return null;
  }
  return mapPayment(data as PaymentRow);
}

export async function updatePaymentCheckoutId(
  paymentId: string,
  checkoutRequestId: string,
  merchantRequestId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('payments')
    .update({
      checkout_request_id: checkoutRequestId,
      merchant_request_id: merchantRequestId,
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId);

  if (error) {
    console.log('[DB] Error updating payment checkout ID:', error.message);
    return false;
  }
  return true;
}

export async function updatePaymentStatus(
  paymentId: string,
  status: string,
  resultDesc?: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('payments')
    .update({
      status,
      result_desc: resultDesc ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId);

  if (error) {
    console.log('[DB] Error updating payment status:', error.message);
    return false;
  }
  return true;
}

export async function updateOrderStatus(orderId: string, status: string): Promise<boolean> {
  console.log('[DB] Updating order', orderId, 'status to:', status);
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    console.log('[DB] Error updating order status:', error.message);
    return false;
  }
  console.log('[DB] Order status updated successfully');
  return true;
}

export async function clearUserCart(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
    if (error) {
      console.log('[DB] Error clearing cart:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.log('[DB] clearUserCart failed:', err);
    return false;
  }
}
