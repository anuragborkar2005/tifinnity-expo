import { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Share2,
  Heart,
  Check,
  Star,
  Flame,
  ShoppingCart,
  Circle,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function Stars({ count, total = 5 }: { count: number; total?: number }) {
  const filled = Math.floor(count);
  const half = count - filled > 0;
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: total }, (_, i) => {
        if (i < filled) {
          return <Star key={i} size={14} color="#F97316" fill="#F97316" strokeWidth={0} />;
        }
        if (half && i === filled) {
          return (
            <View key={i} style={styles.starHalfWrap}>
              <Star size={14} color="#F97316" fill="none" strokeWidth={1.5} />
              <View style={styles.starHalfFill}>
                <Star size={14} color="#F97316" fill="#F97316" strokeWidth={0} />
              </View>
            </View>
          );
        }
        return <Star key={i} size={14} color="#F97316" fill="none" strokeWidth={1.5} />;
      })}
    </View>
  );
}

const SENTIMENT_TAGS = ['Tastes like home', 'Healthy & Fresh', 'Great Value'];

function ReviewCard({ rating, userName, initials }: { rating: number; userName: string; initials: string }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewMetricsRow}>
        <Text style={styles.reviewRatingNumber}>{rating}</Text>
        <View>
          <Stars count={rating} />
          <Text style={styles.reviewCount}>930+ Verified Reviews</Text>
        </View>
      </View>

      <Text style={styles.sentimentLabel}>Common Sentiment</Text>
      <View style={styles.sentimentRow}>
        {SENTIMENT_TAGS.map((tag) => (
          <View key={tag} style={styles.sentimentChip}>
            <Text style={styles.sentimentChipText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.reviewUserRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <Text style={styles.reviewUserName}>{userName}</Text>
      </View>

      <Text style={styles.reviewText}>
        "The Pithla Bhakri was absolutely authentic! Reminded me of my grandmother's cooking. Highly recommend for those missing home food."
      </Text>
    </View>
  );
}

export default function MessDetailScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* ========== HERO HEADER ========== */}
          <View style={styles.heroContainer}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80' }}
              style={styles.heroImage}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(255,255,255,1)']}
                locations={[0, 1]}
                style={styles.heroBottomFade}
              />

              {/* Top Row Floating Controls */}
              <View style={styles.topControls}>
                <TouchableOpacity activeOpacity={0.7} style={styles.iconButton} onPress={() => { console.log('[MD] Back'); router.back(); }}>
                  <ArrowLeft size={22} color="#333333" strokeWidth={2.2} />
                </TouchableOpacity>
                <View style={styles.topControlsRight}>
                  <TouchableOpacity activeOpacity={0.7} style={styles.iconButton} onPress={() => console.log('[MD] Share')}>
                    <Share2 size={20} color="#333333" strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} style={styles.iconButton} onPress={() => console.log('[MD] Favorite toggled')}>
                    <Heart size={20} color="#333333" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Brand Typography Stack */}
              <View style={styles.brandStack}>
                <View style={styles.badgeRow}>
                  <View style={styles.topRatedBadge}>
                    <Text style={styles.topRatedBadgeText}>TOP RATED</Text>
                  </View>
                  <View style={styles.hygieneBadge}>
                    <Star size={12} color="#DC2626" fill="#DC2626" strokeWidth={0} />
                    <Text style={styles.hygieneBadgeText}>4.9/5 Hygiene</Text>
                  </View>
                </View>
                <Text style={styles.messName}>AAi Chi Mess</Text>
                <Text style={styles.messTagline}>Authentic North Indian Home-style</Text>
                <Text style={styles.messTagline}>Meals</Text>
              </View>
            </ImageBackground>
          </View>

          {/* ========== FLOATING CHEF PROFILE CARD ========== */}
          <View style={styles.chefCard}>
            <View style={styles.chefRow}>
              <View style={styles.chefAvatarWrap}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80' }} style={styles.chefAvatar} resizeMode="cover" />
                <View style={styles.verifiedBadge}>
                  <Check size={10} color="white" strokeWidth={3} />
                </View>
              </View>
              <View style={styles.chefInfo}>
                <Text style={styles.chefName}>Sunita Tai</Text>
                <Text style={styles.chefExp}>25+ years of experience</Text>
              </View>
            </View>
            <Text style={styles.chefQuote}>We cook everyday meals with love and care just like for our family.</Text>
          </View>

          {/* ========== SEGMENTED TAB BAR ========== */}
          <View style={styles.tabBar}>
            <TouchableOpacity activeOpacity={0.7} style={styles.tabLeft} onPress={() => setActiveTab('menu')}>
              <Text style={activeTab === 'menu' ? styles.tabTextActive : styles.tabTextInactive}>Menu</Text>
              {activeTab === 'menu' && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={styles.tabRight} onPress={() => setActiveTab('reviews')}>
              <Text style={activeTab === 'reviews' ? styles.tabTextActive : styles.tabTextInactive}>Reviews (124)</Text>
              {activeTab === 'reviews' && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          </View>

          {/* ========== MENU VIEW ========== */}
          {activeTab === 'menu' && (
            <>
              {/* Specials Section */}
              <View style={styles.specialsSection}>
                <Text style={styles.sectionTitle}>Specials</Text>

                {/* Menu Card Item 1 */}
                <View style={styles.menuCard}>
                  <View style={styles.menuCardImageWrap}>
                    <Image source={{ uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=150&q=80' }} style={styles.menuCardImage} resizeMode="cover" />
                    <View style={styles.vegIndicator}>
                      <Circle size={14} color="#0F6A33" fill="#0F6A33" />
                    </View>
                  </View>
                  <View style={styles.menuCardBody}>
                    <View>
                      <Text style={styles.menuCardTitle}>Paneer Butter Masala Thali</Text>
                      <Text style={styles.menuCardDesc} numberOfLines={2}>4 Phulkas, Paneer Gravy, Jeera Rice, Dal Tadka, and...</Text>
                    </View>
                    <View style={styles.menuCardFooter}>
                      <View style={styles.calorieRow}>
                        <Flame size={13} color="#EF4444" fill="#EF4444" />
                        <Text style={styles.calorieText}>650 kcal</Text>
                      </View>
                      <TouchableOpacity activeOpacity={0.7} style={styles.addButton} onPress={() => console.log('[MD] Add: Paneer Butter Masala Thali')}>
                        <Text style={styles.addButtonText}>ADD</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.menuCardPrice}>₹249</Text>
                </View>

                {/* Menu Card Item 2 */}
                <View style={styles.menuCard}>
                  <View style={styles.menuCardImageWrap}>
                    <Image source={{ uri: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=150&q=80' }} style={styles.menuCardImage} resizeMode="cover" />
                    <View style={styles.vegIndicator}>
                      <Circle size={14} color="#0F6A33" fill="#0F6A33" />
                    </View>
                  </View>
                  <View style={styles.menuCardBody}>
                    <View>
                      <Text style={styles.menuCardTitle}>Homestyle Dal Fry Combo</Text>
                      <Text style={styles.menuCardDesc} numberOfLines={2}>Arhar Dal with Ghee Tadka, Steamed Rice, Aloo Bhujia,...</Text>
                    </View>
                    <View style={styles.menuCardFooter}>
                      <View style={styles.calorieRow}>
                        <Flame size={13} color="#EF4444" fill="#EF4444" />
                        <Text style={styles.calorieText}>420 kcal</Text>
                      </View>
                      <TouchableOpacity activeOpacity={0.7} style={styles.addButton} onPress={() => console.log('[MD] Add: Homestyle Dal Fry Combo')}>
                        <Text style={styles.addButtonText}>ADD</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.menuCardPrice}>₹189</Text>
                </View>
              </View>

              {/* Dietary Preferences */}
              <View style={styles.dietarySection}>
                <Text style={styles.dietaryLabel}>Dietary Preferences</Text>
                <View style={styles.dietaryTags}>
                  <View style={styles.dietaryTagGreen}>
                    <Text style={styles.dietaryTagGreenText}>Gluten-Free Available</Text>
                  </View>
                  <View style={styles.dietaryTagGreen}>
                    <Text style={styles.dietaryTagGreenText}>Vegan Options</Text>
                  </View>
                  <View style={styles.dietaryTagPink}>
                    <Text style={styles.dietaryTagPinkText}>Low Spice</Text>
                  </View>
                </View>
              </View>

              {/* Main Course Banner */}
              <View style={styles.mainCourseSection}>
                <Text style={styles.sectionTitle}>Main Course</Text>

                <View style={styles.mainCourseCard}>
                  <View style={styles.mainCourseImageWrap}>
                    <Image source={{ uri: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80' }} style={styles.mainCourseImage} resizeMode="cover" />
                    <View style={styles.mainCourseVegIndicator}>
                      <Circle size={15} color="#0F6A33" fill="#0F6A33" />
                    </View>
                  </View>

                  <View style={styles.mainCourseBody}>
                    <View style={styles.mainCourseHeader}>
                      <View style={styles.mainCourseHeaderLeft}>
                        <Text style={styles.mainCourseTitle}>Special Lunch Thali</Text>
                        <Text style={styles.mainCourseTime}>11:30 AM - 2:30 PM</Text>
                      </View>
                      <Text style={styles.mainCoursePrice}>₹150</Text>
                    </View>

                    <View style={styles.ingredientGrid}>
                      <View style={styles.ingredientRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ingredientText}>2 Chapati</Text>
                      </View>
                      <View style={styles.ingredientRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ingredientText}>Dal Tadka</Text>
                      </View>
                      <View style={styles.ingredientRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ingredientText}>Mix Veg Sabzi</Text>
                      </View>
                      <View style={styles.ingredientRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ingredientText}>Steam Rice</Text>
                      </View>
                      <View style={styles.ingredientRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ingredientText}>Salad</Text>
                      </View>
                      <View style={styles.ingredientRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ingredientText}>Gulab Jamun</Text>
                      </View>
                    </View>

                    <TouchableOpacity activeOpacity={0.7} style={styles.cartButton} onPress={() => console.log('[MD] Add to Cart: Special Lunch Thali')}>
                      <Text style={styles.cartButtonText}>Add to Cart</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* ========== REVIEWS VIEW ========== */}
          {activeTab === 'reviews' && (
            <View style={styles.reviewsSection}>
              <ReviewCard rating={4.7} userName="Prajwal D." initials="PD" />
              <ReviewCard rating={4.0} userName="Harsh R." initials="HR" />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ========== STICKY ACTION FOOTER ========== */}
      <SafeAreaView style={styles.footer} edges={['bottom']}>
        <View style={styles.footerRow}>
          <TouchableOpacity activeOpacity={0.7} style={styles.addMealButton} onPress={() => console.log('[MD] Add Meal pressed')}>
            <ShoppingCart size={18} color="#1A1A1A" strokeWidth={2} />
            <Text style={styles.addMealButtonText}>Add Meal</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.subscribeButton} onPress={() => console.log('[MD] Subscribe Monthly pressed')}>
            <View style={styles.subscribeStarWrap}>
              <Star size={12} color="white" fill="white" strokeWidth={0} />
            </View>
            <Text style={styles.subscribeButtonText}>Subscribe Monthly</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 40 },

  // Hero
  heroContainer: { height: 360, width: '100%' },
  heroImage: { height: '100%', width: '100%' },
  heroBottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },

  // Top Controls
  topControls: { position: 'absolute', left: 0, right: 0, top: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  topControlsRight: { flexDirection: 'row', gap: 12 },
  iconButton: { height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },

  // Brand Stack
  brandStack: { position: 'absolute', bottom: 24, left: 16, right: 16 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  topRatedBadge: { borderRadius: 999, backgroundColor: '#1E5E3A', paddingHorizontal: 12, paddingVertical: 5 },
  topRatedBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: '#FFFFFF' },
  hygieneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 5 },
  hygieneBadgeText: { fontSize: 11, fontWeight: '700', color: '#333333' },
  messName: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  messTagline: { fontSize: 14, fontWeight: '500', color: '#333333', lineHeight: 20 },

  // Chef Card
  chefCard: { marginTop: -16, marginHorizontal: 16, borderRadius: 16, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  chefRow: { flexDirection: 'row', alignItems: 'center' },
  chefAvatarWrap: { position: 'relative' },
  chefAvatar: { height: 50, width: 50, borderRadius: 25 },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, height: 18, width: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 9, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#0F6A33' },
  chefInfo: { marginLeft: 12, flex: 1 },
  chefName: { fontSize: 13, fontWeight: '500', lineHeight: 16, color: '#6B7280' },
  chefExp: { fontSize: 15, fontWeight: '700', lineHeight: 20, color: '#1A1A1A' },
  chefQuote: { marginTop: 8, fontSize: 13, fontStyle: 'italic', lineHeight: 20, color: '#6B7280' },

  // Tab Bar
  tabBar: { marginHorizontal: 16, marginTop: 24, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabLeft: { marginRight: 32, alignItems: 'center', paddingBottom: 12 },
  tabRight: { alignItems: 'center', paddingBottom: 12 },
  tabTextActive: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  tabTextInactive: { fontSize: 16, fontWeight: '500', color: '#6B7280' },
  tabUnderline: { marginTop: 6, height: 3, width: 28, borderRadius: 999, backgroundColor: '#0F6A33' },

  // Section Title
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },

  // Specials
  specialsSection: { marginHorizontal: 16, marginTop: 24 },

  // Menu Card
  menuCard: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', overflow: 'hidden', marginBottom: 16 },
  menuCardImageWrap: { position: 'relative' },
  menuCardImage: { height: 110, width: 90 },
  vegIndicator: { position: 'absolute', left: 6, top: 6, height: 18, width: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.95)' },
  menuCardBody: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  menuCardTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20, color: '#1A1A1A' },
  menuCardDesc: { marginTop: 2, fontSize: 12, lineHeight: 16, color: '#6B7280' },
  menuCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calorieRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calorieText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  addButton: { borderRadius: 999, backgroundColor: '#0F6A33', paddingHorizontal: 16, paddingVertical: 6 },
  addButtonText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  menuCardPrice: { position: 'absolute', right: 12, top: 10, fontSize: 16, fontWeight: '700', color: '#1A1A1A' },

  // Dietary
  dietarySection: { marginHorizontal: 16, marginTop: 8 },
  dietaryLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, color: '#6B7280', marginBottom: 12 },
  dietaryTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dietaryTagGreen: { borderRadius: 999, backgroundColor: '#E2F2E4', paddingHorizontal: 14, paddingVertical: 8 },
  dietaryTagGreenText: { fontSize: 12, fontWeight: '600', lineHeight: 16, color: '#0F6A33' },
  dietaryTagPink: { borderRadius: 999, backgroundColor: '#FDE8E9', paddingHorizontal: 14, paddingVertical: 8 },
  dietaryTagPinkText: { fontSize: 12, fontWeight: '600', lineHeight: 16, color: '#DC2626' },

  // Main Course
  mainCourseSection: { marginHorizontal: 16, marginTop: 24, marginBottom: 40 },
  mainCourseCard: { borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  mainCourseImageWrap: { position: 'relative' },
  mainCourseImage: { height: 200, width: '100%' },
  mainCourseVegIndicator: { position: 'absolute', left: 10, top: 10, height: 20, width: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.95)' },
  mainCourseBody: { padding: 16 },
  mainCourseHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  mainCourseHeaderLeft: { flex: 1 },
  mainCourseTitle: { fontSize: 18, fontWeight: '700', lineHeight: 24, color: '#1A1A1A' },
  mainCourseTime: { marginTop: 2, fontSize: 13, fontWeight: '500', color: '#6B7280' },
  mainCoursePrice: { fontSize: 18, fontWeight: '700', color: '#0F6A33' },
  ingredientGrid: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap' },
  ingredientRow: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  bullet: { height: 6, width: 6, borderRadius: 3, backgroundColor: '#0F6A33' },
  ingredientText: { fontSize: 13, lineHeight: 20, color: '#1A1A1A' },
  cartButton: { marginTop: 20, width: '100%', borderRadius: 999, backgroundColor: '#0F6A33', paddingVertical: 14 },
  cartButtonText: { textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  // Reviews
  reviewsSection: { marginHorizontal: 16, marginTop: 24, marginBottom: 40 },
  reviewCard: { marginBottom: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingBottom: 20, paddingTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  reviewMetricsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewRatingNumber: { fontSize: 32, fontWeight: '700', color: '#1A1A1A', marginRight: 12, lineHeight: 36 },
  reviewCount: { marginTop: 2, fontSize: 11, fontWeight: '500', color: '#6B7280' },
  sentimentLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: '#F97316', marginBottom: 10 },
  sentimentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  sentimentChip: { borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 6 },
  sentimentChipText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
  reviewUserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FCECE3', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 12, fontWeight: '700', color: '#8B4513' },
  reviewUserName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginLeft: 10 },
  reviewText: { fontSize: 13, lineHeight: 20, color: '#333333' },

  // Stars
  starsRow: { flexDirection: 'row', gap: 2 },
  starHalfWrap: { position: 'relative' },
  starHalfFill: { position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: '60%' },

  // Footer
  footer: { borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 8, paddingTop: 12 },
  footerRow: { flexDirection: 'row', gap: 12 },
  addMealButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, backgroundColor: '#EFECE6', paddingVertical: 14 },
  addMealButtonText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  subscribeButton: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, backgroundColor: '#F97316', paddingVertical: 14, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  subscribeStarWrap: { height: 18, width: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.25)' },
  subscribeButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
