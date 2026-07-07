import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, HelpCircle,
  Award, Calendar as CalendarIcon, Utensils, Play, Pause, Trash2,
} from 'lucide-react-native';

import {
  useSubscriptions,
  useSubscription,
  useSkipDay,
  usePauseSubscription,
  useResumeSubscription,
  useCancelSubscription,
  SubscriptionDelivery,
} from '@/src/features/subscriptions/hooks/use-subscriptions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

export default function SubscriptionTrackerScreen() {
  const router = useRouter();
  
  // 1. Fetch user subscriptions
  const { data: subscriptions, isLoading: subsLoading } = useSubscriptions();
  const activeSub = subscriptions?.find((s) => s.status === 'active' || s.status === 'paused');

  // 2. Fetch specific active subscription calendar
  const subId = activeSub?.id || '';
  const { data: subData, isLoading: subDataLoading } = useSubscription(subId);

  const skipDayMutation = useSkipDay();
  const pauseMutation = usePauseSubscription();
  const resumeMutation = useResumeSubscription();
  const cancelMutation = useCancelSubscription();

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDatePress = (day: number, dateStr: string, delivery?: SubscriptionDelivery) => {
    setSelectedDate(day);
    if (!delivery) return;

    if (delivery.status === 'pending') {
      Alert.alert(
        'Delivery Options',
        `Manage meal delivery for ${dateStr}:`,
        [
          {
            text: 'Skip Meal',
            onPress: async () => {
              try {
                await skipDayMutation.mutateAsync({
                  subscription_id: subId,
                  skip_date: dateStr,
                  reason: 'Skipped by customer',
                });
                Alert.alert('Success', 'Meal skipped.');
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Failed to skip meal');
              }
            },
          },
          { text: 'Close', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert('Delivery Status', `Status on ${dateStr}: ${delivery.status.toUpperCase()}`);
    }
  };

  const handlePauseResume = async () => {
    if (!activeSub) return;
    const isPaused = activeSub.status === 'paused';

    Alert.alert(
      isPaused ? 'Resume Subscription' : 'Pause Subscription',
      isPaused
        ? 'Resume deliveries? Your end date will shift to compensate for the paused days.'
        : 'Pause future deliveries? You can resume anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isPaused ? 'Resume' : 'Pause',
          onPress: async () => {
            try {
              if (isPaused) {
                await resumeMutation.mutateAsync({ subscription_id: subId });
                Alert.alert('Resumed', 'Subscription is now active.');
              } else {
                await pauseMutation.mutateAsync({ subscription_id: subId, reason: 'Paused by user' });
                Alert.alert('Paused', 'Deliveries are suspended.');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Action failed');
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    if (!activeSub) return;
    Alert.alert(
      'Cancel Subscription',
      'Cancel all remaining meals? Undelivered thalis will be refunded to your wallet balance.',
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Cancel Plan',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await cancelMutation.mutateAsync({ subscription_id: subId, reason: 'Cancelled by customer' });
              Alert.alert('Cancelled', `Subscription cancelled. Refunded: ₹${res.refund_amount}`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel');
            }
          },
        },
      ]
    );
  };

  if (subsLoading || (subId && subDataLoading)) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color="#065F46" />
      </SafeAreaView>
    );
  }

  if (!activeSub) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <ChevronLeft size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription Tracker</Text>
        </View>
        <View style={[styles.center, { flex: 1, padding: 24 }]}>
          <CalendarIcon size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Active Subscriptions</Text>
          <Text style={styles.emptyDesc}>
            Subscribe to a daily thali, meal-box, or kitchen package to manage calendar deliveries here.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push('/explore')}
          >
            <Text style={styles.browseBtnText}>Browse Kitchen Plans</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const subscription = subData!.subscription;
  const deliveries = subData!.deliveries || [];

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const prevMonthDays = getDaysInMonth(
    currentMonth - 1 < 0 ? 11 : currentMonth - 1,
    currentMonth - 1 < 0 ? currentYear - 1 : currentYear
  );

  const renderCalendarGrid = () => {
    const cells: React.ReactNode[] = [];

    // Prepad prev month cells
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      cells.push(
        <View key={`prev-${day}`} style={styles.calendarDayCell}>
          <Text style={styles.calendarDayTextMuted}>{day}</Text>
        </View>
      );
    }

    // Render current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const delivery = deliveries.find((d) => d.delivery_date === dateStr);
      const isSelected = selectedDate === day;

      let cellStyle: any = [styles.calendarDayCell];
      let textStyle: any = [styles.calendarDayText];

      if (delivery) {
        if (delivery.status === 'delivered') {
          cellStyle.push(styles.dayDelivered);
          textStyle.push(styles.textDelivered);
        } else if (delivery.status === 'skipped') {
          cellStyle.push(styles.daySkipped);
          textStyle.push(styles.textSkipped);
        } else {
          cellStyle.push(styles.dayPending);
          textStyle.push(styles.textPending);
        }
      }

      if (isSelected) {
        cellStyle.push(styles.calendarDaySelected);
        textStyle.push(styles.calendarDayTextSelected);
      }

      cells.push(
        <TouchableOpacity
          key={`curr-${day}`}
          activeOpacity={0.7}
          onPress={() => handleDatePress(day, dateStr, delivery)}
          style={cellStyle}
        >
          <Text style={textStyle}>{day}</Text>
        </TouchableOpacity>
      );
    }

    return cells;
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <ChevronLeft size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription Tracker</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Active Plan Card */}
          <View style={styles.activePlanSection}>
            <View style={styles.activePlanLabelRow}>
              <Award size={16} color="#E65C00" />
              <Text style={styles.activePlanLabel}>Active Plan Details</Text>
            </View>

            <View style={styles.activePlanCard}>
              <View style={styles.activePlanTopRow}>
                <Text style={styles.activePlanKitchenName}>
                  {subscription.subscription_plans?.kitchens?.name || 'Home Kitchen'}
                </Text>
                <View style={[styles.activeBadge, subscription.status === 'paused' && { backgroundColor: '#D97706' }]}>
                  <Text style={styles.activeBadgeText}>{subscription.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.activePlanMeta}>
                {subscription.subscription_plans?.name} ({subscription.subscription_plans?.meals_per_day} Meal/Day)
              </Text>
              <Text style={styles.activePlanMeta}>
                📅 Ends: {new Date(subscription.end_date).toLocaleDateString()}
              </Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.manageBtn, { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }]}
                  onPress={handlePauseResume}
                >
                  {subscription.status === 'paused' ? (
                    <>
                      <Play size={14} color="#059669" />
                      <Text style={[styles.manageBtnText, { color: '#059669' }]}> Resume</Text>
                    </>
                  ) : (
                    <>
                      <Pause size={14} color="#D97706" />
                      <Text style={[styles.manageBtnText, { color: '#D97706' }]}> Pause</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.manageBtn, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}
                  onPress={handleCancel}
                >
                  <Trash2 size={14} color="#DC2626" />
                  <Text style={[styles.manageBtnText, { color: '#DC2626' }]}> Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Calendar schedule grid */}
          <View style={styles.calendarCard}>
            <View style={styles.calendarCardHeader}>
              <View style={styles.calendarCardTitleRow}>
                <CalendarIcon size={18} color="#2E7D32" />
                <Text style={styles.calendarCardTitle}>Schedule Calendar</Text>
              </View>
              <View style={styles.calendarNavRow}>
                <TouchableOpacity activeOpacity={0.7} onPress={prevMonth} style={styles.calNavBtn}>
                  <ChevronLeft size={16} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.calendarMonthLabel}>
                  {MONTHS[currentMonth]} {currentYear}
                </Text>
                <TouchableOpacity activeOpacity={0.7} onPress={nextMonth} style={styles.calNavBtn}>
                  <ChevronRight size={16} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((d, i) => (
                <Text key={`wd-${i}`} style={styles.weekdayText}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>{renderCalendarGrid()}</View>

            {/* Legend indicators */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ECFDF5', borderColor: '#059669' }]} />
                <Text style={styles.legendText}>Pending</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]} />
                <Text style={styles.legendText}>Delivered</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Skipped</Text>
              </View>
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
  scrollContent: { paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerBackBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptyDesc: { color: '#6B7280', fontSize: 13, textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },
  browseBtn: { backgroundColor: '#065F46', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 24 },
  browseBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  activePlanSection: { marginTop: 20, marginHorizontal: 16 },
  activePlanLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  activePlanLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  activePlanCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  activePlanTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  activePlanKitchenName: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  activeBadge: { backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  activeBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  activePlanMeta: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  manageBtn: { flex: 1, height: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1 },
  manageBtnText: { fontSize: 12, fontWeight: '700' },

  calendarCard: { marginHorizontal: 16, marginTop: 20, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  calendarCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calendarCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calendarCardTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  calendarNavRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  calNavBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  calendarMonthLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  weekdayText: { width: SCREEN_WIDTH / 9, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 6 },
  calendarDayCell: { width: SCREEN_WIDTH / 9, height: SCREEN_WIDTH / 9, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  calendarDayText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  calendarDayTextMuted: { fontSize: 12, color: '#D1D5DB' },
  calendarDaySelected: { borderWidth: 2, borderColor: '#065F46' },
  calendarDayTextSelected: { fontWeight: '800' },

  // Delivery status colors
  dayPending: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  textPending: { color: '#059669', fontWeight: '700' },
  dayDelivered: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#10B981' },
  textDelivered: { color: '#065F46', fontWeight: '700' },
  daySkipped: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2' },
  textSkipped: { color: '#DC2626', fontWeight: '700' },

  legendRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1 },
  legendText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
});
