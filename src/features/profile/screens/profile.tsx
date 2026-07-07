import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MapPin, Bell, Mail, Smartphone, Pencil, ShoppingBag, Calendar,
  Heart, Wallet, Gift, User, HelpCircle, FileText, LogOut, ChevronRight, X,
} from 'lucide-react-native';

import { useProfile, useUpdateProfile } from '@/src/features/profile/hooks/use-profile';
import { supabase } from '@/src/lib/supabase/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { data: profile, isLoading, error } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const handleEdit = () => {
    if (!profile) return;
    setEditName(profile.full_name);
    setEditEmail(profile.email || '');
    setEditPhone(profile.phone || '');
    setShowEdit(true);
  };

  const confirmEdit = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        full_name: editName,
        email: editEmail || undefined,
        phone: editPhone || undefined,
      });
      setShowEdit(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color="#065F46" />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>Failed to load profile details.</Text>
      </SafeAreaView>
    );
  }

  const FEATURE_GRID = [
    { id: 'orders', icon: ShoppingBag, title: 'My Orders', subtitle: 'Order logs', iconBg: '#ECFDF5', iconColor: '#065F46', onPress: () => router.push('/order' as any) },
    { id: 'subscriptions', icon: Calendar, title: 'Subscriptions', subtitle: 'Daily Meal plans', iconBg: '#FFF7ED', iconColor: '#9A3412', onPress: () => router.push('/subscription-tracker' as any) }, // Subscription tracker
    { id: 'saved', icon: Heart, title: 'Favorites', subtitle: 'Saved kitchens', iconBg: '#FEF2F2', iconColor: '#DC2626', onPress: () => Alert.alert('Saved Kitchens', 'Showing favorites...') },
    { id: 'wallet', icon: Wallet, title: 'Wallet', subtitle: `₹${profile.wallet_balance || '0.00'}`, iconBg: '#ECFDF5', iconColor: '#065F46', onPress: () => Alert.alert('Wallet Balance', `Balance: ₹${profile.wallet_balance}`) },
  ];

  const ACCOUNT_SETTINGS = [
    { id: 'profile', icon: User, label: 'Profile Information', onPress: handleEdit },
    { id: 'addresses', icon: MapPin, label: 'Manage Addresses', onPress: () => router.push('/select-address' as any) },
    { id: 'notifications', icon: Bell, label: 'Notification Preferences', onPress: () => router.push('/notifications' as any) },
  ];

  const SUPPORT_ITEMS = [
    { id: 'help', icon: HelpCircle, label: 'Help Center', onPress: () => Alert.alert('Help', 'Support ticket pipeline coming soon!') },
    { id: 'terms', icon: FileText, label: 'Terms & Conditions', onPress: () => Alert.alert('Terms', 'Tifinnity terms and conditions.') },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Header Bar */}
          <View style={styles.profileHeaderBar}>
            <View style={styles.profileHeaderLeft}>
              <MapPin size={18} color="#065F46" />
              <Text style={styles.profileHeaderTitle}>Tifinnity Profile</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/notifications' as any)}>
              <Bell size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* User Hero Card */}
          <View style={styles.profileHeroCard}>
            <View style={styles.profileAvatarContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80' }}
                style={styles.profileAvatarImage}
              />
              <View style={styles.goldBadge}>
                <Text style={styles.goldBadgeText}>⭐ GOLD MEMBER</Text>
              </View>
            </View>
            <Text style={styles.profileName}>{profile.full_name}</Text>
            {profile.email && (
              <View style={styles.profileContactRow}>
                <Mail size={14} color="#9CA3AF" />
                <Text style={styles.profileContactText}> {profile.email}</Text>
              </View>
            )}
            {profile.phone && (
              <View style={styles.profileContactRow}>
                <Smartphone size={14} color="#9CA3AF" />
                <Text style={styles.profileContactText}> {profile.phone}</Text>
              </View>
            )}
            <TouchableOpacity activeOpacity={0.7} style={styles.editButton} onPress={handleEdit}>
              <Pencil size={16} color="#065F46" />
            </TouchableOpacity>
          </View>

          {/* Quick Grid Navigation */}
          <View style={styles.featureGrid}>
            {FEATURE_GRID.map((item) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={styles.featureCard}
                  onPress={item.onPress}
                >
                  <View style={[styles.featureIconContainer, { backgroundColor: item.iconBg }]}>
                    <Icon size={22} color={item.iconColor} />
                  </View>
                  <Text style={styles.featureCardTitle}>{item.title}</Text>
                  <Text style={styles.featureCardSubtitle}>{item.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Refer & Earn Banner */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.referBanner}
            onPress={() => Alert.alert('Refer & Earn', 'Share code: TIF200 to earn ₹200 wallet cashback!')}
          >
            <View style={styles.referTextBlock}>
              <Text style={styles.referTitle}>Refer and Earn</Text>
              <Text style={styles.referAmount}>₹200</Text>
              <Text style={styles.referDescription}>
                Share the taste of home with your friends and family.
              </Text>
            </View>
            <View style={styles.referIconContainer}>
              <Gift size={28} color="#8B4513" />
            </View>
          </TouchableOpacity>

          {/* Account Settings Menu */}
          <Text style={styles.menuSectionLabel}>ACCOUNT SETTINGS</Text>
          <View style={styles.menuContainer}>
            {ACCOUNT_SETTINGS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={[styles.menuItem, idx < ACCOUNT_SETTINGS.length - 1 && styles.menuItemBorder]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <Icon size={18} color="#6B7280" />
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  <ChevronRight size={18} color="#D1D5DB" />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Support Section */}
          <Text style={styles.menuSectionLabel}>SUPPORT</Text>
          <View style={styles.menuContainer}>
            {SUPPORT_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={[styles.menuItem, idx < SUPPORT_ITEMS.length - 1 && styles.menuItemBorder]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <Icon size={18} color="#6B7280" />
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  <ChevronRight size={18} color="#D1D5DB" />
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuItem}
              onPress={handleLogout}
            >
              <View style={styles.menuItemLeft}>
                <LogOut size={18} color="#DC2626" />
                <Text style={styles.menuLogoutLabel}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEdit}
          animationType="slide"
          transparent
          onRequestClose={() => setShowEdit(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile Information</Text>
                <TouchableOpacity onPress={() => setShowEdit(false)}>
                  <X size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Full Name"
              />
              <TextInput
                style={styles.editInput}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Email"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.editInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Phone"
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.editSaveBtn}
                onPress={confirmEdit}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.editSaveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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

  profileHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  profileHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#065F46' },

  profileHeroCard: { marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 20, paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  profileAvatarContainer: { position: 'relative', marginBottom: 14 },
  profileAvatarImage: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#E5E7EB' },
  goldBadge: { position: 'absolute', bottom: -6, alignSelf: 'center', backgroundColor: '#FBBF24', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10 },
  goldBadgeText: { fontSize: 10, fontWeight: '800', color: '#1F2937', letterSpacing: 0.3 },
  profileName: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  profileContactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  profileContactText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  editButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#D1FAE5' },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, marginTop: 20 },
  featureCard: { width: (SCREEN_WIDTH - 44) / 2, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  featureIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  featureCardTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  featureCardSubtitle: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  referBanner: { marginHorizontal: 16, marginTop: 20, backgroundColor: '#8B4513', borderRadius: 16, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  referTextBlock: { flex: 1, marginRight: 12 },
  referTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  referAmount: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', marginTop: 2 },
  referDescription: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '500', marginTop: 4, lineHeight: 16 },
  referIconContainer: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },

  menuSectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, paddingHorizontal: 16, marginTop: 24, marginBottom: 10 },
  menuContainer: { marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  menuLogoutLabel: { fontSize: 14, fontWeight: '600', color: '#DC2626' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 320 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  editInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#374151', marginBottom: 10, backgroundColor: '#FAFAFA' },
  editSaveBtn: { backgroundColor: '#065F46', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4, height: 48, justifyContent: 'center' },
  editSaveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
