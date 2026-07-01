import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  Award,
  Calendar,
  Utensils,
  PiggyBank,
} from 'lucide-react-native';

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

interface SubscriptionTrackerProps {
  onBack: () => void;
  onAddToCart?: (items: { name: string; qty: number; price: number }[]) => void;
}

export default function SubscriptionTracker({ onBack }: SubscriptionTrackerProps) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(true);
  const [vegThaliCount, setVegThaliCount] = useState(1);
  const [nonVegThaliCount, setNonVegThaliCount] = useState(0);
  const [liteMealCount, setLiteMealCount] = useState(0);

  const deliveryDates = [1, 2];

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

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const prevMonthDays = getDaysInMonth(currentMonth - 1 < 0 ? 11 : currentMonth - 1, currentMonth - 1 < 0 ? currentYear - 1 : currentYear);

  const handleDatePress = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    setSelectedDate(day);
    console.log(`[SubscriptionTracker] Selected date: ${day}/${currentMonth + 1}/${currentYear}`);
    if (deliveryDates.includes(day)) {
      Alert.alert('Delivery Day', 'What would you like to do?', [
        { text: 'Pause Delivery', onPress: () => console.log(`[SubscriptionTracker] Paused delivery on ${day}`) },
        { text: 'Reschedule Delivery', onPress: () => console.log(`[SubscriptionTracker] Rescheduled delivery on ${day}`) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const subtotal = (vegThaliCount * 120 + nonVegThaliCount * 160 + liteMealCount * 90) * 7;
  const serviceTax = 62.5;
  const grandTotal = subtotal + serviceTax;
  const savedAmount = 350;

  const Stepper = ({ value, onIncrement, onDecrement, label, price, dotColor }: {
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
    label: string;
    price: number;
    dotColor: string;
  }) => (
    <View style={styles.stepperRow}>
      <View style={styles.stepperItemLeft}>
        <View style={[styles.stepperDot, { backgroundColor: dotColor }]} />
        <View>
          <Text style={styles.stepperItemLabel}>{label}</Text>
          <Text style={styles.stepperItemPrice}>₹{price}</Text>
        </View>
      </View>
      <View style={styles.stepperControl}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => { onDecrement(); console.log(`[ST] ${label} decremented`); }}
          style={styles.stepperBtn}
        >
          <Text style={styles.stepperBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{value}</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => { onIncrement(); console.log(`[ST] ${label} incremented`); }}
          style={styles.stepperBtn}
        >
          <Text style={styles.stepperBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCalendarGrid = () => {
    const cells: React.ReactNode[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      cells.push(
        <View key={`prev-${day}`} style={styles.calendarDayCell}>
          <Text style={styles.calendarDayTextMuted}>{day}</Text>
        </View>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isDelivery = deliveryDates.includes(day);
      const isSelected = selectedDate === day;
      cells.push(
        <TouchableOpacity
          key={`curr-${day}`}
          activeOpacity={0.7}
          onPress={() => handleDatePress(day, true)}
          style={[
            styles.calendarDayCell,
            isDelivery && styles.calendarDayDelivery,
            isSelected && styles.calendarDaySelected,
          ]}
        >
          <Text style={[
            styles.calendarDayText,
            isDelivery && styles.calendarDayTextDelivery,
            isSelected && styles.calendarDayTextSelected,
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return cells;
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Top Header */}
          <View style={styles.header}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => { console.log('[ST] Back'); onBack(); }} style={styles.headerBackBtn}>
              <ChevronLeft size={22} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Subscription Tracker</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => console.log('[ST] Help')} style={styles.headerHelpBtn}>
              <HelpCircle size={22} color="#2E7D32" />
            </TouchableOpacity>
          </View>

          {/* Active Plan Context Container */}
          <View style={styles.activePlanSection}>
            <View style={styles.activePlanLabelRow}>
              <Award size={16} color="#E65C00" />
              <Text style={styles.activePlanLabel}>Active Subscription</Text>
            </View>

            <View style={styles.activePlanCard}>
              <View style={styles.activePlanTopRow}>
                <Text style={styles.activePlanKitchenName}>Aai Chi Mess</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.activePlanMeta}>2 Meals/Day • Monday to Friday</Text>
              <Text style={styles.activePlanMeta}>📅 Next renewal: Oct 28, 2023</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.managePlanBtn}
                onPress={() => console.log('[ST] Manage plan pressed')}
              >
                <Text style={styles.managePlanBtnText}>Manage Plan</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Calendar Schedule Card */}
          <View style={styles.calendarCard}>
            <View style={styles.calendarCardHeader}>
              <View style={styles.calendarCardTitleRow}>
                <Calendar size={18} color="#2E7D32" />
                <Text style={styles.calendarCardTitle}>Schedule</Text>
              </View>
              <View style={styles.calendarNavRow}>
                <TouchableOpacity activeOpacity={0.7} onPress={prevMonth} style={styles.calNavBtn}>
                  <ChevronLeft size={16} color="#374151" />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={nextMonth} style={styles.calNavBtn}>
                  <ChevronRight size={16} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.calendarMonthLabel}>{MONTHS[currentMonth]} {currentYear}</Text>

            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((d, i) => (
                <Text key={`wd-${i}`} style={styles.weekdayText}>{d}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {renderCalendarGrid()}
            </View>

            <View style={styles.calendarInfoBanner}>
              <Calendar size={14} color="#2E7D32" />
              <Text style={styles.calendarInfoText}>
                Deliveries start from 1st of next month. You can pause or reschedule anytime from your profile.
              </Text>
            </View>
          </View>

          {/* Lunch Menu Accordion */}
          <View style={styles.menuCard}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.accordionHeader}
              onPress={() => {
                setIsAccordionExpanded(!isAccordionExpanded);
                console.log(`[ST] Accordion ${isAccordionExpanded ? 'collapsed' : 'expanded'}`);
              }}
            >
              <View style={styles.accordionTitleRow}>
                <Utensils size={18} color="#374151" />
                <Text style={styles.accordionTitle}>Lunch Menu</Text>
              </View>
              {isAccordionExpanded ? (
                <ChevronUp size={20} color="#374151" />
              ) : (
                <ChevronDown size={20} color="#374151" />
              )}
            </TouchableOpacity>

            {isAccordionExpanded && (
              <View style={styles.accordionBody}>
                <Stepper
                  label="Veg Thali"
                  price={120}
                  value={vegThaliCount}
                  onIncrement={() => setVegThaliCount(vegThaliCount + 1)}
                  onDecrement={() => setVegThaliCount(Math.max(0, vegThaliCount - 1))}
                  dotColor="#22C55E"
                />
                <View style={styles.stepperDivider} />
                <Stepper
                  label="Non-Veg Thali"
                  price={160}
                  value={nonVegThaliCount}
                  onIncrement={() => setNonVegThaliCount(nonVegThaliCount + 1)}
                  onDecrement={() => setNonVegThaliCount(Math.max(0, nonVegThaliCount - 1))}
                  dotColor="#EF4444"
                />
                <View style={styles.stepperDivider} />
                <Stepper
                  label="Lite Meal"
                  price={90}
                  value={liteMealCount}
                  onIncrement={() => setLiteMealCount(liteMealCount + 1)}
                  onDecrement={() => setLiteMealCount(Math.max(0, liteMealCount - 1))}
                  dotColor="#8B4513"
                />
              </View>
            )}
          </View>

          {/* Invoice Summary */}
          <View style={styles.invoiceCard}>
            <Text style={styles.invoiceTitle}>Plan Summary</Text>

            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>7 Days (Breakfast + Lunch)</Text>
              <Text style={styles.invoiceValue}>₹{subtotal}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Delivery Fee</Text>
              <Text style={styles.invoiceValueFree}>FREE</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Kitchen Service Tax</Text>
              <Text style={styles.invoiceValue}>₹{serviceTax.toFixed(2)}</Text>
            </View>

            <View style={styles.invoiceDivider} />

            <View style={styles.totalBlock}>
              <View>
                <Text style={styles.totalAmountLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.totalAmountValue}>₹{grandTotal.toFixed(2)}</Text>
              </View>
              <View style={[styles.savedBadge, subtotal <= 0 && styles.savedBadgeDisabled]}>
                <Text style={[styles.savedBadgeText, subtotal <= 0 && styles.savedBadgeTextDisabled]}>
                  Saved ₹{savedAmount}
                </Text>
              </View>
            </View>

            {/* Dashed Perk Box */}
            <View style={styles.perkBox}>
              <PiggyBank size={24} color="#2E7D32" />
              <View style={styles.perkTextBlock}>
                <Text style={styles.perkTitle}>Subscription Benefit</Text>
                <Text style={styles.perkDescription}>
                  By subscribing weekly, you save 20% compared to ordering daily tiffins. Free delivery included!
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Spacer */}
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF8F7' },
  safeArea: { flex: 1, backgroundColor: '#FAF8F7' },
  scrollContent: { paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
  },
  headerBackBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  headerHelpBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },

  activePlanSection: { paddingHorizontal: 16, marginTop: 4 },
  activePlanLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  activePlanLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  activePlanCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  activePlanTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  activePlanKitchenName: { fontSize: 18, fontWeight: '800', color: '#A0522D' },
  activeBadge: { backgroundColor: '#2E7D32', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  activeBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  activePlanMeta: { fontSize: 13, color: '#6C757D', marginTop: 3 },
  managePlanBtn: {
    marginTop: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    backgroundColor: '#FFF8F0', paddingVertical: 12, alignItems: 'center',
  },
  managePlanBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },

  calendarCard: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  calendarCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  calendarCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calendarCardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  calendarNavRow: { flexDirection: 'row', gap: 6 },
  calNavBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  calendarMonthLabel: { fontSize: 14, fontWeight: '600', color: '#6C757D', marginBottom: 10, textAlign: 'center' },

  weekdayRow: { flexDirection: 'row', marginBottom: 6 },
  weekdayText: { width: (SCREEN_WIDTH - 64) / 7, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#9CA3AF', paddingVertical: 4 },

  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayCell: {
    width: (SCREEN_WIDTH - 64) / 7, height: 38,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 8, marginVertical: 1,
  },
  calendarDayText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  calendarDayTextMuted: { fontSize: 14, fontWeight: '500', color: '#D1D5DB' },
  calendarDayDelivery: { backgroundColor: '#2E7D32', borderRadius: 8 },
  calendarDayTextDelivery: { color: '#FFFFFF', fontWeight: '700' },
  calendarDaySelected: { borderWidth: 2, borderColor: '#1A1A1A', borderRadius: 8 },
  calendarDayTextSelected: { color: '#FFFFFF', fontWeight: '700' },

  calendarInfoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#F5EFEA', borderRadius: 12, padding: 12, marginTop: 12,
  },
  calendarInfoText: { fontSize: 11, color: '#6C757D', flex: 1, lineHeight: 16 },

  menuCard: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  accordionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16,
  },
  accordionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  accordionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  accordionBody: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 },

  stepperRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10,
  },
  stepperItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperDot: { width: 12, height: 12, borderRadius: 6 },
  stepperItemLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  stepperItemPrice: { fontSize: 12, fontWeight: '700', color: '#2E7D32', marginTop: 1 },
  stepperControl: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7',
    borderRadius: 20, paddingVertical: 3, paddingHorizontal: 2,
  },
  stepperBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepperBtnText: { fontSize: 18, fontWeight: '700', color: '#374151' },
  stepperValue: { width: 36, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  stepperDivider: { height: 1, backgroundColor: '#F3F4F6' },

  invoiceCard: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  invoiceTitle: { fontSize: 17, fontWeight: '800', color: '#2E7D32', marginBottom: 14 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  invoiceLabel: { fontSize: 13, color: '#6C757D', flex: 1 },
  invoiceValue: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  invoiceValueFree: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  invoiceDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },

  totalBlock: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14,
  },
  totalAmountLabel: { fontSize: 11, fontWeight: '700', color: '#6C757D', letterSpacing: 0.5, marginBottom: 4 },
  totalAmountValue: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  savedBadge: { backgroundColor: '#FCECE3', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  savedBadgeDisabled: { opacity: 0.3 },
  savedBadgeText: { fontSize: 12, fontWeight: '800', color: '#E65C00' },
  savedBadgeTextDisabled: { color: '#9CA3AF' },

  perkBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1.5, borderColor: '#2E7D32', borderStyle: 'dashed',
    borderRadius: 14, padding: 14, backgroundColor: '#F8FDF8',
  },
  perkTextBlock: { flex: 1 },
  perkTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  perkDescription: { fontSize: 12, color: '#6C757D', lineHeight: 18 },
});
