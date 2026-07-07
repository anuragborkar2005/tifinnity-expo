import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useProfile } from '@/src/features/profile/hooks/use-profile';
import HomeFeedScreen from '@/src/features/home/screens/home-feed';
import PartnerDashboardScreen from '@/src/features/partner/screens/partner-dashboard';
import DeliveryDashboardScreen from '@/src/features/delivery/screens/delivery-dashboard';

export default function TabIndexWrapper() {
  const { data: profile, isLoading, error } = useProfile();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#065F46" />
      </View>
    );
  }

  // Fallback to diner view if error or no profile loaded
  if (error || !profile) {
    return <HomeFeedScreen />;
  }

  if (profile.role === 'partner') {
    return <PartnerDashboardScreen />;
  }

  if (profile.role === 'delivery_partner') {
    return <DeliveryDashboardScreen />;
  }

  return <HomeFeedScreen />;
}
