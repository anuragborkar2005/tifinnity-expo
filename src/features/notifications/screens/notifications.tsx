import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, CheckCircle } from 'lucide-react-native';

import { useNotifications } from '@/src/features/notifications/hooks/use-notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, isLoading, markAsRead } = useNotifications();

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (err) {
      console.error('[Notifications] Failed to mark read:', err);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color="#065F46" />
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
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {notifications.length === 0 ? (
            <View style={[styles.center, { marginTop: 80 }]}>
              <Bell size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>{"You're all caught up! No new notifications."}</Text>
            </View>
          ) : (
            notifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={[styles.notificationCard, item.is_read && styles.notificationCardRead]}
                onPress={() => handleMarkRead(item.id)}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, item.is_read && styles.cardTextRead]}>{item.title}</Text>
                  {!item.is_read && <View style={styles.unreadDot} />}
                </View>
                <Text style={[styles.cardBody, item.is_read && styles.cardTextRead]}>{item.body}</Text>
                <Text style={styles.cardTime}>{new Date(item.created_at).toLocaleString()}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 60 },
  emptyText: { color: '#9CA3AF', fontSize: 13, marginTop: 12 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  headerBackBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },

  notificationCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  notificationCardRead: { backgroundColor: '#F9FAFB', opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  cardTextRead: { color: '#9CA3AF' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669' },
  cardBody: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  cardTime: { fontSize: 10, color: '#9CA3AF', marginTop: 8, fontWeight: '600' },
});
