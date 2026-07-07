# Fully Fixed Database Schema, Migrations, & Architectural Explanations

This document provides a consolidated, production-ready, fully fixed SQL schema for the Tifinnity platform, alongside a detailed breakdown of the security audit findings, remediations, and backend architectural patterns. It merges the initial [db.sql](file:///home/codex/projects/mobile/tifinnity-expo/supabase/db.sql) with the security fixes, integrity constraints, indexes, new tables, RPC functions, triggers, and automated cron jobs introduced in migration files [001_core_schema_hardening.sql](file:///home/codex/projects/mobile/tifinnity-expo/supabase/migrations/001_core_schema_hardening.sql) through [013_diner_and_kitchen_rpcs.sql](file:///home/codex/projects/mobile/tifinnity-expo/supabase/migrations/013_diner_and_kitchen_rpcs.sql).

---

## 1. Security Audit Findings & Remediations

### 1.1. Authentication & Role Security Issues
* **Issue 1.1: Delivery Partner Identity Disconnect**
  * *Finding:* The initial `delivery_partners` table used a sequential `BIGINT` primary key without linking to the `auth.users` system or the `users` profile. This made it impossible for delivery riders to log in, authenticate, or own a session.
  * *Remediation:* Refactored `delivery_partners` to bind directly to standard profile IDs via `id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY`. Reference columns on assignments and earnings tables were updated to `UUID` to maintain relational integrity.
* **Issue 1.2: Client-Controllable User Roles (Privilege Escalation)**
  * *Finding:* The trigger function `handle_new_auth_user()` trusted `new.raw_user_meta_data->>'role'` directly from the user signup call. An attacker could pass `{ "role": "admin" }` or `{ "role": "partner" }` in their client-side registration metadata to instantly gain administrative privileges.
  * *Remediation:* Hardened the trigger to hardcode the role to `'diner'` during public signup. Merchants and riders must be manually verified and elevated by administrators.
* **Issue 1.3: Trigger Security Vulnerability (Hijack Risk)**
  * *Finding:* The trigger function `handle_new_auth_user()` was defined as `SECURITY DEFINER` but did not restrict its `search_path`. This made it vulnerable to search-path hijacking by malicious users creating objects in temporary schemas.
  * *Remediation:* Re-declared the trigger function with `SET search_path = public, pg_temp;` to isolate the execution scope.

### 1.2. Relational Integrity & Missing Constraints
* **Issue 2.1: Duplicate Service Areas & Meal Box Dishes**
  * *Finding:* A kitchen could assign duplicate service areas for the same pincode, and dishes could be mapped multiple times inside a single meal box, cluttering query returns and causing relational anomalies.
  * *Remediation:* Added a unique constraint `unique_kitchen_pincode` on `kitchen_service_areas(kitchen_id, pincode)` and a unique constraint `unique_meal_box_dish` on `meal_box_items(meal_box_id, dish_id)`.
* **Issue 2.2: Menu Slot Overlaps**
  * *Finding:* The table `menu_template_days` lacked a constraint to prevent assigning multiple different meal boxes (e.g., two different dinner thalis) to the same day and meal slot in a single rotation template.
  * *Remediation:* Added a composite unique constraint `unique_menu_template_slot` on `(menu_template_id, day_of_week, meal_type)`.
* **Issue 2.3: Multi-Meal-per-Day Delivery Support**
  * *Finding:* The initial `subscription_deliveries` table only had a `delivery_date` and lacked a `meal_type` or slot column. This made it impossible to support subscription plans containing more than one meal per day (e.g., Lunch + Dinner), as duplicate key errors would occur.
  * *Remediation:* Added `meal_type VARCHAR(50)` (validated as breakfast, lunch, or dinner) and applied a composite unique constraint on `(subscription_id, delivery_date, meal_type)`.

### 1.3. Financial Integrity & Mutability
* **Issue 3.1: Mutable User Balances**
  * *Finding:* Storing the wallet balance directly as a mutable column `users.wallet_balance` without a ledger meant there was no way to verify transaction histories, audit changes, or prevent concurrent balance race conditions.
  * *Remediation:* Created an immutable `wallet_transactions` ledger table and implemented a trigger `process_wallet_transaction()` that locks the user row `FOR UPDATE`, calculates ledger balance updates (credits and debits), checks for negative balances (throwing `INSUFFICIENT_WALLET_BALANCE` exceptions), and updates the cached balance automatically.
* **Issue 3.2: Price Manipulation on Checkout**
  * *Finding:* Initial schemas trusted client-provided amounts for orders. Clients could modify order subtotals and pay lower prices.
  * *Remediation:* The `create_order()` RPC calculates order pricing strictly from backend databases, pulling pricing from `meal_boxes.selling_price`, global setting percentages, and coupon rules, ignoring client input.

### 1.4. Security & Row Level Security (RLS) Issues
* **Issue 4.1: Excessive Public Exposures**
  * *Finding:* The `users` table had a selective policy of `Allow public read access to users USING (true)`, which leaked names, phone numbers, email addresses, and wallet balances to any anonymous client.
  * *Remediation:* Defined a strict `users_select` policy allowing users to select only their own records, and limiting external visibility to safe merchant/rider profiles.
* **Issue 4.2: Unauthorized Kitchen Writes**
  * *Finding:* The policy `Allow admins/managers to write kitchens ON kitchens FOR ALL TO authenticated USING (true)` permitted any logged-in diner to edit or delete any kitchen.
  * *Remediation:* Changed kitchen write policies to check for admin roles or confirm the user is the kitchen's owner.

---

## 2. Core Backend Architecture Patterns

### 2.1. State Machine Controls (`transition_order_status` RPC)
The platform enforces a strict, validation-locked state machine to control order progression. All status updates route through the `transition_order_status()` RPC, which:
1. Validates that the requested transition is permitted (e.g. `placed -> accepted` is valid, but `delivered -> preparing` is not).
2. Performs role-based validation check:
   * **Diners** can only transition orders to `cancelled` (and only before they are accepted).
   * **Merchants** can transition states through `accepted`, `preparing`, and `ready_for_pickup`.
   * **Riders** can transition states through `picked_up`, `out_for_delivery`, and `delivered`.
   * **Admins** maintain overrides for logistics routing, cancellations, and refunds.
3. Automatically triggers inventory restock operations on cancellations or rejections.

```
pending_payment -> placed | cancelled
placed -> accepted | rejected | cancelled
accepted -> preparing | cancelled
preparing -> ready_for_pickup
ready_for_pickup -> delivery_assigned
delivery_assigned -> picked_up
picked_up -> out_for_delivery
out_for_delivery -> delivered
```

### 2.2. Idempotent Subscription Rotation & Calendar Scheduler
Subscriptions are the core mechanic of Tifinnity. Scheduling is automated using `generate_subscription_deliveries()`:
* **Timeline Parsing:** Iterates through every date between a subscription's start and end date using database-side date generators (`generate_series`).
* **Availability Filtering:** Checks weekly operational logs (`kitchen_schedules`) and custom holiday records (`kitchen_holidays`) to automatically exclude and skip deliveries on off days.
* **Rotation Matching:** Evaluates the active menu template for each day-of-week (Monday through Sunday) and matches it against the items allowed under the subscription's active plan.
* **Idempotency Guard:** Inserts scheduled deliveries using an `ON CONFLICT DO NOTHING` statement bound to the composite unique key `(subscription_id, delivery_date, meal_type)`. This allows safety runs of the function (e.g., during extensions or resumption) without duplicating delivery slots.

### 2.3. Pause, Resume, and Pro-Rata Cancellation Refunds
* **Timeline Extensions (Pause/Resume):** When a user pauses a subscription, future pending deliveries are temporarily suspended. Upon calling `resume_subscription()`, the system calculates the duration the subscription was frozen, extends the subscription's `end_date` by that exact number of days, and regenerates future delivery slots starting from the next day.
* **Financial Auditing (Cancel with Refund):** To prevent monetary leaks during cancellations, the system counts total scheduled meals against delivered meals. It calculates a pro-rata meal cost from the original invoice total and automatically credits the remaining balance into the customer's wallet balance, logging details to the transaction ledger.

### 2.4. Double-Entry Wallet Ledger Trigger
Wallet balances are managed using a strict write-once ledger pattern:
* **Race Condition Protection:** The trigger function `process_wallet_transaction()` intercepts insertions into `wallet_transactions` and locks the corresponding customer profile row using `FOR UPDATE`.
* **Mathematical Enforcement:** Prevents client-side balance overrides. It calculates credits and debits based on previous values. If a debit exceeds the available balance, it halts the transaction and throws an `INSUFFICIENT_WALLET_BALANCE` exception.
* **Audit Logs:** Calculates and saves the audit-correct `balance_after` in the transaction entry and updates the cache in the `users.wallet_balance` column.

### 2.5. Secure Payment Verification Webhooks
Payments are decoupled from client trusting structures:
1. **Payment Intent:** When a user checks out, `record_payment_intent()` creates a payment entry in `created` status linked to a Razorpay order ID.
2. **Gateway Verification:** The client completes payment via the gateway, and a webhook payload hits our Edge function.
3. **Confirm Payment RPC:** The Edge function runs a signature check and calls `confirm_payment()`:
   * Locks the payment record.
   * If already processed (`captured`), it immediately exits with `TRUE` to prevent double-crediting.
   * Updates status attributes.
   * Moves the corresponding order to `placed` (or activates the subscription and compiles delivery schedules).

---

## 3. Platform Maintenance & Automation

Scheduled background jobs are configured using the `pg_cron` infrastructure:
1. **Subscription Expiration Check (`0 0 * * *`):** Evaluates active subscriptions daily and flags expired ones.
2. **Rotation Calendar Generation (`0 1 * * *`):** Evaluates active subscriptions daily to pre-fill future delivery slots.
3. **Transaction Expiration check (`*/5 * * * *`):** Runs every 5 minutes to sweep orders left in `pending_payment` for longer than 15 minutes, marks them cancelled, and releases reserved meal stock.

---

## 4. Unified Production-Ready SQL Schema

This combined script drops old entities and sets up the fully corrected database in the proper relational dependency order. It is ideal for local initialization, testing, or fresh environment deployments.

```sql
-- =====================================================================
-- 1. DROP EXISTING ENTITIES (REVERSE DEPENDENCY ORDER)
-- =====================================================================
-- Note: Trigger deletion on public.wallet_transactions is skipped here 
-- because dropping the table public.wallet_transactions automatically drops its triggers, 
-- avoiding "relation does not exist" errors on fresh setups.
DROP TRIGGER IF EXISTS on_auth_user_created_v3 ON auth.users;

DROP FUNCTION IF EXISTS public.search_kitchens;
DROP FUNCTION IF EXISTS public.get_home_feed;
DROP FUNCTION IF EXISTS public.process_stuck_orders_reconciliation;
DROP FUNCTION IF EXISTS public.process_scheduled_deliveries_generation;
DROP FUNCTION IF EXISTS public.process_subscription_expiration;
DROP FUNCTION IF EXISTS public.confirm_payment;
DROP FUNCTION IF EXISTS public.record_payment_intent;
DROP FUNCTION IF EXISTS public.admin_adjust_wallet;
DROP FUNCTION IF EXISTS public.process_wallet_transaction;
DROP FUNCTION IF EXISTS public.cancel_subscription;
DROP FUNCTION IF EXISTS public.resume_subscription;
DROP FUNCTION IF EXISTS public.pause_subscription;
DROP FUNCTION IF EXISTS public.skip_subscription_day;
DROP FUNCTION IF EXISTS public.generate_subscription_deliveries;
DROP FUNCTION IF EXISTS public.transition_order_status;
DROP FUNCTION IF EXISTS public.create_order;
DROP FUNCTION IF EXISTS public.validate_order_status_transition;
DROP FUNCTION IF EXISTS public.is_assigned_delivery_partner;
DROP FUNCTION IF EXISTS public.is_delivery_partner;
DROP FUNCTION IF EXISTS public.owns_subscription;
DROP FUNCTION IF EXISTS public.owns_order;
DROP FUNCTION IF EXISTS public.is_kitchen_owner;
DROP FUNCTION IF EXISTS public.is_admin;
DROP FUNCTION IF EXISTS public.handle_new_auth_user;

DROP TABLE IF EXISTS public.current_delivery_locations CASCADE;
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;
DROP TABLE IF EXISTS public.support_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.platform_settings CASCADE;
DROP TABLE IF EXISTS public.refunds CASCADE;
DROP TABLE IF EXISTS public.kitchen_documents CASCADE;
DROP TABLE IF EXISTS public.kitchen_holidays CASCADE;
DROP TABLE IF EXISTS public.kitchen_schedules CASCADE;
DROP TABLE IF EXISTS public.subscription_status_history CASCADE;
DROP TABLE IF EXISTS public.order_status_history CASCADE;
DROP TABLE IF EXISTS public.payment_events CASCADE;
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.favorite_meal_boxes CASCADE;
DROP TABLE IF EXISTS public.favorite_kitchens CASCADE;
DROP TABLE IF EXISTS public.device_tokens CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.delivery_partner_earnings CASCADE;
DROP TABLE IF EXISTS public.delivery_assignments CASCADE;
DROP TABLE IF EXISTS public.delivery_partners CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.coupon_usage CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.order_price_breakdowns CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.subscription_deliveries CASCADE;
DROP TABLE IF EXISTS public.subscription_skip_days CASCADE;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plan_meal_boxes CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.kitchen_discounts CASCADE;
DROP TABLE IF EXISTS public.menu_template_days CASCADE;
DROP TABLE IF EXISTS public.menu_templates CASCADE;
DROP TABLE IF EXISTS public.meal_box_prices CASCADE;
DROP TABLE IF EXISTS public.meal_box_items CASCADE;
DROP TABLE IF EXISTS public.meal_boxes CASCADE;
DROP TABLE IF EXISTS public.dishes CASCADE;
DROP TABLE IF EXISTS public.kitchen_service_areas CASCADE;
DROP TABLE IF EXISTS public.kitchens CASCADE;
DROP TABLE IF EXISTS public.user_addresses CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =====================================================================
-- 2. ENABLE EXTENSIONS
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 3. CORE SCHEMA TABLES DEFINITIONS
-- =====================================================================

-- users Table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role VARCHAR(50) DEFAULT 'diner',
  full_name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(255) UNIQUE,
  wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_user_role CHECK (role IN ('diner', 'partner', 'delivery_partner', 'admin'))
);

-- user_addresses Table
CREATE TABLE public.user_addresses (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  label VARCHAR(255),
  address_line1 TEXT,
  address_line2 TEXT,
  city VARCHAR(255),
  state VARCHAR(255),
  pincode VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT false,
  landmark VARCHAR(255),
  address_type VARCHAR(50) DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'other')),
  recipient_name VARCHAR(255),
  recipient_phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- kitchens Table
CREATE TABLE public.kitchens (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  owner_name VARCHAR(255),
  owner_phone VARCHAR(255),
  email VARCHAR(255),
  description TEXT,
  cuisine_type VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'pending',
  logo_url TEXT,
  cover_image_url TEXT,
  address TEXT,
  pincode VARCHAR(20),
  food_type VARCHAR(50) DEFAULT 'both' CHECK (food_type IN ('veg', 'non-veg', 'both')),
  is_verified BOOLEAN DEFAULT false,
  estimated_delivery_minutes INT DEFAULT 40 CHECK (estimated_delivery_minutes > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_kitchen_status CHECK (status IN ('pending', 'verified', 'suspended'))
);

-- kitchen_service_areas Table
CREATE TABLE public.kitchen_service_areas (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kitchen_id BIGINT REFERENCES public.kitchens(id) ON DELETE CASCADE,
  pincode VARCHAR(20) NOT NULL,
  delivery_charge DECIMAL(10, 2) DEFAULT 0.00,
  minimum_order_amount DECIMAL(10, 2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT unique_kitchen_pincode UNIQUE (kitchen_id, pincode)
);

-- dishes Table
CREATE TABLE public.dishes (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kitchen_id BIGINT REFERENCES public.kitchens(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_veg BOOLEAN DEFAULT true,
  is_jain BOOLEAN DEFAULT false,
  calories INT,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  category VARCHAR(100),
  allergen_information TEXT,
  spice_level VARCHAR(50) DEFAULT 'medium' CHECK (spice_level IN ('mild', 'medium', 'spicy', 'extra_spicy')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- meal_boxes Table
CREATE TABLE public.meal_boxes (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kitchen_id BIGINT REFERENCES public.kitchens(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  meal_type VARCHAR(50),
  meal_box_type VARCHAR(50),
  description TEXT,
  mrp_price DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  available_quantity INT DEFAULT -1,
  availability_status VARCHAR(50) DEFAULT 'available' CHECK (availability_status IN ('available', 'out_of_stock', 'inactive')),
  preparation_time INT DEFAULT 30 CHECK (preparation_time > 0),
  is_jain_available BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_meal_box_pricing CHECK (selling_price <= mrp_price AND selling_price > 0 AND mrp_price > 0)
);

-- meal_box_items Table
CREATE TABLE public.meal_box_items (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  meal_box_id BIGINT REFERENCES public.meal_boxes(id) ON DELETE CASCADE,
  dish_id BIGINT REFERENCES public.dishes(id) ON DELETE CASCADE,
  quantity VARCHAR(50) NOT NULL,
  sort_order INT DEFAULT 0,
  CONSTRAINT unique_meal_box_dish UNIQUE (meal_box_id, dish_id)
);

-- meal_box_prices Table
CREATE TABLE public.meal_box_prices (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  meal_box_id BIGINT REFERENCES public.meal_boxes(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  CONSTRAINT check_meal_box_price_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- menu_templates Table
CREATE TABLE public.menu_templates (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kitchen_id BIGINT REFERENCES public.kitchens(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- menu_template_days Table
CREATE TABLE public.menu_template_days (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  menu_template_id BIGINT REFERENCES public.menu_templates(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  meal_type VARCHAR(50) NOT NULL,
  meal_box_id BIGINT REFERENCES public.meal_boxes(id) ON DELETE CASCADE,
  CONSTRAINT unique_menu_template_slot UNIQUE (menu_template_id, day_of_week, meal_type)
);

-- kitchen_discounts Table
CREATE TABLE public.kitchen_discounts (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kitchen_id BIGINT REFERENCES kitchens(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  discount_type VARCHAR(50) NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- subscription_plans Table
CREATE TABLE public.subscription_plans (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kitchen_id BIGINT REFERENCES kitchens(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_days INT NOT NULL,
  meals_per_day INT NOT NULL DEFAULT 1,
  discount_type VARCHAR(50),
  discount_value DECIMAL(10, 2) DEFAULT 0.00,
  price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_subscription_plan_values CHECK (meals_per_day >= 1 AND duration_days > 0 AND price >= 0)
);

-- subscription_plan_meal_boxes Table
CREATE TABLE public.subscription_plan_meal_boxes (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  plan_id BIGINT REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  meal_box_id BIGINT REFERENCES public.meal_boxes(id) ON DELETE CASCADE,
  CONSTRAINT unique_plan_meal_box UNIQUE (plan_id, meal_box_id)
);

-- user_subscriptions Table
CREATE TABLE public.user_subscriptions (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id BIGINT REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  address_id BIGINT REFERENCES public.user_addresses(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_payment',
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_subscription_status CHECK (status IN ('pending_payment', 'active', 'paused', 'cancelled', 'expired', 'completed')),
  CONSTRAINT check_user_subscription_dates CHECK (end_date >= start_date)
);

-- subscription_skip_days Table
CREATE TABLE public.subscription_skip_days (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  subscription_id BIGINT REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  skip_date DATE NOT NULL,
  reason VARCHAR(255),
  CONSTRAINT unique_subscription_skip_day UNIQUE (subscription_id, skip_date)
);

-- subscription_deliveries Table
CREATE TABLE public.subscription_deliveries (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  subscription_id BIGINT REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  meal_box_id BIGINT REFERENCES public.meal_boxes(id) ON DELETE CASCADE,
  delivery_date DATE NOT NULL,
  delivered_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  delivered_at TIMESTAMP WITH TIME ZONE,
  meal_type VARCHAR(50) NOT NULL DEFAULT 'lunch',
  CONSTRAINT check_delivery_status CHECK (status IN ('pending', 'preparing', 'out_for_delivery', 'delivered', 'skipped', 'failed')),
  CONSTRAINT check_delivery_meal_type CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  CONSTRAINT unique_subscription_delivery UNIQUE (subscription_id, delivery_date, meal_type)
);

-- orders Table
CREATE TABLE public.orders (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  kitchen_id BIGINT REFERENCES public.kitchens(id) ON DELETE SET NULL,
  address_id BIGINT REFERENCES public.user_addresses(id) ON DELETE SET NULL,
  subscription_id BIGINT REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  order_type VARCHAR(50) NOT NULL,
  order_status VARCHAR(50) DEFAULT 'pending_payment',
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT check_order_status CHECK (order_status IN (
    'pending_payment', 'placed', 'accepted', 'rejected', 'preparing', 
    'ready_for_pickup', 'delivery_assigned', 'picked_up', 'out_for_delivery', 
    'delivered', 'cancelled', 'refund_pending', 'refunded'
  ))
);

-- order_items Table
CREATE TABLE public.order_items (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
  meal_box_id BIGINT REFERENCES public.meal_boxes(id) ON DELETE SET NULL,
  meal_box_name VARCHAR(255) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10, 2) NOT NULL
);

-- order_price_breakdowns Table
CREATE TABLE public.order_price_breakdowns (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
  item_total DECIMAL(10, 2) NOT NULL,
  kitchen_discount DECIMAL(10, 2) DEFAULT 0.00,
  coupon_discount DECIMAL(10, 2) DEFAULT 0.00,
  subscription_discount DECIMAL(10, 2) DEFAULT 0.00,
  delivery_charge DECIMAL(10, 2) DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  grand_total DECIMAL(10, 2) NOT NULL,
  CONSTRAINT unique_price_breakdown_order UNIQUE (order_id)
);

-- coupons Table
CREATE TABLE public.coupons (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(50) NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  minimum_order_amount DECIMAL(10, 2) DEFAULT 0.00,
  maximum_discount DECIMAL(10, 2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  usage_limit INT,
  per_user_limit INT DEFAULT 1 CHECK (per_user_limit >= 1),
  coupon_scope VARCHAR(50) DEFAULT 'platform' CHECK (coupon_scope IN ('platform', 'kitchen')),
  kitchen_id BIGINT REFERENCES public.kitchens(id) ON DELETE CASCADE,
  maximum_usage_count INT,
  current_usage_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- coupon_usage Table
CREATE TABLE public.coupon_usage (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  coupon_id BIGINT REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_coupon_usage_order UNIQUE (order_id)
);

-- payments Table
CREATE TABLE public.payments (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  provider VARCHAR(50) DEFAULT 'razorpay',
  provider_order_id VARCHAR(255),
  provider_payment_id VARCHAR(255),
  provider_signature VARCHAR(255),
  currency VARCHAR(10) DEFAULT 'INR',
  failure_reason TEXT,
  refund_amount DECIMAL(10, 2) DEFAULT 0.00,
  raw_metadata JSONB DEFAULT '{}'::jsonb,
  subscription_id BIGINT REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  CONSTRAINT check_payment_status CHECK (payment_status IN ('created', 'pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'))
);

-- delivery_partners Table (Recreated linked to UUID profile)
CREATE TABLE public.delivery_partners (
  id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  vehicle_type VARCHAR(50),
  vehicle_number VARCHAR(50),
  current_status VARCHAR(50) DEFAULT 'inactive',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- delivery_assignments Table
CREATE TABLE public.delivery_assignments (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'assigned'
);

-- delivery_partner_earnings Table
CREATE TABLE public.delivery_partner_earnings (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  partner_id UUID REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- reviews Table
CREATE TABLE public.reviews (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  kitchen_id BIGINT REFERENCES public.kitchens(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_review_order UNIQUE (order_id)
);

-- =====================================================================
-- 4. AUXILIARY / SYSTEM SCHEMA TABLES
-- =====================================================================

-- notifications Table
CREATE TABLE public.notifications (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- device_tokens Table
CREATE TABLE public.device_tokens (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  expo_push_token VARCHAR(255) NOT NULL UNIQUE,
  device_id VARCHAR(255),
  platform VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- favorite_kitchens Table
CREATE TABLE public.favorite_kitchens (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  kitchen_id BIGINT REFERENCES public.kitchens(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, kitchen_id)
);

-- favorite_meal_boxes Table
CREATE TABLE public.favorite_meal_boxes (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  meal_box_id BIGINT REFERENCES public.meal_boxes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, meal_box_id)
);

-- wallet_transactions Table (Ledger)
CREATE TABLE public.wallet_transactions (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('credit', 'debit')),
  reference_type VARCHAR(50),
  reference_id VARCHAR(255),
  description TEXT,
  balance_after DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- payment_events Table
CREATE TABLE public.payment_events (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_provider_event UNIQUE (provider, event_id)
);

-- order_status_history Table
CREATE TABLE public.order_status_history (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- subscription_status_history Table
CREATE TABLE public.subscription_status_history (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  subscription_id BIGINT REFERENCES public.user_subscriptions(id) ON DELETE CASCADE NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- kitchen_schedules Table
CREATE TABLE public.kitchen_schedules (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kitchen_id BIGINT REFERENCES public.kitchens(id) ON DELETE CASCADE NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  CONSTRAINT unique_kitchen_schedule UNIQUE (kitchen_id, day_of_week)
);

-- kitchen_holidays Table
CREATE TABLE public.kitchen_holidays (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kitchen_id BIGINT REFERENCES public.kitchens(id) ON DELETE CASCADE NOT NULL,
  holiday_date DATE NOT NULL,
  reason TEXT,
  CONSTRAINT unique_kitchen_holiday UNIQUE (kitchen_id, holiday_date)
);

-- kitchen_documents Table
CREATE TABLE public.kitchen_documents (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kitchen_id BIGINT REFERENCES public.kitchens(id) ON DELETE CASCADE NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  document_url TEXT NOT NULL,
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- refunds Table
CREATE TABLE public.refunds (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  payment_id BIGINT REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  reason TEXT,
  provider_refund_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- platform_settings Table
CREATE TABLE public.platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- support_tickets Table
CREATE TABLE public.support_tickets (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN ('payment', 'delivery', 'food_quality', 'app_issue', 'other')),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- support_messages Table
CREATE TABLE public.support_messages (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  ticket_id BIGINT REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  message_text TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- admin_audit_logs Table
CREATE TABLE public.admin_audit_logs (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  old_data JSONB,
  new_data JSONB,
  ip_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- current_delivery_locations GPS tracking Table
CREATE TABLE public.current_delivery_locations (
  delivery_id BIGINT REFERENCES public.delivery_assignments(id) ON DELETE CASCADE PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- 5. INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================================
CREATE INDEX idx_user_addresses_user ON public.user_addresses(user_id);
CREATE INDEX idx_kitchens_owner ON public.kitchens(owner_id);
CREATE INDEX idx_kitchen_service_areas_kitchen ON public.kitchen_service_areas(kitchen_id);
CREATE INDEX idx_dishes_kitchen ON public.dishes(kitchen_id);
CREATE INDEX idx_meal_boxes_kitchen ON public.meal_boxes(kitchen_id);
CREATE INDEX idx_meal_box_items_box ON public.meal_box_items(meal_box_id);
CREATE INDEX idx_meal_box_items_dish ON public.meal_box_items(dish_id);
CREATE INDEX idx_meal_box_prices_box ON public.meal_box_prices(meal_box_id);
CREATE INDEX idx_menu_templates_kitchen ON public.menu_templates(kitchen_id);
CREATE INDEX idx_menu_template_days_template ON public.menu_template_days(menu_template_id);
CREATE INDEX idx_kitchen_discounts_kitchen ON public.kitchen_discounts(kitchen_id);
CREATE INDEX idx_subscription_plans_kitchen ON public.subscription_plans(kitchen_id);
CREATE INDEX idx_subscription_plan_meal_boxes_plan ON public.subscription_plan_meal_boxes(plan_id);
CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_plan ON public.user_subscriptions(plan_id);
CREATE INDEX idx_subscription_skip_days_sub ON public.subscription_skip_days(subscription_id);
CREATE INDEX idx_subscription_deliveries_sub ON public.subscription_deliveries(subscription_id);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_kitchen ON public.orders(kitchen_id);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_price_breakdowns_order ON public.order_price_breakdowns(order_id);
CREATE INDEX idx_coupon_usage_user ON public.coupon_usage(user_id);
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_delivery_assignments_order ON public.delivery_assignments(order_id);
CREATE INDEX idx_delivery_assignments_partner ON public.delivery_assignments(partner_id);
CREATE INDEX idx_delivery_partner_earnings_partner ON public.delivery_partner_earnings(partner_id);
CREATE INDEX idx_reviews_kitchen ON public.reviews(kitchen_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);

-- Composite Unique Indexes
CREATE UNIQUE INDEX unique_default_address_per_user ON public.user_addresses (user_id) WHERE (is_default = true);

-- Performance Optimized Query Indexes
CREATE INDEX idx_orders_user_status_date ON public.orders (user_id, order_status, placed_at DESC);
CREATE INDEX idx_orders_kitchen_status_date ON public.orders (kitchen_id, order_status, placed_at DESC);
CREATE INDEX idx_user_subscriptions_user_status ON public.user_subscriptions (user_id, status);
CREATE INDEX idx_kitchen_service_areas_pincode_active ON public.kitchen_service_areas (pincode, is_active);
CREATE INDEX idx_meal_boxes_kitchen_active ON public.meal_boxes (kitchen_id, is_active);
CREATE INDEX idx_subscription_deliveries_sub_date ON public.subscription_deliveries (subscription_id, delivery_date);
CREATE INDEX idx_subscription_deliveries_date_status ON public.subscription_deliveries (delivery_date, status);
CREATE INDEX idx_reviews_kitchen_created ON public.reviews (kitchen_id, created_at DESC);
CREATE INDEX idx_payments_provider_order ON public.payments (provider_order_id);
CREATE INDEX idx_payments_subscription ON public.payments (subscription_id);
CREATE INDEX idx_notifications_user_read_created ON public.notifications (user_id, is_read, created_at DESC);
CREATE INDEX idx_device_tokens_user ON public.device_tokens (user_id, is_active);
CREATE INDEX idx_wallet_transactions_user ON public.wallet_transactions (user_id, created_at DESC);
CREATE INDEX idx_support_tickets_user ON public.support_tickets (user_id);
CREATE INDEX idx_refunds_order ON public.refunds (order_id);

-- =====================================================================
-- 6. SECURITY DEFINER FUNCTIONS & RLS HELPERS
-- =====================================================================

-- is_admin helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- is_kitchen_owner helper
CREATE OR REPLACE FUNCTION public.is_kitchen_owner(k_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.kitchens
    WHERE id = k_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- owns_order helper
CREATE OR REPLACE FUNCTION public.owns_order(o_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = o_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- owns_subscription helper
CREATE OR REPLACE FUNCTION public.owns_subscription(s_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE id = s_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- is_delivery_partner helper
CREATE OR REPLACE FUNCTION public.is_delivery_partner()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'delivery_partner' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- is_assigned_delivery_partner helper
CREATE OR REPLACE FUNCTION public.is_assigned_delivery_partner(o_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.delivery_assignments
    WHERE order_id = o_id 
      AND partner_id = auth.uid() 
      AND status IN ('assigned', 'accepted', 'picked_up')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- =====================================================================
-- 7. DATABASE PROCEDURES & TRANSACTIONS (RPCs)
-- =====================================================================

-- validate_order_status_transition helper
CREATE OR REPLACE FUNCTION public.validate_order_status_transition(old_status VARCHAR(50), new_status VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (old_status = 'pending_payment' AND new_status IN ('placed', 'cancelled')) OR
    (old_status = 'placed' AND new_status IN ('accepted', 'rejected', 'cancelled')) OR
    (old_status = 'accepted' AND new_status IN ('preparing', 'cancelled')) OR
    (old_status = 'preparing' AND new_status IN ('ready_for_pickup', 'cancelled')) OR
    (old_status = 'ready_for_pickup' AND new_status IN ('delivery_assigned', 'picked_up', 'cancelled')) OR
    (old_status = 'delivery_assigned' AND new_status IN ('picked_up', 'cancelled')) OR
    (old_status = 'picked_up' AND new_status IN ('out_for_delivery')) OR
    (old_status = 'out_for_delivery' AND new_status IN ('delivered')) OR
    (new_status = 'refund_pending' AND old_status IN ('placed', 'accepted', 'preparing', 'ready_for_pickup', 'delivery_assigned')) OR
    (old_status = 'refund_pending' AND new_status = 'refunded')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- create_order RPC
CREATE OR REPLACE FUNCTION public.create_order(
  p_kitchen_id BIGINT,
  p_address_id BIGINT,
  p_items JSONB,
  p_coupon_code VARCHAR(50) DEFAULT NULL,
  p_payment_method VARCHAR(50) DEFAULT 'upi',
  p_delivery_instructions TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_user_active BOOLEAN;
  v_pincode VARCHAR(20);
  v_address_exists BOOLEAN;
  v_kitchen_exists BOOLEAN;
  v_kitchen_verified VARCHAR(50);
  v_delivery_charge DECIMAL(10, 2);
  v_min_order DECIMAL(10, 2);
  v_subtotal DECIMAL(10, 2) := 0.00;
  v_kitchen_discount DECIMAL(10, 2) := 0.00;
  v_coupon_discount DECIMAL(10, 2) := 0.00;
  v_tax_percentage DECIMAL(5, 2) := 5.00;
  v_platform_fee DECIMAL(10, 2) := 2.00;
  v_tax_amount DECIMAL(10, 2) := 0.00;
  v_total_amount DECIMAL(10, 2) := 0.00;
  
  v_item RECORD;
  v_mb_name VARCHAR(255);
  v_mb_price DECIMAL(10, 2);
  v_mb_mrp DECIMAL(10, 2);
  v_mb_qty INT;
  v_mb_active BOOLEAN;
  
  v_kd_type VARCHAR(50);
  v_kd_val DECIMAL(10, 2);
  
  v_coupon_id BIGINT;
  v_coupon_active BOOLEAN;
  v_coupon_type VARCHAR(50);
  v_coupon_val DECIMAL(10, 2);
  v_coupon_min DECIMAL(10, 2);
  v_coupon_max DECIMAL(10, 2);
  v_coupon_limit INT;
  v_coupon_current INT;
  v_coupon_user_limit INT;
  v_coupon_user_current INT;
  v_coupon_scope VARCHAR(50);
  v_coupon_kitchen BIGINT;
  v_coupon_expiry DATE;
  
  v_wallet_bal DECIMAL(10, 2);
  v_wallet_after DECIMAL(10, 2);
  
  v_order_id BIGINT;
  v_order_status VARCHAR(50) := 'pending_payment';
  
  v_val TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT is_active, wallet_balance INTO v_user_active, v_wallet_bal 
  FROM public.users WHERE id = v_user_id FOR UPDATE;
  
  IF v_user_active IS FALSE THEN
    RAISE EXCEPTION 'USER_INACTIVE' USING ERRCODE = 'P0002';
  END IF;

  SELECT pincode INTO v_pincode 
  FROM public.user_addresses 
  WHERE id = p_address_id AND user_id = v_user_id;

  IF v_pincode IS NULL THEN
    RAISE EXCEPTION 'ADDRESS_NOT_FOUND' USING ERRCODE = 'P0004';
  END IF;

  SELECT delivery_charge, minimum_order_amount INTO v_delivery_charge, v_min_order 
  FROM public.kitchen_service_areas 
  WHERE kitchen_id = p_kitchen_id AND pincode = v_pincode AND is_active = true;

  IF v_delivery_charge IS NULL THEN
    RAISE EXCEPTION 'KITCHEN_NOT_SERVICEABLE' USING ERRCODE = 'P0006';
  END IF;

  SELECT status INTO v_kitchen_verified 
  FROM public.kitchens WHERE id = p_kitchen_id FOR SHARE;

  IF v_kitchen_verified IS NULL THEN
    RAISE EXCEPTION 'KITCHEN_NOT_FOUND' USING ERRCODE = 'P0005';
  END IF;
  
  IF v_kitchen_verified != 'verified' THEN
    RAISE EXCEPTION 'KITCHEN_NOT_ACTIVE' USING ERRCODE = 'P0015';
  END IF;

  SELECT value INTO v_val FROM public.platform_settings WHERE key = 'platform_fee';
  IF FOUND THEN
    v_platform_fee := v_val::DECIMAL(10,2);
  END IF;
  
  SELECT value INTO v_val FROM public.platform_settings WHERE key = 'tax_percentage';
  IF FOUND THEN
    v_tax_percentage := v_val::DECIMAL(5,2);
  END IF;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(meal_box_id bigint, quantity int) LOOP
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY' USING ERRCODE = 'P0010';
    END IF;

    SELECT name, selling_price, mrp_price, available_quantity, is_active 
      INTO v_mb_name, v_mb_price, v_mb_mrp, v_mb_qty, v_mb_active 
    FROM public.meal_boxes 
    WHERE id = v_item.meal_box_id AND kitchen_id = p_kitchen_id FOR UPDATE;

    IF v_mb_price IS NULL OR v_mb_active IS FALSE THEN
      RAISE EXCEPTION 'MEAL_BOX_NOT_FOUND' USING ERRCODE = 'P0008';
    END IF;

    IF v_mb_qty != -1 THEN
      IF v_mb_qty < v_item.quantity THEN
        RAISE EXCEPTION 'MEAL_BOX_UNAVAILABLE' USING ERRCODE = 'P0009';
      END IF;
      UPDATE public.meal_boxes 
      SET available_quantity = available_quantity - v_item.quantity 
      WHERE id = v_item.meal_box_id;
    END IF;

    v_subtotal := v_subtotal + (v_mb_price * v_item.quantity);
  END LOOP;

  IF v_subtotal < v_min_order THEN
    RAISE EXCEPTION 'MINIMUM_ORDER_NOT_MET' USING ERRCODE = 'P0014';
  END IF;

  SELECT discount_type, discount_value INTO v_kd_type, v_kd_val 
  FROM public.kitchen_discounts 
  WHERE kitchen_id = p_kitchen_id 
    AND is_active = true 
    AND CURRENT_DATE BETWEEN start_date AND end_date 
  LIMIT 1;

  IF FOUND THEN
    IF v_kd_type = 'percentage' THEN
      v_kitchen_discount := v_subtotal * (v_kd_val / 100.00);
    ELSE
      v_kitchen_discount := v_kd_val;
    END IF;
    IF v_kitchen_discount > v_subtotal THEN
      v_kitchen_discount := v_subtotal;
    END IF;
  END IF;

  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    SELECT id, is_active, discount_type, discount_value, minimum_order_amount, maximum_discount, 
           usage_limit, current_usage_count, per_user_limit, coupon_scope, kitchen_id, end_date
      INTO v_coupon_id, v_coupon_active, v_coupon_type, v_coupon_val, v_coupon_min, v_coupon_max,
           v_coupon_limit, v_coupon_current, v_coupon_user_limit, v_coupon_scope, v_coupon_kitchen, v_coupon_expiry
    FROM public.coupons 
    WHERE code = UPPER(p_coupon_code) FOR UPDATE;

    IF v_coupon_id IS NULL OR v_coupon_active IS FALSE OR CURRENT_DATE > v_coupon_expiry THEN
      RAISE EXCEPTION 'COUPON_INVALID' USING ERRCODE = 'P0011';
    END IF;

    IF v_subtotal < v_coupon_min THEN
      RAISE EXCEPTION 'MINIMUM_ORDER_NOT_MET' USING ERRCODE = 'P0014';
    END IF;

    IF v_coupon_limit IS NOT NULL AND v_coupon_current >= v_coupon_limit THEN
      RAISE EXCEPTION 'COUPON_USAGE_LIMIT' USING ERRCODE = 'P0013';
    END IF;

    SELECT COUNT(*) INTO v_coupon_user_current 
    FROM public.coupon_usage 
    WHERE user_id = v_user_id AND coupon_id = v_coupon_id;

    IF v_coupon_user_current >= v_coupon_user_limit THEN
      RAISE EXCEPTION 'COUPON_USAGE_LIMIT' USING ERRCODE = 'P0013';
    END IF;

    IF v_coupon_scope = 'kitchen' AND v_coupon_kitchen != p_kitchen_id THEN
      RAISE EXCEPTION 'COUPON_INVALID' USING ERRCODE = 'P0011';
    END IF;

    IF v_coupon_type = 'percentage' THEN
      v_coupon_discount := (v_subtotal - v_kitchen_discount) * (v_coupon_val / 100.00);
      IF v_coupon_max IS NOT NULL AND v_coupon_discount > v_coupon_max THEN
        v_coupon_discount := v_coupon_max;
      END IF;
    ELSE
      v_coupon_discount := v_coupon_val;
    END IF;

    IF v_coupon_discount > (v_subtotal - v_kitchen_discount) THEN
      v_coupon_discount := v_subtotal - v_kitchen_discount;
    END IF;
  END IF;

  v_tax_amount := (v_subtotal - v_kitchen_discount - v_coupon_discount) * (v_tax_percentage / 100.00);
  IF v_tax_amount < 0 THEN
    v_tax_amount := 0.00;
  END IF;

  v_total_amount := (v_subtotal - v_kitchen_discount - v_coupon_discount) + v_delivery_charge + v_tax_amount + v_platform_fee;

  IF p_payment_method = 'wallet' THEN
    IF v_wallet_bal < v_total_amount THEN
      RAISE EXCEPTION 'PAYMENT_FAILED' USING ERRCODE = 'P0022';
    END IF;

    v_wallet_after := v_wallet_bal - v_total_amount;

    INSERT INTO public.wallet_transactions (user_id, transaction_type, amount, direction, reference_type, reference_id, description, balance_after)
    VALUES (v_user_id, 'order_payment', v_total_amount, 'debit', 'order', NULL, 'Wallet payment for order', v_wallet_after)
    RETURNING id INTO v_val;

    UPDATE public.users 
    SET wallet_balance = v_wallet_after 
    WHERE id = v_user_id;

    v_order_status := 'placed';
  END IF;

  INSERT INTO public.orders (user_id, kitchen_id, address_id, order_type, order_status, subtotal, delivery_fee, tax_amount, discount_amount, total_amount)
  VALUES (v_user_id, p_kitchen_id, p_address_id, 'one-time', v_order_status, v_subtotal, v_delivery_charge, v_tax_amount, (v_kitchen_discount + v_coupon_discount), v_total_amount)
  RETURNING id INTO v_order_id;

  IF p_payment_method = 'wallet' THEN
    UPDATE public.wallet_transactions 
    SET reference_id = v_order_id::VARCHAR 
    WHERE id = v_val::BIGINT;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(meal_box_id bigint, quantity int) LOOP
    SELECT name, selling_price INTO v_mb_name, v_mb_price 
    FROM public.meal_boxes WHERE id = v_item.meal_box_id;

    INSERT INTO public.order_items (order_id, meal_box_id, meal_box_name, unit_price, quantity, total_price)
    VALUES (v_order_id, v_item.meal_box_id, v_mb_name, v_mb_price, v_item.quantity, (v_mb_price * v_item.quantity));
  END LOOP;

  INSERT INTO public.order_price_breakdowns (order_id, item_total, kitchen_discount, coupon_discount, delivery_charge, tax_amount, grand_total)
  VALUES (v_order_id, v_subtotal, v_kitchen_discount, v_coupon_discount, v_delivery_charge, v_tax_amount, v_total_amount);

  IF v_coupon_id IS NOT NULL THEN
    INSERT INTO public.coupon_usage (coupon_id, user_id, order_id)
    VALUES (v_coupon_id, v_user_id, v_order_id);
    
    UPDATE public.coupons 
    SET current_usage_count = current_usage_count + 1 
    WHERE id = v_coupon_id;
  END IF;

  INSERT INTO public.order_status_history (order_id, old_status, new_status, changed_by, reason)
  VALUES (v_order_id, NULL, v_order_status, v_user_id, 'Order created via checkout RPC');

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'total_amount', v_total_amount,
    'order_status', v_order_status,
    'payment_method', p_payment_method
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- transition_order_status RPC
CREATE OR REPLACE FUNCTION public.transition_order_status(
  p_order_id BIGINT,
  p_new_status VARCHAR(50),
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_role VARCHAR(50);
  v_old_status VARCHAR(50);
  v_kitchen_id BIGINT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role INTO v_role FROM public.users WHERE id = v_user_id;

  SELECT order_status, kitchen_id INTO v_old_status, v_kitchen_id 
  FROM public.orders WHERE id = p_order_id FOR UPDATE;

  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0016';
  END IF;

  IF NOT public.validate_order_status_transition(v_old_status, p_new_status) THEN
    RAISE EXCEPTION 'INVALID_ORDER_TRANSITION' USING ERRCODE = 'P0017';
  END IF;

  IF p_new_status = 'cancelled' AND v_role = 'diner' THEN
    IF v_old_status NOT IN ('pending_payment', 'placed') THEN
      RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0003';
    END IF;
    UPDATE public.meal_boxes mb
    SET available_quantity = available_quantity + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id 
      AND mb.id = oi.meal_box_id 
      AND mb.available_quantity != -1;
  
  ELSIF p_new_status IN ('accepted', 'rejected', 'preparing', 'ready_for_pickup') THEN
    IF NOT public.is_kitchen_owner(v_kitchen_id) AND v_role != 'admin' THEN
      RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0003';
    END IF;

    IF p_new_status = 'rejected' THEN
      UPDATE public.meal_boxes mb
      SET available_quantity = available_quantity + oi.quantity
      FROM public.order_items oi
      WHERE oi.order_id = p_order_id 
        AND mb.id = oi.meal_box_id 
        AND mb.available_quantity != -1;
    END IF;

  ELSIF p_new_status IN ('picked_up', 'out_for_delivery', 'delivered') THEN
    IF NOT public.is_assigned_delivery_partner(p_order_id) AND v_role != 'admin' THEN
      RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0003';
    END IF;

  ELSIF p_new_status IN ('delivery_assigned', 'refund_pending', 'refunded') THEN
    IF v_role != 'admin' THEN
      RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0003';
    END IF;
  END IF;

  UPDATE public.orders 
  SET order_status = p_new_status,
      delivered_at = CASE WHEN p_new_status = 'delivered' THEN NOW() ELSE delivered_at END
  WHERE id = p_order_id;

  INSERT INTO public.order_status_history (order_id, old_status, new_status, changed_by, reason)
  VALUES (p_order_id, v_old_status, p_new_status, v_user_id, p_reason);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- generate_subscription_deliveries RPC
CREATE OR REPLACE FUNCTION public.generate_subscription_deliveries(p_subscription_id BIGINT)
RETURNS INT AS $$
DECLARE
  v_user_id UUID;
  v_plan_id BIGINT;
  v_kitchen_id BIGINT;
  v_start_date DATE;
  v_end_date DATE;
  v_status VARCHAR(50);
  v_date DATE;
  v_dow INT;
  v_is_holiday BOOLEAN;
  v_is_off BOOLEAN;
  v_inserted_count INT := 0;
  v_menu RECORD;
BEGIN
  SELECT user_id, plan_id, start_date, end_date, status INTO v_user_id, v_plan_id, v_start_date, v_end_date, v_status
  FROM public.user_subscriptions WHERE id = p_subscription_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND' USING ERRCODE = 'P0018';
  END IF;

  SELECT kitchen_id INTO v_kitchen_id 
  FROM public.subscription_plans WHERE id = v_plan_id;

  FOR v_date IN SELECT generate_series(v_start_date::timestamp, v_end_date::timestamp, '1 day'::interval)::date LOOP
    v_dow := EXTRACT(ISODOW FROM v_date);

    SELECT EXISTS (
      SELECT 1 FROM public.kitchen_holidays 
      WHERE kitchen_id = v_kitchen_id AND holiday_date = v_date
    ) INTO v_is_holiday;

    SELECT EXISTS (
      SELECT 1 FROM public.kitchen_schedules 
      WHERE kitchen_id = v_kitchen_id AND day_of_week = v_dow AND is_closed = true
    ) INTO v_is_off;

    IF v_is_holiday OR v_is_off THEN
      CONTINUE;
    END IF;

    FOR v_menu IN 
      SELECT mtd.meal_type, mtd.meal_box_id, mb.selling_price 
      FROM public.menu_template_days mtd
      JOIN public.menu_templates mt ON mtd.menu_template_id = mt.id
      JOIN public.meal_boxes mb ON mtd.meal_box_id = mb.id
      JOIN public.subscription_plan_meal_boxes spmb ON spmb.meal_box_id = mb.id
      WHERE mt.kitchen_id = v_kitchen_id
        AND mt.is_active = true
        AND mtd.day_of_week = v_dow
        AND spmb.plan_id = v_plan_id
    LOOP
      INSERT INTO public.subscription_deliveries (subscription_id, meal_box_id, delivery_date, meal_type, delivered_price, status)
      VALUES (p_subscription_id, v_menu.meal_box_id, v_date, v_menu.meal_type, v_menu.selling_price, 'pending')
      ON CONFLICT (subscription_id, delivery_date, meal_type) DO NOTHING;
      
      IF FOUND THEN
        v_inserted_count := v_inserted_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- skip_subscription_day RPC
CREATE OR REPLACE FUNCTION public.skip_subscription_day(
  p_subscription_id BIGINT,
  p_skip_date DATE,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_status VARCHAR(50);
  v_end_date DATE;
  v_cutoff_hours INT := 12;
  v_val TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT status, end_date INTO v_status, v_end_date 
  FROM public.user_subscriptions 
  WHERE id = p_subscription_id AND user_id = v_user_id FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND' USING ERRCODE = 'P0018';
  END IF;

  IF v_status != 'active' THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0003';
  END IF;

  IF p_skip_date <= CURRENT_DATE OR p_skip_date > v_end_date THEN
    RAISE EXCEPTION 'INVALID_SKIP_DATE' USING ERRCODE = 'P0019';
  END IF;

  SELECT value INTO v_val FROM public.platform_settings WHERE key = 'skip_cutoff_hours';
  IF FOUND THEN
    v_cutoff_hours := v_val::INT;
  END IF;

  IF (p_skip_date::timestamp + time '08:00:00' - (v_cutoff_hours || ' hours')::interval) <= NOW() THEN
    RAISE EXCEPTION 'SKIP_CUTOFF_PASSED' USING ERRCODE = 'P0020';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.subscription_deliveries 
    WHERE subscription_id = p_subscription_id AND delivery_date = p_skip_date AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'INVALID_SKIP_DATE' USING ERRCODE = 'P0019';
  END IF;

  INSERT INTO public.subscription_skip_days (subscription_id, skip_date, reason)
  VALUES (p_subscription_id, p_skip_date, p_reason);

  UPDATE public.subscription_deliveries 
  SET status = 'skipped' 
  WHERE subscription_id = p_subscription_id AND delivery_date = p_skip_date AND status = 'pending';

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- pause_subscription RPC
CREATE OR REPLACE FUNCTION public.pause_subscription(
  p_subscription_id BIGINT,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_status VARCHAR(50);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT status INTO v_status 
  FROM public.user_subscriptions 
  WHERE id = p_subscription_id AND user_id = v_user_id FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND' USING ERRCODE = 'P0018';
  END IF;

  IF v_status != 'active' THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0003';
  END IF;

  UPDATE public.user_subscriptions 
  SET status = 'paused' 
  WHERE id = p_subscription_id;

  UPDATE public.subscription_deliveries 
  SET status = 'skipped' 
  WHERE subscription_id = p_subscription_id AND delivery_date > CURRENT_DATE AND status = 'pending';

  INSERT INTO public.subscription_status_history (subscription_id, old_status, new_status, changed_by, reason)
  VALUES (p_subscription_id, 'active', 'paused', v_user_id, p_reason);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- resume_subscription RPC
CREATE OR REPLACE FUNCTION public.resume_subscription(p_subscription_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_status VARCHAR(50);
  v_start_date DATE;
  v_end_date DATE;
  v_paused_at TIMESTAMP WITH TIME ZONE;
  v_paused_days INT;
  v_new_end_date DATE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT status, end_date INTO v_status, v_end_date 
  FROM public.user_subscriptions 
  WHERE id = p_subscription_id AND user_id = v_user_id FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND' USING ERRCODE = 'P0018';
  END IF;

  IF v_status != 'paused' THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0003';
  END IF;

  SELECT created_at INTO v_paused_at 
  FROM public.subscription_status_history 
  WHERE subscription_id = p_subscription_id AND new_status = 'paused'
  ORDER BY created_at DESC LIMIT 1;

  IF v_paused_at IS NULL THEN
    v_paused_at := NOW() - INTERVAL '1 day';
  END IF;

  v_paused_days := GREATEST(1, EXTRACT(DAY FROM NOW() - v_paused_at)::INT);
  v_new_end_date := v_end_date + (v_paused_days || ' days')::INTERVAL;

  UPDATE public.user_subscriptions 
  SET status = 'active',
      end_date = v_new_end_date 
  WHERE id = p_subscription_id;

  INSERT INTO public.subscription_status_history (subscription_id, old_status, new_status, changed_by, reason)
  VALUES (p_subscription_id, 'paused', 'active', v_user_id, 'Subscription resumed. End date shifted by ' || v_paused_days || ' days.');

  DELETE FROM public.subscription_deliveries 
  WHERE subscription_id = p_subscription_id AND delivery_date > CURRENT_DATE AND status = 'skipped';
  
  PERFORM public.generate_subscription_deliveries(p_subscription_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- cancel_subscription RPC
CREATE OR REPLACE FUNCTION public.cancel_subscription(
  p_subscription_id BIGINT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_status VARCHAR(50);
  v_total_amount DECIMAL(10, 2);
  v_refund_amount DECIMAL(10, 2) := 0.00;
  v_total_meals INT;
  v_delivered_meals INT;
  v_remaining_meals INT;
  v_meal_price DECIMAL(10, 2);
  v_wallet_bal DECIMAL(10, 2);
  v_wallet_after DECIMAL(10, 2);
  v_val TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT status, total_amount INTO v_status, v_total_amount 
  FROM public.user_subscriptions 
  WHERE id = p_subscription_id AND user_id = v_user_id FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND' USING ERRCODE = 'P0018';
  END IF;

  IF v_status NOT IN ('active', 'paused') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0003';
  END IF;

  SELECT COUNT(*), COUNT(CASE WHEN status = 'delivered' THEN 1 END)
  INTO v_total_meals, v_delivered_meals
  FROM public.subscription_deliveries 
  WHERE subscription_id = p_subscription_id;

  v_remaining_meals := v_total_meals - v_delivered_meals;

  IF v_remaining_meals > 0 AND v_total_meals > 0 THEN
    v_meal_price := v_total_amount / v_total_meals;
    v_refund_amount := v_meal_price * v_remaining_meals;
  END IF;

  UPDATE public.user_subscriptions 
  SET status = 'cancelled' 
  WHERE id = p_subscription_id;

  DELETE FROM public.subscription_deliveries 
  WHERE subscription_id = p_subscription_id AND delivery_date > CURRENT_DATE AND status = 'pending';

  IF v_refund_amount > 0.00 THEN
    SELECT wallet_balance INTO v_wallet_bal FROM public.users WHERE id = v_user_id FOR UPDATE;
    v_wallet_after := v_wallet_bal + v_refund_amount;

    INSERT INTO public.wallet_transactions (user_id, transaction_type, amount, direction, reference_type, reference_id, description, balance_after)
    VALUES (v_user_id, 'refund', v_refund_amount, 'credit', 'refund', p_subscription_id::VARCHAR, 'Refund for cancelled subscription', v_wallet_after);

    UPDATE public.users 
    SET wallet_balance = v_wallet_after 
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.subscription_status_history (subscription_id, old_status, new_status, changed_by, reason)
  VALUES (p_subscription_id, v_status, 'cancelled', v_user_id, p_reason);

  RETURN jsonb_build_object(
    'subscription_id', p_subscription_id,
    'status', 'cancelled',
    'refund_amount', v_refund_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- process_wallet_transaction trigger function
CREATE OR REPLACE FUNCTION public.process_wallet_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_current_balance DECIMAL(10, 2);
  v_new_balance DECIMAL(10, 2);
BEGIN
  SELECT wallet_balance INTO v_current_balance 
  FROM public.users 
  WHERE id = NEW.user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF NEW.direction = 'credit' THEN
    v_new_balance := v_current_balance + NEW.amount;
  ELSIF NEW.direction = 'debit' THEN
    v_new_balance := v_current_balance - NEW.amount;
    
    IF v_new_balance < 0.00 THEN
      RAISE EXCEPTION 'INSUFFICIENT_WALLET_BALANCE' USING ERRCODE = 'P0022';
    END IF;
  ELSE
    RAISE EXCEPTION 'INVALID_TRANSACTION_DIRECTION' USING ERRCODE = 'P0023';
  END IF;

  UPDATE public.users 
  SET wallet_balance = v_new_balance 
  WHERE id = NEW.user_id;

  NEW.balance_after := v_new_balance;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- admin_adjust_wallet RPC
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(
  p_user_id UUID,
  p_amount DECIMAL(10, 2),
  p_direction VARCHAR(10),
  p_type VARCHAR(50),
  p_description TEXT DEFAULT NULL
)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  v_new_balance DECIMAL(10, 2);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0003';
  END IF;

  INSERT INTO public.wallet_transactions (
    user_id, transaction_type, amount, direction, 
    reference_type, reference_id, description, balance_after
  )
  VALUES (
    p_user_id, p_type, p_amount, p_direction, 
    'manual', auth.uid()::VARCHAR, p_description, 0.00
  )
  RETURNING balance_after INTO v_new_balance;

  INSERT INTO public.admin_audit_logs (admin_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    auth.uid(), 
    'wallet_adjustment', 
    'users', 
    p_user_id::VARCHAR, 
    NULL, 
    jsonb_build_object('amount', p_amount, 'direction', p_direction, 'type', p_type)
  );

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- record_payment_intent RPC
CREATE OR REPLACE FUNCTION public.record_payment_intent(
  p_order_id BIGINT,
  p_subscription_id BIGINT,
  p_amount DECIMAL(10, 2),
  p_provider_order_id VARCHAR(255),
  p_payment_method VARCHAR(50) DEFAULT 'upi'
)
RETURNS BIGINT AS $$
DECLARE
  v_payment_id BIGINT;
BEGIN
  IF p_order_id IS NULL AND p_subscription_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_TARGET' USING ERRCODE = 'P0024';
  END IF;

  INSERT INTO public.payments (
    order_id, subscription_id, payment_method, transaction_id, 
    amount, payment_status, provider, provider_order_id
  )
  VALUES (
    p_order_id, p_subscription_id, p_payment_method, NULL,
    p_amount, 'created', 'razorpay', p_provider_order_id
  )
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- confirm_payment RPC
CREATE OR REPLACE FUNCTION public.confirm_payment(
  p_provider_order_id VARCHAR(255),
  p_provider_payment_id VARCHAR(255),
  p_provider_signature VARCHAR(255),
  p_raw_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
  v_payment_id BIGINT;
  v_order_id BIGINT;
  v_sub_id BIGINT;
  v_amount DECIMAL(10, 2);
  v_current_status VARCHAR(50);
BEGIN
  SELECT id, order_id, subscription_id, amount, payment_status 
    INTO v_payment_id, v_order_id, v_sub_id, v_amount, v_current_status 
  FROM public.payments 
  WHERE provider_order_id = p_provider_order_id FOR UPDATE;

  IF v_payment_id IS NULL THEN
    RAISE EXCEPTION 'PAYMENT_NOT_FOUND' USING ERRCODE = 'P0025';
  END IF;

  IF v_current_status = 'captured' THEN
    RETURN TRUE;
  END IF;

  UPDATE public.payments 
  SET payment_status = 'captured',
      provider_payment_id = p_provider_payment_id,
      provider_signature = p_provider_signature,
      paid_at = NOW(),
      raw_metadata = p_raw_metadata
  WHERE id = v_payment_id;

  IF v_order_id IS NOT NULL THEN
    UPDATE public.orders 
    SET order_status = 'placed' 
    WHERE id = v_order_id AND order_status = 'pending_payment';
    
    INSERT INTO public.order_status_history (order_id, old_status, new_status, reason)
    VALUES (v_order_id, 'pending_payment', 'placed', 'Payment confirmed via Razorpay integration');
  END IF;

  IF v_sub_id IS NOT NULL THEN
    UPDATE public.user_subscriptions 
    SET status = 'active' 
    WHERE id = v_sub_id AND status = 'pending_payment';

    INSERT INTO public.subscription_status_history (subscription_id, old_status, new_status, reason)
    VALUES (v_sub_id, 'pending_payment', 'active', 'Payment confirmed via Razorpay integration');

    PERFORM public.generate_subscription_deliveries(v_sub_id);
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- get_home_feed RPC
CREATE OR REPLACE FUNCTION public.get_home_feed(
  p_latitude DECIMAL(10, 8),
  p_longitude DECIMAL(11, 8),
  p_pincode VARCHAR(20)
)
RETURNS JSONB AS $$
DECLARE
  v_categories JSONB;
  v_offers JSONB;
  v_popular JSONB;
  v_recommended JSONB;
BEGIN
  SELECT jsonb_agg(x) INTO v_categories FROM (
    SELECT category AS name, MIN(image_url) AS image
    FROM public.dishes
    WHERE is_active = true AND category IS NOT NULL AND image_url IS NOT NULL
    GROUP BY category
    LIMIT 8
  ) x;
  
  IF v_categories IS NULL THEN
    v_categories := '[]'::jsonb;
  END IF;

  SELECT jsonb_agg(y) INTO v_offers FROM (
    SELECT kd.id, kd.kitchen_id, k.name AS kitchen_name, kd.title, kd.discount_type, kd.discount_value, k.cover_image_url AS image
    FROM public.kitchen_discounts kd
    JOIN public.kitchens k ON kd.kitchen_id = k.id
    WHERE kd.is_active = true AND k.status = 'verified'
      AND CURRENT_DATE BETWEEN kd.start_date AND kd.end_date
    LIMIT 5
  ) y;
  
  IF v_offers IS NULL THEN
    v_offers := '[]'::jsonb;
  END IF;

  SELECT jsonb_agg(z) INTO v_popular FROM (
    SELECT k.id, k.name, k.cuisine_type AS cuisine, k.rating, k.logo_url AS image, k.cover_image_url AS cover,
           ksa.delivery_charge, ksa.minimum_order_amount AS minimum_order, k.estimated_delivery_minutes AS estimated_time
    FROM public.kitchens k
    JOIN public.kitchen_service_areas ksa ON k.id = ksa.kitchen_id
    WHERE ksa.pincode = p_pincode 
      AND ksa.is_active = true 
      AND k.status = 'verified'
    ORDER BY k.rating DESC
    LIMIT 10
  ) z;
  
  IF v_popular IS NULL THEN
    v_popular := '[]'::jsonb;
  END IF;

  SELECT jsonb_agg(w) INTO v_recommended FROM (
    SELECT k.id, k.name, k.cuisine_type AS cuisine, k.rating, k.logo_url AS image, k.cover_image_url AS cover,
           k.estimated_delivery_minutes AS estimated_time,
           ROUND((3959 * acos(
             cos(radians(p_latitude)) * cos(radians(k.latitude)) * 
             cos(radians(k.longitude) - radians(p_longitude)) + 
             sin(radians(p_latitude)) * sin(radians(k.latitude))
           ))::NUMERIC, 2) AS distance_miles
    FROM public.kitchens k
    JOIN public.kitchen_service_areas ksa ON k.id = ksa.kitchen_id
    WHERE ksa.pincode = p_pincode 
      AND ksa.is_active = true 
      AND k.status = 'verified'
    ORDER BY k.rating DESC
    LIMIT 10
  ) w;
  
  IF v_recommended IS NULL THEN
    v_recommended := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'categories', v_categories,
    'limited_offers', v_offers,
    'popular_kitchens', v_popular,
    'recommended_kitchens', v_recommended
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- search_kitchens RPC
CREATE OR REPLACE FUNCTION public.search_kitchens(
  p_query VARCHAR,
  p_pincode VARCHAR,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_results JSONB;
  v_veg BOOLEAN := COALESCE((p_filters->>'veg_only')::BOOLEAN, false);
  v_jain BOOLEAN := COALESCE((p_filters->>'jain_only')::BOOLEAN, false);
  v_max_delivery DECIMAL(10, 2) := (p_filters->>'max_delivery_charge')::DECIMAL;
BEGIN
  SELECT jsonb_agg(x) INTO v_results FROM (
    SELECT k.id, k.name, k.cuisine_type AS cuisine, k.rating, k.logo_url AS image, k.cover_image_url AS cover,
           ksa.delivery_charge, k.estimated_delivery_minutes AS estimated_time
    FROM public.kitchens k
    JOIN public.kitchen_service_areas ksa ON k.id = ksa.kitchen_id
    WHERE ksa.pincode = p_pincode 
      AND ksa.is_active = true 
      AND k.status = 'verified'
      AND (
        p_query = '' 
        OR k.name ILIKE '%' || p_query || '%'
        OR k.cuisine_type ILIKE '%' || p_query || '%'
        OR EXISTS (
          SELECT 1 FROM public.meal_boxes mb 
          WHERE mb.kitchen_id = k.id AND mb.name ILIKE '%' || p_query || '%'
        )
      )
      AND (NOT v_veg OR k.food_type IN ('veg', 'both'))
      AND (NOT v_jain OR EXISTS (
        SELECT 1 FROM public.meal_boxes mb 
        WHERE mb.kitchen_id = k.id AND mb.is_jain_available = true
      ))
      AND (v_max_delivery IS NULL OR ksa.delivery_charge <= v_max_delivery)
    ORDER BY k.rating DESC
  ) x;
  
  IF v_results IS NULL THEN
    v_results := '[]'::jsonb;
  END IF;
  
  RETURN v_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- process_subscription_expiration daily job function
CREATE OR REPLACE FUNCTION public.process_subscription_expiration()
RETURNS INT AS $$
DECLARE
  v_updated_count INT := 0;
  v_sub RECORD;
BEGIN
  FOR v_sub IN 
    SELECT id, status FROM public.user_subscriptions 
    WHERE status IN ('active', 'paused') AND end_date < CURRENT_DATE FOR UPDATE
  LOOP
    UPDATE public.user_subscriptions 
    SET status = 'expired' 
    WHERE id = v_sub.id;

    INSERT INTO public.subscription_status_history (subscription_id, old_status, new_status, reason)
    VALUES (v_sub.id, v_sub.status, 'expired', 'Subscription period ended naturally');
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- process_scheduled_deliveries_generation daily job function
CREATE OR REPLACE FUNCTION public.process_scheduled_deliveries_generation()
RETURNS INT AS $$
DECLARE
  v_sub RECORD;
  v_total_inserted INT := 0;
  v_res INT;
BEGIN
  FOR v_sub IN 
    SELECT id FROM public.user_subscriptions 
    WHERE status = 'active'
  LOOP
    v_res := public.generate_subscription_deliveries(v_sub.id);
    v_total_inserted := v_total_inserted + v_res;
  END LOOP;
  
  RETURN v_total_inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- process_stuck_orders_reconciliation job function
CREATE OR REPLACE FUNCTION public.process_stuck_orders_reconciliation()
RETURNS INT AS $$
DECLARE
  v_updated_count INT := 0;
  v_stuck RECORD;
BEGIN
  FOR v_stuck IN 
    SELECT id, order_status FROM public.orders 
    WHERE order_status = 'pending_payment' 
      AND placed_at < (NOW() - INTERVAL '15 minutes') 
    FOR UPDATE
  LOOP
    UPDATE public.meal_boxes mb
    SET available_quantity = mb.available_quantity + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = v_stuck.id 
      AND mb.id = oi.meal_box_id 
      AND mb.available_quantity != -1;

    UPDATE public.orders 
    SET order_status = 'cancelled' 
    WHERE id = v_stuck.id;

    INSERT INTO public.order_status_history (order_id, old_status, new_status, reason)
    VALUES (v_stuck.id, 'pending_payment', 'cancelled', 'Order expired due to payment timeout (15 minutes limit)');

    v_updated_count := v_updated_count + 1;
  END LOOP;

  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- =====================================================================
-- 8. SYSTEM TRIGGERS CONFIGURATION
-- =====================================================================

-- secure handle_new_auth_user trigger configuration
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
  inserted_name VARCHAR(255);
BEGIN
  inserted_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User');

  INSERT INTO public.users (id, role, full_name, email, phone, wallet_balance, is_active)
  VALUES (
    new.id,
    'diner', -- Force diner role on signups
    inserted_name,
    new.email,
    new.phone,
    0.00,
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE TRIGGER on_auth_user_created_v3
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- process_wallet_transaction trigger binding
CREATE TRIGGER before_wallet_transaction_inserted
  BEFORE INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.process_wallet_transaction();

-- =====================================================================
-- 9. ROW LEVEL SECURITY (RLS) ACTIVATION
-- =====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_box_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_box_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_template_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plan_meal_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_skip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_price_breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partner_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_meal_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_delivery_locations ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 10. RLS ACCESS CONTROL POLICIES
-- =====================================================================

-- USERS
CREATE POLICY "users_select" ON public.users FOR SELECT USING (
  id = auth.uid() OR role IN ('partner', 'delivery_partner') OR public.is_admin()
);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (id = auth.uid() OR public.is_admin());

-- USER ADDRESSES
CREATE POLICY "addresses_all" ON public.user_addresses FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- KITCHENS
CREATE POLICY "kitchens_select" ON public.kitchens FOR SELECT USING (status = 'verified' OR owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "kitchens_write" ON public.kitchens FOR ALL USING (owner_id = auth.uid() OR public.is_admin());

-- KITCHEN SERVICE AREAS
CREATE POLICY "service_areas_select" ON public.kitchen_service_areas FOR SELECT USING (is_active = true OR public.is_kitchen_owner(kitchen_id) OR public.is_admin());
CREATE POLICY "service_areas_write" ON public.kitchen_service_areas FOR ALL USING (public.is_kitchen_owner(kitchen_id) OR public.is_admin());

-- DISHES
CREATE POLICY "dishes_select" ON public.dishes FOR SELECT USING (is_active = true OR public.is_kitchen_owner(kitchen_id) OR public.is_admin());
CREATE POLICY "dishes_write" ON public.dishes FOR ALL USING (public.is_kitchen_owner(kitchen_id) OR public.is_admin());

-- MEAL BOXES
CREATE POLICY "meal_boxes_select" ON public.meal_boxes FOR SELECT USING (is_active = true OR public.is_kitchen_owner(kitchen_id) OR public.is_admin());
CREATE POLICY "meal_boxes_write" ON public.meal_boxes FOR ALL USING (public.is_kitchen_owner(kitchen_id) OR public.is_admin());

-- MEAL BOX ITEMS
CREATE POLICY "meal_box_items_select" ON public.meal_box_items FOR SELECT USING (true);
CREATE POLICY "meal_box_items_write" ON public.meal_box_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.meal_boxes b WHERE b.id = meal_box_id AND public.is_kitchen_owner(b.kitchen_id)) OR public.is_admin()
);

-- MEAL BOX PRICES
CREATE POLICY "meal_box_prices_select" ON public.meal_box_prices FOR SELECT USING (true);
CREATE POLICY "meal_box_prices_write" ON public.meal_box_prices FOR ALL USING (
  EXISTS (SELECT 1 FROM public.meal_boxes b WHERE b.id = meal_box_id AND public.is_kitchen_owner(b.kitchen_id)) OR public.is_admin()
);

-- MENU TEMPLATES
CREATE POLICY "menu_templates_select" ON public.menu_templates FOR SELECT USING (is_active = true OR public.is_kitchen_owner(kitchen_id) OR public.is_admin());
CREATE POLICY "menu_templates_write" ON public.menu_templates FOR ALL USING (public.is_kitchen_owner(kitchen_id) OR public.is_admin());

-- MENU TEMPLATE DAYS
CREATE POLICY "menu_template_days_select" ON public.menu_template_days FOR SELECT USING (true);
CREATE POLICY "menu_template_days_write" ON public.menu_template_days FOR ALL USING (
  EXISTS (SELECT 1 FROM public.menu_templates t WHERE t.id = menu_template_id AND public.is_kitchen_owner(t.kitchen_id)) OR public.is_admin()
);

-- KITCHEN DISCOUNTS
CREATE POLICY "kitchen_discounts_select" ON public.kitchen_discounts FOR SELECT USING (is_active = true OR public.is_kitchen_owner(kitchen_id) OR public.is_admin());
CREATE POLICY "kitchen_discounts_write" ON public.kitchen_discounts FOR ALL USING (public.is_kitchen_owner(kitchen_id) OR public.is_admin());

-- SUBSCRIPTION PLANS
CREATE POLICY "subscription_plans_select" ON public.subscription_plans FOR SELECT USING (is_active = true OR public.is_kitchen_owner(kitchen_id) OR public.is_admin());
CREATE POLICY "subscription_plans_write" ON public.subscription_plans FOR ALL USING (public.is_kitchen_owner(kitchen_id) OR public.is_admin());

-- SUBSCRIPTION PLAN MEAL BOXES
CREATE POLICY "sub_plan_meal_boxes_select" ON public.subscription_plan_meal_boxes FOR SELECT USING (true);
CREATE POLICY "sub_plan_meal_boxes_write" ON public.subscription_plan_meal_boxes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.subscription_plans p WHERE p.id = plan_id AND public.is_kitchen_owner(p.kitchen_id)) OR public.is_admin()
);

-- USER SUBSCRIPTIONS
CREATE POLICY "user_subscriptions_select" ON public.user_subscriptions FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.subscription_plans p WHERE p.id = plan_id AND public.is_kitchen_owner(p.kitchen_id)) OR public.is_admin()
);
CREATE POLICY "user_subscriptions_write" ON public.user_subscriptions FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- SUBSCRIPTION SKIP DAYS
CREATE POLICY "subscription_skip_days_select" ON public.subscription_skip_days FOR SELECT USING (
  public.owns_subscription(subscription_id) 
  OR EXISTS (SELECT 1 FROM public.user_subscriptions s JOIN public.subscription_plans p ON s.plan_id = p.id WHERE s.id = subscription_id AND public.is_kitchen_owner(p.kitchen_id)) 
  OR public.is_admin()
);
CREATE POLICY "subscription_skip_days_write" ON public.subscription_skip_days FOR ALL USING (public.owns_subscription(subscription_id) OR public.is_admin());

-- SUBSCRIPTION DELIVERIES
CREATE POLICY "subscription_deliveries_select" ON public.subscription_deliveries FOR SELECT USING (
  public.owns_subscription(subscription_id) 
  OR EXISTS (SELECT 1 FROM public.user_subscriptions s JOIN public.subscription_plans p ON s.plan_id = p.id WHERE s.id = subscription_id AND public.is_kitchen_owner(p.kitchen_id)) 
  OR public.is_delivery_partner() 
  OR public.is_admin()
);
CREATE POLICY "subscription_deliveries_write" ON public.subscription_deliveries FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_subscriptions s JOIN public.subscription_plans p ON s.plan_id = p.id WHERE s.id = subscription_id AND public.is_kitchen_owner(p.kitchen_id)) 
  OR public.is_delivery_partner() 
  OR public.is_admin()
);

-- ORDERS
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (
  user_id = auth.uid() OR public.is_kitchen_owner(kitchen_id) OR public.is_assigned_delivery_partner(id) OR public.is_admin()
);
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (
  user_id = auth.uid() OR public.is_kitchen_owner(kitchen_id) OR public.is_assigned_delivery_partner(id) OR public.is_admin()
);

-- ORDER ITEMS
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT USING (
  public.owns_order(order_id) OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_kitchen_owner(o.kitchen_id)) OR public.is_admin()
);

-- ORDER PRICE BREAKDOWNS
CREATE POLICY "order_price_breakdowns_select" ON public.order_price_breakdowns FOR SELECT USING (
  public.owns_order(order_id) OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_kitchen_owner(o.kitchen_id)) OR public.is_admin()
);

-- COUPONS
CREATE POLICY "coupons_select" ON public.coupons FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "coupons_write" ON public.coupons FOR ALL USING (public.is_admin() OR (coupon_scope = 'kitchen' AND public.is_kitchen_owner(kitchen_id)));

-- COUPON USAGE
CREATE POLICY "coupon_usage_select" ON public.coupon_usage FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- PAYMENTS
CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (public.owns_order(order_id) OR public.is_admin());

-- DELIVERY PARTNERS
CREATE POLICY "delivery_partners_select" ON public.delivery_partners FOR SELECT USING (true);
CREATE POLICY "delivery_partners_write" ON public.delivery_partners FOR ALL USING (id = auth.uid() OR public.is_admin());

-- DELIVERY ASSIGNMENTS
CREATE POLICY "delivery_assignments_select" ON public.delivery_assignments FOR SELECT USING (
  public.owns_order(order_id) OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_kitchen_owner(o.kitchen_id)) OR partner_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "delivery_assignments_write" ON public.delivery_assignments FOR ALL USING (partner_id = auth.uid() OR public.is_admin());

-- DELIVERY PARTNER EARNINGS
CREATE POLICY "delivery_partner_earnings_select" ON public.delivery_partner_earnings FOR SELECT USING (partner_id = auth.uid() OR public.is_admin());

-- REVIEWS
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (user_id = auth.uid() AND public.owns_order(order_id));

-- SYSTEM / AUXILIARY POLICIES
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "device_tokens_all" ON public.device_tokens FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "favorite_kitchens_all" ON public.favorite_kitchens FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "favorite_meal_boxes_all" ON public.favorite_meal_boxes FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "wallet_transactions_select" ON public.wallet_transactions FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "payment_events_admin" ON public.payment_events FOR ALL USING (public.is_admin());

CREATE POLICY "order_status_history_select" ON public.order_status_history FOR SELECT USING (
  public.owns_order(order_id) OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.is_kitchen_owner(o.kitchen_id)) OR public.is_admin()
);
CREATE POLICY "subscription_status_history_select" ON public.subscription_status_history FOR SELECT USING (
  public.owns_subscription(subscription_id) OR EXISTS (SELECT 1 FROM public.user_subscriptions s JOIN public.subscription_plans p ON s.plan_id = p.id WHERE s.id = subscription_id AND public.is_kitchen_owner(p.kitchen_id)) OR public.is_admin()
);

CREATE POLICY "kitchen_schedules_select" ON public.kitchen_schedules FOR SELECT USING (true);
CREATE POLICY "kitchen_schedules_write" ON public.kitchen_schedules FOR ALL USING (public.is_kitchen_owner(kitchen_id) OR public.is_admin());

CREATE POLICY "kitchen_holidays_select" ON public.kitchen_holidays FOR SELECT USING (true);
CREATE POLICY "kitchen_holidays_write" ON public.kitchen_holidays FOR ALL USING (public.is_kitchen_owner(kitchen_id) OR public.is_admin());

CREATE POLICY "kitchen_documents_select" ON public.kitchen_documents FOR SELECT USING (public.is_kitchen_owner(kitchen_id) OR public.is_admin());
CREATE POLICY "kitchen_documents_write" ON public.kitchen_documents FOR ALL USING (public.is_kitchen_owner(kitchen_id) OR public.is_admin());

CREATE POLICY "refunds_select" ON public.refunds FOR SELECT USING (public.owns_order(order_id) OR public.is_admin());

CREATE POLICY "platform_settings_select" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "platform_settings_write" ON public.platform_settings FOR ALL USING (public.is_admin());

CREATE POLICY "support_tickets_select" ON public.support_tickets FOR SELECT USING (user_id = auth.uid() OR assigned_admin_id = auth.uid() OR public.is_admin());
CREATE POLICY "support_tickets_insert" ON public.support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "support_tickets_update" ON public.support_tickets FOR UPDATE USING (user_id = auth.uid() OR assigned_admin_id = auth.uid() OR public.is_admin());

CREATE POLICY "support_messages_select" ON public.support_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR t.assigned_admin_id = auth.uid())) OR public.is_admin()
);
CREATE POLICY "support_messages_insert" ON public.support_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR t.assigned_admin_id = auth.uid())) OR public.is_admin()
);

CREATE POLICY "admin_audit_logs_admin" ON public.admin_audit_logs FOR ALL USING (public.is_admin());

-- GPS Location Policies
CREATE POLICY "delivery_location_select" ON public.current_delivery_locations FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.delivery_assignments da
    JOIN public.orders o ON da.order_id = o.id
    WHERE da.id = delivery_id AND (o.user_id = auth.uid() OR public.is_kitchen_owner(o.kitchen_id) OR da.partner_id = auth.uid() OR public.is_admin())
  )
);
CREATE POLICY "delivery_location_write" ON public.current_delivery_locations FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.delivery_assignments da WHERE da.id = delivery_id AND da.partner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.delivery_assignments da WHERE da.id = delivery_id AND da.partner_id = auth.uid())
);

-- =====================================================================
-- 11. STORAGE BUCKETS ROW LEVEL SECURITY
-- =====================================================================
-- The following configurations apply to storage.buckets and storage.objects

-- Avatars storage policies
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "avatars_write" ON storage.objects FOR ALL TO authenticated 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Kitchen assets storage policies
CREATE POLICY "kitchen_assets_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'kitchen-assets');
CREATE POLICY "kitchen_assets_write" ON storage.objects FOR ALL TO authenticated 
  USING (bucket_id = 'kitchen-assets' AND public.is_kitchen_owner((storage.foldername(name))[1]::bigint))
  WITH CHECK (bucket_id = 'kitchen-assets' AND public.is_kitchen_owner((storage.foldername(name))[1]::bigint));

-- Meal images storage policies
CREATE POLICY "meal_images_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'meal-images');
CREATE POLICY "meal_images_write" ON storage.objects FOR ALL TO authenticated 
  USING (bucket_id = 'meal-images' AND public.is_kitchen_owner((storage.foldername(name))[1]::bigint))
  WITH CHECK (bucket_id = 'meal-images' AND public.is_kitchen_owner((storage.foldername(name))[1]::bigint));

-- Kitchen verification documents storage policies (restricted)
CREATE POLICY "kitchen_documents_select" ON storage.objects FOR SELECT TO authenticated 
  USING (bucket_id = 'kitchen-documents' AND (public.is_kitchen_owner((storage.foldername(name))[1]::bigint) OR public.is_admin()));
CREATE POLICY "kitchen_documents_write" ON storage.objects FOR ALL TO authenticated 
  USING (bucket_id = 'kitchen-documents' AND (public.is_kitchen_owner((storage.foldername(name))[1]::bigint) OR public.is_admin()))
  WITH CHECK (bucket_id = 'kitchen-documents' AND (public.is_kitchen_owner((storage.foldername(name))[1]::bigint) OR public.is_admin()));

-- Support tickets attachments storage policies (restricted)
CREATE POLICY "support_attachments_select" ON storage.objects FOR SELECT TO authenticated 
  USING (bucket_id = 'support-attachments' AND (EXISTS (SELECT 1 FROM public.support_tickets WHERE id = (storage.foldername(name))[1]::bigint AND user_id = auth.uid()) OR public.is_admin()));
CREATE POLICY "support_attachments_write" ON storage.objects FOR ALL TO authenticated 
  USING (bucket_id = 'support-attachments' AND (EXISTS (SELECT 1 FROM public.support_tickets WHERE id = (storage.foldername(name))[1]::bigint AND user_id = auth.uid()) OR public.is_admin()))
  WITH CHECK (bucket_id = 'support-attachments' AND (EXISTS (SELECT 1 FROM public.support_tickets WHERE id = (storage.foldername(name))[1]::bigint AND user_id = auth.uid()) OR public.is_admin()));

-- =====================================================================
-- 12. REALTIME REPLICATION CONFIGURATION
-- =====================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.current_delivery_locations;

-- =====================================================================
-- 13. SCHEDULER & AUTOMATIONS (pg_cron)
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'expire-completed-subscriptions', 
      '0 0 * * *', 
      'SELECT public.process_subscription_expiration()'
    );

    PERFORM cron.schedule(
      'generate-future-deliveries', 
      '0 1 * * *', 
      'SELECT public.process_scheduled_deliveries_generation()'
    );

    PERFORM cron.schedule(
      'reconcile-stuck-orders', 
      '*/5 * * * *', 
      'SELECT public.process_stuck_orders_reconciliation()'
    );
  END IF;
END $$;
```

---

## 5. Deployment & Setup Instructions

To deploy the schema to your Supabase project, execute the SQL using one of the following methods:

### Option A: Using the Supabase Dashboard
1. Go to the **Supabase Dashboard** for your project.
2. Navigate to the **SQL Editor** tab on the left sidebar.
3. Click **New Query**, paste the entire contents of the SQL script from Section 4 above, and click **Run**.

### Option B: Local CLI Execution
If you are developing locally with the Supabase CLI, you can initialize the database using:
```bash
supabase db reset
```
This command automatically sweeps and runs all files inside `supabase/migrations/` sequentially, establishing the identical corrected schema defined here.
