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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MapPin,
  Bell,
  Mail,
  Smartphone,
  Pencil,
  ShoppingBag,
  Calendar,
  Heart,
  Wallet,
  Gift,
  User,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FEATURE_GRID = [
  { id: 'orders', icon: ShoppingBag, title: 'My Orders', subtitle: '12 Recent', iconBg: '#ECFDF5', iconColor: '#065F46', onPress: () => Alert.alert('My Orders', 'Opening order history...') },
  { id: 'subscriptions', icon: Calendar, title: 'Subscriptions', subtitle: 'Daily Tiffin', iconBg: '#FFF7ED', iconColor: '#9A3412', onPress: () => {} },
  { id: 'saved', icon: Heart, title: 'Saved Kitchens', subtitle: '8 Favorites', iconBg: '#FEF2F2', iconColor: '#DC2626', onPress: () => Alert.alert('Saved Kitchens', 'Showing favorites...') },
  { id: 'wallet', icon: Wallet, title: 'Wallet', subtitle: '₹450.00', iconBg: '#ECFDF5', iconColor: '#065F46', onPress: () => Alert.alert('Wallet', 'Balance: ₹450.00') },
];

const ACCOUNT_SETTINGS = [
  { id: 'profile', icon: User, label: 'Profile Information' },
  { id: 'addresses', icon: MapPin, label: 'Manage Addresses' },
  { id: 'notifications', icon: Bell, label: 'Notification Preferences' },
];

const SUPPORT_ITEMS = [
  { id: 'help', icon: HelpCircle, label: 'Help Center' },
  { id: 'terms', icon: FileText, label: 'Terms & Conditions' },
];

interface ProfileScreenProps {
  onNavigateSubscription?: () => void;
}

export default function ProfileScreen({ onNavigateSubscription }: ProfileScreenProps) {
  const [name, setName] = useState('Prajwal Belekar');
  const [email, setEmail] = useState('example@gamil.com');
  const [phone, setPhone] = useState('+91 1234567890');
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editPhone, setEditPhone] = useState(phone);

  const handleEdit = () => {
    setEditName(name);
    setEditEmail(email);
    setEditPhone(phone);
    setShowEdit(true);
    console.log('[Profile] Opening edit sheet');
  };

  const confirmEdit = () => {
    setName(editName);
    setEmail(editEmail);
    setPhone(editPhone);
    setShowEdit(false);
    console.log('[Profile] Saved:', { name: editName, email: editEmail, phone: editPhone });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Navigation Header Bar */}
          <View style={styles.profileHeaderBar}>
            <View style={styles.profileHeaderLeft}>
              <MapPin size={18} color="#065F46" />
              <Text style={styles.profileHeaderTitle}>Prajwal's App</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => console.log('[Profile] Notifications pressed')}>
              <Bell size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* User Profile Hero Card */}
          <View style={styles.profileHeroCard}>
            <View style={styles.profileAvatarContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80' }}
                style={styles.profileAvatar}
              />
              <View style={styles.goldBadge}>
                <Text style={styles.goldBadgeText}>⭐ GOLD MEMBER</Text>
              </View>
            </View>
            <Text style={styles.profileName}>{name}</Text>
            <View style={styles.profileContactRow}>
              <Mail size={14} color="#9CA3AF" />
              <Text style={styles.profileContactText}> {email}</Text>
            </View>
            <View style={styles.profileContactRow}>
              <Smartphone size={14} color="#9CA3AF" />
              <Text style={styles.profileContactText}> {phone}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} style={styles.editButton} onPress={handleEdit}>
              <Pencil size={16} color="#065F46" />
            </TouchableOpacity>
          </View>

          {/* Feature Navigation 2x2 Grid */}
          <View style={styles.featureGrid}>
            {FEATURE_GRID.map((item) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={styles.featureCard}
                  onPress={() => {
                    console.log(`[Profile] Feature: ${item.id}`);
                    if (item.id === 'subscriptions') {
                      onNavigateSubscription?.();
                    } else {
                      item.onPress();
                    }
                  }}
                >
                  <View style={[styles.featureIconContainer, { backgroundColor: item.iconBg }]}>
                    <Icon size={22} color={item.iconColor} />
                  </View>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Refer and Earn Banner */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.referBanner}
            onPress={() => console.log('[Profile] Refer banner pressed')}
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

          {/* Account Settings Menu List */}
          <Text style={styles.menuSectionLabel}>ACCOUNT SETTINGS</Text>
          <View style={styles.menuContainer}>
            {ACCOUNT_SETTINGS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={[styles.menuItem, idx < ACCOUNT_SETTINGS.length - 1 && styles.menuItemBorder]}
                  onPress={() => console.log(`[Profile] Menu: ${item.id}`)}
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

          {/* Support Menu List */}
          <Text style={styles.menuSectionLabel}>SUPPORT</Text>
          <View style={styles.menuContainer}>
            {SUPPORT_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={[styles.menuItem, idx < SUPPORT_ITEMS.length - 1 && styles.menuItemBorder]}
                  onPress={() => console.log(`[Profile] Support: ${item.id}`)}
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
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={() => {
                console.log('[Profile] Logout pressed');
                Alert.alert('Logout', 'Are you sure you want to logout?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: () => console.log('[Profile] User logged out') },
                ]);
              }}
            >
              <View style={styles.menuItemLeft}>
                <LogOut size={18} color="#DC2626" />
                <Text style={styles.menuLogoutLabel}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Edit Profile Modal */}
      <Modal visible={showEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit Profile</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setShowEdit(false); console.log('[Profile] Edit cancelled'); }}>
                <X size={22} color="#374151" />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.editInput} value={editName} onChangeText={setEditName} placeholder="Name" />
            <TextInput style={styles.editInput} value={editEmail} onChangeText={setEditEmail} placeholder="Email" keyboardType="email-address" />
            <TextInput style={styles.editInput} value={editPhone} onChangeText={setEditPhone} placeholder="Phone" keyboardType="phone-pad" />
            <TouchableOpacity activeOpacity={0.7} style={styles.editSaveBtn} onPress={confirmEdit}>
              <Text style={styles.editSaveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF8F7',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F7',
  },
  scrollContent: {
    paddingBottom: 32,
  },

  profileHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  profileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065F46',
  },

  profileHeroCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  profileAvatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  profileAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  goldBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: '#FBBF24',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
  },
  goldBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  profileContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  profileContactText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  featureCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  referBanner: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#8B4513',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  referTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  referTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  referAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    marginTop: 2,
  },
  referDescription: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 16,
  },
  referIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
  },
  menuContainer: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  menuLogoutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 40,
  },
  editModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  editModalTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  editInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#374151', marginBottom: 10, backgroundColor: '#FAFAFA',
  },
  editSaveBtn: { backgroundColor: '#065F46', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  editSaveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
