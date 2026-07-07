import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase/client';

export interface HomeFeedData {
  categories: Array<{ name: string; image: string }>;
  limited_offers: Array<{
    id: string;
    kitchen_id: string;
    kitchen_name: string;
    title: string;
    discount_type: string;
    discount_value: number;
    image: string;
  }>;
  popular_kitchens: Array<{
    id: string;
    name: string;
    cuisine: string;
    rating: number;
    image: string;
    cover: string;
    delivery_charge: number;
    minimum_order: number;
    estimated_time: number;
  }>;
  recommended_kitchens: Array<{
    id: string;
    name: string;
    cuisine: string;
    rating: number;
    image: string;
    cover: string;
    estimated_time: number;
    distance_miles: number;
  }>;
}

export function useHomeFeed(latitude: number, longitude: number, pincode: string) {
  return useQuery<HomeFeedData>({
    queryKey: ['homeFeed', latitude, longitude, pincode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_home_feed', {
        p_latitude: latitude,
        p_longitude: longitude,
        p_pincode: pincode,
      });
      if (error) throw error;
      return data as HomeFeedData;
    },
    enabled: !!pincode,
  });
}
