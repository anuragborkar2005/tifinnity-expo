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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MapPin, Search, Mic, SlidersHorizontal, Star, Heart, Clock,
  ShoppingCart, Home, Compass, ClipboardList, User,
  ChevronDown, HeartHandshake, Bell, Settings, Gift, CreditCard,
  HelpCircle, LogOut, ChevronRight, Package, TrendingUp,
  ChefHat, Utensils, Leaf,
} from 'lucide-react-native';

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

function HomeContent() {
  return (
    <>
      <View style={styles.heroWrapper}>
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
        <View style={styles.searchBar}>
          <Search size={18} color="#9CA3AF" />
          <TextInput placeholder="Search for meals, cuisines or kitchens" placeholderTextColor="#9CA3AF" style={styles.searchInput} />
          <Mic size={18} color="#9CA3AF" />
        </View>
      </View>

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>What's on your mind?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map((item) => (
            <View key={item.id} style={styles.categoryItem}>
              <View style={styles.categoryCircle}>
                <Image source={{ uri: item.image }} style={styles.categoryImage} />
              </View>
              <Text style={styles.categoryText}>{item.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.promoBanner}>
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
      </View>

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
              <TouchableOpacity style={styles.limitedOrderButton}>
                <Text style={styles.limitedOrderText}>Order Now</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Popular Kitchens Near You</Text>
          <TouchableOpacity style={styles.filterButton}>
            <SlidersHorizontal size={14} color="#FFFFFF" />
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>
        {POPULAR_KITCHENS.map((kitchen) => (
          <View key={kitchen.id} style={styles.kitchenCard}>
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
                <TouchableOpacity key={idx} style={styles.quickAddButton}>
                  <Text style={styles.quickAddButtonText}>+ {add.name} {add.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Recommended for You</Text>
          <TouchableOpacity><Text style={styles.viewMapText}>View Map</Text></TouchableOpacity>
        </View>
        {RECOMMENDED.map((item) => (
          <View key={item.id} style={styles.recCard}>
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
                <TouchableOpacity><Heart size={18} color="#D1D5DB" /></TouchableOpacity>
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
        ))}
      </View>
    </>
  );
}

function ExploreContent() {
  const exploreCategories = [
    { id: '1', name: 'Maharashtrian', icon: ChefHat, color: '#EA580C', count: '24 kitchens' },
    { id: '2', name: 'North Indian', icon: Utensils, color: '#059669', count: '18 kitchens' },
    { id: '3', name: 'South Indian', icon: Leaf, color: '#DC2626', count: '15 kitchens' },
    { id: '4', name: 'Punjabi', icon: ChefHat, color: '#D97706', count: '12 kitchens' },
    { id: '5', name: 'Gujarati', icon: Utensils, color: '#7C3AED', count: '9 kitchens' },
    { id: '6', name: 'Healthy', icon: Leaf, color: '#0891B2', count: '21 kitchens' },
  ];

  const trending = [
    { id: '1', name: 'Puran Poli', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&q=80', orders: '1.2k' },
    { id: '2', name: 'Misal Pav', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&q=80', orders: '980' },
    { id: '3', name: 'Vada Pav', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200&q=80', orders: '2.1k' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.exploreHeader}>Discover Cuisines</Text>
      <Text style={styles.exploreSub}>Explore home kitchens near you</Text>

      <View style={styles.exploreGrid}>
        {exploreCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <TouchableOpacity key={cat.id} style={styles.exploreCard}>
              <View style={[styles.exploreIconWrap, { backgroundColor: cat.color + '15' }]}>
                <Icon size={26} color={cat.color} />
              </View>
              <Text style={styles.exploreCardName}>{cat.name}</Text>
              <Text style={styles.exploreCardCount}>{cat.count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Trending Near You</Text>
          <TrendingUp size={18} color="#059669" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 0 }}>
          {trending.map((item) => (
            <View key={item.id} style={styles.trendingCard}>
              <Image source={{ uri: item.image }} style={styles.trendingImage} />
              <Text style={styles.trendingName}>{item.name}</Text>
              <Text style={styles.trendingOrders}>{item.orders} orders today</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeaderText}>Nearby Kitchens</Text>
        {POPULAR_KITCHENS.map((kitchen) => (
          <View key={kitchen.id} style={styles.kitchenCard}>
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
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function OrdersContent() {
  const activeOrders = ORDERS.filter(o => o.status === 'In Progress');
  const pastOrders = ORDERS.filter(o => o.status === 'Delivered');

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.exploreHeader}>My Orders</Text>
      <Text style={styles.exploreSub}>Track and manage your meals</Text>

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

function ProfileContent() {
  const menuItems = [
    { icon: User, label: 'My Profile', color: '#059669' },
    { icon: Bell, label: 'Notifications', color: '#D97706' },
    { icon: Gift, label: 'Offers & Coupons', color: '#DC2626' },
    { icon: CreditCard, label: 'Payment Methods', color: '#0891B2' },
    { icon: Settings, label: 'Settings', color: '#6B7280' },
    { icon: HelpCircle, label: 'Help & Support', color: '#7C3AED' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80' }}
          style={styles.profileAvatar}
        />
        <Text style={styles.profileName}>Priya Sharma</Text>
        <Text style={styles.profileEmail}>priya.sharma@email.com</Text>
        <Text style={styles.profilePhone}>+91 98765 43210</Text>
      </View>

      <View style={styles.profileStatsRow}>
        <View style={styles.profileStat}>
          <Text style={styles.profileStatNum}>24</Text>
          <Text style={styles.profileStatLabel}>Orders</Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStat}>
          <Text style={styles.profileStatNum}>5</Text>
          <Text style={styles.profileStatLabel}>Favorites</Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStat}>
          <Text style={styles.profileStatNum}>₹2.4k</Text>
          <Text style={styles.profileStatLabel}>Saved</Text>
        </View>
      </View>

      <View style={styles.profileMenu}>
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity key={idx} style={styles.profileMenuItem}>
              <View style={[styles.profileMenuIcon, { backgroundColor: item.color + '12' }]}>
                <Icon size={20} color={item.color} />
              </View>
              <Text style={styles.profileMenuLabel}>{item.label}</Text>
              <ChevronRight size={18} color="#D1D5DB" />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <LogOut size={18} color="#DC2626" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function GharKaKhanaScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

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
              <View style={styles.locationRow}>
                <MapPin size={20} color="#22C55E" />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.homeLabel}>Home</Text>
                  <View style={styles.addressRow}>
                    <Text style={styles.addressText}>Himgna, Nagpur, Maharashtra, India</Text>
                    <ChevronDown size={14} color="#6B7280" />
                  </View>
                </View>
              </View>
              <View style={styles.avatar}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' }} style={styles.avatarImage} />
              </View>
            </View>
            <HomeContent />
          </ScrollView>
        )}

        {activeTab === 'explore' && <ExploreContent />}
        {activeTab === 'orders' && <OrdersContent />}
        {activeTab === 'profile' && <ProfileContent />}

        {activeTab === 'home' && (
          <TouchableOpacity style={styles.floatingCart}>
            <ShoppingCart size={24} color="#FFFFFF" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>2</Text>
            </View>
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

  exploreHeader: { fontSize: 22, fontWeight: '800', color: '#1F2937', paddingHorizontal: 16, paddingTop: 12 },
  exploreSub: { fontSize: 13, color: '#6B7280', paddingHorizontal: 16, marginTop: 2, marginBottom: 8 },
  exploreGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 8 },
  exploreCard: { width: (SCREEN_WIDTH - 56) / 3, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginHorizontal: 4, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  exploreIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  exploreCardName: { fontSize: 12, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
  exploreCardCount: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  trendingCard: { width: 140, marginRight: 12, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  trendingImage: { width: '100%', height: 100, resizeMode: 'cover' },
  trendingName: { fontSize: 13, fontWeight: '700', color: '#1F2937', paddingHorizontal: 10, paddingTop: 8 },
  trendingOrders: { fontSize: 10, color: '#9CA3AF', paddingHorizontal: 10, paddingBottom: 10, marginTop: 2 },

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

  profileHeader: { alignItems: 'center', paddingVertical: 20 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#059669' },
  profileName: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginTop: 12 },
  profileEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  profilePhone: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },

  profileStatsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  profileStat: { flex: 1, alignItems: 'center' },
  profileStatNum: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  profileStatLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  profileStatDivider: { width: 1, height: 30, backgroundColor: '#E5E7EB' },

  profileMenu: { marginHorizontal: 16, marginTop: 20, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  profileMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  profileMenuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  profileMenuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937', marginLeft: 12 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 20, marginBottom: 30, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#FCA5A5' },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#DC2626', marginLeft: 8 },
});
