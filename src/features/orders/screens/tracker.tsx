import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, MapPin, Phone, CheckCircle2, Circle, AlertCircle } from 'lucide-react-native';

import { useOrder, useOrderRealtime } from '@/src/features/orders/hooks/use-orders';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'accepted', label: 'Preparing' },
  { key: 'ready_for_pickup', label: 'Ready' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export default function OrderTrackerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.id as string;

  // 1. Load order details
  const { data: detail, isLoading, error } = useOrder(orderId);
  
  // 2. Attach Realtime listener for dynamic order updates
  useOrderRealtime(orderId);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color="#065F46" />
      </SafeAreaView>
    );
  }

  if (error || !detail) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>Failed to load order tracker.</Text>
      </SafeAreaView>
    );
  }

  const { order, items, breakdown, history } = detail;

  // Find index of current state in steps
  const getCurrentStepIndex = () => {
    const status = order.order_status;
    if (status === 'delivered') return 4;
    if (status === 'out_for_delivery' || status === 'picked_up') return 3;
    if (status === 'ready_for_pickup') return 2;
    if (status === 'accepted' || status === 'preparing') return 1;
    return 0; // placed/pending
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <ChevronLeft size={22} color="#1F2937" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Track Order</Text>
            <Text style={styles.headerSubtitle}>ID: #{orderId.substring(0, 8)}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Stepper tracker */}
          <View style={styles.trackerCard}>
            {STEPS.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const isPending = idx > currentStepIndex;

              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepIconBlock}>
                    {isCompleted ? (
                      <CheckCircle2 size={20} color="#059669" fill="#D1FAE5" />
                    ) : isCurrent ? (
                      <Circle size={20} color="#EA580C" fill="#FFEDD5" />
                    ) : (
                      <Circle size={20} color="#D1D5DB" />
                    )}
                    {idx < STEPS.length - 1 && (
                      <View style={[styles.stepLine, isCompleted && styles.stepLineActive]} />
                    )}
                  </View>
                  <View style={styles.stepDetails}>
                    <Text style={[styles.stepLabel, isCurrent && styles.stepLabelActive, isPending && styles.stepLabelPending]}>
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.stepDesc}>
                        {order.order_status === 'preparing' ? 'Chef is busy preparing your food...' : 'Updates reflect in real time'}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Kitchen details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Ordered From</Text>
            <Text style={styles.kitchenName}>{order.kitchens?.name || 'Home Kitchen'}</Text>
            <Text style={styles.orderType}>Order Type: {order.order_type.toUpperCase()}</Text>
          </View>

          {/* Items checklist */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Items in Order</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.quantity} x</Text>
                <Text style={styles.itemName}>{item.meal_box_name}</Text>
                <Text style={styles.itemPrice}>₹{item.total_price}</Text>
              </View>
            ))}
          </View>

          {/* Status logs */}
          {history.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Lifecycle History</Text>
              {history.map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <AlertCircle size={14} color="#9CA3AF" />
                  <Text style={styles.logText}>
                    Status changed to <Text style={{ fontWeight: '700' }}>{log.new_status.replace('_', ' ')}</Text>
                    {log.reason ? ` (${log.reason})` : ''} at {new Date(log.created_at).toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Billing breakdown */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Billing Breakdown</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{breakdown.item_total}</Text>
            </View>
            {parseFloat(breakdown.kitchen_discount.toString()) > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Kitchen Discount</Text>
                <Text style={[styles.billValue, { color: '#059669' }]}>-₹{breakdown.kitchen_discount}</Text>
              </View>
            )}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValue}>₹{breakdown.delivery_charge}</Text>
            </View>
            <View style={[styles.billRow, { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 8, paddingTop: 8 }]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>₹{breakdown.grand_total}</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },
  scrollContent: { paddingBottom: 60 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFFFFF', gap: 16 },
  headerBackBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  headerSubtitle: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  trackerCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, marginHorizontal: 16, marginTop: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  stepRow: { flexDirection: 'row', minHeight: 64 },
  stepIconBlock: { alignItems: 'center', width: 28 },
  stepLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  stepLineActive: { backgroundColor: '#059669' },
  stepDetails: { flex: 1, marginLeft: 12, paddingTop: 2 },
  stepLabel: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  stepLabelActive: { color: '#EA580C' },
  stepLabelPending: { color: '#9CA3AF', fontWeight: '500' },
  stepDesc: { fontSize: 11, color: '#EA580C', fontWeight: '500', marginTop: 2 },

  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginHorizontal: 16, marginTop: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  kitchenName: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  orderType: { fontSize: 12, color: '#6B7280', marginTop: 4 },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemQty: { width: 32, fontSize: 13, fontWeight: '800', color: '#059669' },
  itemName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#374151' },
  itemPrice: { fontSize: 13, fontWeight: '700', color: '#1F2937' },

  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  logText: { flex: 1, fontSize: 11, color: '#4B5563', lineHeight: 15 },

  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  billLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  billValue: { fontSize: 12, color: '#374151', fontWeight: '600' },
  grandTotalLabel: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  grandTotalValue: { fontSize: 16, fontWeight: '800', color: '#059669' },
});
