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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search, SlidersHorizontal, Star, Heart, Clock, MapPin, Repeat, X, ArrowLeft,
} from 'lucide-react-native';

import { useSearchKitchens, SearchFilters } from '@/src/features/kitchens/hooks/use-search-kitchens';
import { useAddresses } from '@/src/features/profile/hooks/use-addresses';
import { useCartStore } from '@/src/store/cart-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TRENDING_TAGS = ['Thali', 'Paneer Masala', 'Healthy Thali', 'Khichdi'];

const POPULAR_CATEGORIES = [
  { id: 'thalis', name: 'Full Thalis', subtitle: 'Complete festive meals', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80' },
  { id: 'healthy', name: 'Healthy', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80' },
  { id: 'snacks', name: 'Snacks', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80' },
  { id: 'sweets', name: 'Sweets', image: 'https://images.unsplash.com/photo-1589119908995-c6837f14842b?w=300&q=80' },
  { id: 'rice', name: 'Rice', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300&q=80' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { addresses } = useAddresses();
  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];
  const pincode = defaultAddress?.pincode || '440016';

  const [searchText, setSearchText] = useState('');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const [jainOnly, setJainOnly] = useState(false);
  const [maxDelivery, setMaxDelivery] = useState<number | undefined>(undefined);

  const filters: SearchFilters = {
    veg_only: vegOnly,
    jain_only: jainOnly,
    max_delivery_charge: maxDelivery,
  };

  const { data: kitchens, isLoading, error } = useSearchKitchens(
    searchText || selectedCategory || '',
    pincode,
    filters
  );

  const { addItem, replaceCart } = useCartStore();

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
    console.log(`[Explore] Favorite toggled for ${id}`);
  };

  const handleTagPress = (tag: string) => {
    setSearchText(tag);
    setSelectedCategory(null);
  };

  const handleCategoryPress = (catName: string) => {
    if (selectedCategory === catName) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(catName);
      setSearchText('');
    }
  };

  const handleQuickAdd = (kitchenId: string, item: { meal_box_id: string; name: string; price: number }) => {
    const res = addItem(item, kitchenId);
    if (res.mismatch) {
      Alert.alert(
        'Replace Cart?',
        'Your cart already contains items from another kitchen. Clear it and add this meal box instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Replace',
            onPress: () => {
              replaceCart(item, kitchenId);
            },
          },
        ]
      );
    } else {
      Alert.alert('Success', `${item.name} added to cart!`);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity activeOpacity={0.7} style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Explore Kitchens</Text>
          <View style={styles.statusIcon}>
            <View style={styles.statusDot} />
          </View>
        </View>

        {/* Search & Filter Trigger */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for home-cooked meals..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={(t) => {
                setSearchText(t);
                setSelectedCategory(null);
              }}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.filterToggle, (vegOnly || jainOnly || maxDelivery !== undefined) && styles.filterToggleActive]}
              onPress={() => setShowFilterModal(true)}
            >
              <SlidersHorizontal size={18} color={vegOnly || jainOnly || maxDelivery !== undefined ? '#FFFFFF' : '#059669'} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Trending tags */}
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

          {/* Popular Categories Grid */}
          <View style={styles.popularSection}>
            <View style={styles.popularHeader}>
              <View style={styles.popularHeaderLeft}>
                <Text style={styles.sectionTitle}>Popular Categories</Text>
                <Text style={styles.sectionSubtitle}>Handpicked for your cravings</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.fullWidthBanner, selectedCategory === 'Full Thalis' && { borderWidth: 3, borderColor: '#059669' }]}
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
                  style={[styles.categoryGridCard, selectedCategory === cat.name && { borderWidth: 2.5, borderColor: '#059669' }]}
                  onPress={() => handleCategoryPress(cat.name)}
                >
                  <Image source={{ uri: cat.image }} style={styles.categoryGridImage} />
                  <View style={styles.categoryGridOverlay} />
                  <Text style={styles.categoryGridLabel}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Search Result List */}
          <View style={styles.kitchensSection}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            
            {isLoading ? (
              <ActivityIndicator size="large" color="#065F46" style={{ marginTop: 24 }} />
            ) : error ? (
              <Text style={styles.errorText}>Failed to load search results.</Text>
            ) : !kitchens || kitchens.length === 0 ? (
              <View style={styles.emptyView}>
                <Text style={styles.emptyText}>No kitchens found matching your query or filters.</Text>
              </View>
            ) : (
              kitchens.map((kitchen) => (
                <TouchableOpacity
                  key={kitchen.id}
                  activeOpacity={0.9}
                  style={styles.kitchenCard}
                  onPress={() => router.push({ pathname: '/mess-detail' as any, params: { id: kitchen.id } })}
                >
                  <View style={styles.kitchenCardImageContainer}>
                    <Image source={{ uri: kitchen.cover || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&q=80' }} style={styles.kitchenCardImage} />
                    <View style={styles.kitchenRatingPill}>
                      <Star size={11} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.kitchenRatingText}> {kitchen.rating || '4.0'}</Text>
                    </View>
                  </View>

                  <View style={styles.kitchenCardBody}>
                    <View style={styles.kitchenCardTopRow}>
                      <Text style={styles.kitchenCardName}>{kitchen.name}</Text>
                      <TouchableOpacity activeOpacity={0.7} onPress={() => toggleFavorite(kitchen.id)}>
                        <Heart size={18} color={favorites[kitchen.id] ? '#DC2626' : '#D1D5DB'} fill={favorites[kitchen.id] ? '#DC2626' : 'none'} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.kitchenCardCuisine}>
                      {kitchen.cuisine} • ₹{kitchen.delivery_charge} delivery fee
                    </Text>
                    <View style={styles.cardDivider} />
                    <View style={styles.kitchenCardFooter}>
                      <View style={styles.famousForBlock}>
                        <Text style={styles.famousForLabel}>Est. Delivery</Text>
                        <Text style={styles.famousForValue}>{kitchen.estimated_time} mins</Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.quickAddButton}
                        onPress={() => handleQuickAdd(kitchen.id, { meal_box_id: kitchen.id, name: kitchen.name + ' Menu', price: 100 })}
                      >
                        <Text style={styles.quickAddText}>View Menu</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        {/* Filters Modal */}
        <Modal
          visible={showFilterModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Kitchens</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <X size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Dietary Option</Text>
                <View style={styles.filterRow}>
                  <TouchableOpacity
                    style={[styles.filterChoice, vegOnly && styles.filterChoiceActive]}
                    onPress={() => setVegOnly(!vegOnly)}
                  >
                    <Text style={[styles.filterChoiceText, vegOnly && styles.filterChoiceTextActive]}>Pure Veg</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterChoice, jainOnly && styles.filterChoiceActive]}
                    onPress={() => setJainOnly(!jainOnly)}
                  >
                    <Text style={[styles.filterChoiceText, jainOnly && styles.filterChoiceTextActive]}>Jain Available</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Delivery Charges</Text>
                <View style={styles.filterRow}>
                  <TouchableOpacity
                    style={[styles.filterChoice, maxDelivery === 0 && styles.filterChoiceActive]}
                    onPress={() => setMaxDelivery(maxDelivery === 0 ? undefined : 0)}
                  >
                    <Text style={[styles.filterChoiceText, maxDelivery === 0 && styles.filterChoiceTextActive]}>Free Delivery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterChoice, maxDelivery === 40 && styles.filterChoiceActive]}
                    onPress={() => setMaxDelivery(maxDelivery === 40 ? undefined : 40)}
                  >
                    <Text style={[styles.filterChoiceText, maxDelivery === 40 && styles.filterChoiceTextActive]}>Under ₹40</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
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
  scrollContent: { paddingBottom: 60 },
  errorText: { fontSize: 13, color: '#DC2626', textAlign: 'center', marginTop: 20 },
  emptyView: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },

  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  statusIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },

  searchContainer: { paddingHorizontal: 16, marginTop: 8, marginBottom: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#374151' },
  filterToggle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  filterToggleActive: { backgroundColor: '#059669' },

  trendingSection: { paddingHorizontal: 16, marginTop: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trendingTag: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  trendingTagText: { fontSize: 13, fontWeight: '600', color: '#374151' },

  popularSection: { paddingHorizontal: 16, marginTop: 20 },
  popularHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  popularHeaderLeft: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  sectionSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

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
  kitchenCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginTop: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  kitchenCardImageContainer: { height: 160, position: 'relative' },
  kitchenCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  kitchenRatingPill: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  kitchenRatingText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  kitchenCardBody: { padding: 14 },
  kitchenCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kitchenCardName: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  kitchenCardCuisine: { fontSize: 12, color: '#9CA3AF', marginTop: 3 },
  cardDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  kitchenCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  famousForBlock: {},
  famousForLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  famousForValue: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginTop: 2 },
  quickAddButton: { borderWidth: 1.5, borderColor: '#059669', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  quickAddText: { color: '#059669', fontSize: 12, fontWeight: '700' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 350 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  filterSection: { marginBottom: 24 },
  filterLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterChoice: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' },
  filterChoiceActive: { backgroundColor: '#ECFDF5', borderColor: '#059669' },
  filterChoiceText: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  filterChoiceTextActive: { color: '#059669', fontWeight: '700' },
  applyBtn: { backgroundColor: '#065F46', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  applyBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
