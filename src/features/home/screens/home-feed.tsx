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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MapPin, Search, Mic, SlidersHorizontal, Star, Heart, Clock,
  ShoppingCart, ChevronDown, HeartHandshake, Bell, Gift,
} from 'lucide-react-native';

import { useHomeFeed } from '@/src/features/home/hooks/use-home-feed';
import { useAddresses } from '@/src/features/profile/hooks/use-addresses';
import { useCartStore } from '@/src/store/cart-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeFeedScreen() {
  const router = useRouter();
  const { addresses } = useAddresses();
  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];
  const pincode = defaultAddress?.pincode || '440016';
  
  // Nagoya/Nagpur default coordinates: lat 21.1458, lng 79.0882
  const lat = defaultAddress?.latitude ? parseFloat(defaultAddress.latitude.toString()) : 21.1458;
  const lng = defaultAddress?.longitude ? parseFloat(defaultAddress.longitude.toString()) : 79.0882;

  const { data, isLoading, error } = useHomeFeed(lat, lng, pincode);

  const { items: cartItems, addItem, clearCart, replaceCart } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFavorite, setIsFavorite] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string) => {
    setIsFavorite((prev) => ({ ...prev, [id]: !prev[id] }));
    console.log(`[Home] Favorite toggled for ${id}`);
  };

  const handleAddToCart = (item: { id: string; name: string; price: number }, kitchenId: string) => {
    const res = addItem(
      { meal_box_id: item.id, name: item.name, price: item.price },
      kitchenId
    );

    if (res.mismatch) {
      Alert.alert(
        'Clear Cart?',
        'Your cart already contains items from another kitchen. Clear it and add this meal box instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Replace',
            onPress: () => {
              replaceCart(
                { meal_box_id: item.id, name: item.name, price: item.price },
                kitchenId
              );
            },
          },
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color="#065F46" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>Failed to load home feed. Please try again.</Text>
      </SafeAreaView>
    );
  }

  const feed = data!;

  const filteredKitchens = selectedCategory
    ? feed.popular_kitchens.filter((k) =>
        k.cuisine.toLowerCase().includes(selectedCategory.toLowerCase())
      )
    : feed.popular_kitchens;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Header Row */}
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.locationRow}
              onPress={() => router.push('/select-address' as any)}
            >
              <MapPin size={20} color="#22C55E" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.homeLabel}>{defaultAddress ? defaultAddress.label : 'Choose Location'}</Text>
                <View style={styles.addressRow}>
                  <Text style={styles.addressText} numberOfLines={1}>
                    {defaultAddress
                      ? `${defaultAddress.address_line1}, ${defaultAddress.city}`
                      : 'Himgna, Nagpur, Maharashtra, India'}
                  </Text>
                  <ChevronDown size={14} color="#6B7280" />
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.bellBtn}
              onPress={() => router.push('/notifications' as any)}
            >
              <Bell size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Hero Banner Section */}
          <View style={styles.heroWrapper}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setSearchQuery('Ghar Ka Khana Special Thali');
                router.push({ pathname: '/explore' as any, params: { q: 'Thali' } });
              }}
            >
              <View style={styles.heroBanner}>
                <View style={styles.heroImageContainer}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=200&q=80' }} style={styles.heroFoodImage} />
                </View>
                <View style={styles.heroTextContainer}>
                  <Text style={styles.gharKaLine1}>ghar ka</Text>
                  <View style={styles.khanaRow}>
                    <Text style={styles.khanaText}>khana</Text>
                    <HeartHandshake size={28} color="#DC2626" />
                  </View>
                  <Text style={styles.taglineText}>Ghar jaisa swad, ab aapke paas</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => router.push('/explore' as any)}
              style={styles.searchBar}
            >
              <Search size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Search for meals, cuisines or kitchens"
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                value={searchQuery}
                editable={false}
              />
              <Mic size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Categories Grid */}
          {feed.categories.length > 0 && (
            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>{"What's on your mind?"}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                {feed.categories.map((item, idx) => {
                  const isSelected = selectedCategory === item.name;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.7}
                      style={styles.categoryItem}
                      onPress={() => {
                        const newCat = isSelected ? null : item.name;
                        setSelectedCategory(newCat);
                      }}
                    >
                      <View style={[styles.categoryCircle, isSelected && styles.categoryCircleSelected]}>
                        <Image source={{ uri: item.image }} style={styles.categoryImage} />
                      </View>
                      <Text style={[styles.categoryText, isSelected && { color: '#065F46', fontWeight: '800' }]}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Offers Carousel */}
          {feed.limited_offers.length > 0 && (
            <View style={styles.limitedOffersSection}>
              <View style={styles.limitedBadge}>
                <Text style={styles.limitedBadgeText}>LIMITED OFFERS</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.limitedScroll}>
                {feed.limited_offers.map((offer) => (
                  <View key={offer.id} style={styles.limitedCard}>
                    <Image source={{ uri: offer.image }} style={styles.limitedCardImage} />
                    <View style={styles.limitedCardOverlay} />
                    <Text style={styles.limitedCardTitle}>{offer.title}</Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.limitedOrderButton}
                      onPress={() => {
                        router.push({ pathname: '/mess-detail' as any, params: { id: offer.kitchen_id } });
                      }}
                    >
                      <Text style={styles.limitedOrderText}>Order Now</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Popular Kitchens Section */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Popular Kitchens Near You</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.filterButton}
                onPress={() => router.push('/explore' as any)}
              >
                <SlidersHorizontal size={14} color="#FFFFFF" />
                <Text style={styles.filterText}>Filters</Text>
              </TouchableOpacity>
            </View>
            
            {filteredKitchens.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No kitchens servicing this area currently.</Text>
              </View>
            ) : (
              filteredKitchens.map((kitchen) => (
                <TouchableOpacity
                  key={kitchen.id}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/mess-detail' as any, params: { id: kitchen.id } })}
                  style={styles.kitchenCard}
                >
                  <View style={styles.kitchenRow}>
                    <Image source={{ uri: kitchen.image || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=150&q=80' }} style={styles.kitchenImage} />
                    <View style={styles.kitchenInfo}>
                      <Text style={styles.kitchenName}>{kitchen.name}</Text>
                      <Text style={styles.kitchenCuisine}>{kitchen.cuisine}</Text>
                      <Text style={styles.kitchenMeta}>{kitchen.estimated_time} min • ₹{kitchen.minimum_order} min. order</Text>
                    </View>
                    <View style={styles.kitchenRatingBadge}>
                      <Text style={styles.kitchenRatingText}>{kitchen.rating || '4.0'}</Text>
                      <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Recommended Kitchens Section */}
          {feed.recommended_kitchens.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>Recommended for You</Text>
              </View>
              {feed.recommended_kitchens.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/mess-detail' as any, params: { id: item.id } })}
                  style={styles.recCard}
                >
                  <View style={styles.recImageContainer}>
                    <Image source={{ uri: item.cover || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' }} style={styles.recImage} />
                    <View style={styles.recRatingPill}>
                      <Star size={10} color="#EF4444" fill="#EF4444" />
                      <Text style={styles.recRatingText}> {item.rating || '4.0'}</Text>
                    </View>
                    <View style={styles.safetyPill}>
                      <Text style={styles.safetyPillText}>🛡️ SAFETY VERIFIED</Text>
                    </View>
                  </View>
                  <View style={styles.recBody}>
                    <View style={styles.recTopRow}>
                      <Text style={styles.recName}>{item.name}</Text>
                      <TouchableOpacity activeOpacity={0.7} onPress={() => toggleFavorite(item.id)}>
                        <Heart size={18} color={isFavorite[item.id] ? '#DC2626' : '#D1D5DB'} fill={isFavorite[item.id] ? '#DC2626' : 'none'} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.recSpecial}>Specializes in: {item.cuisine}</Text>
                    <View style={styles.recDivider} />
                    <View style={styles.recMetaRow}>
                      <View style={styles.recMetaItem}>
                        <Clock size={14} color="#6B7280" />
                        <Text style={styles.recMetaText}> {item.estimated_time} mins</Text>
                      </View>
                      <View style={styles.recMetaItem}>
                        <MapPin size={14} color="#6B7280" />
                        <Text style={styles.recMetaText}> {item.distance_miles} miles away</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Floating Cart Button (Zustand Cart State integration) */}
        {cartItems.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.floatingCart}
            onPress={() => router.push('/cart' as any)}
          >
            <ShoppingCart size={24} color="#FFFFFF" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  errorText: { fontSize: 14, color: '#DC2626', fontWeight: '600' },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#6B7280', fontSize: 13 },
  
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 },
  locationTextContainer: { marginLeft: 8, flex: 1 },
  homeLabel: { fontWeight: '700', color: '#1F2937', fontSize: 15 },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  addressText: { color: '#6B7280', fontSize: 11, flex: 1 },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },

  heroWrapper: { marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
  heroBanner: { borderRadius: 20, backgroundColor: '#FEF3C7', padding: 12, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#FDE68A' },
  heroImageContainer: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', borderWidth: 3, borderColor: '#FFFFFF' },
  heroFoodImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroTextContainer: { flex: 1, marginLeft: 12 },
  gharKaLine1: { color: '#065F46', fontWeight: '800', fontSize: 22, letterSpacing: 0.5 },
  khanaRow: { flexDirection: 'row', alignItems: 'center' },
  khanaText: { color: '#DC2626', fontWeight: '900', fontSize: 34, letterSpacing: 0.5 },
  taglineText: { color: '#4B5563', fontSize: 11, fontWeight: '500', marginTop: 2 },

  searchBar: { marginTop: -22, marginHorizontal: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 6 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13, color: '#374151' },

  categoriesSection: { marginTop: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', paddingHorizontal: 16, marginBottom: 12 },
  categoriesScroll: { paddingHorizontal: 16 },
  categoryItem: { alignItems: 'center', marginRight: 18 },
  categoryCircle: { width: 62, height: 62, borderRadius: 31, overflow: 'hidden', borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#F3F4F6', marginBottom: 6 },
  categoryCircleSelected: { borderWidth: 3, borderColor: '#065F46' },
  categoryImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  categoryText: { fontSize: 11, color: '#4B5563', fontWeight: '600' },

  limitedOffersSection: { marginTop: 12, marginBottom: 8 },
  limitedBadge: { backgroundColor: '#EA580C', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginLeft: 16, marginBottom: 10 },
  limitedBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  limitedScroll: { paddingHorizontal: 16 },
  limitedCard: { width: SCREEN_WIDTH * 0.72, height: 180, borderRadius: 16, overflow: 'hidden', marginRight: 12, position: 'relative' },
  limitedCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  limitedCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  limitedCardTitle: { position: 'absolute', bottom: 52, left: 14, color: '#FFFFFF', fontSize: 16, fontWeight: '800', lineHeight: 22 },
  limitedOrderButton: { position: 'absolute', bottom: 14, left: 14, backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  limitedOrderText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  sectionBlock: { marginTop: 16, marginHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionHeaderText: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  filterText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginLeft: 5 },

  kitchenCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  kitchenRow: { flexDirection: 'row', alignItems: 'center' },
  kitchenImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#E5E7EB', resizeMode: 'cover' },
  kitchenInfo: { flex: 1, marginLeft: 12 },
  kitchenName: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  kitchenCuisine: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  kitchenMeta: { fontSize: 11, color: '#6B7280', fontWeight: '500', marginTop: 3 },
  kitchenRatingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  kitchenRatingText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginRight: 3 },

  recCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  recImageContainer: { height: 180, position: 'relative' },
  recImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  recRatingPill: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  recRatingText: { color: '#1F2937', fontSize: 12, fontWeight: '700' },
  safetyPill: { position: 'absolute', bottom: 12, left: 12, backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  safetyPillText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  recBody: { padding: 14 },
  recTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recName: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  recSpecial: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
  recDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
  recMetaRow: { flexDirection: 'row', alignItems: 'center' },
  recMetaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  recMetaText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  floatingCart: { position: 'absolute', bottom: 20, right: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: '#065F46', justifyContent: 'center', alignItems: 'center', shadowColor: '#065F46', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8, zIndex: 50 },
  cartBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#F97316', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  cartBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});
