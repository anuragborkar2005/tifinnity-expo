import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Plus, Trash2, CheckCircle2, Home, Briefcase, Info, X } from 'lucide-react-native';

import { useAddresses, UserAddress } from '@/src/features/profile/hooks/use-addresses';

export default function SelectAddressScreen() {
  const router = useRouter();
  const {
    addresses,
    isLoading,
    createAddress,
    updateAddress,
    deleteAddress,
  } = useAddresses();

  const [showAddModal, setShowAddModal] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<'home' | 'work' | 'other'>('home');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('Nagpur');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleSetDefault = async (id: string) => {
    try {
      await updateAddress({ id, updates: { is_default: true } });
      Alert.alert('Success', 'Default address updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update default address');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAddress(id);
            Alert.alert('Deleted', 'Address deleted successfully.');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete address');
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!label || !line1 || !pincode || !name || !phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      await createAddress({
        label: label.trim(),
        address_line1: line1.trim(),
        address_line2: line2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        address_type: type,
        recipient_name: name.trim(),
        recipient_phone: phone.trim(),
        is_default: isDefault,
      });
      setShowAddModal(false);
      // Reset form
      setLabel('');
      setLine1('');
      setLine2('');
      setPincode('');
      setName('');
      setPhone('');
      setIsDefault(false);
      Alert.alert('Success', 'Address added.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create address');
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
          <Text style={styles.headerTitle}>Select Address</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.headerAddBtn}>
            <Plus size={22} color="#059669" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {addresses.length === 0 ? (
            <View style={[styles.center, { marginTop: 60, paddingHorizontal: 40 }]}>
              <MapPin size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No addresses saved yet. Add a new address to place orders.</Text>
            </View>
          ) : (
            addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                activeOpacity={0.9}
                style={[styles.addressCard, addr.is_default && styles.addressCardDefault]}
                onPress={() => handleSetDefault(addr.id)}
              >
                <View style={styles.addressCardHeader}>
                  <View style={styles.labelRow}>
                    {addr.address_type === 'home' ? (
                      <Home size={16} color="#059669" />
                    ) : addr.address_type === 'work' ? (
                      <Briefcase size={16} color="#3B82F6" />
                    ) : (
                      <Info size={16} color="#6B7280" />
                    )}
                    <Text style={styles.addressLabel}>{addr.label}</Text>
                  </View>
                  {addr.is_default && (
                    <View style={styles.defaultBadge}>
                      <CheckCircle2 size={12} color="#FFFFFF" fill="#059669" />
                      <Text style={styles.defaultBadgeText}> DEFAULT</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.addressDetails}>
                  {addr.address_line1}
                  {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                  {`\n${addr.city}, ${addr.state} - ${addr.pincode}`}
                </Text>
                
                <Text style={styles.recipientDetails}>
                  Recipient: {addr.recipient_name} ({addr.recipient_phone})
                </Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(addr.id)}
                  >
                    <Trash2 size={16} color="#DC2626" />
                    <Text style={styles.deleteBtnText}> Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Add Address Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Delivery Address</Text>
                  <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <X size={24} color="#374151" />
                  </TouchableOpacity>
                </View>

                {/* Recipient Details */}
                <Text style={styles.formGroupLabel}>Recipient Details</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Recipient Name (e.g. Prajwal)*"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Recipient Phone (10-digit)*"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />

                {/* Address Details */}
                <Text style={styles.formGroupLabel}>Address Details</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Address Label (e.g. Mom's House)*"
                  placeholderTextColor="#9CA3AF"
                  value={label}
                  onChangeText={setLabel}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Flat/House/Building/Line 1*"
                  placeholderTextColor="#9CA3AF"
                  value={line1}
                  onChangeText={setLine1}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Street/Locality/Line 2 (Optional)"
                  placeholderTextColor="#9CA3AF"
                  value={line2}
                  onChangeText={setLine2}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Pincode (Nagpur region)*"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={pincode}
                  onChangeText={setPincode}
                />

                {/* Address Type Toggle */}
                <Text style={styles.formGroupLabel}>Address Type</Text>
                <View style={styles.typeRow}>
                  {['home', 'work', 'other'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                      onPress={() => setType(t as any)}
                    >
                      <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                        {t.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Default Switch */}
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Set as Default Address</Text>
                  <Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ true: '#059669' }} />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Save Address</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

// Reuse styles and layouts
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 60, paddingHorizontal: 16 },
  emptyText: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 18 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  headerBackBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  headerAddBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },

  addressCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  addressCardDefault: { borderColor: '#059669', borderWidth: 2 },
  addressCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addressLabel: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  defaultBadgeText: { fontSize: 10, color: '#059669', fontWeight: '800' },
  addressDetails: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  recipientDetails: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 8 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center' },
  deleteBtnText: { fontSize: 12, color: '#DC2626', fontWeight: '700' },

  // Modal styling
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 500 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  formGroupLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 14, color: '#374151', marginBottom: 10, backgroundColor: '#FAFAFA' },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  typeBtnActive: { backgroundColor: '#ECFDF5', borderColor: '#059669' },
  typeBtnText: { fontSize: 11, color: '#4B5563', fontWeight: '700' },
  typeBtnTextActive: { color: '#059669' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  switchLabel: { fontSize: 14, color: '#374151', fontWeight: '600' },
  saveBtn: { backgroundColor: '#065F46', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
