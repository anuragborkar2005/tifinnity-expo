import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapPin, CreditCard, Shield, ChevronRight, ShoppingBag } from 'lucide-react-native';

import { useCartStore } from '@/src/store/cart-store';
import { useAddresses } from '@/src/features/profile/hooks/use-addresses';
import { useProfile } from '@/src/features/profile/hooks/use-profile';
import { useCreateOrder } from '@/src/features/orders/hooks/use-orders';

export default function CartScreen() {
  const router = useRouter();
  const { items: cartItems, kitchenId, updateQuantity, clearCart, getCartTotal } = useCartStore();
  const { addresses } = useAddresses();
  const { data: profile } = useProfile();
  const createOrderMutation = useCreateOrder();

  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet'>('upi');
  const [instructions, setInstructions] = useState('');

  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];

  // Pricing math (estimates on client side, backend validates strictly)
  const itemTotal = getCartTotal();
  const deliveryCharge = defaultAddress ? 30 : 0; // Flat ₹30 delivery fee estimate
  const taxAmount = parseFloat((itemTotal * 0.05).toFixed(2)); // 5% GST
  const platformFee = 2.00;
  const grandTotal = itemTotal + deliveryCharge + taxAmount + platformFee;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }
    if (!defaultAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    // Verify wallet balance if chosen
    if (paymentMethod === 'wallet' && profile) {
      if (profile.wallet_balance < grandTotal) {
        Alert.alert('Payment Failed', 'Insufficient wallet balance. Please select another payment method.');
        return;
      }
    }

    try {
      const orderParams = {
        kitchen_id: kitchenId!,
        address_id: defaultAddress.id,
        items: cartItems.map((i) => ({
          meal_box_id: i.meal_box_id,
          quantity: i.quantity,
        })),
        coupon_code: couponCode.trim() || undefined,
        payment_method: paymentMethod,
        delivery_instructions: instructions.trim() || undefined,
      };

      const result = await createOrderMutation.mutateAsync(orderParams);

      Alert.alert('Success', 'Order placed successfully!', [
        {
          text: 'Track Order',
          onPress: () => {
            clearCart();
            router.replace({
              pathname: '/tracker' as any,
              params: { id: result.order_id },
            });
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Checkout Failed', err.message || 'An error occurred during checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <ChevronLeft size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
        </View>
        <View style={[styles.center, { flex: 1, padding: 24 }]}>
          <ShoppingBag size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptyDesc}>
            Add some home-cooked meals from nearby kitchens to satisfy your hunger cravings!
          </Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/explore' as any)}>
            <Text style={styles.shopBtnText}>Browse Kitchens</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <ChevronLeft size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Order</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Cart items list */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Items Added</Text>
            {cartItems.map((item) => (
              <View key={item.meal_box_id} style={styles.cartItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price} each</Text>
                </View>
                <View style={styles.stepperControl}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => updateQuantity(item.meal_box_id, item.quantity - 1)}
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => updateQuantity(item.meal_box_id, item.quantity + 1)}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Delivery address */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.addressRow}
              onPress={() => router.push('/select-address' as any)}
            >
              <MapPin size={20} color="#059669" />
              <View style={styles.addressInfo}>
                {defaultAddress ? (
                  <>
                    <Text style={styles.addressLabel}>{defaultAddress.label}</Text>
                    <Text style={styles.addressText} numberOfLines={1}>
                      {defaultAddress.address_line1}, {defaultAddress.city}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.addressLabel}>Select Delivery Address</Text>
                )}
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Payment Method Selector */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Choose Payment Method</Text>
            
            <TouchableOpacity
              style={[styles.payMethodRow, paymentMethod === 'upi' && styles.payMethodActive]}
              onPress={() => setPaymentMethod('upi')}
            >
              <CreditCard size={18} color={paymentMethod === 'upi' ? '#059669' : '#6B7280'} />
              <Text style={styles.payMethodText}>UPI / Instant NetBanking</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.payMethodRow, paymentMethod === 'card' && styles.payMethodActive]}
              onPress={() => setPaymentMethod('card')}
            >
              <CreditCard size={18} color={paymentMethod === 'card' ? '#059669' : '#6B7280'} />
              <Text style={styles.payMethodText}>Debit / Credit Card</Text>
            </TouchableOpacity>

            {profile && (
              <TouchableOpacity
                style={[styles.payMethodRow, paymentMethod === 'wallet' && styles.payMethodActive]}
                onPress={() => setPaymentMethod('wallet')}
              >
                <CreditCard size={18} color={paymentMethod === 'wallet' ? '#059669' : '#6B7280'} />
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.payMethodText}>Tifinnity Wallet Balance</Text>
                  <Text style={styles.walletBalText}>₹{profile.wallet_balance}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Coupons & Instructions */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Apply Coupon</Text>
            <View style={styles.couponInputContainer}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter promo code (e.g. WELCOME50)"
                placeholderTextColor="#9CA3AF"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Delivery Instructions</Text>
            <TextInput
              style={styles.instructionsInput}
              placeholder="e.g. Leave with security, Ring bell twice"
              placeholderTextColor="#9CA3AF"
              value={instructions}
              onChangeText={setInstructions}
              multiline
            />
          </View>

          {/* Billing details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Billing Details</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Subtotal</Text>
              <Text style={styles.billValue}>₹{itemTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Charges</Text>
              <Text style={styles.billValue}>₹{deliveryCharge.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Tax amount (5% GST)</Text>
              <Text style={styles.billValue}>₹{taxAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Platform service fee</Text>
              <Text style={styles.billValue}>₹{platformFee.toFixed(2)}</Text>
            </View>
            <View style={[styles.billRow, { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 10, paddingTop: 10 }]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={[styles.center, { marginVertical: 20 }]}>
            <Text style={{ color: '#9CA3AF', fontSize: 11 }}>
              <Shield size={12} color="#9CA3AF" /> Payments secured by Razorpay integration
            </Text>
          </View>
        </ScrollView>

        {/* Place Order Bar */}
        <View style={styles.bottomCheckoutBar}>
          <TouchableOpacity
            style={styles.placeOrderBtn}
            onPress={handlePlaceOrder}
            disabled={createOrderMutation.isPending}
          >
            {createOrderMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.placeOrderBtnText}>Place Order (₹{grandTotal.toFixed(2)})</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyDesc: { color: '#6B7280', fontSize: 13, textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },
  shopBtn: { backgroundColor: '#065F46', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 24 },
  shopBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFFFFF', gap: 16 },
  headerBackBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },

  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginHorizontal: 16, marginTop: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  cartItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  itemPrice: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  stepperControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, padding: 2 },
  stepperBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' },
  stepperBtnText: { fontSize: 16, color: '#374151', fontWeight: '700' },
  stepperValue: { marginHorizontal: 12, fontSize: 14, fontWeight: '700', color: '#1F2937' },

  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  addressText: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  payMethodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  payMethodActive: { backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 8 },
  payMethodText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  walletBalText: { fontSize: 12, fontWeight: '700', color: '#059669' },

  couponInputContainer: { height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#FAFAFA', justifyContent: 'center' },
  couponInput: { fontSize: 14, color: '#374151', fontWeight: '600' },
  instructionsInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, height: 80, fontSize: 13, color: '#374151', backgroundColor: '#FAFAFA', textAlignVertical: 'top' },

  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  billValue: { fontSize: 13, color: '#374151', fontWeight: '700' },
  grandTotalLabel: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  grandTotalValue: { fontSize: 18, fontWeight: '900', color: '#059669' },

  bottomCheckoutBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 74, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingHorizontal: 16, justifyContent: 'center' },
  placeOrderBtn: { backgroundColor: '#065F46', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#065F46', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  placeOrderBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
