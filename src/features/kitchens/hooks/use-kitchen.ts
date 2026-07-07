import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase/client';

export function useKitchen(kitchenId: string) {
  return useQuery({
    queryKey: ['kitchen', kitchenId],
    queryFn: async () => {
      const [kitchenRes, mealBoxesRes, plansRes, reviewsRes] = await Promise.all([
        supabase.from('kitchens').select('*').eq('id', kitchenId).single(),
        supabase.from('meal_boxes').select('*, meal_box_items(*, dishes(*))').eq('kitchen_id', kitchenId).eq('is_active', true),
        supabase.from('subscription_plans').select('*').eq('kitchen_id', kitchenId).eq('is_active', true),
        supabase.from('reviews').select('*, users(full_name)').eq('kitchen_id', kitchenId).order('created_at', { ascending: false }),
      ]);

      if (kitchenRes.error) throw kitchenRes.error;
      if (mealBoxesRes.error) throw mealBoxesRes.error;
      if (plansRes.error) throw plansRes.error;
      if (reviewsRes.error) throw reviewsRes.error;

      return {
        kitchen: kitchenRes.data,
        mealBoxes: mealBoxesRes.data,
        plans: plansRes.data,
        reviews: reviewsRes.data,
      };
    },
    enabled: !!kitchenId,
  });
}
