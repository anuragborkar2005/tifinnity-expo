import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ClipboardList, Package, ChevronRight } from 'lucide-react-native';

import { useOrders, Order } from '@/src/features/orders/hooks/use-orders';
import { useCartStore } from '@/src/store/cart-store';

export default function OrdersListScreen() {
  const router = useRouter();
  const { data: orders, isLoading, error } = useOrders();
  const { addItem, replaceCart } = useCartStore();

  const handleReorder = (order: Order) => {
    // Basic reorder logic (simulate adding the item)
    const mockItem = {
      meal_box_id: order.kitchen_id, // fallback mapping
      name: order.order_type === 'subscription' ? 'Subscription Box' : 'One-time Thali',
      price: order.total_amount,
    };
    const res = addItem(mockItem, order.kitchen_id);
    if (res.mismatch) {
      Alert.alert(
        'Replace Cart?',
        'Clear cart and add this reordered item instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', onPress: () => replaceCart(mockItem, order.kitchen_id) }
        ]
      );
    } else {
      Alert.alert('Cart Updated', 'Items added to cart.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color="#065F46" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>Failed to load order history.</Text>
      </SafeAreaView>
    );
  }

  const activeOrders = orders?.filter((o) =>
    ['pending_payment', 'placed', 'accepted', 'preparing', 'ready_for_pickup', 'delivery_assigned', 'picked_up', 'out_for_delivery'].includes(o.order_status)
  ) || [];

  const pastOrders = orders?.filter((o) =>
    ['delivered', 'cancelled', 'refund_pending', 'refunded', 'rejected'].includes(o.order_status)
  ) || [];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>My Orders</Text>
          <Text style={styles.subtitle}>Track and manage your meal orders</Text>

          {/* Active Orders Section */}
          {activeOrders.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Active Orders</Text>
                <View style={styles.activeDot} />
              </View>
              {activeOrders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  activeOpacity={0.9}
                  style={styles.orderCard}
                  onPress={() => router.push({ pathname: '/tracker' as any, params: { id: order.id } })}
                >
                  <View style={styles.orderCardTop}>
                    <Image
                      source={{ uri: order.kitchens?.logo_url || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&q=80' }}
                      style={styles.orderImage}
                    />
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderKitchen}>{order.kitchens?.name || 'Home Kitchen'}</Text>
                      <Text style={styles.orderType}>Type: {order.order_type === 'subscription' ? 'Subscription' : 'One-time meal'}</Text>
                      <Text style={styles.orderDate}>{new Date(order.placed_at).toLocaleString()}</Text>
                    </View>
                    <ChevronRight size={18} color="#9CA3AF" />
                  </View>
                  <View style={styles.orderBottom}>
                    <Text style={styles.orderTotal}>₹{order.total_amount}</Text>
                    <View style={styles.orderStatusBadge}>
                      <Package size={12} color="#FFFFFF" />
                      <Text style={styles.orderStatusText}>{order.order_status.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Past Orders Section */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Past Orders</Text>
            </View>
            
            {pastOrders.length === 0 ? (
              <View style={styles.emptyView}>
                <ClipboardList size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>No past orders found.</Text>
              </View>
            ) : (
              pastOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderCardTop}>
                    <Image
                      source={{ uri: order.kitchens?.logo_url || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&q=80' }}
                      style={styles.orderImage}
                    />
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderKitchen}>{order.kitchens?.name || 'Home Kitchen'}</Text>
                      <Text style={styles.orderType}>Status: {order.order_status.toUpperCase()}</Text>
                      <Text style={styles.orderDate}>{new Date(order.placed_at).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <View style={styles.orderBottom}>
                    <Text style={styles.orderTotal}>₹{order.total_amount}</Text>
                    <Text style={[styles.orderDelivered, order.order_status === 'cancelled' && { color: '#DC2626' }]}>
                      {order.order_status.toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.reorderButton}
                    onPress={() => handleReorder(order)}
                  >
                    <Text style={styles.reorderText}>Reorder</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
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
  title: { fontSize: 22, fontWeight: '800', color: '#1F2937', paddingHorizontal: 16, paddingTop: 12 },
  subtitle: { fontSize: 13, color: '#6B7280', paddingHorizontal: 16, marginTop: 2, marginBottom: 8 },
  emptyView: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 13, marginTop: 8 },

  sectionBlock: { marginTop: 16, marginHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  sectionHeaderText: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },

  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  orderCardTop: { flexDirection: 'row', alignItems: 'center' },
  orderImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#E5E7EB', resizeMode: 'cover' },
  orderInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  orderKitchen: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  orderType: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  orderDate: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#F3F4F6' },
  orderTotal: { fontSize: 15, fontWeight: '800', color: '#059669' },
  orderStatusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D97706', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  orderStatusText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', marginLeft: 4 },
  orderDelivered: { fontSize: 11, color: '#059669', fontWeight: '600' },
  reorderButton: { marginTop: 8, backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  reorderText: { fontSize: 12, fontWeight: '700', color: '#059669' },
});
