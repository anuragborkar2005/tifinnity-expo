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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MapPin, Search, Mic, SlidersHorizontal, Star, Heart, Clock,
  ShoppingCart, Home, Compass, ClipboardList, User,
  ChevronDown, HeartHandshake, Bell, Settings, Gift, CreditCard,
  HelpCircle, LogOut, ChevronRight, Package, TrendingUp,
  ChefHat, Utensils, Leaf, ArrowLeft, Repeat,
  Mail, Smartphone, Pencil, ShoppingBag, Calendar, Wallet, FileText, X,
} from 'lucide-react-native';

import { router } from 'expo-router';
import SubscriptionTracker from '@/components/subscription-tracker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', name: 'Thali', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100&q=80' },
  { id: '2', name: 'Curry', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=100&q=80' },
  { id: '3', name: 'Rotis', image: 'https://images.unsplash.com/photo-1589119908995-c6837f14842b?w=100&q=80' },
  { id: '4', name: 'Samosas', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=100&q=80' },
  { id: '5', name: 'Salad', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&q=80' },
];

const LIMITED_OFFERS = [
  { id: '1', title: "Up to 40% OFF\nOn your first 5\nhome-cooked meals", image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80' },
  { id: '2', title: "Up to 40% OFF\nOn your first 5\nhome-cooked meals", image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80' },
];

const POPULAR_KITCHENS = [
  {
    id: '1', name: 'Aai Chi Mess', cuisine: 'Maharashtrian • North Indian',
    time: '30-40 min', price: '₹60 per meal', rating: 4.7,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=150&q=80',
    quickAdds: [{ name: 'Dal Tadka', price: '₹40' }, { name: 'Jeera Rice', price: '₹40' }],
  },
  {
    id: '2', name: 'Savitri Home Mess', cuisine: 'Maharashtrian • Homemade',
    time: '25-35 min', price: '₹50 per meal', rating: 4.4,
    image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=150&q=80',
    quickAdds: [{ name: 'Mix Veg', price: '₹50' }, { name: 'Jeera Rice', price: '₹35' }],
  },
];

const RECOMMENDED = [
  {
    id: '1', name: "Dadi's Desi Rasoi", cuisine: 'Rajasthani & Punjabi',
    time: '30-40 min', distance: '2.4 km', rating: 4.8,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80',
  },
  {
    id: '2', name: 'The Healthy Spoon', cuisine: 'South Indian & Continental',
    time: '20-30 min', distance: '1.8 km', rating: 4.6,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
  },
];

const ORDERS = [
  { id: '1', kitchen: 'Aai Chi Mess', items: 'Dal Tadka, Jeera Rice, Roti', total: '₹180', status: 'Delivered', date: 'Today, 1:30 PM', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&q=80' },
  { id: '2', kitchen: 'Savitri Home Mess', items: 'Mix Veg, Jeera Rice, Salad', total: '₹320', status: 'In Progress', date: 'Today, 7:15 PM', image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=100&q=80' },
  { id: '3', kitchen: "Dadi's Desi Rasoi", items: 'Dal Makhani, Naan, Raita', total: '₹250', status: 'Delivered', date: 'Yesterday, 8:00 PM', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=100&q=80' },
];

type Tab = 'home' | 'explore' | 'orders' | 'profile';
type SubView = 'subscription' | null;

function HomeContent({ onSearchPress, searchQuery: externalSearch, onSearchChange, onCategorySelect, selectedCategory, onCartAdd }: {
  onSearchPress?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onCategorySelect?: (cat: string | null) => void;
  selectedCategory?: string | null;
  onCartAdd?: (item: { name: string; price: number }) => void;
}) {
  const [localSearch, setLocalSearch] = useState('');
  const [isFavorite, setIsFavorite] = useState<Record<string, boolean>>({});
  const [cartQtys, setCartQtys] = useState<Record<string, number>>({});
  const searchQuery = externalSearch ?? localSearch;

  const handleSearchChange = (q: string) => {
    setLocalSearch(q);
    onSearchChange?.(q);
  };

  const toggleFavorite = (id: string) => {
    setIsFavorite(prev => ({ ...prev, [id]: !prev[id] }));
    console.log(`[Home] Favorite toggled for ${id}`);
  };

  const addToCart = (name: string, price: string) => {
    const numericPrice = parseInt(price.replace('₹', ''));
    const key = `${name}-${price}`;
    setCartQtys(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    onCartAdd?.({ name, price: numericPrice });
    console.log(`[Home] Added to cart: ${name} ${price}`);
  };

  const filteredKitchens = selectedCategory
    ? POPULAR_KITCHENS.filter(k => k.cuisine.toLowerCase().includes(selectedCategory.toLowerCase()))
    : POPULAR_KITCHENS;

  return (
    <>
      <View style={styles.heroWrapper}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            handleSearchChange('Ghar Ka Khana Special Thali');
            console.log('[Home] Hero pressed - search set to "Ghar Ka Khana Special Thali"');
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
        <TouchableOpacity activeOpacity={1} onPress={onSearchPress} style={styles.searchBar}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search for meals, cuisines or kitchens"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearchChange}
            editable={!onSearchPress}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => { Alert.alert('Voice Search', '🎤 Listening...'); console.log('[Home] Mic pressed'); }}
          >
            <Mic size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>What's on your mind?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map((item) => {
            const isSelected = selectedCategory === item.name;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                style={styles.categoryItem}
                onPress={() => {
                  const newCat = isSelected ? null : item.name;
                  onCategorySelect?.(newCat);
                  console.log(`[Home] Category selected: ${newCat}`);
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

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.promoBanner}
        onPress={() => {
          handleSearchChange('Ghar Ka Khana Special Thali');
          console.log('[Home] Offer banner pressed');
        }}
      >
        <View style={styles.promoContent}>
          <Text style={styles.offerBadge}>OFFER OF THE DAY</Text>
          <Text style={styles.offerTitle}>50% Off on First Order!</Text>
          <Text style={styles.offerSubtitle}>Use Code: WELCOME50. Order Now.</Text>
        </View>
        <View style={styles.promoTagContainer}>
          <View style={styles.promoTags}>
            <View style={styles.priceTagStub} />
            <View style={styles.priceTagCircle} />
            <View style={styles.priceTagBody} />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.limitedOffersSection}>
        <View style={styles.limitedBadge}>
          <Text style={styles.limitedBadgeText}>LIMITED OFFERS</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.limitedScroll}>
          {LIMITED_OFFERS.map((offer) => (
            <View key={offer.id} style={styles.limitedCard}>
              <Image source={{ uri: offer.image }} style={styles.limitedCardImage} />
              <View style={styles.limitedCardOverlay} />
              <Text style={styles.limitedCardTitle}>{offer.title}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.limitedOrderButton}
                onPress={() => {
                  Alert.alert('Limited Offer', `You selected: ${offer.title}`);
                  console.log('[Home] Limited offer pressed:', offer.id);
                }}
              >
                <Text style={styles.limitedOrderText}>Order Now</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Popular Kitchens Near You</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.filterButton}
            onPress={() => {
              Alert.alert('Filters', 'Filter options coming soon!');
              console.log('[Home] Filters pressed');
            }}
          >
            <SlidersHorizontal size={14} color="#FFFFFF" />
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>
        {filteredKitchens.map((kitchen) => (
          <TouchableOpacity key={kitchen.id} activeOpacity={0.7} onPress={() => router.push('/mess-detail')}>
            <View style={styles.kitchenCard}>
              <View style={styles.kitchenRow}>
                <Image source={{ uri: kitchen.image }} style={styles.kitchenImage} />
                <View style={styles.kitchenInfo}>
                  <Text style={styles.kitchenName}>{kitchen.name}</Text>
                  <Text style={styles.kitchenCuisine}>{kitchen.cuisine}</Text>
                  <Text style={styles.kitchenMeta}>{kitchen.time} • {kitchen.price}</Text>
                </View>
                <View style={styles.kitchenRatingBadge}>
                  <Text style={styles.kitchenRatingText}>{kitchen.rating}</Text>
                  <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </View>
              <View style={styles.quickAddSection}>
                <Text style={styles.quickAddLabel}>Quick Add</Text>
                {kitchen.quickAdds.map((add, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    style={styles.quickAddButton}
                    onPress={() => addToCart(add.name, add.price)}
                  >
                    <Text style={styles.quickAddButtonText}>+ {add.name} {add.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Recommended for You</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => console.log('[Home] View Map pressed')}>
            <Text style={styles.viewMapText}>View Map</Text>
          </TouchableOpacity>
        </View>
        {RECOMMENDED.map((item) => (
          <TouchableOpacity key={item.id} activeOpacity={0.7} onPress={() => router.push('/mess-detail')}>
            <View style={styles.recCard}>
              <View style={styles.recImageContainer}>
                <Image source={{ uri: item.image }} style={styles.recImage} />
                <View style={styles.recRatingPill}>
                  <Star size={10} color="#EF4444" fill="#EF4444" />
                  <Text style={styles.recRatingText}> {item.rating}</Text>
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
                    <Text style={styles.recMetaText}> {item.time}</Text>
                  </View>
                  <View style={styles.recMetaItem}>
                    <MapPin size={14} color="#6B7280" />
                    <Text style={styles.recMetaText}> {item.distance}</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

function ExploreContent() {
  const TRENDING_TAGS = ['Homemade Paneer', 'Diet Tiffin', 'South Indian Thali', 'Dal Baati'];

  const POPULAR_CATEGORIES = [
    {
      id: 'thalis',
      name: 'Full Thalis',
      subtitle: 'Complete festive meals',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
    },
    { id: 'healthy', name: 'Healthy', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80' },
    { id: 'snacks', name: 'Snacks', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80' },
    { id: 'sweets', name: 'Sweets', image: 'https://images.unsplash.com/photo-1589119908995-c6837f14842b?w=300&q=80' },
    { id: 'rice', name: 'Rice', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300&q=80' },
  ];

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

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Header Logo Bar */}
      <View style={styles.exploreHeaderBar}>
        <TouchableOpacity style={styles.exploreBackButton}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.exploreHeaderTitle}>Prajwal's App</Text>
        <View style={styles.exploreStatusIcon}>
          <View style={styles.exploreStatusDot} />
        </View>
      </View>

      {/* Filter Search Input Field */}
      <View style={styles.exploreSearchContainer}>
        <View style={styles.exploreSearchBar}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            style={styles.exploreSearchInput}
            placeholder="Search for home-cooked meals..."
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.exploreFilterToggle}>
            <SlidersHorizontal size={18} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Trending Searches Section */}
      <View style={styles.exploreTrendingSection}>
        <Text style={styles.exploreSectionLabel}>Trending Searches</Text>
        <View style={styles.exploreTagsRow}>
          {TRENDING_TAGS.map((tag, idx) => (
            <TouchableOpacity key={idx} style={styles.exploreTrendingTag}>
              <Text style={styles.exploreTrendingTagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Popular Categories Compound Grid */}
      <View style={styles.explorePopularSection}>
        <View style={styles.explorePopularHeader}>
          <View style={styles.explorePopularHeaderLeft}>
            <Text style={styles.exploreSectionTitle}>Popular Categories</Text>
            <Text style={styles.exploreSectionSubtitle}>Handpicked for your cravings</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.exploreViewAllText}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.exploreFullWidthBanner}>
          <Image source={{ uri: POPULAR_CATEGORIES[0].image }} style={styles.exploreFullWidthBannerImage} />
          <View style={styles.exploreBannerOverlay} />
          <View style={styles.exploreBannerTextBlock}>
            <Text style={styles.exploreBannerTitle}>{POPULAR_CATEGORIES[0].name}</Text>
            <Text style={styles.exploreBannerSubtitle}>{POPULAR_CATEGORIES[0].subtitle}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.exploreCategoryGrid}>
          {POPULAR_CATEGORIES.slice(1).map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.exploreCategoryGridCard}>
              <Image source={{ uri: cat.image }} style={styles.exploreCategoryGridImage} />
              <View style={styles.exploreCategoryGridOverlay} />
              <Text style={styles.exploreCategoryGridLabel}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Explore Top Kitchens Cards */}
      <View style={styles.exploreKitchensSection}>
        <Text style={styles.exploreSectionTitle}>Explore Top Kitchens</Text>
        {TOP_KITCHENS.map((kitchen) => (
          <TouchableOpacity key={kitchen.id} activeOpacity={0.7} onPress={() => router.push('/mess-detail')}>
            <View style={styles.exploreKitchenCard}>
              <View style={styles.exploreKitchenCardImageContainer}>
                <Image source={{ uri: kitchen.image }} style={styles.exploreKitchenCardImage} />
                <View style={styles.exploreKitchenRatingPill}>
                  <Star size={11} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.exploreKitchenRatingText}> {kitchen.rating}</Text>
                </View>
              </View>
              <View style={styles.exploreKitchenCardBody}>
                <View style={styles.exploreKitchenCardTopRow}>
                  <Text style={styles.exploreKitchenCardName}>{kitchen.name}</Text>
                  <TouchableOpacity><Heart size={18} color="#D1D5DB" /></TouchableOpacity>
                </View>
                <Text style={styles.exploreKitchenCardCuisine}>{kitchen.cuisine} • {kitchen.distance} away</Text>
                <View style={styles.exploreBadgesRow}>
                  {kitchen.badges.map((badge, idx) => (
                    <View key={idx} style={styles.exploreBadge}>
                      <Text style={styles.exploreBadgeText}>{badge}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.exploreCardDivider} />
                <View style={styles.exploreKitchenCardFooter}>
                  <View style={styles.exploreFamousForBlock}>
                    <Text style={styles.exploreFamousForLabel}>Famous for</Text>
                    <Text style={styles.exploreFamousForValue}>{kitchen.famousFor}</Text>
                  </View>
                  <TouchableOpacity style={styles.exploreQuickAddButton}>
                    <Text style={styles.exploreQuickAddText}>+ Quick Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reorder Your Last Meal Banner */}
      <View style={styles.exploreReorderSection}>
        <View style={styles.exploreReorderCard}>
          <Text style={styles.exploreReorderTitle}>Reorder your last meal</Text>
          <View style={styles.exploreReorderRow}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&q=80' }} style={styles.exploreReorderImage} />
            <View style={styles.exploreReorderInfo}>
              <Text style={styles.exploreReorderKitchenName}>Aai Chi Mess</Text>
              <Text style={styles.exploreReorderItemName}>Thali</Text>
              <View style={styles.exploreReorderMeta}>
                <Clock size={12} color="#6B7280" />
                <Text style={styles.exploreReorderMetaText}> 30-40 min</Text>
                <MapPin size={12} color="#6B7280" />
                <Text style={styles.exploreReorderMetaText}> 1.3 km</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.exploreRepeatButton}>
              <Repeat size={16} color="#FFFFFF" />
              <Text style={styles.exploreRepeatButtonText}> Repeat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function OrdersContent() {
  const activeOrders = ORDERS.filter(o => o.status === 'In Progress');
  const pastOrders = ORDERS.filter(o => o.status === 'Delivered');

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#1F2937', paddingHorizontal: 16, paddingTop: 12 }}>My Orders</Text>
      <Text style={{ fontSize: 13, color: '#6B7280', paddingHorizontal: 16, marginTop: 2, marginBottom: 8 }}>Track and manage your meals</Text>

      {activeOrders.length > 0 && (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Active Orders</Text>
            <View style={styles.activeDot} />
          </View>
          {activeOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderCardTop}>
                <Image source={{ uri: order.image }} style={styles.orderImage} />
                <View style={styles.orderInfo}>
                  <Text style={styles.orderKitchen}>{order.kitchen}</Text>
                  <Text style={styles.orderItems}>{order.items}</Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
              </View>
              <View style={styles.orderBottom}>
                <Text style={styles.orderTotal}>{order.total}</Text>
                <View style={styles.orderStatusBadge}>
                  <Package size={12} color="#FFFFFF" />
                  <Text style={styles.orderStatusText}>{order.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Past Orders</Text>
          <Text style={styles.viewMapText}>View All</Text>
        </View>
        {pastOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderCardTop}>
              <Image source={{ uri: order.image }} style={styles.orderImage} />
              <View style={styles.orderInfo}>
                <Text style={styles.orderKitchen}>{order.kitchen}</Text>
                <Text style={styles.orderItems}>{order.items}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
            </View>
            <View style={styles.orderBottom}>
              <Text style={styles.orderTotal}>{order.total}</Text>
              <Text style={styles.orderDelivered}>{order.status}</Text>
            </View>
            <TouchableOpacity style={styles.reorderButton}>
              <Text style={styles.reorderText}>Reorder</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function ProfileContent({ onNavigate }: { onNavigate?: (view: SubView) => void }) {
  const [name, setName] = useState('Prajwal Belekar');
  const [email, setEmail] = useState('example@gamil.com');
  const [phone, setPhone] = useState('+91 1234567890');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editPhone, setEditPhone] = useState(phone);
  const [pressedItem, setPressedItem] = useState<string | null>(null);

  const FEATURE_GRID = [
    { id: 'orders', icon: ShoppingBag, title: 'My Orders', subtitle: '12 Recent', iconBg: '#ECFDF5', iconColor: '#065F46' },
    { id: 'subscriptions', icon: Calendar, title: 'Subscriptions', subtitle: 'Daily Tiffin', iconBg: '#FFF7ED', iconColor: '#9A3412' },
    { id: 'saved', icon: Heart, title: 'Saved Kitchens', subtitle: '8 Favorites', iconBg: '#FEF2F2', iconColor: '#DC2626' },
    { id: 'wallet', icon: Wallet, title: 'Wallet', subtitle: '₹450.00', iconBg: '#ECFDF5', iconColor: '#065F46' },
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

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {isEditing && (
        <View style={styles.editSheet}>
          <View style={styles.editSheetHeader}>
            <Text style={styles.editSheetTitle}>Edit Profile</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => { console.log('[Profile] Edit cancelled'); setIsEditing(false); }}>
              <X size={20} color="#374151" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.editInput}
            value={editName}
            onChangeText={setEditName}
            placeholder="Name"
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
            onPress={() => {
              console.log('[Profile] Saved:', { name: editName, email: editEmail, phone: editPhone });
              setName(editName);
              setEmail(editEmail);
              setPhone(editPhone);
              setIsEditing(false);
            }}
          >
            <Text style={styles.editSaveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Header Bar */}
      <View style={styles.profileHeaderBar}>
        <View style={styles.profileHeaderLeft}>
          <MapPin size={18} color="#065F46" />
          <Text style={styles.profileHeaderTitle}>Prajwal's App</Text>
        </View>
        <Bell size={22} color="#374151" />
      </View>

      {/* User Profile Hero Card */}
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
        <Text style={styles.profileName}>{name}</Text>
        <View style={styles.profileContactRow}>
          <Mail size={14} color="#9CA3AF" />
          <Text style={styles.profileContactText}> {email}</Text>
        </View>
        <View style={styles.profileContactRow}>
          <Smartphone size={14} color="#9CA3AF" />
          <Text style={styles.profileContactText}> {phone}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.editButton}
          onPress={() => {
            console.log('[Profile] Opening edit sheet');
            setEditName(name);
            setEditEmail(email);
            setEditPhone(phone);
            setIsEditing(true);
          }}
        >
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
                console.log(`[Profile] Feature pressed: ${item.id}`);
                if (item.id === 'subscriptions') {
                  onNavigate?.('subscription');
                } else if (item.id === 'orders') {
                  Alert.alert('My Orders', 'Opening order history...');
                } else if (item.id === 'saved') {
                  Alert.alert('Saved Kitchens', 'Showing favorites...');
                } else if (item.id === 'wallet') {
                  Alert.alert('Wallet', 'Balance: ₹450.00');
                }
              }}
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
              onPress={() => {
                console.log(`[Profile] Menu: ${item.id}`);
                setPressedItem(item.id);
                setTimeout(() => setPressedItem(null), 200);
              }}
            >
              <View style={[styles.menuItemLeft, { backgroundColor: pressedItem === item.id ? '#F3F4F6' : 'transparent', borderRadius: 8, padding: 4 }]}>
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
              onPress={() => {
                console.log(`[Profile] Support: ${item.id}`);
                setPressedItem(item.id);
                setTimeout(() => setPressedItem(null), 200);
              }}
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
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => console.log('[Profile] User logged out') },
              ]
            );
          }}
        >
          <View style={styles.menuItemLeft}>
            <LogOut size={18} color="#DC2626" />
            <Text style={styles.menuLogoutLabel}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default function GharKaKhanaScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [subView, setSubView] = useState<SubView>(null);
  const [cartItems, setCartItems] = useState<{ name: string; qty: number; price: number }[]>([]);

  if (subView === 'subscription') {
    return <SubscriptionTracker
      onBack={() => { console.log('[App] Back from subscription'); setSubView(null); }}
      onAddToCart={(items) => {
        console.log('[App] Adding to cart:', items);
        setCartItems(prev => [...prev, ...items]);
      }}
    />;
  }

  const tabs: { key: Tab; icon: any; label: string }[] = [
    { key: 'home', icon: Home, label: 'Home' },
    { key: 'explore', icon: Compass, label: 'Explore' },
    { key: 'orders', icon: ClipboardList, label: 'Orders' },
    { key: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {activeTab === 'home' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.locationRow}
                onPress={() => {
                  Alert.alert('Change Address', 'Address selection coming soon!');
                  console.log('[Home] Location pressed');
                }}
              >
                <MapPin size={20} color="#22C55E" />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.homeLabel}>Home</Text>
                  <View style={styles.addressRow}>
                    <Text style={styles.addressText}>Himgna, Nagpur, Maharashtra, India</Text>
                    <ChevronDown size={14} color="#6B7280" />
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.avatar}
                onPress={() => { console.log('[Home] Avatar pressed - navigate to profile'); setActiveTab('profile'); }}
              >
                <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' }} style={styles.avatarImage} />
              </TouchableOpacity>
            </View>
            <HomeContent
              onCategorySelect={(cat) => console.log('[App] Category filter:', cat)}
              onCartAdd={(item) => setCartItems(prev => [...prev, { ...item, qty: 1 }])}
            />
          </ScrollView>
        )}

        {activeTab === 'explore' && <ExploreContent />}
        {activeTab === 'orders' && <OrdersContent />}
        {activeTab === 'profile' && <ProfileContent onNavigate={(view) => { console.log(`[App] Navigate to ${view}`); setSubView(view); }} />}

        {activeTab === 'home' && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.floatingCart, cartItems.length === 0 && { opacity: 0, width: 0, height: 0 }]}
            onPress={() => {
              Alert.alert('Cart', `You have ${cartItems.length} item(s) in your cart`);
              console.log('[Home] Cart FAB pressed, items:', cartItems);
            }}
          >
            <ShoppingCart size={24} color="#FFFFFF" />
            {cartItems.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.bottomNav}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.navTab}
                onPress={() => setActiveTab(tab.key)}
              >
                {isActive ? (
                  <View style={styles.navTabActive}>
                    <Icon size={18} color="#FFFFFF" />
                    <Text style={styles.navTabActiveText}>{tab.label}</Text>
                  </View>
                ) : (
                  <>
                    <Icon size={22} color="#9CA3AF" />
                    <Text style={styles.navTabText}>{tab.label}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingBottom: 120 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, backgroundColor: '#F8F9FA',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationTextContainer: { marginLeft: 8 },
  homeLabel: { fontWeight: '700', color: '#1F2937', fontSize: 15 },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  addressText: { color: '#6B7280', fontSize: 11 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E5E7EB', overflow: 'hidden', borderWidth: 1.5, borderColor: '#E5E7EB' },
  avatarImage: { width: '100%', height: '100%' },

  heroWrapper: { marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  heroBanner: { borderRadius: 20, backgroundColor: '#FEF3C7', padding: 12, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#FDE68A' },
  heroImageContainer: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', borderWidth: 3, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  heroFoodImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroTextContainer: { flex: 1, marginLeft: 12 },
  gharKaLine1: { color: '#065F46', fontWeight: '800', fontSize: 22, letterSpacing: 0.5 },
  khanaRow: { flexDirection: 'row', alignItems: 'center' },
  khanaText: { color: '#DC2626', fontWeight: '900', fontSize: 34, letterSpacing: 0.5 },
  taglineText: { color: '#4B5563', fontSize: 11, fontWeight: '500', marginTop: 2 },

  searchBar: { marginTop: -22, marginHorizontal: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 6, zIndex: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13, color: '#374151' },

  categoriesSection: { marginTop: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', paddingHorizontal: 16, marginBottom: 12 },
  categoriesScroll: { paddingHorizontal: 16 },
  categoryItem: { alignItems: 'center', marginRight: 18 },
  categoryCircle: { width: 62, height: 62, borderRadius: 31, overflow: 'hidden', borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, marginBottom: 6, backgroundColor: '#F3F4F6' },
  categoryCircleSelected: { borderWidth: 3, borderColor: '#065F46' },
  categoryImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  categoryText: { fontSize: 11, color: '#4B5563', fontWeight: '600' },

  promoBanner: { marginHorizontal: 16, marginTop: 12, marginBottom: 8, borderRadius: 18, backgroundColor: '#EA580C', padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  promoContent: { flex: 1 },
  offerBadge: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, backgroundColor: 'rgba(0,0,0,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start', overflow: 'hidden' },
  offerTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 22, marginTop: 6 },
  offerSubtitle: { color: '#FFFFFF', fontSize: 11, opacity: 0.9, marginTop: 3 },
  promoTagContainer: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  promoTags: { width: 44, height: 54, justifyContent: 'center', alignItems: 'center' },
  priceTagStub: { width: 28, height: 6, backgroundColor: '#F97316', borderTopLeftRadius: 4, borderTopRightRadius: 4, opacity: 0.6 },
  priceTagCircle: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#EA580C', borderWidth: 2, borderColor: '#F97316', marginVertical: 2 },
  priceTagBody: { width: 28, height: 24, backgroundColor: '#F97316', borderBottomLeftRadius: 6, borderBottomRightRadius: 6, opacity: 0.6 },

  limitedOffersSection: { marginTop: 12, marginBottom: 8 },
  limitedBadge: { backgroundColor: '#EA580C', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginLeft: 16, marginBottom: 10 },
  limitedBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  limitedScroll: { paddingHorizontal: 16 },
  limitedCard: { width: SCREEN_WIDTH * 0.72, height: 180, borderRadius: 16, overflow: 'hidden', marginRight: 12, position: 'relative' },
  limitedCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  limitedCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  limitedCardTitle: { position: 'absolute', bottom: 52, left: 14, color: '#FFFFFF', fontSize: 16, fontWeight: '800', lineHeight: 22 },
  limitedOrderButton: { position: 'absolute', bottom: 14, left: 14, backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  limitedOrderText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  sectionBlock: { marginTop: 16, marginHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionHeaderText: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  filterText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginLeft: 5 },

  kitchenCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  kitchenRow: { flexDirection: 'row', alignItems: 'center' },
  kitchenImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#E5E7EB', resizeMode: 'cover' },
  kitchenInfo: { flex: 1, marginLeft: 12 },
  kitchenName: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  kitchenCuisine: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  kitchenMeta: { fontSize: 11, color: '#6B7280', fontWeight: '500', marginTop: 3 },
  kitchenRatingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  kitchenRatingText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginRight: 3 },
  quickAddSection: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#E5E7EB', marginTop: 10, paddingTop: 10, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  quickAddLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginRight: 8 },
  quickAddButton: { borderWidth: 1, borderColor: '#059669', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginRight: 8, marginBottom: 2, backgroundColor: 'rgba(236, 253, 245, 0.5)' },
  quickAddButtonText: { color: '#059669', fontSize: 11, fontWeight: '600' },

  viewMapText: { color: '#059669', fontSize: 12, fontWeight: '700' },

  recCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  recImageContainer: { height: 180, position: 'relative' },
  recImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  recRatingPill: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
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

  floatingCart: { position: 'absolute', bottom: 76, right: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: '#065F46', justifyContent: 'center', alignItems: 'center', shadowColor: '#065F46', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8, zIndex: 50 },
  cartBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#F97316', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  cartBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#E5E7EB', height: 64, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 4 },
  navTab: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  navTabActive: { backgroundColor: '#059669', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  navTabActiveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  navTabText: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginTop: 4 },

  // Explore Screen Styles
  exploreHeaderBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
  },
  exploreBackButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  exploreHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  exploreStatusIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  exploreStatusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },

  exploreSearchContainer: { paddingHorizontal: 16, marginTop: 8, marginBottom: 4 },
  exploreSearchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 25, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4,
  },
  exploreSearchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#374151' },
  exploreFilterToggle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },

  exploreTrendingSection: { paddingHorizontal: 16, marginTop: 16 },
  exploreSectionLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  exploreTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exploreTrendingTag: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  exploreTrendingTagText: { fontSize: 13, fontWeight: '600', color: '#374151' },

  explorePopularSection: { paddingHorizontal: 16, marginTop: 20 },
  explorePopularHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  explorePopularHeaderLeft: { flex: 1 },
  exploreSectionTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  exploreSectionSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  exploreViewAllText: { fontSize: 12, fontWeight: '700', color: '#059669', marginTop: 4 },

  exploreFullWidthBanner: { width: '100%', height: 160, borderRadius: 16, overflow: 'hidden', position: 'relative', marginBottom: 10 },
  exploreFullWidthBannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  exploreBannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  exploreBannerTextBlock: { position: 'absolute', bottom: 16, left: 16 },
  exploreBannerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  exploreBannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },

  exploreCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  exploreCategoryGridCard: { width: (SCREEN_WIDTH - 42) / 2, height: 110, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  exploreCategoryGridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  exploreCategoryGridOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  exploreCategoryGridLabel: { position: 'absolute', bottom: 10, left: 12, color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

  exploreKitchensSection: { paddingHorizontal: 16, marginTop: 24 },
  exploreKitchenCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginTop: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  exploreKitchenCardImageContainer: { height: 160, position: 'relative' },
  exploreKitchenCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  exploreKitchenRatingPill: {
    position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, flexDirection: 'row', alignItems: 'center',
  },
  exploreKitchenRatingText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  exploreKitchenCardBody: { padding: 14 },
  exploreKitchenCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exploreKitchenCardName: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  exploreKitchenCardCuisine: { fontSize: 12, color: '#9CA3AF', marginTop: 3 },
  exploreBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  exploreBadge: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  exploreBadgeText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
  exploreCardDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  exploreKitchenCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exploreFamousForBlock: {},
  exploreFamousForLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  exploreFamousForValue: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginTop: 2 },
  exploreQuickAddButton: { borderWidth: 1.5, borderColor: '#059669', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  exploreQuickAddText: { color: '#059669', fontSize: 12, fontWeight: '700' },

  exploreReorderSection: { paddingHorizontal: 16, marginTop: 24, marginBottom: 16 },
  exploreReorderCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  exploreReorderTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  exploreReorderRow: { flexDirection: 'row', alignItems: 'center' },
  exploreReorderImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#E5E7EB', resizeMode: 'cover' },
  exploreReorderInfo: { flex: 1, marginLeft: 12 },
  exploreReorderKitchenName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  exploreReorderItemName: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  exploreReorderMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  exploreReorderMetaText: { fontSize: 11, color: '#6B7280', fontWeight: '500', marginRight: 6 },
  exploreRepeatButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B6623', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginLeft: 8 },
  exploreRepeatButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  orderCardTop: { flexDirection: 'row' },
  orderImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#E5E7EB', resizeMode: 'cover' },
  orderInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  orderKitchen: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  orderItems: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  orderDate: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#F3F4F6' },
  orderTotal: { fontSize: 15, fontWeight: '800', color: '#059669' },
  orderStatusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D97706', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  orderStatusText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', marginLeft: 4 },
  orderDelivered: { fontSize: 11, color: '#059669', fontWeight: '600' },
  reorderButton: { marginTop: 8, backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  reorderText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },

  // Profile Screen Styles
  profileHeaderBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  profileHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#065F46' },

  profileHeroCard: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 20,
    paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  profileAvatarContainer: { position: 'relative', marginBottom: 14 },
  profileAvatarImage: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#E5E7EB' },
  goldBadge: {
    position: 'absolute', bottom: -6, alignSelf: 'center',
    backgroundColor: '#FBBF24', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10,
  },
  goldBadgeText: { fontSize: 10, fontWeight: '800', color: '#1F2937', letterSpacing: 0.3 },
  profileName: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  profileContactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  profileContactText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  editButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#ECFDF5',
    justifyContent: 'center', alignItems: 'center', marginTop: 12,
    borderWidth: 1, borderColor: '#D1FAE5',
  },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, marginTop: 20 },
  featureCard: {
    width: (SCREEN_WIDTH - 44) / 2, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  featureIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  featureCardTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  featureCardSubtitle: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  referBanner: {
    marginHorizontal: 16, marginTop: 20, backgroundColor: '#8B4513', borderRadius: 16,
    padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#8B4513', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  referTextBlock: { flex: 1, marginRight: 12 },
  referTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  referAmount: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', marginTop: 2 },
  referDescription: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '500', marginTop: 4, lineHeight: 16 },
  referIconContainer: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },

  menuSectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, paddingHorizontal: 16, marginTop: 24, marginBottom: 10 },
  menuContainer: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  menuLogoutLabel: { fontSize: 14, fontWeight: '600', color: '#DC2626' },

  editSheet: {
    margin: 16, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  editSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  editSheetTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  editInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#374151', marginBottom: 10, backgroundColor: '#FAFAFA',
  },
  editSaveBtn: { backgroundColor: '#065F46', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  editSaveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
