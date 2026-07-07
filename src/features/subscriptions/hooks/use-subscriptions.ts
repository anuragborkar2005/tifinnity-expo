import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase/client';

export interface SubscriptionPlan {
  id: string;
  kitchen_id: string;
  name: string;
  description?: string;
  duration_days: number;
  meals_per_day: number;
  discount_type?: string;
  discount_value: number;
  price: number;
  is_active: boolean;
  created_at: string;
  kitchens?: {
    name: string;
    logo_url?: string;
  };
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  address_id: string;
  start_date: string;
  end_date: string;
  status: 'pending_payment' | 'active' | 'paused' | 'cancelled' | 'expired' | 'completed';
  total_amount: number;
  created_at: string;
  subscription_plans?: SubscriptionPlan;
}

export interface SubscriptionDelivery {
  id: string;
  subscription_id: string;
  meal_box_id: string;
  delivery_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  delivered_price: number;
  status: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'skipped' | 'failed';
  delivered_at?: string;
  meal_boxes?: {
    name: string;
    image_url?: string;
  };
}

export function useSubscriptions() {
  return useQuery<UserSubscription[]>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*, kitchens(name, logo_url))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as UserSubscription[];
    },
  });
}

export function useSubscription(subId: string) {
  return useQuery<{
    subscription: UserSubscription;
    deliveries: SubscriptionDelivery[];
    skips: Array<{ id: string; skip_date: string; reason?: string }>;
    history: Array<{ id: string; old_status?: string; new_status: string; reason?: string; created_at: string }>;
  }>({
    queryKey: ['subscription', subId],
    queryFn: async () => {
      const [subRes, deliveriesRes, skipsRes, historyRes] = await Promise.all([
        supabase.from('user_subscriptions').select('*, subscription_plans(*, kitchens(*)), user_addresses(*)').eq('id', subId).single(),
        supabase.from('subscription_deliveries').select('*, meal_boxes(name, image_url)').eq('subscription_id', subId).order('delivery_date', { ascending: true }),
        supabase.from('subscription_skip_days').select('*').eq('subscription_id', subId).order('skip_date', { ascending: true }),
        supabase.from('subscription_status_history').select('*').eq('subscription_id', subId).order('created_at', { ascending: true }),
      ]);

      if (subRes.error) throw subRes.error;
      if (deliveriesRes.error) throw deliveriesRes.error;

      return {
        subscription: subRes.data as UserSubscription,
        deliveries: (deliveriesRes.data || []) as SubscriptionDelivery[],
        skips: skipsRes.data || [],
        history: historyRes.data || [],
      };
    },
    enabled: !!subId,
  });
}

export function useSkipDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { subscription_id: string; skip_date: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('skip_subscription_day', {
        p_subscription_id: parseInt(params.subscription_id),
        p_skip_date: params.skip_date,
        p_reason: params.reason || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.subscription_id] });
    },
  });
}

export function usePauseSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { subscription_id: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('pause_subscription', {
        p_subscription_id: parseInt(params.subscription_id),
        p_reason: params.reason || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.subscription_id] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useResumeSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { subscription_id: string }) => {
      const { data, error } = await supabase.rpc('resume_subscription', {
        p_subscription_id: parseInt(params.subscription_id),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.subscription_id] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { subscription_id: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('cancel_subscription', {
        p_subscription_id: parseInt(params.subscription_id),
        p_reason: params.reason || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.subscription_id] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] }); // wallet balance updates
    },
  });
}
