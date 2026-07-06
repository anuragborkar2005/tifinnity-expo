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
  HelpCircle,
  Phone,
  MessageCircle,
  Check,
  CookingPot,
  Bike,
  Home,
  Headphones,
  HeartHandshake,
  ShieldCheck,
  Receipt,
  ChevronRight,
  MapPin,
} from 'lucide-react-native';

const TIP_AMOUNTS = ['₹20', '₹30', '₹50', 'Other'];

export default function TrackerScreen() {
  const [selectedTip, setSelectedTip] = useState('₹50');

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* ========== HEADER NAVIGATION BAR ========== */}
          <View style={styles.headerBar}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => console.log('[Tracker] Back')}>
              <ArrowLeft size={24} color="#0F6A33" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Prajwal's App</Text>
            <View style={styles.helpCircle}>
              <HelpCircle size={18} color="#0F6A33" strokeWidth={2.5} />
            </View>
          </View>

          {/* ========== MAP VIEW ========== */}
          <View style={styles.heroMapWrap}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1574660112924-31ce8ea92519?q=80&w=800' }}
              style={styles.heroMapImage}
            />

            {/* Dashed route path */}
            <View style={styles.routePath}>
              <View style={styles.routeDotStart} />
              <View style={styles.routeDash} />
              <View style={styles.routeDash} />
              <View style={styles.routeDash} />
              <View style={styles.routeDash} />
              <View style={styles.routeDotEnd} />
            </View>

            {/* Delivery partner marker */}
            <View style={styles.driverMarker}>
              <View style={styles.driverPulse} />
              <View style={styles.driverBadge}>
                <Text style={styles.driverEmoji}>🛵</Text>
              </View>
            </View>

            {/* Destination pin */}
            <View style={styles.destPin}>
              <View style={styles.destPinShadow} />
              <View style={styles.destPinCircle}>
                <MapPin size={14} color="#FFFFFF" strokeWidth={3} />
              </View>
              <View style={styles.destPinStem} />
            </View>

            {/* Floating driver card */}
            <View style={styles.driverCard}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=80' }}
                style={styles.driverAvatar}
              />
              <View style={styles.driverInfo}>
                <Text style={styles.driverTag}>YOUR DELIVERY HERO</Text>
                <Text style={styles.driverName}>Rajesh Kumar</Text>
              </View>
              <View style={styles.driverActions}>
                <TouchableOpacity activeOpacity={0.7} style={styles.driverActionBtn} onPress={() => console.log('[Tracker] Call')}>
                  <Phone size={16} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={styles.driverActionBtn} onPress={() => console.log('[Tracker] Chat')}>
                  <MessageCircle size={16} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ========== ORDER STATUS & PROGRESS ========== */}
          <View style={styles.statusSection}>
            <View style={styles.etaRow}>
              <View>
                <Text style={styles.etaText}>Arriving in 12 mins</Text>
                <Text style={styles.etaSubtext}>Order #GKK-9821 • Tiffin for Two</Text>
              </View>
              <View style={styles.onTimeBadge}>
                <Text style={styles.onTimeBadgeText}>ON TIME</Text>
              </View>
            </View>

            {/* 4-Node Progress Tracker */}
            <View style={styles.progressTrack}>
              <View style={styles.progressLineBg} />
              <View style={styles.progressLineFill} />

              {/* Node 1 — Confirmed */}
              <View style={styles.nodeCol}>
                <View style={[styles.nodeCircle, styles.nodeActive]}>
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                </View>
                <Text style={styles.nodeLabel}>Confirmed</Text>
              </View>

              {/* Node 2 — Preparing */}
              <View style={styles.nodeCol}>
                <View style={[styles.nodeCircle, styles.nodeActive]}>
                  <CookingPot size={14} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <Text style={styles.nodeLabel}>Preparing</Text>
              </View>

              {/* Node 3 — On the Way (active) */}
              <View style={styles.nodeCol}>
                <View style={styles.nodeCurrent}>
                  <Bike size={16} color="#0F6A33" strokeWidth={2.5} />
                </View>
                <Text style={[styles.nodeLabel, styles.nodeLabelActive]}>On the Way</Text>
              </View>

              {/* Node 4 — Arrived */}
              <View style={styles.nodeCol}>
                <View style={[styles.nodeCircle, styles.nodeInactive]}>
                  <Home size={14} color="#9CA3AF" strokeWidth={2} />
                </View>
                <Text style={[styles.nodeLabel, styles.nodeLabelMuted]}>Arrived</Text>
              </View>
            </View>
          </View>

          {/* ========== KITCHEN & SUPPORT BUTTONS ========== */}
          <View style={styles.actionRow}>
            <TouchableOpacity activeOpacity={0.7} style={styles.kitchenBtn} onPress={() => console.log('[Tracker] Kitchen')}>
              <CookingPot size={18} color="#0F6A33" strokeWidth={2} />
              <Text style={styles.kitchenBtnText}>Kitchen</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={styles.supportBtn} onPress={() => console.log('[Tracker] Support')}>
              <Headphones size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.supportBtnText}>Support</Text>
            </TouchableOpacity>
          </View>

          {/* ========== APPRECIATE RAJESH TIPPING ========== */}
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <View style={styles.tipIconWrap}>
                <HeartHandshake size={20} color="#C2410C" strokeWidth={2} />
              </View>
              <View style={styles.tipHeaderText}>
                <Text style={styles.tipTitle}>Appreciate Rajesh</Text>
                <Text style={styles.tipSubtext}>100% goes to your delivery partner</Text>
              </View>
            </View>
            <View style={styles.tipGrid}>
              {TIP_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  activeOpacity={0.7}
                  style={[styles.tipChip, selectedTip === amount && styles.tipChipSelected]}
                  onPress={() => setSelectedTip(amount)}
                >
                  <Text style={[styles.tipChipText, selectedTip === amount && styles.tipChipTextSelected]}>
                    {amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ========== SAFETY BANNER ========== */}
          <View style={styles.safetyBanner}>
            <ShieldCheck size={32} color="#0F6A33" strokeWidth={1.5} />
            <View style={styles.safetyTextWrap}>
              <Text style={styles.safetyTitle}>Contactless Delivery</Text>
              <Text style={styles.safetyDesc}>
                Our partners are trained in hygiene protocols and follow a strict zero-contact policy.
              </Text>
            </View>
          </View>

          {/* ========== ORDER ITEMIZATION CARD ========== */}
          <View style={styles.orderItemCard}>
            <View style={styles.orderItemIconWrap}>
              <Receipt size={20} color="#1A1A1A" strokeWidth={2} />
            </View>
            <View style={styles.orderItemTextWrap}>
              <Text style={styles.orderItemTitle}>Standard Lunch Tiffin</Text>
              <Text style={styles.orderItemCode}>Order #GK-88219</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => console.log('[Tracker] Details')}>
              <Text style={styles.orderItemDetails}>Details</Text>
            </TouchableOpacity>
          </View>
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  helpCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0F6A33' },

  // Hero Map
  heroMapWrap: { height: 260, position: 'relative' },
  heroMapImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  // Route path overlay
  routePath: { position: 'absolute', top: 70, left: 50, right: 60, flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeDotStart: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0F6A33' },
  routeDash: { flex: 1, height: 3, backgroundColor: '#0F6A33', borderRadius: 2, opacity: 0.5 },
  routeDotEnd: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0F6A33' },

  // Driver marker
  driverMarker: { position: 'absolute', top: '38%', left: '30%', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  driverPulse: { position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(15,106,51,0.15)' },
  driverBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6 },
  driverEmoji: { fontSize: 22 },

  // Destination pin
  destPin: { position: 'absolute', bottom: 70, right: '22%', alignItems: 'center' },
  destPinShadow: { position: 'absolute', bottom: -2, width: 20, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.15)' },
  destPinCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0F6A33', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  destPinStem: { width: 4, height: 16, backgroundColor: '#0F6A33', borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },

  driverCard: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, backgroundColor: '#FFFFFF', padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  driverAvatar: { width: 48, height: 48, borderRadius: 24 },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverTag: { fontSize: 10, fontWeight: '600', color: '#6B7280', letterSpacing: 0.5 },
  driverName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginTop: 2 },
  driverActions: { flexDirection: 'row', gap: 8 },
  driverActionBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0F6A33', alignItems: 'center', justifyContent: 'center' },

  // Status & ETA
  statusSection: { marginHorizontal: 16, marginTop: 16 },
  etaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  etaText: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  etaSubtext: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  onTimeBadge: { borderRadius: 9999, backgroundColor: '#F97316', paddingHorizontal: 14, paddingVertical: 4 },
  onTimeBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: '#FFFFFF' },

  // Progress Tracker
  progressTrack: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28, position: 'relative' },
  progressLineBg: { position: 'absolute', top: 16, left: '6.25%', right: '6.25%', height: 3, backgroundColor: '#E5E7EB', borderRadius: 2 },
  progressLineFill: { position: 'absolute', top: 16, left: '6.25%', width: '75%', height: 3, backgroundColor: '#0F6A33', borderRadius: 2 },
  nodeCol: { alignItems: 'center', zIndex: 1 },
  nodeCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  nodeActive: { backgroundColor: '#0F6A33' },
  nodeInactive: { backgroundColor: '#E5E7EB' },
  nodeCurrent: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 3, borderColor: '#0F6A33',
    alignItems: 'center', justifyContent: 'center',
  },
  nodeLabel: { marginTop: 8, fontSize: 11, fontWeight: '600', color: '#0F6A33' },
  nodeLabelActive: { fontWeight: '700', color: '#1A1A1A' },
  nodeLabelMuted: { color: '#9CA3AF' },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 20 },
  kitchenBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 9999, backgroundColor: '#FFFFFF', paddingVertical: 14,
    borderWidth: 1.5, borderColor: '#0F6A33',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  kitchenBtnText: { fontSize: 14, fontWeight: '700', color: '#0F6A33' },
  supportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 9999, backgroundColor: '#0F6A33', paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
  },
  supportBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // Tip Card
  tipCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 24, backgroundColor: '#FFFFFF', padding: 20, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  tipHeader: { flexDirection: 'row', alignItems: 'center' },
  tipIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FDF2E9', alignItems: 'center', justifyContent: 'center' },
  tipHeaderText: { marginLeft: 12, flex: 1 },
  tipTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  tipSubtext: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  tipGrid: { flexDirection: 'row', gap: 10, marginTop: 16 },
  tipChip: { flex: 1, borderRadius: 9999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12, alignItems: 'center' },
  tipChipSelected: { backgroundColor: '#92400E', borderColor: '#92400E' },
  tipChipText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  tipChipTextSelected: { color: '#FFFFFF' },

  // Safety Banner
  safetyBanner: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 16, borderRadius: 20, backgroundColor: '#E2F2E4', paddingHorizontal: 16, paddingVertical: 16 },
  safetyTextWrap: { flex: 1 },
  safetyTitle: { fontSize: 14, fontWeight: '700', color: '#0F6A33' },
  safetyDesc: { fontSize: 11, lineHeight: 16, color: '#555555', marginTop: 4 },

  // Order Itemization
  orderItemCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16, marginBottom: 8, borderRadius: 24, backgroundColor: '#FFFFFF', padding: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  orderItemIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFECE6', alignItems: 'center', justifyContent: 'center' },
  orderItemTextWrap: { flex: 1, marginLeft: 12 },
  orderItemTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  orderItemCode: { fontSize: 12, color: '#737373', marginTop: 2 },
  orderItemDetails: { fontSize: 14, fontWeight: '700', color: '#0F6A33' },
});
