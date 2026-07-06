import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  MapPin,
  Pencil,
  Minus,
  Plus,
  Ticket,
  ChevronRight,
  Info,
  PiggyBank,
  ArrowRight,
} from 'lucide-react-native';

function CartItem({
  title,
  description,
  price,
  imageUri,
  count,
}: {
  title: string;
  description: string;
  price: string;
  imageUri: string;
  count: number;
}) {
  return (
    <View style={styles.cartItemCard}>
      <Image source={{ uri: imageUri }} style={styles.cartItemImage} />
      <View style={styles.cartItemCenter}>
        <Text style={styles.cartItemTitle}>{title}</Text>
        <Text style={styles.cartItemDesc}>{description}</Text>
        <Text style={styles.cartItemPrice}>{price}</Text>
      </View>
      <View style={styles.cartItemRight}>
        <View style={styles.vegBadge}>
          <View style={styles.vegDot} />
        </View>
        <View style={styles.stepper}>
          <TouchableOpacity activeOpacity={0.7} style={styles.stepperBtn} onPress={() => console.log('[Cart] Stepper minus')}>
            <Minus size={14} color="#1A1A1A" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{count}</Text>
          <TouchableOpacity activeOpacity={0.7} style={styles.stepperBtn} onPress={() => console.log('[Cart] Stepper plus')}>
            <Plus size={14} color="#1A1A1A" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* ========== HEADER NAVIGATION BAR ========== */}
          <View style={styles.headerBar}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => console.log('[Cart] Back')}>
              <ArrowLeft size={24} color="#0F6A33" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Your Cart</Text>
            <Bell size={22} color="#0F6A33" strokeWidth={2} />
          </View>

          {/* ========== DELIVERY ADDRESS ========== */}
          <View style={styles.deliveryCard}>
            <View style={styles.locationIconWrap}>
              <MapPin size={20} color="#0F6A33" strokeWidth={2.5} />
            </View>
            <View style={styles.deliveryCenter}>
              <Text style={styles.deliveryTitle}>Delivery Address</Text>
              <Text style={styles.deliveryAddress}>
                Home: 402, Green Meadows, Bandra West, Mumbai - 400050
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => console.log('[Cart] Edit address')}>
              <Text style={styles.editText}>EDIT</Text>
            </TouchableOpacity>
          </View>

          {/* ========== ORDER SUMMARY ========== */}
          <View style={styles.orderSummarySection}>
            <Text style={styles.orderSummaryTitle}>Order Summary</Text>

            <CartItem
              title="Special Homestyle Thali"
              description="Includes 3 Rotis, Dal Tadka, Seasonal Veg, Rice"
              price="₹320"
              imageUri="https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=120"
              count={1}
            />

            <CartItem
              title="Dal Makhani (500ml)"
              description="Slow cooked for 12 hours with pure ghee"
              price="₹240"
              imageUri="https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=120"
              count={1}
            />
          </View>

          {/* ========== APPLY COUPON ========== */}
          <TouchableOpacity activeOpacity={0.7} style={styles.couponBanner} onPress={() => console.log('[Cart] Apply coupon')}>
            <Ticket size={20} color="#C2410C" strokeWidth={2} />
            <Text style={styles.couponText}>Apply Coupon / Offers</Text>
            <ChevronRight size={18} color="#6B7280" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* ========== BILL SUMMARY ========== */}
          <View style={styles.billCard}>
            <Text style={styles.billTitle}>Bill Summary</Text>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹560</Text>
            </View>
            <View style={styles.billRow}>
              <View style={styles.billLabelRow}>
                <Text style={styles.billLabel}>Delivery Fee</Text>
                <Info size={12} color="#6B7280" strokeWidth={2} />
              </View>
              <View style={styles.billValueRow}>
                <Text style={styles.billStrike}>₹40</Text>
                <Text style={styles.billFree}>FREE</Text>
              </View>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Taxes & GST</Text>
              <Text style={styles.billValue}>₹33.60</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Platform Fee</Text>
              <Text style={styles.billValue}>₹10</Text>
            </View>

            <View style={styles.billDivider} />

            <View style={styles.billTotalRow}>
              <Text style={styles.billToPay}>To Pay</Text>
              <Text style={styles.billTotalAmount}>₹643</Text>
            </View>

            {/* Savings Capsule */}
            <View style={styles.savingsBanner}>
              <PiggyBank size={18} color="#C2410C" strokeWidth={2} />
              <Text style={styles.savingsText}>
                You're saving ₹37.40 on this order with your subscription!
              </Text>
            </View>
          </View>

          {/* ========== PLACE ORDER BUTTON ========== */}
          <TouchableOpacity activeOpacity={0.7} style={styles.placeOrderBtn} onPress={() => router.push('/tracker')}>
            <Text style={styles.placeOrderText}>Place Order & Pay</Text>
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={3} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF8F6' },
  safeArea: { flex: 1, backgroundColor: '#FAF8F6' },
  scrollContent: { paddingBottom: 40 },

  // Header
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F6A33' },

  // Delivery Address Card
  deliveryCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8, borderRadius: 20, backgroundColor: '#FFFFFF', padding: 14, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  locationIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2F2E4', alignItems: 'center', justifyContent: 'center' },
  deliveryCenter: { flex: 1, marginLeft: 12 },
  deliveryTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  deliveryAddress: { fontSize: 12, lineHeight: 16, color: '#555555', marginTop: 2 },
  editText: { fontSize: 11, fontWeight: '900', color: '#0F6A33', marginLeft: 8 },

  // Order Summary
  orderSummarySection: { marginHorizontal: 16, marginTop: 20 },
  orderSummaryTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },

  // Cart Item Card
  cartItemCard: { flexDirection: 'row', borderRadius: 20, backgroundColor: '#FFFFFF', padding: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, marginBottom: 12 },
  cartItemImage: { width: 70, height: 70, borderRadius: 12 },
  cartItemCenter: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  cartItemTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  cartItemDesc: { fontSize: 11, color: '#737373', marginTop: 2, lineHeight: 14 },
  cartItemPrice: { fontSize: 14, fontWeight: '700', color: '#0F6A33', marginTop: 4 },
  cartItemRight: { alignItems: 'center', justifyContent: 'space-between' },

  // Veg indicator
  vegBadge: { width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  vegDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 9999, backgroundColor: '#EFECE6', paddingVertical: 2, paddingHorizontal: 2 },
  stepperBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { minWidth: 24, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#1A1A1A' },

  // Coupon Banner
  couponBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8, borderRadius: 9999, backgroundColor: '#E2F2E4', borderWidth: 1, borderColor: '#C6E6CA', paddingVertical: 12, paddingHorizontal: 16 },
  couponText: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700', color: '#1A1A1A' },

  // Bill Summary
  billCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 24, backgroundColor: '#FFFFFF', padding: 20, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  billTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  billLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  billLabel: { fontSize: 13, color: '#555555', flex: 1 },
  billValue: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  billValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  billStrike: { fontSize: 13, fontWeight: '600', color: '#9CA3AF', textDecorationLine: 'line-through' },
  billFree: { fontSize: 13, fontWeight: '700', color: '#16A34A' },
  billDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  billTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  billToPay: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  billTotalAmount: { fontSize: 18, fontWeight: '900', color: '#0F6A33' },

  // Savings Banner
  savingsBanner: { flexDirection: 'row', gap: 10, borderRadius: 12, backgroundColor: '#FCECE3', paddingHorizontal: 14, paddingVertical: 12 },
  savingsText: { flex: 1, fontSize: 11, lineHeight: 14, color: '#78350F' },

  // Place Order Button
  placeOrderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 20, borderRadius: 9999, backgroundColor: '#0F6A33', paddingVertical: 16, gap: 8 },
  placeOrderText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
