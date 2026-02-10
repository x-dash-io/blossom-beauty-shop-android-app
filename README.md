# Blossom Beauty Shop

A premium mobile e-commerce application for beauty and skincare products, built with React Native, Expo, and Supabase.

## Features

- **Product Discovery**: Browse by category, search, and filter premium beauty products.
- **Shopping Cart**: Seamlessly add items to your cart and manage your selection.
- **M-Pesa Integration**: Integrated local payment support using M-Pesa STK Push.
- **Order Tracking**: Real-time updates on your order status.
- **User Profiles**: Manage your addresses, favorites, and order history.

## Tech Stack

- **Frontend**: React Native, Expo, Expo Router
- **Backend**: Supabase (Postgres, Auth, Edge Functions)
- **State Management**: Zustand, React Query
- **Icons**: Lucide React Native

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Bun](https://bun.sh/)
- [Expo Go](https://expo.dev/expo-go) app on your mobile device (optional but recommended)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd blossom-beauty-shop-android-app
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Environment Setup**:
   Create a `.env` file (or update your environment) with your Supabase credentials:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**:
   Run the SQL scripts located in `lib/schema.sql` in your Supabase SQL editor to set up the necessary tables and policies.

### Running the App

- **Start Development Server**:
  ```bash
  bun run start
  ```
- **Run on Web**:
  ```bash
  bun run start-web
  ```
- **Run on Android**:
  Press `a` in the terminal after starting.
- **Run on iOS**:
  Press `i` in the terminal after starting.

## Testing Plan

### 1. Unit Testing
- Focus on testing hooks (`hooks/useProductFilter.ts`) and utility functions.
- Run tests using:
  ```bash
  # Example (if Vitest/Jest is configured)
  bun test
  ```

### 2. Integration Testing
- **Auth Flow**: Test signup, login, and password reset.
- **Checkout Flow**: Add products to cart, enter address, and proceed to payment.
- **Payment**: Verify M-Pesa STK Push triggers correctly (requires sandbox credentials).

### 3. Manual Testing
- Verify UI on multiple devices (physical and emulators).
- Check image zoom functionality on product pages.
- Ensure favorites persist after app reload.

## Documentation

- [Product Requirements Document (PRD)](./PRD.md)
- [Development Plan](./PLAN.md)
