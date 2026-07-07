import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Star, Clock, ShoppingCart, Info, Award, Utensils } from 'lucide-react-native';

import { useKitchen } from '@/src/features/kitchens/hooks/use-kitchen';
import { useCartStore } from '@/src/store/cart-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MessDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const kitchenId = params.id as string;

  const { data: detail, isLoading, error } = useKitchen(kitchenId);
  const { items: cartItems, addItem, replaceCart } = useCartStore();
  const [activeSubTab, setActiveSubTab] = useState<'menu' | 'reviews'>('menu');

  const handleAddToCart = (item: any) => {
    const res = addItem(
      { meal_box_id: item.id.toString(), name: item.name, price: parseFloat(item.selling_price) },
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
                { meal_box_id: item.id.toString(), name: item.name, price: parseFloat(item.selling_price) },
                kitchenId
              );
            },
          },
        ]
      );
    } else {
      Alert.alert('Added', `${item.name} added to cart!`);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color="#065F46" />
      </SafeAreaView>
    );
  }

  if (error || !detail) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <Text style={styles.errorText}>Failed to load kitchen details.</Text>
      </SafeAreaView>
    );
  }

  const { kitchen, mealBoxes, plans, reviews } = detail;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Cover Image & Back button */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: kitchen.cover_image_url || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80' }}
            style={styles.coverImage}
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={22} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Kitchen Info Header */}
        <View style={styles.headerBlock}>
          <View style={styles.kitchenHeaderRow}>
            <Text style={styles.kitchenName}>{kitchen.name}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{kitchen.rating || '4.0'}</Text>
              <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.cuisineText}>{kitchen.cuisine_type || 'Maharashtrian • Homemade'}</Text>
          <Text style={styles.descText}>{kitchen.description || 'Tasty, hygienic, and home-cooked meals delivered warm daily.'}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.metaText}>{kitchen.estimated_delivery_minutes || 40} mins delivery</Text>
            </View>
            <View style={styles.metaItem}>
              <Info size={16} color="#6B7280" />
              <Text style={styles.metaText}>Nagpur</Text>
            </View>
          </View>
        </View>

        {/* Tab Selection */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeSubTab === 'menu' && styles.tabBtnActive]}
            onPress={() => setActiveSubTab('menu')}
          >
            <Text style={[styles.tabText, activeSubTab === 'menu' && styles.tabTextActive]}>Meal Boxes ({mealBoxes?.length || 0})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeSubTab === 'reviews' && styles.tabBtnActive]}
            onPress={() => setActiveSubTab('reviews')}
          >
            <Text style={[styles.tabText, activeSubTab === 'reviews' && styles.tabTextActive]}>Reviews ({reviews?.length || 0})</Text>
          </TouchableOpacity>
        </View>

        {/* Sub-tab view contents */}
        {activeSubTab === 'menu' ? (
          <View style={styles.menuContainer}>
            {/* Meal Boxes */}
            {mealBoxes && mealBoxes.length > 0 ? (
              mealBoxes.map((box: any) => (
                <View key={box.id} style={styles.boxCard}>
                  <View style={styles.boxMain}>
                    <View style={styles.boxDetails}>
                      <View style={styles.tagRow}>
                        {box.meal_type === 'veg' ? (
                          <View style={[styles.vegTag, { borderColor: '#10B981' }]}>
                            <View style={[styles.vegDot, { backgroundColor: '#10B981' }]} />
                          </View>
                        ) : (
                          <View style={[styles.vegTag, { borderColor: '#EF4444' }]}>
                            <View style={[styles.vegDot, { backgroundColor: '#EF4444' }]} />
                          </View>
                        )}
                        {box.is_jain_available && (
                          <View style={styles.jainPill}>
                            <Text style={styles.jainPillText}>JAIN AVAILABLE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.boxName}>{box.name}</Text>
                      <Text style={styles.boxDesc} numberOfLines={2}>{box.description || 'Full thali rotation.'}</Text>
                      <View style={styles.priceBlock}>
                        <Text style={styles.sellPrice}>₹{box.selling_price}</Text>
                        {parseFloat(box.mrp_price) > parseFloat(box.selling_price) && (
                          <Text style={styles.mrpPrice}>₹{box.mrp_price}</Text>
                        )}
                      </View>
                    </View>
                    {box.image_url ? (
                      <Image source={{ uri: box.image_url }} style={styles.boxImg} />
                    ) : (
                      <View style={[styles.boxImg, styles.center, { backgroundColor: '#F3F4F6' }]}>
                        <Utensils size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>

                  {/* Dishes listing inside box */}
                  {box.meal_box_items && box.meal_box_items.length > 0 && (
                    <View style={styles.includesBlock}>
                      <Text style={styles.includesTitle}>Includes:</Text>
                      <Text style={styles.includesItems}>
                        {box.meal_box_items.map((i: any) => `${i.dishes?.name} (${i.quantity})`).join(', ')}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleAddToCart(box)}
                  >
                    <Text style={styles.addBtnText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No meal boxes available currently.</Text>
            )}

            {/* Subscription Packages */}
            {plans && plans.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text style={styles.sectionTitle}>Subscription Packages</Text>
                {plans.map((plan: any) => (
                  <View key={plan.id} style={styles.planCard}>
                    <View style={styles.planHeader}>
                      <Award size={20} color="#EA580C" />
                      <Text style={styles.planName}>{plan.name}</Text>
                    </View>
                    <Text style={styles.planDesc}>{plan.description || `${plan.duration_days} Days recurring subscription plan.`}</Text>
                    <Text style={styles.planMeta}>Meals/Day: {plan.meals_per_day} Meal slot</Text>
                    <View style={styles.planFooter}>
                      <Text style={styles.planPrice}>₹{plan.price}</Text>
                      <TouchableOpacity
                        style={styles.subscribeBtn}
                        onPress={() => router.push({ pathname: '/subscription-tracker' as any, params: { planId: plan.id } })}
                      >
                        <Text style={styles.subscribeBtnText}>Subscribe</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.menuContainer}>
            {reviews && reviews.length > 0 ? (
              reviews.map((rev: any) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUser}>{rev.users?.full_name || 'Anonymous User'}</Text>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} size={12} color="#FBBF24" fill="#FBBF24" />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{rev.review_text || 'No comment provided.'}</Text>
                  <Text style={styles.reviewDate}>{new Date(rev.created_at).toLocaleDateString()}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No reviews left for this kitchen yet.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Checkout bar */}
      {cartItems.length > 0 && (
        <View style={styles.cartFloatBar}>
          <View>
            <Text style={styles.cartBarCount}>{cartItems.length} item(s) in Cart</Text>
            <Text style={styles.cartBarTotal}>Total: ₹{cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)}</Text>
          </View>
          <TouchableOpacity
            style={styles.viewCartBtn}
            onPress={() => router.push('/cart' as any)}
          >
            <ShoppingCart size={18} color="#FFFFFF" />
            <Text style={styles.viewCartText}> View Cart</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  errorText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },
  emptyText: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginVertical: 20 },

  coverContainer: { height: 220, position: 'relative' },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  backBtn: { position: 'absolute', top: 40, left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },

  headerBlock: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  kitchenHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kitchenName: { fontSize: 22, fontWeight: '800', color: '#1F2937', flex: 1, marginRight: 10 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ratingText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginRight: 3 },
  cuisineText: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  descText: { fontSize: 13, color: '#4B5563', marginTop: 8, lineHeight: 18 },
  metaRow: { flexDirection: 'row', gap: 20, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },

  tabRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#059669' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  tabTextActive: { color: '#059669' },

  menuContainer: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937', marginBottom: 12 },
  boxCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  boxMain: { flexDirection: 'row', justifyContent: 'space-between' },
  boxDetails: { flex: 1, marginRight: 12 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  vegTag: { width: 14, height: 14, borderWidth: 1, padding: 2, justifyContent: 'center', alignItems: 'center' },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  jainPill: { backgroundColor: '#FFF7ED', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  jainPillText: { fontSize: 9, color: '#EA580C', fontWeight: '800' },
  boxName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  boxDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 4, lineHeight: 16 },
  priceBlock: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  sellPrice: { fontSize: 15, fontWeight: '800', color: '#059669' },
  mrpPrice: { fontSize: 12, color: '#9CA3AF', textDecorationLine: 'line-through' },
  boxImg: { width: 80, height: 80, borderRadius: 12 },
  includesBlock: { backgroundColor: '#FAFAFA', borderRadius: 10, padding: 8, marginTop: 10 },
  includesTitle: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' },
  includesItems: { fontSize: 11, color: '#4B5563', marginTop: 2 },
  addBtn: { backgroundColor: '#065F46', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  planCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  planName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  planDesc: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
  planMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 6, fontWeight: '600' },
  planFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  planPrice: { fontSize: 16, fontWeight: '800', color: '#EA580C' },
  subscribeBtn: { backgroundColor: '#EA580C', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  subscribeBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  reviewCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewUser: { fontSize: 13, fontWeight: '700', color: '#374151' },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewText: { fontSize: 12, color: '#4B5563', lineHeight: 16 },
  reviewDate: { fontSize: 10, color: '#9CA3AF', marginTop: 6 },

  cartFloatBar: { position: 'absolute', bottom: 20, left: 16, right: 16, height: 60, borderRadius: 14, backgroundColor: '#065F46', paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 },
  cartBarCount: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', opacity: 0.8 },
  cartBarTotal: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  viewCartBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  viewCartText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
