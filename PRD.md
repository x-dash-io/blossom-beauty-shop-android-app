# Product Requirements Document (PRD) - Blossom Beauty Shop

## 1. Project Overview
**Blossom Beauty Shop** is a premium mobile e-commerce application dedicated to beauty, skincare, and wellness products. The app provides a seamless shopping experience for users to discover, favorite, and purchase high-quality beauty products with integrated local payment solutions.

## 2. Target Audience
- Beauty and skincare enthusiasts.
- Mobile-first shoppers looking for premium cosmetics.
- Users in regions where M-Pesa is a primary payment method.

## 3. Core Features

### 3.1 User Authentication
- **Sign Up/Login**: Secure authentication using Supabase Auth (Email/Password).
- **Password Recovery**: "Forgot Password" functionality via email.
- **Profile Management**: Users can update their personal information and manage saved addresses.

### 3.2 Product Discovery
- **Home Feed**: Featured products, new arrivals, and promotional banners.
- **Categorization**: Browse products by categories (Skincare, Makeup, Haircare, etc.).
- **Search & Filtering**: Real-time search and advanced filtering by brand, price, and tags.
- **Product Details**: Comprehensive view with multiple images (zoomable), detailed descriptions, and user reviews.

### 3.3 Shopping Experience
- **Favorites/Wishlist**: Save products for later.
- **Shopping Cart**: Manage items, adjust quantities, and view real-time subtotal calculations.
- **Checkout Flow**: multi-step checkout including shipping address selection and payment method choice.

### 3.4 Payments & Orders
- **M-Pesa Integration**: Native STK Push integration for seamless local payments.
- **Cash on Delivery**: Support for manual payment methods.
- **Order Tracking**: Real-time status updates (Processing, Shipped, Delivered) and tracking history.
- **Order History**: Detailed view of past orders.

### 3.5 Social & Engagement
- **Reviews & Ratings**: Users can read and write product reviews with star ratings.
- **Notifications**: Updates on order status and promotions.

## 4. Technical Stack
- **Frontend**: React Native with Expo (SDK 54+), Expo Router.
- **Styling**: Native styling with Lucide React Native icons.
- **State Management**: Zustand (Client state), React Query (Server state).
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **Payment**: Safaricom M-Pesa API via Supabase Edge Functions.

## 5. Non-Functional Requirements
- **Performance**: Quick load times for product images and smooth transitions.
- **Security**: Secure handling of user data and payment information.
- **Offline Support**: Caching recently viewed products and cart data.
- **Cross-Platform**: Consistent experience across iOS and Android.
