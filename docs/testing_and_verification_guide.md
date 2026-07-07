# Tifinnity testing & Verification Guide

This document outlines the step-by-step procedure to test and verify the Diner, Kitchen Partner, and Delivery Rider flows in the rebuilt Expo monolith application.

---

## 1. Prerequisites & Environment Setup

1. **Verify Environment Variables:**
   Ensure the following variables are set in your local `.env` file (based on `.env.example`):
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   EXPO_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Run Migrations:**
   Ensure all migrations (`001` through `013`) are applied on your database instance:
   ```bash
   npx supabase db push
   ```

3. **Install Dependencies & Start App:**
   Ensure node modules are up-to-date and launch the Expo CLI development server:
   ```bash
   npm install
   npx expo start
   ```

---

## 2. Testing Diner Flows

### 2.1 Sign Up and Auth Gate
1. Open the application. Because no session exists, the `AuthGate` in `app/_layout.tsx` should automatically intercept and navigate you to the **Sign Up Screen** (`/(auth)/signup`).
2. Fill in your details (Name, Email, Phone, Password) and press **Sign Up**.
3. Verify that the diner is inserted with the default role `'diner'` in the `users` table.
4. Log in via email/password or OTP login (`/(auth)/login`) to verify session validation. Upon successful login, you should be redirected automatically to the **tabs structure** (`/(tabs)/index` mapping to the Nagpur Home Feed).

### 2.2 Home Feed & Location
1. Verify the location row displays the Nagpur default address or your saved default address.
2. Tap on the location row to navigate to the **Select Address Screen** (`/select-address`).
3. Press the **+ Plus button** in the header to add a new address. Fill in the fields, set the **Default switch** to true, and save.
4. Verify the default address updates in the list, and returning to the home screen displays the new location and services popular/recommended kitchens servicing that pincode.

### 2.3 Single-Kitchen Cart Constraint
1. Navigate to a kitchen (e.g., tap on a kitchen card to open the **Mess Detail Screen** `/mess-detail?id=kitchen_id`).
2. Add a meal box to the cart. Verify the floating checkout bar appears at the bottom.
3. Return to the home feed and open a **different** kitchen mess detail page.
4. Attempt to add a meal box from this different kitchen.
5. **Expected Outcome:** A confirmation alert dialog ("Clear Cart?") is displayed. Verify that:
   * Pressing **Cancel** aborts the action, preserving the original cart.
   * Pressing **Yes, Replace** clears the original items and adds the new item under the new kitchen reference.

### 2.4 Checkout & Realtime Order Tracking
1. Open the **Shopping Cart Screen** (`/cart`).
2. Verify billing breakdown calculations (GST, platforms fees, delivery charges) update dynamically.
3. Set your payment method to UPI or Card and press **Place Order**.
4. Upon confirmation, you are redirected to the **Order Tracker Screen** (`/tracker?id=order_id`).
5. Open the order tracker page. Watch the delivery stepper update dynamically when the status shifts in the database.

---

## 3. Testing Kitchen Partner Flows

To test the merchant-facing dashboard, we must assign the `'partner'` role to our test user.

1. **Assign Role (SQL Editor):**
   Run the following query in your Supabase SQL editor:
   ```sql
   UPDATE public.users 
   SET role = 'partner' 
   WHERE email = 'your-merchant-test-email@example.com';
   ```
2. **Onboard Kitchen:**
   Ensure a kitchen row exists in `public.kitchens` linked to your user UUID:
   ```sql
   INSERT INTO public.kitchens (owner_id, name, cuisine_type, status, latitude, longitude)
   VALUES ('YOUR_USER_UUID', 'Nagpur Spice Mess', 'Maharashtrian', 'verified', 21.14580, 79.08820)
   ON CONFLICT DO NOTHING;
   ```
3. **Log in as Partner:**
   Log into the application. The wrapper inside `app/(tabs)/index.tsx` detects the `'partner'` role and renders the **Kitchen Partner Dashboard** instead of the home feed.
4. **Accept and Prepare Orders:**
   * Place an order from a diner account to this kitchen.
   * Verify the order appears instantly under **Incoming Orders**.
   * Press **Accept**. The order moves to the **In Preparation** queue.
   * Press **Start Preparing** (transitions status to `preparing`).
   * Press **Mark Ready** (transitions status to `ready_for_pickup`). The order shifts to **Awaiting Rider** and becomes visible to available delivery couriers.

---

## 4. Testing Delivery Partner (Rider) Flows

To test the courier dispatch board, we must assign the `'delivery_partner'` role to our test user.

1. **Assign Role & Register Rider:**
   ```sql
   UPDATE public.users 
   SET role = 'delivery_partner' 
   WHERE email = 'your-rider-test-email@example.com';

   INSERT INTO public.riders (id, status, current_latitude, current_longitude)
   VALUES ('YOUR_RIDER_UUID', 'active', 21.14580, 79.08820)
   ON CONFLICT DO NOTHING;
   ```
2. **Log in as Rider:**
   Log into the app. The wrapper index route loads the **Rider Delivery Portal**.
3. **Accept delivery Jobs:**
   * Navigate to the **Available** tab. Any order in `ready_for_pickup` status without an assigned courier will appear here.
   * Press **Accept Delivery Job**.
   * The order moves to your **Active Tasks** tab.
4. **GPS Tracking Simulation:**
   * Press **Start GPS** in the navigation tracker panel.
   * Verify coordinate numbers change every 10 seconds. Check the database `riders` table to verify these simulated coordinates are updated in real time.
5. **Update Delivery Progress:**
   * Press **Update: Picked Up** (transitions order to `picked_up`).
   * Press **Update: Out for Delivery** (transitions order to `out_for_delivery`).
   * Press **Update: Delivered** (completes delivery, marks delivered timestamp).
   * Verify the Diner's order tracker screen updates instantly at each step via Postgres replication.
