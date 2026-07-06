import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  HelpCircle,
  Crosshair,
  ChevronRight,
  Home,
  Briefcase,
  Pencil,
  Zap,
  BadgeCheck,
  CheckCircle,
  X,
} from 'lucide-react-native';

type AddressKey = 'home' | 'office' | 'auto';

export default function SelectAddressScreen() {
  const [selected, setSelected] = useState<AddressKey>('home');
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [autoAddress, setAutoAddress] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [formLabel, setFormLabel] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const router = useRouter();
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
  }, []);

  const handleAutoDetect = () => {
    if (autoDetecting) return;
    setSelected('auto');
    setAutoDetecting(true);
    setAutoAddress(null);
    autoTimer.current = setTimeout(() => {
      setAutoAddress('Wanadongari, Hingna, Nagpur, Maharashtra 441110');
      setAutoDetecting(false);
    }, 1500);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ========== HEADER NAVIGATION BAR ========== */}
        <View style={styles.headerBar}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => console.log('[Address] Back')}>
            <ArrowLeft size={24} color="#0F6A33" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prajwal's App</Text>
          <View style={styles.helpCircle}>
            <HelpCircle size={18} color="#0F6A33" strokeWidth={2.5} />
          </View>
        </View>

        {/* ========== ADDRESS SEARCH INPUT FIELD ========== */}
        <View style={styles.searchBar}>
          <Search size={18} color="#555555" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter your delivery address"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* ========== AUTO-DETECT LOCATION CONTROLLER ========== */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.autoDetectCard, selected === 'auto' && styles.autoDetectCardSelected]}
          onPress={handleAutoDetect}
        >
          <View style={styles.autoDetectIconWrap}>
            <Crosshair size={18} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View style={styles.autoDetectTextWrap}>
            {autoDetecting ? (
              <View style={styles.autoDetectLoadingRow}>
                <ActivityIndicator size="small" color="#0F6A33" />
                <Text style={styles.autoDetectTitle}>Detecting location...</Text>
              </View>
            ) : (
              <Text style={styles.autoDetectTitle}>Auto-detect Location</Text>
            )}
            <Text style={styles.autoDetectSubtitle}>
              {autoAddress ?? 'Using GPS for faster checkout'}
            </Text>
          </View>
          {selected === 'auto' && (
            <CheckCircle size={20} color="#0F6A33" fill="#0F6A33" strokeWidth={0} />
          )}
          {selected !== 'auto' && <ChevronRight size={20} color="#555555" strokeWidth={2} />}
        </TouchableOpacity>

        {/* ========== SAVED ADDRESSES SECTION HEADING ========== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => { setAddModalVisible(true); setFormLabel(''); setFormAddress(''); setFormCity(''); setFormPincode(''); }}>
            <Text style={styles.addNewText}>Add New</Text>
          </TouchableOpacity>
        </View>

        {/* ========== ADDRESS CARD 1 — HOME / HOSTEL ========== */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.addressCard, selected === 'home' && styles.addressCardSelected]}
          onPress={() => setSelected('home')}
        >
          <View style={styles.addressRow}>
            <View style={styles.homeIconCircle}>
              <Home size={20} color="#555555" strokeWidth={1.8} />
            </View>
            <View style={styles.addressTextWrap}>
              <View style={styles.addressLabelRow}>
                <Text style={styles.addressLabel}>Home (Hostel)</Text>
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                </View>
              </View>
              <Text style={styles.addressDetail}>
                Vivekanand Boys Hostel , Wanadongari,{"\n"}Hingna, Nagpur,{"\n"}4411004
              </Text>
            </View>
            <View style={styles.addressRightCol}>
              <TouchableOpacity activeOpacity={0.7} style={styles.editButton} onPress={() => console.log('[Address] Edit Home')}>
                <Pencil size={16} color="#555555" strokeWidth={2} />
              </TouchableOpacity>
              {selected === 'home' && (
                <CheckCircle size={20} color="#0F6A33" fill="#0F6A33" strokeWidth={0} />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* ========== ADDRESS CARD 2 — OFFICE ========== */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.addressCard, selected === 'office' && styles.addressCardSelected]}
          onPress={() => setSelected('office')}
        >
          <View style={styles.addressRow}>
            <View style={styles.officeIconCircle}>
              <Briefcase size={20} color="#555555" strokeWidth={1.8} />
            </View>
            <View style={styles.addressTextWrap}>
              <Text style={styles.addressLabel}>Office</Text>
              <Text style={styles.addressDetail}>
                YCCE , Wanadongari,{"\n"}Hingna , Nagpur,{"\n"}441109
              </Text>
            </View>
            <View style={styles.addressRightCol}>
              <TouchableOpacity activeOpacity={0.7} style={styles.editButton} onPress={() => console.log('[Address] Edit Office')}>
                <Pencil size={16} color="#555555" strokeWidth={2} />
              </TouchableOpacity>
              {selected === 'office' && (
                <CheckCircle size={20} color="#0F6A33" fill="#0F6A33" strokeWidth={0} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </SafeAreaView>

      {/* ========== PERSISTENT CONFIRMATION FOOTER ========== */}
      <SafeAreaView style={styles.footer} edges={['bottom']}>
        {/* Trust Badges Row */}
        <View style={styles.trustBadgesRow}>
          <View style={styles.trustBadgeItem}>
            <Zap size={16} color="#EE8100" fill="#EE8100" strokeWidth={0} />
            <Text style={styles.trustBadgeText}>Faster Delivery</Text>
          </View>
          <View style={styles.trustBadgeItem}>
            <BadgeCheck size={16} color="#0F6A33" fill="#0F6A33" strokeWidth={0} />
            <Text style={styles.trustBadgeText}>Local Chefs</Text>
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.confirmButton}
          onPress={() => router.push('/cart')}
        >
          <Text style={styles.confirmButtonText}>Confirm Delivery Location</Text>
          <View style={styles.confirmCheckWrap}>
            <CheckCircle size={14} color="#FFFFFF" strokeWidth={3} />
          </View>
        </TouchableOpacity>
      </SafeAreaView>

      {/* ========== ADD NEW ADDRESS MODAL ========== */}
      <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setAddModalVisible(false)}>
                <X size={22} color="#1A1A1A" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Address Label</Text>
              <View style={styles.labelRow}>
                {['Home', 'Office', 'Other'].map((label) => (
                  <TouchableOpacity
                    key={label}
                    activeOpacity={0.7}
                    style={[styles.labelChip, formLabel === label && styles.labelChipActive]}
                    onPress={() => setFormLabel(label)}
                  >
                    <Text style={[styles.labelChipText, formLabel === label && styles.labelChipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Street, building, area"
                placeholderTextColor="#9CA3AF"
                value={formAddress}
                onChangeText={setFormAddress}
              />

              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="City"
                    placeholderTextColor="#9CA3AF"
                    value={formCity}
                    onChangeText={setFormCity}
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.fieldLabel}>Pincode</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Pincode"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={formPincode}
                    onChangeText={setFormPincode}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity activeOpacity={0.7} style={styles.modalCancelBtn} onPress={() => setAddModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.modalSaveBtn}
                  onPress={() => {
                    console.log('[Address] Save new address:', { label: formLabel, address: formAddress, city: formCity, pincode: formPincode });
                    setAddModalVisible(false);
                  }}
                >
                  <Text style={styles.modalSaveText}>Save Address</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF8F6' },
  safeArea: { flex: 1, backgroundColor: '#FAF8F6' },

  // Header
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  helpCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0F6A33' },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8, borderRadius: 9999, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 14, color: '#555555' },

  // Auto Detect
  autoDetectCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 20, borderRadius: 24, backgroundColor: '#F7F4F0', paddingHorizontal: 20, paddingVertical: 16, borderWidth: 2, borderColor: 'transparent' },
  autoDetectCardSelected: { borderColor: '#0F6A33' },
  autoDetectIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F6A33' },
  autoDetectTextWrap: { marginLeft: 16, flex: 1 },
  autoDetectLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  autoDetectTitle: { fontSize: 14, fontWeight: '700', color: '#0F6A33' },
  autoDetectSubtitle: { marginTop: 2, fontSize: 11, color: '#737373' },

  // Section Header
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  addNewText: { fontSize: 14, fontWeight: '700', color: '#0F6A33' },

  // Address Card
  addressCard: { marginHorizontal: 16, marginTop: 12, borderRadius: 24, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, borderWidth: 2, borderColor: 'transparent' },
  addressCardSelected: { borderColor: '#0F6A33' },
  addressRow: { flexDirection: 'row' },
  homeIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDE2DC' },
  officeIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFECE6' },
  addressTextWrap: { marginLeft: 12, flex: 1 },
  addressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  defaultBadge: { borderRadius: 9999, backgroundColor: '#EE8100', paddingHorizontal: 10, paddingVertical: 2 },
  defaultBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: '#FFFFFF' },
  addressDetail: { marginTop: 4, fontSize: 13, lineHeight: 18, color: '#555555' },
  addressRightCol: { alignItems: 'center', justifyContent: 'space-between' },
  editButton: { alignItems: 'flex-start', justifyContent: 'flex-start', padding: 4 },

  // Footer
  footer: { borderTopWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 16 },
  trustBadgesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32, marginBottom: 16 },
  trustBadgeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustBadgeText: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  confirmButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 9999, backgroundColor: '#0F6A33', paddingVertical: 16 },
  confirmButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  confirmCheckWrap: { marginLeft: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FAF8F6', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },

  // Form
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555555', marginBottom: 6, marginTop: 12 },
  labelRow: { flexDirection: 'row', gap: 10 },
  labelChip: { borderRadius: 9999, backgroundColor: '#FFFFFF', paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  labelChipActive: { backgroundColor: '#0F6A33', borderColor: '#0F6A33' },
  labelChipText: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  labelChipTextActive: { color: '#FFFFFF' },
  formInput: { borderRadius: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#1A1A1A', borderWidth: 1, borderColor: '#E5E7EB' },
  formRow: { flexDirection: 'row', gap: 12 },
  formHalf: { flex: 1 },

  // Modal actions
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalCancelBtn: { flex: 1, borderRadius: 9999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#555555' },
  modalSaveBtn: { flex: 1, borderRadius: 9999, backgroundColor: '#0F6A33', paddingVertical: 14, alignItems: 'center' },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
