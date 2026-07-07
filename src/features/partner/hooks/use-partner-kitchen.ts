import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase/client';

export function usePartnerKitchen() {
  const queryClient = useQueryClient();

  // 1. Fetch kitchen owned by the logged-in user
  const kitchenQuery = useQuery({
    queryKey: ['partnerKitchen'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('AUTH_REQUIRED');

      const { data, error } = await supabase
        .from('kitchens')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const kitchenId = kitchenQuery.data?.id;

  // 2. Fetch pending orders for this kitchen
  const ordersQuery = useQuery({
    queryKey: ['partnerOrders', kitchenId],
    queryFn: async () => {
      if (!kitchenId) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*, user_addresses(*), users(full_name)')
        .eq('kitchen_id', kitchenId)
        .in('order_status', ['placed', 'accepted', 'preparing', 'ready_for_pickup'])
        .order('placed_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!kitchenId,
  });

  // 3. Fetch dishes of this kitchen
  const dishesQuery = useQuery({
    queryKey: ['partnerDishes', kitchenId],
    queryFn: async () => {
      if (!kitchenId) return [];
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('kitchen_id', kitchenId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!kitchenId,
  });

  // 4. Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, reason }: { orderId: string; status: string; reason?: string }) => {
      // In migrations, we programmed order state validation in order lifecycle functions/triggers,
      // or we can update directly.
      const { data, error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Add to history log
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        old_status: null, // trigger handles it or we pass
        new_status: status,
        reason: reason || 'Merchant status transition',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerOrders', kitchenId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // 5. Toggle dish availability mutation
  const toggleDishMutation = useMutation({
    mutationFn: async ({ dishId, isActive }: { dishId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('dishes')
        .update({ is_active: isActive })
        .eq('id', dishId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerDishes', kitchenId] });
    },
  });

  return {
    kitchen: kitchenQuery.data,
    isLoadingKitchen: kitchenQuery.isLoading,
    orders: ordersQuery.data || [],
    isLoadingOrders: ordersQuery.isLoading,
    dishes: dishesQuery.data || [],
    isLoadingDishes: dishesQuery.isLoading,
    updateOrderStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    toggleDish: toggleDishMutation.mutateAsync,
  };
}
