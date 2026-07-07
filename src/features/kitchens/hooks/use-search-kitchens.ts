import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase/client';

export interface SearchKitchenData {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  image: string;
  cover: string;
  delivery_charge: number;
  estimated_time: number;
}

export interface SearchFilters {
  veg_only?: boolean;
  jain_only?: boolean;
  max_delivery_charge?: number;
}

export function useSearchKitchens(query: string, pincode: string, filters: SearchFilters = {}) {
  return useQuery<SearchKitchenData[]>({
    queryKey: ['searchKitchens', query, pincode, filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_kitchens', {
        p_query: query,
        p_pincode: pincode,
        p_filters: filters,
      });
      if (error) throw error;
      return data as SearchKitchenData[];
    },
    enabled: !!pincode,
  });
}
