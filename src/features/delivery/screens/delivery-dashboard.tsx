import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MapPin, CheckCircle, Navigation, Play, Package, Shield, LogOut, Compass,
} from 'lucide-react-native';

import { useRider } from '@/src/features/delivery/hooks/use-rider';
import { supabase } from '@/src/lib/supabase/client';

export default function DeliveryDashboardScreen() {
  const router = useRouter();
  const {
    availableOrders,
    isLoadingAvailable,
    assignedOrders,
    isLoadingAssigned,
    acceptDelivery,
    updateDeliveryStatus,
    updateLocation,
  } = useRider();

  const [activeTab, setActiveTab] = useState<'available' | 'assigned'>('available');
  const [gpsSimulating, setGpsSimulating] = useState(false);
  const [simCoords, setSimCoords] = useState({ lat: 21.1458, lng: 79.0882 });

  // Simulate rider movement periodically
  useEffect(() => {
    if (!gpsSimulating) return;

    const interval = setInterval(async () => {
      // Shift coordinates slightly
      const newLat = simCoords.lat + (Math.random() - 0.5) * 0.002;
      const newLng = simCoords.lng + (Math.random() - 0.5) * 0.002;
      setSimCoords({ lat: newLat, lng: newLng });

      try {
        await updateLocation({ lat: newLat, lng: newLng });
        console.log(`[Rider GPS] Location update sent: ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
      } catch (err) {
        console.error('[Rider GPS] Location update failed:', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [gpsSimulating, simCoords, updateLocation]);

  const handleAccept = async (orderId: string) => {
    try {
      await acceptDelivery(orderId);
      Alert.alert('Delivery Accepted', 'Please proceed to the kitchen to pick up the meal.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept delivery task');
    }
  };

  const handleStatusTransition = async (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    let confirmMsg = '';

    if (currentStatus === 'delivery_assigned') {
      nextStatus = 'picked_up';
      confirmMsg = 'Confirm order has been picked up from kitchen?';
    } else if (currentStatus === 'picked_up') {
      nextStatus = 'out_for_delivery';
      confirmMsg = 'Confirm you are out for delivery?';
    } else if (currentStatus === 'out_for_delivery') {
      nextStatus = 'delivered';
      confirmMsg = 'Confirm order has been successfully delivered?';
    }

    if (!nextStatus) return;

    Alert.alert('Update Status', confirmMsg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await updateDeliveryStatus({ orderId, status: nextStatus });
            Alert.alert('Success', `Status updated to ${nextStatus.replace('_', ' ').toUpperCase()}`);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update delivery task');
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Confirm logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => supabase.auth.signOut() },
    ]);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Rider Delivery Portal</Text>
            <Text style={styles.headerSubtitle}>Nagpur Region</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.headerLogout} onPress={handleLogout}>
            <LogOut size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>

        {/* GPS tracking simulation panel */}
        <View style={styles.gpsPanel}>
          <View style={{ flex: 1 }}>
            <Text style={styles.gpsLabel}>GPS Navigation Tracker</Text>
            <Text style={styles.gpsCoords}>
              {gpsSimulating
                ? `Simulating: ${simCoords.lat.toFixed(5)}, ${simCoords.lng.toFixed(5)}`
                : 'GPS Tracking Idle'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.gpsBtn, gpsSimulating ? styles.gpsBtnActive : styles.gpsBtnIdle]}
            onPress={() => setGpsSimulating(!gpsSimulating)}
          >
            <Compass size={16} color="#FFFFFF" />
            <Text style={styles.gpsBtnText}>{gpsSimulating ? ' Stop GPS' : ' Start GPS'}</Text>
          </TouchableOpacity>
        </View>

        {/* Tab row */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'available' && styles.tabBtnActive]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
              Available ({availableOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'assigned' && styles.tabBtnActive]}
            onPress={() => setActiveTab('assigned')}
          >
            <Text style={[styles.tabText, activeTab === 'assigned' && styles.tabTextActive]}>
              Active Tasks ({assignedOrders.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'available' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {availableOrders.length === 0 ? (
              <View style={[styles.center, { marginTop: 60 }]}>
                <Navigation size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No available orders for pickup in your service area.</Text>
              </View>
            ) : (
              availableOrders.map((order) => (
                <View key={order.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.kitchenName}>{order.kitchens?.name || 'Home Kitchen'}</Text>
                    <Text style={styles.priceTag}>₹30.00 Pay</Text>
                  </View>
                  <Text style={styles.addressLine}>
                    📍 <Text style={{ fontWeight: '700' }}>Pickup:</Text> Nagpur Region Mess
                  </Text>
                  <Text style={styles.addressLine}>
                    🏠 <Text style={{ fontWeight: '700' }}>Deliver:</Text> {order.user_addresses?.address_line1}, {order.user_addresses?.city}
                  </Text>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(order.id)}
                  >
                    <CheckCircle size={14} color="#FFFFFF" />
                    <Text style={styles.acceptBtnText}> Accept Delivery Job</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {assignedOrders.length === 0 ? (
              <View style={[styles.center, { marginTop: 60 }]}>
                <Package size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>{"You don't have any active delivery jobs."}</Text>
              </View>
            ) : (
              assignedOrders.map((order) => (
                <View key={order.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.kitchenName}>{order.kitchens?.name || 'Home Kitchen'}</Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>{order.order_status.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.addressLine}>
                    📍 <Text style={{ fontWeight: '700' }}>Pickup:</Text> Nagpur Region Mess
                  </Text>
                  <Text style={styles.addressLine}>
                    🏠 <Text style={{ fontWeight: '700' }}>Deliver:</Text> {order.user_addresses?.address_line1}, {order.user_addresses?.city}
                  </Text>
                  
                  <TouchableOpacity
                    style={[styles.acceptBtn, { backgroundColor: '#EA580C' }]}
                    onPress={() => handleStatusTransition(order.id, order.order_status)}
                  >
                    <Play size={14} color="#FFFFFF" />
                    <Text style={styles.acceptBtnText}>
                      {order.order_status === 'delivery_assigned'
                        ? ' Update: Picked Up'
                        : order.order_status === 'picked_up'
                        ? ' Update: Out for Delivery'
                        : ' Update: Delivered'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
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
  emptyText: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginTop: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#065F46' },
  headerSubtitle: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  headerLogout: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },

  gpsPanel: { flexDirection: 'row', backgroundColor: '#374151', padding: 14, marginHorizontal: 16, marginTop: 14, borderRadius: 14, alignItems: 'center' },
  gpsLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' },
  gpsCoords: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', marginTop: 3 },
  gpsBtn: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  gpsBtnIdle: { backgroundColor: '#059669' },
  gpsBtnActive: { backgroundColor: '#DC2626' },
  gpsBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  tabRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginTop: 16 },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#059669' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  tabTextActive: { color: '#059669' },

  taskCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  kitchenName: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  priceTag: { fontSize: 13, fontWeight: '800', color: '#059669' },
  statusPill: { backgroundColor: '#FFEDD5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 9, color: '#EA580C', fontWeight: '800' },
  addressLine: { fontSize: 12, color: '#4B5563', marginBottom: 8, lineHeight: 18 },
  acceptBtn: { backgroundColor: '#065F46', height: 40, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  acceptBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
