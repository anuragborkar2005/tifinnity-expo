import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChefHat, ClipboardList, CheckCircle2, Play, PackageCheck, LogOut,
} from 'lucide-react-native';

import { usePartnerKitchen } from '@/src/features/partner/hooks/use-partner-kitchen';
import { supabase } from '@/src/lib/supabase/client';

export default function PartnerDashboardScreen() {
  const router = useRouter();
  const {
    kitchen,
    isLoadingKitchen,
    orders,
    isLoadingOrders,
    dishes,
    isLoadingDishes,
    updateOrderStatus,
    toggleDish,
  } = usePartnerKitchen();

  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    try {
      await updateOrderStatus({ orderId, status: nextStatus });
      Alert.alert('Status Updated', `Order marked as ${nextStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update order status');
    }
  };

  const handleToggleDish = async (dishId: string, currentVal: boolean) => {
    try {
      await toggleDish({ dishId, isActive: !currentVal });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update dish status');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Confirm logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => supabase.auth.signOut() },
    ]);
  };

  if (isLoadingKitchen) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color="#065F46" />
      </SafeAreaView>
    );
  }

  if (!kitchen) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={[styles.center, { flex: 1, padding: 32 }]}>
          <ChefHat size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Merchant Account Unlinked</Text>
          <Text style={styles.emptyDesc}>
            This user account does not have a kitchen profile. Please contact administration for onboarding.
          </Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={16} color="#FFFFFF" />
            <Text style={styles.logoutText}> Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const placedOrders = orders.filter((o) => o.order_status === 'placed');
  const preparingOrders = orders.filter((o) => ['accepted', 'preparing'].includes(o.order_status));
  const readyOrders = orders.filter((o) => o.order_status === 'ready_for_pickup');

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{kitchen.name}</Text>
            <Text style={styles.headerSubtitle}>Kitchen Partner Panel</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.headerLogout} onPress={handleLogout}>
            <LogOut size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
              Orders ({orders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'menu' && styles.tabBtnActive]}
            onPress={() => setActiveTab('menu')}
          >
            <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>
              Menu Manager ({dishes.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'orders' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Placed Orders */}
            {placedOrders.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>Incoming Orders ({placedOrders.length})</Text>
                {placedOrders.map((order) => (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderTopRow}>
                      <Text style={styles.orderCust}>Cust: {order.users?.full_name || 'Anonymous'}</Text>
                      <Text style={styles.orderTime}>{new Date(order.placed_at).toLocaleTimeString()}</Text>
                    </View>
                    <Text style={styles.orderAddr}>
                      Deliver: {order.user_addresses?.address_line1}, {order.user_addresses?.city}
                    </Text>
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.acceptBtn]}
                        onPress={() => handleStatusChange(order.id, 'accepted')}
                      >
                        <CheckCircle2 size={14} color="#FFFFFF" />
                        <Text style={styles.actionBtnText}> Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.declineBtn]}
                        onPress={() => handleStatusChange(order.id, 'rejected')}
                      >
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Preparing Orders */}
            {preparingOrders.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionLabel, { color: '#EA580C' }]}>In Preparation ({preparingOrders.length})</Text>
                {preparingOrders.map((order) => (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderTopRow}>
                      <Text style={styles.orderCust}>Cust: {order.users?.full_name || 'Anonymous'}</Text>
                      <Text style={styles.orderStatus}>Status: {order.order_status.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.orderAddr}>
                      Deliver: {order.user_addresses?.address_line1}, {order.user_addresses?.city}
                    </Text>
                    <View style={styles.actionsRow}>
                      {order.order_status === 'accepted' ? (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.prepareBtn]}
                          onPress={() => handleStatusChange(order.id, 'preparing')}
                        >
                          <Play size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}> Start Preparing</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.readyBtn]}
                          onPress={() => handleStatusChange(order.id, 'ready_for_pickup')}
                        >
                          <PackageCheck size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}> Mark Ready</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Ready for Pickup */}
            {readyOrders.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionLabel, { color: '#059669' }]}>Ready & Awaiting Rider ({readyOrders.length})</Text>
                {readyOrders.map((order) => (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderTopRow}>
                      <Text style={styles.orderCust}>Cust: {order.users?.full_name || 'Anonymous'}</Text>
                      <Text style={styles.orderTime}>{new Date(order.placed_at).toLocaleTimeString()}</Text>
                    </View>
                    <Text style={styles.orderAddr}>
                      Deliver: {order.user_addresses?.address_line1}, {order.user_addresses?.city}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {orders.length === 0 && (
              <View style={[styles.center, { marginTop: 60 }]}>
                <ClipboardList size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No active orders currently.</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Dishes List</Text>
              {dishes.map((dish) => (
                <View key={dish.id} style={styles.dishRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dishName}>{dish.name}</Text>
                    <Text style={styles.dishPrice}>₹{dish.price}</Text>
                  </View>
                  <Switch
                    value={dish.is_active}
                    onValueChange={() => handleToggleDish(dish.id, dish.is_active)}
                    trackColor={{ true: '#059669' }}
                  />
                </View>
              ))}
              {dishes.length === 0 && (
                <Text style={styles.emptyText}>No dishes configured in this kitchen.</Text>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyDesc: { color: '#6B7280', fontSize: 13, textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },
  logoutBtn: { backgroundColor: '#DC2626', flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 24 },
  logoutText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginTop: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#065F46' },
  headerSubtitle: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  headerLogout: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },

  tabRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#059669' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  tabTextActive: { color: '#059669' },

  sectionBlock: { marginTop: 20, marginHorizontal: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#1F2937', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  orderTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderCust: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  orderTime: { fontSize: 11, color: '#9CA3AF' },
  orderStatus: { fontSize: 11, color: '#EA580C', fontWeight: '700' },
  orderAddr: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  actionBtn: { flex: 1, height: 38, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  actionBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  acceptBtn: { backgroundColor: '#059669' },
  declineBtn: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' },
  declineBtnText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
  prepareBtn: { backgroundColor: '#3B82F6' },
  readyBtn: { backgroundColor: '#EA580C' },

  dishRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dishName: { fontSize: 14, fontWeight: '700', color: '#374151' },
  dishPrice: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
