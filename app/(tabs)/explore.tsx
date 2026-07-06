import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Star,
  Heart,
  Clock,
  MapPin,
  ChevronRight,
  Repeat,
  X,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TRENDING_TAGS = ['Homemade Paneer', 'Diet Tiffin', 'South Indian Thali', 'Dal Baati'];

const ALL_CATEGORIES = [
  { id: 'thalis', name: 'Full Thalis', subtitle: 'Complete festive meals', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80', isFullWidth: true },
  { id: 'healthy', name: 'Healthy', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80' },
  { id: 'snacks', name: 'Snacks', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80' },
  { id: 'sweets', name: 'Sweets', image: 'https://images.unsplash.com/photo-1589119908995-c6837f14842b?w=300&q=80' },
  { id: 'rice', name: 'Rice', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300&q=80' },
  { id: 'curry', name: 'Curry', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300&q=80' },
  { id: 'roti', name: 'Rotis', image: 'https://images.unsplash.com/photo-1589119908995-c6837f14842b?w=300&q=80' },
  { id: 'chaat', name: 'Chaat', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80' },
];

const POPULAR_CATEGORIES = ALL_CATEGORIES.slice(0, 5);

const TOP_KITCHENS = [
  {
    id: '1',
    name: "Shantilata's Rasoi",
    cuisine: 'North Indian',
    distance: '2.4 km',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&q=80',
    badges: ['Pure Veg', 'Less Oil', 'Authentic'],
    famousFor: 'Stuffed Paratha Combo',
  },
  {
    id: '2',
    name: 'The Konkan Kitchen',
    cuisine: 'Coastal Maharashtrian',
    distance: '1.8 km',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80',
    badges: ['Pure Veg', 'Home-ground Spices'],
    famousFor: 'Fish Curry Rice',
  },
  {
    id: '3',
    name: "Maa Ke Hath Ka Khana",
    cuisine: 'Punjabi',
    distance: '3.1 km',
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80',
    badges: ['Pure Veg', 'Authentic', 'Less Oil'],
    famousFor: 'Dal Makhani Combo',
  },
];

export default function ExploreScreen() {
  const [searchText, setSearchText] = useState('');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [showViewAll, setShowViewAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddKitchen, setQuickAddKitchen] = useState<string | null>(null);
  const [quickAddQty, setQuickAddQty] = useState(1);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
    console.log(`[Explore] Favorite toggled for ${id}`);
  };

  const handleTagPress = (tag: string) => {
    setSearchText(tag);
    console.log(`[Explore] Tag pressed: ${tag}`);
  };

  const handleCategoryPress = (catName: string) => {
    setSelectedCategory(catName === selectedCategory ? null : catName);
    console.log(`[Explore] Category selected: ${catName}`);
  };

  const handleQuickAdd = (kitchenName: string) => {
    setQuickAddKitchen(kitchenName);
    setQuickAddQty(1);
    setShowQuickAddModal(true);
    console.log(`[Explore] Quick add opened for: ${kitchenName}`);
  };

  const confirmQuickAdd = () => {
    Alert.alert('Quick Add', `Added ${quickAddQty} portion(s) from ${quickAddKitchen}`);
    console.log(`[Explore] Quick add confirmed: ${quickAddKitchen} x${quickAddQty}`);
    setShowQuickAddModal(false);
  };

  const handleRepeat = () => {
    Alert.alert('Reorder', 'Last meal from Aai Chi Mess has been added to your cart!');
    console.log('[Explore] Repeat order from Aai Chi Mess');
  };

  const filteredKitchens = selectedCategory
    ? TOP_KITCHENS.filter(k =>
        k.cuisine.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        k.badges.some(b => b.toLowerCase().includes(selectedCategory.toLowerCase()))
      )
    : TOP_KITCHENS;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header Logo Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity activeOpacity={0.7} style={styles.backButton} onPress={() => console.log('[Explore] Back pressed')}>
              <ArrowLeft size={22} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Prajwal's App</Text>
            <View style={styles.statusIcon}>
              <View style={styles.statusDot} />
            </View>
          </View>

          {/* Filter Search Input Field */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for home-cooked meals..."
                placeholderTextColor="#9CA3AF"
                value={searchText}
                onChangeText={(t) => { setSearchText(t); console.log('[Explore] Search:', t); }}
              />
              <TouchableOpacity activeOpacity={0.7} style={styles.filterToggle} onPress={() => console.log('[Explore] Filter toggled')}>
                <SlidersHorizontal size={18} color="#059669" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Trending Searches Section */}
          <View style={styles.trendingSection}>
            <Text style={styles.sectionLabel}>Trending Searches</Text>
            <View style={styles.tagsRow}>
              {TRENDING_TAGS.map((tag, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  style={styles.trendingTag}
                  onPress={() => handleTagPress(tag)}
                >
                  <Text style={styles.trendingTagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Popular Categories Compound Grid */}
          <View style={styles.popularSection}>
            <View style={styles.popularHeader}>
              <View style={styles.popularHeaderLeft}>
                <Text style={styles.sectionTitle}>Popular Categories</Text>
                <Text style={styles.sectionSubtitle}>Handpicked for your cravings</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setShowViewAll(true); console.log('[Explore] View all pressed'); }}>
                <Text style={styles.viewAllText}>VIEW ALL</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.fullWidthBanner}
              onPress={() => handleCategoryPress('Full Thalis')}
            >
              <Image source={{ uri: POPULAR_CATEGORIES[0].image }} style={styles.fullWidthBannerImage} />
              <View style={styles.bannerOverlay} />
              <View style={styles.bannerTextBlock}>
                <Text style={styles.bannerTitle}>{POPULAR_CATEGORIES[0].name}</Text>
                <Text style={styles.bannerSubtitle}>{POPULAR_CATEGORIES[0].subtitle}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.categoryGrid}>
              {POPULAR_CATEGORIES.slice(1).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.7}
                  style={[styles.categoryGridCard, selectedCategory === cat.name && { borderWidth: 2, borderColor: '#059669' }]}
                  onPress={() => handleCategoryPress(cat.name)}
                >
                  <Image source={{ uri: cat.image }} style={styles.categoryGridImage} />
                  <View style={styles.categoryGridOverlay} />
                  <Text style={styles.categoryGridLabel}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Explore Top Kitchens Cards */}
          <View style={styles.kitchensSection}>
            <Text style={styles.sectionTitle}>Explore Top Kitchens</Text>
            {filteredKitchens.length === 0 && (
              <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 20, fontSize: 14 }}>
                No kitchens found for "{selectedCategory}"
              </Text>
            )}
            {filteredKitchens.map((kitchen) => (
              <TouchableOpacity key={kitchen.id} activeOpacity={0.7} onPress={() => router.push('/mess-detail')}>
                <View style={styles.kitchenCard}>
                  <View style={styles.kitchenCardImageContainer}>
                    <Image source={{ uri: kitchen.image }} style={styles.kitchenCardImage} />
                    <View style={styles.kitchenRatingPill}>
                      <Star size={11} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.kitchenRatingText}> {kitchen.rating}</Text>
                    </View>
                  </View>

                  <View style={styles.kitchenCardBody}>
                    <View style={styles.kitchenCardTopRow}>
                      <Text style={styles.kitchenCardName}>{kitchen.name}</Text>
                      <TouchableOpacity activeOpacity={0.7} onPress={() => toggleFavorite(kitchen.id)}>
                        <Heart size={18} color={favorites[kitchen.id] ? '#DC2626' : '#D1D5DB'} fill={favorites[kitchen.id] ? '#DC2626' : 'none'} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.kitchenCardCuisine}>{kitchen.cuisine} • {kitchen.distance} away</Text>

                    <View style={styles.badgesRow}>
                      {kitchen.badges.map((badge, idx) => (
                        <View key={idx} style={styles.badge}>
                          <Text style={styles.badgeText}>{badge}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.kitchenCardFooter}>
                      <View style={styles.famousForBlock}>
                        <Text style={styles.famousForLabel}>Famous for</Text>
                        <Text style={styles.famousForValue}>{kitchen.famousFor}</Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.quickAddButton}
                        onPress={() => handleQuickAdd(kitchen.name)}
                      >
                        <Text style={styles.quickAddText}>+ Quick Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reorder Your Last Meal Banner */}
          <View style={styles.reorderSection}>
            <View style={styles.reorderCard}>
              <Text style={styles.reorderTitle}>Reorder your last meal</Text>
              <View style={styles.reorderRow}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&q=80' }}
                  style={styles.reorderImage}
                />
                <View style={styles.reorderInfo}>
                  <Text style={styles.reorderKitchenName}>Aai Chi Mess</Text>
                  <Text style={styles.reorderItemName}>Thali</Text>
                  <View style={styles.reorderMeta}>
                    <Clock size={12} color="#6B7280" />
                    <Text style={styles.reorderMetaText}> 30-40 min</Text>
                    <MapPin size={12} color="#6B7280" />
                    <Text style={styles.reorderMetaText}> 1.3 km</Text>
                  </View>
                </View>
                <TouchableOpacity activeOpacity={0.7} style={styles.repeatButton} onPress={handleRepeat}>
                  <Repeat size={16} color="#FFFFFF" />
                  <Text style={styles.repeatButtonText}> Repeat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* View All Modal */}
      <Modal visible={showViewAll} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Categories</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setShowViewAll(false); console.log('[Explore] View all closed'); }}>
                <X size={22} color="#374151" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalGrid}>
              {ALL_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.7}
                  style={styles.modalGridCard}
                  onPress={() => {
                    handleCategoryPress(cat.name);
                    setShowViewAll(false);
                  }}
                >
                  <Image source={{ uri: cat.image }} style={styles.modalGridImage} />
                  <View style={styles.modalGridOverlay} />
                  <Text style={styles.modalGridLabel}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Add Modal */}
      <Modal visible={showQuickAddModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.quickAddModalContent}>
            <Text style={styles.quickAddModalTitle}>{quickAddKitchen}</Text>
            <Text style={styles.quickAddModalSubtitle}>Select portions</Text>
            <View style={styles.quickAddStepper}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.qaStepperBtn}
                onPress={() => setQuickAddQty(Math.max(1, quickAddQty - 1))}
              >
                <Text style={styles.qaStepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qaStepperValue}>{quickAddQty}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.qaStepperBtn}
                onPress={() => setQuickAddQty(quickAddQty + 1)}
              >
                <Text style={styles.qaStepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.quickAddActions}>
              <TouchableOpacity activeOpacity={0.7} style={styles.qaCancelBtn} onPress={() => setShowQuickAddModal(false)}>
                <Text style={styles.qaCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.qaConfirmBtn} onPress={confirmQuickAdd}>
                <Text style={styles.qaConfirmText}>Add {quickAddQty}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF8F7' },
  safeArea: { flex: 1, backgroundColor: '#FAF8F7' },
  scrollContent: { paddingBottom: 32 },

  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  statusIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },

  searchContainer: { paddingHorizontal: 16, marginTop: 8, marginBottom: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 25, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#374151' },
  filterToggle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },

  trendingSection: { paddingHorizontal: 16, marginTop: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trendingTag: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  trendingTagText: { fontSize: 13, fontWeight: '600', color: '#374151' },

  popularSection: { paddingHorizontal: 16, marginTop: 20 },
  popularHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  popularHeaderLeft: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  sectionSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  viewAllText: { fontSize: 12, fontWeight: '700', color: '#059669', marginTop: 4 },

  fullWidthBanner: { width: '100%', height: 160, borderRadius: 16, overflow: 'hidden', position: 'relative', marginBottom: 10 },
  fullWidthBannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  bannerTextBlock: { position: 'absolute', bottom: 16, left: 16 },
  bannerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryGridCard: { width: (SCREEN_WIDTH - 42) / 2, height: 110, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  categoryGridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  categoryGridOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  categoryGridLabel: { position: 'absolute', bottom: 10, left: 12, color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

  kitchensSection: { paddingHorizontal: 16, marginTop: 24 },
  kitchenCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginTop: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  kitchenCardImageContainer: { height: 160, position: 'relative' },
  kitchenCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  kitchenRatingPill: {
    position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, flexDirection: 'row', alignItems: 'center',
  },
  kitchenRatingText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  kitchenCardBody: { padding: 14 },
  kitchenCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kitchenCardName: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  kitchenCardCuisine: { fontSize: 12, color: '#9CA3AF', marginTop: 3 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  badge: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
  cardDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  kitchenCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  famousForBlock: {},
  famousForLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  famousForValue: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginTop: 2 },
  quickAddButton: { borderWidth: 1.5, borderColor: '#059669', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  quickAddText: { color: '#059669', fontSize: 12, fontWeight: '700' },

  reorderSection: { paddingHorizontal: 16, marginTop: 24, marginBottom: 16 },
  reorderCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  reorderTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  reorderRow: { flexDirection: 'row', alignItems: 'center' },
  reorderImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#E5E7EB', resizeMode: 'cover' },
  reorderInfo: { flex: 1, marginLeft: 12 },
  reorderKitchenName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  reorderItemName: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  reorderMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  reorderMetaText: { fontSize: 11, color: '#6B7280', fontWeight: '500', marginRight: 6 },
  repeatButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B6623', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginLeft: 8 },
  repeatButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  // Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 16, paddingHorizontal: 16, paddingBottom: 40, maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  modalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modalGridCard: { width: (SCREEN_WIDTH - 42) / 2, height: 120, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  modalGridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  modalGridOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalGridLabel: { position: 'absolute', bottom: 10, left: 12, color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

  quickAddModalContent: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 24, paddingHorizontal: 24, paddingBottom: 40,
  },
  quickAddModalTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  quickAddModalSubtitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },
  quickAddStepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 },
  qaStepperBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  qaStepperBtnText: { fontSize: 22, fontWeight: '700', color: '#374151' },
  qaStepperValue: { fontSize: 22, fontWeight: '800', color: '#1F2937', width: 40, textAlign: 'center' },
  quickAddActions: { flexDirection: 'row', gap: 12 },
  qaCancelBtn: { flex: 1, borderRadius: 25, borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 14, alignItems: 'center' },
  qaCancelText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  qaConfirmBtn: { flex: 1, borderRadius: 25, backgroundColor: '#065F46', paddingVertical: 14, alignItems: 'center' },
  qaConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
